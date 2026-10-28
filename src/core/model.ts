export type Target = "title" | "url";

export interface Template {
  id: string;
  name: string;
  body: string; // placeholders: {{ title }}, {{ url }}
}

export type Action =
  | { kind: "regexReplace"; pattern: string; flags: string; replacement: string } // replacement may use {{ 0 }}, {{ 1 }}, ...
  | { kind: "removeQueryParam"; name: string; regex?: boolean } // URL only; regex: name is a whole-name regex
  | { kind: "trim" };

export interface Rule {
  id: string;
  name: string;
  enabled: boolean;
  pageUrlPattern: string; // regex on original page URL, "" = all pages
  target: Target;
  action: Action;
}

export interface Settings {
  version: 1;
  rules: Rule[]; // applied in order
  templates: Template[]; // at least one
  activeTemplateId: string; // used by icon click
}
