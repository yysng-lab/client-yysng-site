import { execSync } from "node:child_process";

const NS = "c883891654e44a3ab6633c2a9e84cde9";

function kvGet(key) {
  try {
    return execSync(
      `npx wrangler kv key get --remote --namespace-id=${NS} "${key}"`,
      { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }
    ).trim();
  } catch (err) {
    const stderr = String(err?.stderr || "");
    const stdout = String(err?.stdout || "");

    if (stderr.includes("404: Not Found") || stdout.includes("404: Not Found")) {
      return "";
    }

    throw err;
  }
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

const slugs = JSON.parse(kvGet("contacts:index") || "[]");
const t = today();

const rows = [];

for (const slug of slugs) {
  const contactRaw = kvGet(`contact:${slug}`);
  if (!contactRaw) continue;

  const contact = JSON.parse(contactRaw);
  const views = Number(kvGet(`metrics:open:${slug}:${t}`) || 0);

  rows.push({
    name: contact.fullName,
    slug,
    views,
  });
}

rows
  .sort((a, b) => b.views - a.views)
  .forEach((r) => {
    console.log(`${r.name} (${r.slug}) — ${r.views} views`);
  });