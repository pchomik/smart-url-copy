import type { Settings } from "./core/model";
import { defaultSettings } from "./core/defaults";
import { validateSettings } from "./core/validate";

const KEY = "settings";

export interface Loaded {
  settings: Settings;
  warning: boolean; // true when stored data was invalid and defaults were used
}

export async function loadSettings(): Promise<Loaded> {
  const stored = (await chrome.storage.local.get(KEY))[KEY];
  if (stored === undefined) return { settings: defaultSettings(), warning: false };
  const result = validateSettings(stored);
  if (result.ok) return { settings: result.settings, warning: false };
  return { settings: defaultSettings(), warning: true };
}

export async function saveSettings(settings: Settings): Promise<void> {
  const result = validateSettings(settings);
  if (!result.ok) throw new Error(result.errors.join("\n"));
  await chrome.storage.local.set({ [KEY]: settings });
}
