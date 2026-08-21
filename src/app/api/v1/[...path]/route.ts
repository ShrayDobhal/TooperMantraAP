import { NextRequest, NextResponse } from 'next/server';

const TARGET_BACKEND = 'http://187.127.111.105/api/v1';

async function handleProxy(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path ? params.path.join('/') : '';
  const searchParams = req.nextUrl.search;
  const targetUrl = `${TARGET_BACKEND}/${path}${searchParams}`;

  const headers = new Headers();
  const authHeader = req.headers.get('authorization');
  if (authHeader) {
    headers.set('authorization', authHeader);
  }
  headers.set('content-type', req.headers.get('content-type') || 'application/json');

  let body: any = null;
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    try {
      body = await req.text();
    } catch (e) {
      body = null;
    }
  }

  try {
    const res = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: body ? body : undefined,
      cache: 'no-store',
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error('Proxy Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'PROXY_ERROR',
          message: error.message || 'Failed to communicate with backend server',
        },
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest, ctx: { params: { path: string[] } }) {
  return handleProxy(req, ctx);
}

export async function POST(req: NextRequest, ctx: { params: { path: string[] } }) {
  return handleProxy(req, ctx);
}

export async function PUT(req: NextRequest, ctx: { params: { path: string[] } }) {
  return handleProxy(req, ctx);
}

export async function PATCH(req: NextRequest, ctx: { params: { path: string[] } }) {
  return handleProxy(req, ctx);
}

export async function DELETE(req: NextRequest, ctx: { params: { path: string[] } }) {
  return handleProxy(req, ctx);
}
