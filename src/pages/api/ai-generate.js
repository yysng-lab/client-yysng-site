// src/pages/api/ai-generate.js
export const prerender = false;

import { handleGenerate } from "@yysng/ai-edit-engine/server";

export async function POST({ request, locals }) {
  const runtimeEnv = locals?.runtime?.env ?? {};

  try {
    return await handleGenerate(request, runtimeEnv);
  } catch (err) {
    console.error("AI generate error:", err);
    return new Response(
      JSON.stringify({ error: "AI generation failed", message: err?.message ?? String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}