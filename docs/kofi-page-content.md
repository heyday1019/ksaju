# Ko-fi 페이지 콘텐츠 팩 (ko-fi.com/ksaju)

> 이 문서는 **그대로 복사해 붙여넣는 용도**입니다. Ko-fi 는 웹에서만 편집되므로
> 이미지·파일은 `npm run gen:products` 로 만든 `products/` 산출물을 직접 업로드하세요.
>
> 카피는 사이트 톤(가볍고 친근, "For entertainment 🌙")에 맞춘 영어입니다.
> 타겟이 영어권 K-pop 팬이라 한국어 버전은 두지 않습니다.

---

## 0. 준비 — 산출물 만들기

```bash
npm run gen:products
```

`products/` 에 생기는 것 (git 미추적):

| 파일 | 용도 |
|---|---|
| `storefront/kofi-cover.png` (1920×640) | 페이지 상단 커버 |
| `storefront/thumb-joseon-tarot-wallpapers.png` (1200²) | Shop 상품 ① 썸네일 |
| `storefront/thumb-hanji-minimal-wallpapers.png` (1200²) | Shop 상품 ② 썸네일 |
| `storefront/thumb-printable-deck.png` (1200²) | Shop 상품 ③ 썸네일 |
| `joseon-tarot-wallpapers.zip` (~21 MB) | Shop 상품 ① 판매 파일 |
| `hanji-minimal-wallpapers.zip` (~10 MB) | Shop 상품 ② 판매 파일 |
| `joseon-tarot-printable-deck.zip` (~30 MB) | Shop 상품 ③ 판매 파일 |

각 ZIP 에는 `LICENSE.txt`(개인 이용 범위 고지)가 들어 있고, 인쇄용 덱에는
`PRINT-GUIDE.txt`(용지·배율·재단 안내)가 추가로 들어 있습니다.

---

## 1. 업로드 순서

페이지가 어중간하게 보이는 시간을 줄이려면 이 순서가 좋습니다.

1. **Cover** 업로드 → 2. **About** 교체 → 3. **Goal** 설정 →
4. **Shop 상품 3개** 등록 → 5. **Gallery** 채우기 → 6. **첫 Post** 발행 (마지막에 해야 팔로워 피드에 완성된 페이지가 뜹니다)

---

## 2. Cover

`products/storefront/kofi-cover.png` 업로드.

Ko-fi 는 기기 폭에 따라 좌우를 조금씩 잘라냅니다. 카피는 가운데 쪽에 몰아두었고
양쪽에 여백을 넉넉히 남겨서 잘려도 문장이 깨지지 않습니다.

---

## 3. About

현재 About 은 궁합 기능만 소개하는데, 그 사이 앱이 사주·운세·타로까지 커졌습니다.
아래로 교체하세요.

```
Hi, I'm a developer in Seoul — and KSaju is my solo side project.

It's a free, no-signup way to play with saju (사주), Korean astrology:
read your four pillars, check your compatibility with your bias, pull a
tarot card for the day. No 7,000-word reading, no paywall. Just something
fun to screenshot and send to your group chat.

I build it at night, after my day job. Every coffee here goes straight
back into keeping it free and adding the next thing.

If ksaju.me made your day — thank you, genuinely ☕

For entertainment 🌙
```

> 왜 이렇게 썼는지: "무료", "가입 없음", "공유하기 좋음"이 핵심 차별점이고,
> 마지막 두 문단이 후원 이유를 만듭니다. 경쟁사처럼 "깊은 리딩"을 약속하지 않습니다.

---

## 4. Goal

Ko-fi 공식 통계상 목표가 있는 페이지가 평균 20% 더 벌고, 무엇보다
"이 돈이 어디에 쓰이는지"가 보이면 첫 후원 문턱이 낮아집니다.

- **Goal title:** `Keep KSaju free for everyone`
- **Monthly target:** `$25`
- **Description:**

```
Domain, hosting, and the AI that writes your daily reading — that's what
this covers. Hit the goal and KSaju stays free, with no ads and no login.
```

