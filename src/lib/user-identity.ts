import { getSupabaseClient } from "./supabase-client";
import type { BirthData } from "./kst-types";

const UID_KEY = "ksaju_uid";
const BIRTH_KEY = "ksaju:birthData:v1";

export interface UserProfile {
  uid: string;
  birthdate: string;        // "YYYY-MM-DD"
  birth_time: string | null; // "HH:MM" or null
  timezone: string;
  day_master: string | null;
  email: string | null;
}

export function getOrCreateUID(): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = localStorage.getItem(UID_KEY);
    if (existing) return existing;
    const uid = crypto.randomUUID();
    localStorage.setItem(UID_KEY, uid);
    return uid;
  } catch {
    return crypto.randomUUID();
  }
}

export function saveBirthData(birth: BirthData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(BIRTH_KEY, JSON.stringify(birth));
  } catch { /* best-effort */ }
}

export function loadBirthData(): BirthData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(BIRTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BirthData;
  } catch {
    return null;
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;
  try {
    const { data, error } = await sb
      .from("anon_users")
      .select("*")
      .eq("uid", uid)
      .maybeSingle();
    if (error) { console.error("[user-identity] getUserProfile:", error.message); return null; }
    return data as UserProfile | null;
  } catch (e) {
    console.error("[user-identity] getUserProfile unexpected:", e);
    return null;
  }
}

function toBirthdateStr(b: BirthData): string {
  return `${b.year}-${String(b.month).padStart(2, "0")}-${String(b.day).padStart(2, "0")}`;
}
function toBirthTimeStr(b: BirthData): string | null {
  if (b.hour === undefined) return null;
  return `${String(b.hour).padStart(2, "0")}:${String(b.minute ?? 0).padStart(2, "0")}`;
}

export async function saveUserProfile(
  uid: string,
  birth: BirthData,
  dayMaster: string,
): Promise<void> {
  const sb = getSupabaseClient();
  if (!sb) return;
  try {
    const { error } = await sb.from("anon_users").upsert(
      {
        uid,
        birthdate: toBirthdateStr(birth),
        birth_time: toBirthTimeStr(birth),
        timezone: birth.timezone,
        day_master: dayMaster,
        last_visit: new Date().toISOString(),
      },
      { onConflict: "uid" },
    );
    if (error) console.error("[user-identity] saveUserProfile:", error.message);
  } catch (e) {
    console.error("[user-identity] saveUserProfile unexpected:", e);
  }
}

export async function saveEmail(uid: string, email: string): Promise<void> {
  const sb = getSupabaseClient();
  if (!sb) return;
  try {
    const { error } = await sb
      .from("anon_users")
      .update({ email })
      .eq("uid", uid);
    if (error) console.error("[user-identity] saveEmail:", error.message);
  } catch (e) {
    console.error("[user-identity] saveEmail unexpected:", e);
  }
}
