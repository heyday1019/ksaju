"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { IdolCard } from "./idol-card";
import {
  groups,
  searchIdols,
  getIdolsByGroup,
  type Idol,
} from "@/lib/idols";

interface IdolPickerProps {
  onSelect: (idol: Idol) => void;
  className?: string;
}

const GRID = "grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4";

// 그룹을 알파벳순으로(비영숫자 제거·소문자 기준). idols.ts의 groups export는
// 보존하고 여기서만 정렬한 복사본을 쓴다. groups는 정적이라 모듈 스코프로 충분.
const sortKey = (s: string) => s.replace(/[^a-z0-9]/gi, "").toLowerCase();
const SORTED_GROUPS = [...groups].sort((a, b) =>
  sortKey(a).localeCompare(sortKey(b)),
);

/**
 * 아이돌 검색·선택 UX.
 * - 검색바: 이름/그룹 즉시 필터 (searchIdols)
 * - 빈 검색: 그룹별(알파벳순)로 묶어 브라우징, 첫 그룹(aespa) 기본 펼침
 * - 단일 선택 → onSelect(idol)
 * 궁합 결과·페이지 연결은 별도 사이클. 여기선 "고르기"까지만.
 */
export function IdolPicker({ onSelect, className }: IdolPickerProps) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // 아코디언: 한 번에 한 그룹만 펼침. 기본 펼침은 정렬상 첫 그룹(aespa) —
  // 첫 화면이 비어 보이지 않게 한 그룹을 미리 열어 둔다.
  const [expandedGroup, setExpandedGroup] = useState<string | null>(
    SORTED_GROUPS[0] ?? null,
  );

  const trimmed = query.trim();
  // 검색 중이면 플랫 결과, 아니면 null(=그룹 브라우징 모드)
  const results = useMemo(
    () => (trimmed === "" ? null : searchIdols(trimmed)),
    [trimmed],
  );

  const handleSelect = (idol: Idol) => {
    setSelectedId(idol.id);
    onSelect(idol);
  };

  const toggleGroup = (group: string) =>
    setExpandedGroup((cur) => (cur === group ? null : group));

  const renderCard = (idol: Idol) => (
    <IdolCard
      key={idol.id}
      idol={idol}
      selected={selectedId === idol.id}
      onSelect={handleSelect}
    />
  );

  return (
    <div className={cn("space-y-5", className)}>
      <div className="space-y-1">
        <Input
          type="search"
          autoFocus
          aria-label="Search idols"
          placeholder="Search your bias or group…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Try a name or group — e.g. BTS, Mingyu, ATEEZ
        </p>
      </div>

      <div role="radiogroup" aria-label="K-pop idols">
        {results === null ? (
          // 그룹 브라우징 — 아코디언(기본 접힘, 한 번에 하나만 펼침)
          <div className="space-y-2">
            {SORTED_GROUPS.map((group) => {
              const members = getIdolsByGroup(group);
              const open = expandedGroup === group;
              const panelId = `idol-group-${group.replace(/\s+/g, "-")}`;
              return (
                <section key={group}>
                  <button
                    type="button"
                    onClick={() => toggleGroup(group)}
                    aria-expanded={open}
                    aria-controls={panelId}
                    className="flex w-full items-center justify-between rounded-lg border border-border bg-card/50 px-3 py-2 text-left transition-colors hover:bg-card"
                  >
                    <span className="font-display text-sm font-semibold tracking-wide text-primary">
                      {group}
                      <span className="ml-2 inline-block rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground">
                        {members.length}
                      </span>
                    </span>
                    <span
                      aria-hidden
                      className="text-muted-foreground transition-transform"
                    >
                      {open ? "▾" : "▸"}
                    </span>
                  </button>
                  {open && (
                    <div id={panelId} className={cn(GRID, "mt-2")}>
                      {members.map(renderCard)}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        ) : results.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            No idols found — try another name 🌙
          </p>
        ) : (
          <div className={GRID}>{results.map(renderCard)}</div>
        )}
      </div>
    </div>
  );
}
