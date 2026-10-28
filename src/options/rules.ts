// Rules editor on the options page: list with actions, and an add/edit form.
import type { Action, Rule, Settings } from "../core/model";
import { validateSettings } from "../core/validate";
import { loadSettings, saveSettings } from "../storage";

let settings: Settings;
// index === rules.length means a new rule. id is the rule id kept on save.
let editing: { index: number; id: string } | null = null;

export const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;
// Form control by name. Selects are typed as inputs: only .value and .disabled are used on them.
const input = (name: string) => formEl.elements.namedItem(name) as HTMLInputElement;

const formEl = $<HTMLFormElement>("#rule-editor");
const listEl = $<HTMLOListElement>("#rule-list");
const noticeEl = $<HTMLParagraphElement>("#notice");
const editorErrorEl = $<HTMLSpanElement>("#editor-error");

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  text = "",
  props: Partial<HTMLElementTagNameMap[K]> = {},
): HTMLElementTagNameMap[K] {
  const e = Object.assign(document.createElement(tag), props);
  e.textContent = text;
  return e;
}

function summary(a: Action): string {
  switch (a.kind) {
    case "regexReplace":
      return `replace /${a.pattern}/${a.flags} with "${a.replacement}"`;
    case "removeQueryParam":
      return a.regex ? `remove query parameters matching /${a.name}/` : `remove query parameter "${a.name}"`;
    case "trim":
      return "trim whitespace";
  }
}

function showNotice(message: string) {
  noticeEl.textContent = message;
  noticeEl.hidden = message === "";
}

// Saves rules and redraws the list. Returns false when storage rejects them.
// Reloads stored settings so template changes made on this page are kept.
async function commit(rules: Rule[]): Promise<boolean> {
  const next = { ...(await loadSettings()).settings, rules };
  try {
    await saveSettings(next);
  } catch (e) {
    showNotice((e as Error).message);
    return false;
  }
  settings = next;
  showNotice("");
  renderList();
  return true;
}

function ruleItem(rule: Rule, i: number): HTMLLIElement {
  const last = settings.rules.length - 1;
  const enabled = el("input", "", { type: "checkbox", checked: rule.enabled, title: "Enabled" });
  enabled.addEventListener("change", () => {
    void commit(settings.rules.map((r, j) => (j === i ? { ...r, enabled: enabled.checked } : r)));
  });

  const info = el("div", "", { className: "info" });
  info.append(
    el("strong", rule.name || "(unnamed)"),
    el(
      "div",
      `${rule.target} | pages: ${rule.pageUrlPattern || "all"} | ${summary(rule.action)}`,
      { className: "meta" },
    ),
  );

  const button = (label: string, disabled: boolean, onClick: () => void) => {
    const b = el("button", label, { type: "button", disabled });
    b.addEventListener("click", onClick);
    return b;
  };
  const swap = (j: number) => {
    const rules = settings.rules.slice();
    [rules[i], rules[j]] = [rules[j], rules[i]];
    void commit(rules);
  };
  const remove = () => {
    if (!confirm(`Delete rule "${rule.name || "(unnamed)"}"?`)) return;
    void commit(settings.rules.filter((_, j) => j !== i));
  };

  const li = el("li", "", { className: "rule" });
  li.append(
    enabled,
    info,
    button("Edit", false, () => openEditor(i, rule)),
    button("Up", i === 0, () => swap(i - 1)),
    button("Down", i === last, () => swap(i + 1)),
    button("Delete", false, remove),
  );
  return li;
}

function renderList() {
  listEl.replaceChildren(...settings.rules.map(ruleItem));
}

// Shows only the action fields of `kind`. Removing a query parameter forces target "url".
function showKindFields(kind: Action["kind"]) {
  for (const fs of formEl.querySelectorAll<HTMLFieldSetElement>("fieldset[data-kind]")) {
    fs.hidden = fs.dataset.kind !== kind;
  }
  const target = input("target");
  target.disabled = kind === "removeQueryParam";
  if (target.disabled) target.value = "url";
}

