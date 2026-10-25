// Templates section on the options page: list, active choice, and add/edit form.
import type { Settings, Template } from "../core/model";
import { validateSettings } from "../core/validate";
import { loadSettings, saveSettings } from "../storage";
import { $, el } from "./rules";

let settings: Settings;
// Template id being edited. A new template gets a fresh id on save.
let editing: { id: string } | null = null;

const formEl = $<HTMLFormElement>("#template-editor");
const listEl = $<HTMLOListElement>("#template-list");
const noticeEl = $<HTMLParagraphElement>("#template-notice");
const editorErrorEl = $<HTMLSpanElement>("#template-editor-error");
const field = (name: string) => formEl.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement;

function showNotice(message: string) {
  noticeEl.textContent = message;
  noticeEl.hidden = message === "";
}

// Reloads stored settings so rule changes made on this page are kept.
const stored = async (): Promise<Settings> => (await loadSettings()).settings;

// Saves settings and redraws the list. Returns false when storage rejects them.
async function commit(next: Settings): Promise<boolean> {
  try {
    await saveSettings(next);
  } catch (e) {
    showNotice((e as Error).message);
    renderList();
    return false;
  }
  settings = next;
  showNotice("");
  renderList();
  return true;
}

async function setActive(id: string) {
  await commit({ ...(await stored()), activeTemplateId: id });
}

async function remove(id: string) {
  const base = await stored();
  const doomed = base.templates.find((t) => t.id === id);
  if (!doomed) return;
  if (base.templates.length === 1) return showNotice("At least one template is required.");
  if (!confirm(`Delete template "${doomed.name || "(unnamed)"}"?`)) return;

  const templates = base.templates.filter((t) => t.id !== id);
  const movedActive = id === base.activeTemplateId;
  const next = { ...base, templates, activeTemplateId: movedActive ? templates[0].id : base.activeTemplateId };
  if (await commit(next) && movedActive) {
    showNotice(`Deleted the active template. "${templates[0].name || "(unnamed)"}" is now active.`);
  }
}

function templateItem(t: Template): HTMLLIElement {
  const active = el("input", "", {
    type: "radio",
    name: "active-template",
    checked: t.id === settings.activeTemplateId,
    title: "Used on icon click",
  });
  active.addEventListener("change", () => void setActive(t.id));

  const info = el("div", "", { className: "info" });
  info.append(el("strong", t.name || "(unnamed)"), el("div", t.body, { className: "meta" }));

  const edit = el("button", "Edit", { type: "button" });
  edit.addEventListener("click", () => openEditor(t));
  const del = el("button", "Delete", { type: "button", disabled: settings.templates.length === 1 });
  del.addEventListener("click", () => void remove(t.id));

  const li = el("li", "", { className: "rule" });
  li.append(active, info, edit, del);
  return li;
}

function renderList() {
  listEl.replaceChildren(...settings.templates.map(templateItem));
}

function clearErrors() {
  for (const e of formEl.querySelectorAll<HTMLElement>("[data-error]")) e.textContent = "";
  editorErrorEl.textContent = "";
}

function openEditor(t: Template | null) {
  editing = { id: t?.id ?? crypto.randomUUID() };
  clearErrors();
  $("#template-editor-title").textContent = t ? "Edit template" : "New template";
  field("name").value = t?.name ?? "";
  field("body").value = t?.body ?? "";
  formEl.hidden = false;
  field("name").focus();
}

function closeEditor() {
  editing = null;
  formEl.hidden = true;
}

// Puts each validator error next to its field. Other errors go to the editor top.
// Validator messages have the form "path: message", path like "templates[1].body".
function showFieldErrors(errors: string[], index: number) {
  clearErrors();
  const prefix = `templates[${index}].`;
  for (const error of errors) {
    const sep = error.indexOf(": ");
    const path = error.slice(0, sep);
    const message = error.slice(sep + 2);
    const name = path.startsWith(prefix) ? path.slice(prefix.length) : "";
    const target = name && formEl.querySelector<HTMLElement>(`[data-error="${name}"]`);
    if (target) target.textContent = message;
    else editorErrorEl.textContent += (editorErrorEl.textContent ? "\n" : "") + error;
  }
}

async function onSubmit(e: SubmitEvent) {
  e.preventDefault();
  if (!editing) return;
  const draft: Template = { id: editing.id, name: field("name").value, body: field("body").value };
  const base = await stored();
  const i = base.templates.findIndex((t) => t.id === draft.id);
  const templates =
    i < 0 ? [...base.templates, draft] : base.templates.map((t, j) => (j === i ? draft : t));
  const next = { ...base, templates };
  const result = validateSettings(next);
  if (!result.ok) return showFieldErrors(result.errors, i < 0 ? base.templates.length : i);
  if (await commit(next)) closeEditor();
}

export async function initTemplates() {
  settings = await stored();
  renderList();

  $("#template-add").addEventListener("click", () => openEditor(null));
  $("#template-cancel").addEventListener("click", closeEditor);
  formEl.addEventListener("submit", (e) => void onSubmit(e));
}
