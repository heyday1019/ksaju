"use client";
// src/components/admin/AdminDashboard.tsx
// 한지 라이트 테마 기반 KSaju Admin Dashboard
// Chart.js 없이 순수 Tailwind + CSS로 구현 (번들 최소화)

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

// ─── 타입 ──────────────────────────────────────────────────────

interface FunnelData {
  birth_submitted: number;
  idol_selected: number;
  card_generated: number;
  share_clicked: number;
  another_idol_clicked: number;
}
interface IdolEntry { name: string; group: string; count: number }
interface TrendEntry { date: string; submitted: number; generated: number; shared: number }
interface RecentEvent { id: number; event: string; idol_name: string | null; group_name: string | null; score: number | null; created_at: string }
interface GroupEntry { group: string; count: number }

interface Props {
  data: {
    funnel: FunnelData;
    idolTop: IdolEntry[];
    trend: TrendEntry[];
    recent: RecentEvent[];
    groupData: GroupEntry[];
    days: number;
  };
}

// ─── 상수 ──────────────────────────────────────────────────────

const GROUP_COLORS: Record<string, string> = {
  BTS: "#5b7ec7", BLACKPINK: "#7c5cb8", aespa: "#b85c8a",
  IVE: "#c86a5c", NewJeans: "#5ca88a", "LE SSERAFIM": "#c8a85c",
  TWICE: "#e07ab0", "Stray Kids": "#5c8ac8", ENHYPEN: "#8c5cb8",
  TXT: "#5cb8b0", ITZY: "#c8a05c", "(G)I-DLE": "#8cb85c",
  "Red Velvet": "#c87c5c", Soloist: "#888", Other: "#aaa",
};

const EVENT_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  birth_submitted:     { label: "생일 입력",     color: "#C8385A", icon: "🎂" },
  idol_selected:       { label: "아이돌 선택",   color: "#C49A3F", icon: "⭐" },
  card_generated:      { label: "카드 생성",     color: "#88B0BC", icon: "🎴" },
  share_clicked:       { label: "공유 클릭",     color: "#5b7ec7", icon: "📤" },
  another_idol_clicked:{ label: "다시 선택",     color: "#888",    icon: "🔄" },
};

// ─── 헬퍼 ──────────────────────────────────────────────────────

