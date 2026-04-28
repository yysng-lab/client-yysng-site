import type { MiddlewareHandler } from "astro";

const COOKIE_NAME = "yy_gate";
const COOKIE_VALUE = "1";
const ONE_DAY = 60 * 60 * 24;

function hasCookie(cookieHeader: string | null) {
  if (!cookieHeader) return false;
  return cookieHeader
    .split(";")
    .some((c) => c.trim() === `${COOKIE_NAME}=${COOKIE_VALUE}`);
}

function keysFrom(value: unknown) {
  return String(value ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
}

export const onRequest: MiddlewareHandler = async (ctx, next) => {
  const url = new URL(ctx.request.url);
  const pathname = url.pathname;

  const isAiEditor =
    pathname === "/ai-editor" || pathname.startsWith("/ai-editor/");

  const isQr =
    pathname === "/qr" || pathname.startsWith("/qr/");

  if (!isAiEditor && !isQr) return next();

  const env = (ctx.locals as any)?.runtime?.env ?? {};

  if (hasCookie(ctx.request.headers.get("cookie"))) {
    return next();
  }

  const k = url.searchParams.get("k") ?? "";

  let allowedKeys: string[] = [];

  if (isQr) {
    allowedKeys = keysFrom(env.INTERNAL_QR_KEY);
  }

  if (isAiEditor) {
    allowedKeys = keysFrom(env.AI_EDITOR_KEYS);
  }

  if (!allowedKeys.length) {
    return new Response("Not found", { status: 404 });
  }

  if (k && allowedKeys.includes(k)) {
    const res = await next();
    res.headers.append(
      "Set-Cookie",
      `${COOKIE_NAME}=${COOKIE_VALUE}; Path=/; Max-Age=${ONE_DAY}; HttpOnly; Secure; SameSite=Lax`
    );
    return res;
  }

  return new Response("Not found", { status: 404 });
};