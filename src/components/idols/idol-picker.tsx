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
          // 그룹 브라우징
          <div className="space-y-6">
            {groups.map((group) => (
              <section key={group} className="space-y-2">
                <h3 className="font-display text-sm font-semibold tracking-wide text-primary">
                  {group}
                </h3>
                <div className={GRID}>
                  {getIdolsByGroup(group).map(renderCard)}
                </div>
              </section>
            ))}
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
