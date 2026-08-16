// Powers the "Top-ups" tab on /admin.html — lists every video-check
// top-up request made from inside the app, along with who requested
// it. Protected by ADMIN_PASSWORD, same as the other admin endpoints.

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

  try {
    if (req.method === 'GET') {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/topup_requests?select=id,user_id,pack_size,pack_price,status,created_at&order=created_at.desc`,
        { headers: baseHeaders }
      );
      const requests = await response.json();
      if (!Array.isArray(requests)) {
        return res.status(400).json({ ok: false, error: 'Could not load top-up requests.' });
      }

      const emailCache = {};
      for (const r of requests) {
        if (!r.user_id || emailCache[r.user_id]) continue;
        try {
          const userRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${r.user_id}`, { headers: baseHeaders });
          if (userRes.ok) {
            const userData = await userRes.json();
            emailCache[r.user_id] = userData.email || 'Unknown';
          } else {
            emailCache[r.user_id] = 'Unknown';
          }
        } catch (e) {
          emailCache[r.user_id] = 'Unknown';
        }
      }

      const withEmails = requests.map(r => ({ ...r, email: emailCache[r.user_id] || 'Unknown' }));
      return res.status(200).json({ ok: true, requests: withEmails });
    }

    // Grant a request: adds the pack size to the user's bonus pool
    // (same additive behavior as the admin panel's manual top-up
    // buttons) and marks the request as granted.
    if (req.method === 'PATCH') {
      const { request_id, user_id, pack_size } = req.body || {};
      if (!request_id || !user_id || !pack_size) {
        return res.status(400).json({ ok: false, error: 'request_id, user_id, and pack_size are required.' });
      }

      const profileRes = await fetch(
        `${supabaseUrl}/rest/v1/user_profile?user_id=eq.${user_id}&select=bonus_checks_granted`,
        { headers: baseHeaders }
      );
      const profileRows = await profileRes.json();
      const currentGranted = (Array.isArray(profileRows) && profileRows[0]) ? (profileRows[0].bonus_checks_granted || 0) : 0;

      const updateRes = await fetch(`${supabaseUrl}/rest/v1/user_profile?user_id=eq.${user_id}`, {
        method: 'PATCH',
        headers: baseHeaders,
        body: JSON.stringify({ bonus_checks_granted: currentGranted + pack_size }),
      });
      if (!updateRes.ok) {
        return res.status(400).json({ ok: false, error: 'Could not update the user\'s check pool.' });
      }

      const statusRes = await fetch(`${supabaseUrl}/rest/v1/topup_requests?id=eq.${request_id}`, {
        method: 'PATCH',
        headers: baseHeaders,
        body: JSON.stringify({ status: 'granted' }),
      });
      if (!statusRes.ok) {
        return res.status(400).json({ ok: false, error: 'Checks were added, but could not mark the request as granted.' });
      }

      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
};
