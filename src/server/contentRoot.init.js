import { setContentRoot } from "@yysng/astro-boilerplate";

export function initContentRoot() {
  setContentRoot(new URL("../content", import.meta.url).pathname);
}