# docs/tarot-cards.csv 에 정립(upright) 테마 한 줄 + 키워드 컬럼을 보강.
# taro-scan.pdf("Boss Tarot") 각 카드의 테마 문구 + 정방향 키워드 박스를 읽어
# 영어로 정리한 것(참고용). card_prompt(장면 설명)와 함께 리딩 LLM 그라운딩에 사용.
# (suit, rank) 키로 매핑 — 멱등(재실행 안전).
import csv, os, sys

CSV = os.path.join("docs", "tarot-cards.csv")

# key "suit:rank" -> (theme 한 줄, 정립 키워드 3개)
DATA = {
    # ── Major Arcana ──────────────────────────────────────────────
    "major:0":  ("a free spirit, unbound", "pure heart; new beginnings; boundless possibility"),
    "major:1":  ("overflowing confidence and drive", "persuasive eloquence; proactive will; showing your talent"),
    "major:2":  ("clear, noble reason and intellect", "unwavering composure; inner wisdom; trusting intuition"),
    "major:3":  ("one who holds love, beauty, and fruition", "warm affection; beautiful surroundings; mature charm"),
    "major:4":  ("a coolheaded ambition risen to the top", "overflowing confidence; dignified presence; reliable leadership"),
    "major:5":  ("a trustworthy spiritual supporter", "true guidance; inner peace; firm trust"),
    "major:6":  ("dreamlike happiness and joy", "lasting joy; fluttering excitement; falling in love"),
    "major:7":  ("the strength to charge head-on without fear", "momentum toward victory; strong conviction; overflowing energy"),
    "major:8":  ("gentle mental strength that tames power", "mastering your impulses; gentle yet strong; firm willpower"),
    "major:9":  ("looking into the light within", "inner reflection; wisdom and maturity; quiet serenity"),
    "major:10": ("a fleeting moment that arrives like fate", "rising fortune; approaching luck; a fateful moment"),
    "major:11": ("a rational and right choice", "fairness and neutrality; honesty and impartiality; principle and balance"),
    "major:12": ("finding insight within confinement", "an isolating pause; a shift in perspective; patience and realization"),
    "major:13": ("an ending and a beginning for a new start", "growth to the next stage; resolve taking shape; the order of nature"),
    "major:14": ("new creation through harmony and balance", "moderation and balance; smooth progress; flexibility"),
    "major:15": ("a heart consumed by sweet desire", "addiction to pleasure; misguided desire; sweet temptation"),
    "major:16": ("a bolt-from-the-blue shock and change", "a great upheaval; a bold choice; fundamental change"),
    "major:17": ("blessing and hope under clear starlight", "light of hope; dazzling talent; a pure heart"),
    "major:18": ("illusion and truth — which is real?", "uneasy allure; an ambiguous state; a vague unease"),
    "major:19": ("the brilliantly shining energy of success", "reaching the peak; success and achievement; fruition and satisfaction"),
    "major:20": ("revived memories returning as opportunity", "a turning point; release from the past; a clear choice"),
    "major:21": ("the joy of a completed world after a long journey", "reward for your efforts; harmonious effort; ultimate fulfillment"),
    # ── Wands (불/지팡이) ─────────────────────────────────────────
    "wands:ace":    ("the start of possibility about to bloom", "advancing ambition; a spark of passion; showing your skill"),
    "wands:2":      ("confidence for an ambitious leap", "overflowing confidence; rewarding growth; planning the next move"),
    "wands:3":      ("seeking a chance to advance", "an approaching challenge; signs of progress; welcome news"),
    "wands:4":      ("free joy that spreads from within", "peaceful feelings; a smooth flow; problems resolved"),
    "wands:5":      ("a clash of strong wills", "a desire for change; a no-holds-barred contest; tangled rivalry"),
    "wands:6":      ("praised in the victor's seat", "honorable victory; steady support; a decisive advantage"),
    "wands:7":      ("a fight from higher ground", "an unshaken stance; seizing the upper hand; strong conviction"),
    "wands:8":      ("a swift, unhindered rush to the goal", "rapid progress; rushing momentum; quick results"),
    "wands:9":      ("bracing to face what you fear", "full preparation; time to regroup; a vigilant stance"),
    "wands:10":     ("a heavy burden you took on yourself", "reaching your limit; hardship of your own making; strong attachment"),
    "wands:page":   ("a beginner dreaming of a bright future", "fresh motivation; an arriving opportunity; pure sincerity"),
    "wands:knight": ("fierce will and brave momentum", "intense will; soaring vitality; an unhesitating start"),
    "wands:queen":  ("proud, magnetic charm", "the center of attention; winning all the love; a confident bearing"),
    "wands:king":   ("bold, decisive leadership", "sure results; soaring passion; powerful command"),
    # ── Cups (물/잔) ──────────────────────────────────────────────
    "cups:ace":    ("welling emotion and a loving heart", "joy and happiness; a fluttering heart; love begins"),
    "cups:2":      ("newly sprouting excitement", "love begins; a partner appears; mutual support"),
    "cups:3":      ("people grateful just to be together", "sharing joy; deep solidarity; good company"),
    "cups:4":      ("emotional stagnation after long comfort", "no change; dissatisfaction; clinging to the status quo"),
    "cups:5":      ("burying grief over loss", "deep sorrow; spilled regret; faint hope remaining"),
    "cups:6":      ("warm memories of the past", "warm rapport; pure affection; nostalgia"),
    "cups:7":      ("searching for what you truly value", "fantasy and delusion; choice paralysis; an unseen reality"),
    "cups:8":      ("setting out on a new journey", "settled feelings; the next stage; leaving the past behind"),
    "cups:9":      ("basking in fulfillment after a goal", "a wish fulfilled; pride; material success"),
    "cups:10":     ("happiness felt in peaceful daily life", "a peaceful everyday; a gentle nature; positive relationships"),
    "cups:page":   ("pure curiosity toward love", "rich imagination; an open mind; pure curiosity"),
    "cups:knight": ("empathy that steadies emotion", "graceful bearing; gentle feelings; a romantic connection"),
    "cups:queen":  ("sharing boundless compassion", "a tolerant heart; artistic sensibility; emotional harmony"),
    "cups:king":   ("mastering even fierce emotion with skill", "ease of mind; deep consideration; strength of intellect"),
    # ── Swords (쇠/검) ────────────────────────────────────────────
    "swords:ace":    ("carving your future with firm will", "a firm decision; clear thinking; strong will"),
    "swords:2":      ("hesitating at a crossroads of choice", "feelings held in balance; a stalemate; cool judgment"),
    "swords:3":      ("facing deep heart-wounds, pain and sorrow", "a sorrowful heart; a wounded heart; a process of growth"),
    "swords:4":      ("rest for the heart after hard times", "rest from fatigue; time alone; ample stability"),
    "swords:5":      ("desire to take by any means", "a harmful desire; achieving your aim; a hollow possession"),
    "swords:6":      ("escaping turbulent waters toward calm", "breaking free; a turning situation; moving on"),
    "swords:7":      ("bold but reckless, risky behavior", "an illicit move; a loss or theft; a leaked secret"),
    "swords:8":      ("time bound within your own thoughts", "a powerless mind; loneliness; mental anguish"),
    "swords:9":      ("fear and sorrow you don't want to bear", "anxiety; frayed nerves; turning from reality"),
    "swords:10":     ("laying everything down and moving on", "acceptance; a crossroads of life; a change of situation"),
    "swords:page":   ("watching your surroundings calmly", "careful preparation; discretion; high alertness"),
    "swords:knight": ("charging unwaveringly toward a goal", "rational judgment; a bold challenge; sharp analysis"),
    "swords:queen":  ("right judgment made coolly and rationally", "rational action; intellectual sharpness; self-possession"),
    "swords:king":   ("authority and power held in a single sword", "objective analysis; a clear choice; supreme authority"),
    # ── Pentacles (흙/엽전) ───────────────────────────────────────
    "pentacles:ace":    ("one great reward earned through effort", "exertion of effort; stable footing; a time of achievement"),
    "pentacles:2":      ("skillfully adapting with flexibility", "a skillful attitude; a flexible choice; a smooth flow"),
    "pentacles:3":      ("results of effort coming to the surface", "a chance to cooperate; excellent skill; proven competence"),
    "pentacles:4":      ("strong attachment born of possessiveness", "securing what matters; a solid plan; holding on tight"),
    "pentacles:5":      ("facing harsh reality with help unseen", "lingering pride; a time for reflection; a state of want"),
    "pentacles:6":      ("mutual ties born of goodwill and abundance", "a balanced exchange; the joy of sharing; a state of abundance"),
    "pentacles:7":      ("lingering dissatisfaction with the results", "effort invested; a time to reassess; aiming higher"),
    "pentacles:8":      ("the fruits of diligent practice", "building your skill; diligent practice; deep focus"),
    "pentacles:9":      ("enjoying abundance without want", "sure progress; rising status; a life of ease"),
    "pentacles:10":     ("a precious legacy across generations", "family prosperity; glory passed down; lasting stability"),
    "pentacles:page":   ("pure passion for a new future", "diligent self-discipline; growing curiosity; laying foundations"),
    "pentacles:knight": ("strong and deeply patient", "calm growth; strong responsibility; steady perseverance"),
    "pentacles:queen":  ("keeping peace through devoted love", "a settled heart; a dependable support; an embracing life"),
    "pentacles:king":   ("a generous soul who knows how to share", "a dependable provider; deep care; sharing abundance"),
}


