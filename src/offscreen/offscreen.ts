// Offscreen clipboard writer. Runs every copy, so no page gets a permission prompt.
import { writeClipboard } from "../clipboard";

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.target !== "offscreen") return false;
  sendResponse(writeClipboard(msg.text as string));
  return true; // keep the channel open for the async response
});
