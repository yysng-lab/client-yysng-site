import sharp from "sharp";
import fs from "fs";
import path from "path";

const input = process.argv[2];

if (!input) {
  console.log("❌ Usage: npm run to-webp -- <image-path>");
  process.exit(1);
}

if (!fs.existsSync(input)) {
  console.log("❌ File not found:", input);
  process.exit(1);
}

const ext = path.extname(input).toLowerCase();
if (![".jpg", ".jpeg", ".png"].includes(ext)) {
  console.log("❌ Only jpg, jpeg, png supported");
  process.exit(1);
}

const output = input.replace(ext, ".webp");

(async () => {
  try {
    await sharp(input)
      .resize(512, 512, {
        fit: "cover",
        position: "center",
      })
      .webp({ quality: 80 })
      .toFile(output);

    console.log(`✅ Converted: ${input} -> ${output}`);
  } catch (err) {
    console.error("❌ Error converting image:", err);
    process.exit(1);
  }
})();