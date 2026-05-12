// Replaced by /api/search — proxies to it for backward compatibility.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const limit = url.searchParams.get("limit") ?? "6";
  const target = new URL(`/api/search?q=${encodeURIComponent(q)}&limit=${limit}`, url);
  const res = await fetch(target);
  return res;
}
