import * as settingsService from "./settingsService";

export async function saveSettings(patch) {
  if (typeof settingsService.updateSettings !== "function") {
    throw new Error("settingsService.updateSettings is not available.");
  }
  return settingsService.updateSettings(patch);
}

export async function loadSettings() {
  if (typeof settingsService.getSettings !== "function") {
    throw new Error("settingsService.getSettings is not available.");
  }
  return settingsService.getSettings();
}

export async function callOptional(name, ...args) {
  const fn = settingsService[name];
  if (typeof fn !== "function") return null;
  return fn(...args);
}
