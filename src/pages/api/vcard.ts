import type { APIRoute } from "astro";
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

  const primaryUrl = c.website;
  if (primaryUrl) lines.push(`URL:${sanitize(primaryUrl)}`);

  lines.push("END:VCARD");

  return lines.join("\r\n") + "\r\n";
}

async function getContact(slug: string): Promise<ContactRecord | null> {
  return DEV_DATA.contacts.find((c) => c.slug === slug) ?? null;
}

export const GET: APIRoute = async ({ url }) => {
  const slug = url.searchParams.get("slug") ?? "";
  const mode = (url.searchParams.get("m") ?? "public").toLowerCase();
  const token = url.searchParams.get("t") ?? "";

  if (!slug) {
    return new Response("Missing slug", { status: 400 });
  }

  const contact = await getContact(slug);
  if (!contact) {
    return new Response("Contact not found", { status: 404 });
  }

  const wantsOffline = mode === "offline";
  const tokenValid =
    wantsOffline &&
    typeof contact.privateToken === "string" &&
    token === contact.privateToken;

  const vcf = buildVcard({ contact, includeTel: tokenValid });

  return new Response(vcf, {
    status: 200,
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}.vcf"`,
      "Cache-Control": tokenValid ? "no-store" : "public, max-age=300",
    },
  });
};