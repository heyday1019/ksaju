import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getCardById, tarotFallbackReading } from "@/lib/tarot";
import { elementOf, WUXING_META } from "@/lib/saju-display";
import { HEAVENLY_STEMS } from "@/lib/saju-data";
import { routing, type Locale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

const VALID_STEMS: Set<string> = new Set(HEAVENLY_STEMS.map((s) => s.char));
const LANG_MAP: Record<Locale, string> = {
  en: "English", ja: "Japanese", ko: "Korean", "zh-TW": "Traditional Chinese",
};

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const cardId = Number(searchParams.get("cardId"));
  const dayMaster = searchParams.get("dayMaster") ?? "";
  const localeParam = searchParams.get("locale") ?? "en";
  const locale: Locale = routing.locales.includes(localeParam as Locale)
    ? (localeParam as Locale) : "en";

  const card = getCardById(cardId);
  if (!card) return NextResponse.json({ error: "Invalid cardId" }, { status: 400 });
  if (!VALID_STEMS.has(dayMaster)) return NextResponse.json({ error: "Invalid dayMaster" }, { status: 400 });

  const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
  const elementLabel = WUXING_META[elementOf(dayMaster)].label;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: cached } = await supabase
    .from("tarot_readings")
    .select("*")
    .eq("date", todayStr).eq("card_id", card.id).eq("day_master", dayMaster).eq("locale", locale)
    .maybeSingle();
  if (cached) return NextResponse.json(cached);

  const lang = LANG_MAP[locale];
  const prompt = `The drawn tarot card is "${card.name_en}" (${card.name_kr}). Its upright theme: "${card.theme}".
Keywords: ${card.keywords}. The reader's saju day master is ${dayMaster} (${elementLabel}).

Write a 2-3 sentence (35-55 word) upright tarot reading for a K-pop fan, in ${lang}.
Tone: warm, playful, Gen Z, encouraging and teen-safe (no romance-heavy or scary framing).
Lightly connect the card's meaning to their ${elementLabel} energy. End on an uplifting note.

Respond ONLY with the reading text — no JSON, no card name header, no markdown.`;

  try {
    const llmRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://ksaju.me",
        "X-Title": "KSaju Tarot",
      },
      body: JSON.stringify({
        model: "anthropic/claude-haiku-4-5-20251001",
        max_tokens: 160, temperature: 0.85,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!llmRes.ok) throw new Error(`OpenRouter ${llmRes.status}`);
    const llmJson = await llmRes.json() as { choices?: Array<{ message?: { content?: string } }> };
    const message = (llmJson.choices?.[0]?.message?.content ?? "").trim();
    if (!message || message.length > 400) throw new Error("Invalid LLM message");

    const { data: inserted } = await supabase
      .from("tarot_readings")
      .upsert(
        { date: todayStr, card_id: card.id, day_master: dayMaster, locale, message },
        { onConflict: "date,card_id,day_master,locale" },
      )
      .select("*").maybeSingle();

    return NextResponse.json(
      inserted ?? { id: "fresh", date: todayStr, card_id: card.id, day_master: dayMaster, locale, message },
    );
  } catch (err) {
    console.error("[tarot-reading] fallback:", err);
    return NextResponse.json({
      id: "fallback", date: todayStr, card_id: card.id, day_master: dayMaster, locale,
      message: tarotFallbackReading(card, elementLabel),
    });
  }
}
