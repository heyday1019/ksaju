// Ko-fi 디지털 상품 생성기 (재실행 가능·idempotent).
//
// 산출물은 products/ (gitignore) — 레포에 커밋하지 않고 Ko-fi Shop 에 업로드한다.
// 원본 public/tarot/*.png 는 읽기만 한다. (확장자는 .png 지만 실제 포맷은 JPEG —
//  앱은 정상 동작하므로 원본은 건드리지 않고, 상품 쪽에서만 올바른 포맷으로 낸다.)
//
//   npm run gen:products
//
// 3종:
//   1) Joseon Tarot — Phone Wallpapers   메이저 22장, 1290x2796 PNG + ZIP
//   2) Hanji Minimal — Phone Wallpapers  브랜드 모티프 8종, 1290x2796 PNG + ZIP
//   3) Joseon Tarot — Printable Deck     78장 + 뒷면, A4 300dpi 10페이지 PDF
//
// 카드를 늘리지 않는다: 원본 848x1264 를 한지 바탕에 액자처럼 얹어 화질 열화를 0 으로 둔다.
import sharp from "sharp";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const TAROT_DIR = join(root, "public", "tarot");
const HANJI_BG = join(root, "public", "hanji-bg.png");
const STAMP = join(root, "scripts", "assets", "stamp-saju.png");
const OUT = join(root, "products");

// 브랜드 토큰 (src/app/globals.css 미러)
const HANJI = "#FBF6E8";
const HANJI_WARM = "#F5EFE0";
const MUK = "#1A1A2E";
const JINDALLAE = "#C8385A";
const DANCHEONG = "#C49A3F";
const MOK = "#5E8B5E";
const CARD_NAVY = "#0F1B5E"; // 타로 카드 자체 배경(docs/tarot-imagen-consistency-guide.md)

// 배경화면 캔버스 — iPhone Pro Max 기준. 이보다 작은 안드로이드 기기는 축소만 하면 된다.
const W = 1290;
const H = 2796;

// 인쇄 규격 — A4 300dpi, 표준 카드 63x88mm.
const DPI = 300;
const A4_W = Math.round((210 / 25.4) * DPI); // 2480
const A4_H = Math.round((297 / 25.4) * DPI); // 3508
const CARD_W = Math.round((63 / 25.4) * DPI); // 744
const CARD_H = Math.round((88 / 25.4) * DPI); // 1039
const COLS = 3;
const ROWS = 3;

const serif = "Georgia, 'Times New Roman', serif";
const koSerif = "'Batang', 'Malgun Gothic', serif";

// ── 공용 헬퍼 ────────────────────────────────────────────────────────────────

/** 한지 바탕: 단색 위에 hanji-bg 텍스처를 아주 옅게 얹는다. */
async function hanjiBase(w, h, { bg = HANJI, texture = 0.35 } = {}) {
  const base = sharp({
    create: { width: w, height: h, channels: 4, background: bg },
  });
  if (texture <= 0) return base.png().toBuffer();

  const tex = await sharp(HANJI_BG)
    .resize(w, h, { fit: "cover" })
    .ensureAlpha()
    .composite([
      {
        // 알파를 texture 비율로 낮춘다.
        input: Buffer.from([255, 255, 255, Math.round(255 * texture)]),
        raw: { width: 1, height: 1, channels: 4 },
        tile: true,
        blend: "dest-in",
      },
    ])
    .png()
    .toBuffer();

  return base.composite([{ input: tex, blend: "over" }]).png().toBuffer();
}

/** 창살(井자) 격자 SVG. cell 간격·색·굵기·투명도 조절. */
function changsalSvg(w, h, { cell = 74, color = DANCHEONG, opacity = 0.5, stroke = 1.4 } = {}) {
  const lines = [];
  for (let x = cell; x < w; x += cell) {
    lines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${h}"/>`);
  }
  for (let y = cell; y < h; y += cell) {
    lines.push(`<line x1="0" y1="${y}" x2="${w}" y2="${y}"/>`);
  }
  return Buffer.from(
    `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">` +
      `<g stroke="${color}" stroke-width="${stroke}" opacity="${opacity}">${lines.join("")}</g>` +
      `</svg>`,
  );
}

/** 창살 밴드 한 줄 (사이트 .changsal-band 미러). */
function changsalBandSvg(w, h, { color = DANCHEONG, opacity = 0.55 } = {}) {
  const unit = 40;
  const lines = [];
  const y1 = Math.round(h * 0.34);
  const y2 = Math.round(h * 0.67);
  lines.push(`<line x1="0" y1="${y1}" x2="${w}" y2="${y1}"/>`);
  lines.push(`<line x1="0" y1="${y2}" x2="${w}" y2="${y2}"/>`);
  for (let x = 0; x < w; x += unit) {
    lines.push(`<line x1="${x + 13}" y1="0" x2="${x + 13}" y2="${h}"/>`);
    lines.push(`<line x1="${x + 27}" y1="0" x2="${x + 27}" y2="${h}"/>`);
  }
  return Buffer.from(
    `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">` +
      `<g stroke="${color}" stroke-width="1.6" opacity="${opacity}">${lines.join("")}</g>` +
      `</svg>`,
  );
}

