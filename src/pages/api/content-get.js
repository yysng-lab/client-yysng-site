export const prerender = false;

export async function GET({ locals, url }) {
  const env = locals?.runtime?.env ?? {};
  const section = url.searchParams.get("section") || "hero";
  const key = `${section}.json`;

  // 1️⃣ Production: read from KV
  if (env.CONTENT_KV) {
    const raw = await env.CONTENT_KV.get(key);
    return new Response(
      JSON.stringify({
        source: "kv",
        section,
        key,
        data: raw ? JSON.parse(raw) : null,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  // 2️⃣ Local dev: read from filesystem
  try {
    const { readFile } = await import("node:fs/promises");
    const { join } = await import("node:path");

    const filePath = join(process.cwd(), "src", "content", key);
    const raw = await readFile(filePath, "utf-8");

    return new Response(
      JSON.stringify({
        source: "fs",
        section,
        key,
        data: JSON.parse(raw),
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        source: "fs",
        section,
        key,
        data: null,
        error: "Content not found",
      }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }
}