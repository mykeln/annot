# Project form missing on plain HTTP sites

The Project tab displayed its heading and then stopped before appending the form. The first input called `crypto.randomUUID()` to create its label ID. In the content script on a non-secure HTTP hostname, that API is undefined, so form construction threw. Localhost is a secure context and did not catch the failure in the original browser suite. See the [API secure-context requirement](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID).

The fix uses a workspace-local counter for DOM label IDs. Persisted project and annotation IDs still originate in the extension service worker. Navigation errors now appear in the workspace status rather than failing silently.

Browser reproduction and regression command:

```sh
PLAYWRIGHT_BROWSERS_PATH=/private/tmp/annot-browsers npm run test:browser -- project-http.spec.js
```

Before: project heading visible, project name field absent; the isolated content-script context reported `secureContext: false` and `randomUUID: undefined`. The screenshot and FAIL report are `project-http-before.png` and `project-http-before.json`.

After: the same plain HTTP context renders the form, saves a project, selects an element, saves and compiles an annotation, and creates a second project. The screenshot and PASS report are `project-http-after.png` and `project-http-after.json`. The report identifies the tested release ZIP and SHA-256. This is browser E2E coverage, using a temporary host grant for the local fixture; native toolbar activation is not simulated by the test.

The installed unpacked extension was also reloaded through Chrome and the Project fields were observed rendering on the user's original HTTP site. No projects or annotations were removed.
