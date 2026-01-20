export async function GET() {
  return new Response(
    JSON.stringify({
      ok: true,
      env: import.meta.env.MODE,
      timestamp: new Date().toISOString()
    }),
    { headers: { "content-type": "application/json" } }
  );
}