// data/card-guides/<locale>.json 초안 생성기. 1회성 저작 도구 — 앱에서는 절대 실행되지 않는다.
//
//   npm run draft:cards -- --lang en --suit major
//   npm run draft:cards -- --lang ko,ja,zh-TW --suit major
//   npm run draft:cards -- --lang ko --force the-fool
//
// 이미 채워진 슬러그는 건너뛴다(idempotent). 손질한 본문을 덮어쓰지 않고, 중단해도 이어서 돌릴 수 있다.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cards = JSON.parse(readFileSync(join(root, "data", "ksaju-tarot.json"), "utf8"));
const guideDir = join(root, "data", "card-guides");
const MODEL = "anthropic/claude-haiku-4.5";
const LOCALES = ["en", "ko", "ja", "zh-TW"];
const LANG_NAME = { en: "English", ko: "Korean", ja: "Japanese", "zh-TW": "Traditional Chinese (Taiwan)" };
const FIELDS = ["title", "summary", "meaning", "symbols", "upright", "reversed", "love", "work", "sajuLens"];

// ---------- CLI ----------
function arg(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : process.argv[i + 1];
}
const langs = (arg("lang", "en")).split(",").map((s) => s.trim());
const suit = arg("suit", "major");
const force = arg("force");
for (const l of langs) if (!LOCALES.includes(l)) throw new Error(`Unknown locale: ${l}`);

const apiKey = process.env.OPENROUTER_API_KEY;
if (!apiKey) {
  console.error("OPENROUTER_API_KEY is not set. Export it and re-run.");
  process.exit(1);
}

// ---------- card_prompt: 그림에 실제로 그려진 것 ----------
function parseCsv(text) {
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false; }
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\r") { /* skip */ }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.length > 1);
}
const csvRows = parseCsv(readFileSync(join(root, "docs", "tarot-cards.csv"), "utf8"));
const csvHeader = csvRows[0];
const promptByName = new Map(
  csvRows.slice(1).map((r) => [r[csvHeader.indexOf("name_en")], r[csvHeader.indexOf("card_prompt")]]),
);

// ---------- slug (src/lib/card-guides.ts 의 cardSlug 와 동일 규칙) ----------
const slugOf = (card) =>
  card.name_en.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// ---------- 파일 I/O ----------
function loadGuides(locale) {
  const path = join(guideDir, `${locale}.json`);
  return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : {};
}
function saveGuides(locale, guides) {
  mkdirSync(guideDir, { recursive: true });
  // 카드 id 순으로 정렬해 diff를 읽을 수 있게 유지한다.
  const ordered = {};
  for (const card of cards) {
    const s = slugOf(card);
    if (guides[s]) ordered[s] = guides[s];
  }
  writeFileSync(join(guideDir, `${locale}.json`), JSON.stringify(ordered, null, 2) + "\n", "utf8");
}

// ---------- 검증: 통과 못 하면 그 카드는 저장하지 않는다 ----------
// summary 길이는 로케일마다 다르다. CJK 한 글자가 라틴 문자보다 훨씬 많은 정보를 담아서,
// 같은 내용의 한국어 요약은 영어의 절반도 안 되는 글자 수로 끝난다.
// 구글이 메타 설명을 자르는 지점(약 920px)도 라틴 ~155자 / CJK ~65자로 갈린다.
// 여기에 영어 기준(120-200)을 그대로 적용하면 번역본이 전부 검증 실패한다.
const SUMMARY_RANGE = { en: [120, 200], ko: [45, 90], ja: [38, 90], "zh-TW": [30, 85] };

// ja/zh-TW must never contain Hangul — see 2026-09-04-card-guides Task 11 fix round.
// Prompt compliance alone let Korean script leak into both locales; this is the durable guard.
const HANGUL_RE = /[가-힣]/;
function proseFields(guide) {
  const out = [["title", guide.title], ["summary", guide.summary]];
  guide.meaning.forEach((p, i) => out.push([`meaning[${i}]`, p]));
  guide.symbols.forEach((s, i) => {
    out.push([`symbols[${i}].label`, s.label]);
    out.push([`symbols[${i}].text`, s.text]);
  });
  out.push(["upright", guide.upright], ["reversed", guide.reversed], ["love", guide.love], ["work", guide.work], ["sajuLens", guide.sajuLens]);
  return out;
}