function clearErrors() {
  for (const e of formEl.querySelectorAll<HTMLElement>("[data-error]")) e.textContent = "";
  editorErrorEl.textContent = "";
}

function fillForm(rule: Rule) {
  const a = rule.action;
  input("name").value = rule.name;
  input("enabled").checked = rule.enabled;
  input("pageUrlPattern").value = rule.pageUrlPattern;
  input("target").value = rule.target;
  input("kind").value = a.kind;
  input("pattern").value = a.kind === "regexReplace" ? a.pattern : "";
  input("flags").value = a.kind === "regexReplace" ? a.flags : "";
  input("replacement").value = a.kind === "regexReplace" ? a.replacement : "";
  input("paramName").value = a.kind === "removeQueryParam" ? a.name : "";
  input("paramRegex").checked = a.kind === "removeQueryParam" && a.regex === true;
  showKindFields(a.kind);
}

function readRule(id: string): Rule {
  const kind = input("kind").value as Action["kind"];
  const action: Action =
    kind === "regexReplace"
      ? {
          kind,
          pattern: input("pattern").value,
          flags: input("flags").value,
          replacement: input("replacement").value,
        }
      : kind === "removeQueryParam"
        ? { kind, name: input("paramName").value, regex: input("paramRegex").checked }
        : { kind: "trim" };
  return {
    id,
    name: input("name").value,
    enabled: input("enabled").checked,
    pageUrlPattern: input("pageUrlPattern").value,
    target: kind === "removeQueryParam" ? "url" : (input("target").value as Rule["target"]),
    action,
  };
}

function openEditor(index: number, rule: Rule | null) {
  editing = { index, id: rule?.id ?? crypto.randomUUID() };
  clearErrors();
  $("#editor-title").textContent = rule ? `Edit rule` : "New rule";
  fillForm(rule ?? {
    id: "",
    name: "",
    enabled: true,
    pageUrlPattern: "",
    target: "title",
    action: { kind: "regexReplace", pattern: "", flags: "", replacement: "" },
  });
  formEl.hidden = false;
  input("name").focus();
}

function closeEditor() {
  editing = null;
  formEl.hidden = true;
}

// Puts each validator error next to its field. Errors of other rules go to the editor top.
// Validator messages have the form "path: message".
function showFieldErrors(errors: string[], index: number) {
  clearErrors();
  const prefix = `rules[${index}].`;
  for (const error of errors) {
    const sep = error.indexOf(": ");
    const path = error.slice(0, sep);
    const message = error.slice(sep + 2);
    const field = path.startsWith(prefix) ? path.slice(prefix.length) : null;
    const target = field && formEl.querySelector<HTMLElement>(`[data-error="${field}"]`);
    if (target) target.textContent = message;
    else editorErrorEl.textContent += (editorErrorEl.textContent ? "\n" : "") + error;
  }
}

async function onSubmit(e: SubmitEvent) {
  e.preventDefault();
  if (!editing) return;
  const { index, id } = editing;
  const rules = settings.rules.slice();
  rules[index] = readRule(id);
  const result = validateSettings({ ...settings, rules });
  if (!result.ok) return showFieldErrors(result.errors, index);
  if (await commit(rules)) closeEditor();
}

export async function initRules() {
  const loaded = await loadSettings();
  settings = loaded.settings;
  if (loaded.warning) {
    showNotice("Stored settings are invalid, defaults are shown. Saving a rule replaces stored settings.");
  }
  renderList();

  $("#rule-add").addEventListener("click", () => openEditor(settings.rules.length, null));
  $("#rule-cancel").addEventListener("click", closeEditor);
  formEl.addEventListener("submit", (e) => void onSubmit(e));
  input("kind").addEventListener("change", (e) => {
    showKindFields((e.target as HTMLSelectElement).value as Action["kind"]);
  });
}
