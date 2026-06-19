import { describe, it, expect } from "vitest";
import en from "../../messages/en.json";
import ko from "../../messages/ko.json";
import ja from "../../messages/ja.json";
import zhTW from "../../messages/zh-TW.json";

function keyPaths(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) => {
    const path = prefix ? `${prefix}.${k}` : k;
    return v && typeof v === "object" && !Array.isArray(v)
      ? keyPaths(v as Record<string, unknown>, path)
      : [path];
  });
}

describe("message locale parity", () => {
  const enKeys = keyPaths(en as Record<string, unknown>).sort();
  it.each([["ko", ko], ["ja", ja], ["zh-TW", zhTW]] as const)(
    "%s has the same keys as en",
    (_name, msgs) => {
      expect(keyPaths(msgs as Record<string, unknown>).sort()).toEqual(enKeys);
    },
  );
});