> ⚠️ **$25 는 제 추정치입니다.** 실제 도메인 + OpenRouter API 월 비용을 아시면
> 그 숫자로 바꾸세요. 목표는 낮게 잡을수록 달성이 빨라지고, 달성된 게이지가
> 다음 후원을 부릅니다. 실제 비용보다 크게 올려 잡지 마세요.

---

## 5. Shop 상품 3개

Ko-fi: `Create → Sell something` → 각각 등록. 썸네일과 판매 파일은 위 표 참고.

### ① Joseon Tarot — Phone Wallpapers

- **가격:** `$4`
- **썸네일:** `storefront/thumb-joseon-tarot-wallpapers.png`
- **파일:** `joseon-tarot-wallpapers.zip`
- **설명:**

```
All 22 Major Arcana from the Joseon Tarot deck, set as phone wallpapers.

Hanbok, dancheong palettes, Joseon court painting — the whole deck was
drawn in one consistent style, then mounted on hanji paper so nothing gets
stretched or cropped on your screen.

  · 22 wallpapers, 1290 × 2796 (fits every modern phone)
  · Laid out to leave the lock screen clock clear
  · Instant download, ZIP

Personal use only. For entertainment 🌙
```

### ② Hanji Minimal — Phone Wallpapers

- **가격:** `$3`
- **썸네일:** `storefront/thumb-hanji-minimal-wallpapers.png`
- **파일:** `hanji-minimal-wallpapers.zip`
- **설명:**

```
For when you want your home screen quiet.

Eight minimal wallpapers built from the KSaju motifs — hanji paper grain,
the changsal window lattice, the five elements (오행), and the seal stamp
that signs every KSaju card. One dark navy version for OLED.

  · 8 wallpapers, 1290 × 2796
  · Light and dark options
  · Instant download, ZIP

Personal use only. For entertainment 🌙
```

### ③ Joseon Tarot — Printable Deck

- **가격:** `$10`
- **썸네일:** `storefront/thumb-printable-deck.png`
- **파일:** `joseon-tarot-printable-deck.zip`
- **설명:**

```
Print the whole Joseon Tarot deck at home.

All 78 cards laid out on A4 sheets at 300 dpi, with cut marks and a
matching card back. Cards come out at 63 × 88 mm — the standard tarot
size, so normal sleeves fit.

  · 78 cards + card back, 10-page PDF
  · A4, 300 dpi, cut marks included
  · Printing guide included (paper weight, scale, cutting)
  · Instant download

Personal use only — please don't sell printed copies.
For entertainment 🌙
```

---

## 5-b. 구매 후 안내 메시지 (Message to buyers)

Ko-fi 의 **"Leave a message or instructions for buyers"** 칸에 넣는 글입니다.
결제 직후 화면과 영수증 메일에 함께 나갑니다.

짧게 쓰는 게 좋습니다 — 이 화면에서 사람들이 실제로 찾는 건 딱 두 가지,
**"내 파일 어디 있지"** 와 **"이거 어떻게 쓰지"** 입니다. 감사 인사는 한 줄이면 충분합니다.

### ① Joseon Tarot — Phone Wallpapers

```
Thank you — genuinely ☕

Inside: 22 wallpapers, one for each Major Arcana, at 1290 x 2796.
Bigger than any current phone screen, so they scale down cleanly. Just save and set.

Tip: the cards sit low on purpose, so the lock screen clock stays clear.
Try one there first.

Personal use only — please don't reupload or resell. Full terms in LICENSE.txt.

If one ends up on your home screen, I'd love to see it 🌾
```

### ② Hanji Minimal — Phone Wallpapers

```
Thank you — genuinely ☕

Inside: 8 wallpapers at 1290 x 2796. Seven light, one dark navy for OLED.

They're built from the same motifs as the app — hanji paper grain, the
changsal window lattice, the five elements, and the seal stamp that signs
every KSaju card.

Personal use only — please don't reupload or resell. Full terms in LICENSE.txt.

🌾
```

### ③ Joseon Tarot — Printable Deck

