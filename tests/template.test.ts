import { describe, expect, it } from "vitest";
import { renderTemplate } from "../src/core/template";

describe("renderTemplate", () => {
  it("fills title and url, with or without spaces, and does not escape", () => {
    const out = renderTemplate('<a href="{{url}}">{{ title }}</a> {{ url }}', {
      title: 'A & "B"',
      url: "https://a.com/?x=1&y=2",
    });
    expect(out).toBe('<a href="https://a.com/?x=1&y=2">A & "B"</a> https://a.com/?x=1&y=2');
  });

  it("keeps $ sequences in values literal", () => {
    expect(renderTemplate("{{ title }}", { title: "$& $1", url: "" })).toBe("$& $1");
  });
});
