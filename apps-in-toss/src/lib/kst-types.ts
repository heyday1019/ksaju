// 생년월일 검증(zod birthSchema)은 제거했다 — BirthForm 이 년/월/일 드롭다운이고
// 일(日) 선택지를 고른 연·월에서 파생하므로 잘못된 날짜를 만들 수 없다.
export type BirthData = {
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
  timezone: string; // IANA name, e.g. "America/New_York"
};

export type JiziHour = {
  idx: number;
  name: string;
  animal: string;
  animalKo: string;
  range: string;
};

export type KSTResult = {
  sourceLocal: {
    dateLabel: string;
    timeLabel: string | null;
    timezone: { city: string; iana: string; gmt: string };
  };
  kst: {
    year: number;
    month: number;
    day: number;
    hour: number | null;
    minute: number | null;
    dateLabelKo: string;
    timeLabel: string | null;
    weekdayKo: string;
    weekdayEn: string;
  };
  jiziHour: JiziHour | null;
  funFact: string;
};
