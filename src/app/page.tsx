import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function Home() {
  return (
    <main className="hanji-paper cosmic-bg min-h-screen relative overflow-hidden">
      {/* 페이지 상단 창살 */}
      <div className="changsal-band absolute top-0 left-0 right-0 z-40" />

      {/* 우상단 테마 토글 (상단 창살 아래에 위치) */}
      <div className="absolute top-12 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* 거대 ㅎ — 우측하단 배경. Dark에서 opacity 낮춰 코스믹 위 잡음 줄임 */}
      <span
        className="font-calli ink-bleed absolute -right-[3%] -bottom-[10%] text-[32rem] leading-none text-accent/55 dark:text-accent/35 select-none pointer-events-none z-0"
        aria-hidden="true"
      >
        ㅎ
      </span>

      {/* Hero 콘텐츠 */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen py-14 px-8">
        <div className="max-w-2xl w-full space-y-6 text-center">
          <h1 className="font-display text-7xl font-bold tracking-tight bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
            KSaju
          </h1>
          <p className="hanja text-5xl font-bold tracking-[0.4em]">사 주</p>
          <p className="font-serif italic text-xl text-primary">
            Saju, but make it K.
          </p>

          <Card className="relative overflow-hidden border-border mt-8 py-6">
            {/* 카드 상단 창살 */}
            <div
              className="changsal-band absolute top-0 left-0 right-0 h-[18px] z-10"
              style={{ backgroundSize: "40px 18px" }}
            />
            <CardHeader>
              <CardTitle className="text-2xl">Your Inyeon Awaits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Korean fortune for the K-content generation. Built on KASI manseryeok.
              </p>
              <div className="flex gap-4 justify-center pt-4">
                <Button size="lg">Discover your saju</Button>
                <Button size="lg" variant="outline">Learn more</Button>
              </div>
            </CardContent>
            {/* 카드 하단 창살 */}
            <div
              className="changsal-band absolute bottom-0 left-0 right-0 h-[18px] z-10"
              style={{ backgroundSize: "40px 18px" }}
            />
          </Card>
        </div>
      </div>

      {/* 페이지 하단 창살 */}
      <div className="changsal-band absolute bottom-0 left-0 right-0 z-40" />
    </main>
  );
}
