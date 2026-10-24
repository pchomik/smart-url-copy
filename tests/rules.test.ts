import { describe, expect, it } from "vitest";
import type { Action, Rule, Target } from "../src/core/model";
import { applyRules, matchesPage } from "../src/core/rules";

const rule = (target: Target, action: Action, over: Partial<Rule> = {}): Rule => ({
  id: "r",
  name: "R",
  enabled: true,
  pageUrlPattern: "",
  target,
  action,
  ...over,
});
const PAGE = "https://a.com/p?utm_source=x&id=1";
const run = (rules: Rule[], target: Target, value: string, pageUrl = PAGE) =>
  applyRules(rules, target, value, pageUrl);

describe("matchesPage", () => {
  it("empty pattern matches all pages, otherwise regex on page URL", () => {
    expect(matchesPage(rule("title", { kind: "trim" }), PAGE)).toBe(true);
    expect(matchesPage(rule("title", { kind: "trim" }, { pageUrlPattern: "^https://b\\.com" }), PAGE)).toBe(false);
  });
});

describe("applyRules", () => {
  it("regexReplace expands {{ 0 }}, {{ 1 }} and empties missing groups", () => {
    const r = rule("url", { kind: "regexReplace", pattern: "^(https://[^/]+)/blog/.*$", flags: "", replacement: "{{ 1 }}/" });
    expect(run([r], "url", "https://a.com/blog/post").value).toBe("https://a.com/");
    const whole = rule("title", { kind: "regexReplace", pattern: "b(x)?", flags: "", replacement: "[{{0}}|{{ 1 }}|{{ 9 }}]" });
    expect(run([whole], "title", "abx").value).toBe("a[bx|x|]");
    expect(run([whole], "title", "ab").value).toBe("a[b||]");
  });

  it("regexReplace removes fragment", () => {
    const r = rule("url", { kind: "regexReplace", pattern: "#(.*)$", flags: "", replacement: "" });
    expect(run([r], "url", "https://a.com/p#top").value).toBe("https://a.com/p");
  });

  it("removeQueryParam drops all matching params, keeps others, order and fragment", () => {
    const r = rule("url", { kind: "removeQueryParam", name: "utm_source" });
    expect(run([r], "url", "https://a.com/p?utm_source=x&id=1&utm_source=y&q=a%20b#frag").value).toBe(
      "https://a.com/p?id=1&q=a%20b#frag",
    );
    expect(run([r], "url", "https://a.com/p?utm_source=x").value).toBe("https://a.com/p");
  });

  it("trim strips whitespace", () => {
    expect(run([rule("title", { kind: "trim" })], "title", "  Hi  ").value).toBe("Hi");
  });

  it("skips disabled rules and rules for other targets or non-matching pages", () => {
    const rules = [
      rule("title", { kind: "trim" }, { enabled: false }),
      rule("url", { kind: "trim" }),
      rule("title", { kind: "regexReplace", pattern: "x", flags: "", replacement: "y" }, { pageUrlPattern: "^https://b" }),
    ];
    expect(run(rules, "title", " x ").value).toBe(" x ");
  });

  it("runs rules in order, each on the previous output", () => {
    const rules = [
      rule("title", { kind: "regexReplace", pattern: " - Example$", flags: "", replacement: "" }),
      rule("title", { kind: "trim" }),
      rule("title", { kind: "regexReplace", pattern: "^", flags: "", replacement: "[{{ 0 }}]" }),
    ];
    expect(run(rules, "title", " Home - Example").value).toBe("[]Home");
  });

  it("rejects a rewritten invalid URL, keeps previous value, warns", () => {
    const r = rule("url", { kind: "regexReplace", pattern: "^https://", flags: "", replacement: "" }, { name: "Strip" });
    const out = run([r], "url", "https://a.com/");
    expect(out.value).toBe("https://a.com/");
    expect(out.warnings).toHaveLength(1);
  });
});
