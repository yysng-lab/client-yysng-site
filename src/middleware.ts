import type { MiddlewareHandler } from "astro";

const PROTECTED_PREFIXES = ["/ai-editor", "/qr"]; // add/remove paths you want gated
const COOKIE_NAME = "yy_gate";
const COOKIE_VALUE = "1";
const ONE_DAY = 60 * 60 * 24;

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

function hasCookie(cookieHeader: string | null) {
  if (!cookieHeader) return false;
  return cookieHeader.split(";").some((c) => c.trim() === `${COOKIE_NAME}=${COOKIE_VALUE}`);
}

export const onRequest: MiddlewareHandler = async (ctx, next) => {
  const url = new URL(ctx.request.url);

  // Only gate selected paths
  if (!isProtectedPath(url.pathname)) return next();

  const env = (ctx.locals as any)?.runtime?.env ?? {};
  const offlineKey = String(env.INTERNAL_QR_KEY ?? "").trim();

  // If you forgot to set OFFLINE_KEY, fail closed (404)
  if (!offlineKey) return new Response("Not found", { status: 404 });

  // Already authed via cookie
  if (hasCookie(ctx.request.headers.get("cookie"))) {
    return next();
  }

  // First-time unlock via query param
  const k = url.searchParams.get("k") ?? "";
  if (k && k === offlineKey) {
    const res = await next();
    res.headers.append(
      "Set-Cookie",
      `${COOKIE_NAME}=${COOKIE_VALUE}; Path=/; Max-Age=${ONE_DAY}; HttpOnly; Secure; SameSite=Lax`
    );
    return res;
  }

  // Otherwise: pretend it doesn't exist
  return new Response("Not found", { status: 404 });
};