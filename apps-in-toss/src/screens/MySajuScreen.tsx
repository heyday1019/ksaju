import { useEffect, useRef, useState } from "react";
import { BirthForm } from "../components/BirthForm";
import { PillarsGrid } from "../components/PillarsGrid";
import { WuxingBalance } from "../components/WuxingBalance";
import { FortuneCards } from "../components/FortuneCards";
import { DayMasterHero } from "../components/DayMasterHero";
import { BrandMark, ChangsalBand } from "../components/Chrome";
import { kstDateString } from "../lib/kst-date";
import { logDailyFortuneOpen, logSajuResult } from "../lib/analytics";
import { ProfileBar } from "../components/ProfileBar";
import { PromotionCard } from "../components/PromotionCard";
import { FortuneShareModal } from "../components/FortuneShareModal";
import {
  DailyFortuneCard,
  DailyFortuneTeaser,
} from "../components/DailyFortuneCard";
import type { FortuneCard } from "../lib/fortune";
import type { DailyFortune } from "../lib/daily";
import type { BirthData } from "../lib/kst-types";
import type { Profile } from "../state/profiles";

/**
 * 만세력 엔진(manseryeok, ~300KB)은 부팅에 필요 없다.
 * 생일을 넣는 순간에만 동적 import 해 초기 로딩에서 제외한다(심사 반려 사유 2).
 */
const sajuEngine = () => import("../lib/saju");

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-xs font-bold tracking-[0.15em] text-gray-400">
        {title}
      </h3>
      {children}
    </section>
  );
}

