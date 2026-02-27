import * as QRCode from "qrcode";

type ContactLite = { slug: string; fullName: string };

function $(id: string) {
  return document.getElementById(id) as HTMLElement | null;
}

function buildTargetUrl(slug: string, mode: "public" | "offline", token?: string) {
  const base = window.location.origin;
  let u = `${base}/card/${encodeURIComponent(slug)}`;

  if (mode === "offline" && token) {
    u += `?m=offline&t=${encodeURIComponent(token)}`;
  }

  return u;
}

function safeFileName(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]+/g, "");
}

async function loadContacts(): Promise<ContactLite[]> {
  const res = await fetch("/api/contacts-list", { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`contacts-list failed: ${res.status}`);
  const data = (await res.json()) as { contacts?: ContactLite[] };
  return Array.isArray(data.contacts) ? data.contacts : [];
}

async function render() {
  const contactSel = $("contact") as HTMLSelectElement | null;
  const modeSel = $("mode") as HTMLSelectElement | null;
  const tokenWrap = $("tokenWrap") as HTMLLabelElement | null;
  const tokenInput = $("token") as HTMLInputElement | null;
  const canvas = $("qr") as HTMLCanvasElement | null;
  const urlBox = $("url") as HTMLElement | null;
  const hint = $("hint") as HTMLElement | null;

  if (!contactSel || !modeSel || !tokenWrap || !tokenInput || !canvas || !urlBox || !hint) return;
  if (!contactSel.value) return;

  const slug = contactSel.value;
  const fullName = contactSel.selectedOptions?.[0]?.getAttribute("data-name") ?? slug;
  const mode = (modeSel.value as "public" | "offline") ?? "public";

  tokenWrap.style.display = mode === "offline" ? "inline-flex" : "none";

  const token = mode === "offline" ? tokenInput.value.trim() : "";
  const targetUrl = buildTargetUrl(slug, mode, token);

  urlBox.textContent = targetUrl;

  hint.textContent =
    mode === "offline"
      ? "Offline QR includes token. Only use for your NFC / controlled sharing."
      : "Public QR is safe to share.";

  await QRCode.toCanvas(canvas, targetUrl, {
    width: 320,
    margin: 1,
    errorCorrectionLevel: "M",
  });

  // Download handler (named)
  const downloadBtn = $("downloadPng") as HTMLButtonElement | null;
  if (downloadBtn) {
    downloadBtn.onclick = () => {
      const a = document.createElement("a");
      const niceName = safeFileName(fullName) || slug;
      a.download = `qr-${niceName}-${slug}-${mode}.png`;
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

async function init() {
  const contactSel = $("contact") as HTMLSelectElement | null;
  const modeSel = $("mode") as HTMLSelectElement | null;
  const tokenInput = $("token") as HTMLInputElement | null;

  if (!contactSel || !modeSel || !tokenInput) return;

  // populate contacts
  contactSel.innerHTML = `<option value="" selected>Select…</option>`;
  try {
    const contacts = await loadContacts();
    if (!contacts.length) {
      contactSel.innerHTML = `<option value="" selected>No contacts found</option>`;
      return;
    }

    for (const c of contacts) {
      const opt = document.createElement("option");
      opt.value = c.slug;
      opt.textContent = `${c.fullName} (${c.slug})`;
      opt.setAttribute("data-name", c.fullName);
      contactSel.appendChild(opt);
    }

    // default to first real option
    contactSel.value = contacts[0].slug;
  } catch (e) {
    contactSel.innerHTML = `<option value="" selected>Failed to load</option>`;
    console.error(e);
    return;
  }

  contactSel.addEventListener("change", () => void render());
  modeSel.addEventListener("change", () => void render());
  tokenInput.addEventListener("input", () => void render());

  await render();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => void init(), { once: true });
} else {
  void init();
}