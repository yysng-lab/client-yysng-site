import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const sizes = [640, 960, 1280, 1920];

// SOURCE + OUTPUT paths (your case)
const inputDir = path.resolve("public/images/home-sections/src");
const outputDir = path.resolve("public/images/home-sections/gen");

await fs.mkdir(outputDir, { recursive: true });

const files = await fs.readdir(inputDir);

for (const file of files) {
  if (!file.match(/\.(png|jpe?g|webp)$/i)) continue;

  const inPath = path.join(inputDir, file);
  const base = file.replace(/\.(png|jpe?g|webp)$/i, "");

  // generate responsive sizes
  for (const w of sizes) {
    const outPath = path.join(outputDir, `${base}-${w}.webp`);
    await sharp(inPath)
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: 78 })
      .toFile(outPath);
  }

  // default src image (960px)
  const defaultOut = path.join(outputDir, `${base}.webp`);
  await sharp(inPath)
    .resize({ width: 960, withoutEnlargement: true })
    .webp({ quality: 78 })
    .toFile(defaultOut);

  console.log(`✅ Generated responsive images for ${file}`);
}