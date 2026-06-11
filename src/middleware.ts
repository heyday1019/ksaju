import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { routing } from '@/i18n/routing';

const intl = createIntlMiddleware(routing);

function adminAuth(request: NextRequest): NextResponse {
  // 이미 인증된 세션 쿠키 확인
  const auth = request.cookies.get('ksaju-admin-auth');
  if (auth?.value === '1') return NextResponse.next();

  // Basic Auth 헤더 확인 (브라우저 팝업)
  const header = request.headers.get('authorization') || '';
  if (header.startsWith('Basic ')) {
    const decoded = Buffer.from(header.slice(6), 'base64').toString();
    const [, pass] = decoded.split(':');
    const expected = process.env.ADMIN_PASSWORD || 'ksaju-admin';
    if (pass === expected) {
      const response = NextResponse.next();
      response.cookies.set('ksaju-admin-auth', '1', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 8, // 8시간
      });
      return response;
    }
  }

  // 인증 요청 (브라우저 팝업)
  return new NextResponse(null, {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="KSaju Admin"' },
  });
}

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    return adminAuth(request);
  }
  return intl(request);
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/((?!api|_next|.*\\..*).*)'],
};
