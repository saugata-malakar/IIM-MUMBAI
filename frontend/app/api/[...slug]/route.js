import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  return handleProxy(request);
}

export async function POST(request, { params }) {
  return handleProxy(request);
}

export async function PUT(request, { params }) {
  return handleProxy(request);
}

export async function DELETE(request, { params }) {
  return handleProxy(request);
}

async function handleProxy(request) {
  try {
    const url = new URL(request.url);
    const targetUrl = `http://127.0.0.1:8003${url.pathname}${url.search}`;
    
    console.log(`[MedShield Proxy] ${request.method} → ${targetUrl}`);

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

    // Use a longer timeout for SSE/streaming endpoints (benchmark, etc.)
    const isStreaming = url.pathname.includes('/stream') || url.pathname.includes('/benchmark');
    const timeoutMs = isStreaming ? 300000 : 30000; // 5 min for streams, 30s for normal
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    fetchOptions.signal = controller.signal;

    const response = await fetch(targetUrl, fetchOptions);
    clearTimeout(timeoutId);
    
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Access-Control-Allow-Origin', '*');

    // Return the raw response body stream — works for JSON, SSE, binary files, everything
    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('[MedShield Proxy Error]:', error.message);
    return NextResponse.json(
      { status: 'error', message: 'Backend connection failed. The Python server may still be starting up.', details: error.message },
      { status: 502 }
    );
  }
}
