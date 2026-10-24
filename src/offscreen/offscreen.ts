// Offscreen clipboard writer. Used only when the injected copy fails.
import { writeClipboard } from "../clipboard";

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.target !== "offscreen") return false;
  writeClipboard(msg.text as string).then(sendResponse);
  return true; // keep the channel open for the async response
});
