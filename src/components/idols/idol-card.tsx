import { cn } from "@/lib/utils";
import { elementOf } from "@/lib/saju-display";
import type { WuXing } from "@/lib/saju-types";
import type { Idol } from "@/lib/idols";

interface IdolCardProps {
  idol: Idol;
  selected: boolean;
  onSelect: (idol: Idol) => void;
}

// 오행 튼트 아바타 (배경 /15 + 오행색 글자). Tailwind v4 JIT용 리터럴 맵.
const AVATAR: Record<WuXing, string> = {
  wood: "bg-wuxing-mok/15 text-wuxing-mok",
  fire: "bg-wuxing-hwa/15 text-wuxing-hwa",
  earth: "bg-wuxing-to/15 text-wuxing-to",
  metal: "bg-wuxing-geum/15 text-wuxing-geum",
  water: "bg-wuxing-su/15 text-wuxing-su",
};

/**
 * 아이돌 한 명을 보여주는 선택 카드 (순수 프레젠테이션).
 * 공식 사진·로고는 쓰지 않고 이름 첫 글자 모노그램으로 대체한다 (CLAUDE.md).
 * 모노그램 배경은 일간 오행 색으로 칠해 사주 의미를 시각화.
 * radiogroup 안에서 단일 선택되는 radio로 동작.
 */
export function IdolCard({ idol, selected, onSelect }: IdolCardProps) {
  const initial = idol.name.charAt(0).toUpperCase();
  const element = elementOf(idol.saju.dayMaster);
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={`${idol.name}, ${idol.group}`}
      onClick={() => onSelect(idol)}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors",
        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        selected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50 hover:bg-muted/40",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-lg font-bold",
          AVATAR[element],
        )}
      >
        {initial}
      </span>
      <span className="min-w-0">
        <span className="block truncate font-display font-semibold">
          {idol.name}
        </span>
        <span className="block truncate text-sm text-muted-foreground">
          {idol.group}
        </span>
      </span>
    </button>
  );
}
