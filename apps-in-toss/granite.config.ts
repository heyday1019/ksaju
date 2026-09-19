import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  // 콘솔에 등록한 App ID 와 정확히 일치해야 한다 (intoss://ksaju 로 열림)
  appName: 'ksaju',
  brand: {
    // index.html <title> / og:title / 콘솔 앱 이름과 공백까지 동일해야 한다
    displayName: 'K사주',
    primaryColor: '#C8385A',        // 진달래 핑크
    icon: 'https://static.toss.im/appsintoss/53459/1717c73a-9d75-4ff2-9fdf-1ef6a9588634.png',
  },
  // 공통 내비게이션 바(앱 이름·로고·백버튼). 자체 헤더/백버튼은 두지 않는다.
  navigationBar: {
    withBackButton: true,
    withHomeButton: true,
  },
  // 공유 카드를 사진첩에 저장(saveBase64Data)하기 위한 권한. 저장 버튼에서 실제로 요청한다.
  permissions: [{ name: 'photos', access: 'write' }],
  web: {
    host: 'localhost',
    port: 5173,
    commands: { dev: 'vite', build: 'tsc -b && vite build' },
  },
  outdir: 'dist',
  // 네이티브 스크롤 옵션(bounces/overScrollMode/pullToRefreshEnabled)은 건드리지 않는다.
  // 세로 스크롤이 먹지 않는다는 제보가 있었고, 이 값들이 유일한 후보였다.
  // 프레임워크 기본값을 쓴다.
  webViewProps: { type: 'partner' },
});
