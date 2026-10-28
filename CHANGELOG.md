# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.0]

First public release.

### Added

- One-click copy of the page title and URL to the clipboard as `text/plain` and `text/html`.
- Templates with `{{ title }}` and `{{ url }}` placeholders. Markdown is the default.
- Rules that edit the title or URL: trim, regex replace, and remove query parameters, with optional page URL patterns.
- Options page with Rules, Templates, and Import and export sections.
- Import validates the settings file and changes nothing when it is invalid.
- Icon states for success, failure, and warnings.
- Fallback copy through a hidden offscreen document on restricted pages.

### Changed

- Removed the `<all_urls>` host permission. The extension uses `activeTab` instead.

## [0.1.0]

Initial development release. Not published to the Chrome Web Store.
