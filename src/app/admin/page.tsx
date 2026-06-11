// src/app/admin/page.tsx
// KSaju Admin Dashboard — 실시간 analytics_events 시각화
// Supabase → 서버 컴포넌트로 직접 쿼리 (SSR, 노출 없음)
//
// 환경변수 필요:
//   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (서버 전용)
//   ADMIN_PASSWORD (미들웨어 인증용)

export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@supabase/supabase-js";
import AdminDashboard from "@/components/admin/AdminDashboard";

// ─── 서버사이드 쿼리 ──────────────────────────────────────────────

async function getAnalytics(days: number = 7) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // 서버 전용 — 클라이언트 노출 금지
  );

  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceISO = since.toISOString();

  // 1. 전체 이벤트 카운트 (퍼널)
  const { data: funnelRaw } = await supabase
    .from("analytics_events")
    .select("event")
    .gte("created_at", sinceISO);

  const counts = (funnelRaw || []).reduce<Record<string, number>>((acc, r) => {
    acc[r.event] = (acc[r.event] || 0) + 1;
    return acc;
  }, {});

  // 2. 인기 아이돌 TOP 15 — props JSONB에서 추출 (idol_name, group)
  const { data: idolRaw } = await supabase
    .from("analytics_events")
    .select("props")
    .eq("event", "idol_selected")
    .gte("created_at", sinceISO)
    .not("props", "is", null);

  const idolMap = new Map<string, { name: string; group: string; count: number }>();
  (idolRaw || []).forEach((r) => {
    const p = r.props as Record<string, unknown> | null;
    const name = p?.idol_name as string | undefined;
    const group = (p?.group ?? p?.group_name) as string | undefined;
    if (!name) return;
    if (!idolMap.has(name)) idolMap.set(name, { name, group: group || "", count: 0 });
    idolMap.get(name)!.count++;
  });
  const idolTop = Array.from(idolMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  // 3. 일별 트렌드 (최근 7일)
  const { data: trendRaw } = await supabase
    .from("analytics_events")
    .select("event, created_at")
    .in("event", ["birth_submitted", "card_generated", "share_clicked"])
    .gte("created_at", sinceISO)
    .order("created_at", { ascending: true });

  const trendMap = new Map<string, { submitted: number; generated: number; shared: number }>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    trendMap.set(key, { submitted: 0, generated: 0, shared: 0 });
  }
  (trendRaw || []).forEach((r) => {
    const key = r.created_at.slice(0, 10);
    if (!trendMap.has(key)) return;
    const day = trendMap.get(key)!;
    if (r.event === "birth_submitted") day.submitted++;
    if (r.event === "card_generated") day.generated++;
    if (r.event === "share_clicked") day.shared++;
  });
  const trend = Array.from(trendMap.entries()).map(([date, v]) => ({ date, ...v }));

  // 4. 최근 이벤트 20개 (라이브 피드) — props JSONB에서 추출
  const { data: recentRaw } = await supabase
    .from("analytics_events")
    .select("id, event, props, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  const recent = (recentRaw || []).map((r) => {
    const p = r.props as Record<string, unknown> | null;
    return {
      id: r.id as number,
      event: r.event as string,
      idol_name: (p?.idol_name as string) ?? null,
      group_name: ((p?.group ?? p?.group_name) as string) ?? null,
      score: (p?.score as number) ?? null,
      created_at: r.created_at as string,
    };
  });

  // 5. 그룹별 비율
  const groupMap = new Map<string, number>();
  idolMap.forEach((v) => {
    const g = v.group || "Other";
    groupMap.set(g, (groupMap.get(g) || 0) + v.count);
  });
  const groupData = Array.from(groupMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([group, count]) => ({ group, count }));

  // 6. share_clicked kind 분해 (compat / fortune / daily_fortune)
  const { data: shareKindRaw } = await supabase
    .from("analytics_events")
    .select("props")
    .eq("event", "share_clicked")
    .gte("created_at", sinceISO);

  const shareByKind = { compat: 0, fortune: 0, daily_fortune: 0 };
  (shareKindRaw || []).forEach((r) => {
    const kind = (r.props as Record<string, unknown> | null)?.kind;
    if (kind === "compat") shareByKind.compat++;
    else if (kind === "fortune") shareByKind.fortune++;
    else if (kind === "daily_fortune") shareByKind.daily_fortune++;
  });

  // 7. daily_fortunes — 오늘(KST) 캐시된 일간 수
  const kstNow = new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" });
  const todayStr = new Date(kstNow).toISOString().slice(0, 10);
  const { count: dailyFortuneToday } = await supabase
    .from("daily_fortunes")
    .select("id", { count: "exact", head: true })
    .eq("date", todayStr);

  return {
    funnel: {
      birth_submitted: counts["birth_submitted"] || 0,
      idol_selected: counts["idol_selected"] || 0,
      card_generated: counts["card_generated"] || 0,
      share_clicked: counts["share_clicked"] || 0,
      another_idol_clicked: counts["another_idol_clicked"] || 0,
    },
    idolTop,
    trend,
    recent,
    groupData,
    shareByKind,
    dailyFortuneToday: dailyFortuneToday ?? 0,
    days,
    fetchedAt: new Date().toISOString(),
  };
}

// ─── 페이지 컴포넌트 ──────────────────────────────────────────────

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const { days: daysParam } = await searchParams;
  const days = parseInt(daysParam || "7", 10);
  const data = await getAnalytics(days);
  return <AdminDashboard data={data} />;
}
