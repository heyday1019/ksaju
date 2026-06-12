/**
 * Daily-rotating saju tip shown in the result view.
 * Selection key: (KST day-of-year + stem-index * 7) mod facts length.
 * Same user sees a different tip each day; different day masters see
 * different tips on the same day.
 */

const STEM_ORDER = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;

/** 36 facts so the cycle never aligns with 12-zodiac or 10-stem periods. */
const FACTS: string[] = [
  "사주(四柱) literally means 'Four Pillars' — representing the year, month, day, and hour of your birth.",
  "There are 10 Heavenly Stems (天干) and 12 Earthly Branches (地支), creating a 60-year cycle that repeats endlessly.",
  "Your Day Master (일간) is the single most important character in your saju — it represents the core of who you are.",
  "Wood feeds Fire, Fire creates Earth (ash), Earth holds Metal, Metal carries Water, Water nourishes Wood — the endless cycle of creation (상생).",
  "The year you complete a 60-year cycle is called 환갑(還甲) in Korea — a major life celebration, once considered extraordinary longevity.",
  "The 12 zodiac animals correspond to the 12 Earthly Branches, each ruling a 2-hour time slot every day.",
  "인연(因緣) — fated connection — is shaped by the combined energy of two people's saju pillars.",
  "A 'strong' day master dominates; a 'weak' one is more receptive and adaptable. Neither is better — balance is the goal.",
  "BTS's RM has a Water day master (壬水) — fitting for a leader known for depth, quiet strength, and poetic thinking.",
  "The hour of your birth can shift your entire energy profile — saju masters always ask for the exact birth time.",
  "No element is inherently good or bad. Context, balance, and timing determine everything in saju.",
  "In 2025, we entered the year of 乙巳 — Yin Wood Snake — associated with transformation and strategic new beginnings.",
  "Korean saju shares roots with Chinese BaZi but has developed unique Korean interpretations over 1,000+ years.",
  "Cosmic luck (운, 運) flows in 10-year cycles called 대운(大運) — they can lift or challenge your core saju energy.",
  "BLACKPINK's Jennie has a Metal day master — precise, principled, and quietly powerful. Classically 庚金 energy.",
  "Your year pillar shows your social face and ancestral roots; your month pillar reflects your career path and parents.",
  "Strong Wood people are 'the bamboo in the storm' — flexible and resilient, bending but never breaking.",
  "Fire day masters shine brightest in social settings — their warmth and passion naturally draw others in.",
  "Earth day masters are the anchors of any group — stable and trustworthy, though sometimes slow to change.",
  "Metal day masters are the perfectionists — precise, principled, and quietly powerful when they commit to something.",
  "Water day masters are the philosophers — fluid, adaptive, and often deeply intuitive about hidden truths.",
  "Clash (충) between two pillars creates tension, but great tension can also spark extraordinary creativity.",
  "삼합(三合) is when three Earthly Branches combine to form one pure element — one of saju's most powerful patterns.",
  "Traditional Korean fortune readers (역술가) spend years mastering the thousands of pattern combinations in saju texts.",
  "K-pop fan culture and saju share something special: both find meaning in the patterns and energy between people.",
  "A perfectly balanced saju contains all five elements — even a trace of each creates harmony across the pillars.",
  "사주 궁합 compatibility reading has been part of Korean wedding tradition for over 600 years.",
  "팔자(八字) means 'eight characters' — another name for saju, named for the 8 heavenly stem + branch characters.",
  "The 'resource star' in saju shows which elements naturally nourish and support your day master's energy.",
  "일주(日柱) — the day pillar — is your inner self and true nature; 월주(月柱) is how the world perceives you.",
  "NewJeans' Minji (a Fire day master) leads with warmth and charisma — Fire energy that lights up a room.",
  "Each of the 60-year cycle combinations has a unique Korean name. The current 갑자(甲子) year returns in 2084.",
  "Water day masters born at night have exceptionally powerful 壬水 or 癸水 energy — naturally deep and reflective.",
  "The '십신(十神)' system maps 10 relationship archetypes between your day master and every other stem in your chart.",
  "In saju, the season of your birth matters — Wood energy is strongest in spring, Fire in summer, Metal in autumn.",
  "Stray Kids' Bang Chan has an Earth day master — the steady, grounding force that holds the group together.",
];

function getDayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / 86_400_000);
}

/** Returns the daily-rotating tip for a given day master and KST date. */
export function getDailyFact(dayMaster: string, todayKST?: Date): string {
  const today = todayKST ?? getTodayKST();
  const dayOfYear = getDayOfYear(today);
  const stemIndex = STEM_ORDER.indexOf(dayMaster as (typeof STEM_ORDER)[number]);
  const offset = stemIndex >= 0 ? stemIndex * 7 : 0;
  return FACTS[(dayOfYear + offset) % FACTS.length];
}

/** Computes today's date in KST (client-side safe). */
export function getTodayKST(): Date {
  const kstStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" });
  return new Date(kstStr);
}
