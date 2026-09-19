import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // 토스 미니앱이 타로 덱 아트를 여기서 받아간다(번들에 싣지 않는다).
        // 미니앱의 공유 카드는 html-to-image 로 DOM 을 캔버스에 그리는데,
        // CORS 헤더가 없으면 캔버스가 오염돼 PNG 저장이 실패한다.
        source: '/tarot-webp/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          // 카드 아트는 불변이다 — 파일명이 바뀌지 않으면 내용도 그대로다.
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
