import { handleEdit } from "@yysng/ai-edit-engine/server";

export async function POST(context) {
  const runtimeEnv = context.locals?.runtime?.env ?? {};
  const body = await context.request.json();

  const adapted = body.intent
    ? { section: body.intent.target, content: body.intent.payload }
    : body;

  const req = new Request(context.request.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(adapted),
  });

  // ✅ choose update function WITHOUT pulling node modules into prod bundle
  let UPDATE_CONTENT;

  if (runtimeEnv.CONTENT_KV) {
    const mod = await import("../../server/updateContent.kv.js");
    UPDATE_CONTENT = (section, content, env) => mod.updateContentKV(section, content, env);
  } else {
    const mod = await import("../../server/updateContent.local.js");
    UPDATE_CONTENT = (section, content, env) => mod.updateContentAdapter(section, content, env);
  }

  return handleEdit(req, {
    UPDATE_CONTENT,
    ...runtimeEnv,
  });
}