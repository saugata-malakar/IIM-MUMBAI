import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  return handleProxy(request);
}

export async function POST(request, { params }) {
  return handleProxy(request);
}

async function handleProxy(request) {
  try {
    const url = new URL(request.url);
    // Remove '/api' from the start of the pathname, since we are mounting at /api
    const targetUrl = `http://127.0.0.1:8003${url.pathname}${url.search}`;
    
    console.log(`[Next.js Proxy] Forwarding ${request.method} to ${targetUrl}`);

    const headers = new Headers(request.headers);
    headers.delete('host');

    const fetchOptions = {
      method: request.method,
      headers: headers,
      redirect: 'manual',
    };

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      if (request.body) {
        fetchOptions.body = request.body;
        fetchOptions.duplex = 'half';
      }
    }

    // Add 15-second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    fetchOptions.signal = controller.signal;

    const response = await fetch(targetUrl, fetchOptions);
    clearTimeout(timeoutId);
    
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Access-Control-Allow-Origin', '*');

    // Return the raw response body stream so binary files (ZIPs, CSVs, Images) are not corrupted
    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('[Next.js Proxy Error]:', error);
    return NextResponse.json(
      { status: 'error', message: 'Proxy failed to connect to Python backend.', details: error.message },
      { status: 502 }
    );
  }
}
