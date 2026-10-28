# Chrome Web Store privacy practices: Smart URL Copy

Paste these fields into the dashboard "Privacy practices" tab. Keep the text in sync with `PRIVACY.md` and `docs/store-listing.md`.

## Permission justifications

**activeTab**

Reads the title and URL of the tab the user clicks on the toolbar icon. Used only at that moment.

**scripting**

Not used. The code never calls `chrome.scripting`. Remove `scripting` from `public/manifest.json` before upload. No justification is needed once removed.

**offscreen**

Hosts a hidden extension document that writes to the clipboard on pages where the copy cannot run, such as `chrome://` pages and some PDF viewers.

**clipboardWrite**

Writes the rendered text, with the same content as `text/plain` and `text/html`, to the clipboard.

**storage**

Saves the user's rules, templates, and active template locally in `chrome.storage.local`.

## Data usage declaration

- Personal or sensitive user data collected: none.
- Data sold or transferred to third parties: none.
- Data used for purposes other than the single purpose: none.
- Data used for creditworthiness or lending: none.
- Remote code: none. The extension makes no network requests.

Certify the policy after the declarations above match the uploaded build.

## Single-purpose statement

Copies the current page title and URL in a user-defined format.
