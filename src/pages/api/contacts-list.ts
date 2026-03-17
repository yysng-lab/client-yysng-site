// src/pages/api/contacts-list.ts
import type { APIRoute } from "astro";

type ContactLite = {
  slug: string;
  fullName: string;
};

type DevFile = {
  contacts: ContactLite[];
};

async function getFromDevFile(): Promise<ContactLite[]> {
  try {
    const mod = await import("../../data/contacts.dev.json");
    const data = (mod.default ?? mod) as DevFile;

    return Array.isArray(data.contacts)
      ? data.contacts
          .filter((c) => c?.slug && c?.fullName)
          .map((c) => ({
            slug: c.slug,
            fullName: c.fullName,
          }))
      : [];
  } catch {
    return [];
  }
}

export const GET: APIRoute = async ({ locals }) => {
  // ✅ In local dev, always prefer contacts.dev.json
  if (import.meta.env.DEV) {
    const contacts = await getFromDevFile();

    return new Response(JSON.stringify({ contacts }), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }

  const env = (locals as any)?.runtime?.env ?? {};
  const kv = env?.CONTACTS_KV;

  if (!kv) {
    return new Response(JSON.stringify({ contacts: [] }), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }

  const indexRaw = await kv.get("contacts:index");
  if (!indexRaw) {
    return new Response(JSON.stringify({ contacts: [] }), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }

  let slugs: string[] = [];
  try {
    slugs = JSON.parse(indexRaw);
  } catch {
    slugs = [];
  }

  const contacts: ContactLite[] = [];

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