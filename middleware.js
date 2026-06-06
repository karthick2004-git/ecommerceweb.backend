import { NextResponse } from 'next/server';

const DEFAULT_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://ecommercecustomer-web.vercel.app',
];

function getAllowedOrigins() {
  const env = process.env.ALLOWED_ORIGINS;
  if (env) {
    return env.split(',').map((origin) => origin.trim()).filter(Boolean);
  }
  return DEFAULT_ORIGINS;
}

function applyCorsHeaders(response, origin) {
  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET,DELETE,PATCH,POST,PUT,OPTIONS'
  );
  response.headers.set(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
  return response;
}

export function middleware(request) {
  const origin = request.headers.get('origin');
  const allowedOrigins = getAllowedOrigins();
  const isAllowed = origin && allowedOrigins.includes(origin);

  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });
    return isAllowed ? applyCorsHeaders(response, origin) : response;
  }

  const response = NextResponse.next();
  if (isAllowed) {
    applyCorsHeaders(response, origin);
  }
  return response;
}

export const config = {
  matcher: '/api/:path*',
};
