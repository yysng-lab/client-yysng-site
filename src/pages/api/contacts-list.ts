import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ locals }) => {
  const env = (locals as any)?.runtime?.env ?? {};
  const kv = env?.CONTACTS_KV;

  // If KV not bound, return empty list (no secrets leaked)
  if (!kv) return new Response(JSON.stringify({ contacts: [] }), {
    status: 200,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });

  // Option A (simple v1): store a single index key "contacts:index" = ["yysng", ...]
  const indexRaw = await kv.get("contacts:index");
  const slugs: string[] = indexRaw ? (JSON.parse(indexRaw) as string[]) : [];

  const contacts = [];
  for (const slug of slugs) {
    const raw = await kv.get(`contact:${slug}`);
    if (!raw) continue;
    try {
      const c = JSON.parse(raw);
      contacts.push({ slug: c.slug, fullName: c.fullName });
    } catch {}
  }

  return new Response(JSON.stringify({ contacts }), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
};