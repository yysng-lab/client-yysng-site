import { handleEdit } from "@yysng/ai-edit-engine/server";
import { updateContentAdapter } from "../../server/updateContent.local.js";

export const prerender = false;

export async function POST(context) {
  // Cloudflare Pages provides bindings here:
  // - in prod: context.locals.runtime.env.CONTENT_KV exists
  // - in local dev: it won't, so adapter falls back to filesystem
  const runtimeEnv = context.locals?.runtime?.env ?? {};

  // IMPORTANT: engine expects { section, content }
  const body = await context.request.json();

  const adapted = body.intent
    ? { section: body.intent.target, content: body.intent.payload }
    : body;

  if (!adapted.section || !adapted.content) {
    return new Response(
      JSON.stringify({
        error: "Invalid AI edit payload",
        received: body,
        expected: { section: "hero", content: {} },
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // rebuild request exactly as engine expects
  const req = new Request(context.request.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(adapted),
  });

  return handleEdit(req, {
    UPDATE_CONTENT: updateContentAdapter,
    ...runtimeEnv, // ✅ this is where CONTENT_KV will appear in production
  });
}