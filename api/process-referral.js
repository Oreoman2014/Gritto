// Handles referral sign-ups: when someone signs up using a friend's
// referral link, this verifies who's actually calling (via their own
// Supabase session token, so nobody can fake a referral for someone
// else's account), then grants a bonus theme to both the referrer and
// the new person — using the service role since granting something to
// the REFERRER (a different user than the one calling) isn't something
// a normal client-side request is allowed to do.

const REWARD_THEME = 'ocean';

module.exports = async function handler(req, res) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ ok: false, error: 'Referral system is not fully set up yet.' });
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { referral_code, access_token } = req.body || {};
  if (!referral_code || !access_token) {
    return res.status(400).json({ ok: false, error: 'referral_code and access_token are required.' });
  }

  const baseHeaders = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  };

  try {
    // Verify who's actually calling using THEIR OWN token — this is
    // what prevents someone from crediting a referral to an account
    // that isn't theirs.
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${access_token}` },
    });
    if (!userRes.ok) {
      return res.status(401).json({ ok: false, error: 'Invalid session — please sign in again.' });
    }
    const userData = await userRes.json();
    const newUserId = userData.id;

    // Find who owns this referral code
    const referrerRes = await fetch(
      `${supabaseUrl}/rest/v1/user_profile?referral_code=eq.${encodeURIComponent(referral_code)}&select=user_id,granted_themes`,
      { headers: baseHeaders }
    );
    const referrerRows = await referrerRes.json();
    if (!Array.isArray(referrerRows) || referrerRows.length === 0) {
      return res.status(404).json({ ok: false, error: "That referral code wasn't found." });
    }
    const referrer = referrerRows[0];

    if (referrer.user_id === newUserId) {
      return res.status(400).json({ ok: false, error: "You can't refer yourself." });
    }

    // Make sure this account hasn't already used a referral before
    const existingRes = await fetch(
      `${supabaseUrl}/rest/v1/referrals?referred_id=eq.${newUserId}&select=id`,
      { headers: baseHeaders }
    );
    const existingRows = await existingRes.json();
    if (Array.isArray(existingRows) && existingRows.length > 0) {
      return res.status(400).json({ ok: false, error: 'This account has already used a referral.' });
    }

    // Record the referral
    const insertRes = await fetch(`${supabaseUrl}/rest/v1/referrals`, {
      method: 'POST',
      headers: baseHeaders,
      body: JSON.stringify({ referrer_id: referrer.user_id, referred_id: newUserId }),
    });
    if (!insertRes.ok) {
      const errText = await insertRes.text();
      return res.status(400).json({ ok: false, error: errText });
    }

    // Grant the reward theme to both people, without clobbering any
    // themes they've already been granted separately.
    async function grantTheme(userId, existingGranted) {
      const current = existingGranted || [];
      if (current.includes(REWARD_THEME)) return; // already has it, nothing to do
      await fetch(`${supabaseUrl}/rest/v1/user_profile?user_id=eq.${userId}`, {
        method: 'PATCH',
        headers: baseHeaders,
        body: JSON.stringify({ granted_themes: [...current, REWARD_THEME] }),
      });
    }

    const newUserRes = await fetch(
      `${supabaseUrl}/rest/v1/user_profile?user_id=eq.${newUserId}&select=granted_themes`,
      { headers: baseHeaders }
    );
    const newUserRows = await newUserRes.json();
    const newUserGranted = (Array.isArray(newUserRows) && newUserRows[0]) ? newUserRows[0].granted_themes : [];

    await grantTheme(referrer.user_id, referrer.granted_themes);
    await grantTheme(newUserId, newUserGranted);

    return res.status(200).json({ ok: true, rewardTheme: REWARD_THEME });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
};
