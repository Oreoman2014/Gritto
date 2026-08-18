// Consolidated admin API for /admin.html — combines what used to be 6
// separate files (admin-users, admin-feedback, admin-profiles,
// admin-topups, admin-pricing, admin-costs) into ONE serverless
// function, routed by a `resource` query param. Vercel's free Hobby
// plan caps deployments at 12 serverless functions total, and this
// app had grown past that — consolidating these frees up 5 slots at
// once without needing a paid plan.
//
// Every resource's actual logic is unchanged from its original file,
// just moved into its own function below and dispatched by `resource`.

const HAIKU_INPUT_RATE = 1.0 / 1_000_000;
const HAIKU_OUTPUT_RATE = 5.0 / 1_000_000;
const VIDEO_CHECK_INPUT_TOKENS = 3044;
const VIDEO_CHECK_OUTPUT_TOKENS = 480;
const VIDEO_CHECK_COST = VIDEO_CHECK_INPUT_TOKENS * HAIKU_INPUT_RATE + VIDEO_CHECK_OUTPUT_TOKENS * HAIKU_OUTPUT_RATE;
const PAYMENT_RATE = 0.029;
const PAYMENT_FIXED_CENTS = 30;
const MARGIN_FLOOR = 0.85;
const REALISTIC_WORST_CASE_MONTHLY_CHECKS = 175;

// Shared by several resource handlers below — one place to log an
// admin action, so profiles/topups/feedback don't each need their own
// copy of this. Best-effort: if logging itself fails, the actual
// action (which already succeeded) isn't rolled back over it.
async function logAdminAction(supabaseUrl, baseHeaders, action, targetUserId, details) {
  try {
    await fetch(`${supabaseUrl}/rest/v1/admin_audit_log`, {
      method: 'POST',
      headers: baseHeaders,
      body: JSON.stringify({ actor: 'admin', action, target_user_id: targetUserId || null, details: details || null }),
    });
  } catch (e) {
    console.error('Audit logging failed (action itself still succeeded):', e);
  }
}

function computeMargin(amountCents, unitsAssumed) {
  const amount = amountCents / 100;
  const processing = amount * PAYMENT_RATE + PAYMENT_FIXED_CENTS / 100;
  const net = amount - processing;
  const cost = VIDEO_CHECK_COST * unitsAssumed;
  const margin = amount > 0 ? (net - cost) / amount : null;
  return { margin, cost, net };
}

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

  const resource = req.query.resource;

  try {
    if (resource === 'users') return await handleUsers(req, res, supabaseUrl, baseHeaders);
    if (resource === 'feedback') return await handleFeedback(req, res, supabaseUrl, baseHeaders);
    if (resource === 'profiles') return await handleProfiles(req, res, supabaseUrl, baseHeaders);
    if (resource === 'topups') return await handleTopups(req, res, supabaseUrl, baseHeaders);
    if (resource === 'pricing') return await handlePricing(req, res, supabaseUrl, baseHeaders);
    if (resource === 'costs') return await handleCosts(req, res, supabaseUrl, baseHeaders);
    if (resource === 'overview') return await handleOverview(req, res, supabaseUrl, baseHeaders);
    if (resource === 'ratelimits') return await handleRateLimits(req, res, supabaseUrl, baseHeaders);
    if (resource === 'auditlog') return await handleAuditLog(req, res, supabaseUrl, baseHeaders);
    if (resource === 'announcements') return await handleAnnouncements(req, res, supabaseUrl, baseHeaders);
    return res.status(400).json({ ok: false, error: `Unknown resource: ${resource}` });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
};

// ---- Beta Users ----
async function handleUsers(req, res, supabaseUrl, baseHeaders) {
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
}

