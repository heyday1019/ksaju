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

/**
 * 아이돌 검색·선택 UX.
 * - 검색바: 이름/그룹 즉시 필터 (searchIdols)
 * - 빈 검색: 그룹별로 묶어 브라우징
 * - 단일 선택 → onSelect(idol)
 * 궁합 결과·페이지 연결은 별도 사이클. 여기선 "고르기"까지만.
 */
export function IdolPicker({ onSelect, className }: IdolPickerProps) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // 아코디언: 한 번에 한 그룹만 펼침. 기본 전부 접힘(null) → 목록이 짧아
  // 아래의 "Or someone else"(일반 상대 궁합)까지 첫 방문자도 닿게 한다.
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

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
      <Input
        type="search"
        aria-label="Search idols"
        placeholder="Search your bias or group…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div role="radiogroup" aria-label="K-pop idols">
        {results === null ? (
          // 그룹 브라우징 — 아코디언(기본 접힘, 한 번에 하나만 펼침)
          <div className="space-y-2">
            {groups.map((group) => {
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
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
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
