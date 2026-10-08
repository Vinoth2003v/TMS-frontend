// @ts-nocheck
const SPRING_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080/api';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const to = searchParams.get('to');
  const url = to ? `/notifications?to=${encodeURIComponent(to)}` : '/notifications';
  const authHeader = req.headers.get('Authorization');
  const headers: any = { 'Content-Type': 'application/json' };
  if (authHeader) headers['Authorization'] = authHeader;
  const res = await fetch(`${SPRING_URL}${url}`, { headers, cache: 'no-store' });
  return Response.json(await res.json(), { status: res.status });
}

export async function POST(req: Request) {
  const body = await req.json();
  const authHeader = req.headers.get('Authorization');
  const headers: any = { 'Content-Type': 'application/json' };
  if (authHeader) headers['Authorization'] = authHeader;
  const res = await fetch(`${SPRING_URL}/notifications`, { method: 'POST', headers, body: JSON.stringify(body), cache: 'no-store' });
  return Response.json(await res.json(), { status: res.status });
}