// ---- Feedback ----
async function handleFeedback(req, res, supabaseUrl, baseHeaders) {
  if (req.method === 'GET') {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/feedback_reports?select=id,user_id,message,created_at,needs_attention,ai_response,admin_reviewed,admin_reply&order=created_at.desc`,
      { headers: baseHeaders }
    );
    const reports = await response.json();
    if (!Array.isArray(reports)) {
      return res.status(400).json({ ok: false, error: 'Could not load feedback.' });
    }

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

  // Marking reviewed and replying are the same action here — sending a
  // real reply always implies it's been handled, so `reply` (if given)
  // gets saved alongside admin_reviewed in one write, not two.
  if (req.method === 'PATCH') {
    const { id, reply } = req.body || {};
    if (!id) return res.status(400).json({ ok: false, error: 'Report id is required.' });
    const updates = { admin_reviewed: true };
    if (typeof reply === 'string' && reply.trim()) updates.admin_reply = reply.trim();

    const beforeRes = await fetch(`${supabaseUrl}/rest/v1/feedback_reports?id=eq.${encodeURIComponent(id)}&select=user_id`, { headers: baseHeaders });
    const beforeRows = await beforeRes.json();
    const targetUserId = (Array.isArray(beforeRows) && beforeRows[0]) ? beforeRows[0].user_id : null;

    const response = await fetch(
      `${supabaseUrl}/rest/v1/feedback_reports?id=eq.${encodeURIComponent(id)}`,
      { method: 'PATCH', headers: baseHeaders, body: JSON.stringify(updates) }
    );
    if (!response.ok) {
      const errText = await response.text();
      return res.status(400).json({ ok: false, error: errText });
    }
    await logAdminAction(supabaseUrl, baseHeaders, updates.admin_reply ? 'feedback_reply' : 'feedback_reviewed', targetUserId, { feedback_id: id, reply: updates.admin_reply || null });
    return res.status(200).json({ ok: true });
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
}

// ---- Profiles ----
async function handleProfiles(req, res, supabaseUrl, baseHeaders) {
  if (req.method === 'PATCH') {
    const { user_id, updates } = req.body || {};
    if (!user_id || !updates || typeof updates !== 'object') {
      return res.status(400).json({ ok: false, error: 'user_id and updates are required.' });
    }
    const editableFields = new Set([
      'favorite_sport', 'main_goal', 'experience_level', 'coach_personality',
      'age_range', 'positions', 'equipment_access', 'team_or_solo',
      'biggest_challenge', 'has_prior_injury', 'injury_areas', 'upcoming_goal',
      'onboarding_completed', 'granted_themes', 'granted_badges',
      'premium_tier', 'bonus_checks_granted', 'bonus_checks_used',
    ]);
    const safeUpdates = {};
    for (const key of Object.keys(updates)) {
      if (editableFields.has(key)) safeUpdates[key] = updates[key];
    }
    if (Object.keys(safeUpdates).length === 0) {
      return res.status(400).json({ ok: false, error: 'No editable fields were provided.' });
    }

    const response = await fetch(
      `${supabaseUrl}/rest/v1/user_profile?user_id=eq.${encodeURIComponent(user_id)}`,
      { method: 'PATCH', headers: baseHeaders, body: JSON.stringify(safeUpdates) }
    );
    if (!response.ok) {
      const errText = await response.text();
      return res.status(400).json({ ok: false, error: errText });
    }

    // Tag the action type based on what actually changed, so the
    // audit log reads clearly rather than just "profile updated".
    let actionType = 'profile_update';
    if ('premium_tier' in safeUpdates) actionType = 'change_tier';
    else if ('granted_themes' in safeUpdates || 'granted_badges' in safeUpdates) actionType = 'grant_themes_badges';
    await logAdminAction(supabaseUrl, baseHeaders, actionType, user_id, safeUpdates);

    return res.status(200).json({ ok: true });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/user_profile?select=*&order=user_id`,
    { headers: baseHeaders }
  );
  const profiles = await response.json();
  if (!Array.isArray(profiles)) {
    return res.status(400).json({ ok: false, error: 'Could not load profiles.' });
  }

  const emailCache = {};
  for (const p of profiles) {
    if (!p.user_id || emailCache[p.user_id]) continue;
    try {
      const userRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${p.user_id}`, { headers: baseHeaders });
      if (userRes.ok) {
        const userData = await userRes.json();
        emailCache[p.user_id] = userData.email || 'Unknown';
      } else {
        emailCache[p.user_id] = 'Unknown';
      }
    } catch (e) {
      emailCache[p.user_id] = 'Unknown';
    }
  }

  const withEmails = profiles.map(p => ({ ...p, email: emailCache[p.user_id] || 'Unknown' }));
  return res.status(200).json({ ok: true, profiles: withEmails });
}

// ---- Top-ups ----
async function handleTopups(req, res, supabaseUrl, baseHeaders) {
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
      const newTotal = Math.max(0, current + delta);
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
      await logAdminAction(supabaseUrl, baseHeaders, 'topup_grant', user_id, { pack_size, request_id });
      return res.status(200).json({ ok: true });
    }

    if (action === 'decline') {
      if (!(await setRequestStatus('declined'))) {
        return res.status(400).json({ ok: false, error: 'Could not decline this request.' });
      }
      await logAdminAction(supabaseUrl, baseHeaders, 'topup_decline', user_id, { pack_size, request_id });
      return res.status(200).json({ ok: true });
    }

    if (action === 'undo') {
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
      if (!(await setRequestStatus('pending'))) {
        return res.status(400).json({ ok: false, error: 'Could not undo this request.' });
      }
      await logAdminAction(supabaseUrl, baseHeaders, 'topup_undo', user_id, { pack_size, request_id, was: currentStatus });
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ ok: false, error: `Unknown action: ${action}` });
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed' });
}

// ---- Pricing catalog ----
async function handlePricing(req, res, supabaseUrl, baseHeaders) {
  if (req.method === 'GET') {
    const versionsRes = await fetch(
      `${supabaseUrl}/rest/v1/catalog_version?status=in.(draft,published)&select=*&order=created_at.desc`,
      { headers: baseHeaders }
    );
    const versions = await versionsRes.json();
    const published = Array.isArray(versions) ? versions.find(v => v.status === 'published') : null;
    const draft = Array.isArray(versions) ? versions.find(v => v.status === 'draft') : null;

    const activeVersion = draft || published;
    let plans = [];
    let topups = [];
    if (activeVersion) {
      const [plansRes, topupsRes] = await Promise.all([
        fetch(`${supabaseUrl}/rest/v1/plan_catalog?version_id=eq.${activeVersion.id}&select=*&order=sort_order.asc`, { headers: baseHeaders }),
        fetch(`${supabaseUrl}/rest/v1/topup_catalog?version_id=eq.${activeVersion.id}&select=*&order=sort_order.asc`, { headers: baseHeaders }),
      ]);
      plans = await plansRes.json();
      topups = await topupsRes.json();
    }

    const auditRes = await fetch(
      `${supabaseUrl}/rest/v1/price_audit?select=*&order=at.desc&limit=30`,
      { headers: baseHeaders }
    );
    const audit = await auditRes.json();

    const plansWithMargin = (Array.isArray(plans) ? plans : []).map(p => {
      const unitsAssumed = p.plan_key === 'premium' ? REALISTIC_WORST_CASE_MONTHLY_CHECKS : (p.bonus_checks || 0);
      const { margin } = computeMargin(p.amount_cents, unitsAssumed || 0);
      return { ...p, margin, margin_assumption: p.plan_key === 'premium' ? 'realistic worst-case monthly' : 'full one-time pool used' };
    });
    const topupsWithMargin = (Array.isArray(topups) ? topups : []).map(t => {
      const { margin } = computeMargin(t.amount_cents, t.units);
      return { ...t, margin, margin_assumption: 'full pack used' };
    });

    return res.status(200).json({
      ok: true,
      hasDraft: !!draft,
      draftVersion: draft || null,
      publishedVersion: published || null,
      plans: plansWithMargin,
      topups: topupsWithMargin,
      audit: Array.isArray(audit) ? audit : [],
      marginFloor: MARGIN_FLOOR,
    });
  }

  if (req.method === 'POST') {
    const { action } = req.body || {};

    if (action === 'create_draft') {
      const publishedRes = await fetch(
        `${supabaseUrl}/rest/v1/catalog_version?status=eq.published&select=id&order=published_at.desc&limit=1`,
        { headers: baseHeaders }
      );
      const publishedRows = await publishedRes.json();
      const publishedId = Array.isArray(publishedRows) && publishedRows[0] ? publishedRows[0].id : null;
      if (!publishedId) {
        return res.status(400).json({ ok: false, error: 'No published catalog to draft from.' });
      }

      const draftInsertRes = await fetch(`${supabaseUrl}/rest/v1/catalog_version`, {
        method: 'POST',
        headers: { ...baseHeaders, Prefer: 'return=representation' },
        body: JSON.stringify({ label: `Draft ${new Date().toISOString().slice(0, 10)}`, status: 'draft' }),
      });
      const draftRows = await draftInsertRes.json();
      const draftId = Array.isArray(draftRows) && draftRows[0] ? draftRows[0].id : null;
      if (!draftId) {
        return res.status(400).json({ ok: false, error: 'Could not create a draft.' });
      }

      const [plansRes, topupsRes] = await Promise.all([
        fetch(`${supabaseUrl}/rest/v1/plan_catalog?version_id=eq.${publishedId}&select=*`, { headers: baseHeaders }),
        fetch(`${supabaseUrl}/rest/v1/topup_catalog?version_id=eq.${publishedId}&select=*`, { headers: baseHeaders }),
      ]);
      const plans = await plansRes.json();
      const topups = await topupsRes.json();

      const clonedPlans = (Array.isArray(plans) ? plans : []).map(({ id, updated_at, ...rest }) => ({ ...rest, version_id: draftId }));
      const clonedTopups = (Array.isArray(topups) ? topups : []).map(({ id, updated_at, ...rest }) => ({ ...rest, version_id: draftId }));

      await Promise.all([
        clonedPlans.length ? fetch(`${supabaseUrl}/rest/v1/plan_catalog`, { method: 'POST', headers: baseHeaders, body: JSON.stringify(clonedPlans) }) : null,
        clonedTopups.length ? fetch(`${supabaseUrl}/rest/v1/topup_catalog`, { method: 'POST', headers: baseHeaders, body: JSON.stringify(clonedTopups) }) : null,
      ]);

      return res.status(200).json({ ok: true, draftId });
    }

    if (action === 'discard_draft') {
      const draftRes = await fetch(
        `${supabaseUrl}/rest/v1/catalog_version?status=eq.draft&select=id&limit=1`,
        { headers: baseHeaders }
      );
      const draftRows = await draftRes.json();
      const draftId = Array.isArray(draftRows) && draftRows[0] ? draftRows[0].id : null;
      if (!draftId) {
        return res.status(400).json({ ok: false, error: 'No draft to discard.' });
      }
      await fetch(`${supabaseUrl}/rest/v1/catalog_version?id=eq.${draftId}`, { method: 'DELETE', headers: baseHeaders });
      return res.status(200).json({ ok: true });
    }

    if (action === 'publish') {
      const { actor } = req.body || {};
      const versionsRes = await fetch(
        `${supabaseUrl}/rest/v1/catalog_version?status=in.(draft,published)&select=*`,
        { headers: baseHeaders }
      );
      const versions = await versionsRes.json();
      const draft = Array.isArray(versions) ? versions.find(v => v.status === 'draft') : null;
      const published = Array.isArray(versions) ? versions.find(v => v.status === 'published') : null;
      if (!draft) {
        return res.status(400).json({ ok: false, error: 'No draft to publish.' });
      }

      if (published) {
        await fetch(`${supabaseUrl}/rest/v1/catalog_version?id=eq.${published.id}`, {
          method: 'PATCH', headers: baseHeaders, body: JSON.stringify({ status: 'archived' }),
        });
      }
      await fetch(`${supabaseUrl}/rest/v1/catalog_version?id=eq.${draft.id}`, {
        method: 'PATCH', headers: baseHeaders,
        body: JSON.stringify({ status: 'published', published_at: new Date().toISOString(), published_by: actor || 'admin' }),
      });

      await fetch(`${supabaseUrl}/rest/v1/price_audit`, {
        method: 'POST', headers: baseHeaders,
        body: JSON.stringify({
          actor: actor || 'admin', action: 'publish', target_kind: 'plan', target_key: 'all',
          before: { version: published ? published.id : null }, after: { version: draft.id },
        }),
      });

      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ ok: false, error: `Unknown action: ${action}` });
  }

  if (req.method === 'PATCH') {
    const { target_kind, target_id, target_key, updates, actor, reason, override_guardrail } = req.body || {};
    if (!target_kind || !target_id || !updates) {
      return res.status(400).json({ ok: false, error: 'target_kind, target_id, and updates are required.' });
    }

    const table = target_kind === 'plan' ? 'plan_catalog' : 'topup_catalog';

    const beforeRes = await fetch(`${supabaseUrl}/rest/v1/${table}?id=eq.${target_id}&select=*`, { headers: baseHeaders });
    const beforeRows = await beforeRes.json();
    const before = Array.isArray(beforeRows) && beforeRows[0] ? beforeRows[0] : null;
    if (!before) {
      return res.status(404).json({ ok: false, error: 'Row not found.' });
    }

    if (typeof updates.amount_cents === 'number') {
      const unitsAssumed = target_kind === 'plan'
        ? (target_key === 'premium' ? REALISTIC_WORST_CASE_MONTHLY_CHECKS : (updates.bonus_checks ?? before.bonus_checks ?? 0))
        : (updates.units ?? before.units ?? 0);
      const { margin: marginBefore } = computeMargin(before.amount_cents, unitsAssumed);
      const { margin: marginAfter } = computeMargin(updates.amount_cents, unitsAssumed);

      if (marginAfter !== null && marginAfter < MARGIN_FLOOR && !override_guardrail) {
        return res.status(400).json({
          ok: false,
          error: 'guardrail_blocked',
          message: `This price puts margin at ${(marginAfter * 100).toFixed(1)}%, below the ${(MARGIN_FLOOR * 100).toFixed(0)}% floor. Override with a reason to publish anyway.`,
          marginBefore, marginAfter,
        });
      }
      if (marginAfter !== null && marginAfter < MARGIN_FLOOR && override_guardrail && (!reason || reason.trim().length < 10)) {
        return res.status(400).json({ ok: false, error: 'A reason of at least 10 characters is required to override the margin guardrail.' });
      }

      const updateRes = await fetch(`${supabaseUrl}/rest/v1/${table}?id=eq.${target_id}`, {
        method: 'PATCH', headers: baseHeaders,
        body: JSON.stringify({ ...updates, updated_by: actor || 'admin', updated_at: new Date().toISOString() }),
      });
      if (!updateRes.ok) {
        return res.status(400).json({ ok: false, error: 'Could not save this edit.' });
      }

      await fetch(`${supabaseUrl}/rest/v1/price_audit`, {
        method: 'POST', headers: baseHeaders,
        body: JSON.stringify({
          actor: actor || 'admin', action: 'edit', target_kind, target_key: target_key || before.plan_key || before.pack_key,
          before, after: { ...before, ...updates },
          margin_before: marginBefore, margin_after: marginAfter,
          guardrail_overridden: !!override_guardrail, reason: reason || null,
        }),
      });

      return res.status(200).json({ ok: true, marginBefore, marginAfter });
    }

    const updateRes = await fetch(`${supabaseUrl}/rest/v1/${table}?id=eq.${target_id}`, {
      method: 'PATCH', headers: baseHeaders,
      body: JSON.stringify({ ...updates, updated_by: actor || 'admin', updated_at: new Date().toISOString() }),
    });
    if (!updateRes.ok) {
      return res.status(400).json({ ok: false, error: 'Could not save this edit.' });
    }
    await fetch(`${supabaseUrl}/rest/v1/price_audit`, {
      method: 'POST', headers: baseHeaders,
      body: JSON.stringify({
        actor: actor || 'admin', action: 'edit', target_kind, target_key: target_key || before.plan_key || before.pack_key,
        before, after: { ...before, ...updates },
      }),
    });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed' });
}

// ---- Cost dashboard ----
async function handleCosts(req, res, supabaseUrl, baseHeaders) {
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

  const dayTrend = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    dayTrend.push({ date: d, cost: byDay[d] || 0 });
  }

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
}

// ---- Overview dashboard ----
// One summary combining what needs attention across every other tab,
// so logging in shows the whole picture at a glance instead of
// requiring a click through all 7 tabs to check what's outstanding.
async function handleOverview(req, res, supabaseUrl, baseHeaders) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [usersRes, newUsersRes, feedbackRes, topupsRes, catalogRes] = await Promise.all([
    fetch(`${supabaseUrl}/rest/v1/allowed_users?select=email`, { headers: baseHeaders }),
    fetch(`${supabaseUrl}/rest/v1/allowed_users?select=email&added_at=gte.${sevenDaysAgo}`, { headers: baseHeaders }),
    fetch(`${supabaseUrl}/rest/v1/feedback_reports?select=id&needs_attention=eq.true&admin_reviewed=eq.false`, { headers: baseHeaders }),
    fetch(`${supabaseUrl}/rest/v1/topup_requests?select=id&status=eq.pending`, { headers: baseHeaders }),
    fetch(`${supabaseUrl}/rest/v1/catalog_version?select=id&status=eq.draft`, { headers: baseHeaders }),
  ]);

  const [users, newUsers, feedback, topups, catalog] = await Promise.all([
    usersRes.json(), newUsersRes.json(), feedbackRes.json(), topupsRes.json(), catalogRes.json(),
  ]);

  return res.status(200).json({
    ok: true,
    totalUsers: Array.isArray(users) ? users.length : 0,
    newUsersThisWeek: Array.isArray(newUsers) ? newUsers.length : 0,
    unreviewedFeedback: Array.isArray(feedback) ? feedback.length : 0,
    pendingTopups: Array.isArray(topups) ? topups.length : 0,
    hasPricingDraft: Array.isArray(catalog) && catalog.length > 0,
  });
}

// ---- Rate limit monitoring ----
// Shows real request-volume per user over the last 24 hours, so heavy
// usage (possible abuse, or a power user who might want a higher
// tier) is visible without waiting for someone to actually hit the
// 15/min or 300/day ceiling.
const DAILY_RATE_LIMIT = 300;

async function handleRateLimits(req, res, supabaseUrl, baseHeaders) {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const logRes = await fetch(
    `${supabaseUrl}/rest/v1/ai_request_log?select=user_id,created_at&created_at=gte.${oneDayAgo}`,
    { headers: baseHeaders }
  );
  const logs = await logRes.json();
  if (!Array.isArray(logs)) {
    return res.status(400).json({ ok: false, error: 'Could not load rate limit data.' });
  }

  const byUser = {};
  for (const row of logs) {
    if (!row.user_id) continue;
    byUser[row.user_id] = (byUser[row.user_id] || 0) + 1;
  }

  const sorted = Object.entries(byUser).sort((a, b) => b[1] - a[1]).slice(0, 20);
  const results = [];
  for (const [userId, count] of sorted) {
    let email = 'Unknown';
    try {
      const userRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, { headers: baseHeaders });
      if (userRes.ok) {
        const userData = await userRes.json();
        email = userData.email || 'Unknown';
      }
    } catch (e) { /* leave as Unknown */ }
    results.push({ userId, email, requestCount: count, pctOfDailyLimit: count / DAILY_RATE_LIMIT });
  }

  return res.status(200).json({ ok: true, users: results, dailyLimit: DAILY_RATE_LIMIT });
}

// ---- Admin action audit log ----
async function handleAuditLog(req, res, supabaseUrl, baseHeaders) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }
  const logRes = await fetch(
    `${supabaseUrl}/rest/v1/admin_audit_log?select=*&order=at.desc&limit=50`,
    { headers: baseHeaders }
  );
  const logs = await logRes.json();
  if (!Array.isArray(logs)) {
    return res.status(400).json({ ok: false, error: 'Could not load the audit log.' });
  }

  const emailCache = {};
  for (const l of logs) {
    if (!l.target_user_id || emailCache[l.target_user_id]) continue;
    try {
      const userRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${l.target_user_id}`, { headers: baseHeaders });
      if (userRes.ok) {
        const userData = await userRes.json();
        emailCache[l.target_user_id] = userData.email || 'Unknown';
      }
    } catch (e) { /* leave unset */ }
  }

  const withEmails = logs.map(l => ({ ...l, target_email: l.target_user_id ? (emailCache[l.target_user_id] || 'Unknown') : null }));
  return res.status(200).json({ ok: true, logs: withEmails });
}

