// @ts-nocheck
export async function GET() {
  const res = await fetch('http://localhost:4000/systemSettings', { cache: 'no-store' });
  const settings = await res.json();
  return Response.json(settings);
}

export async function PATCH(req) {
  const body = await req.json();
  const res = await fetch('http://localhost:4000/systemSettings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  
  const settings = await res.json();
  return Response.json(settings);
}
