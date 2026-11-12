# Annot

Browse a live website, select elements, and describe what should change. Annot collects those requests into one prompt you can paste into a local or remote coding session, with enough project context to find and change the corresponding source.

This first version is a Chromium Manifest V3 extension. No runtime dependencies, build step, account, backend, or model API key are required.

## Try it

1. Open `chrome://extensions` and enable **Developer mode**.
2. Choose **Load unpacked** and select this repository’s `extension` directory.
3. Visit your website and click Annot in the extensions toolbar.
4. Create a project: name, checkout path, deployed base URL, and development base URL.
5. Choose **Select an element**, click something on the page, and describe the change. Choose whether it applies to this route or the shared component everywhere.
6. Browse to other pages and repeat. Open **Prompt** to review, copy, or download the combined request, then paste it into your coding session.

Use `npm run demo` to try a small fixture site at `http://127.0.0.1:4173`. The extension itself works without installing npm dependencies.

## How the translation works

A project is an explicit connection between a deployed site and a checkout, for example:

| Setting | Example |
| --- | --- |
| Checkout on the coding session’s machine | `/work/my-site` |
| Deployed base | `https://example.com/docs` |
| Development base | `http://localhost:3000` |
| Observed page | `https://example.com/docs/pricing?plan=team#compare` |
| Translated page | `http://localhost:3000/pricing?plan=team#compare` |

Paths are matched at segment boundaries. A mapping for `/docs` does not match `/docs-old`. Origin, including scheme and port, must match. Queries and fragments are retained.

For a remote coding session, enter the checkout path and development URL that make sense on the remote machine. Annot does not connect to that machine; it includes this context in the exported prompt.

Annotations contain the observed URL and title, a CSS selector, selected and nearby text, useful attributes, element bounds, a few computed styles, viewport dimensions, a timestamp, and your requested scope. Form values are excluded from element text and attributes. Page content and URLs may still contain information you should review before sharing.

Source hints are optional route-prefix mappings, one per line:

```text
/pricing = src/pages/Pricing.tsx
/ = src/components/Header.tsx
```

A deployed DOM cannot generally tell us which source file rendered it. Hints and selectors are evidence, not verified source mappings. The prompt asks the coding agent to inspect repository instructions, locate the owning routes and components, account for deployment drift, apply shared changes consistently, and validate the result. It also distinguishes your requests from captured, untrusted page content.

## Current boundaries

- Selects elements in the main document. Iframes and shadow-root contents are not supported.
- Project profiles and saved notes persist in `chrome.storage.local`. Unsaved drafts do not survive a full navigation. Removing the extension removes its stored data.
- Access starts with a toolbar click and continues across same-origin navigation in that tab. Crossing to another origin requires opening Annot again. Closing Annot stops automatic reinjection. This uses Chrome’s [activeTab permission model](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab).
- Browser-internal pages and extension-store pages cannot be annotated.
- Notes include DOM evidence rather than screenshots. There is no repository scanning, source-map resolution, live preview of edits, direct CLI delivery, or automatic deployment.
- Editing a project updates the mapping used for its existing notes. A note outside the revised base exports with a null development URL that the coding agent must resolve.
- Saved notes can be removed and recreated. Prompt export leaves them in place.

## Development and verification

Use Node 22 or newer. Install test dependencies and run the browser E2E test:

```sh
npm ci
PLAYWRIGHT_BROWSERS_PATH=/private/tmp/annot-browsers npx playwright install chromium
PLAYWRIGHT_BROWSERS_PATH=/private/tmp/annot-browsers npm run test:browser
```

`npm test` runs the same E2E suite. The browser test follows Playwright’s [extension-testing approach](https://playwright.dev/docs/chrome-extensions). It launches the real worker and content scripts with a temporary extension copy that grants access only to the local fixture origin, because the test driver cannot click the native browser toolbar. The shipped extension has no persistent host permissions.

The test covers configuration, element selection without navigation, cross-page persistence, scope, URL translation, source hints, prompt export, form-value exclusion, project isolation, note removal, narrow layouts, and closing the workspace. It produces screenshots, an actual prompt download, and a `verification.json` report under `test-results/`, including coverage limits and the exact reproduction command. It does not exercise an external production site, source checkout edits, or a live coding session.

Implementation:

- `extension/background.js`: browser activation, reinjection, and serialized storage mutations.
- `extension/content.js`: selection overlay, element evidence, project editor, annotations, and export.
- `extension/core.js`: project validation, URL translation, source hints, and prompt compilation.
- `demo/`: local fixture site.
- `tests/browser/`: browser E2E verification.
