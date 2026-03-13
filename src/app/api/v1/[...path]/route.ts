import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = 'http://151.25.69.162:8000';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'DELETE');
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'PATCH');
}

async function proxyRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  try {
    // Join path segments and ensure trailing slash
    const path = pathSegments.join('/');
    const url = `${BACKEND_URL}/api/v1/${path}/`;
    
    console.log(`[Proxy] ${method} ${url}`);
    
    // Get request body for POST/PUT/PATCH
    let body = undefined;
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        body = await request.text();
        console.log(`[Proxy] Body:`, body);
      } catch (e) {
        console.log(`[Proxy] No body`);
      }
    }

    // Forward headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Forward Authorization header if present
    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
      console.log(`[Proxy] Auth header present`);
    }

    // Make request to backend
    console.log(`[Proxy] Fetching backend...`);
    const response = await fetch(url, {
      method,
      headers,
      body,
    });

    console.log(`[Proxy] Backend response: ${response.status}`);

    // Get response data
    const data = await response.text();
    
    // Parse JSON if possible
    let jsonData;
    try {
      jsonData = JSON.parse(data);
    } catch {
      jsonData = data;
    }

    // Return response with same status
    return NextResponse.json(jsonData, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('[Proxy] Error:', error);
    return NextResponse.json(
      { error: 'Proxy request failed', details: String(error) },
      { status: 500 }
    );
  }
}
