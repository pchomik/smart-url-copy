import type { Action, Rule, Target } from "./model";

export interface ApplyResult {
  value: string;
  warnings: string[];
}

// Empty pattern matches all pages. Original page URL is matched, not a rewritten one.
export function matchesPage(rule: Rule, pageUrl: string): boolean {
  return rule.pageUrlPattern === "" || new RegExp(rule.pageUrlPattern).test(pageUrl);
}

// Expands {{ n }} with capture group n. Missing or non-participating group yields "".
function expandReplacement(replacement: string, groups: (string | undefined)[]): string {
  return replacement.replace(/\{\{\s*(\d+)\s*\}\}/g, (_, n: string) => groups[Number(n)] ?? "");
}

function isValidUrl(s: string): boolean {
  try {
    new URL(s);
    return true;
  } catch {
    return false;
  }
}

// Removes every query parameter named `name`. Other parameters keep their raw encoding and order.
function removeQueryParam(url: string, name: string): string {
  const u = new URL(url);
  if (!u.search) return url;
  const kept = u.search
    .slice(1)
    .split("&")
    .filter((seg) => seg !== "" && [...new URLSearchParams(seg).keys()][0] !== name);
  u.search = kept.join("&");
  return u.href;
}

function runAction(action: Action, value: string): string {
  switch (action.kind) {
    case "regexReplace":
      return value.replace(new RegExp(action.pattern, action.flags), (...args: unknown[]) => {
        // Replacer args: match, captures..., offset, input[, named groups]. Offset is the first number.
        const end = args.findIndex((a, i) => i > 0 && typeof a === "number");
        return expandReplacement(action.replacement, args.slice(0, end) as string[]);
      });
    case "removeQueryParam":
      return removeQueryParam(value, action.name);
    case "trim":
      return value.trim();
  }
}

export function applyRules(
  rules: Rule[],
  target: Target,
  value: string,
  pageUrl: string,
): ApplyResult {
  const warnings: string[] = [];
  for (const rule of rules) {
    if (!rule.enabled || rule.target !== target || !matchesPage(rule, pageUrl)) continue;
    const next = runAction(rule.action, value);
    if (target === "url" && !isValidUrl(next)) {
      warnings.push(`rule "${rule.name}": rewritten URL is not valid, kept previous value`);
      continue;
    }
    value = next;
  }
  return { value, warnings };
}
