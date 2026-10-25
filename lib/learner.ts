"use client";

const STORAGE_KEY = "vocab-sprint-learner-id";

export function getLearnerId() {
  let learnerId = window.localStorage.getItem(STORAGE_KEY);
  if (!learnerId) {
    learnerId = window.crypto.randomUUID();
    window.localStorage.setItem(STORAGE_KEY, learnerId);
  }
  return learnerId;
}
