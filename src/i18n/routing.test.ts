import { describe, it, expect } from 'vitest';
import { routing } from './routing';

describe('routing', () => {
  it('4개 locale 정의', () => {
    expect(routing.locales).toEqual(['en', 'ja', 'ko', 'zh-TW']);
  });
  it('defaultLocale은 en', () => {
    expect(routing.defaultLocale).toBe('en');
  });
  it('localePrefix는 as-needed', () => {
    expect(routing.localePrefix).toBe('as-needed');
  });
});
