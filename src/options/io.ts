// Export and import of all settings on the options page.
import { validateSettings } from "../core/validate";
import { loadSettings, saveSettings } from "../storage";
import { $, el } from "./rules";

const errorsEl = $<HTMLUListElement>("#io-errors");
const fileEl = $<HTMLInputElement>("#import-file");

function showErrors(errors: string[]) {
  errorsEl.replaceChildren(...errors.map((e) => el("li", e)));
}

async function exportSettings() {
  const { settings } = await loadSettings();
  const blob = new Blob([JSON.stringify(settings, null, 2) + "\n"], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  el("a", "", { href: url, download: "advance-copy-settings.json" }).click();
  // Deferred: some browsers still need the URL right after click().
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Invalid file: show validator errors, stored settings stay unchanged.
async function importFile(file: File) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch (e) {
    return showErrors([`file: invalid JSON (${(e as Error).message})`]);
  }
  const result = validateSettings(parsed);
  if (!result.ok) return showErrors(result.errors);
  if (!confirm("Replace all rules and templates with this file? Current settings are lost.")) return;
  await saveSettings(result.settings);
  location.reload(); // page state (rules, templates) is loaded at startup
}

export function initIo() {
  $("#export").addEventListener("click", () => void exportSettings());
  $("#import").addEventListener("click", () => {
    showErrors([]);
    fileEl.click();
  });
  fileEl.addEventListener("change", () => {
    const file = fileEl.files?.[0];
    fileEl.value = ""; // allow picking the same file again
    if (file) void importFile(file);
  });
}
