import { execSync } from "node:child_process";
import fs from "node:fs";

const NAMESPACE_ID = "c883891654e44a3ab6633c2a9e84cde9";
const slug = process.argv[2];

if (!slug) {
  console.error("Usage: npm run add-contact -- <slug>");
  process.exit(1);
}

console.log(`\n[1/4] Reading contacts.dev.json for slug: ${slug}`);

const raw = fs.readFileSync("./src/data/contacts.dev.json", "utf8");
const data = JSON.parse(raw);
const contact = data.contacts?.find((c) => c.slug === slug);

if (!contact) {
  console.error(`❌ Contact not found in contacts.dev.json: ${slug}`);
  process.exit(1);
}

console.log("✅ Found contact:");
console.log(JSON.stringify(contact, null, 2));

console.log(`\n[2/4] Uploading contact:${slug} to KV...`);
execSync(
  `npx wrangler kv key put --remote --namespace-id=${NAMESPACE_ID} "contact:${slug}" '${JSON.stringify(contact)}'`,
  { stdio: "inherit" }
);

console.log(`\n[3/4] Reading contacts:index...`);
let indexRaw = "";
try {
  indexRaw = execSync(
    `npx wrangler kv key get --remote --namespace-id=${NAMESPACE_ID} "contacts:index"`,
    { encoding: "utf8" }
  ).trim();
} catch {
  indexRaw = "";
}

let index = [];
try {
  index = indexRaw ? JSON.parse(indexRaw) : [];
} catch {
  index = [];
}

if (!index.includes(slug)) {
  index.push(slug);
}

console.log("✅ New contacts:index:");
console.log(JSON.stringify(index));

console.log(`\n[4/4] Writing updated contacts:index...`);
execSync(
  `npx wrangler kv key put --remote --namespace-id=${NAMESPACE_ID} "contacts:index" '${JSON.stringify(index)}'`,
  { stdio: "inherit" }
);

console.log("\n🎉 Done");
console.log(`Card: https://yysng.me/card/${slug}`);
console.log(`QR:   https://yysng.me/qr?k=YOUR_INTERNAL_QR_KEY`);