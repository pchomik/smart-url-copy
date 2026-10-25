import type { Settings } from "./model";

const MAX_PATTERN_LENGTH = 500;
const TEMPLATE_PLACEHOLDERS = new Set(["title", "url"]);

export type Result =
  | { ok: true; settings: Settings }
  | { ok: false; errors: string[] }; // each error: "path: message"

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === "string";

export function validateSettings(x: unknown): Result {
  const errors: string[] = [];
  const err = (path: string, message: string) => errors.push(`${path}: ${message}`);

  if (!isObj(x)) return { ok: false, errors: ["settings: must be an object"] };
  if (x.version !== 1) err("version", "must be 1");
  if (!Array.isArray(x.rules)) err("rules", "must be an array");
  if (!Array.isArray(x.templates)) err("templates", "must be an array");
  if (!isStr(x.activeTemplateId)) err("activeTemplateId", "must be a string");
  if (errors.length) return { ok: false, errors };
  const templates = x.templates as unknown[];
  const rules = x.rules as unknown[];

  const templateIds = new Set<string>();
  const ruleIds = new Set<string>();

  // Compiles a regex; the length limit guards against oversized user input.
  const checkPattern = (path: string, pattern: string, flags: string) => {
    if (pattern.length > MAX_PATTERN_LENGTH) {
      return err(path, `longer than ${MAX_PATTERN_LENGTH} characters`);
    }
    try {
      new RegExp(pattern, flags);
    } catch (e) {
      err(path, `invalid regex: ${(e as Error).message}`);
    }
  };

  // Checks a unique string id. Ids of a collection go into `seen`.
  const checkId = (path: string, id: unknown, seen: Set<string>) => {
    if (!isStr(id)) return err(path, "must be a string");
    if (seen.has(id)) err(path, `duplicate id "${id}"`);
    seen.add(id);
  };

  templates.forEach((t, i) => {
    const p = `templates[${i}]`;
    if (!isObj(t)) return err(p, "must be an object");
    checkId(`${p}.id`, t.id, templateIds);
    if (!isStr(t.name)) err(`${p}.name`, "must be a string");
    if (!isStr(t.body)) return err(`${p}.body`, "must be a string");
    for (const m of t.body.matchAll(/\{\{(.*?)\}\}/g)) {
      const name = m[1].trim();
      if (!TEMPLATE_PLACEHOLDERS.has(name)) {
        err(`${p}.body`, `unknown placeholder {{ ${name} }}`);
      }
    }
  });
  if (templates.length === 0) err("templates", "at least one template required");
  if (isStr(x.activeTemplateId) && !templateIds.has(x.activeTemplateId)) {
    err("activeTemplateId", `no template with id "${x.activeTemplateId}"`);
  }

  rules.forEach((r, i) => {
    const p = `rules[${i}]`;
    if (!isObj(r)) return err(p, "must be an object");
    checkId(`${p}.id`, r.id, ruleIds);
    if (!isStr(r.name)) err(`${p}.name`, "must be a string");
    if (typeof r.enabled !== "boolean") err(`${p}.enabled`, "must be a boolean");
    if (!isStr(r.pageUrlPattern)) err(`${p}.pageUrlPattern`, "must be a string");
    else if (r.pageUrlPattern !== "") checkPattern(`${p}.pageUrlPattern`, r.pageUrlPattern, "");
    if (r.target !== "title" && r.target !== "url") err(`${p}.target`, 'must be "title" or "url"');
    checkAction(p, r);
  });

  // Action checks depend on the rule's target, so they run with the rule.
  function checkAction(p: string, r: Obj) {
    const a = r.action;
    const ap = `${p}.action`;
    if (!isObj(a)) return err(ap, "must be an object");
    switch (a.kind) {
      case "regexReplace":
        if (!isStr(a.pattern)) err(`${ap}.pattern`, "must be a string");
        if (!isStr(a.flags)) err(`${ap}.flags`, "must be a string");
        if (!isStr(a.replacement)) err(`${ap}.replacement`, "must be a string");
        if (isStr(a.pattern) && isStr(a.flags)) checkPattern(`${ap}.pattern`, a.pattern, a.flags);
        return;
      case "removeQueryParam":
        if (!isStr(a.name)) err(`${ap}.name`, "must be a string");
        if (r.target !== "url") err(`${p}.target`, 'removeQueryParam requires target "url"');
        return;
      case "trim":
        return;
      default:
        return err(`${ap}.kind`, 'must be "regexReplace", "removeQueryParam" or "trim"');
    }
  }

  return errors.length ? { ok: false, errors } : { ok: true, settings: x as unknown as Settings };
}
