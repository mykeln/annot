(() => {
  if (globalThis.__annot) { globalThis.__annot.show(); return; }
  const { clean, mapURL, compilePrompt } = AnnotCore;
  const host = document.createElement("annot-workspace");
  host.style.cssText = "all:initial!important;position:fixed!important;inset:0!important;z-index:2147483647!important;pointer-events:none!important;color-scheme:light!important";
  const root = host.attachShadow({ mode: "open" });
  root.innerHTML = `
    <style>
      :host { font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; color:#25282c; }
      * { box-sizing:border-box; } button,input,textarea,select { font:inherit; }
      button { cursor:pointer; } button:focus-visible,input:focus-visible,textarea:focus-visible,select:focus-visible { outline:3px solid #8173e8; outline-offset:2px; }
      .panel { pointer-events:auto; position:absolute; right:16px; top:16px; bottom:16px; width:370px; max-width:calc(100vw - 32px); background:#faf9f6; border:1px solid #d9d6cf; border-radius:18px; box-shadow:0 16px 65px #17172530; display:flex; flex-direction:column; overflow:hidden; }
      .panel,.pickingbar { font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; color:#25282c; }
      main > select { margin-bottom:18px; }
      header { padding:20px 20px 15px; border-bottom:1px solid #e5e2db; display:flex; gap:12px; align-items:center; }
      .logo { display:grid; place-items:center; width:35px; height:35px; border-radius:11px; background:#292638; color:#e3dcff; font-size:24px; }
      h1 { margin:0; font-size:18px; letter-spacing:-.7px; } .sub { color:#7c7974; font-size:11px; letter-spacing:.05em; }
      .close { margin-left:auto; border:0; background:none; font-size:22px; color:#777; padding:5px; }
      nav { display:flex; padding:12px 16px 0; gap:5px; } nav button { flex:1; border:0; border-radius:8px; padding:8px; color:#77716d; background:transparent; font-size:12px; font-weight:600; } nav button.active { background:#eae5f8; color:#514083; }
      main { padding:18px 20px; overflow:auto; flex:1; min-height:0; } footer { padding:12px 20px; border-top:1px solid #e5e2db; font-size:11px; color:#817c76; }
      .eyebrow { font-size:10px; letter-spacing:.12em; color:#8b837a; text-transform:uppercase; font-weight:700; margin:0 0 9px; } h2 { font-size:23px; line-height:1.2; letter-spacing:-.7px; margin:0 0 12px; }
      p { margin:0 0 16px; } .muted { color:#77716b; font-size:12px; } .primary { background:#302a43; border:1px solid #302a43; color:white; border-radius:9px; padding:11px 14px; width:100%; font-weight:600; }
      .primary.picking { background:#65508e; } .secondary { background:white; border:1px solid #d9d5ce; color:#40384f; border-radius:8px; padding:8px 12px; } .row { display:flex; gap:8px; align-items:center; margin:10px 0; } .row > * { min-width:0; } .row .grow { flex:1; }
      label { display:block; font-size:12px; font-weight:600; margin:15px 0 6px; } input,textarea,select { width:100%; border:1px solid #d9d5ce; border-radius:8px; background:white; padding:10px; color:#25282c; } textarea { resize:vertical; min-height:100px; line-height:1.5; } .mono { font-family:ui-monospace,monospace; font-size:11px; }
      .card { background:white; border:1px solid #e3dfd7; border-radius:11px; padding:13px; margin:12px 0; } .card p { margin:8px 0; font-size:13px; white-space:pre-wrap; overflow-wrap:anywhere; } .path { color:#898078; font-size:11px; overflow-wrap:anywhere; } .tag { display:inline-block; background:#efecf8; border-radius:5px; padding:2px 6px; color:#645080; font-size:10px; } .remove { border:0; background:none; color:#8b7676; font-size:11px; padding:4px; margin-left:auto; }
      .empty { margin:28px 0; padding:24px 10px; border:1px dashed #d4cec4; border-radius:12px; text-align:center; } .empty span { display:block; font-size:26px; color:#86709d; margin-bottom:10px; } .empty p { margin:0; }
      .highlight { position:fixed; pointer-events:none; border:2px solid #8a65d3; background:#a17bda20; border-radius:3px; display:none; }
      #status { margin:0; padding:0 20px; font-size:12px; color:#65508e; overflow-wrap:anywhere; } #status:not(:empty) { padding-bottom:12px; } #status.error { color:#b23e36; }
      .pickingbar { display:none; pointer-events:auto; position:absolute; bottom:20px; left:20px; align-items:center; gap:15px; padding:12px 18px; background:#302a43; color:white; border-radius:12px; box-shadow:0 5px 30px #0003; font-size:13px; }
      .prompt { height:300px; font-size:11px; } .hint { font-size:11px; color:#817971; margin:5px 0 12px; } .saved { font-size:11px; color:#6d7257; }
      .prompt + button { margin-top:10px; } .prompt + button + button { margin-top:8px; }
      @media(max-width:480px) { .panel { top:8px; right:8px; bottom:8px; max-width:calc(100vw - 16px); width:320px; } }
    </style>
    <div class="highlight"></div>
    <div class="pickingbar"><span>⌖ Click an element to annotate · Esc to cancel</span><button class="secondary" id="cancel-picking">Cancel</button></div>
    <aside class="panel" aria-label="Annot workspace">
      <header><div class="logo" aria-hidden="true">⌖</div><div><h1>annot</h1><div class="sub">SITE TO SOURCE</div></div><button class="close" aria-label="Close Annot">×</button></header>
      <nav aria-label="Workspace"><button data-view="notes">Annotations</button><button data-view="project">Project</button><button data-view="prompt">Prompt</button></nav>
      <main></main><p id="status" role="status" aria-live="polite"></p><footer>Saved in this browser · Export when you’re ready</footer>
    </aside>`;
  document.documentElement.append(host);
  const main = root.querySelector("main");
  const highlight = root.querySelector(".highlight");
  const controller = new AbortController();
  const signal = controller.signal;
  let projects = [], annotations = [], projectId, view = "notes", picking = false, selected = null, hovered = null, draft = "", draftScope = "page";

  function status(message = "", error = false) {
    root.querySelector("#status").textContent = message;
    root.querySelector("#status").classList.toggle("error", error);
  }
  async function request(type, fields = {}) {
    const response = await chrome.runtime.sendMessage({ type, ...fields });
    if (!response?.ok) throw new Error(response?.error || "Reload this page and reopen Annot.");
    return response.data;
  }
  async function load() {
    ({ projects = [], annotations = [] } = await chrome.storage.local.get(["projects", "annotations"]));
    if (!projects.some((project) => project.id === projectId)) {
      projectId = [...projects].sort((a, b) => b.liveBase.length - a.liveBase.length).find((project) => mapURL(location.href, project))?.id || projects[0]?.id;
    }
  }
  const project = () => projects.find((item) => item.id === projectId);
  const notes = () => annotations.filter((item) => item.projectId === projectId);
  function el(tag, text, className) {
    const node = document.createElement(tag);
    if (text != null) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function button(text, className, action) {
    const node = el("button", text, className);
    node.type = "button";
    node.addEventListener("click", () => Promise.resolve().then(action).catch((error) => status(error.message, true)));
    return node;
  }
  function field(parent, title, value = "", { textarea = false, placeholder = "", type = "text" } = {}) {
    const id = `annot-${crypto.randomUUID()}`;
    const label = el("label", title); label.htmlFor = id;
    const input = el(textarea ? "textarea" : "input");
    input.id = id; input.value = value; input.placeholder = placeholder;
    if (!textarea) input.type = type;
    parent.append(label, input);
    return input;
  }
  function setPicking(value) {
    picking = value; hovered = null; highlight.style.display = "none";
    root.querySelector(".panel").style.display = value ? "none" : "flex";
    root.querySelector(".pickingbar").style.display = value ? "flex" : "none";
  }
  function render() {
    root.querySelectorAll("nav button").forEach((node) => node.classList.toggle("active", node.dataset.view === view));
    main.replaceChildren(); status();
    if (view === "project") return renderProject();
    if (!project()) {
      main.append(el("p", "A little context first", "eyebrow"), el("h2", "Connect this site to your code."), el("p", "Set the deployed URL, development URL, and checkout path once. Your notes will carry that context into every prompt.", "muted"), button("Set up project →", "primary", () => { view = "project"; render(); }));
      return;
    }
    const selector = el("select"); selector.setAttribute("aria-label", "Project");
    projects.forEach((item) => { const option = el("option", item.name); option.value = item.id; selector.append(option); });
    selector.value = projectId;
    selector.addEventListener("change", () => { projectId = selector.value; selected = null; setPicking(false); render(); });
    main.append(selector);
    if (view === "prompt") return renderPrompt();
    main.append(el("p", `${notes().length} saved change${notes().length === 1 ? "" : "s"}`, "eyebrow"));
    main.append(el("h2", selected ? "What should change?" : "Point. Note. Build."));
    if (!mapURL(location.href, project())) main.append(el("p", "This page is outside the project’s deployed base URL. Switch projects or update its mapping before selecting.", "muted"));
    const pick = button(picking ? "Selecting… press Esc to browse" : "⌖  Select an element", `primary${picking ? " picking" : ""}`, () => {
      if (!mapURL(location.href, project())) throw new Error("This page does not match this project’s deployed base URL.");
      setPicking(!picking); render();
    });
    main.append(pick);
    if (selected) renderEditor();
    else main.append(el("p", "Browse normally between selections. Selecting an element blocks its click so you can annotate links and buttons safely.", "hint"));
    if (!notes().length && !selected) {
      const empty = el("div", null, "empty"); empty.append(el("span", "↗"), el("p", "Your next change starts on the page."), el("p", "Choose an element and leave a note.", "muted")); main.append(empty);
    }
    notes().forEach((note, index) => {
      const card = el("article", null, "card");
      const row = el("div", null, "row");
      row.append(el("span", `${String(index + 1).padStart(2, "0")} · ${note.scope}`, "tag"), button("Remove", "remove", async () => {
        await request("deleteAnnotation", { id: note.id }); await load(); render();
      }));
      card.append(row, el("p", note.note), el("div", note.element.selector, "mono"), el("div", new URL(note.url).pathname, "path"));
      main.append(card);
    });
    if (notes().length) main.append(button("Review prompt →", "secondary", async () => { await load(); view = "prompt"; render(); }));
  }

  function renderEditor() {
    const card = el("div", null, "card");
    card.append(el("div", selected.element.selector, "mono"), el("p", selected.element.text || selected.element.tag, "muted"));
    const note = field(card, "Change request", draft, { textarea: true, placeholder: "e.g. Make this CTA shorter and use the same treatment throughout the site." });
    note.addEventListener("input", () => { draft = note.value; });
    const label = el("label", "Apply to"); label.htmlFor = "annot-scope";
    const scope = el("select"); scope.id = "annot-scope";
    [["page", "This route only"], ["shared", "The shared component everywhere"]].forEach(([value, text]) => { const option = el("option", text); option.value = value; scope.append(option); });
    scope.value = draftScope;
    scope.addEventListener("change", () => { draftScope = scope.value; });
    card.append(label, scope);
    const row = el("div", null, "row");
    row.append(button("Save annotation", "primary", async () => {
      if (!note.value.trim()) throw new Error("Describe the change you want.");
      await request("saveAnnotation", { annotation: { ...selected, projectId, note: note.value, scope: scope.value } });
      selected = null; draft = ""; draftScope = "page"; await load(); render(); status("Annotation saved.");
    }), button("Cancel", "secondary", () => { selected = null; render(); }));
    card.append(row); main.append(card); note.focus();
  }

  function renderProject() {
    const current = project();
    main.append(el("p", "Project context", "eyebrow"), el("h2", "From live site to local source."));
    const form = el("form");
    const name = field(form, "Project name", current?.name, { placeholder: "My website" });
    const repo = field(form, "Checkout path on the coding session’s machine", current?.repo, { placeholder: "/Users/me/Development/my-site" });
    const live = field(form, "Deployed base URL", current?.liveBase || location.origin, { type: "url", placeholder: "https://example.com" });
    const local = field(form, "Development base URL", current?.localBase || "http://localhost:3000", { type: "url" });
    form.append(el("p", "Path prefixes are supported: example.com/docs → localhost:3000. Query strings and fragments are preserved.", "hint"));
    const hints = field(form, "Source hints (optional, one per line)", current?.hints, { textarea: true, placeholder: "/pricing = src/pages/Pricing.tsx\n/ = src/components/Header.tsx" });
    hints.classList.add("mono");
    form.append(el("p", "Hints match deployed route prefixes. They help locate source; Codex still verifies them. For remote sessions, use the checkout and development URL on that machine.", "hint"));
    const save = button(current ? "Save project" : "Create project", "primary", async () => {
      const saved = await request("saveProject", { project: { id: current?.id, name: name.value, repo: repo.value, liveBase: live.value, localBase: local.value, hints: hints.value } });
      projectId = saved.id; selected = null; await load(); view = "notes"; render(); status("Project mapping saved.");
    });
    form.append(save);
    form.addEventListener("submit", (event) => { event.preventDefault(); save.click(); });
    main.append(form);
    if (current) main.append(button("+ Add another project", "secondary", () => { projectId = undefined; renderProjectNew(); }));
  }
  function renderProjectNew() { main.replaceChildren(); renderProject(); }

  function renderPrompt() {
    main.append(el("p", "Ready for your coding session", "eyebrow"), el("h2", "One prompt. All the context."));
    const prompt = compilePrompt(project(), notes());
    if (!prompt) { main.append(el("p", "Add an annotation first, then return here to copy the prompt.", "muted")); return; }
    const output = el("textarea", null, "mono prompt"); output.readOnly = true; output.value = prompt; output.setAttribute("aria-label", "Compiled coding prompt");
    main.append(el("p", "Includes URL translations, element evidence, requested scope, and instructions to verify the source before editing.", "muted"), output);
    main.append(button("Copy prompt", "primary", async () => {
      await load(); output.value = compilePrompt(project(), notes());
      try { await navigator.clipboard.writeText(output.value); status("Copied. Paste it into your local or remote coding session."); }
      catch { output.focus(); output.select(); status("Clipboard unavailable here. The prompt is selected; press ⌘C / Ctrl+C."); }
    }));
    main.append(button("Download prompt (.txt)", "secondary", () => {
      const url = URL.createObjectURL(new Blob([output.value], { type: "text/plain;charset=utf-8" }));
      const link = el("a"); link.href = url; link.download = "annot-prompt.txt"; root.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    }));
    main.append(el("p", "Review the captured content before sharing. Notes persist after export so you can keep working.", "hint"));
  }

  function selectorFor(element) {
    const unique = (selector) => document.querySelectorAll(selector).length === 1;
    if (element.id) { const selector = `#${CSS.escape(element.id)}`; if (unique(selector)) return selector; }
    for (const attr of ["data-testid", "data-test", "data-cy", "aria-label"]) {
      const value = element.getAttribute(attr);
      if (value) { const selector = `[${attr}="${CSS.escape(value)}"]`; if (unique(selector)) return selector; }
    }
    const parts = [];
    for (let node = element; node?.nodeType === 1; node = node.parentElement) {
      let part = node.localName;
      if (node.id) part = `#${CSS.escape(node.id)}`;
      else if (node.parentElement) {
        const peers = [...node.parentElement.children].filter((child) => child.localName === node.localName);
        if (peers.length > 1) part += `:nth-of-type(${peers.indexOf(node) + 1})`;
      }
      parts.unshift(part);
      if (unique(parts.join(" > "))) return parts.join(" > ");
    }
    return parts.join(" > ");
  }
  function visibleText(element) {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let text = "", node;
    while ((node = walker.nextNode()) && text.length < 600) {
      if (!node.parentElement.closest("input,textarea,select,script,style,[contenteditable]")) text += ` ${node.textContent}`;
    }
    return clean(text, 500);
  }
  function capture(element) {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    const attributes = {};
    for (const attr of ["id", "class", "role", "aria-label", "data-testid", "data-test", "data-cy", "href", "src", "alt", "type"]) {
      if (element.hasAttribute(attr)) attributes[attr] = clean(element.getAttribute(attr), 500);
    }
    return {
      url: location.href, title: document.title,
      viewport: { width: innerWidth, height: innerHeight, devicePixelRatio },
      element: {
        selector: selectorFor(element), tag: element.localName, text: visibleText(element), attributes,
        parentText: element.parentElement ? visibleText(element.parentElement) : "",
        bounds: { x: Math.round(rect.x + scrollX), y: Math.round(rect.y + scrollY), width: Math.round(rect.width), height: Math.round(rect.height) },
        styles: Object.fromEntries(["color", "background-color", "font-family", "font-size", "font-weight", "display", "padding", "border-radius"].map((key) => [key, style.getPropertyValue(key)]))
      }
    };
  }
  function paint() {
    if (!picking || !hovered?.isConnected) { highlight.style.display = "none"; return; }
    const rect = hovered.getBoundingClientRect();
    Object.assign(highlight.style, { display: "block", left: `${rect.x}px`, top: `${rect.y}px`, width: `${rect.width}px`, height: `${rect.height}px` });
  }
  document.addEventListener("pointermove", (event) => {
    if (!picking || event.composedPath().includes(host)) return;
    hovered = event.composedPath()[0]; paint();
  }, { capture: true, signal });
  for (const type of ["pointerdown", "mousedown", "pointerup", "mouseup", "click", "dblclick", "auxclick", "contextmenu"]) {
    document.addEventListener(type, (event) => {
      if (!picking || event.composedPath().includes(host)) return;
      event.preventDefault(); event.stopImmediatePropagation();
      if (type !== "click") return;
      const element = event.composedPath()[0];
      if (!(element instanceof Element) || element.getRootNode() !== document || element.matches("iframe,frame")) {
        status("This version selects elements in the main document. Iframes and shadow roots need separate support.", true); return;
      }
      selected = capture(element); draft = ""; draftScope = "page"; setPicking(false); view = "notes"; render();
    }, { capture: true, signal });
  }
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && picking) { event.preventDefault(); setPicking(false); render(); }
  }, { capture: true, signal });
  window.addEventListener("scroll", paint, { capture: true, passive: true, signal });
  window.addEventListener("resize", paint, { passive: true, signal });
  root.querySelectorAll("nav button").forEach((node) => node.addEventListener("click", async () => {
    view = node.dataset.view; setPicking(false); await load(); render();
  }));
  root.querySelector("#cancel-picking").addEventListener("click", () => { setPicking(false); render(); });
  root.querySelector(".close").addEventListener("click", async () => {
    try { await request("stop"); } catch { /* still allow closing after an extension reload */ }
    controller.abort(); host.remove(); delete globalThis.__annot;
  });
  globalThis.__annot = { show: () => { host.hidden = false; } };
  load().then(render).catch((error) => status(error.message, true));
})();
