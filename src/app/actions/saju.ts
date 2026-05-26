"use server";

import { birthSchema } from "@/lib/kst-types";
import { birthToSaju } from "@/lib/saju";
import type { BirthData } from "@/lib/kst-types";
import type { UserSaju } from "@/lib/saju-types";

/**
 * 사용자 생일 → 사주 4기둥. manseryeok(~300KB)은 이 서버 경계 뒤에서만 실행되어
 * 클라이언트 번들에 포함되지 않는다.
 *
 * 클라이언트 입력은 신뢰하지 않고 서버에서 birthSchema로 재검증한다
 * (Next use-server 보안 가이드).
 */
export async function calcUserSaju(birth: BirthData): Promise<UserSaju> {
  const parsed = birthSchema.parse(birth);
  return birthToSaju(parsed as BirthData);
}
