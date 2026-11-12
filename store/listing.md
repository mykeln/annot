# Chrome Web Store listing

Publisher contact email: myke@halfcorp.co. Privacy policy: https://www.halfcorp.co/annot-privacy.html.

## Name

Annot — site to source

## Short description

Annotate live elements and copy a prompt grounded in your local project.

## Category and language

Developer Tools. English (United States).

## Detailed description

Turn website feedback into a coding prompt with the context your agent needs.

Browse a live website, select an element, and describe what should change. Annot collects your requests across pages, connects deployed URLs to your development environment, and compiles one prompt you can paste into a local or remote coding session.

HOW IT WORKS

1. Open Annot from the extension toolbar on the website you want to review.
2. Set up a project with your deployed URL, development URL, and checkout path.
3. Select an element and add a change request. Mark it for this route or for the shared component everywhere.
4. Keep browsing and collect more annotations.
5. Review and copy the combined prompt, or download it as a text file.

CONTEXT THAT TRAVELS WITH YOUR FEEDBACK

Each annotation includes the page URL, a translated development URL, a selector, selected and nearby text, useful element attributes, layout details, and viewport dimensions. Add optional source-file hints to help your coding agent locate the right route or component.

URL mappings support path prefixes and retain query strings and fragments. Remote coding sessions work too: enter the checkout path and development URL for that machine.

The prompt asks your agent to verify source ownership, follow repository conventions, account for differences between the deployment and checkout, and apply shared-component changes consistently. DOM selectors and source hints are evidence to verify, not guaranteed source-file matches.

LOCAL STORAGE, EXPLICIT EXPORT

No Annot account, model API key, or backend is required. Project profiles and saved notes stay in this browser. Annot does not automatically send annotations to any AI service. You choose when to copy or download the prompt and where to paste it. Review captured page content before sharing it.

CURRENT SCOPE

Annot selects elements in the main document. Iframes, shadow-root contents, and browser-internal pages are not supported. It exports a prompt; it does not edit your checkout, connect directly to a CLI session, or deploy changes. Unsaved drafts do not survive full-page navigation. Saved notes can be removed and recreated.

Annot is an independent tool and is not affiliated with or endorsed by OpenAI or Google.

## Single purpose

Capture user-selected website elements and requested changes, associate them with a project’s deployed-to-development URL mapping, and export a contextual prompt for a coding assistant.

## Permission justifications

- **activeTab:** Provides temporary access to the page where the user explicitly invokes Annot, so they can select elements and capture the context required for their annotation. It also allows the workspace to remain available during same-origin navigation in that tab.
- **scripting:** Injects Annot’s bundled selection overlay, workspace UI, and prompt-compilation code into the tab activated by the user. No remotely hosted code is loaded or executed.
- **storage:** Stores project profiles and saved annotations in chrome.storage.local, and tab activation state in chrome.storage.session, so annotations survive navigation and the workspace can be reopened.
- **Remote code:** No. All executable code is bundled in the extension ZIP.

## Data disclosures

The extension processes website content (selected and nearby text, element details, and user notes), visited-page URLs attached to annotations, and user selection activity. These are used only for the annotation and prompt-export purpose. They are stored locally and are not transmitted to the developer. Local-only processing must still be disclosed in the store’s data-handling fields; do not select a blanket claim that the extension does not handle user data.

Declared dashboard categories: **Personally identifiable information**, **Web history**, **User activity**, and **Website content**. Incidental personal information can be present in user-selected page content or user-entered notes and paths. The extension does not intentionally capture health information, financial/payment records, authentication information, personal communications, or location; such information may still appear in page content the user chooses to select and must be reviewed before export.

No data sale, advertising use, unrelated use, creditworthiness use, analytics, or automatic third-party transmission. No input values, cookies, passwords, or browser-history database access. The privacy policy explains that URLs and page content may still contain sensitive information.

## Reviewer instructions

No login or paid account is required. Open an ordinary HTTPS website and invoke Annot from the toolbar. Create a project using that site’s origin as the deployed base, http://localhost:3000 as the development base, and /work/example as the checkout path. A working local server or checkout is not required to review the extension, because it only prepares text.

Select a heading or link, enter a requested change, and save it. Browse to another page on the same origin and add another annotation. Open Prompt and verify that both changes, element context, and development URL mappings appear. Copy the prompt or download the text file. The Privacy button opens the bundled privacy policy. Remove an annotation to verify deletion, and close Annot to stop automatic reinjection on navigation.

The main-document selection limitation is intentional and disclosed in the listing. The only production permissions are activeTab, scripting, and storage; there are no persistent host permissions.

## Submission assets

- Upload package: `dist/annot-0.1.1.zip`
- Store icon: `store/assets/icon-128.png`
- Screenshots (1280 × 800): `store/assets/screenshot-select.png`, `store/assets/screenshot-annotations.png`, `store/assets/screenshot-prompt.png`
- Small promotional tile (440 × 280): `store/assets/promo-small.png`
- Optional marquee (1400 × 560): `store/assets/promo-marquee.png`
- Privacy policy source: `extension/privacy.html` (must also be hosted at a public URL)

References checked November 12, 2026: [publishing](https://developer.chrome.com/docs/webstore/publish), [images](https://developer.chrome.com/docs/webstore/images), [privacy fields](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy), [local data handling](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq).
