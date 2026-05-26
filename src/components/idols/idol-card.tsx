import { cn } from "@/lib/utils";
import type { Idol } from "@/lib/idols";

interface IdolCardProps {
  idol: Idol;
  selected: boolean;
  onSelect: (idol: Idol) => void;
}

/**
 * 아이돌 한 명을 보여주는 선택 카드 (순수 프레젠테이션).
 * 공식 사진·로고는 쓰지 않고 이름 첫 글자 모노그램으로 대체한다 (CLAUDE.md).
 * radiogroup 안에서 단일 선택되는 radio로 동작.
 */
export function IdolCard({ idol, selected, onSelect }: IdolCardProps) {
  const initial = idol.name.charAt(0).toUpperCase();
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
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
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent font-display text-lg font-bold text-white"
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
