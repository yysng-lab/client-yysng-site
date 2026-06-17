import type { APIRoute } from "astro";

function todayKeyPart() {
  return new Date().toISOString().slice(0, 10);
}

export const GET: APIRoute = async ({ url, locals }) => {
  const slug = url.searchParams.get("slug");

  const env = (locals as any)?.runtime?.env;
  const kv = env?.CONTACTS_KV;

  if (!kv || !slug) {
    return new Response(JSON.stringify({ today: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const dailyKey = `metrics:open:${slug}:${todayKeyPart()}`;
  const today = Number(await kv.get(dailyKey)) || 0;

  return new Response(JSON.stringify({ today }), {
    headers: { "Content-Type": "application/json" },
  });
};