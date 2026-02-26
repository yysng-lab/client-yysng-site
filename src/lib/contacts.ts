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
  if (!import.meta.env.DEV) return null;

  try {
    const mod = await import("../data/contacts.dev.json");
    const data = (mod.default ?? mod) as unknown as DevFile;
    return data?.contacts?.find((c) => c.slug === slug) ?? null;
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

  const kv = opts.env?.CONTACTS_KV;
  if (kv) {
    const raw = await kv.get(`contact:${safeSlug}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as ContactRecord;
    } catch {
      return null;
    }
  }

  // Only fallback in DEV (never in prod)
  return await getFromDevFile(safeSlug);
}

export function initialsFromName(name: string): string {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return (a + b).toUpperCase() || "YY";
}