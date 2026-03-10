"use client";

import type { UserProfile, OnboardingData, DiagnosticResult, AppState, FocusBreakdownData } from "./types";

const KEYS = {
  user: "kosti_user",
  onboarding: "kosti_onboarding",
  diagnostic: "kosti_diagnostic",
  focusBreakdown: "kosti_focus_breakdown",
} as const;

function getItem<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

function removeItem(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(key);
}

export const storage = {
  getUser: () => getItem<UserProfile>(KEYS.user),
  setUser: (user: UserProfile) => setItem(KEYS.user, user),
  removeUser: () => removeItem(KEYS.user),

  getOnboarding: () => getItem<OnboardingData>(KEYS.onboarding),
  setOnboarding: (data: OnboardingData) => setItem(KEYS.onboarding, data),

  getFocusBreakdown: () => getItem<FocusBreakdownData>(KEYS.focusBreakdown),
  setFocusBreakdown: (data: FocusBreakdownData) => setItem(KEYS.focusBreakdown, data),

  getDiagnostic: () => getItem<DiagnosticResult>(KEYS.diagnostic),
  setDiagnostic: (data: DiagnosticResult) => setItem(KEYS.diagnostic, data),

  getAppState: (): AppState => ({
    user: getItem<UserProfile>(KEYS.user),
    onboarding: getItem<OnboardingData>(KEYS.onboarding),
    diagnostic: getItem<DiagnosticResult>(KEYS.diagnostic),
  }),

  clearAll: () => {
    Object.values(KEYS).forEach(removeItem);
  },
};
