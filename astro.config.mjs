import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  output: "server",

  // ✅ ONLY ONE adapter
  adapter: cloudflare({
    mode: "advanced" // keep this if you need it for pages/api routes
  }),

  image: {
    service: {
      entrypoint: "@astrojs/image/services/compile"
    }
  },

  vite: {
    resolve: {
      // ✅ Prevent duplicate instances of astro-boilerplate
      dedupe: ["@yysng/astro-boilerplate"],

      // ✅ Keep your edge-safe aliases
      alias: {
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        os: false,

        // Edge-safe unstorage
        unstorage: new URL("./src/shims/unstorage-edge.js", import.meta.url).pathname
      }
    }
  }
});