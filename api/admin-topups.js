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

    // Three possible actions, all via PATCH:
    //   'grant'   — adds the pack size to the user's bonus pool, status -> granted
    //   'decline' — no check pool change, status -> declined
    //   'undo'    — reverses whichever of the above happened: if it was
    //               granted, subtracts the checks back out; if it was
    //               declined, just reopens it. Reads the CURRENT status
    //               from the database rather than trusting the client,
    //               so undo always does the right thing regardless of
    //               what the admin panel currently has on screen.
    if (req.method === 'PATCH') {
      const { request_id, user_id, pack_size, action } = req.body || {};
      if (!request_id || !user_id || !pack_size || !action) {
        return res.status(400).json({ ok: false, error: 'request_id, user_id, pack_size, and action are required.' });
      }

      async function adjustBonusPool(delta) {
        const profileRes = await fetch(
          `${supabaseUrl}/rest/v1/user_profile?user_id=eq.${user_id}&select=bonus_checks_granted`,
          { headers: baseHeaders }
        );
        const profileRows = await profileRes.json();
        const current = (Array.isArray(profileRows) && profileRows[0]) ? (profileRows[0].bonus_checks_granted || 0) : 0;
        const newTotal = Math.max(0, current + delta); // never let it go negative
        const updateRes = await fetch(`${supabaseUrl}/rest/v1/user_profile?user_id=eq.${user_id}`, {
          method: 'PATCH',
          headers: baseHeaders,
          body: JSON.stringify({ bonus_checks_granted: newTotal }),
        });
        return updateRes.ok;
      }

      async function setRequestStatus(status) {
        const statusRes = await fetch(`${supabaseUrl}/rest/v1/topup_requests?id=eq.${request_id}`, {
          method: 'PATCH',
          headers: baseHeaders,
          body: JSON.stringify({ status }),
        });
        return statusRes.ok;
      }

      if (action === 'grant') {
        if (!(await adjustBonusPool(pack_size))) {
          return res.status(400).json({ ok: false, error: "Could not update the user's check pool." });
        }
        if (!(await setRequestStatus('granted'))) {
          return res.status(400).json({ ok: false, error: 'Checks were added, but could not mark the request as granted.' });
        }
        return res.status(200).json({ ok: true });
      }

      if (action === 'decline') {
        if (!(await setRequestStatus('declined'))) {
          return res.status(400).json({ ok: false, error: 'Could not decline this request.' });
        }
        return res.status(200).json({ ok: true });
      }

      if (action === 'undo') {
        // Look up the CURRENT status fresh — never trust the client's
        // idea of what it was, since that's exactly the kind of drift
        // that causes an undo to do the wrong thing.
        const currentRes = await fetch(
          `${supabaseUrl}/rest/v1/topup_requests?id=eq.${request_id}&select=status`,
          { headers: baseHeaders }
        );
        const currentRows = await currentRes.json();
        const currentStatus = (Array.isArray(currentRows) && currentRows[0]) ? currentRows[0].status : null;

        if (currentStatus === 'granted') {
          if (!(await adjustBonusPool(-pack_size))) {
            return res.status(400).json({ ok: false, error: "Could not remove the checks from the user's pool." });
          }
        }
        // Whether it was granted or declined, undo returns it to pending
        // so it can be acted on again.
        if (!(await setRequestStatus('pending'))) {
          return res.status(400).json({ ok: false, error: 'Could not undo this request.' });
        }
        return res.status(200).json({ ok: true });
      }

      return res.status(400).json({ ok: false, error: `Unknown action: ${action}` });
    }

    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
};
