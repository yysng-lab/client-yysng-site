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
  // Only attempt dev JSON import in local dev
  if (!import.meta.env.DEV) return null;

  try {
    const mod = await import("../data/contacts.dev.json");
    const data = (mod.default ?? mod) as unknown as DevFile;
    const hit = data?.contacts?.find((c) => c.slug === slug);
    return hit ?? null;
  } catch {
    // dev file missing is OK (e.g. not created yet)
    return null;
  }
}

export async function getContactBySlug(opts: {
  slug: string;
  env?: Record<string, any>;
}): Promise<ContactRecord | null> {
  const { slug, env } = opts;
  const safeSlug = String(slug || "").trim();
  if (!safeSlug) return null;

  // --- PROD (KV) ---
  // Binding name: CONTACTS_KV
  const kv = env?.CONTACTS_KV;
  if (kv) {
    const raw = await kv.get(`contact:${safeSlug}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as ContactRecord;
    } catch {
      return null;
    }
  }

  // --- DEV fallback (file) ---
  return await getFromDevFile(safeSlug);
}

export function initialsFromName(name: string): string {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return (a + b).toUpperCase() || "YY";
}