/** 낙관 도장 — 우하단 메이커 워터마크를 센터-크롭으로 떨궈낸다(gen-qr.mjs 와 동일 로직). */
async function stampBuffer(size, { tint = null } = {}) {
  const meta = await sharp(STAMP).metadata();
  const side = Math.min(meta.width, meta.height);
  const crop = Math.round(side * 0.84);
  let img = sharp(STAMP).extract({
    left: Math.round((meta.width - crop) / 2),
    top: Math.round((meta.height - crop) / 2),
    width: crop,
    height: crop,
  });
  // 도장은 흰 바탕 + 인주색 선. 흰 바탕을 투명으로 바꿔 배경 위에 얹는다.
  const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const px = Buffer.from(data);
  const t = tint ? hexToRgb(tint) : null;
  for (let i = 0; i < px.length; i += info.channels) {
    const lum = (px[i] + px[i + 1] + px[i + 2]) / 3;
    // 밝을수록 투명 — 흰 종이는 사라지고 붉은 획만 남는다.
    px[i + 3] = Math.max(0, Math.min(255, Math.round(255 - lum)));
    if (t) {
      px[i] = t.r;
      px[i + 1] = t.g;
      px[i + 2] = t.b;
    }
  }
  // 투명 여백을 잘라내야(trim) 도장 잉크가 실제로 중앙에 온다.
  // 원본 스캔의 여백이 비대칭이라, 트림 없이 중앙 배치하면 눈에 띄게 왼쪽으로 치우친다.
  return sharp(px, { raw: { width: info.width, height: info.height, channels: info.channels } })
    .trim({ threshold: 10 })
    .resize(size, size, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function readCards() {
  const cards = JSON.parse(readFileSync(join(root, "data", "ksaju-tarot.json"), "utf8"));
  if (!Array.isArray(cards) || cards.length !== 78) {
    throw new Error(`ksaju-tarot.json: 78장을 기대했으나 ${cards?.length} 장`);
  }
  return cards;
}

function fresh(dir) {
  // Windows 에서는 직전 실행이 남긴 큰 산출물(30MB PDF)을 백신이 스캔하는 동안
  // rmSync 가 EBUSY 로 튕긴다. 잠깐 기다렸다 다시 시도한다.
  for (let attempt = 0; existsSync(dir); attempt++) {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch (e) {
      if (attempt >= 5) throw e;
      execFileSync("powershell.exe", ["-NoProfile", "-Command", "Start-Sleep -Milliseconds 600"], {
        stdio: "ignore",
      });
    }
  }
  mkdirSync(dir, { recursive: true });
  return dir;
}

// ── 상품 1: Joseon Tarot — Phone Wallpapers ──────────────────────────────────

async function buildTarotWallpapers(cards) {
  const dir = fresh(join(OUT, "joseon-tarot-wallpapers"));
  const majors = cards.filter((c) => c.suit === "major");
  if (majors.length !== 22) throw new Error(`메이저 22장을 기대했으나 ${majors.length} 장`);

  // 카드 아트에 이미 제목 카투슈("The Star (별)")가 들어 있다 → 이름을 덧붙이지 않는다.
  // 그만큼 카드를 키워 액자 여백만 남긴다.
  const cardW = 1080;
  const cardH = Math.round((cardW * 1264) / 848); // 1610 — 원본 비율 유지
  const cardX = Math.round((W - cardW) / 2);
  const cardY = 830; // 상단 830px 은 잠금화면 시계 영역으로 비워둔다
  const frame = 5;

  const base = await hanjiBase(W, H);
  const stamp = await stampBuffer(104, { tint: JINDALLAE });

  for (const card of majors) {
    const art = await sharp(join(TAROT_DIR, card.filename))
      .resize(cardW, cardH, { fit: "fill" })
      .png()
      .toBuffer();

    const border = Buffer.from(
      `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">` +
        `<rect x="${cardX - frame}" y="${cardY - frame}" width="${cardW + frame * 2}" ` +
        `height="${cardH + frame * 2}" fill="none" stroke="${DANCHEONG}" stroke-width="${frame}"/>` +
        `</svg>`,
    );

    // 원본이 이미 JPEG 이므로 PNG 무손실 저장은 JPEG 아티팩트까지 그대로 담는 낭비다.
    // q94 로 내면 육안 차이 없이 파일이 1/5 로 줄어 모바일 다운로드가 현실적이 된다.
    await sharp(base)
      .composite([
        { input: art, left: cardX, top: cardY },
        { input: border, left: 0, top: 0 },
        { input: changsalBandSvg(W, 26, { opacity: 0.45 }), left: 0, top: H - 150 },
        { input: stamp, left: Math.round((W - 104) / 2), top: H - 122 },
      ])
      .jpeg({ quality: 94, chromaSubsampling: "4:4:4" })
      .toFile(join(dir, `${card.filename.replace(/\.png$/, "")}-wallpaper.jpg`));
  }

  return { dir, count: majors.length };
}

// ── 상품 2: Hanji Minimal — Phone Wallpapers ─────────────────────────────────

async function buildHanjiWallpapers() {
  const dir = fresh(join(OUT, "hanji-minimal-wallpapers"));
  const cy = Math.round(H * 0.62); // 잠금화면 시계를 피해 모티프는 아래쪽에

  const designs = [
    {
      name: "01-nakgwan",
      bg: HANJI,
      stamp: { size: 660, y: cy - 330, tint: JINDALLAE },
      svg: () => "",
    },
    {
      name: "02-changsal",
      bg: HANJI,
      grid: { cell: 86, opacity: 0.45, stroke: 1.8 },
      stamp: { size: 300, y: cy - 150, tint: JINDALLAE },
      svg: () => "",
    },
    {
      name: "03-hieut",
      bg: HANJI_WARM,
      svg: () =>
        `<text x="${W / 2}" y="${cy + 260}" font-family="${koSerif}" font-size="1150" fill="${DANCHEONG}" ` +
        `text-anchor="middle" opacity="0.62">ㅎ</text>`,
    },
    {
      name: "04-ohaeng",
      bg: HANJI,
      svg: () => {
        // 金(#A8A8B0)·水(#88B0BC) 는 앱 UI 토큰 그대로면 한지 배경 대비가 2:1 대에 그쳐
        // 배경화면에서 거의 사라진다. 색상(hue)은 유지하고 명도만 낮춘 인쇄용 변형을 쓴다.
        const els = [
          ["木", MOK],
          ["火", JINDALLAE],
          ["土", "#A8822F"],
          ["金", "#75757F"],
          ["水", "#5B8794"],
        ];
        const gap = 330;
        const y0 = cy - gap * 2;
        return els
          .map(([ch, color], i) => {
            const y = y0 + gap * i;
            return (
              `<circle cx="${W / 2}" cy="${y}" r="132" fill="none" stroke="${color}" ` +
              `stroke-width="6" opacity="0.9"/>` +
              `<text x="${W / 2}" y="${y + 46}" font-family="${koSerif}" font-size="124" fill="${color}" ` +
              `text-anchor="middle">${ch}</text>`
            );
          })
          .join("");
      },
    },
    {
      name: "05-jeong",
      bg: HANJI,
      svg: () => {
        const s = 880;
        const x0 = (W - s) / 2;
        const y0 = cy - s / 2;
        const t = s / 3;
        const ls = [];
        for (let i = 1; i < 3; i++) {
          ls.push(`<line x1="${x0 + t * i}" y1="${y0}" x2="${x0 + t * i}" y2="${y0 + s}"/>`);
          ls.push(`<line x1="${x0}" y1="${y0 + t * i}" x2="${x0 + s}" y2="${y0 + t * i}"/>`);
        }
        return `<g stroke="${DANCHEONG}" stroke-width="17" stroke-linecap="round" opacity="0.85">${ls.join("")}</g>`;
      },
    },
    {
      name: "06-saju",
      bg: HANJI,
      svg: () => {
        return ["四", "柱"]
          .map(
            (ch, i) =>
              `<text x="${W / 2}" y="${cy - 210 + i * 380}" font-family="${koSerif}" font-size="340" ` +
              `fill="${MUK}" text-anchor="middle" opacity="0.85">${ch}</text>`,
          )
          .join("");
      },
      stamp: { size: 220, y: cy + 340, tint: JINDALLAE },
    },
    {
      name: "07-bands",
      bg: HANJI,
      bands: true,
      stamp: { size: 340, y: cy - 170, tint: JINDALLAE },
      svg: () => "",
    },
    {
      name: "08-cosmic",
      bg: CARD_NAVY,
      texture: 0,
      grid: { cell: 100, opacity: 0.3, color: DANCHEONG },
      stamp: { size: 620, y: cy - 310, tint: DANCHEONG },
      svg: () => "",
    },
  ];

  for (const d of designs) {
    const base = await hanjiBase(W, H, {
      bg: d.bg,
      texture: d.texture !== undefined ? d.texture : 0.3,
    });
    const layers = [];

    if (d.grid) {
      layers.push({ input: changsalSvg(W, H, d.grid), left: 0, top: 0 });
    }
    if (d.bands) {
      layers.push({ input: changsalBandSvg(W, 44, { opacity: 0.85 }), left: 0, top: 420 });
      layers.push({ input: changsalBandSvg(W, 44, { opacity: 0.85 }), left: 0, top: H - 420 });
    }

    const body = d.svg();
    if (body) {
      layers.push({
        input: Buffer.from(
          `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`,
        ),
        left: 0,
        top: 0,
      });
    }
    if (d.stamp) {
      const s = await stampBuffer(d.stamp.size, { tint: d.stamp.tint });
      layers.push({
        input: s,
        left: Math.round((W - d.stamp.size) / 2),
        top: Math.round(d.stamp.y),
      });
    }

    await sharp(base)
      .composite(layers)
      .png({ compressionLevel: 9 })
      .toFile(join(dir, `hanji-${d.name}.png`));
  }

  return { dir, count: designs.length };
}

// ── 상품 3: Joseon Tarot — Printable Deck (A4 PDF) ───────────────────────────

/** 카드 뒷면 — 카드 자체 팔레트(navy)에 금색 창살 + 낙관. */
async function cardBack() {
  const base = await sharp({
    create: { width: CARD_W, height: CARD_H, channels: 4, background: CARD_NAVY },
  })
    .png()
    .toBuffer();
  const grid = changsalSvg(CARD_W, CARD_H, {
    cell: 62,
    color: DANCHEONG,
    opacity: 0.3,
    stroke: 1.6,
  });
  const border = Buffer.from(
    `<svg width="${CARD_W}" height="${CARD_H}" xmlns="http://www.w3.org/2000/svg">` +
      `<rect x="26" y="26" width="${CARD_W - 52}" height="${CARD_H - 52}" fill="none" ` +
      `stroke="${DANCHEONG}" stroke-width="4" opacity="0.85"/>` +
      `</svg>`,
  );
  const stamp = await stampBuffer(300, { tint: DANCHEONG });
  return sharp(base)
    .composite([
      { input: grid, left: 0, top: 0 },
      { input: border, left: 0, top: 0 },
      { input: stamp, left: Math.round((CARD_W - 300) / 2), top: Math.round((CARD_H - 300) / 2) },
    ])
    .png()
    .toBuffer();
}

/** 카드 이미지들을 A4 시트(3x3)에 배치하고 재단선을 그린 JPEG 버퍼를 만든다. */
async function buildSheet(cardBuffers) {
  const gridW = CARD_W * COLS;
  const gridH = CARD_H * ROWS;
  const x0 = Math.round((A4_W - gridW) / 2);
  const y0 = Math.round((A4_H - gridH) / 2);

  const layers = [];
  for (let i = 0; i < cardBuffers.length; i++) {
    const c = i % COLS;
    const r = Math.floor(i / COLS);
    layers.push({
      input: cardBuffers[i],
      left: x0 + c * CARD_W,
      top: y0 + r * CARD_H,
    });
  }

  // 재단선: 격자 경계마다 여백 쪽으로 뻗는 짧은 선.
  const m = 60;
  const marks = [];
  for (let c = 0; c <= COLS; c++) {
    const x = x0 + c * CARD_W;
    marks.push(`<line x1="${x}" y1="${y0 - m}" x2="${x}" y2="${y0 - 12}"/>`);
    marks.push(`<line x1="${x}" y1="${y0 + gridH + 12}" x2="${x}" y2="${y0 + gridH + m}"/>`);
  }
  for (let r = 0; r <= ROWS; r++) {
    const y = y0 + r * CARD_H;
    marks.push(`<line x1="${x0 - m}" y1="${y}" x2="${x0 - 12}" y2="${y}"/>`);
    marks.push(`<line x1="${x0 + gridW + 12}" y1="${y}" x2="${x0 + gridW + m}" y2="${y}"/>`);
  }
  layers.push({
    input: Buffer.from(
      `<svg width="${A4_W}" height="${A4_H}" xmlns="http://www.w3.org/2000/svg">` +
        `<g stroke="#666666" stroke-width="2">${marks.join("")}</g></svg>`,
    ),
    left: 0,
    top: 0,
  });

  return sharp({
    create: { width: A4_W, height: A4_H, channels: 3, background: "#FFFFFF" },
  })
    .composite(layers)
    .jpeg({ quality: 92, chromaSubsampling: "4:4:4" })
    .toBuffer();
}

/**
 * 최소 PDF 라이터. sharp 가 낸 JPEG 를 재인코딩 없이 /DCTDecode XObject 로 그대로 심는다.
 * → 새 npm 패키지 없이 인쇄용 PDF 를 만든다.
 */
function buildPdf(jpegSheets) {
  const PT_W = (210 / 25.4) * 72; // 595.28
  const PT_H = (297 / 25.4) * 72; // 841.89
  const enc = (s) => Buffer.from(s, "latin1");

  const chunks = [];
  let pos = 0;
  const offsets = []; // 1-based 오브젝트 번호 → 바이트 오프셋
  const put = (buf) => {
    chunks.push(buf);
    pos += buf.length;
  };
  const obj = (num, body, stream = null) => {
    offsets[num] = pos;
    put(enc(`${num} 0 obj\n${body}\n`));
    if (stream) {
      put(enc("stream\n"));
      put(stream);
      put(enc("\nendstream\n"));
    }
    put(enc("endobj\n"));
  };

  put(enc("%PDF-1.4\n%\xe2\xe3\xcf\xd3\n"));

  const n = jpegSheets.length;
  // 1 = Catalog, 2 = Pages, 페이지 i(0-based): 3+i*3 Page / 4+i*3 Contents / 5+i*3 Image
  const pageNum = (i) => 3 + i * 3;
  const kids = Array.from({ length: n }, (_, i) => `${pageNum(i)} 0 R`).join(" ");

  obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
  obj(2, `<< /Type /Pages /Count ${n} /Kids [ ${kids} ] >>`);

  for (let i = 0; i < n; i++) {
    const p = pageNum(i);
    const contentNum = p + 1;
    const imgNum = p + 2;
    const content = enc(
      `q\n${PT_W.toFixed(2)} 0 0 ${PT_H.toFixed(2)} 0 0 cm\n/Im0 Do\nQ`,
    );

    obj(
      p,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PT_W.toFixed(2)} ${PT_H.toFixed(2)}] ` +
        `/Resources << /XObject << /Im0 ${imgNum} 0 R >> >> /Contents ${contentNum} 0 R >>`,
    );
    obj(contentNum, `<< /Length ${content.length} >>`, content);
    obj(
      imgNum,
      `<< /Type /XObject /Subtype /Image /Width ${A4_W} /Height ${A4_H} ` +
        `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode ` +
        `/Length ${jpegSheets[i].length} >>`,
      jpegSheets[i],
    );
  }

  const maxObj = 2 + n * 3;
  const xrefPos = pos;
  let xref = `xref\n0 ${maxObj + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= maxObj; i++) {
    xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  put(enc(xref));
  put(enc(`trailer\n<< /Size ${maxObj + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`));

  return Buffer.concat(chunks);
}

async function buildPrintableDeck(cards) {
  const dir = fresh(join(OUT, "joseon-tarot-printable-deck"));

  // 78장을 인쇄 규격으로 리샘플 (848x1264 → 744x1039, 축소이므로 열화 없음)
  const faces = [];
  for (const card of cards) {
    faces.push(
      await sharp(join(TAROT_DIR, card.filename))
        .resize(CARD_W, CARD_H, { fit: "fill" })
        .png()
        .toBuffer(),
    );
  }

  const sheets = [];
  const perSheet = COLS * ROWS;
  for (let i = 0; i < faces.length; i += perSheet) {
    sheets.push(await buildSheet(faces.slice(i, i + perSheet)));
  }

  // 마지막: 뒷면 시트 한 장
  const back = await cardBack();
  sheets.push(await buildSheet(Array.from({ length: perSheet }, () => back)));

  const pdf = buildPdf(sheets);
  const file = join(dir, "joseon-tarot-printable-deck-a4.pdf");
  writeFileSync(file, pdf);

  return { dir, file, sheets: sheets.length, bytes: pdf.length };
}

// ── 스토어프론트 이미지 (Ko-fi 커버 + Shop 상품 썸네일) ──────────────────────

/** 카드를 부채꼴로 겹쳐 놓은 이미지. 각 카드는 회전 후 투명 배경으로 합성된다. */
async function cardFan(cardFiles, { cardW, angles, spread, canvasW, canvasH, topPad = 0 }) {
  const cardH = Math.round((cardW * 1264) / 848);
  const layers = [];
  for (let i = 0; i < cardFiles.length; i++) {
    const rot = await sharp(join(TAROT_DIR, cardFiles[i]))
      .resize(cardW, cardH, { fit: "fill" })
      .rotate(angles[i], { background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    const m = await sharp(rot).metadata();
    layers.push({
      input: rot,
      left: Math.round(canvasW / 2 - m.width / 2 + spread[i]),
      top: Math.round(topPad + (canvasH - topPad) / 2 - m.height / 2),
    });
  }
  return layers;
}

async function buildStorefront(cards) {
  const dir = fresh(join(OUT, "storefront"));
  const majors = cards.filter((c) => c.suit === "major");
  const pick = (n) => majors.find((c) => c.name_en === n).filename;
  const trio = [pick("The Star"), pick("The Sun"), pick("The Moon")];

  const label = (text, sub, w, y, { size = 62, subSize = 34 } = {}) =>
    `<text x="${w / 2}" y="${y}" font-family="${serif}" font-size="${size}" fill="${MUK}" ` +
    `text-anchor="middle" letter-spacing="1">${escapeXml(text)}</text>` +
    (sub
      ? `<text x="${w / 2}" y="${y + size * 0.92}" font-family="${serif}" font-size="${subSize}" ` +
        `fill="${JINDALLAE}" text-anchor="middle" letter-spacing="4">${escapeXml(sub)}</text>`
      : "");

  // 1) Ko-fi 페이지 커버 배너.
  //    카피를 카드 위에 얹으면 짙은 카드 아트에 묻혀 읽히지 않는다 → 좌(카피)/우(카드) 분할.
  const CW = 1920;
  const CH = 640;
  {
    const base = await hanjiBase(CW, CH);
    const textCx = 620;
    const fan = await cardFan(trio, {
      cardW: 250,
      angles: [-13, 0, 13],
      spread: [-215, 0, 215],
      canvasW: 2840, // 우측(x≈1420)에 부채꼴이 오도록 가상 중심을 민다
      canvasH: CH,
    });
    const stamp = await stampBuffer(84, { tint: JINDALLAE });
    await sharp(base)
      .composite([
        ...fan,
        {
          input: Buffer.from(
            `<svg width="${CW}" height="${CH}" xmlns="http://www.w3.org/2000/svg">` +
              `<text x="${textCx}" y="${CH / 2 - 6}" font-family="${serif}" font-size="82" ` +
              `fill="${MUK}" text-anchor="middle" letter-spacing="1">Saju, but make it K.</text>` +
              `<text x="${textCx}" y="${CH / 2 + 56}" font-family="${serif}" font-size="30" ` +
              `fill="${JINDALLAE}" text-anchor="middle" letter-spacing="6">KOREAN ASTROLOGY · TAROT · FOR FUN</text>` +
              `</svg>`,
          ),
          left: 0,
          top: 0,
        },
        { input: changsalBandSvg(CW, 24, { opacity: 0.5 }), left: 0, top: CH - 60 },
        { input: stamp, left: Math.round(textCx - 42), top: CH - 220 },
      ])
      .png({ compressionLevel: 9 })
      .toFile(join(dir, "kofi-cover.png"));
  }

  // 2) Shop 상품 썸네일 (정사각 1200)
  const T = 1200;

  // 2-a) 타로 배경화면 — 카드 3장 부채꼴
  {
    const base = await hanjiBase(T, T);
    // spread 가 카드 폭보다 한참 작으면 앞 카드가 뒤 카드를 거의 다 덮는다 → 넓게 벌린다.
    const fan = await cardFan(trio, {
      cardW: 380,
      angles: [-14, 0, 14],
      spread: [-290, 0, 290],
      canvasW: T,
      canvasH: T,
      topPad: 150,
    });
    await sharp(base)
      .composite([
        ...fan,
        {
          input: Buffer.from(
            `<svg width="${T}" height="${T}" xmlns="http://www.w3.org/2000/svg">` +
              label("Joseon Tarot", "22 PHONE WALLPAPERS", T, 130) +
              `</svg>`,
          ),
          left: 0,
          top: 0,
        },
        { input: changsalBandSvg(T, 22, { opacity: 0.45 }), left: 0, top: T - 70 },
      ])
      .png({ compressionLevel: 9 })
      .toFile(join(dir, "thumb-joseon-tarot-wallpapers.png"));
  }

  // 2-b) 한지 미니멀 — 실제 산출물 3종을 폰 비율 타일로 보여준다
  {
    const base = await hanjiBase(T, T, { bg: HANJI_WARM });
    const src = join(OUT, "hanji-minimal-wallpapers");
    const picks = ["hanji-01-nakgwan.png", "hanji-04-ohaeng.png", "hanji-08-cosmic.png"];
    const tw = 300;
    const th = Math.round((tw * H) / W); // 650
    const gap = 40;
    const x0 = Math.round((T - (tw * 3 + gap * 2)) / 2);
    const y0 = Math.round((T - th) / 2) + 50;
    const layers = [];
    for (let i = 0; i < picks.length; i++) {
      // 옅은 한지 배경 위 옅은 타일은 경계가 사라진다 → 얇은 테두리로 '화면'임을 보여준다.
      const tile = await sharp(join(src, picks[i]))
        .resize(tw, th, { fit: "fill" })
        .composite([
          {
            input: Buffer.from(
              `<svg width="${tw}" height="${th}" xmlns="http://www.w3.org/2000/svg">` +
                `<rect x="1" y="1" width="${tw - 2}" height="${th - 2}" fill="none" ` +
                `stroke="${DANCHEONG}" stroke-width="3" opacity="0.7"/></svg>`,
            ),
            left: 0,
            top: 0,
          },
        ])
        .png()
        .toBuffer();
      layers.push({ input: tile, left: x0 + i * (tw + gap), top: y0 });
    }
    await sharp(base)
      .composite([
        ...layers,
        {
          input: Buffer.from(
            `<svg width="${T}" height="${T}" xmlns="http://www.w3.org/2000/svg">` +
              label("Hanji Minimal", "8 PHONE WALLPAPERS", T, 130) +
              `</svg>`,
          ),
          left: 0,
          top: 0,
        },
        { input: changsalBandSvg(T, 22, { opacity: 0.45 }), left: 0, top: T - 70 },
      ])
      .png({ compressionLevel: 9 })
      .toFile(join(dir, "thumb-hanji-minimal-wallpapers.png"));
  }

  // 2-c) 인쇄용 덱 — 첫 시트 미리보기
  {
    const base = await hanjiBase(T, T);
    const sheetCards = [];
    for (const c of majors.slice(0, 9)) sheetCards.push(c.filename);
    // cw 220 이면 3행 높이가 984 라 gy(250) 와 합쳐 1234 > 1200 으로 아래가 잘린다.
    const cw = 205;
    const ch = Math.round((cw * 1264) / 848); // 306 → 3행 918
    const gx = Math.round((T - cw * 3) / 2);
    const gy = 245; // 245 + 918 = 1163 < 1200
    const layers = [];
    for (let i = 0; i < 9; i++) {
      const img = await sharp(join(TAROT_DIR, sheetCards[i]))
        .resize(cw, ch, { fit: "fill" })
        .png()
        .toBuffer();
      layers.push({ input: img, left: gx + (i % 3) * cw, top: gy + Math.floor(i / 3) * ch });
    }
    await sharp(base)
      .composite([
        ...layers,
        {
          input: Buffer.from(
            `<svg width="${T}" height="${T}" xmlns="http://www.w3.org/2000/svg">` +
              label("Printable Tarot Deck", "78 CARDS · A4 · PRINT AT HOME", T, 130) +
              `<rect x="${gx}" y="${gy}" width="${cw * 3}" height="${ch * 3}" fill="none" ` +
              `stroke="${DANCHEONG}" stroke-width="4"/>` +
              `</svg>`,
          ),
          left: 0,
          top: 0,
        },
      ])
      .png({ compressionLevel: 9 })
      .toFile(join(dir, "thumb-printable-deck.png"));
  }

  return { dir, count: 4 };
}

// ── SNS(X) 게시용 이미지 ─────────────────────────────────────────────────────

/** 배경화면을 폰 목업 안에 넣는다 — 둥근 모서리 마스크 + 짙은 베젤. */
async function phoneMock(file, w) {
  const h = Math.round((w * H) / W);
  const r = Math.round(w * 0.11);
  const mask = Buffer.from(
    `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">` +
      `<rect width="${w}" height="${h}" rx="${r}" ry="${r}" fill="#fff"/></svg>`,
  );
  const screen = await sharp(file)
    .resize(w, h, { fit: "fill" })
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();

  const bez = Math.max(6, Math.round(w * 0.03));
  const bw = w + bez * 2;
  const bh = h + bez * 2;
  const body = Buffer.from(
    `<svg width="${bw}" height="${bh}" xmlns="http://www.w3.org/2000/svg">` +
      `<rect width="${bw}" height="${bh}" rx="${r + bez}" ry="${r + bez}" fill="${MUK}"/></svg>`,
  );
  return {
    buf: await sharp(body).composite([{ input: screen, left: bez, top: bez }]).png().toBuffer(),
    width: bw,
    height: bh,
  };
}

async function buildSocial(cards) {
  const dir = fresh(join(OUT, "social"));
  const majors = cards.filter((c) => c.suit === "major");
  const pick = (n) => majors.find((c) => c.name_en === n).filename;

  // X 타임라인은 16:9 를 자르지 않고 그대로 보여준다.
  const SW = 1600;
  const SH = 900;

  const title = (t, sub) =>
    `<text x="${SW / 2}" y="128" font-family="${serif}" font-size="66" fill="${MUK}" ` +
    `text-anchor="middle" letter-spacing="1">${escapeXml(t)}</text>` +
    `<text x="${SW / 2}" y="180" font-family="${serif}" font-size="28" fill="${JINDALLAE}" ` +
    `text-anchor="middle" letter-spacing="6">${escapeXml(sub)}</text>`;

  // 1) 카드 5장 부채꼴 — 아트 자체가 주인공. 가장 리트윗이 잘 되는 컷.
  {
    const five = ["The Fool", "The Empress", "The Star", "The Sun", "The Moon"].map(pick);
    const base = await hanjiBase(SW, SH);
    const fan = await cardFan(five, {
      cardW: 300,
      angles: [-22, -11, 0, 11, 22],
      spread: [-540, -270, 0, 270, 540],
      canvasW: SW,
      canvasH: SH,
      topPad: 210,
    });
    await sharp(base)
      .composite([
        ...fan,
        {
          input: Buffer.from(
            `<svg width="${SW}" height="${SH}" xmlns="http://www.w3.org/2000/svg">` +
              title("Joseon Tarot", "78 CARDS · DRAWN IN ONE HANBOK STYLE") +
              `</svg>`,
          ),
          left: 0,
          top: 0,
        },
        { input: changsalBandSvg(SW, 22, { opacity: 0.45 }), left: 0, top: SH - 58 },
      ])
      .png({ compressionLevel: 9 })
      .toFile(join(dir, "x-01-tarot-art.png"));
  }

  // 2) 폰 목업 3대 — "배경화면"임이 한눈에 보여야 팔린다.
  {
    const base = await hanjiBase(SW, SH);
    const files = [
      join(OUT, "joseon-tarot-wallpapers", "major-17-star-wallpaper.jpg"),
      join(OUT, "joseon-tarot-wallpapers", "major-19-sun-wallpaper.jpg"),
      join(OUT, "hanji-minimal-wallpapers", "hanji-08-cosmic.png"),
    ];
    const layers = [];
    const pw = 268;
    const gap = 70;
    const mocks = [];
    for (const f of files) mocks.push(await phoneMock(f, pw));
    const totalW = mocks.reduce((a, m) => a + m.width, 0) + gap * 2;
    let x = Math.round((SW - totalW) / 2);
    for (const m of mocks) {
      layers.push({ input: m.buf, left: x, top: Math.round((SH - m.height) / 2) + 70 });
      x += m.width + gap;
    }
    await sharp(base)
      .composite([
        ...layers,
        {
          input: Buffer.from(
            `<svg width="${SW}" height="${SH}" xmlns="http://www.w3.org/2000/svg">` +
              title("Phone Wallpapers", "30 DESIGNS · 1290 × 2796") +
              `</svg>`,
          ),
          left: 0,
          top: 0,
        },
      ])
      .png({ compressionLevel: 9 })
      .toFile(join(dir, "x-02-wallpapers.png"));
  }

  // 3) 인쇄용 덱 — 시트 한 장 + 뒷면을 나란히.
  {
    const base = await hanjiBase(SW, SH);
    // 왼쪽 = 9장 시트, 오른쪽 = 카드 뒷면 한 장. 둘의 높이를 맞춰 한 쌍으로 읽히게 한다.
    // (뒷면을 시트 높이로 늘려버리면 낙관이 세로로 뭉개진다.)
    const colH = 640;
    const ch = Math.round(colH / 3);
    const cw = Math.round((ch * 848) / 1264);
    const backH = colH;
    const backW = Math.round((backH * CARD_W) / CARD_H);
    const gap = 80;
    const x0 = Math.round((SW - (cw * 3 + gap + backW)) / 2);
    const y = Math.round((SH - colH) / 2) + 70;

    const nine = majors.slice(0, 9).map((c) => c.filename);
    const sheet = [];
    for (let i = 0; i < 9; i++) {
      sheet.push({
        input: await sharp(join(TAROT_DIR, nine[i])).resize(cw, ch, { fit: "fill" }).png().toBuffer(),
        left: (i % 3) * cw,
        top: Math.floor(i / 3) * ch,
      });
    }
    const sheetImg = await sharp({
      create: { width: cw * 3, height: ch * 3, channels: 3, background: "#FFFFFF" },
    })
      .composite(sheet)
      .png()
      .toBuffer();

    const back = await sharp(await cardBack())
      .resize(backW, backH, { fit: "fill" })
      .png()
      .toBuffer();

    await sharp(base)
      .composite([
        { input: sheetImg, left: x0, top: y },
        { input: back, left: x0 + cw * 3 + gap, top: y },
        {
          input: Buffer.from(
            `<svg width="${SW}" height="${SH}" xmlns="http://www.w3.org/2000/svg">` +
              title("Print It At Home", "A4 · 300 DPI · 63 × 88 MM") +
              `</svg>`,
          ),
          left: 0,
          top: 0,
        },
      ])
      .png({ compressionLevel: 9 })
      .toFile(join(dir, "x-03-printable.png"));
  }

  // 4) 아이돌 궁합 — 실제 /inyeon 스크린샷을 패널로 얹는다.
  //    가짜 UI 목업을 그리지 않는다: 진짜 화면이 더 잘 먹히고, 어긋날 위험도 없다.
  //    스크린샷 원본은 scripts/assets/screenshots/ 에 둔다 (products/ 는 매 실행 초기화됨).
  const shot = join(root, "scripts", "assets", "screenshots", "inyeon.png");
  if (existsSync(shot)) {
    const base = await hanjiBase(SW, SH);
    const panelH = 760;
    const meta = await sharp(shot).metadata();
    const panelW = Math.round((panelH * meta.width) / meta.height);
    const px = SW - panelW - 130;
    const py = Math.round((SH - panelH) / 2);

    const panel = await sharp(shot)
      .resize(panelW, panelH, { fit: "fill" })
      .composite([
        {
          input: Buffer.from(
            `<svg width="${panelW}" height="${panelH}" xmlns="http://www.w3.org/2000/svg">` +
              `<rect x="1" y="1" width="${panelW - 2}" height="${panelH - 2}" fill="none" ` +
              `stroke="${DANCHEONG}" stroke-width="3" opacity="0.8"/></svg>`,
          ),
          left: 0,
          top: 0,
        },
      ])
      .png()
      .toBuffer();

    const tx = Math.round(px / 2);
    const stamp = await stampBuffer(84, { tint: JINDALLAE });
    await sharp(base)
      .composite([
        { input: panel, left: px, top: py },
        {
          input: Buffer.from(
            `<svg width="${SW}" height="${SH}" xmlns="http://www.w3.org/2000/svg">` +
              `<text x="${tx}" y="${SH / 2 - 58}" font-family="${serif}" font-size="62" ` +
              `fill="${MUK}" text-anchor="middle">Your saju,</text>` +
              `<text x="${tx}" y="${SH / 2 + 14}" font-family="${serif}" font-size="62" ` +
              `fill="${MUK}" text-anchor="middle">meet your bias.</text>` +
              `<text x="${tx}" y="${SH / 2 + 76}" font-family="${serif}" font-size="27" ` +
              `fill="${JINDALLAE}" text-anchor="middle" letter-spacing="5">` +
              `149 IDOLS · 29 GROUPS · FREE</text>` +
              `</svg>`,
          ),
          left: 0,
          top: 0,
        },
        { input: stamp, left: tx - 42, top: SH / 2 + 116 },
      ])
      .png({ compressionLevel: 9 })
      .toFile(join(dir, "x-04-compat.png"));
    return { dir, count: 4 };
  }

  return { dir, count: 3 };
}

// ── 동봉 문서 (라이선스 · 인쇄 가이드) ───────────────────────────────────────

const LICENSE = `KSaju — Digital Goods License
=============================

Thank you for supporting KSaju.

WHAT YOU CAN DO
  - Use these files on your own devices, as many as you own.
  - Print them for your own personal use.
  - Share a photo of your screen or your printed cards on social media.

WHAT YOU CANNOT DO
  - Resell, redistribute, or give away the files.
  - Use them commercially (merch, prints for sale, paid content).
  - Upload them to wallpaper apps, stock sites, or file-sharing services.

Artwork and design (c) KSaju. All rights reserved.
Personal use only. For entertainment.
`;

const PRINT_GUIDE = `Joseon Tarot — Printable Deck
=============================

WHAT'S INSIDE
  joseon-tarot-printable-deck-a4.pdf
    Pages 1-9  : all 78 cards, 9 per page
    Page 10    : the card back (9 backs)

HOW TO PRINT
  1. Paper    : A4. Use the heaviest your printer takes -- 200-300 gsm
                (matte photo paper or cardstock) feels closest to a real deck.
  2. Settings : Scale = 100% (or "Actual size").
                Do NOT use "Fit to page" -- it shrinks the cards.
                Borderless is not needed; the margins hold the cut marks.
  3. Backs    : Page 10 is one sheet of 9 backs. Print it 9 times to back
                every card, or skip it and leave the backs blank.
  4. Cut      : The small ticks in the margins mark the cut lines.
                A craft knife and a steel ruler beat scissors here.
  5. Finish   : Round the corners with a 3mm corner punch if you have one.

CARD SIZE
  63 x 88 mm -- the standard tarot/poker size, so normal card sleeves fit.

For entertainment.
`;

// ── ZIP (Windows 내장 Compress-Archive — 새 의존성 없음) ─────────────────────

function zipDir(dir, zipPath) {
  try {
    if (existsSync(zipPath)) rmSync(zipPath);
    execFileSync(
      "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        `Compress-Archive -Path '${join(dir, "*")}' -DestinationPath '${zipPath}' -Force`,
      ],
      { stdio: "pipe" },
    );
    return true;
  } catch {
    return false;
  }
}

function escapeXml(s) {
  return String(s).replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c],
  );
}

// ── main ────────────────────────────────────────────────────────────────────

async function main() {
  mkdirSync(OUT, { recursive: true });
  const cards = readCards();

  const a = await buildTarotWallpapers(cards);
  console.log(`✓ 타로 배경화면 ${a.count}장 → ${a.dir}`);

  const b = await buildHanjiWallpapers();
  console.log(`✓ 한지 미니멀 배경화면 ${b.count}장 → ${b.dir}`);

  const c = await buildPrintableDeck(cards);
  console.log(
    `✓ 인쇄용 덱 PDF ${c.sheets}페이지 (${(c.bytes / 1024 / 1024).toFixed(1)} MB) → ${c.file}`,
  );

  // 유료 다운로드에는 이용 범위 고지를 반드시 동봉한다.
  for (const d of [a.dir, b.dir, c.dir]) writeFileSync(join(d, "LICENSE.txt"), LICENSE);
  writeFileSync(join(c.dir, "PRINT-GUIDE.txt"), PRINT_GUIDE);

  const s = await buildStorefront(cards);
  console.log(`✓ 커버 + 상품 썸네일 ${s.count}장 → ${s.dir}`);

  const x = await buildSocial(cards);
  console.log(`✓ X 게시용 이미지 ${x.count}장 (16:9) → ${x.dir}`);

  for (const [dir, zip] of [
    [a.dir, join(OUT, "joseon-tarot-wallpapers.zip")],
    [b.dir, join(OUT, "hanji-minimal-wallpapers.zip")],
    [c.dir, join(OUT, "joseon-tarot-printable-deck.zip")],
  ]) {
    console.log(zipDir(dir, zip) ? `✓ ${zip}` : `! ZIP 실패 — 폴더를 직접 압축하세요: ${dir}`);
  }

  console.log(
    `\n산출물은 products/ 에 있습니다 (git 미추적).` +
      `\n  Shop 업로드용 파일 : *.zip 3개` +
      `\n  Shop 썸네일·커버   : products/storefront/` +
      `\n카피와 업로드 순서는 docs/kofi-page-content.md 를 보세요.`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
