// Powers the "Pricing" tab on /admin.html — the pricing catalog
// console. Prices are edited as a DRAFT, previewed with a live margin
// badge, then published atomically. Every change is audited.
// Protected by ADMIN_PASSWORD, same as the other admin endpoints.
//
// Scoped to what's real right now: no promotions, no grandfathering,
// no charge-time contract — those depend on a real payment provider
// being connected first. This covers the catalog + resolver +
// draft/publish workflow + margin guardrail, which is genuinely
// useful today even without real payments.

const HAIKU_INPUT_RATE = 1.0 / 1_000_000;
const HAIKU_OUTPUT_RATE = 5.0 / 1_000_000;
const VIDEO_CHECK_INPUT_TOKENS = 3044; // measured from the real system prompt + image payload
const VIDEO_CHECK_OUTPUT_TOKENS = 480;
const VIDEO_CHECK_COST = VIDEO_CHECK_INPUT_TOKENS * HAIKU_INPUT_RATE + VIDEO_CHECK_OUTPUT_TOKENS * HAIKU_OUTPUT_RATE;
const PAYMENT_RATE = 0.029; // placeholder — not verified for whatever processor this ends up using
const PAYMENT_FIXED_CENTS = 30;
const MARGIN_FLOOR = 0.85;
const REALISTIC_WORST_CASE_MONTHLY_CHECKS = 175; // matches the locked "unlimited" cap decision

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

  try {
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

      // Clone the published version into a new draft, so edits never
      // touch the live catalog until Publish is explicitly pressed.
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

      // Discard the current draft entirely — deletes the version row,
      // which cascades to its plan_catalog/topup_catalog rows.
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

      // Publish: archive the old published version, flip the draft to
      // published. Two updates, but both are simple status flips on
      // whole version rows — not a sequence of per-row edits that
      // could half-apply.
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

    // Edit a single row in the draft version. Requires a draft to
    // already exist (create one with action=create_draft first).
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

      // Margin guardrail — block the edit unless explicitly overridden
      // with a reason, same rule for plans and top-ups.
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

      // Non-price edits (visibility, sort order, etc.) skip the
      // guardrail entirely — nothing to compute margin on.
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
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
};
