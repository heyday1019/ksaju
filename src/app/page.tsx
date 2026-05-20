import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="cosmic-bg min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8 text-center">
        <h1 className="text-6xl font-bold tracking-tight bg-gradient-to-br from-[#FFF6E5] to-[#F4C95D] bg-clip-text text-transparent">
          KSaju
        </h1>
        <p className="hanja text-2xl tracking-[0.5em]">사 주</p>
        <p className="font-serif italic text-xl text-[#FF4D8D]">
          Saju, but make it K.
        </p>
        
        <Card className="cosmic-card-bg border-white/10 mt-8">
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
        </Card>
      </div>
    </main>
  );
}