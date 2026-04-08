import "dotenv/config";
import { execSync } from "node:child_process";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

console.log("RESEND_API_KEY loaded:", Boolean(process.env.RESEND_API_KEY));
console.log("FROM_EMAIL:", process.env.FROM_EMAIL);
console.log("ADMIN_REPORT_EMAIL:", process.env.ADMIN_REPORT_EMAIL);

const NAMESPACE_ID = process.env.CONTACTS_KV_NAMESPACE_ID;
const ADMIN_REPORT_EMAIL = process.env.ADMIN_REPORT_EMAIL;
const FROM_EMAIL = process.env.FROM_EMAIL;
const SITE_BASE_URL = process.env.SITE_BASE_URL || "https://yysng.me";

// true = send all test emails to you only
const TEST_MODE = true;

function todayKeyPart() {
  return new Date().toISOString().slice(0, 10);
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
  const today = todayKeyPart();
  const indexRaw = kvGet("contacts:index") || "[]";
  const slugs = JSON.parse(indexRaw);

  const active = [];

  for (const slug of slugs) {
    const contactRaw = kvGet(`contact:${slug}`);
    if (!contactRaw) continue;

    const contact = JSON.parse(contactRaw);
    const views = Number(kvGet(`metrics:open:${slug}:${today}`) || 0);

    if (views <= 0) continue;

    active.push({
      slug,
      fullName: contact.fullName,
      email: contact.email,
      views
    });

    const toEmail = TEST_MODE ? ADMIN_REPORT_EMAIL : contact.email;

    if (!toEmail) {
      console.log(`Skipping owner email for ${contact.fullName} — no email available`);
      continue;
    }

    console.log(`Sending owner email for ${contact.fullName} → ${toEmail} (${views} views)`);

    const ownerResult = await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: `${views} people viewed your contact page today`,
      text: `Hi ${contact.fullName},

    ${views} people viewed your contact page today.

    If you're actively connecting with people, you can keep sharing it here:
    ${SITE_BASE_URL}/card/${slug}

    – YY`
    });

    console.log("Owner email result:", ownerResult);
  }

  if (active.length > 0 && ADMIN_REPORT_EMAIL) {
    const lines = active.map(
      (x) => `${x.fullName} (${x.slug}) — ${x.views} view${x.views === 1 ? "" : "s"}`
    );

    console.log(`Sending admin summary → ${ADMIN_REPORT_EMAIL}`);

    const adminResult = await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_REPORT_EMAIL,
      subject: `Daily vCard activity summary — ${today}`,
      text: `Active vCards today:

${lines.join("\n")}`
    });

    console.log("Admin summary result:", adminResult);
  }

  console.log(`Done. Active contacts today: ${active.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});