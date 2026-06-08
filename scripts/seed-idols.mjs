// Regenerates data/ksaju-idol-db.json from scripts/idol-seed.json.
// Saju is computed with manseryeok's calculateSaju — the same engine saju.ts uses.
// Self-checks every EXISTING entry against its birthday before writing (catches drift),
// and is idempotent: members whose id already exists are skipped.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { calculateSaju } from "@fullstackfamily/manseryeok";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dbPath = join(root, "data", "ksaju-idol-db.json");
const seedPath = join(root, "scripts", "idol-seed.json");

const slug = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const entryFor = ({ name, group, birthdate }) => {
  const [y, m, d] = birthdate.split("-").map(Number);
  const s = calculateSaju(y, m, d);
  return {
    id: `${slug(name)}-${slug(group)}`,
    name,
    group,
    birthdate,
    saju: {
      year: { kr: s.yearPillar, hanja: s.yearPillarHanja },
      month: { kr: s.monthPillar, hanja: s.monthPillarHanja },
      day: { kr: s.dayPillar, hanja: s.dayPillarHanja },
      dayMaster: s.dayPillarHanja[0],
    },
  };
};

const db = JSON.parse(readFileSync(dbPath, "utf8"));

// Self-check: every existing entry must regenerate from its birthdate.
for (const i of db) {
  const fresh = entryFor(i);
  if (i.id !== fresh.id) {
    throw new Error(`Existing entry id ${i.id} would now slug to ${fresh.id}.`);
  }
  const a = JSON.stringify(i.saju);
  const b = JSON.stringify(fresh.saju);
  if (a !== b) {
    throw new Error(`Existing entry ${i.id} no longer matches calculateSaju(${i.birthdate}). Stored ${a} vs ${b}.`);
  }
}

const existingIds = new Set(db.map((i) => i.id));
const seed = JSON.parse(readFileSync(seedPath, "utf8"));

let added = 0;
const collisions = [];
for (const row of seed) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(row.birthdate) || !row.name || !row.group) {
    throw new Error(`Malformed seed row: ${JSON.stringify(row)}`);
  }
  const entry = entryFor(row);
  if (existingIds.has(entry.id)) {
    collisions.push(entry.id);
    continue;
  }
  existingIds.add(entry.id);
  db.push(entry);
  added++;
}

writeFileSync(dbPath, JSON.stringify(db, null, 2) + "\n");
console.log(`Self-check OK. Added ${added} new idol(s). Total now ${db.length}.`);
if (collisions.length) console.log(`Skipped existing ids: ${collisions.join(", ")}`);
