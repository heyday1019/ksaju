/**
 * 1900-2050 각 연도의 12 월령 절기(立春, 驚蟄, 淸明, 立夏, 芒種, 小暑,
 * 立秋, 白露, 寒露, 立冬, 大雪, 小寒) UTC 시각을 분 단위로 계산해
 * src/lib/saju-boundaries.json 으로 저장.
 *
 * 알고리즘:
 *   astronomia v4의 `solstice.longitude(year, planet, lon)` 사용 — 이는
 *   VSOP87 이론(태양 황경 27장 Meeus)을 기반으로 1초 정밀도로 절기 시각을
 *   계산한다. (계획서가 제안한 `solar.apparentLongitude` + 이분 탐색은
 *   ~10분 오차가 발생해서 같은 라이브러리 내 더 정확한 VSOP87 함수로 교체.)
 *
 * 시드 연도 규칙:
 *   solstice.longitude는 입력된 황경 사분면에 따라 4개의 다항식 시드를
 *   선택한다(3월 춘분, 6월 하지, 9월 추분, 12월 동지). 황경 270°~360° 구간의
 *   절기(소한 285, 입춘 315, 경칩 345)는 다음 해 1~3월에 발생하므로
 *   `year - 1`을 전달해 전년 12월 시드로부터 수렴시킨다.
 *
 * 입력 longitude 값 (degrees, 0..360):
 *   ipchun=315, gyeongchip=345, cheongmyeong=15, ipha=45,
 *   mangjong=75, soseo=105, ipchu=135, baekro=165,
 *   hanro=195, ipdong=225, daeseol=255, sohan=285
 *
 * Validation: 한국천문연구원(KASI) 만세력 published values 8 케이스와
 *   분 단위 일치 확인 (실제 KASI 데이터 — 원안의 GOLDEN 값에 시각 오차가
 *   있었음).
 *
 * Usage: `npm run gen:saju-boundaries`
 * Output: src/lib/saju-boundaries.json
 *
 * astronomia API notes (v4.2.0, no type declarations shipped):
 *   - `solstice.longitude(year, planet, lonRad)` returns JDE (TD).
 *   - `julian.JDEToDate(jde)` returns a UTC `Date` (subtracts ΔT internally).
 */
// @ts-expect-error -- astronomia ships no type declarations
import { solstice, julian, planetposition } from "astronomia";
// @ts-expect-error -- no type declarations
import vsop87Bearth from "astronomia/data/vsop87Bearth";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const earth = new planetposition.Planet(vsop87Bearth);

const SOLAR_TERMS_12 = [
  { key: "ipchun",       lon: 315 },
  { key: "gyeongchip",   lon: 345 },
  { key: "cheongmyeong", lon:  15 },
  { key: "ipha",         lon:  45 },
  { key: "mangjong",     lon:  75 },
  { key: "soseo",        lon: 105 },
  { key: "ipchu",        lon: 135 },
  { key: "baekro",       lon: 165 },
  { key: "hanro",        lon: 195 },
  { key: "ipdong",       lon: 225 },
  { key: "daeseol",      lon: 255 },
  { key: "sohan",        lon: 285 },
] as const;

function jdeToUtc(jde: number): string {
  const d: Date = julian.JDEToDate(jde);
  return d.toISOString().replace(/\.\d+Z$/, "Z");
}

function findTermJDE(year: number, targetLonDeg: number): number {
  // Quadrant 270..360 → polynomial seed is December of `seedYear`;
  // the resulting term lands in Jan/Feb/Mar of `seedYear + 1`.
  const seedYear = targetLonDeg >= 270 ? year - 1 : year;
  const lonRad = (targetLonDeg * Math.PI) / 180;
  return solstice.longitude(seedYear, earth, lonRad);
}

function generate(): Record<string, { term: string; utc: string }[]> {
  const out: Record<string, { term: string; utc: string }[]> = {};
  for (let y = 1900; y <= 2050; y++) {
    out[String(y)] = SOLAR_TERMS_12.map(t => {
      const jde = findTermJDE(y, t.lon);
      return { term: t.key, utc: jdeToUtc(jde) };
    });
  }
  return out;
}

/**
 * 8 KASI 만세력 ground-truth cases.
 *
 * NOTE: The original plan's GOLDEN block listed `Z`-suffixed timestamps that
 * did NOT correspond to the actual KASI published values (they appeared to
 * mix KST wall-clock + UTC labels inconsistently — see commit message). The
 * values below are the *real* KASI UTC timestamps (= published KST minus 9h)
 * which are what the saju calculator must match against.
 */
const GOLDEN = [
  // 1984 입춘: KASI = 1984-02-05 00:19 KST
  { year: 1984, term: "ipchun",     expected: "1984-02-04T15:19:00Z" },
  // 1999 경칩: KASI = 1999-03-06 09:58 KST
  { year: 1999, term: "gyeongchip", expected: "1999-03-06T00:58:00Z" },
  // 2000 입춘: KASI = 2000-02-04 21:40 KST
  { year: 2000, term: "ipchun",     expected: "2000-02-04T12:40:00Z" },
  // 2020 입춘: KASI = 2020-02-04 18:03 KST
  { year: 2020, term: "ipchun",     expected: "2020-02-04T09:03:00Z" },
  // 2024 입춘: KASI = 2024-02-04 17:27 KST
  { year: 2024, term: "ipchun",     expected: "2024-02-04T08:27:00Z" },
  // 1950 입추: KASI = 1950-08-08 11:55 KST
  { year: 1950, term: "ipchu",      expected: "1950-08-08T02:55:00Z" },
  // 1900 소한: KASI = 1900-01-06 03:04 KST (= UTC 1900-01-05 18:04)
  { year: 1900, term: "sohan",      expected: "1900-01-05T18:04:00Z" },
  // 2050 대설: KASI projection ≈ 2050-12-07 07:41 KST
  { year: 2050, term: "daeseol",    expected: "2050-12-06T22:41:00Z" },
];

function diffMinutes(a: string, b: string): number {
  const da = new Date(a).getTime();
  const db = new Date(b).getTime();
  return Math.abs(da - db) / 60000;
}

function validate(data: ReturnType<typeof generate>): boolean {
  console.log("\n=== Validation against KASI golden cases ===");
  let allOk = true;
  for (const g of GOLDEN) {
    const yearData = data[String(g.year)];
    const match = yearData.find(d => d.term === g.term);
    if (!match) {
      console.error(`✗ ${g.year} ${g.term}: not found`);
      allOk = false;
      continue;
    }
    const diff = diffMinutes(match.utc, g.expected);
    const ok = diff <= 2;
    if (!ok) allOk = false;
    console.log(`${ok ? "✓" : "✗"} ${g.year} ${g.term}: computed=${match.utc} expected=${g.expected} diff=${diff.toFixed(1)}min`);
  }
  return allOk;
}

function main(): void {
  console.log("Generating saju boundaries 1900-2050...");
  const data = generate();
  const totalEntries = Object.values(data).flat().length;
  console.log(`Generated ${totalEntries} entries (151 years × 12 terms).`);

  const allOk = validate(data);

  const outPath = resolve("src/lib/saju-boundaries.json");
  writeFileSync(outPath, JSON.stringify(data, null, 0));
  console.log(`Wrote ${outPath}`);

  if (!allOk) {
    console.error("\nValidation failed — some KASI golden cases exceed 2-minute tolerance.");
    process.exit(1);
  }
}

main();
