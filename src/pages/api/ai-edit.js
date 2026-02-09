import { handleEdit } from "@yysng/ai-edit-engine/server";

// ------------------------------
// Tier A: minimal contract guards
// ------------------------------
function assertHero(d) {
  if (!d || typeof d !== "object") throw new Error("Hero must be an object");
  if (typeof d.title !== "string" || !d.title.trim())
    throw new Error("Hero.title is required");

  if (d.subtitle != null && typeof d.subtitle !== "string")
    throw new Error("Hero.subtitle must be a string");

  if (d.cta != null) {
    if (typeof d.cta !== "object") throw new Error("Hero.cta must be an object");
    if (typeof d.cta.label !== "string" || !d.cta.label.trim())
      throw new Error("Hero.cta.label is required");
    if (typeof d.cta.href !== "string" || !d.cta.href.trim())
      throw new Error("Hero.cta.href is required");
  }
}

function assertCta(d) {
  if (!d || typeof d !== "object") throw new Error("CTA must be an object");
  if (typeof d.heading !== "string" || !d.heading.trim())
    throw new Error("CTA.heading is required");

  if (d.description != null && typeof d.description !== "string")
    throw new Error("CTA.description must be a string");

  if (!d.button || typeof d.button !== "object")
    throw new Error("CTA.button is required");
  if (typeof d.button.label !== "string" || !d.button.label.trim())
    throw new Error("CTA.button.label is required");
  if (typeof d.button.href !== "string" || !d.button.href.trim())
    throw new Error("CTA.button.href is required");
}

function validateBySection(section, content) {
  if (section === "hero") return assertHero(content);
  if (section === "cta") return assertCta(content);
  // For future sections: add guards here
}

export async function POST(context) {
  const runtimeEnv = context.locals?.runtime?.env ?? {};
  const body = await context.request.json();

  // Support both payload shapes:
  // 1) { section, content }
  // 2) { intent: { target, payload } }
  const adapted = body?.intent
    ? { section: body.intent.target, content: body.intent.payload }
    : body;

  const section = adapted?.section;
  const content = adapted?.content;

  try {
    if (typeof section !== "string" || !section.trim()) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid section" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // ✅ Tier A guardrail: validate before touching storage
    validateBySection(section, content);
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err?.message || "Invalid content" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const req = new Request(context.request.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(adapted),
  });

  let UPDATE_CONTENT;

  if (runtimeEnv.CONTENT_KV) {
    const mod = await import("../../server/updateContent.kv.js");
    UPDATE_CONTENT = (section, content, env) =>
      mod.updateContentKV(section, content, env);
  } else {
    // ✅ Ensure local writes go to src/data (so index.astro + ai-editor read the same truth)
    runtimeEnv.CONTENT_ROOT ??= new URL("../../data", import.meta.url).pathname;

    const mod = await import("../../server/updateContent.local.js");
    UPDATE_CONTENT = (section, content, env) =>
      mod.updateContentAdapter(section, content, env);
  }

  return handleEdit(req, {
    UPDATE_CONTENT,
    ...runtimeEnv,
  });
}