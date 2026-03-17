import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request, locals }) => {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");

  const env = (locals as any)?.runtime?.env;
  const kv = env?.CONTACTS_KV;

  if (!kv || !slug) {
    return new Response("ok");
  }

  const key = `metrics:open:${slug}`;
  const current = Number(await kv.get(key)) || 0;

  await kv.put(key, String(current + 1));

  return new Response("ok");
};