// @ts-nocheck
const SPRING_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080/api';

async function getHeaders(req: Request) {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  const auth = req.headers.get('Authorization');
  if (auth) h['Authorization'] = auth;
  return h;
}

export async function GET(req: Request) {
  const headers = await getHeaders(req);
  const res = await fetch(`${SPRING_URL}/users`, { headers, cache: 'no-store' });
  return Response.json(await res.json(), { status: res.status });
}
