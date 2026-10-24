// Writes text/plain and text/html (same string) to the system clipboard.
// Self-contained on purpose: it is serialized into the page by chrome.scripting.executeScript.
// Returns null on success, or an error message.
export async function writeClipboard(text: string): Promise<string | null> {
  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/plain": new Blob([text], { type: "text/plain" }),
        "text/html": new Blob([text], { type: "text/html" }),
      }),
    ]);
    return null;
  } catch (e) {
    return (e as Error).message || String(e);
  }
}

const OFFSCREEN_PATH = "src/offscreen/offscreen.html";

// Fallback for pages that cannot be scripted (chrome://, Web Store, PDF viewer, injection errors).
async function copyViaOffscreen(text: string): Promise<string | null> {
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

// Returns null on success, or a reason message naming both methods that failed.
export async function copyText(tabId: number, text: string): Promise<string | null> {
  let injectError: string;
  try {
    const [res] = await chrome.scripting.executeScript({
      target: { tabId },
      func: writeClipboard,
      args: [text],
    });
    if (res?.result === null) return null;
    injectError = (res?.result as string | undefined) ?? "no result from page";
  } catch (e) {
    injectError = (e as Error).message;
  }

  try {
    const fallbackError = await copyViaOffscreen(text);
    return fallbackError === null ? null : `${fallbackError} (page: ${injectError})`;
  } catch (e) {
    return `${(e as Error).message} (page: ${injectError})`;
  }
}
