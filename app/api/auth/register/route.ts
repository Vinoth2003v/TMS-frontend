// @ts-nocheck
// Proxy to Spring Boot backend
const SPRING_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080/api';

export async function POST(req) {
  try {
    const body = await req.json();
    const res  = await fetch(`${SPRING_URL}/auth/register`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
      cache:   'no-store',
    });
    const data = await res.json();
    return Response.json(data, { status: res.status });
  } catch (err) {
    return Response.json({ error: 'Backend unavailable' }, { status: 503 });
  }
}