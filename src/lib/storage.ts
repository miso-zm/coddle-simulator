"use client";

import type { LocalRecords, LocalRecord } from "./types";

const STORAGE_KEY = "honghong_records";
const VOICE_KEY = "honghong_voice";
const GENDER_KEY = "honghong_gender";

export function getLocalRecords(): LocalRecords {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LocalRecords) : {};
  } catch {
    return {};
  }
}

export function saveLocalRecord(
  sceneId: string,
  rounds: number,
  score: number,
  won: boolean,
): void {
  if (typeof window === "undefined") return;
  const records = getLocalRecords();
  const existing = records[sceneId];

  if (won) {
    if (!existing || rounds < existing.bestRounds) {
      records[sceneId] = {
        bestRounds: rounds,
        bestScore: score,
        playCount: (existing?.playCount || 0) + 1,
      };
    } else {
      records[sceneId] = {
        ...existing,
        playCount: existing.playCount + 1,
      };
    }
  } else {
    records[sceneId] = {
      bestRounds: existing?.bestRounds || 0,
      bestScore: existing?.bestScore || 0,
      playCount: (existing?.playCount || 0) + 1,
    };
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function getSavedVoice(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(VOICE_KEY);
}

export function saveVoice(voice: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(VOICE_KEY, voice);
}

export function getSavedGender(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(GENDER_KEY);
}

export function saveGender(gender: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(GENDER_KEY, gender);
}

export function getBestRecordForScene(sceneId: string): LocalRecord | null {
  const records = getLocalRecords();
  return records[sceneId] || null;
}
