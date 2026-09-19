import { Suspense, lazy, useEffect, useState } from "react";
import { TabNav, type Screen } from "./components/TabNav";
import { MySajuScreen } from "./screens/MySajuScreen";
import { BannerAd } from "./components/ads/BannerAd";
import {
  loadProfiles,
  getActiveProfile,
  setActiveProfile,
  upsertProfile,
  removeProfile,
  type Profile,
} from "./state/profiles";
import type { BirthData } from "./lib/kst-types";

// 콘솔에서 발급받은 하단 고정 배너 지면.
const BANNER_AD_GROUP_ID = "ait.v2.live.14d7a4538d864d74";

// 첫 화면(내 사주)만 초기 청크에 싣고, 나머지 탭은 눌렀을 때 받는다.
// (궁합은 아이돌 DB 60KB, 타로는 카드 데이터 24KB를 함께 끌고 온다)
const CompatScreen = lazy(() =>
  import("./screens/CompatScreen").then((m) => ({ default: m.CompatScreen })),
);
const TarotScreen = lazy(() =>
  import("./screens/TarotScreen").then((m) => ({ default: m.TarotScreen })),
);
const SpreadScreen = lazy(() =>
  import("./screens/SpreadScreen").then((m) => ({ default: m.SpreadScreen })),
);

function TabFallback() {
  return <p className="py-10 text-center text-sm text-gray-400">불러오는 중…</p>;
}

// 자체 헤더는 두지 않는다 — 앱 이름/로고는 앱인토스 공통 내비게이션 바가 그린다.
// (자체 헤더는 인앱 브라우저처럼 보여 심사 반려 사유)
export default function App() {
  const [screen, setScreen] = useState<Screen>("saju");
  const [profiles, setProfiles] = useState<Profile[]>(loadProfiles);
  const [activeId, setActiveId] = useState<string | null>(
    () => getActiveProfile()?.id ?? null,
  );
  const active = profiles.find((p) => p.id === activeId) ?? null;

  // 공통 내비게이션 백버튼 = history.back().
  // 탭 전환을 history 에 쌓아 백버튼이 이전 탭으로 돌아가게 하고,
  // 최초 탭(쌓인 항목 0)에서는 그대로 미니앱이 종료되도록 둔다.
  function go(next: Screen) {
    if (next === screen) return;
    window.history.pushState({ screen: next }, "");
    setScreen(next);
  }

  useEffect(() => {
    function onPop(e: PopStateEvent) {
      const s = (e.state as { screen?: Screen } | null)?.screen;
      setScreen(s ?? "saju");
    }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  function select(id: string) {
    setActiveProfile(id);
    setActiveId(id);
  }

  async function add(name: string, birth: BirthData) {
    const { birthToSaju } = await import("./lib/saju");
    const p = upsertProfile({
      name: name || (profiles.length === 0 ? "나" : "이름 없음"),
      saju: birthToSaju(birth),
    });
    setProfiles(loadProfiles());
    setActiveId(p.id);
  }

  function remove(id: string) {
    const left = removeProfile(id);
    setProfiles(left);
    setActiveId(getActiveProfile()?.id ?? null);
  }

  return (
    <div className="app-root hanji-paper min-h-screen">
      {/* 하단 도크(배너+탭바)가 가리지 않도록 본문 아래 여백을 넉넉히 둔다 */}
      <main className="px-4 pt-4 pb-56">
        {screen === "saju" && (
          <MySajuScreen
            profiles={profiles}
            active={active}
            onSelect={select}
            onAdd={add}
            onRemove={remove}
          />
        )}
        <Suspense fallback={<TabFallback />}>
          {screen === "compat" && (
            <CompatScreen
              profiles={profiles}
              me={active}
              onNeedSaju={() => go("saju")}
            />
          )}
          {screen === "tarot" && (
            <TarotScreen me={active} onNeedSaju={() => go("saju")} />
          )}
          {screen === "spread" && (
            <SpreadScreen me={active} onNeedSaju={() => go("saju")} />
          )}
        </Suspense>
      </main>

      {/* 광고를 탭바가 덮지 않도록 배너를 탭바 위에 쌓는다(광고 은닉·겹침 금지) */}
      <div
        className="fixed inset-x-0 bottom-0 z-10"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <TabNav active={screen} onChange={go} />
        <BannerAd adGroupId={BANNER_AD_GROUP_ID} />
      </div>
    </div>
  );
}
