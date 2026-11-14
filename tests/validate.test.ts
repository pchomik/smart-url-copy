import { describe, expect, it } from "vitest";
import { defaultSettings } from "../src/core/defaults";
import { validateSettings } from "../src/core/validate";

const withRules = (...rules: unknown[]) => ({ ...defaultSettings(), rules });
const rule = (over: Record<string, unknown>) => ({
  id: "r1",
  name: "R",
  enabled: true,
  pageUrlPattern: "",
  target: "title",
  action: { kind: "trim" },
  ...over,
});

describe("validateSettings", () => {
  it("accepts defaults", () => {
    expect(validateSettings(defaultSettings()).ok).toBe(true);
  });

  it("rejects bad regex with field path", () => {
    const r = validateSettings(
      withRules(rule({ action: { kind: "regexReplace", pattern: "(", flags: "", replacement: "" } })),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]).toMatch(/^rules\[0\]\.action\.pattern: invalid regex/);
  });

  it("rejects bad pageUrlPattern", () => {
    const r = validateSettings(withRules(rule({ pageUrlPattern: "[" })));
    if (r.ok) throw new Error("expected failure");
    expect(r.errors[0]).toMatch(/^rules\[0\]\.pageUrlPattern: invalid regex/);
  });

  it("rejects unknown template placeholder", () => {
    const s = defaultSettings();
    s.templates[0].body = "{{ titel }}";
    const r = validateSettings(s);
    if (r.ok) throw new Error("expected failure");
    expect(r.errors).toEqual(["templates[0].body: unknown placeholder {{ titel }}"]);
  });

  it("rejects removeQueryParam on a title rule", () => {
    const r = validateSettings(withRules(rule({ action: { kind: "removeQueryParam", name: "utm" } })));
    if (r.ok) throw new Error("expected failure");
    expect(r.errors[0]).toMatch(/^rules\[0\]\.target: removeQueryParam requires target "url"/);
  });

  it("rejects invalid regex in removeQueryParam name when regex is set", () => {
    const bad = { kind: "removeQueryParam", name: "utm(", regex: true };
    const r = validateSettings(withRules(rule({ target: "url", action: bad })));
    if (r.ok) throw new Error("expected failure");
    expect(r.errors[0]).toMatch(/^rules\[0\]\.action\.name: invalid regex/);
    expect(validateSettings(withRules(rule({ target: "url", action: { ...bad, regex: false } }))).ok).toBe(true);
  });

  it("rejects duplicate rule ids", () => {
    const r = validateSettings(withRules(rule({}), rule({})));
    if (r.ok) throw new Error("expected failure");
    expect(r.errors[0]).toMatch(/^rules\[1\]\.id: duplicate id "r1"/);
  });

  it("accepts valid truncate rule", () => {
    const r = validateSettings(withRules(rule({ action: { kind: "truncate", maxLength: 50 } })));
    expect(r.ok).toBe(true);
  });

  it("accepts truncate rule with explicit suffix", () => {
    const r = validateSettings(withRules(rule({ action: { kind: "truncate", maxLength: 20, suffix: "..." } })));
    expect(r.ok).toBe(true);
  });

  it("rejects truncate with maxLength 0", () => {
    const r = validateSettings(withRules(rule({ action: { kind: "truncate", maxLength: 0 } })));
    if (r.ok) throw new Error("expected failure");
    expect(r.errors[0]).toMatch(/^rules\[0\]\.action\.maxLength: must be a positive integer/);
  });

  it("rejects truncate with negative maxLength", () => {
    const r = validateSettings(withRules(rule({ action: { kind: "truncate", maxLength: -1 } })));
    if (r.ok) throw new Error("expected failure");
    expect(r.errors[0]).toMatch(/^rules\[0\]\.action\.maxLength: must be a positive integer/);
  });

  it("rejects truncate with non-integer maxLength", () => {
    const r = validateSettings(withRules(rule({ action: { kind: "truncate", maxLength: 3.5 } })));
    if (r.ok) throw new Error("expected failure");
    expect(r.errors[0]).toMatch(/^rules\[0\]\.action\.maxLength: must be a positive integer/);
  });

  it("rejects truncate with non-string suffix", () => {
    const r = validateSettings(withRules(rule({ action: { kind: "truncate", maxLength: 10, suffix: 123 } })));
    if (r.ok) throw new Error("expected failure");
    expect(r.errors[0]).toMatch(/^rules\[0\]\.action\.suffix: must be a string/);
  });

  it("accepts settings without truncate rules (backward compatibility)", () => {
    const s = defaultSettings();
    expect(validateSettings(s).ok).toBe(true);
  });
});
