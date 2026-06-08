import Link from "next/link";
import { elementOf, ELEMENT_TEXT, dayMasterInfo } from "@/lib/saju-display";
import type { UserSaju } from "@/lib/saju-types";

function Pillar({ p }: { p: string }) {
  return (
    <span className="inline-flex gap-0.5">
      <span className={ELEMENT_TEXT[elementOf(p[0])]}>{p[0]}</span>
      <span className={ELEMENT_TEXT[elementOf(p[1])]}>{p[1]}</span>
    </span>
  );
}

/** 내 사주 요약 바: 오행색 4기둥(시주 제외 3기둥) + 일간 + fun 키워드. */
export function SajuSummaryBar({ saju }: { saju: UserSaju }) {
  const dm = dayMasterInfo(saju.dayMaster);
  return (
    <section className="rounded-xl bg-primary/5 px-4 py-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Your saju · 사주
          </p>
          <p className="hanja mt-1 inline-flex items-center gap-2 text-lg font-bold">
            <Pillar p={saju.pillars.year} />
            <span className="text-muted-foreground">·</span>
            <Pillar p={saju.pillars.month} />
            <span className="text-muted-foreground">·</span>
            <Pillar p={saju.pillars.day} />
          </p>
        </div>
        <Link
          href="/"
          className="text-xs text-primary underline-offset-2 hover:underline"
        >
          Edit on home →
        </Link>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Day master{" "}
        <span className={`hanja font-bold ${ELEMENT_TEXT[dm.element]}`}>{dm.char}</span>{" "}
        <span className="text-foreground">{dm.keyword}</span>
      </p>
    </section>
  );
}
