import "dotenv/config";
import { execSync } from "node:child_process";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const NAMESPACE_ID = process.env.CONTACTS_KV_NAMESPACE_ID;
const FROM_EMAIL = process.env.FROM_EMAIL;
const SITE_BASE_URL = process.env.SITE_BASE_URL || "https://yysng.me";

function dateKey(daysAgo) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function kvGet(key) {
  try {
    return execSync(
      `npx wrangler kv key get --remote --namespace-id=${NAMESPACE_ID} "${key}"`,
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

async function main() {
  const indexRaw = kvGet("contacts:index") || "[]";
  const slugs = JSON.parse(indexRaw);

  for (const slug of slugs) {
    const contactRaw = kvGet(`contact:${slug}`);
    if (!contactRaw) continue;

    const contact = JSON.parse(contactRaw);
    if (!contact.email) continue;

    let total7d = 0;
    for (let i = 0; i < 7; i++) {
      total7d += Number(kvGet(`metrics:open:${slug}:${dateKey(i)}`) || 0);
    }

    if (total7d === 0) {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: contact.email,
        subject: `Your contact page is still ready to use`,
        text: `${contact.fullName},\n\nJust a small reminder — your contact page is still live if you want to use it for follow-ups or networking.\n\n${SITE_BASE_URL}/card/${slug}\n`
      });
    }
  }

  console.log("Weekly nudge run complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});