export function MySajuScreen({
  profiles,
  active,
  onSelect,
  onAdd,
  onRemove,
}: {
  profiles: Profile[];
  active: Profile | null;
  onSelect: (id: string) => void;
  onAdd: (name: string, birth: BirthData) => Promise<void>;
  onRemove: (id: string) => void;
}) {
  // 저장된 사람이 없으면 곧바로 입력 화면. 있으면 '+ 사람 추가' 를 눌렀을 때만 연다.
  const [adding, setAdding] = useState(false);
  const [fortune, setFortune] = useState<FortuneCard[] | null>(null);
  const [daily, setDaily] = useState<DailyFortune | null>(null);
  const [sharing, setSharing] = useState(false);
  /** 티저 → 생일 폼 포커스 이동용. BirthForm 이 id 를 밖으로 열어주지 않는다. */
  const formRef = useRef<HTMLDivElement>(null);

  const showForm = adding || !active;

  // 전환 지표의 대표 이벤트 — 생일을 넣고 결과 화면까지 도달한 순간.
  // 사람(프로필)당 한 번만 보낸다. 프로필을 바꾸면 그 사람 기준으로 다시 한 번.
  const loggedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!active || showForm) return;
    if (loggedFor.current === active.id) return;
    loggedFor.current = active.id;
    logSajuResult();
  }, [active, showForm]);

  // 오늘의 운세 노출. 생일이 없어 티저만 보인 경우와 실제 카드를 구분해 보낸다.
  // 지금까지 운세는 전혀 계측되지 않아서 얼마나 읽히는지 알 수 없었다.
  const dailyLoggedFor = useRef<string | null>(null);
  useEffect(() => {
    const key = showForm
      ? profiles.length === 0
        ? "teaser"
        : null // 프로필이 있는데 '추가' 폼을 연 경우 — 운세가 보이지 않는다
      : daily && active
        ? `card:${active.id}`
        : null;
    if (!key || dailyLoggedFor.current === key) return;
    dailyLoggedFor.current = key;
    logDailyFortuneOpen(key === "teaser" ? "teaser" : "card");
  }, [showForm, profiles.length, daily, active]);

  useEffect(() => {
    if (!active) {
      setFortune(null);
      setDaily(null);
      return;
    }
    let alive = true;
    void (async () => {
      const [{ dateToLuck, dateToDayPillar }, { calcFortune }, { calcDailyFortune }] =
        await Promise.all([
          sajuEngine(),
          import("../lib/fortune"),
          import("../lib/daily"),
        ]);
      if (!alive) return;
      const now = new Date();
      setFortune(calcFortune(active.saju, dateToLuck(now), "ko"));
      // 오늘 일주의 천간과 내 일간을 비교해 하루 한 줄을 만든다(규칙기반·오프라인)
      setDaily(
        calcDailyFortune(active.saju, dateToDayPillar(now)[0], kstDateString()),
      );
    })();
    return () => {
      alive = false;
    };
  }, [active]);

  async function handle(birth: BirthData, name: string) {
    await onAdd(name, birth);
    setAdding(false);
  }

  /**
   * 티저를 눌렀을 때 생일 폼으로 데려간다.
   *
   * 새 화면을 열지 않는다 — 폼은 이미 같은 화면 아래에 있으므로 스크롤과 포커스만
   * 옮긴다. `BirthForm` 은 내부에서 `useId` 로 id 를 만들어 밖에서 특정 입력을
   * 지목할 수 없으니, 감싼 컨테이너에서 첫 입력 요소를 찾는다.
   */
  function focusForm() {
    const node = formRef.current;
    if (!node) return;
    node.scrollIntoView({ behavior: "smooth", block: "center" });
    node.querySelector<HTMLElement>("input, select")?.focus();
  }

  if (showForm) {
    const first = profiles.length === 0;
    return (
      <div className="flex flex-col gap-6 pt-6">
        {first && <BrandMark />}
        {/* 생일이 없어도 '오늘의 운세'가 무엇인지 먼저 보여준다. 누르면 폼으로
            데려가지만 강요하지는 않는다 — 아래 폼을 바로 써도 똑같이 동작한다. */}
        {first && <DailyFortuneTeaser onTap={focusForm} />}
        {first && <ChangsalBand />}
        <div className="flex flex-col gap-1 text-center">
          <h2 className="text-xl font-bold">
            {first ? "생일만 알려주세요" : "누구의 사주를 볼까요?"}
          </h2>
          <p className="text-sm text-gray-500">
            {first
              ? "사주 네 기둥과 오늘의 운세를 바로 보여드릴게요."
              : "이름과 생일을 넣으면 그 사람 사주도 저장돼요."}
          </p>
        </div>
        <div ref={formRef}>
          <BirthForm
            withName
            defaultName={first ? "나" : ""}
            submitLabel={first ? "내 사주 보기" : "사주 보기"}
            onSubmit={handle}
          />
        </div>
        {!first && (
          <button
            type="button"
            onClick={() => setAdding(false)}
            className="self-center text-sm text-gray-500 underline"
          >
            취소
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <ProfileBar
        profiles={profiles}
        activeId={active.id}
        onSelect={onSelect}
        onAdd={() => setAdding(true)}
      />
      {daily && <DailyFortuneCard name={active.name} fortune={daily} />}
      {/* 사주를 본 뒤에만 노출된다 — 첫 화면에서는 SDK 를 부르지 않는다 */}
      <PromotionCard />
      <DayMasterHero saju={active.saju} name={active.name} />
      <ChangsalBand />
      <Section title="사주 네 기둥">
        <PillarsGrid saju={active.saju} />
      </Section>
      <Section title="오행 균형">
        <WuxingBalance saju={active.saju} />
      </Section>
      {fortune && (
        <Section title="오늘의 운세">
          <FortuneCards cards={fortune} />
        </Section>
      )}
      <button
        type="button"
        onClick={() => setSharing(true)}
        disabled={!fortune}
        className="rounded-lg bg-[var(--color-jindallae)] px-4 py-3.5 font-bold text-white disabled:opacity-40"
      >
        이미지로 저장하기 ✨
      </button>
      {profiles.length > 1 && (
        <button
          type="button"
          onClick={() => onRemove(active.id)}
          className="self-center text-sm text-gray-400 underline"
        >
          '{active.name}' 삭제
        </button>
      )}
      <p className="text-center text-xs text-gray-400">재미로 보는 콘텐츠예요 🌙</p>
      {sharing && fortune && (
        <FortuneShareModal
          profile={active}
          cards={fortune}
          onClose={() => setSharing(false)}
        />
      )}
    </div>
  );
}
