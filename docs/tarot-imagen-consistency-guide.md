# KSaju 타로카드 — Google Imagen 일관성 가이드

> 기존 Midjourney 프롬프트를 Google Imagen 3 (nano-banana pro) 최적화 버전으로 전환.
> 핵심 원칙: **스타일 DNA를 프롬프트 맨 앞**에 두고, 카드별 내용 뒤에 덧붙임.

---

## 왜 이미지 일관성이 깨지는가?

| 문제 | 원인 | 해결 |
|------|------|------|
| 카드마다 색감이 다름 | "jewel-tone" 같은 모호한 표현 | 정확한 HEX 코드 지정 |
| 아트 스타일이 흔들림 | "semi-realistic" 해석 편차 | 구체적 회화 기법 명시 |
| 한복이 제각각임 | 衣裝 설명 부족 | 시대·신분별 복식 고정 |
| 배경 구도 달라짐 | 카드 프레임 명세 없음 | 픽셀 단위 레이아웃 명시 |
| Midjourney 파라미터 무시됨 | `--ar`, `--v`, `--style` 미지원 | API 파라미터로 이전 |

---

## 새 마스터 스타일 블록 (모든 카드에 앞에 붙임)

```
[STYLE DNA — MUST APPLY TO ENTIRE IMAGE]
Art direction: Traditional Joseon dynasty Korean historical fantasy illustration (1392–1897 CE era). Technique: digital oil painting, fine-line black ink contour outlines, flat color fills with soft gradient shading on fabric and skin, cross-hatching texture on stone and wood surfaces. Art style: detailed East Asian court painting tradition, similar to Joseon hwawon (화원) royal court painter aesthetic. NOT anime. NOT manga. NOT Western medieval fantasy. NOT photorealistic 3D render. NOT modern clothing.

Strict color palette — use ONLY these colors:
- Card background: deep navy blue #0F1B5E
- Primary accent: crimson red #C8385A  
- Metallic objects and borders: Korean gold #C49A3F
- Nature accents: jade green #4A7C6B
- Skin tones: warm ivory #EED5B7 to golden brown #C8935A
- Ink outlines: charcoal #1A1A2E
- Paper border: hanji ivory #FBF6E8

Lighting: single warm 4500K point light source from upper-left at 45 degrees, soft shadow fills to lower-right, no harsh shadows, volumetric glow on magical elements only.

Card frame specification: 2:3 portrait orientation. Outer border: white hanji rice-paper texture (#FBF6E8) with fine gold-leaf speckle veining. Inner border: diamond-shaped gold geometric lattice frame (#C49A3F) inset 4% from card edge. Card interior fill: deep navy #0F1B5E. Top 12% of card interior: dancheong bracket-and-beam pattern band in red #C8385A / green #4A7C6B / blue #1A4A8A / gold #C49A3F traditional Korean temple ceiling style. Bottom 12%: same dancheong pattern band. Top center: small diamond badge containing Arabic numeral card number in gold on navy. Bottom center: ornate horizontal scroll ribbon in gold with English card title in calligraphic serif font.

All human figures: authentic Joseon period hanbok or court attire, silk fabric sheen visible, detailed embroidered motifs on collar and cuffs appropriate to character rank (king=dragon, noble=crane, warrior=tiger).

Background botanical fill: Korean traditional botanical motifs — moran peonies (모란), gukhwa chrysanthemums (국화), maehwa plum blossoms (매화), yeonkkot lotus flowers (연꽃) — arranged as decorative corner and edge fill.

High detail level, cinematic composition, centered subject, cultural accuracy, museum-quality illustration.
[END STYLE DNA]
```

---

## 프롬프트 조합 공식

```
{STYLE DNA} + {카드별 장면 설명} + {부정 프롬프트}
```

### 부정 프롬프트 (모든 카드 공통, API negative_prompt 필드에 입력)

```
anime, manga, cartoon, chibi, Western medieval fantasy, European castle, photorealistic, 3D render, CGI, modern clothing, contemporary fashion, white person, Western facial features, watercolor wash only, flat illustration without detail, low detail, blurry, text artifacts, watermark
```

---

## Google Imagen 3 API 파라미터

```json
{
  "instances": [{
    "prompt": "[STYLE DNA] + {카드 프롬프트}",
    "negativePrompt": "anime, manga, cartoon, chibi, Western medieval fantasy..."
  }],
  "parameters": {
    "sampleCount": 1,
    "aspectRatio": "3:4",
    "safetyFilterLevel": "block_few",
    "personGeneration": "allow_all",
    "outputMimeType": "image/png"
  }
}
```

---

## 일관성 팁

1. **첫 5장(0-4번 메이저)** 먼저 생성해 색감·스타일 확인
2. 마음에 드는 결과물 1장을 **`referenceImage`** 필드로 추가하면 스타일 고정됨
3. 배치 생성 시 카드 하나씩 순서대로 (병렬 생성하면 일관성 저하)
4. 생성 실패 시 재시도 전에 Wait 5초 (API 쿨다운)
