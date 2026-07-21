// Saves a push subscription so we know where to send reminders later.
// Uses the secret service_role key since this needs to write on behalf
// of whichever user is subscribing.

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ ok: false, error: 'Server is not fully set up yet.' });
  }

  const { user_id, subscription } = req.body || {};
  if (!user_id || !subscription || !subscription.endpoint) {
    return res.status(400).json({ ok: false, error: 'Missing subscription info.' });
  }

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/push_subscriptions`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        user_id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth_key: subscription.keys.auth,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(400).json({ ok: false, error: errText });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
};
