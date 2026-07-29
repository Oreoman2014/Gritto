// Powers the "Feedback" tab on /admin.html — lists every bug report or
// feedback message sent through the app, along with who sent it.
// Protected by ADMIN_PASSWORD (set in Vercel env vars), same as the
// beta user manager.

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
        `${supabaseUrl}/rest/v1/feedback_reports?select=id,user_id,message,created_at&order=created_at.desc`,
        { headers: baseHeaders }
      );
      const reports = await response.json();
      if (!Array.isArray(reports)) {
        return res.status(400).json({ ok: false, error: 'Could not load feedback.' });
      }

      // Look up each sender's email so the list is actually readable,
      // not just a wall of user IDs.
      const emailCache = {};
      for (const r of reports) {
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

      const withEmails = reports.map(r => ({ ...r, email: emailCache[r.user_id] || 'Unknown' }));
      return res.status(200).json({ ok: true, reports: withEmails });
    }

    if (req.method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ ok: false, error: 'Report id is required.' });
      const response = await fetch(
        `${supabaseUrl}/rest/v1/feedback_reports?id=eq.${encodeURIComponent(id)}`,
        { method: 'DELETE', headers: baseHeaders }
      );
      if (!response.ok) {
        const errText = await response.text();
        return res.status(400).json({ ok: false, error: errText });
      }
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
};
