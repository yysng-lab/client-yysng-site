import { initContentRoot } from "./server/contentRoot.init.js";

export async function onRequest(context, next) {
  initContentRoot();
  return next();
}