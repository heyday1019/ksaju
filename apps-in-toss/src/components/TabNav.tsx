export type Screen = "saju" | "compat" | "tarot" | "spread";

const TABS: [Screen, string][] = [
  ["saju", "내 사주"],
  ["compat", "궁합"],
  ["tarot", "오늘의 타로"],
  ["spread", "타로 스프레드"],
];

export function TabNav({
  active,
  onChange,
}: {
  active: Screen;
  onChange: (s: Screen) => void;
}) {
  return (
    <nav className="fixed inset-x-0 bottom-0 flex border-t border-gray-200 bg-white">
      {TABS.map(([s, label]) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className={`flex-1 py-3 text-xs ${
            active === s
              ? "font-bold text-[var(--color-jindallae)]"
              : "text-gray-500"
          }`}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}
