import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const INPUT_DIR = path.join(ROOT, "public", "images", "coaches");
const OUTPUT_DIR = path.join(ROOT, "public", "images", "coaches", "gen");

// Only process these image types
const ALLOWED_EXT = new Set([".png", ".jpg", ".jpeg", ".webp"]);

const SIZES = [144, 288];

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function listFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .filter((name) => ALLOWED_EXT.has(path.extname(name).toLowerCase()))
    // skip already-generated folder if someone accidentally points script there
    .filter((name) => !name.includes("/gen/"));
}

function baseName(file) {
  // "serene.webp" -> "serene"
  return path.parse(file).name;
}

async function buildOne(file) {
  const inputPath = path.join(INPUT_DIR, file);
  const name = baseName(file);

  // Read once, reuse pipeline
  const img = sharp(inputPath, { failOn: "none" }).rotate();

  for (const size of SIZES) {
    const outPath = path.join(OUTPUT_DIR, `${name}-${size}.webp`);

    await img
      .clone()
      // square crop centered (good for headshots)
      .resize(size, size, {
        fit: "cover",
        position: "centre",
      })
      .webp({
        quality: 82,
        effort: 5,
      })
      .toFile(outPath);
  }

  return name;
}

async function main() {
  await ensureDir(OUTPUT_DIR);

  const files = await listFiles(INPUT_DIR);
  if (files.length === 0) {
    console.log(`No images found in: ${INPUT_DIR}`);
    return;
  }

  console.log(`Found ${files.length} coach images. Generating variants...`);

  const done = [];
  for (const f of files) {
    // Skip files that are already variants like serene-144.webp if present
    if (/-\d+$/.test(baseName(f))) continue;

    const n = await buildOne(f);
    done.push(n);
    console.log(`✓ ${n}`);
  }

  console.log(`\nDone. Output in: ${OUTPUT_DIR}`);
  console.log(`Generated sizes: ${SIZES.join(", ")} px`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});