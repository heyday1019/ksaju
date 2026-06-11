// src/middleware.ts
// /admin 경로 비밀번호 보호
// ADMIN_PASSWORD 환경변수 없으면 기본 "ksaju-admin"

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // /admin 경로만 보호
  if (!request.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // 이미 인증된 세션 쿠키 확인
  const auth = request.cookies.get("ksaju-admin-auth");
  if (auth?.value === "1") return NextResponse.next();

  // Basic Auth 헤더 확인 (브라우저 팝업)
  const header = request.headers.get("authorization") || "";
  if (header.startsWith("Basic ")) {
    const decoded = Buffer.from(header.slice(6), "base64").toString();
    const [, pass] = decoded.split(":");
    const expected = process.env.ADMIN_PASSWORD || "ksaju-admin";
    if (pass === expected) {
      const response = NextResponse.next();
      response.cookies.set("ksaju-admin-auth", "1", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 8, // 8시간
      });
      return response;
    }
  }

  // 인증 요청 (브라우저 팝업)
  return new NextResponse(null, {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="KSaju Admin"',
    },
  });
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
