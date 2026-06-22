import { useState } from "react";
import { groups, getIdolsByGroup, searchIdols, type Idol } from "../lib/idols";

export function IdolPicker({ onSelect }: { onSelect: (i: Idol) => void }) {
  const [q, setQ] = useState("");
  const results = q.trim() ? searchIdols(q) : [];

  return (
    <div className="flex flex-col gap-3">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoFocus
        placeholder="아이돌 검색 (이름)"
        className="rounded-md border border-gray-300 px-3 py-2"
      />
      {q.trim() ? (
        <div className="flex flex-col gap-1">
          {results.map((i) => (
            <button
              key={i.id}
              onClick={() => onSelect(i)}
              className="rounded-md px-3 py-2 text-left hover:bg-gray-50"
            >
              {i.name} <span className="text-xs text-gray-500">{i.group}</span>
            </button>
          ))}
          {results.length === 0 && (
            <p className="text-sm text-gray-400">검색 결과가 없어요.</p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {groups.map((g) => (
            <details key={g}>
              <summary className="cursor-pointer py-1 font-medium">{g}</summary>
              <div className="flex flex-wrap gap-1 pl-2 pt-1">
                {getIdolsByGroup(g).map((i) => (
                  <button
                    key={i.id}
                    onClick={() => onSelect(i)}
                    className="rounded-full border border-gray-300 px-3 py-1 text-sm"
                  >
                    {i.name}
                  </button>
                ))}
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
