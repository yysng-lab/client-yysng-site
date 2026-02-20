// functions/api/vcard.ts
import type { PagesFunction } from "@cloudflare/workers-types";
import contactsDev from "../../data/contacts.dev.json";

type ContactRecord = {
  slug: string;
  fullName: string;
  headline?: string;
  email: string;
  phone?: string;
  website?: string;
  privateToken?: string;
};

type DevFile = { contacts: ContactRecord[] };
const DEV_DATA = contactsDev as unknown as DevFile;

function sanitize(v?: string): string {
  return String(v ?? "").replace(/\r?\n/g, " ").trim();
}

function buildVcard(opts: { contact: ContactRecord; includeTel: boolean }): string {
  const c = opts.contact;
  const lines: string[] = [];

  lines.push("BEGIN:VCARD");
  lines.push("VERSION:3.0");
  lines.push(`FN:${sanitize(c.fullName)}`);

  if (opts.includeTel && c.phone) {
    lines.push(`TEL;TYPE=CELL:${sanitize(c.phone)}`);
  }

  lines.push(`EMAIL:${sanitize(c.email)}`);

  if (c.headline) lines.push(`TITLE:${sanitize(c.headline)}`);

  // Website fallback logic (important)
  const primaryUrl = c.website || (c as any).linkedin;
  if (primaryUrl) lines.push(`URL:${sanitize(primaryUrl)}`);

  lines.push("END:VCARD");

  return lines.join("\r\n") + "\r\n";
}

async function getContact(slug: string, env: any): Promise<ContactRecord | null> {
  // PROD: KV
  const kv = env?.CONTACTS_KV as KVNamespace | undefined;
  if (kv) {
    const raw = await kv.get(`contact:${slug}`);
    if (raw) {
      try {
        return JSON.parse(raw) as ContactRecord;
      } catch {
        return null;
      }
    }
  }

  // DEV: file fallback
  return DEV_DATA.contacts.find((c) => c.slug === slug) ?? null;
}

export const onRequestGet: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const slug = url.searchParams.get("slug") ?? "";
  const mode = (url.searchParams.get("m") ?? "public").toLowerCase();
  const token = url.searchParams.get("t") ?? "";

  if (!slug) return new Response("Missing slug", { status: 400 });

  const contact = await getContact(slug, context.env);
  if (!contact) return new Response("Contact not found", { status: 404 });

  const wantsOffline = mode === "offline";
  const tokenValid =
    wantsOffline &&
    typeof contact.privateToken === "string" &&
    contact.privateToken.length >= 20 &&
    token.length >= 20 &&
    token === contact.privateToken;

  const vcf = buildVcard({ contact, includeTel: tokenValid });

  const headers = new Headers();
  headers.set("Content-Type", "text/vcard; charset=utf-8");
  headers.set("Content-Disposition", `attachment; filename="${slug}.vcf"`);

  // Cache rules
  headers.set("Cache-Control", tokenValid ? "no-store" : "public, max-age=300");

  return new Response(vcf, { status: 200, headers });
};