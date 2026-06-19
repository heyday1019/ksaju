import { NextRequest, NextResponse } from "next/server";
import { getCardById, tarotSpreadFallbackReading, type SpreadReading, type TarotCard } from "@/lib/tarot";
import { elementOf, WUXING_META } from "@/lib/saju-display";
import { HEAVENLY_STEMS } from "@/lib/saju-data";
import { routing, type Locale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

const VALID_STEMS: Set<string> = new Set(HEAVENLY_STEMS.map((s) => s.char));
const LANG_MAP: Record<Locale, string> = {
  en: "English", ja: "Japanese", ko: "Korean", "zh-TW": "Traditional Chinese",
};

function parseSpread(raw: string): SpreadReading | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    const o = JSON.parse(raw.slice(start, end + 1)) as Partial<SpreadReading>;
    const fields = [o.past, o.present, o.future, o.synthesis];
    if (fields.every((s) => typeof s === "string" && s.length > 0 && s.length < 400)) {
      return o as SpreadReading;
    }
  } catch { /* fall through to null */ }
  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const ids = (searchParams.get("cardIds") ?? "").split(",").map(Number);
  const dayMaster = searchParams.get("dayMaster") ?? "";
  const localeParam = searchParams.get("locale") ?? "en";
  const locale: Locale = routing.locales.includes(localeParam as Locale)
    ? (localeParam as Locale) : "en";

  if (ids.length !== 3 || ids.some((n) => Number.isNaN(n))) {
    return NextResponse.json({ error: "cardIds must be 3 numbers" }, { status: 400 });
  }
  const looked = ids.map(getCardById);
  if (looked.some((c) => c === null)) {
    return NextResponse.json({ error: "Invalid cardId" }, { status: 400 });
  }
  if (!VALID_STEMS.has(dayMaster)) {
    return NextResponse.json({ error: "Invalid dayMaster" }, { status: 400 });
  }
  const trio = looked as [TarotCard, TarotCard, TarotCard];
  const element = elementOf(dayMaster);
  const elementLabel = WUXING_META[element].label;
  const lang = LANG_MAP[locale];
  const [p, c, f] = trio;

  const prompt = `A 3-card past/present/future tarot spread for a K-pop fan. Day master: ${dayMaster} (${elementLabel}).
Past card: "${p.name_en}" — ${p.theme} (${p.keywords}).
Present card: "${c.name_en}" — ${c.theme} (${c.keywords}).
Future card: "${f.name_en}" — ${f.theme} (${f.keywords}).

Write upright readings in ${lang}, warm/playful/Gen Z and teen-safe (no romance-heavy or scary framing).
Lightly weave in their ${elementLabel} energy. Return ONLY minified JSON with keys past, present, future, synthesis.
- past, present, future: ONE sentence each (<=25 words) for that card in its position.
- synthesis: 2 sentences (<=45 words) tying the three into one uplifting story arc.
No markdown, no extra keys.`;

  try {
    const llmRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://ksaju.me",
        "X-Title": "KSaju Tarot Spread",
      },
      body: JSON.stringify({
        model: "anthropic/claude-haiku-4.5",
        max_tokens: 400, temperature: 0.85,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!llmRes.ok) throw new Error(`OpenRouter ${llmRes.status}`);
    const llmJson = await llmRes.json() as { choices?: Array<{ message?: { content?: string } }> };
    const parsed = parseSpread((llmJson.choices?.[0]?.message?.content ?? "").trim());
    if (!parsed) throw new Error("Invalid LLM JSON");
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("[tarot-spread-reading] fallback:", err);
    return NextResponse.json(tarotSpreadFallbackReading(trio, element, locale));
  }
}
