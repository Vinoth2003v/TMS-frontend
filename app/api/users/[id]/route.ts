// @ts-nocheck
const SPRING_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080/api';

async function getHeaders(req: Request) {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  const auth = req.headers.get('Authorization');
  if (auth) h['Authorization'] = auth;
  return h;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body    = await req.json();
  const headers = await getHeaders(req);
  const res = await fetch(`${SPRING_URL}/users/${id}`, {
    method: 'PATCH', headers, body: JSON.stringify(body), cache: 'no-store',
  });
  return Response.json(await res.json(), { status: res.status });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const headers = await getHeaders(req);
  const res = await fetch(`${SPRING_URL}/users/${id}`, { method: 'DELETE', headers, cache: 'no-store' });
  return Response.json(await res.json(), { status: res.status });
}
