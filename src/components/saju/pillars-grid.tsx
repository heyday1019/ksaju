import { elementOf, pillarKo } from "@/lib/saju-display";
import type { WuXing } from "@/lib/saju-types";
import type { UserSaju } from "@/lib/saju-types";

// Tailwind v4 JIT가 정적 문자열만 스캔하므로 오행색 클래스는 리터럴 맵으로.
const TEXT: Record<WuXing, string> = {
  wood: "text-wuxing-mok",
  fire: "text-wuxing-hwa",
  earth: "text-wuxing-to",
  metal: "text-wuxing-geum",
  water: "text-wuxing-su",
};

function Char({ char }: { char: string }) {
  return <span className={`hanja ${TEXT[elementOf(char)]}`}>{char}</span>;
}

/** 사주 4기둥 그리드 (시주 없으면 "—"). */
export function PillarsGrid({ pillars }: { pillars: UserSaju["pillars"] }) {
  const cols: { label: string; pillar: string | null }[] = [
    { label: "Year", pillar: pillars.year },
    { label: "Month", pillar: pillars.month },
    { label: "Day", pillar: pillars.day },
    { label: "Hour", pillar: pillars.hour },
  ];
  return (
    <div className="grid grid-cols-4 gap-2">
      {cols.map(({ label, pillar }) => (
        <div
          key={label}
          className="rounded-xl border border-border bg-card/60 py-3 text-center"
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          {pillar ? (
            <>
              <p className="mt-1 text-3xl font-bold leading-tight">
                <Char char={pillar[0]} />
                <Char char={pillar[1]} />
              </p>
              <p className="text-[11px] text-muted-foreground">
                {pillarKo(pillar)}
              </p>
            </>
          ) : (
            <p className="mt-1 text-3xl font-bold leading-tight text-muted-foreground/40">
              —
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
