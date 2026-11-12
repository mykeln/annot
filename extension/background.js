importScripts("core.js");

// Serialize read-modify-write operations so simultaneous tabs cannot drop notes.
let queue = Promise.resolve();
async function mutate(message, sender) {
  const { projects = [], annotations = [] } = await chrome.storage.local.get(["projects", "annotations"]);
  if (message.type === "saveProject") {
    const project = AnnotCore.validateProject(message.project);
    const existing = projects.find((item) => item.id === project.id);
    const next = existing ? projects.map((item) => item.id === project.id ? project : item) : [...projects, project];
    await chrome.storage.local.set({ projects: next });
    return project;
  }
  if (message.type === "saveAnnotation") {
    const project = projects.find((item) => item.id === message.annotation.projectId);
    const note = message.annotation;
    if (!project || !AnnotCore.mapURL(note.url, project) || new URL(note.url).origin !== new URL(sender.tab.url).origin) {
      throw new Error("This page does not match the selected project's deployed base URL.");
    }
    if (!String(note.note || "").trim()) throw new Error("Write a change request first.");
    const annotation = { ...note, note: String(note.note).trim().slice(0, 10000), id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    await chrome.storage.local.set({ annotations: [...annotations, annotation] });
    return annotation;
  }
  if (message.type === "deleteAnnotation") {
    await chrome.storage.local.set({ annotations: annotations.filter((note) => note.id !== message.id) });
    return true;
  }
  if (message.type === "stop") {
    await chrome.storage.session.remove(`tab:${sender.tab.id}`);
    return true;
  }
  if (message.type === "openPrivacy") {
    await chrome.tabs.create({ url: chrome.runtime.getURL("privacy.html") });
    return true;
  }
  throw new Error("Unknown Annot operation.");
}

chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (sender.id !== chrome.runtime.id || !sender.tab || !["saveProject", "saveAnnotation", "deleteAnnotation", "stop", "openPrivacy"].includes(message.type)) return;
  const operation = queue.then(() => mutate(message, sender));
  queue = operation.catch(() => {});
  operation.then((data) => respond({ ok: true, data }), (error) => respond({ ok: false, error: error.message }));
  return true;
});

async function inject(tabId) {
  await chrome.scripting.executeScript({ target: { tabId }, files: ["core.js", "content.js"] });
}

chrome.action.onClicked.addListener(async (tab) => {
  try {
    if (!/^https?:/.test(tab.url || "")) throw new Error("Annot works on HTTP and HTTPS pages.");
    await chrome.storage.session.set({ [`tab:${tab.id}`]: new URL(tab.url).origin });
    await inject(tab.id);
    await chrome.action.setBadgeText({ tabId: tab.id, text: "" });
    await chrome.action.setTitle({ tabId: tab.id, title: "Open Annot on this page" });
  } catch (error) {
    await chrome.action.setBadgeText({ tabId: tab.id, text: "!" });
    await chrome.action.setTitle({ tabId: tab.id, title: error.message });
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, change, tab) => {
  if (change.status !== "complete") return;
  const key = `tab:${tabId}`;
  const state = await chrome.storage.session.get(key);
  if (!state[key]) return;
  if (!tab.url || new URL(tab.url).origin !== state[key]) {
    await chrome.storage.session.remove(key);
    return;
  }
  try { await inject(tabId); } catch { /* activeTab access ends when the tab changes origin. */ }
});

chrome.tabs.onRemoved.addListener((tabId) => { void chrome.storage.session.remove(`tab:${tabId}`); });
