import { loadSettings } from "./storage";
import { applyRules } from "./core/rules";
import { renderTemplate } from "./core/template";
import { copyText } from "./clipboard";

const FEEDBACK_MS = 1500;
const OK_FEEDBACK_MS = 1000;
const DEFAULT_TITLE = "Smart URL Copy";
let resetTimer: ReturnType<typeof setTimeout> | undefined;

function setIconState(state: "default" | "ok" | "error"): Promise<void> {
  return chrome.action.setIcon({
    path: { 16: `icons/${state}-16.png`, 24: `icons/${state}-24.png`, 32: `icons/${state}-32.png` },
  });
}

// Shows ok or error icon for FEEDBACK_MS, then returns to default.
// Error: red "ERR" badge. Warnings only: amber "!" badge. Tooltip lists every message.
async function showFeedback(reason: string | null, warnings: string[]): Promise<void> {
  clearTimeout(resetTimer);
  if (reason !== null) console.error("Smart URL Copy:", reason, warnings);
  const messages = reason === null ? warnings : [reason, ...warnings];
  const badge = reason !== null ? "ERR" : warnings.length > 0 ? "!" : "";
  await setIconState(reason === null ? "ok" : "error");
  await chrome.action.setBadgeBackgroundColor({ color: reason !== null ? "#b00020" : "#8a4b00" });
  await chrome.action.setBadgeText({ text: badge });
  await chrome.action.setTitle({
    title: messages.length > 0 ? `${DEFAULT_TITLE}: ${messages.join("; ")}` : DEFAULT_TITLE,
  });
  resetTimer = setTimeout(() => {
    void setIconState("default");
    void chrome.action.setBadgeText({ text: "" });
    void chrome.action.setTitle({ title: DEFAULT_TITLE });
  }, reason === null ? OK_FEEDBACK_MS : FEEDBACK_MS);
}

chrome.action.onClicked.addListener(async (tab) => {
  let reason: string | null = null;
  const warnings: string[] = [];
  try {
    if (tab.id === undefined) throw new Error("no active tab");
    const pageUrl = tab.url ?? "";
    const { settings, warning } = await loadSettings();
    if (warning) warnings.push("stored settings are invalid, defaults used");
    const title = applyRules(settings.rules, "title", tab.title ?? "", pageUrl);
    const url = applyRules(settings.rules, "url", pageUrl, pageUrl);
    warnings.push(...title.warnings, ...url.warnings);
    const template = settings.templates.find((t) => t.id === settings.activeTemplateId);
    if (!template) throw new Error("active template not found");
    reason = await copyText(renderTemplate(template.body, { title: title.value, url: url.value }));
  } catch (e) {
    reason = (e as Error).message;
  }
  await showFeedback(reason, warnings);
});
