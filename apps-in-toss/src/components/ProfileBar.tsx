import type { Profile } from "../state/profiles";

/**
 * 저장된 사람들(나·친구·연인) 사이를 오가는 칩 줄.
 * 사주가 저장돼 있으면 생일 폼이 사라져 다른 사람을 넣을 길이 없던 문제를
 * '+ 사람 추가' 로 상시 열어둔다.
 */
export function ProfileBar({
  profiles,
  activeId,
  onSelect,
  onAdd,
}: {
  profiles: Profile[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
      {profiles.map((p) => (
        <button
          key={p.id}
          type="button"
          aria-current={p.id === activeId ? "true" : undefined}
          onClick={() => onSelect(p.id)}
          className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
            p.id === activeId
              ? "border-transparent bg-[var(--color-jindallae)] font-bold text-white"
              : "border-black/10 bg-white/70 text-gray-600"
          }`}
        >
          {p.name}
        </button>
      ))}
      <button
        type="button"
        onClick={onAdd}
        className="shrink-0 rounded-full border border-dashed border-[var(--color-jindallae)]/50 px-3.5 py-1.5 text-sm text-[var(--color-jindallae)]"
      >
        + 사람 추가
      </button>
    </div>
  );
}
