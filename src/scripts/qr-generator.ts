// src/scripts/qr-generator.ts
import * as QRCode from "qrcode";

type ContactLite = {
  slug: string;
  fullName: string;
};

function $(id: string) {
  return document.getElementById(id) as HTMLElement | null;
}

function buildTargetUrl(slug: string, mode: "public" | "offline", token?: string) {
  const base = window.location.origin; // localhost + production
  let url = `${base}/card/${encodeURIComponent(slug)}`;

  if (mode === "offline" && token && token.trim().length > 0) {
    url += `?m=offline&t=${encodeURIComponent(token.trim())}`;
  }

  return url;
}

function sanitizeFilePart(s: string) {
  return String(s || "")
    .trim()
    .replace(/[^\w\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "")
    .toLowerCase();
}

async function fetchContacts(): Promise<ContactLite[]> {
  const res = await fetch("/api/contacts-list", { cache: "no-store" });
  if (!res.ok) return [];
  const data = (await res.json()) as { contacts?: ContactLite[] };
  return Array.isArray(data.contacts) ? data.contacts : [];
}

async function render(state: { contacts: ContactLite[] }) {
  const contactSel = $("contact") as HTMLSelectElement | null;
  const modeSel = $("mode") as HTMLSelectElement | null;
  const tokenWrap = $("tokenWrap") as HTMLLabelElement | null;
  const tokenInput = $("token") as HTMLInputElement | null;
  const canvas = $("qr") as HTMLCanvasElement | null;
  const urlBox = $("url") as HTMLElement | null;

  if (!contactSel || !modeSel || !tokenWrap || !tokenInput || !canvas || !urlBox) return;
  if (state.contacts.length === 0) return;

  const slug = contactSel.value || state.contacts[0].slug;
  const mode = (modeSel.value as "public" | "offline") || "public";

  // show/hide token input
  tokenWrap.style.display = mode === "offline" ? "inline-block" : "none";

  const contact = state.contacts.find((c) => c.slug === slug) ?? state.contacts[0];
  const token = mode === "offline" ? tokenInput.value : "";

  const targetUrl = buildTargetUrl(contact.slug, mode, token);
  urlBox.textContent = targetUrl;

  await QRCode.toCanvas(canvas, targetUrl, {
    width: 320,
    margin: 1,
    errorCorrectionLevel: "M",
  });

  // Download handler (name + slug + mode)
  const downloadBtn = $("downloadPng") as HTMLButtonElement | null;
  if (downloadBtn) {
    downloadBtn.onclick = () => {
      const a = document.createElement("a");
      const safeName = sanitizeFilePart(contact.fullName);
      const safeSlug = sanitizeFilePart(contact.slug);
      a.download = `qr-${safeName || "contact"}-${safeSlug}-${mode}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
  }

  // Copy URL handler
  const copyBtn = $("copyUrl") as HTMLButtonElement | null;
  if (copyBtn) {
    copyBtn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(targetUrl);
        const prev = copyBtn.textContent;
        copyBtn.textContent = "Copied!";
        setTimeout(() => (copyBtn.textContent = prev || "Copy URL"), 900);
      } catch {
        const ta = document.createElement("textarea");
        ta.value = targetUrl;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
    };
  }
}

function bind(state: { contacts: ContactLite[] }) {
  const contactSel = $("contact") as HTMLSelectElement | null;
  const modeSel = $("mode") as HTMLSelectElement | null;
  const tokenInput = $("token") as HTMLInputElement | null;

  contactSel?.addEventListener("change", () => void render(state));
  modeSel?.addEventListener("change", () => void render(state));
  tokenInput?.addEventListener("input", () => void render(state)); // live update QR

  void render(state);
}

async function init() {
  const contactSel = $("contact") as HTMLSelectElement | null;
  if (!contactSel) return;

  const contacts = await fetchContacts();

  // Populate dropdown
  contactSel.innerHTML = "";
  if (contacts.length === 0) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "No contacts found";
    contactSel.appendChild(opt);
    return;
  }

  for (const c of contacts) {
    const opt = document.createElement("option");
    opt.value = c.slug;
    opt.textContent = `${c.fullName} (${c.slug})`;
    contactSel.appendChild(opt);
  }

  bind({ contacts });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => void init(), { once: true });
} else {
  void init();
}