// ---- Broadcast announcements ----
async function handleAnnouncements(req, res, supabaseUrl, baseHeaders) {
  if (req.method === 'GET') {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/announcements?select=*&order=created_at.desc&limit=20`,
      { headers: baseHeaders }
    );
    const data = await response.json();
    return res.status(200).json({ ok: true, announcements: Array.isArray(data) ? data : [] });
  }

  if (req.method === 'POST') {
    const { message } = req.body || {};
    if (!message || !message.trim()) {
      return res.status(400).json({ ok: false, error: 'A message is required.' });
    }
    // Only one announcement should be active at a time, so a new one
    // replaces the last rather than stacking silently underneath it.
    await fetch(`${supabaseUrl}/rest/v1/announcements?active=eq.true`, {
      method: 'PATCH', headers: baseHeaders, body: JSON.stringify({ active: false }),
    });
    const insertRes = await fetch(`${supabaseUrl}/rest/v1/announcements`, {
      method: 'POST', headers: { ...baseHeaders, Prefer: 'return=representation' },
      body: JSON.stringify({ message: message.trim(), active: true }),
    });
    if (!insertRes.ok) {
      return res.status(400).json({ ok: false, error: 'Could not post the announcement.' });
    }
    await logAdminAction(supabaseUrl, baseHeaders, 'announcement_posted', null, { message: message.trim() });
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'PATCH') {
    // Explicit takedown, without posting a replacement.
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ ok: false, error: 'id is required.' });
    const response = await fetch(`${supabaseUrl}/rest/v1/announcements?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH', headers: baseHeaders, body: JSON.stringify({ active: false }),
    });
    if (!response.ok) {
      return res.status(400).json({ ok: false, error: 'Could not take down the announcement.' });
    }
    await logAdminAction(supabaseUrl, baseHeaders, 'announcement_removed', null, { announcement_id: id });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed' });
}
