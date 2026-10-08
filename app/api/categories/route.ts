// @ts-nocheck
const SPRING_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080/api';

async function getHeaders(req) {
  const h = { 'Content-Type': 'application/json' };
  const auth = req.headers.get('Authorization');
  if (auth) h['Authorization'] = auth;
  return h;
}

export async function GET(req) {
  const headers = await getHeaders(req);
  const res = await fetch(`${SPRING_URL}/categories`, { headers, cache: 'no-store' });
  const data = await res.json().catch(() => ([]));
  return Response.json(data, { status: res.status });
}

export async function POST(req) {
  const body = await req.json();
  const headers = await getHeaders(req);
  const res = await fetch(`${SPRING_URL}/categories`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  return Response.json(data, { status: res.status });
}