function validate(guide, slug, locale, card) {
  for (const f of FIELDS) if (guide[f] === undefined) throw new Error(`${slug}: missing ${f}`);
  if (!Array.isArray(guide.meaning) || guide.meaning.length < 2) throw new Error(`${slug}: meaning needs 2+ paragraphs`);
  if (!Array.isArray(guide.symbols) || guide.symbols.length < 3) throw new Error(`${slug}: symbols needs 3+ entries`);
  for (const s of guide.symbols) {
    if (!s.label?.trim() || !s.text?.trim()) throw new Error(`${slug}: symbol missing label/text`);
  }
  const [min, max] = SUMMARY_RANGE[locale];
  if (guide.summary.length < min || guide.summary.length > max) {
    throw new Error(`${slug}: summary is ${guide.summary.length} chars, need ${min}-${max} for ${locale}`);
  }
  for (const f of ["title", "upright", "reversed", "love", "work", "sajuLens"]) {
    if (!String(guide[f]).trim()) throw new Error(`${slug}: ${f} is blank`);
  }
  // 메타 디스크립션에는 카드 이름이 들어가야 검색 결과에서 어느 카드인지 보인다.
  // 번역본은 자국어로 쓰이므로 영어 이름을 요구하지 않는다.
  if (locale === "en" && card && !guide.summary.toLowerCase().includes(card.name_en.toLowerCase())) {
    throw new Error(`${slug}: summary must contain the card name "${card.name_en}"`);
  }
  // 같은 한자를 괄호로 되풀이하는 버릇(火(火))이 있다. 프롬프트 규칙만으로는 막히지 않아
  // — 메이저 22장 때 12장에서 나왔고 손으로 고쳤다 — 검증으로 고정한다.
  for (const [field, value] of proseFields(guide)) {
    const m = String(value).match(/([\u4e00-\u9fff])\s*[(（]\s*\1\s*[)）]/);
    if (m) throw new Error(`${slug}: ${field} repeats a hanja in parentheses ("${m[0]}") — write "火 — fire" instead`);
  }

  if (locale === "ja" || locale === "zh-TW") {
    for (const [field, value] of proseFields(guide)) {
      const text = String(value);
      const idx = text.search(HANGUL_RE);
      if (idx !== -1) {
        const snippet = text.slice(Math.max(0, idx - 15), idx + 25);
        throw new Error(`${slug}: ${field} contains Hangul near "${snippet}"`);
      }
    }
  }
  return guide;
}

