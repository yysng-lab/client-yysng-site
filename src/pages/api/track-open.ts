import type { APIRoute } from "astro";

function todayKeyPart() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

export const POST: APIRoute = async ({ request, locals }) => {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");

  const env = (locals as any)?.runtime?.env;
  const kv = env?.CONTACTS_KV;

  if (!kv || !slug) {
    return new Response(JSON.stringify({ ok: true, tracked: false }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const totalKey = `metrics:open:${slug}`;
  const dailyKey = `metrics:open:${slug}:${todayKeyPart()}`;

  const currentTotal = Number(await kv.get(totalKey)) || 0;
  const currentDaily = Number(await kv.get(dailyKey)) || 0;

  await kv.put(totalKey, String(currentTotal + 1));
  await kv.put(dailyKey, String(currentDaily + 1));

  return new Response(
    JSON.stringify({
      ok: true,
      tracked: true,
      total: currentTotal + 1,
      today: currentDaily + 1
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
};