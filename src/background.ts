import { loadSettings } from "./storage";
import { applyRules } from "./core/rules";
import { renderTemplate } from "./core/template";
import { copyText } from "./clipboard";

const FEEDBACK_MS = 1500;
const DEFAULT_TITLE = "Advance Copy";
let resetTimer: ReturnType<typeof setTimeout> | undefined;

function setIconState(state: "default" | "ok" | "error"): Promise<void> {
  return chrome.action.setIcon({
    path: { 16: `icons/${state}-16.png`, 48: `icons/${state}-48.png`, 128: `icons/${state}-128.png` },
  });
}

// Shows ok or error icon for FEEDBACK_MS, then returns to default.
async function showFeedback(reason: string | null): Promise<void> {
  clearTimeout(resetTimer);
  await setIconState(reason === null ? "ok" : "error");
  await chrome.action.setTitle({ title: reason === null ? DEFAULT_TITLE : `${DEFAULT_TITLE}: ${reason}` });
  resetTimer = setTimeout(() => {
    void setIconState("default");
    void chrome.action.setTitle({ title: DEFAULT_TITLE });
  }, FEEDBACK_MS);
}

chrome.action.onClicked.addListener(async (tab) => {
  let reason: string | null;
  try {
    if (tab.id === undefined) throw new Error("no active tab");
    const pageUrl = tab.url ?? "";
    const { settings } = await loadSettings();
    const title = applyRules(settings.rules, "title", tab.title ?? "", pageUrl).value;
    const url = applyRules(settings.rules, "url", pageUrl, pageUrl).value;
    const template = settings.templates.find((t) => t.id === settings.activeTemplateId);
    if (!template) throw new Error("active template not found");
    reason = await copyText(tab.id, renderTemplate(template.body, { title, url }));
  } catch (e) {
    reason = (e as Error).message;
  }
  await showFeedback(reason);
});
