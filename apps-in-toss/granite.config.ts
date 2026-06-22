import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'ksaju',                 // 콘솔 등록 App ID(배포 시 확정)
  brand: {
    displayName: 'K사주',
    primaryColor: '#C8385A',        // 진달래 핑크
    icon: 'https://static.toss.im/icons/png/4x/icon-star.png', // 콘솔 업로드 후 교체
  },
  web: {
    host: 'localhost',
    port: 5173,
    commands: { dev: 'vite', build: 'tsc -b && vite build' },
  },
  permissions: [],
  outdir: 'dist',
  webViewProps: { type: 'partner' },
});