```
Thank you — genuinely ☕

Inside: all 78 cards as a 10-page A4 PDF, plus PRINT-GUIDE.txt.

Please read the guide first. One setting decides everything: set your printer
scale to 100% (or "Actual size"). Never "Fit to page" — that shrinks the cards
and they stop fitting sleeves.

Page 10 is the card back. Print it 9 times to back the whole deck, or skip it
and leave the backs blank.

Cards finish at 63 x 88 mm — standard tarot size.

Personal use only — please don't sell printed copies. Full terms in LICENSE.txt.

If you finish a deck, I'd really love to see it 🌾
```

### ④ 일반 후원용 (Shop 이 아니라 커피 후원에 붙는 감사 메시지)

Ko-fi 설정의 별도 칸입니다. 상품 구매가 아니라 그냥 커피를 사준 사람에게 나갑니다.

```
Thank you — that genuinely helps ☕

KSaju is a solo project I build at night, after my day job. Every coffee goes
straight back into keeping it free: no ads, no login, no paywall.

If you haven't pulled today's tarot card yet, it's waiting at ksaju.me 🌙
```

> 마지막 줄이 사람들을 앱으로 되돌려 보냅니다. 후원자는 이미 가장 호의적인
> 방문자이므로, 감사로만 끝내지 말고 다시 앱으로 보내는 편이 낫습니다.

---

## 6. Gallery

Ko-fi Gallery 는 페이지에서 가장 눈이 먼저 가는 자리입니다. 순서대로 6장 정도면 충분합니다.

1. `storefront/thumb-joseon-tarot-wallpapers.png`
2. `storefront/thumb-printable-deck.png`
3. `joseon-tarot-wallpapers/major-17-star-wallpaper.jpg` — 실제 배경화면 한 장
4. `joseon-tarot-wallpapers/major-19-sun-wallpaper.jpg`
5. `hanji-minimal-wallpapers/hanji-08-cosmic.png`
6. **앱 실제 화면 캡처** — 아래 참고

> **직접 찍으셔야 하는 것:** ksaju.me 에서 본인 사주 결과 화면과 공유 카드
> 스크린샷 1~2장. 상품 이미지만 있으면 "굿즈 파는 곳"으로 보이고, 앱 화면이 있어야
> "이 앱을 후원하는 곳"이 됩니다. 후원 전환에는 이쪽이 더 중요합니다.

---

## 7. 첫 Post

`Create → Post something → Blog`. 제목과 본문:

**제목:** `KSaju now has a shop ✨`

```
Small update: KSaju has a shop now.

The tarot art in the app was drawn card by card in one consistent Joseon
style, and enough of you asked about it that I've put it up properly —
phone wallpapers, and a printable version of the full 78-card deck if you
want a physical one.

The app itself stays exactly as it is: free, no signup, no ads.

If you'd rather just buy me a coffee instead, that works too. Either way,
thank you for being here ☕

— made solo, from Seoul 🌾
```

> Ko-fi Post 는 팔로워 피드와 이메일로 나갑니다. **Shop 등록을 모두 마친 뒤에**
> 발행하세요. 안 그러면 링크를 타고 온 사람이 빈 Shop 을 봅니다.

---

## 8. 하지 말 것

- **아이돌 이름·사진을 상품이나 카피에 쓰지 않기.** 앱에서 이름·생일을 궁합
  식별용 공개정보로 쓰는 것과, 그것으로 수익을 내는 것은 법적으로 완전히 다릅니다.
- **"정확한 운세"·"진짜 사주 상담" 같은 표현 쓰지 않기.** 포지셔닝이 무너지고
  (경쟁사는 깊이로 싸우는 유료 리딩 서비스입니다) 소비자 보호 이슈도 생깁니다.
  `For entertainment 🌙` 를 계속 답니다.
- **상품 파일을 git 에 커밋하지 않기.** `products/` 는 `.gitignore` 에 있습니다.
  스크립트를 돌리면 언제든 똑같이 다시 만들어집니다.

---

## 9. 이 다음에 해야 할 것

이 페이지는 **전환율**을 올리지 트래픽을 만들지 않습니다. 지금 ksaju.me 방문자가
적은 상태에서는 상품이 팔릴 자리 자체가 비어 있습니다.

월 $100 목표는 여기가 아니라 **유입**에서 결정됩니다. 다음 사이클로
① 앱인토스 출시 마무리(한국 신규 채널) ② 마케팅·콘텐츠 파이프라인을 권합니다.
