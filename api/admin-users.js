// Powers the /admin.html page — list, add, and remove approved beta users.
// Protected by ADMIN_PASSWORD (set in Vercel env vars), sent as a header
// from the admin page after you type it in.

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
        `${supabaseUrl}/rest/v1/allowed_users?select=email,added_at,notes&order=added_at.desc`,
        { headers: baseHeaders }
      );
      const data = await response.json();
      return res.status(200).json({ ok: true, users: data });
    }

    if (req.method === 'POST') {
      const { email, notes } = req.body || {};
      if (!email) return res.status(400).json({ ok: false, error: 'Email is required.' });
      const response = await fetch(`${supabaseUrl}/rest/v1/allowed_users`, {
        method: 'POST',
        headers: { ...baseHeaders, Prefer: 'return=representation' },
        body: JSON.stringify({ email: email.toLowerCase(), notes: notes || null }),
      });
      if (!response.ok) {
        const errText = await response.text();
        return res.status(400).json({ ok: false, error: errText });
      }
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const { email } = req.body || {};
      if (!email) return res.status(400).json({ ok: false, error: 'Email is required.' });
      const response = await fetch(
        `${supabaseUrl}/rest/v1/allowed_users?email=eq.${encodeURIComponent(email.toLowerCase())}`,
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