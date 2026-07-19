// After someone signs in with Google, the app calls this to check if
// their email is on your approved list. Uses the SECRET service_role key
// (never visible to visitors) since the allowed_users table is locked down.

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ allowed: false, error: 'Method not allowed' });
  }

  const { email } = req.body || {};
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!email || !supabaseUrl || !serviceKey) {
    return res.status(500).json({ allowed: false, error: 'Access check is not set up yet.' });
  }

  try {
    const url = `${supabaseUrl}/rest/v1/allowed_users?email=eq.${encodeURIComponent(email.toLowerCase())}&select=email`;
    const response = await fetch(url, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    });
    const data = await response.json();
    return res.status(200).json({ allowed: Array.isArray(data) && data.length > 0 });
  } catch (err) {
    return res.status(500).json({ allowed: false, error: String(err) });
  }
};