// No escaping: the template author controls the output format.
export function renderTemplate(body: string, vars: { title: string; url: string }): string {
  return body.replace(/\{\{\s*(title|url)\s*\}\}/g, (_, name: "title" | "url") => vars[name]);
}
