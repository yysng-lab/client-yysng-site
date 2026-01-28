import path from "node:path";
import fs from "node:fs";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";

import { setContentRoot } from "@yysng/astro-boilerplate";

let inited = false;

function findPackageRoot(fromFile) {
  let dir = path.dirname(fromFile);
  while (dir && dir !== path.parse(dir).root) {
    if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    dir = path.dirname(dir);
  }
  return null;
}

export async function initContentRootNode() {
  if (inited) return;

  // 0) Set content root for local filesystem writes
  const root = path.resolve(process.cwd(), "src", "content");
  if (!root || typeof root !== "string") {
    throw new Error(`[CONTENT_ROOT] invalid root: ${String(root)}`);
  }

  // 1) Public export instance
  setContentRoot(root);
  globalThis.__CONTENT_ROOT__ = root;

  // 2) Internal instance used by storage.node.js
  const require = createRequire(import.meta.url);

  // IMPORTANT: resolve the package ENTRY (allowed), not package.json (blocked by exports)
  const entryFile = require.resolve("@yysng/astro-boilerplate");
  const pkgRoot = findPackageRoot(entryFile);

  if (!pkgRoot) {
    throw new Error(`[CONTENT_ROOT] could not locate package root from: ${entryFile}`);
  }

  const internalConfigPath = path.join(pkgRoot, "src", "content-system", "config.js");

  const internal = await import(
    /* @vite-ignore */ pathToFileURL(internalConfigPath).href
  );

  if (typeof internal.setContentRoot !== "function") {
    throw new Error(`[CONTENT_ROOT] internal setContentRoot missing at ${internalConfigPath}`);
  }

  internal.setContentRoot(root);

  console.log("[CONTENT_ROOT] set to:", root);
  console.log("[CONTENT_ROOT] internal config set OK:", internalConfigPath);

  inited = true;
}