import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  output: "server",

  adapter: cloudflare({
    mode: "advanced",
  }),

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
        // Edge-safe: prevent Node builtins from bundling into production
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        os: false,

        // Edge-safe unstorage shim
        unstorage: new URL("./src/shims/unstorage-edge.js", import.meta.url).pathname,
      },
    },
  },
});