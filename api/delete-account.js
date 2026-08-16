// Permanently deletes a user's account and all their data. Every table
// in this app already has "on delete cascade" set up against
// auth.users(id), so deleting the auth user here is enough — Supabase
// automatically removes their profile, progress, drill history, video
// history, saved drills, referrals, and feedback reports too.
//
// Requires the calling user's OWN access token (not a password or
// user_id passed in directly) so nobody can delete someone else's
// account — this verifies identity server-side the same way
// process-referral.js does.

module.exports = async function handler(req, res) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ ok: false, error: 'Account deletion is not fully set up yet.' });
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { access_token } = req.body || {};
  if (!access_token) {
    return res.status(400).json({ ok: false, error: 'access_token is required.' });
  }

  try {
    // Verify who's actually calling using THEIR OWN token — this is
    // what prevents someone from deleting an account that isn't theirs.
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${access_token}` },
    });
    if (!userRes.ok) {
      return res.status(401).json({ ok: false, error: 'Invalid session — please sign in again.' });
    }
    const userData = await userRes.json();
    const userId = userData.id;

    // Delete the auth user via the Admin API. Cascading foreign keys
    // handle removing every other row tied to this account.
    const deleteRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      method: 'DELETE',
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    });
    if (!deleteRes.ok) {
      const errText = await deleteRes.text();
      return res.status(400).json({ ok: false, error: errText });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
};
