"use client";

import type { ColdEmailOutput, EnvironmentAnalysis, SavedCompany, SocietyAnalysis, SocietyProfileInput } from "@/lib/types";

export const STORAGE_KEYS = {
  society: "societybridge.society",
  societyAnalysis: "societybridge.analysis",
  environmentAnalysis: "societybridge.companyProblemEnvironmentAnalysis.v2",
  savedCompanies: "societybridge.savedCompanies",
  latestColdEmail: "societybridge.latestColdEmail"
};

export function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function readSocietyState() {
  return {
    society: readJson<SocietyProfileInput | null>(STORAGE_KEYS.society, null),
    analysis: readJson<SocietyAnalysis | null>(STORAGE_KEYS.societyAnalysis, null),
    environmentAnalysis: readJson<EnvironmentAnalysis | null>(STORAGE_KEYS.environmentAnalysis, null)
  };
}

export function saveSocietyState(society: SocietyProfileInput, analysis: SocietyAnalysis) {
  writeJson(STORAGE_KEYS.society, society);
  writeJson(STORAGE_KEYS.societyAnalysis, analysis);
}

export function saveEnvironmentAnalysis(environmentAnalysis: EnvironmentAnalysis) {
  writeJson(STORAGE_KEYS.environmentAnalysis, environmentAnalysis);
}

export function readSavedCompanies() {
  return readJson<SavedCompany[]>(STORAGE_KEYS.savedCompanies, []);
}

export function writeSavedCompanies(companies: SavedCompany[]) {
  writeJson(STORAGE_KEYS.savedCompanies, companies);
}

export function saveLatestColdEmail(output: ColdEmailOutput) {
  writeJson(STORAGE_KEYS.latestColdEmail, output);
}
