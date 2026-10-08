// @ts-nocheck
// Proxy to Spring Boot backend
const SPRING_URL = process.env.NEXT_PUBLIC_API_URL || 'https://tms-backend-production-b2bb.up.railway.app/api';

export async function POST(req) {
  try {
    const body = await req.json();
    const targetUrl = SPRING_URL.endsWith('/api')
      ? `${SPRING_URL}/auth/login`
      : `${SPRING_URL}/api/auth/login`;
    const res  = await fetch(targetUrl, {
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