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

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const baseHeaders = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  };

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
