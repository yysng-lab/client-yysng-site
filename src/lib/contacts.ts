// src/lib/contacts.ts
import contactsDev from "../data/contacts.dev.json";

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

const DEV_DATA = contactsDev as unknown as DevFile;

export async function getContactBySlug(opts: {
  slug: string;
  env?: Record<string, any>;
}): Promise<ContactRecord | null> {
  const { slug, env } = opts;

  // --- PROD (KV) later ---
  // Expect binding name CONTACTS_KV (recommended).
  // if (env?.CONTACTS_KV) {
  //   const raw = await env.CONTACTS_KV.get(`contact:${slug}`);
  //   if (!raw) return null;
  //   try { return JSON.parse(raw) as ContactRecord; } catch { return null; }
  // }

  // --- DEV fallback ---
  const hit = DEV_DATA.contacts.find((c) => c.slug === slug);
  return hit ?? null;
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "";
  const b = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (a + b).toUpperCase();
}