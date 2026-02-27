// src/lib/contacts.ts

export type ContactTheme = {
  bg?: string;
  card?: string;
  text?: string;
  muted?: string;
  border?: string;
  accent?: string;
};

export type ContactRecord = {
  slug: string;
  fullName: string;
  headline?: string;
  company?: string;
  oneLiner?: string;
  location?: string;
  email: string;
  phone?: string;
  website?: string;
  linkedin?: string;
  wechat?: string;
  whatsapp?: string;
  photoUrl?: string;
  about?: string;
  theme?: ContactTheme;
  privateToken?: string;
  updatedAt?: string;
};

type DevFile = { contacts: ContactRecord[] };

async function getFromDevFile(slug: string): Promise<ContactRecord | null> {
  try {
    const mod = await import("../data/contacts.dev.json");
    const data = (mod.default ?? mod) as unknown as DevFile;
    const hit = data?.contacts?.find((c) => c.slug === slug);
    return hit ?? null;
  } catch (e) {
    console.warn("[contacts] dev json not loaded:", e);
    return null;
  }
}

async function getFromKV(slug: string, env?: Record<string, any>): Promise<ContactRecord | null> {
  const kv = env?.CONTACTS_KV;
  if (!kv) return null;

  const raw = await kv.get(`contact:${slug}`);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as ContactRecord;
  } catch {
    return null;
  }
}

export async function getContactBySlug(opts: {
  slug: string;
  env?: Record<string, any>;
}): Promise<ContactRecord | null> {
  const safeSlug = String(opts.slug || "").trim();
  if (!safeSlug) return null;

  // ✅ Local dev: JSON first (your preferred workflow)
  if (import.meta.env.DEV) {
    const devHit = await getFromDevFile(safeSlug);
    if (devHit) return devHit;

    // Optional fallback to KV in dev (keeps dev usable if json missing)
    return await getFromKV(safeSlug, opts.env);
  }

  // ✅ Production: KV only (no JSON fallback)
  return await getFromKV(safeSlug, opts.env);
}

export function initialsFromName(name: string): string {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return (a + b).toUpperCase() || "YY";
}