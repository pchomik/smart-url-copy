// Writes text/plain and text/html (same string) to the system clipboard.
// Uses execCommand: navigator.clipboard.write fails in offscreen documents (document not focused).
// Returns null on success, or an error message.
export function writeClipboard(text: string): string | null {
  const area = document.createElement("textarea");
  area.value = text;
  document.body.appendChild(area);
  area.select();
  const onCopy = (e: ClipboardEvent) => {
    e.preventDefault();
    e.clipboardData?.setData("text/plain", text);
    e.clipboardData?.setData("text/html", text);
  };
  document.addEventListener("copy", onCopy);
  try {
    if (document.execCommand("copy")) return null;
    // Facts for diagnosis: why the copy command was refused.
    return `execCommand copy returned false (focus=${document.hasFocus()}, activation=${navigator.userActivation?.isActive}, enabled=${document.queryCommandEnabled("copy")}, selected=${JSON.stringify(window.getSelection()?.toString())})`;
  } catch (e) {
    return (e as Error).message || String(e);
  } finally {
    document.removeEventListener("copy", onCopy);
    area.remove();
  }
}

const OFFSCREEN_PATH = "src/offscreen/offscreen.html";

// Copies from the extension origin, so the page never gets a clipboard permission prompt.
export async function copyText(text: string): Promise<string | null> {
  const url = chrome.runtime.getURL(OFFSCREEN_PATH);
  const existing = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
    documentUrls: [url],
  });
  if (existing.length === 0) {
    await chrome.offscreen.createDocument({
      url: OFFSCREEN_PATH,
      reasons: [chrome.offscreen.Reason.CLIPBOARD],
      justification: "Copy the rendered template to the clipboard",
    });
  }
  const res = (await chrome.runtime.sendMessage({ target: "offscreen", text })) as
    | string
    | null
    | undefined;
  return res ?? null;
}
