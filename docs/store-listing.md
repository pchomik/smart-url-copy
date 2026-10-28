# Chrome Web Store listing copy: Smart URL Copy

Paste these fields into the store dashboard. Keep the text in sync with the manifest and README.

## Name

Smart URL Copy

## Summary (99 of 132 characters)

Copy the page title and URL in your own format, such as a Markdown link. Rules can edit them first.

## Detailed description

Smart URL Copy copies the title and URL of the current page to your clipboard in a format you define. Click the toolbar icon, and the link is ready to paste.

Default output is a Markdown link:

```
[Page title](https://example.com/page)
```

Clipboard output has both `text/plain` and `text/html` with the same text, so it pastes as plain text in editors and as a link in rich text apps.

**Rules**

Rules edit the title or URL before they are rendered. Rules run in list order.

- Trim whitespace from the title.
- Remove a site name suffix with a regex replace.
- Remove query parameters such as `utm_source`, or a group of them with a regex such as `utm_.*`.
- Rewrite URLs with a regex, for example to turn a blog post URL into the site root.
- Turn each rule on or off, and limit it to pages whose URL matches a regex.

If a URL rule produces an invalid URL, the previous value is kept and a warning is shown.

**Templates**

Templates define the output. Use `{{ title }}` and `{{ url }}` as placeholders. Markdown and HTML templates are included. Choose the active template on the options page.

**Import and export**

Save all rules and templates to a JSON file, or restore them from one. An invalid file is rejected and changes nothing.

**Restricted pages**

On pages where extensions cannot run scripts, such as `chrome://` pages and some PDF viewers, the extension copies through a hidden offscreen document.

**Privacy**

Smart URL Copy does not collect personal data. It makes no network requests and does not transmit, sell, or share data. It reads the title and URL of a tab only when you click the icon. Your rules and templates stay in `chrome.storage.local` on your device. Full policy: https://github.com/pchomik/smart-url-copy/blob/main/PRIVACY.md

**Support**

Report a problem or ask a question at https://github.com/pchomik/smart-url-copy/issues. Do not include personal URLs or exported settings in reports.

## Category

Productivity

## Language

English

## Single-purpose statement

Copies the current page title and URL in a user-defined format.

## Support and policy URLs

- Support URL: https://github.com/pchomik/smart-url-copy/issues
- Privacy policy URL: https://github.com/pchomik/smart-url-copy/blob/main/PRIVACY.md
- Homepage URL: https://github.com/pchomik/smart-url-copy
