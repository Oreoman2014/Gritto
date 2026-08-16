// Powers the "Profiles" tab on /admin.html — lists onboarding data for
// every user (sport, goal, position, injury history, etc). Protected
// by ADMIN_PASSWORD, same as the other admin tabs.

module.exports = async function handler(req, res) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!supabaseUrl || !serviceKey || !adminPassword) {
    return res.status(500).json({ ok: false, error: 'Admin panel is not fully set up yet.' });
  }

  const suppliedPassword = req.headers['x-admin-password'];
  if (suppliedPassword !== adminPassword) {
    return res.status(401).json({ ok: false, error: 'Wrong admin password.' });
  }

  const baseHeaders = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  };

  if (req.method === 'PATCH') {
    const { user_id, updates } = req.body || {};
    if (!user_id || !updates || typeof updates !== 'object') {
      return res.status(400).json({ ok: false, error: 'user_id and updates are required.' });
    }
    // Only allow editing real, known onboarding fields — never let a
    // request overwrite something like share_token or the user_id itself.
    const editableFields = new Set([
      'favorite_sport', 'main_goal', 'experience_level', 'coach_personality',
      'age_range', 'positions', 'equipment_access', 'team_or_solo',
      'biggest_challenge', 'has_prior_injury', 'injury_areas', 'upcoming_goal',
      'onboarding_completed', 'granted_themes', 'granted_badges',
      'premium_tier', 'bonus_checks_granted', 'bonus_checks_used',
    ]);
    const safeUpdates = {};
    for (const key of Object.keys(updates)) {
      if (editableFields.has(key)) safeUpdates[key] = updates[key];
    }
    if (Object.keys(safeUpdates).length === 0) {
      return res.status(400).json({ ok: false, error: 'No editable fields were provided.' });
    }

    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/user_profile?user_id=eq.${encodeURIComponent(user_id)}`,
        { method: 'PATCH', headers: baseHeaders, body: JSON.stringify(safeUpdates) }
      );
      if (!response.ok) {
        const errText = await response.text();
        return res.status(400).json({ ok: false, error: errText });
      }
      return res.status(200).json({ ok: true });
    } catch (err) {
      return res.status(500).json({ ok: false, error: String(err) });
    }
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/user_profile?select=*&order=user_id`,
      { headers: baseHeaders }
    );
    const profiles = await response.json();
    if (!Array.isArray(profiles)) {
      return res.status(400).json({ ok: false, error: 'Could not load profiles.' });
    }

    // Look up each person's email, same as the feedback tab does.
    const emailCache = {};
    for (const p of profiles) {
      if (!p.user_id || emailCache[p.user_id]) continue;
      try {
        const userRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${p.user_id}`, { headers: baseHeaders });
        if (userRes.ok) {
          const userData = await userRes.json();
          emailCache[p.user_id] = userData.email || 'Unknown';
        } else {
          emailCache[p.user_id] = 'Unknown';
        }
      } catch (e) {
        emailCache[p.user_id] = 'Unknown';
      }
    }

    const withEmails = profiles.map(p => ({ ...p, email: emailCache[p.user_id] || 'Unknown' }));
    return res.status(200).json({ ok: true, profiles: withEmails });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
};
