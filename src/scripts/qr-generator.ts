import QRCode from "qrcode";

declare global {
  interface Window {
    __CONTACTS__?: Array<{ slug: string; fullName: string; privateToken?: string }>;
  }
}

const contacts = window.__CONTACTS__ || [];

const elContact = document.getElementById("contact") as HTMLSelectElement | null;
const elMode = document.getElementById("mode") as HTMLSelectElement | null;
const canvas = document.getElementById("qr") as HTMLCanvasElement | null;
const elUrl = document.getElementById("url") as HTMLElement | null;

const btnDownload = document.getElementById("downloadPng") as HTMLButtonElement | null;
const btnCopy = document.getElementById("copyUrl") as HTMLButtonElement | null;

if (!elContact || !elMode || !canvas || !elUrl) {
  console.warn("QR generator: missing DOM elements");
} else {
  function getSelected() {
    const slug = elContact.value;
    const mode = elMode.value;
    const c = contacts.find((x) => x.slug === slug);
    return { slug, mode, c };
  }

  function buildTargetUrl(sel: { slug: string; mode: string; c?: any }) {
    const base = window.location.origin;
    let url = `${base}/card/${encodeURIComponent(sel.slug)}`;

    if (sel.mode === "offline") {
      const token = sel.c?.privateToken || "";
      if (token) url += `?m=offline&t=${encodeURIComponent(token)}`;
    }

    return url;
  }

  async function render() {
    const sel = getSelected();
    const targetUrl = buildTargetUrl(sel);

    elUrl.textContent = targetUrl;

    await QRCode.toCanvas(canvas, targetUrl, {
    width: 320,
    errorCorrectionLevel: "M",
    margin: 2,
    color: {
    dark: "#000000",
    light: "#ffffff",
    }
    });
  }

  elContact.addEventListener("change", render);
  elMode.addEventListener("change", render);

  btnCopy?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(elUrl.textContent || "");
      btnCopy.textContent = "Copied!";
      setTimeout(() => (btnCopy.textContent = "Copy URL"), 900);
    } catch {
      alert("Copy failed. You can manually copy the Target URL.");
    }
  });

  function slugifyFilename(s: string = "") {
  return s
    .toString()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-_]/g, "")
    .replace(/-+/g, "-");
}

function buildFilename(slug: string, fullName: string, mode: string) {
  const name = fullName ? slugifyFilename(fullName) : "";
  const base = name ? `${name}_${slug}` : slug;

  const safeMode =
    mode === "offline" ? "offline_PRIVATE" : "public";

  return `${base}_${safeMode}.png`;
}

btnDownload?.addEventListener("click", () => {
  if (!canvas || !elContact || !elMode) return;

  const slug = elContact.value;
  const mode = elMode.value;

  const selectedText =
    elContact.options[elContact.selectedIndex]?.textContent || "";

  const fullName = selectedText.replace(/\s*\(.*\)\s*$/, "");

  const filename = buildFilename(slug, fullName, mode);

  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
});

  render();
}