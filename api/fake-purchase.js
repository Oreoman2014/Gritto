// TEST-MODE PURCHASE SIMULATOR — grants real entitlements instantly,
// with no real payment involved. This exists so the full purchase
// experience can be tested end-to-end before a real payment provider
// (Stripe/Apple/Google IAP) is connected.
//
// IMPORTANT: this must be removed or gated before real users could
// ever reach it expecting to actually pay — right now, anyone who
// calls this gets Premium for free, on purpose, because that's the
// whole point of a test-mode simulator. It verifies WHO is asking
// (a real login), but never verifies any actual payment, because
// there isn't one.

module.exports = async function handler(req, res) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ ok: false, error: 'Not fully set up yet.' });
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { access_token, purchase_type, plan_key, pack_units } = req.body || {};
  if (!access_token) {
    return res.status(400).json({ ok: false, error: 'access_token is required.' });
  }
  if (purchase_type !== 'plan' && purchase_type !== 'topup') {
    return res.status(400).json({ ok: false, error: 'purchase_type must be "plan" or "topup".' });
  }

  const baseHeaders = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  };

  try {
    // Verify who's actually calling using THEIR OWN token — this is
    // the one real check here, since there's no payment to verify.
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${access_token}` },
    });
    if (!userRes.ok) {
      return res.status(401).json({ ok: false, error: 'Invalid session — please sign in again.' });
    }
    const userData = await userRes.json();
    const userId = userData.id;

    if (purchase_type === 'topup') {
      if (!pack_units || pack_units <= 0) {
        return res.status(400).json({ ok: false, error: 'pack_units is required and must be positive.' });
      }
      const profileRes = await fetch(
        `${supabaseUrl}/rest/v1/user_profile?user_id=eq.${userId}&select=bonus_checks_granted`,
        { headers: baseHeaders }
      );
      const profileRows = await profileRes.json();
      const current = (Array.isArray(profileRows) && profileRows[0]) ? (profileRows[0].bonus_checks_granted || 0) : 0;

      const updateRes = await fetch(`${supabaseUrl}/rest/v1/user_profile?user_id=eq.${userId}`, {
        method: 'PATCH', headers: baseHeaders,
        body: JSON.stringify({ bonus_checks_granted: current + pack_units }),
      });
      if (!updateRes.ok) {
        return res.status(400).json({ ok: false, error: 'Could not grant the top-up.' });
      }
      return res.status(200).json({ ok: true, granted: pack_units });
    }

    // purchase_type === 'plan'
    const validPlans = ['starter', 'pro', 'studio', 'premium', 'premium_annual'];
    if (!validPlans.includes(plan_key)) {
      return res.status(400).json({ ok: false, error: `Unknown plan_key: ${plan_key}` });
    }

    const profileRes = await fetch(
      `${supabaseUrl}/rest/v1/user_profile?user_id=eq.${userId}&select=premium_tier`,
      { headers: baseHeaders }
    );
    const profileRows = await profileRes.json();
    const currentTier = (Array.isArray(profileRows) && profileRows[0]) ? profileRows[0].premium_tier : null;

    // Premium monthly and annual are really the same underlying tier
    // for entitlement purposes (both grant the same unlimited-style
    // access) — store whichever was actually purchased for display,
    // but don't treat switching between them as a "new" tier that
    // should reset the one-time bonus pool.
    const normalizedCurrent = (currentTier === 'premium' || currentTier === 'premium_annual') ? 'premium' : currentTier;
    const normalizedNew = (plan_key === 'premium' || plan_key === 'premium_annual') ? 'premium' : plan_key;

    const updates = { premium_tier: plan_key, purchase_source: 'test_purchase' };
    if (normalizedNew !== normalizedCurrent) {
      // Genuinely a different tier — reset the one-time bonus pool to
      // match, same rule the admin panel uses for a real tier change.
      const bonusForTier = { starter: 10, pro: 50, studio: 0, premium: 0 };
      updates.bonus_checks_granted = bonusForTier[normalizedNew] ?? 0;
      updates.bonus_checks_used = 0;
    }

    const updateRes = await fetch(`${supabaseUrl}/rest/v1/user_profile?user_id=eq.${userId}`, {
      method: 'PATCH', headers: baseHeaders, body: JSON.stringify(updates),
    });
    if (!updateRes.ok) {
      return res.status(400).json({ ok: false, error: 'Could not grant the plan.' });
    }

    return res.status(200).json({ ok: true, plan: plan_key });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
};