def main() -> int:
    with open(CSV, encoding="utf-8", newline="") as f:
        rows = list(csv.DictReader(f))
        fieldnames = list(rows[0].keys())

    # 옛 버전이 만든 'keywords' 컬럼이 이미 있으면 재사용, 없으면 card_prompt 뒤에 theme,keywords 삽입
    for col in ("theme", "keywords"):
        if col not in fieldnames:
            fieldnames.insert(fieldnames.index("card_prompt") + 1, col)
    # theme 가 keywords 뒤에 들어갔을 수 있으니 순서 정렬(card_prompt, theme, keywords)
    base = fieldnames.index("card_prompt")
    for col in ("keywords", "theme"):
        if col in fieldnames:
            fieldnames.remove(col)
    fieldnames[base + 1:base + 1] = ["theme", "keywords"]

    filled = 0
    missing = []
    for r in rows:
        key = f"{r['suit']}:{r['rank']}"
        entry = DATA.get(key)
        if entry:
            r["theme"], r["keywords"] = entry
            filled += 1
        else:
            r.setdefault("theme", "")
            r.setdefault("keywords", "")
            missing.append(key)

    with open(CSV, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)

    print(f"{CSV}: {len(rows)}행 중 {filled}개 카드 theme+keywords 보강")
    if missing:
        print("  미매칭:", missing)
    return 0


if __name__ == "__main__":
    sys.exit(main())
