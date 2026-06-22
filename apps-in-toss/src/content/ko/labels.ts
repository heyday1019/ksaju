import { elementOf } from "../../lib/saju-display";
import type { WuXing } from "../../lib/saju-types";

const COMPAT_LABELS: Record<string, string> = {
  "fire-water": "뜨겁고 차가운 케미 🔥💧",
  "fire-wood": "내가 그 사람의 불씨를 키워요 🌳🔥",
  "earth-fire": "따뜻하고 든든한 사이 🔥🏔️",
  "earth-metal": "탄탄한 파워 커플 🏔️⚙️",
  "metal-water": "시원하고 깊고 맑은 사이 ⚙️💧",
  "water-wood": "함께 조용히 자라는 사이 💧🌳",
  "metal-wood": "팽팽한 긴장, 강한 끌림 ⚙️🌳",
  "earth-water": "안정 속에 흐르는 사이 🏔️💧",
  "fire-metal": "강렬하게 다듬어가는 사이 🔥⚙️",
  "earth-wood": "뿌리내리고 솟아오르는 사이 🌳🏔️",
  "fire-fire": "스파크 두 배 🔥🔥",
  "water-water": "깊은 두 영혼 💧💧",
  "wood-wood": "나란히 자라는 사이 🌳🌳",
  "earth-earth": "산처럼 단단한 사이 🏔️🏔️",
  "metal-metal": "매끈하고 거침없는 사이 ⚙️⚙️",
};

export function compatLabelKo(meDayStem: string, idolDayStem: string): string {
  const e1 = elementOf(meDayStem) as WuXing;
  const e2 = elementOf(idolDayStem) as WuXing;
  const key = [e1, e2].sort().join("-");
  return COMPAT_LABELS[key] ?? "세상에 하나뿐인 인연 ✨";
}

const DAY_MASTER_KO: Record<string, string> = {
  甲: "양목(陽木) — 곧게 뻗은 큰 나무, 올곧고 단단한 사람",
  乙: "음목(陰木) — 유연한 덩굴, 부드럽지만 끈질긴 사람",
  丙: "양화(陽火) — 태양처럼 빛나고 외향적인 사람",
  丁: "음화(陰火) — 촛불처럼 따뜻하고 다정한 사람",
  戊: "양토(陽土) — 산처럼 든든하고 흔들림 없는 사람",
  己: "음토(陰土) — 기름진 흙처럼 품어주고 잘 맞춰주는 사람",
  庚: "양금(陽金) — 무쇠처럼 결단력 있고 강인한 사람",
  辛: "음금(陰金) — 세공된 보석처럼 섬세하고 우아한 사람",
  壬: "양수(陽水) — 바다처럼 넓고 자유로운 사람",
  癸: "음수(陰水) — 가랑비처럼 직관적이고 잘 스며드는 사람",
};

export function dayMasterKeywordKo(dayStem: string): string {
  return DAY_MASTER_KO[dayStem] ?? "";
}
