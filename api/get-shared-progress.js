// Public endpoint — no login required. A parent or coach opens a link
// containing a share token; this looks up which athlete it belongs to
// (using the secret service_role key, since there's no logged-in user
// here) and returns a small, curated snapshot of their progress.
// Deliberately does NOT return email, video thumbnails, or anything
// beyond what's needed for a simple progress summary.

module.exports = async function handler(req, res) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ ok: false, error: 'Server is not fully set up yet.' });
  }

  const token = req.query.token;
  if (!token) {
    return res.status(400).json({ ok: false, error: 'Missing share token.' });
  }

  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  };

  try {
    // Find which user this token belongs to
    const profileRes = await fetch(
      `${supabaseUrl}/rest/v1/user_profile?select=user_id,share_name&share_token=eq.${encodeURIComponent(token)}`,
      { headers }
    );
    const profiles = await profileRes.json();
    if (!Array.isArray(profiles) || profiles.length === 0) {
      return res.status(404).json({ ok: false, error: 'This share link is no longer valid.' });
    }
    const userId = profiles[0].user_id;
    const name = profiles[0].share_name || 'This athlete';

    // Drills progress
    const progressRes = await fetch(
      `${supabaseUrl}/rest/v1/user_progress?select=current_streak,longest_streak,total_drills_completed&user_id=eq.${userId}`,
      { headers }
    );
    const progressRows = await progressRes.json();
    const progress = progressRows[0] || { current_streak: 0, longest_streak: 0, total_drills_completed: 0 };

    // Routines (for best current streak among all their saved routines)
    const routinesRes = await fetch(
      `${supabaseUrl}/rest/v1/user_routine?select=sport,current_streak,longest_streak&user_id=eq.${userId}`,
      { headers }
    );
    const routines = await routinesRes.json();

    // Video scores, for average score by sport
    const scoresRes = await fetch(
      `${supabaseUrl}/rest/v1/video_analysis_history?select=sport,score&user_id=eq.${userId}&score=not.is.null`,
      { headers }
    );
    const scoreRows = await scoresRes.json();
    const bySport = {};
    (scoreRows || []).forEach((r) => {
      if (!bySport[r.sport]) bySport[r.sport] = [];
      bySport[r.sport].push(r.score);
    });
    const scoreAverages = Object.entries(bySport)
      .map(([sport, scores]) => ({
        sport,
        avg: Math.round(scores.reduce((s, v) => s + v, 0) / scores.length),
        count: scores.length,
      }))
      .sort((a, b) => b.avg - a.avg);

    // Total distinct active days, from drill_history
    const historyRes = await fetch(
      `${supabaseUrl}/rest/v1/drill_history?select=created_at&user_id=eq.${userId}`,
      { headers }
    );
    const historyRows = await historyRes.json();
    const distinctDays = new Set((historyRows || []).map((r) => r.created_at.slice(0, 10)));

    const bestRoutineStreak = (routines || []).reduce((max, r) => Math.max(max, r.current_streak || 0), 0);

    return res.status(200).json({
      ok: true,
      name,
      drillsStreak: progress.current_streak || 0,
      drillsBestStreak: progress.longest_streak || 0,
      drillsTotal: progress.total_drills_completed || 0,
      routineStreak: bestRoutineStreak,
      routines: (routines || []).map((r) => ({ sport: r.sport, streak: r.current_streak || 0 })),
      scoreAverages,
      totalActiveDays: distinctDays.size,
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
};
