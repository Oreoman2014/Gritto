// Runs once a day (triggered by vercel.json's cron schedule). Finds
// everyone who has at least one saved routine they haven't completed
// today, and sends them a gentle push reminder.

const webpush = require('web-push');

module.exports = async function handler(req, res) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const vapidPublic = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;

  if (!supabaseUrl || !serviceKey || !vapidPublic || !vapidPrivate) {
    return res.status(500).json({ ok: false, error: 'Push notifications are not fully set up yet.' });
  }

  webpush.setVapidDetails('mailto:no-reply@gritto.app', vapidPublic, vapidPrivate);

  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  };

  try {
    const today = new Date().toISOString().slice(0, 10);

    // Every saved routine, so we can tell who still needs to do theirs today
    const routinesRes = await fetch(`${supabaseUrl}/rest/v1/user_routine?select=user_id,sport,last_completed_date`, { headers });
    const routines = await routinesRes.json();

    const needsReminder = new Set();
    routines.forEach((r) => {
      if (r.last_completed_date !== today) needsReminder.add(r.user_id);
    });

    if (needsReminder.size === 0) {
      return res.status(200).json({ ok: true, sent: 0, note: 'Everyone is already done for today.' });
    }

    // Every device subscribed to reminders
    const subsRes = await fetch(`${supabaseUrl}/rest/v1/push_subscriptions?select=*`, { headers });
    const subscriptions = await subsRes.json();

    let sent = 0;
    let removed = 0;

    for (const sub of subscriptions) {
      if (!needsReminder.has(sub.user_id)) continue;

      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth_key },
      };
      const payload = JSON.stringify({
        title: 'Gritto',
        body: "You haven't done today's routine yet — quick, keep your streak alive!",
      });

      try {
        await webpush.sendNotification(pushSubscription, payload);
        sent++;
      } catch (err) {
        // 404/410 means that subscription is dead (uninstalled, expired, etc.) — clean it up
        if (err.statusCode === 404 || err.statusCode === 410) {
          await fetch(`${supabaseUrl}/rest/v1/push_subscriptions?id=eq.${sub.id}`, {
            method: 'DELETE',
            headers,
          });
          removed++;
        }
      }
    }

    return res.status(200).json({ ok: true, sent, removed });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
};
