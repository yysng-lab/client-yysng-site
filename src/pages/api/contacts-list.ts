// src/pages/api/contacts-list.ts
import type { APIRoute } from "astro";
import type { ContactRecord } from "../../lib/contacts";

export const GET: APIRoute = async ({ locals }) => {
  const env = (locals as any)?.runtime?.env ?? {};
  const kv = env?.CONTACTS_KV;

  // quick debug (safe)
  console.log("contacts-list CONTACTS_KV:", Boolean(kv));

  if (!kv) {
    return new Response(JSON.stringify({ error: "Missing CONTACTS_KV binding" }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }

  // 1) read the index
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
    return new Response(JSON.stringify({ error: "contacts:index is not valid JSON" }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }

  // 2) fetch each contact
  const contacts = (
    await Promise.all(
      slugs.map(async (slug) => {
        const raw = await kv.get(`contact:${slug}`);
        if (!raw) return null;
        try {
          const c = JSON.parse(raw) as ContactRecord;

          // IMPORTANT: don’t leak privateToken
          delete (c as any).privateToken;
          delete (c as any).phone; // optional: don’t leak phone either in list

          return c;
        } catch {
          return null;
        }
      })
    )
  ).filter(Boolean);

  return new Response(JSON.stringify({ contacts }), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
};