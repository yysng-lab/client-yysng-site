import * as QRCode from "qrcode";

type ContactLite = {
  slug: string;
  fullName: string;
  privateToken?: string;
};

declare global {
  interface Window {
    __CONTACTS__?: ContactLite[];
  }
}

function $(id: string) {
  return document.getElementById(id) as HTMLElement | null;
}

function buildTargetUrl(slug: string, mode: "public" | "offline", token?: string) {
  const base = window.location.origin; // works on localhost + production
  let url = `${base}/card/${encodeURIComponent(slug)}`;

  if (mode === "offline" && token) {
    url += `?m=offline&t=${encodeURIComponent(token)}`;
  }

  return url;
}

async function render() {
  const contacts = window.__CONTACTS__ ?? [];
  const contactSel = $("contact") as HTMLSelectElement | null;
  const modeSel = $("mode") as HTMLSelectElement | null;
  const canvas = $("qr") as HTMLCanvasElement | null;
  const urlBox = $("url") as HTMLElement | null;

  if (!contactSel || !modeSel || !canvas || !urlBox) return;
  if (contacts.length === 0) return;

  const slug = contactSel.value;
  const mode = (modeSel.value as "public" | "offline") ?? "public";

  const contact = contacts.find((c) => c.slug === slug);
  const token = mode === "offline" ? (contact?.privateToken ?? "") : "";

  const targetUrl = buildTargetUrl(slug, mode, token);
  urlBox.textContent = targetUrl;

  // Generate QR into canvas
  await QRCode.toCanvas(canvas, targetUrl, {
    width: 320,
    margin: 1,
    errorCorrectionLevel: "M",
  });

  // Download handler
  const downloadBtn = $("downloadPng") as HTMLButtonElement | null;
  if (downloadBtn) {
    downloadBtn.onclick = () => {
      const a = document.createElement("a");
      a.download = `qr-${slug}-${mode}.png`;
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
        copyBtn.textContent = "Copied!";
        setTimeout(() => (copyBtn.textContent = "Copy URL"), 900);
      } catch {
        // fallback
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

function bind() {
  const contactSel = $("contact") as HTMLSelectElement | null;
  const modeSel = $("mode") as HTMLSelectElement | null;

  contactSel?.addEventListener("change", () => void render());
  modeSel?.addEventListener("change", () => void render());

  void render();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bind, { once: true });
} else {
  bind();
}