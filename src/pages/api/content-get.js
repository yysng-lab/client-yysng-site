export const prerender = false;

export async function GET({ locals, url }) {
  const env = locals?.runtime?.env ?? {};
  const section = url.searchParams.get("section") || "hero";

  if (!env.CONTENT_KV) {
    return new Response(JSON.stringify({ error: "CONTENT_KV missing in runtime env" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const key = `${section}.json`; // MUST match your updater's keys
  const raw = await env.CONTENT_KV.get(key);

  return new Response(JSON.stringify({ section, key, raw: raw ? JSON.parse(raw) : null }), {
    headers: { "Content-Type": "application/json" },
  });
}