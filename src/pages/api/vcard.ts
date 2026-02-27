// src/pages/api/vcard.ts
import type { APIRoute } from "astro";
import { getContactBySlug } from "../../lib/contacts";

function escVCard(value: string) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .trim();
}

function bestEffortN(fullName?: string) {
  const parts = String(fullName ?? "").trim().split(/\s+/).filter(Boolean);
  // vCard wants: N:Family;Given;Additional;Prefix;Suffix
  // Best-effort: first token = family, rest = given (matches your earlier approach)
  const family = parts.length >= 2 ? parts[0] : "";
  const given = parts.length >= 2 ? parts.slice(1).join(" ") : parts[0] ?? "";
  return { family, given };
}

export const GET: APIRoute = async ({ url, locals }) => {
  const slug = url.searchParams.get("slug") ?? "";
  const mode = (url.searchParams.get("m") ?? "public").toLowerCase();
  const token = url.searchParams.get("t") ?? "";

  if (!slug) return new Response("Missing slug", { status: 400 });

  const env = (locals as any)?.runtime?.env ?? {};
  const contact = await getContactBySlug({ slug, env });
  if (!contact) return new Response("Not found", { status: 404 });

  // ✅ Global offline key (no per-contact tokens)
  const offlineKey = String(env?.OFFLINE_KEY ?? "").trim();
  const tokenValid =
    mode === "offline" &&
    token.length >= 10 &&
    offlineKey.length >= 10 &&
    token === offlineKey;

  const lines: string[] = ["BEGIN:VCARD", "VERSION:3.0"];

  // FN
  if (contact.fullName) lines.push(`FN:${escVCard(contact.fullName)}`);

  // N
  const { family, given } = bestEffortN(contact.fullName);
  lines.push(`N:${escVCard(family)};${escVCard(given)};;;`);

  // TEL (offline only)
  if (tokenValid && contact.phone) {
    lines.push(`TEL;TYPE=CELL:${escVCard(contact.phone)}`);
  }

  // EMAIL + TITLE
  if (contact.email) lines.push(`EMAIL:${escVCard(contact.email)}`);
  if (contact.headline) lines.push(`TITLE:${escVCard(contact.headline)}`);

  // URL: prefer website, else LinkedIn
  const primaryUrl = contact.website || contact.linkedin;
  if (primaryUrl) lines.push(`URL:${escVCard(primaryUrl)}`);

  // NOTE: oneLiner + LinkedIn (always if exists)
  const notes: string[] = [];
  if (contact.oneLiner) notes.push(contact.oneLiner);
  if (contact.linkedin) notes.push(`LinkedIn: ${contact.linkedin}`);
  if (notes.length > 0) lines.push(`NOTE:${escVCard(notes.join("\n"))}`);

  lines.push("END:VCARD");

  const vcf = lines.join("\r\n") + "\r\n";

  return new Response(vcf, {
    status: 200,
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${contact.slug}.vcf"`,
      "Cache-Control": tokenValid ? "no-store" : "public, max-age=300",
    },
  });
};