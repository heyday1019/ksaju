export type Screen = "saju" | "compat" | "tarot" | "spread";

const TABS: [Screen, string][] = [
  ["saju", "내 사주"],
  ["compat", "궁합"],
  ["tarot", "오늘의 타로"],
  ["spread", "타로 3장"],
];

/** 토스 권장 플로팅 탭바(2~5개). 하단 도크(App) 안에서 배너 위에 놓인다. */
export function TabNav({
  active,
  onChange,
}: {
  active: Screen;
  onChange: (s: Screen) => void;
}) {
  return (
    <nav className="px-4 pb-2 pt-2">
      <div className="mx-auto flex max-w-md gap-1 rounded-full border border-black/5 bg-white/95 p-1 shadow-lg backdrop-blur">
        {TABS.map(([s, label]) => (
          <button
            key={s}
            type="button"
            aria-current={active === s ? "page" : undefined}
            onClick={() => onChange(s)}
            className={`flex-1 rounded-full py-2.5 text-xs transition-colors ${
              active === s
                ? "bg-[var(--color-jindallae)] font-bold text-white"
                : "text-gray-500"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}
