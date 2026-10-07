import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import App from "./App";

/**
 * 생년월일은 로컬에만 남는다.
 *
 * 이 앱은 사주·운세·타로·궁합을 전부 기기 안에서 규칙기반으로 계산한다
 * (만세력 엔진이 번들에 들어 있고 LLM·API 를 쓰지 않는다). 그래서 사용자가
 * 넣은 생일이 밖으로 나갈 경로가 없어야 하고, 그게 깨지면 조용히 깨진다 —
 * 화면은 멀쩡하게 동작하기 때문이다.
 *
 * **"요청이 0건"으로 검사하지 않는다.** 처음엔 그렇게 썼다가 전체 실행에서
 * 플래키했다 — happy-dom 이 CSS `url()`(한지 배경)과 웹폰트(`.hanja` woff2)를
 * 비동기로 가져오기 때문이고, 그건 우리 코드가 보내는 요청이 아니다.
 * 그래서 **나간 요청의 내용**을 본다: 어떤 요청에도 생년월일이 실리지 않고,
 * 허용한 오리진 밖으로 나가지 않는다. 요구사항을 직접 검증하는 쪽이 맞다.
 */

const BIRTH = { year: "1994", month: "9", day: "12" };

/** 생일이 실릴 수 있는 모든 표기. 이 중 하나라도 요청에 보이면 실패다. */
const BIRTH_FINGERPRINTS = [
  "1994-09-12",
  "19940912",
  "1994/09/12",
  "1994-9-12",
];

/** 앱이 의도적으로 쓰는 외부 오리진. 타로 카드 이미지와 공유 미리보기뿐이다. */
const ALLOWED_ORIGINS = ["https://ksaju.me"];

let sent: string[] = [];
let originalFetch: typeof globalThis.fetch;
let originalOpen: typeof XMLHttpRequest.prototype.open;
let originalBeacon: typeof navigator.sendBeacon | undefined;

function record(...parts: unknown[]) {
  for (const p of parts) {
    if (typeof p === "string") sent.push(p);
    else if (p instanceof URL) sent.push(p.href);
    else if (p && typeof p === "object") {
      try {
        sent.push(JSON.stringify(p));
      } catch {
        /* 순환 참조 등은 무시 */
      }
    }
  }
}

beforeEach(() => {
  sent = [];
  localStorage.clear();

  originalFetch = globalThis.fetch;
  globalThis.fetch = vi.fn(async (...args: unknown[]) => {
    record(...args);
    return new Response(null, { status: 204 });
  }) as unknown as typeof globalThis.fetch;

  originalBeacon = navigator.sendBeacon;
  Object.defineProperty(navigator, "sendBeacon", {
    value: vi.fn((...args: unknown[]) => {
      record(...args);
      return true;
    }),
    configurable: true,
    writable: true,
  });

  originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = vi.fn((...args: unknown[]) => {
    record(...args);
  }) as unknown as typeof XMLHttpRequest.prototype.open;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  XMLHttpRequest.prototype.open = originalOpen;
  if (originalBeacon) {
    Object.defineProperty(navigator, "sendBeacon", {
      value: originalBeacon,
      configurable: true,
      writable: true,
    });
  }
  localStorage.clear();
});

async function enterBirthAndSeeResult() {
  render(<App />);
  await userEvent.selectOptions(screen.getByLabelText("태어난 해"), BIRTH.year);
  await userEvent.selectOptions(screen.getByLabelText("태어난 달"), BIRTH.month);
  await userEvent.selectOptions(screen.getByLabelText("태어난 날"), BIRTH.day);
  await userEvent.click(screen.getByRole("button", { name: "내 사주 보기" }));
  // 결과까지 도달했는지 먼저 확인한다 — 계산이 안 됐는데 '안 샜다'는 건
  // 아무것도 증명하지 못한다.
  expect(await screen.findByText("나의 일간")).toBeInTheDocument();
}

test("생일을 넣고 사주를 봐도 생년월일이 어떤 요청에도 실리지 않는다", async () => {
  await enterBirthAndSeeResult();

  const all = sent.join("\n");
  for (const fingerprint of BIRTH_FINGERPRINTS) {
    expect(all).not.toContain(fingerprint);
  }
  // 연·월·일이 따로 실려도 안 된다
  expect(all).not.toMatch(/\bday=12\b|\bbirth/i);
});

test("허용한 오리진 밖으로 요청이 나가지 않는다", async () => {
  await enterBirthAndSeeResult();

  const external = sent
    .filter((s) => /^https?:\/\//.test(s))
    .filter((s) => !ALLOWED_ORIGINS.some((o) => s.startsWith(o)));
  expect(external).toEqual([]);
});

test("생일은 계산된 사주로만 저장되고 원본이 남지 않는다", async () => {
  await enterBirthAndSeeResult();

  const keys = Object.keys(localStorage);
  expect(keys.some((k) => k.startsWith("ksaju."))).toBe(true);

  // 저장되는 것은 한자 4기둥이다 — 원본 생년월일을 그대로 들고 다니지 않는다.
  // 밖으로 샐 때 피해가 작아진다.
  const dump = keys.map((k) => localStorage.getItem(k) ?? "").join("\n");
  for (const fingerprint of BIRTH_FINGERPRINTS) {
    expect(dump).not.toContain(fingerprint);
  }
});
