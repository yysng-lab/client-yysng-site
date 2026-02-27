import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://yysng.me", // ✅ REQUIRED for sitemap URLs

  output: "server",

  integrations: [
  sitemap({
    filter: (page) => !page.includes('/qr'),
  }),
],

  adapter: cloudflare({
    mode: "advanced",
  }),

  build: {
    inlineStylesheets: "auto",
  },

  image: {
    service: {
      entrypoint: "@astrojs/image/services/compile",
    },
  },

  vite: {
    plugins: [tailwindcss()],
    resolve: {
      dedupe: ["@yysng/astro-boilerplate"],
      alias: {
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        os: false,
        unstorage: new URL("./src/shims/unstorage-edge.js", import.meta.url).pathname,
      },
    },
  },
});