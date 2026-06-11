import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { birthToSaju } from "@/lib/saju";
import { stemRelation, type TimeRel } from "@/lib/fortune";
import { HEAVENLY_STEMS } from "@/lib/saju-data";
import { elementOf, WUXING_META } from "@/lib/saju-display";

export const revalidate = 86400;

const VALID_STEMS: Set<string> = new Set(HEAVENLY_STEMS.map((s) => s.char));

const FALLBACK: Record<TimeRel, { message: string; energy: number; lucky_color: string }> = {
  combo:         { message: "Stars align perfectly today — your bias era starts now! ✨",    energy: 5, lucky_color: "Hot Pink"      },
  same:          { message: "You're fully in your element today — ride the wave! 🌊",        energy: 4, lucky_color: "Golden Yellow" },
  "generate-me": { message: "The universe has your back today — lean into it! 🍀",           energy: 4, lucky_color: "Sage Green"    },
  "i-generate":  { message: "Your energy lights up everyone around you today! 💫",           energy: 3, lucky_color: "Lavender"      },
  control:       { message: "A little resistance makes you stronger — you've got this! 🔥",  energy: 3, lucky_color: "Dusty Rose"    },
  neutral:       { message: "A calm, steady day — perfect for planning your next era! 🌤️",  energy: 3, lucky_color: "Sky Blue"      },
};

export async function GET(request: NextRequest) {
  const dayMaster = request.nextUrl.searchParams.get("dayMaster");
  if (!dayMaster || !VALID_STEMS.has(dayMaster)) {
    return NextResponse.json({ error: "Invalid dayMaster" }, { status: 400 });
  }

  // Today's date in KST
  const now = new Date();
  const kstStr = now.toLocaleString("en-US", { timeZone: "Asia/Seoul" });
  const kst = new Date(kstStr);
  const kstYear = kst.getFullYear();
  const kstMonth = kst.getMonth() + 1;
  const kstDay = kst.getDate();
  const todayStr = `${kstYear}-${String(kstMonth).padStart(2, "0")}-${String(kstDay).padStart(2, "0")}`;

  // Today's day pillar via birthToSaju (server-only — safe in route handler)
  const todaySaju = birthToSaju({
    year: kstYear,
    month: kstMonth,
    day: kstDay,
    timezone: "Asia/Seoul",
  });
  const todayPillar = todaySaju.pillars.day;
  const todayStem = todayPillar[0];
  const relation = stemRelation(dayMaster, todayStem);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Cache hit
  const { data: cached } = await supabase
    .from("daily_fortunes")
    .select("*")
    .eq("date", todayStr)
    .eq("day_master", dayMaster)
    .maybeSingle();

  if (cached) return NextResponse.json(cached);

  // OpenRouter generation
  const elementLabel = WUXING_META[elementOf(dayMaster)].label;
  const prompt = `Today's day pillar is ${todayPillar}. The user's day master is ${dayMaster} (${elementLabel}).
Their cosmic relationship today is "${relation}".

Write exactly 1 uplifting sentence (30–40 words) for a K-pop fan's daily fortune.
Tone: playful, Gen Z, positive. You may reference K-pop/idol culture subtly.
Pick an energy level (1–5, where 5 is peak) and a lucky color name.

Respond ONLY with valid JSON — no markdown, no extra text:
{"message":"...","energy":4,"lucky_color":"Coral Pink"}`;

  try {
    const llmRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://ksaju.me",
        "X-Title": "KSaju Daily Fortune",
      },
      body: JSON.stringify({
        model: "anthropic/claude-haiku-4-5-20251001",
        max_tokens: 120,
        temperature: 0.8,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!llmRes.ok) throw new Error(`OpenRouter ${llmRes.status}`);

    const llmJson = await llmRes.json() as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = llmJson.choices?.[0]?.message?.content ?? "";
    const parsed = JSON.parse(content) as {
      message: string;
      energy: number;
      lucky_color: string;
    };

    if (
      typeof parsed.message !== "string" ||
      typeof parsed.energy !== "number" ||
      typeof parsed.lucky_color !== "string"
    ) {
      throw new Error("Invalid LLM response shape");
    }

    const energy = Math.max(1, Math.min(5, Math.round(parsed.energy)));

    const { data: inserted } = await supabase
      .from("daily_fortunes")
      .upsert(
        {
          date: todayStr,
          day_master: dayMaster,
          today_pillar: todayPillar,
          relation,
          message: parsed.message,
          energy,
          lucky_color: parsed.lucky_color,
        },
        { onConflict: "date,day_master" },
      )
      .select("*")
      .maybeSingle();

    return NextResponse.json(
      inserted ?? {
        id: "fresh",
        date: todayStr,
        day_master: dayMaster,
        today_pillar: todayPillar,
        relation,
        message: parsed.message,
        energy,
        lucky_color: parsed.lucky_color,
      },
    );
  } catch {
    // Fallback — static message, not saved to DB
    return NextResponse.json({
      id: "fallback",
      date: todayStr,
      day_master: dayMaster,
      today_pillar: todayPillar,
      relation,
      ...FALLBACK[relation],
    });
  }
}
