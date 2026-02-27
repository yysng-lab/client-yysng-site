// src/pages/api/contacts-list.ts
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ locals }) => {
  const env = (locals as any)?.runtime?.env ?? {};
  const kv = env?.CONTACTS_KV;

  if (!kv) {
    return new Response(JSON.stringify({ contacts: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }

  const indexRaw = await kv.get("contacts:index");
  if (!indexRaw) {
    return new Response(JSON.stringify({ contacts: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }

  let slugs: string[] = [];
  try {
    slugs = JSON.parse(indexRaw);
  } catch {
    slugs = [];
  }

  const contacts: { slug: string; fullName: string }[] = [];

  for (const slug of slugs) {
    const raw = await kv.get(`contact:${slug}`);
    if (!raw) continue;

    try {
      const obj = JSON.parse(raw);
      if (obj?.slug && obj?.fullName) {
        contacts.push({
          slug: obj.slug,
          fullName: obj.fullName,
        });
      }
    } catch {
      continue;
    }
  }

  return new Response(JSON.stringify({ contacts }), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
};