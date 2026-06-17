// Regenerates data/ksaju-tarot.json from docs/tarot-cards.csv.
// element is derived from suit; major arcana → null. Idempotent.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const csvPath = join(root, "docs", "tarot-cards.csv");
const outPath = join(root, "data", "ksaju-tarot.json");

const SUIT_ELEMENT = { wands: "fire", cups: "water", swords: "metal", pentacles: "earth", major: null };

// Minimal RFC4180 CSV parser (handles quoted fields with commas/quotes/newlines).
function parseCsv(text) {
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\r") { /* skip */ }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.length > 1 || (r.length === 1 && r[0] !== ""));
}

const rows = parseCsv(readFileSync(csvPath, "utf8"));
const header = rows[0];
const idx = (name) => header.indexOf(name);
const col = { id: idx("id"), suit: idx("suit"), rank: idx("rank"), name_en: idx("name_en"),
  name_kr: idx("name_kr"), filename: idx("filename"), theme: idx("theme"), keywords: idx("keywords") };
for (const [k, v] of Object.entries(col)) if (v === -1) throw new Error(`CSV missing column: ${k}`);

const cards = rows.slice(1).map((r) => {
  const suit = r[col.suit];
  if (!(suit in SUIT_ELEMENT)) throw new Error(`Unknown suit: ${suit}`);
  const theme = r[col.theme]?.trim();
  const keywords = r[col.keywords]?.trim();
  if (!theme || !keywords) throw new Error(`Row id ${r[col.id]} missing theme/keywords`);
  return {
    id: Number(r[col.id]), suit, rank: r[col.rank],
    name_en: r[col.name_en], name_kr: r[col.name_kr],
    filename: r[col.filename], element: SUIT_ELEMENT[suit], theme, keywords,
  };
}).sort((a, b) => a.id - b.id);

if (cards.length !== 78) throw new Error(`Expected 78 cards, got ${cards.length}`);
writeFileSync(outPath, JSON.stringify(cards, null, 2) + "\n");
console.log(`Wrote ${cards.length} cards → ${outPath}`);
