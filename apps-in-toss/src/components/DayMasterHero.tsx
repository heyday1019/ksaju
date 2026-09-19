import { dayMasterInfo, ELEMENT_TEXT } from "../lib/saju-display";
import { dayMasterKeywordKo } from "../content/ko/labels";
import type { UserSaju } from "../lib/saju-types";

/**
 * 결과 화면의 히어로. 일간 한자를 크게 세워 나머지 카드들과 위계를 만든다.
 * (이전에는 4기둥·오행·운세가 전부 같은 크기 흰 박스라 위계가 평평했다)
 */
export function DayMasterHero({
  saju,
  name,
}: {
  saju: UserSaju;
  /** 프로필 이름. 다른 사람 사주를 볼 때 '나의 일간' 으로 보이지 않게 한다. */
  name?: string;
}) {
  const dm = dayMasterInfo(saju.dayMaster);
  const color = ELEMENT_TEXT[dm.element];

  // "음금(陰金) — 세공된 보석처럼 섬세하고 우아한 사람" → 배지 / 설명으로 쪼갠다.
  // 앞부분이 이미 오행을 담고 있어 별도 오행 라벨을 붙이면 "금 · 음금(陰金)"으로 겹친다.
  const [badge, ...rest] = dayMasterKeywordKo(saju.dayMaster).split("—");
  const description = rest.join("—").trim();

  return (
    <div className="flex flex-col items-center gap-1.5 py-3 text-center">
      <p className="text-[11px] tracking-[0.2em] text-gray-400">
        {name ? `${name}의 일간` : "나의 일간"}
      </p>
      <p className={`hanja text-6xl font-bold leading-none ${color}`}>
        {saju.dayMaster}
      </p>
      <p className={`text-base font-bold ${color}`}>{badge.trim()}</p>
      {description && (
        <p className="max-w-[17rem] text-sm leading-relaxed text-gray-500">
          {description}
        </p>
      )}
    </div>
  );
}
