# Smart URL Copy

Browser extension for Chrome and Brave (Manifest V3). One click on the toolbar icon copies the current page title and URL, after your rules transform them, rendered through a template, to the clipboard.

[Privacy policy](PRIVACY.md) · [Changelog](CHANGELOG.md) · [Security and support](SECURITY.md)

## Requirements

- Node.js LTS
- npm

## Build

```sh
npm install
npm run build
```

Output goes to `dist/`. `npm run build` type-checks first and fails on type errors.

Run tests with `npm test`.

## Install from the Chrome Web Store

The store listing is pending. Once published, the store link goes here. Until then, use one of the methods below.

## Install from a release

1. Open the [Releases](../../releases) page and download `smart-url-copy-vX.Y.Z.zip` from the latest release.
2. Unzip it into a folder. Keep the folder: Chrome and Brave load the extension from it.
3. Open `chrome://extensions` (or `brave://extensions`).
4. Enable **Developer mode** (top right).
5. Click **Load unpacked** and select the unzipped folder.

To update, download the new zip, replace the folder contents, then click the reload icon on the Smart URL Copy card.

## Install in Chrome

1. Run the build (see above).
2. Open `chrome://extensions`.
3. Enable **Developer mode** (top right).
4. Click **Load unpacked** and select the `dist/` folder.

## Install in Brave

1. Run the build (see above).
2. Open `brave://extensions`.
3. Enable **Developer mode** (top right).
4. Click **Load unpacked** and select the `dist/` folder.

## Update

1. Pull the new source and run `npm install` and `npm run build`.
2. Open the extensions page (`chrome://extensions` or `brave://extensions`).
3. Click the reload icon on the Smart URL Copy card.

Your settings stay in browser storage across updates.

## Usage

- **Click the toolbar icon:** copies the active template to the clipboard as `text/plain` and `text/html`, both with the same text.
- **Icon states:** the icon turns green with a check when the copy succeeds, and red when it fails. It returns to the default icon after 1 second on success and about 1.5 seconds on failure. On failure, the tooltip shows the reason for the same 1.5 seconds, so hover the icon right after clicking.
- **Options:** right-click the toolbar icon and choose **Options**. The options page has three sections:
  - **Rules:** change the title or URL. Rules run in list order. Each rule can be enabled or disabled, and can apply only to pages whose URL matches a regex.
  - **Templates:** define output formats. One template is active and used by the icon.
  - **Import and export:** save all settings to a JSON file, or replace all settings from one. Import validates the file first and changes nothing when it is invalid.

### Templates

Placeholders: `{{ title }}` and `{{ url }}`. Output is not escaped.

- Markdown (active by default): `[{{ title }}]({{ url }})`
- HTML: `<a href="{{ url }}">{{ title }}</a>`

### Rule examples

- **Trim title:** target `title`, action *Trim*.
- **Remove site suffix:** target `title`, action *Regex replace*, pattern ` - Example$`, replacement empty.
- **Remove `utm_source` parameter:** target `url`, action *Remove query parameter*, name `utm_source`.
- **Remove a group of parameters:** target `url`, action *Remove query parameter*, name `utm_.*`, with *Name is a regex* checked. The regex must match the whole parameter name. Use `.*` to remove all query parameters.
- **Blog URL to site root:** target `url`, action *Regex replace*, page URL pattern `^https://example\.com/blog/`, pattern `^(https://[^/]+)/blog/.*$`, replacement `{{ 1 }}/`. `{{ 1 }}` is the first capture group, and `{{ 0 }}` is the whole match.

If a URL rule produces an invalid URL, the previous value is kept and a warning is shown.

A ready-made example is in [examples/settings.example.json](examples/settings.example.json). Import it on the options page to try it.

## Troubleshooting

- **Restricted pages** (`chrome://`, the Chrome Web Store, some PDF viewers): the extension cannot run scripts on these pages. It falls back to copying through a hidden offscreen document. If the fallback also fails, the icon turns red and the tooltip names the reason.
- **Red icon:** the copy failed. Read the tooltip right after clicking, because it resets after about 1.5 seconds.
- **Changes do not show in the copy:** check that the rule is enabled and that its page URL pattern matches the page. Check that the template is the active one.
- **Invalid stored settings:** the extension falls back to the default template and no rules. Re-import a valid settings file to restore your setup.

## License

MIT. See [LICENSE](LICENSE).
