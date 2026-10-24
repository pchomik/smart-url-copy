import type { Settings } from "./model";

// Function, not constant: callers get a fresh object they can mutate.
export function defaultSettings(): Settings {
  return {
    version: 1,
    rules: [],
    templates: [{ id: "markdown", name: "Markdown link", body: "[{{ title }}]({{ url }})" }],
    activeTemplateId: "markdown",
  };
}
