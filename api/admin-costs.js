// Powers the "Costs" tab on /admin.html — real spend data aggregated
// from ai_request_log (every AI call logs its actual cost from the
// real API response, not an estimate). Protected by ADMIN_PASSWORD,
// same as every other admin endpoint.

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
    // Pull the last 60 days — plenty for a beta-stage app, and keeps
    // this endpoint from having to fight PostgREST's aggregation
    // syntax by just summing in JS instead.
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
    const logRes = await fetch(
      `${supabaseUrl}/rest/v1/ai_request_log?select=user_id,cost_usd,created_at&created_at=gte.${sixtyDaysAgo}&order=created_at.desc`,
      { headers: baseHeaders }
    );
    const logs = await logRes.json();
    if (!Array.isArray(logs)) {
      return res.status(400).json({ ok: false, error: 'Could not load cost data.' });
    }

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const monthStr = now.toISOString().slice(0, 7);

    let totalAllTime = 0, totalToday = 0, totalThisMonth = 0;
    const byDay = {};
    const byUser = {};

    for (const row of logs) {
      const cost = row.cost_usd || 0;
      const dateStr = (row.created_at || '').slice(0, 10);
      const monthOfRow = (row.created_at || '').slice(0, 7);

      totalAllTime += cost;
      if (dateStr === todayStr) totalToday += cost;
      if (monthOfRow === monthStr) totalThisMonth += cost;

      byDay[dateStr] = (byDay[dateStr] || 0) + cost;
      if (row.user_id) byUser[row.user_id] = (byUser[row.user_id] || 0) + cost;
    }

    // Last 14 days as a simple trend, oldest first
    const dayTrend = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      dayTrend.push({ date: d, cost: byDay[d] || 0 });
    }

    // Top 10 users by cost, with email lookup
    const topUserIds = Object.entries(byUser).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const topUsers = [];
    for (const [userId, cost] of topUserIds) {
      let email = 'Unknown';
      try {
        const userRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, { headers: baseHeaders });
        if (userRes.ok) {
          const userData = await userRes.json();
          email = userData.email || 'Unknown';
        }
      } catch (e) { /* leave as Unknown */ }
      topUsers.push({ userId, email, cost });
    }

    return res.status(200).json({
      ok: true,
      totalAllTime,
      totalToday,
      totalThisMonth,
      dayTrend,
      topUsers,
      note: '60-day window — real, measured cost from actual API responses, not an estimate.',
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
};