const pct = (a: number, b: number) => b === 0 ? "—" : `${Math.round(a / b * 100)}%`;
const timeAgo = (iso: string) => {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}초 전`;
  if (diff < 3600) return `${Math.floor(diff/60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff/3600)}시간 전`;
  return `${Math.floor(diff/86400)}일 전`;
};

// ─── 서브 컴포넌트 ──────────────────────────────────────────────

function MetricCard({ label, value, sub, warn }: { label: string; value: string; sub: string; warn?: boolean }) {
  return (
    <div className="bg-[#F5F0E8] dark:bg-[#1a1535] rounded-xl p-4 border border-[#E8E0D0] dark:border-[#2a2545]">
      <div className="text-[11px] uppercase tracking-widest text-[#888] mb-1">{label}</div>
      <div className="text-3xl font-medium text-[#1A1A2E] dark:text-[#FFF6E5]">{value}</div>
      <div className={`text-[11px] mt-1 ${warn ? "text-[#C49A3F]" : "text-[#5ca88a]"}`}>{sub}</div>
    </div>
  );
}

function FunnelBar({ label, count, max, pctLabel, color }: {
  label: string; count: number; max: number; pctLabel: string; color: string;
}) {
  const w = max === 0 ? 0 : Math.round(count / max * 100);
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="text-[12px] text-[#888] w-24 shrink-0">{label}</div>
      <div className="flex-1 h-5 bg-[#EEE9DF] dark:bg-[#2a2545] rounded overflow-hidden">
        <div
          className="h-full rounded flex items-center justify-end pr-2 text-[11px] font-medium text-white transition-all duration-700"
          style={{ width: `${w}%`, background: color, minWidth: w > 0 ? "40px" : "0" }}
        >
          {w > 10 ? pctLabel : ""}
        </div>
      </div>
      <div className="text-[12px] text-[#888] w-8 text-right shrink-0">{count}</div>
    </div>
  );
}

function TrendBars({ trend }: { trend: TrendEntry[] }) {
  const maxVal = Math.max(...trend.map(d => Math.max(d.submitted, d.generated, d.shared)), 1);
  return (
    <div className="flex items-end gap-1 h-28 mt-2">
      {trend.map((d) => (
        <div key={d.date} className="flex-1 flex flex-col items-center gap-0.5">
          <div className="w-full flex gap-0.5 items-end" style={{ height: "90px" }}>
            <div className="flex-1 rounded-t-sm" style={{ height: `${Math.round(d.submitted/maxVal*90)}px`, background: "#C8385A", minHeight: d.submitted>0?2:0 }} title={`입력 ${d.submitted}`} />
            <div className="flex-1 rounded-t-sm" style={{ height: `${Math.round(d.generated/maxVal*90)}px`, background: "#C49A3F", minHeight: d.generated>0?2:0 }} title={`생성 ${d.generated}`} />
            <div className="flex-1 rounded-t-sm" style={{ height: `${Math.round(d.shared/maxVal*90)}px`, background: "#5b7ec7", minHeight: d.shared>0?2:0 }} title={`공유 ${d.shared}`} />
          </div>
          <div className="text-[9px] text-[#aaa]">{d.date.slice(5)}</div>
        </div>
      ))}
    </div>
  );
}

function IdolRankList({ idols, filterGroup }: { idols: IdolEntry[]; filterGroup: string }) {
  const filtered = filterGroup === "all" ? idols : idols.filter(i => i.group === filterGroup);
  const maxCount = filtered[0]?.count || 1;
  return (
    <div className="space-y-2 mt-2">
      {filtered.slice(0, 10).map((idol, i) => {
        const color = GROUP_COLORS[idol.group] || "#888";
        return (
          <div key={idol.name} className="flex items-center gap-2">
            <div className="text-[11px] text-[#aaa] w-4">{i + 1}</div>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-medium shrink-0"
              style={{ background: `${color}22`, color }}>
              {idol.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium text-[#1A1A2E] dark:text-[#FFF6E5] truncate">{idol.name}</div>
              <div className="text-[10px] text-[#888]">{idol.group}</div>
            </div>
            <div className="w-20 h-1.5 bg-[#EEE9DF] dark:bg-[#2a2545] rounded overflow-hidden">
              <div className="h-full rounded" style={{ width: `${Math.round(idol.count/maxCount*100)}%`, background: color }} />
            </div>
            <div className="text-[12px] text-[#888] w-6 text-right">{idol.count}</div>
          </div>
        );
      })}
      {filtered.length === 0 && (
        <div className="text-[13px] text-[#aaa] text-center py-4">이 기간에 데이터가 없어요</div>
      )}
    </div>
  );
}

function LiveFeed({ events }: { events: RecentEvent[] }) {
  if (events.length === 0) return (
    <div className="text-[13px] text-[#aaa] text-center py-6">아직 이벤트가 없어요</div>
  );
  return (
    <div className="space-y-2 max-h-72 overflow-y-auto">
      {events.map((e) => {
        const meta = EVENT_LABELS[e.event] || { label: e.event, color: "#888", icon: "•" };
        return (
          <div key={e.id} className="flex items-center gap-3 py-2 border-b border-[#EEE9DF] dark:border-[#2a2545] last:border-0">
            <span className="text-base">{meta.icon}</span>
            <div className="flex-1 min-w-0">
              <span className="text-[12px] font-medium" style={{ color: meta.color }}>{meta.label}</span>
              {e.idol_name && (
                <span className="text-[12px] text-[#888] ml-2">{e.idol_name}
                  {e.group_name && <span className="text-[11px] text-[#bbb] ml-1">· {e.group_name}</span>}
                  {e.score && <span className="text-[11px] ml-1 font-medium" style={{ color: meta.color }}>{e.score}%</span>}
                </span>
              )}
            </div>
            <div className="text-[11px] text-[#bbb] shrink-0">{timeAgo(e.created_at)}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── 메인 대시보드 ──────────────────────────────────────────────

export default function AdminDashboard({ data }: Props) {
  const { funnel, idolTop, trend, recent, groupData, days } = data;
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [filterGroup, setFilterGroup] = useState("all");
  const [activeTab, setActiveTab] = useState<"funnel" | "trend" | "feed">("funnel");

  const handleDays = (d: string) => {
    startTransition(() => router.push(`/admin?days=${d}`));
  };

  // 퍼널 지표
  const cardRate   = pct(funnel.card_generated, funnel.birth_submitted);
  const shareRate  = pct(funnel.share_clicked, funnel.card_generated);
  const totalEvents = Object.values(funnel).reduce((a, b) => a + b, 0);

  const groups = ["all", ...Array.from(new Set(idolTop.map(i => i.group)))].slice(0, 7);

  return (
    <div className="min-h-screen bg-[#FBF6E8] dark:bg-[#0F0828] p-4 md:p-6 font-sans">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xl font-medium">
            <span className="text-[#C8385A]">K</span>
            <span className="text-[#1A1A2E] dark:text-[#FFF6E5]">Saju</span>
            <span className="text-[#888] ml-2 text-base">Analytics</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="text-[12px] bg-[#F5F0E8] dark:bg-[#1a1535] border border-[#E0D8CC] dark:border-[#2a2545] rounded-lg px-3 py-1.5 text-[#1A1A2E] dark:text-[#FFF6E5]"
            value={days}
            onChange={(e) => handleDays(e.target.value)}
          >
            <option value="7">최근 7일</option>
            <option value="30">최근 30일</option>
            <option value="90">최근 90일</option>
          </select>
          <button
            onClick={() => router.refresh()}
            className="text-[12px] bg-[#5ca88a22] text-[#5ca88a] border border-[#5ca88a44] rounded-full px-3 py-1 flex items-center gap-1 hover:bg-[#5ca88a33] transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#5ca88a] animate-pulse inline-block" />
            새로고침
          </button>
        </div>
      </div>

      {/* 총 이벤트 배너 */}
      <div className="mb-4 text-[12px] text-[#888] bg-[#F5F0E8] dark:bg-[#1a1535] rounded-lg px-4 py-2 border border-[#E8E0D0] dark:border-[#2a2545]">
        최근 {days}일간 총 <span className="font-medium text-[#C8385A]">{totalEvents.toLocaleString()}</span>개 이벤트 수집됨
      </div>

      {/* 지표 카드 4개 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <MetricCard
          label="생일 입력"
          value={funnel.birth_submitted.toLocaleString()}
          sub="전체 입력 완료 수"
        />
        <MetricCard
          label="카드 생성률"
          value={cardRate}
          sub={`${funnel.card_generated} / ${funnel.birth_submitted}`}
          warn={parseInt(cardRate) < 60}
        />
        <MetricCard
          label="공유 클릭률"
          value={shareRate}
          sub={`${funnel.share_clicked} / ${funnel.card_generated}`}
          warn={parseInt(shareRate) < 15}
        />
        <MetricCard
          label="재선택률"
          value={pct(funnel.another_idol_clicked, funnel.card_generated)}
          sub={`${funnel.another_idol_clicked}번 다시 선택`}
        />
      </div>

      {/* 메인 2컬럼 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

        {/* 좌: 탭 카드 (퍼널 / 트렌드 / 라이브) */}
        <div className="bg-white dark:bg-[#1a1535] rounded-2xl border border-[#E8E0D0] dark:border-[#2a2545] p-4">
          {/* 탭 */}
          <div className="flex gap-1 mb-4">
            {(["funnel","trend","feed"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-[12px] px-3 py-1 rounded-lg transition-colors ${
                  activeTab === tab
                    ? "bg-[#C8385A] text-white"
                    : "text-[#888] hover:bg-[#F5F0E8] dark:hover:bg-[#2a2545]"
                }`}
              >
                {tab === "funnel" ? "전환 퍼널" : tab === "trend" ? "일별 트렌드" : "실시간 피드"}
              </button>
            ))}
          </div>

          {activeTab === "funnel" && (
            <>
              <FunnelBar label="생일 입력" count={funnel.birth_submitted} max={funnel.birth_submitted} pctLabel="100%" color="#C8385A" />
              <FunnelBar label="아이돌 선택" count={funnel.idol_selected} max={funnel.birth_submitted} pctLabel={pct(funnel.idol_selected, funnel.birth_submitted)} color="#C49A3F" />
              <FunnelBar label="카드 생성" count={funnel.card_generated} max={funnel.birth_submitted} pctLabel={cardRate} color="#88B0BC" />
              <FunnelBar label="공유 클릭" count={funnel.share_clicked} max={funnel.birth_submitted} pctLabel={shareRate} color="#5b7ec7" />
              <FunnelBar label="다시 선택" count={funnel.another_idol_clicked} max={funnel.birth_submitted} pctLabel={pct(funnel.another_idol_clicked, funnel.birth_submitted)} color="#888" />
            </>
          )}

          {activeTab === "trend" && (
            <>
              <div className="flex gap-3 text-[11px] mb-2">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block bg-[#C8385A]" />생일 입력</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block bg-[#C49A3F]" />카드 생성</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block bg-[#5b7ec7]" />공유</span>
              </div>
              <TrendBars trend={trend} />
            </>
          )}

          {activeTab === "feed" && <LiveFeed events={recent} />}
        </div>

        {/* 우: 인기 아이돌 */}
        <div className="bg-white dark:bg-[#1a1535] rounded-2xl border border-[#E8E0D0] dark:border-[#2a2545] p-4">
          <div className="text-[11px] uppercase tracking-widest text-[#888] mb-3">인기 아이돌 Top 10</div>
          {/* 그룹 필터 */}
          <div className="flex flex-wrap gap-1 mb-3">
            {groups.map((g) => (
              <button
                key={g}
                onClick={() => setFilterGroup(g)}
                className={`text-[11px] px-2.5 py-0.5 rounded-full border transition-colors ${
                  filterGroup === g
                    ? "bg-[#C8385A] text-white border-[#C8385A]"
                    : "border-[#E8E0D0] dark:border-[#2a2545] text-[#888] hover:border-[#C8385A]"
                }`}
              >
                {g === "all" ? "전체" : g}
              </button>
            ))}
          </div>
          <IdolRankList idols={idolTop} filterGroup={filterGroup} />
        </div>
      </div>

      {/* 그룹 비율 바 */}
      <div className="bg-white dark:bg-[#1a1535] rounded-2xl border border-[#E8E0D0] dark:border-[#2a2545] p-4">
        <div className="text-[11px] uppercase tracking-widest text-[#888] mb-4">그룹별 인기 비율</div>
        <div className="flex gap-1 h-8 rounded-lg overflow-hidden">
          {groupData.map((g) => {
            const total = groupData.reduce((a, b) => a + b.count, 0) || 1;
            const w = Math.round(g.count / total * 100);
            const color = GROUP_COLORS[g.group] || "#888";
            return (
              <div
                key={g.group}
                className="flex items-center justify-center text-[10px] font-medium text-white transition-all"
                style={{ width: `${w}%`, background: color, minWidth: w > 0 ? "4px" : "0" }}
                title={`${g.group}: ${w}%`}
              >
                {w > 8 ? g.group : ""}
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-3 mt-3">
          {groupData.map((g) => {
            const total = groupData.reduce((a, b) => a + b.count, 0) || 1;
            const color = GROUP_COLORS[g.group] || "#888";
            return (
              <div key={g.group} className="flex items-center gap-1.5 text-[11px]">
                <span className="w-2 h-2 rounded-sm inline-block" style={{ background: color }} />
                <span className="text-[#888]">{g.group}</span>
                <span className="font-medium text-[#1A1A2E] dark:text-[#FFF6E5]">{Math.round(g.count/total*100)}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 푸터 */}
      <div className="mt-4 text-center text-[11px] text-[#bbb]">
        KSaju Admin · ksaju.me · 데이터: Supabase analytics_events
      </div>
    </div>
  );
}
