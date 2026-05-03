import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password } = body;

  // Simple validation — works for any valid email + password (local demo)
  if (!email || !password) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
  }

  // Store user info in cookie (base64 encoded)
  const userPayload = Buffer.from(JSON.stringify({ email, name: body.name || email.split('@')[0] })).toString('base64');

  const response = NextResponse.json({ success: true, name: body.name || email.split('@')[0] });
  response.cookies.set('medshield_auth', userPayload, {
    httpOnly: false, // readable by client JS for displaying user name
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
  return response;
}
