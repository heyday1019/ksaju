import { useState } from "react";
import { TabNav, type Screen } from "./components/TabNav";
import { MySajuScreen } from "./screens/MySajuScreen";
import { CompatScreen } from "./screens/CompatScreen";
import { TarotScreen } from "./screens/TarotScreen";
import { SpreadScreen } from "./screens/SpreadScreen";
import { loadUserSaju, saveUserSaju } from "./state/user-saju";
import type { UserSaju } from "./lib/saju-types";

export default function App() {
  const [screen, setScreen] = useState<Screen>("saju");
  const [userSaju, setUserSaju] = useState<UserSaju | null>(loadUserSaju());

  function onCalc(s: UserSaju) {
    setUserSaju(s);
    saveUserSaju(s);
  }

  return (
    <div className="min-h-screen">
      <header className="px-4 py-3 text-lg font-bold text-[var(--color-jindallae)]">
        K사주
      </header>
      <main className="px-4 pb-24">
        {screen === "saju" && <MySajuScreen saju={userSaju} onCalc={onCalc} />}
        {screen === "compat" && (
          <CompatScreen me={userSaju} onNeedSaju={() => setScreen("saju")} />
        )}
        {screen === "tarot" && (
          <TarotScreen me={userSaju} onNeedSaju={() => setScreen("saju")} />
        )}
        {screen === "spread" && (
          <SpreadScreen me={userSaju} onNeedSaju={() => setScreen("saju")} />
        )}
      </main>
      <TabNav active={screen} onChange={setScreen} />
    </div>
  );
}
