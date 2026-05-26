// vitest 전용 stub: 실제 빌드에선 "server-only"가 클라이언트 import를 막지만,
// node-env 테스트에선 throw하므로 빈 모듈로 대체한다 (vitest.config alias).
export {};
