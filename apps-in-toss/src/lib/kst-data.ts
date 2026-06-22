export const POPULAR_TIMEZONES = [
  // Asia
  { city: "Seoul",        iana: "Asia/Seoul",        gmt: "GMT+9" },
  { city: "Tokyo",        iana: "Asia/Tokyo",        gmt: "GMT+9" },
  { city: "Shanghai",     iana: "Asia/Shanghai",     gmt: "GMT+8" },
  { city: "Singapore",    iana: "Asia/Singapore",    gmt: "GMT+8" },
  { city: "Manila",       iana: "Asia/Manila",       gmt: "GMT+8" },
  { city: "Jakarta",      iana: "Asia/Jakarta",      gmt: "GMT+7" },
  { city: "Bangkok",      iana: "Asia/Bangkok",      gmt: "GMT+7" },
  { city: "Ho Chi Minh",  iana: "Asia/Ho_Chi_Minh",  gmt: "GMT+7" },
  { city: "Mumbai",       iana: "Asia/Kolkata",      gmt: "GMT+5:30" },
  { city: "Dubai",        iana: "Asia/Dubai",        gmt: "GMT+4" },
  // Europe
  { city: "London",       iana: "Europe/London",     gmt: "GMT+0" },
  { city: "Paris",        iana: "Europe/Paris",      gmt: "GMT+1" },
  { city: "Berlin",       iana: "Europe/Berlin",     gmt: "GMT+1" },
  { city: "Moscow",       iana: "Europe/Moscow",     gmt: "GMT+3" },
  // Americas
  { city: "New York",     iana: "America/New_York",  gmt: "GMT-5" },
  { city: "Toronto",      iana: "America/Toronto",   gmt: "GMT-5" },
  { city: "Chicago",      iana: "America/Chicago",   gmt: "GMT-6" },
  { city: "Mexico City",  iana: "America/Mexico_City", gmt: "GMT-6" },
  { city: "Denver",       iana: "America/Denver",    gmt: "GMT-7" },
  { city: "Los Angeles",  iana: "America/Los_Angeles", gmt: "GMT-8" },
  { city: "São Paulo",    iana: "America/Sao_Paulo", gmt: "GMT-3" },
  { city: "Buenos Aires", iana: "America/Argentina/Buenos_Aires", gmt: "GMT-3" },
  // Oceania
  { city: "Sydney",       iana: "Australia/Sydney",  gmt: "GMT+10" },
  { city: "Auckland",     iana: "Pacific/Auckland",  gmt: "GMT+12" },
  // Africa
  { city: "Cairo",        iana: "Africa/Cairo",      gmt: "GMT+2" },
  { city: "Lagos",        iana: "Africa/Lagos",      gmt: "GMT+1" },
] as const;

export const JIZI_HOURS = [
  { idx: 0,  name: "子 시 · Zi Hour",   animal: "Rat",     animalKo: "쥐",     range: "23:00 – 01:00" },
  { idx: 1,  name: "丑 시 · Chou Hour", animal: "Ox",      animalKo: "소",     range: "01:00 – 03:00" },
  { idx: 2,  name: "寅 시 · Yin Hour",  animal: "Tiger",   animalKo: "호랑이", range: "03:00 – 05:00" },
  { idx: 3,  name: "卯 시 · Mao Hour",  animal: "Rabbit",  animalKo: "토끼",   range: "05:00 – 07:00" },
  { idx: 4,  name: "辰 시 · Chen Hour", animal: "Dragon",  animalKo: "용",     range: "07:00 – 09:00" },
  { idx: 5,  name: "巳 시 · Si Hour",   animal: "Snake",   animalKo: "뱀",     range: "09:00 – 11:00" },
  { idx: 6,  name: "午 시 · Wu Hour",   animal: "Horse",   animalKo: "말",     range: "11:00 – 13:00" },
  { idx: 7,  name: "未 시 · Wei Hour",  animal: "Sheep",   animalKo: "양",     range: "13:00 – 15:00" },
  { idx: 8,  name: "申 시 · Shen Hour", animal: "Monkey",  animalKo: "원숭이", range: "15:00 – 17:00" },
  { idx: 9,  name: "酉 시 · You Hour",  animal: "Rooster", animalKo: "닭",     range: "17:00 – 19:00" },
  { idx: 10, name: "戌 시 · Xu Hour",   animal: "Dog",     animalKo: "개",     range: "19:00 – 21:00" },
  { idx: 11, name: "亥 시 · Hai Hour",  animal: "Pig",     animalKo: "돼지",   range: "21:00 – 23:00" },
] as const;