async function ask(system, user) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      response_format: { type: "json_object" },
      max_tokens: 4000,
    }),
  });
  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${await res.text()}`);
  const body = await res.json();
  const content = body.choices?.[0]?.message?.content;
  if (!content) throw new Error(`OpenRouter response has no message content: ${JSON.stringify(body)}`);
  let text = content.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```[a-zA-Z]*\n?/, "").replace(/```\s*$/, "").trim();
  }
  // 모델이 배열/객체 마지막 항목 뒤에 쉼표를 남기는 일이 있다. JSON.parse 는 거부한다.
  text = text.replace(/,(\s*[}\]])/g, "$1");
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`Failed to parse model response as JSON: ${err.message}. Raw content starts with: ${text.slice(0, 200)}`);
  }
}

const shapeFor = (locale) => `Return ONE JSON object with exactly these keys:
{
  "title": string,
  "summary": string (${SUMMARY_RANGE[locale][0]}-${SUMMARY_RANGE[locale][1]} characters — this is a meta description, and the limit differs by language because CJK characters carry more per glyph),
  "meaning": [string, string]  (2 paragraphs, 60-90 words each),
  "symbols": [{"label": string, "text": string}] (3-4 entries, 30-50 words each),
  "upright": string (3-4 sentences),
  "reversed": string (3 sentences),
  "love": string (one sentence),
  "work": string (one sentence),
  "sajuLens": string (one paragraph, 80-110 words)
}
No markdown, no extra keys, no commentary.`;

const VOICE = `You write for KSaju, a Korean saju and tarot site for an international audience.
Voice: plain, specific, quietly witty. Short sentences. No mysticism-for-its-own-sake,
no "the universe wants you to", no second-person life advice that could apply to anyone.
Never claim accuracy or real divination — the site's disclaimer is "For entertainment".
Write about this specific card, not about tarot in general.

CRITICAL — "symbols" must describe imagery that is ACTUALLY DRAWN on this card. You are
given the art-direction prompt the illustration was generated from. Use only what it
contains. Do not invent objects, animals, or colours that are not in it.

CRITICAL — "sajuLens" is what makes this page worth existing. Connect the card to the
five elements (오행: wood/fire/earth/metal/water) and to the 일간 (Day Master) concept.
Say how the card reads differently for someone whose Day Master is one element versus
another. Be concrete. When naming a bare element in English, write the single hanja with
an English gloss — "火 — fire" or "火 (fire)" — never repeat the same character in
parentheses as "火(火)".`;

async function draftEnglish(card, exemplar, note = "") {
  const system = `${VOICE}\n\n${shapeFor("en")}`;
  const user = `Write the English guide for this tarot card.

name_en: ${card.name_en}
name_kr: ${card.name_kr}
suit: ${card.suit}
rank: ${card.rank}
element: ${card.element ?? "none (Major Arcana)"}
theme: ${card.theme}
keywords: ${card.keywords}

Art-direction prompt the illustration was generated from (the ONLY source for "symbols"):
${promptByName.get(card.name_en) ?? "(unavailable — describe symbols only in general terms)"}

Here is an existing entry in the exact voice and shape to match:
${JSON.stringify(exemplar, null, 2)}${note}`;
  return ask(system, user);
}

async function translate(card, source, locale, note = "") {
  const hangulRule = locale === "ja"
    ? `CRITICAL — the output must contain NO Hangul (Korean script) anywhere, in any field.
The Korean card name given below is context only, to help you identify the card — never
reproduce it in Korean script. Render Korean terms (사주, 일간, 오행, element names, the
card's Korean title, etc.) in katakana, or in kanji where a real Japanese word already
exists for the concept (e.g. 五行, 日干 read as Japanese, not copied as Korean).`
    : locale === "zh-TW"
      ? `CRITICAL — the output must contain NO Hangul (Korean script) anywhere, in any field.
The Korean card name given below is context only, to help you identify the card — never
reproduce it in Korean script. Render Korean terms (사주, 일간, 오행, element names, the
card's Korean title, etc.) using Chinese characters (e.g. 四柱, 日干, 五行) or Latin
romanization — never Hangul.`
      : "";
  const system = `You are a literary translator working into ${LANG_NAME[locale]}.
Translate faithfully but idiomatically — the result must read as if written in
${LANG_NAME[locale]}, not translated. Keep every nuance and the dry, specific tone.
Keep Korean terms 사주, 일간, 오행 and element names in the target language's normal
convention. Keep the card's English name somewhere in "title".

Do NOT pad "summary" to match the English length — a natural ${LANG_NAME[locale]} summary
of the same content is much shorter in characters. Aim for the range below.

${hangulRule}

${shapeFor(locale)}`;
  const user = `Translate this tarot card guide into ${LANG_NAME[locale]}.
The card is ${card.name_en} (${card.name_kr}).

${JSON.stringify(source, null, 2)}${note}`;
  return ask(system, user);
}

// ---------- main ----------
const targets = cards.filter((c) => c.suit === suit);
const en = loadGuides("en");
const exemplar = en["the-fool"];
if (!exemplar) throw new Error("data/card-guides/en.json must contain 'the-fool' as the style exemplar.");

for (const locale of langs) {
  const guides = loadGuides(locale);
  let written = 0, skipped = 0, failed = 0;

  for (const card of targets) {
    const slug = slugOf(card);
    if (force && slug !== force) continue;
    if (guides[slug] && slug !== force) { skipped++; continue; }

    try {
      // 검증 실패는 대개 summary 길이 초과처럼 고쳐 말하면 되는 것들이다.
      // 오류 문구를 그대로 되먹여 한 번 더 시도한다.
      let raw, note = "", lastErr;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          raw = locale === "en"
            ? await draftEnglish(card, exemplar, note)
            : await translate(card, en[slug] ?? (() => { throw new Error(`en.json has no '${slug}' to translate from — draft English first`); })(), locale, note);
          validate(raw, slug, locale, card);
          lastErr = null;
          break;
        } catch (err) {
          lastErr = err;
          note = `

Your previous attempt was rejected: ${err.message}
Fix exactly that and return the whole JSON object again.`;
        }
      }
      if (lastErr) throw lastErr;
      guides[slug] = raw;
      saveGuides(locale, guides);   // 카드마다 저장 — 중단돼도 진행분이 남는다
      written++;
      console.log(`  ✓ ${locale}/${slug}`);
    } catch (err) {
      failed++;
      console.error(`  ✗ ${locale}/${slug}: ${err.message}`);
    }
  }

  console.log(`${locale}: ${written} written, ${skipped} skipped, ${failed} failed`);
}
