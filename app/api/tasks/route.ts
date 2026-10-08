// @ts-nocheck
// This proxy route forwards to Spring Boot backend
const SPRING_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080/api';

async function proxy(req: Request, endpoint: string, method = 'GET', body?: any) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const authHeader = req.headers.get('Authorization');
  if (authHeader) headers['Authorization'] = authHeader;

  const res = await fetch(`${SPRING_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  const data = await res.json();
  return Response.json(data, { status: res.status });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const assignedTo = searchParams.get('assignedTo');
  const createdBy  = searchParams.get('createdBy');
  const qs = assignedTo ? `?assignedTo=${assignedTo}` : createdBy ? `?createdBy=${createdBy}` : '';
  return proxy(req, `/tasks${qs}`);
}

export async function POST(req: Request) {
  const body = await req.json();
  return proxy(req, '/tasks', 'POST', body);
}