// src/pages/api/vcard.ts
import type { APIRoute } from "astro";
import { getContactBySlug } from "../../lib/contacts";

function escVCard(value: string) {
  // vCard v3 escaping basics
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

export const GET: APIRoute = async ({ url, locals }) => {
  const slug = url.searchParams.get("slug") ?? "";
  const m = url.searchParams.get("m") ?? "public";
  const t = url.searchParams.get("t") ?? "";

  if (!slug) {
    return new Response("Missing slug", { status: 400 });
  }

  const contact = await getContactBySlug({
    slug,
    env: (locals as any)?.runtime?.env ?? {},
  });

  if (!contact) {
    return new Response("Not found", { status: 404 });
  }

  // Offline mode includes TEL only if token matches
  const tokenValid =
    m === "offline" &&
    t &&
    contact.privateToken &&
    t === contact.privateToken;

  const lines: string[] = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${escVCard(contact.fullName)}`,
  ];

  if (tokenValid && contact.phone) {
    lines.push(`TEL;TYPE=CELL:${escVCard(contact.phone)}`);
  }

  lines.push(`EMAIL:${escVCard(contact.email)}`);

  if (contact.company) lines.push(`ORG:${escVCard(contact.company)}`);
  if (contact.headline) lines.push(`TITLE:${escVCard(contact.headline)}`);
  if (contact.website) lines.push(`URL:${escVCard(contact.website)}`);

  lines.push("END:VCARD");

  const vcf = lines.join("\r\n") + "\r\n";

  const headers = new Headers({
    "Content-Type": "text/vcard; charset=utf-8",
    "Content-Disposition": `attachment; filename="${contact.slug}.vcf"`,
    // safer caching policy for private mode
    "Cache-Control": tokenValid ? "no-store" : "public, max-age=300",
  });

  return new Response(vcf, { status: 200, headers });
};