import * as settingsService from "./settingsService";

export async function loadSettings() {
  if (typeof settingsService.getSettings !== "function") {
    throw new Error(
      "settingsService.getSettings is not available."
    );
  }

  return settingsService.getSettings();
}

export async function saveSettings(patch = {}) {
  if (
    !patch ||
    typeof patch !== "object" ||
    Array.isArray(patch)
  ) {
    throw new Error(
      "Settings patch must be an object."
    );
  }

  if (
    typeof settingsService.updateSettings !==
    "function"
  ) {
    throw new Error(
      "settingsService.updateSettings is not available."
    );
  }

  return settingsService.updateSettings(patch);
}

export async function getSettings() {
  return loadSettings();
}

export async function updateSettings(patch = {}) {
  return saveSettings(patch);
}

export async function callOptional(name, ...args) {
  if (!name) {
    return null;
  }

  const fn = settingsService[name];

  if (typeof fn !== "function") {
    return null;
  }

  return fn(...args);
}