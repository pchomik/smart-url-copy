import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { defaultSettings } from "../src/core/defaults";
import { validateSettings } from "../src/core/validate";

describe("import validation", () => {
  it("accepts the example file", () => {
    const text = readFileSync("examples/settings.example.json", "utf8");
    expect(validateSettings(JSON.parse(text)).ok).toBe(true);
  });

  it("rejects bad regex and missing templates", () => {
    const bad = { ...defaultSettings(), templates: [] as unknown[], activeTemplateId: "x" };
    bad.rules = [{ id: "r", name: "R", enabled: true, pageUrlPattern: "", target: "title",
      action: { kind: "regexReplace", pattern: "(", flags: "", replacement: "" } }];
    const r = validateSettings(bad);
    if (r.ok) throw new Error("expected failure");
    expect(r.errors).toContain("templates: at least one template required");
    expect(r.errors.some((e) => e.startsWith("rules[0].action.pattern: invalid regex"))).toBe(true);
  });
});
