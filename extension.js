"use strict";

// Themepane: a background and an accent per project, picked from the status bar and
// written to the window's settings (its .code-workspace or .vscode/settings.json).

const vscode = require("vscode");
const tint = require("./tint");
const revert = require("./revert");

// Frame colors, each with its linked accent. Order: Graphite (the default), colors
// in rainbow order, muted tints in rainbow order, then Obsidian.
const BACKGROUNDS = [
  { icon: "✏️", name: "Graphite", hex: "#313336", accent: "Cobalt" },
  { icon: "🎀", name: "Cameo", hex: "#603b46", accent: "Nacre" },
  { icon: "🍷", name: "Bordeaux", hex: "#5e2035", accent: "Rose" },
  { icon: "🏮", name: "Garnet", hex: "#71151d", accent: "Carmine" },
  { icon: "👞", name: "Cordovan", hex: "#4c1715", accent: "Bronze" },
  { icon: "🔥", name: "Ember", hex: "#6a2e1f", accent: "Coral" },
  { icon: "🌰", name: "Umber", hex: "#5c3510", accent: "Amber" },
  { icon: "🥃", name: "Cognac", hex: "#452501", accent: "Agave" },
  { icon: "🏜️", name: "Ochre", hex: "#5a4415", accent: "Citrine" },
  { icon: "👑", name: "Gilt", hex: "#534400", accent: "Citrine" },
  { icon: "🫒", name: "Olive", hex: "#434614", accent: "Pistachio" },
  { icon: "🧤", name: "Loden", hex: "#2c3112", accent: "Madder" },
  { icon: "🌿", name: "Moss", hex: "#2f4820", accent: "Pistachio" },
  { icon: "🌲", name: "Forest", hex: "#1f4a33", accent: "Jade" },
  { icon: "🐍", name: "Serpentine", hex: "#023427", accent: "Mauve" },
  { icon: "🗽", name: "Verdigris", hex: "#004a46", accent: "Glacier" },
  { icon: "🐳", name: "Lagoon", hex: "#004456", accent: "Celeste" },
  { icon: "🐋", name: "Fathom", hex: "#003140", accent: "Brass" },
  { icon: "🌊", name: "Ocean", hex: "#1b3f66", accent: "Cobalt" },
  { icon: "💠", name: "Sapphire", hex: "#143678", accent: "Periwinkle" },
  { icon: "🌌", name: "Midnight", hex: "#222f4f", accent: "Celeste" },
  { icon: "🔷", name: "Lapis", hex: "#132266", accent: "Champagne" },
  { icon: "🫐", name: "Indigo", hex: "#2f3572", accent: "Indigo" },
  { icon: "🔮", name: "Violet", hex: "#472a66", accent: "Lavender" },
  { icon: "🍇", name: "Damson", hex: "#361c4a", accent: "Opal" },
  { icon: "☂️", name: "Tyrian", hex: "#4f215c", accent: "Lilac" },
  { icon: "🍆", name: "Plum", hex: "#5a2452", accent: "Orchid" },
  { icon: "🌺", name: "Fuchsia", hex: "#641745", accent: "Peony" },
  { icon: "🥀", name: "Amaranth", hex: "#49122f", accent: "Laurel" },
  { icon: "🎻", name: "Rosewood", hex: "#4d3234", accent: "Rose" },
  { icon: "☕", name: "Espresso", hex: "#463326", accent: "Terracotta" },
  { icon: "🪵", name: "Driftwood", hex: "#443b32", accent: "Citrine" },
  { icon: "🧥", name: "Tweed", hex: "#3f422d", accent: "Peridot" },
  { icon: "🫖", name: "Celadon", hex: "#354437", accent: "Matcha" },
  { icon: "⛈️", name: "Storm", hex: "#2b4147", accent: "Cerulean" },
  { icon: "🪨", name: "Slate", hex: "#2e3a4d", accent: "Cobalt" },
  { icon: "🖋️", name: "Sumi", hex: "#212731", accent: "Pewter" },
  { icon: "🌃", name: "Dusk", hex: "#3c364d", accent: "Lavender" },
  { icon: "🌸", name: "Heather", hex: "#463845", accent: "Lilac" },
  { icon: "⚫", name: "Obsidian", hex: "#000000", accent: "Snow" },
];

// Removed presets, mapped to the one a workspace still wearing them moves to.
const RETIRED = {
  "#154a47": "#004a46", // Pine -> Verdigris
  "#393b3e": "#313336", // Graphite, darkened
};

// Accents in rainbow order, then neutral Snow. tint.js caps chroma, so custom picks stay soft.
const ACCENTS = [
  { icon: "🌹", name: "Rose", hex: "#a64257" },
  { icon: "🐚", name: "Nacre", hex: "#e8c1c3" },
  { icon: "🧶", name: "Madder", hex: "#91555a" },
  { icon: "💄", name: "Carmine", hex: "#ab413a" },
  { icon: "🦩", name: "Flamingo", hex: "#f8a59a" },
  { icon: "🪸", name: "Coral", hex: "#a7472f" },
  { icon: "🏺", name: "Terracotta", hex: "#9f5021" },
  { icon: "🥉", name: "Bronze", hex: "#885e41" },
  { icon: "🍑", name: "Peach", hex: "#f5ab77" },
  { icon: "🍯", name: "Amber", hex: "#915b00" },
  { icon: "🥂", name: "Champagne", hex: "#dacba8" },
  { icon: "🍋", name: "Citrine", hex: "#d9bb66" },
  { icon: "🎺", name: "Brass", hex: "#776837" },
  { icon: "🫛", name: "Peridot", hex: "#6b6f0e" },
  { icon: "🥑", name: "Pistachio", hex: "#adca7a" },
  { icon: "🪴", name: "Malachite", hex: "#3b7a2c" },
  { icon: "🍃", name: "Laurel", hex: "#577251" },
  { icon: "🍵", name: "Matcha", hex: "#95cf96" },
  { icon: "🍀", name: "Jade", hex: "#007e46" },
  { icon: "🌱", name: "Mint", hex: "#6fd5b0" },
  { icon: "🌵", name: "Agave", hex: "#abd7ca" },
  { icon: "🦜", name: "Viridian", hex: "#007b67" },
  { icon: "🧊", name: "Glacier", hex: "#65d2d2" },
  { icon: "🦚", name: "Teal", hex: "#007879" },
  { icon: "🐬", name: "Cerulean", hex: "#007493" },
  { icon: "🩵", name: "Celeste", hex: "#68ccf5" },
  { icon: "👖", name: "Chambray", hex: "#8fc3f5" },
  { icon: "🥄", name: "Pewter", hex: "#5c6b7a" },
  { icon: "🧿", name: "Cobalt", hex: "#1b6cb2" },
  { icon: "🦋", name: "Periwinkle", hex: "#a5bcf9" },
  { icon: "🫐", name: "Indigo", hex: "#545fb4" },
  { icon: "🫧", name: "Opal", hex: "#c6caea" },
  { icon: "🪻", name: "Lavender", hex: "#c3b0fd" },
  { icon: "🔮", name: "Violet", hex: "#7654a9" },
  { icon: "💜", name: "Lilac", hex: "#dba9e6" },
  { icon: "🌂", name: "Mauve", hex: "#7e5b7f" },
  { icon: "🪷", name: "Orchid", hex: "#92488d" },
  { icon: "🍒", name: "Cerise", hex: "#9f4474" },
  { icon: "🌷", name: "Peony", hex: "#e8a9c0" },
  { icon: "❄️", name: "Snow", hex: "#ffffff" },
];

const KNOBS = {
  background: { title: "Background", presets: BACKGROUNDS },
  accent: { title: "Accent", presets: ACCENTS },
};
const DEFAULT_BACKGROUND = BACKGROUNDS[0].hex;

// globalState / workspaceState keys.
const PENDING = "themepane.pickOnOpen";
const CULPRIT_STATE = "themepane.culprits";
const IGNORED = "themepane.ignoredConflict";

let ctx;
let status;
// Outside a saved workspace: the Themepane workspace for these folders ({ file, state })
// if it has colors, and whether its file exists at all.
let elsewhere = null;
let workspaceFound = false;
// Colors changed by something else ({ keys, culprit, sig }), and the last one warned about.
let conflict = null;
let notified = null;
// While a picker previews, conflicts keep their last state, so the status text stays put.
let picking = false;
const warnedCulprits = {};
// The status item's hover opens when a menu closes over it, so menus hide it; only a color
// pick brings it straight back, anything else after TIP_DELAY (the mouse has moved on).
let tipHidden = false;
let tipTimer;
const TIP_DELAY = 3000;

const config = (section) => vscode.workspace.getConfiguration(section);

function presetOf(knob, hex) {
  return KNOBS[knob].presets.find((p) => p.hex === hex);
}

// The accent a preset background comes with; a custom background has none.
function linkedAccent(background) {
  const bg = presetOf("background", background || DEFAULT_BACKGROUND);
  const accent = bg && ACCENTS.find((a) => a.name === bg.accent);
  return accent ? accent.hex : null;
}

// What the window actually wears for a workspace state.
function effective(state) {
  const background = state.background || DEFAULT_BACKGROUND;
  return { background, accent: state.accent || linkedAccent(background) };
}

function isCustom(state) {
  return !!(state.background || state.accent);
}

function savedWorkspace() {
  const f = vscode.workspace.workspaceFile;
  return f && f.scheme !== "untitled" ? f : null;
}

function workspaceOnly() {
  return config("projectColor").get("workspaceOnly") === true;
}

// Always writable in a saved workspace; in a folder's own settings unless workspace only.
function writable() {
  return !!savedWorkspace() || (!!vscode.workspace.workspaceFolders && !workspaceOnly());
}

function current() {
  const cfg = config("projectColor");
  return {
    background: cfg.inspect("color").workspaceValue || null,
    accent: cfg.inspect("accent").workspaceValue || null,
  };
}

function nameOf(knob, hex) {
  const preset = presetOf(knob, hex);
  return preset ? preset.name : hex || (knob === "accent" ? "background hue" : "");
}

// A background wearing its linked accent is named by the background alone.
function pairName(state) {
  const e = effective(state);
  const linked = (e.accent || null) === linkedAccent(e.background);
  return nameOf("background", e.background) + (linked ? "" : " · " + nameOf("accent", e.accent));
}

function differs(a, b) {
  a = a || {};
  b = b || {};
  return Object.keys(a).concat(Object.keys(b)).some((k) => a[k] !== b[k]);
}

// `existing` color customizations with Themepane's keys redrawn for `state`;
// a state with nothing set carries no colors and inherits the user default.
function merged(existing, state) {
  const colors = { ...existing };
  tint.KEYS.forEach((k) => delete colors[k]);
  if (isCustom(state)) {
    const e = effective(state);
    Object.assign(colors, tint.colorsFor(e.background, e.accent));
  }
  return Object.keys(colors).length ? colors : undefined;
}

// The default pair, written to the user settings so every window has it.
async function applyDefaults() {
  const wb = config("workbench");
  const existing = wb.inspect("colorCustomizations").globalValue;
  const next = merged(existing, { background: DEFAULT_BACKGROUND });
  if (differs(next, existing)) await wb.update("colorCustomizations", next, vscode.ConfigurationTarget.Global);
}

// The layout Themepane is drawn for: floating cards and pill tabs. Set once per profile;
// the values they replace are noted, and revert.js puts them back on uninstall.
const LAYOUT = {
  "workbench.experimental.modernUI": true,
  "workbench.experimental.modernUIEditorTabStyle": "pill",
};

async function writeJson(file, value) {
  await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(file, ".."));
  await vscode.workspace.fs.writeFile(file, Buffer.from(JSON.stringify(value, null, 2) + "\n"));
}

// Global storage on this machine: VS Code hands out file: or, lately, vscode-userdata: URIs.
const storageIsLocal = () => ["file", "vscode-userdata"].includes(ctx.globalStorageUri.scheme);

// The note is written before the settings, so whatever gets set can be undone. Keys another
// window noted first are kept: by now it may have set them, hiding the user's own value.
async function applyLayout() {
  // revert.js runs from the local install, so a dev or remote copy leaves the layout alone.
  if (ctx.extensionMode !== vscode.ExtensionMode.Production || ctx.extension.extensionKind !== vscode.ExtensionKind.UI ||
      !storageIsLocal()) return;
  const noteFile = vscode.Uri.joinPath(ctx.globalStorageUri, "layout.json");
  const noted = async () => ((await readJson(noteFile)) || {}).keys || {};
  const cfg = vscode.workspace.getConfiguration();
  const seen = await noted();
  const fresh = Object.keys(LAYOUT).filter((k) => !seen[k]);
  await listNote(noteFile);
  if (!fresh.length) return;
  const keys = {};
  fresh.forEach((k) => {
    const before = cfg.inspect(k).globalValue;
    keys[k] = before === undefined ? { ours: LAYOUT[k] } : { before, ours: LAYOUT[k] };
  });
  const settings = vscode.Uri.joinPath(ctx.globalStorageUri, "..", "..", "settings.json").fsPath;
  await writeJson(noteFile, { settings, keys: { ...keys, ...(await noted()) } });
  for (const k of fresh) {
    if (cfg.inspect(k).globalValue !== LAYOUT[k]) await cfg.update(k, LAYOUT[k], vscode.ConfigurationTarget.Global);
  }
}

// The install's list of notes, which revert.js reads. An update starts a new install folder.
async function listNote(noteFile) {
  const list = vscode.Uri.joinPath(ctx.extensionUri, "notes.json");
  const notes = await readJson(list);
  const known = Array.isArray(notes) ? notes : [];
  if (!known.includes(noteFile.fsPath)) await writeJson(list, known.concat(noteFile.fsPath));
}

// Settings writes run one at a time, so previews land in order and the
// conflict check can wait for all of them.
let queue = Promise.resolve();
function enqueue(write) {
  queue = queue.then(write, write);
  return queue;
}

function applyToWorkspace(state) {
  nextPreview = null;
  return enqueue(() => writeWorkspace(state));
}

// While a preview is being written, newer ones only replace the waiting state,
// so scrolling fast writes the first preset and wherever the cursor stops.
let nextPreview = null;
function preview(state) {
  const idle = !nextPreview;
  nextPreview = state;
  if (!idle) return;
  enqueue(() => {
    const s = nextPreview;
    nextPreview = null;
    return s && writeWorkspace(s);
  });
}

// Each update rewrites the file and restyles the window, so unchanged values are skipped.
async function writeWorkspace(state) {
  const wb = config("workbench");
  const pc = config("projectColor");
  const T = vscode.ConfigurationTarget.Workspace;
  const old = wb.inspect("colorCustomizations").workspaceValue;
  const colors = merged(old, state);
  const own = current();
  if (differs(colors, old)) await wb.update("colorCustomizations", colors, T);
  if (own.background !== (state.background || null)) await pc.update("color", state.background || undefined, T);
  if (own.accent !== (state.accent || null)) await pc.update("accent", state.accent || undefined, T);
  updateStatus();
}

// <parent of first folder>/.workspaces/<name>[+<name>…].code-workspace
function workspaceFileFor(folders) {
  const parent = vscode.Uri.joinPath(folders[0].uri, "..");
  const name = folders.map((f) => f.name).join("+");
  return vscode.Uri.joinPath(parent, ".workspaces", name + ".code-workspace");
}

// The workspace file's contents: null when missing, false when not plain JSON.
async function readJson(file) {
  let bytes;
  try {
    bytes = await vscode.workspace.fs.readFile(file);
  } catch (e) {
    return null;
  }
  try {
    return JSON.parse(Buffer.from(bytes).toString("utf8"));
  } catch (e) {
    return false;
  }
}

function shortPath(file) {
  return "../.workspaces/" + file.path.split("/").pop();
}

async function findElsewhere() {
  elsewhere = null;
  workspaceFound = false;
  const folders = vscode.workspace.workspaceFolders;
  if (savedWorkspace() || !folders) return;
  const file = workspaceFileFor(folders);
  const ws = await readJson(file);
  if (ws === null) return;
  workspaceFound = true;
  const settings = (ws && ws.settings) || {};
  const state = { background: settings["projectColor.color"] || null, accent: settings["projectColor.accent"] || null };
  if (isCustom(state)) elsewhere = { file, state };
}

// Reopen through this window's Themepane workspace, creating it with the folder's own
// colors if needed. `knob` ("menu" for the main menu) opens that picker after the reload.
async function reopenInWorkspace(knob) {
  const folders = vscode.workspace.workspaceFolders;
  const file = workspaceFileFor(folders);
  let ws = await readJson(file);
  if (ws === false) {
    vscode.window.showErrorMessage(file.fsPath + " is not plain JSON. Fix or delete it and try again.");
    return;
  }
  if (ws === null) {
    const parent = vscode.Uri.joinPath(folders[0].uri, "..");
    const own = current();
    const settings = {};
    if (isCustom(own)) {
      settings["workbench.colorCustomizations"] = merged(null, own);
      if (own.background) settings["projectColor.color"] = own.background;
      if (own.accent) settings["projectColor.accent"] = own.accent;
    }
    ws = {
      // Siblings of the .workspaces folder stay relative; anything else is absolute.
      folders: folders.map((f) => {
        const sibling = vscode.Uri.joinPath(f.uri, "..").toString() === parent.toString();
        return { path: sibling ? "../" + f.name : f.uri.path };
      }),
      settings,
    };
    await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(file, ".."));
    await vscode.workspace.fs.writeFile(file, Buffer.from(JSON.stringify(ws, null, 2) + "\n"));
  }
  if (knob) await ctx.globalState.update(PENDING, { file: file.toString(), knob, at: Date.now() });
  await vscode.commands.executeCommand("vscode.openFolder", file);
}

// Open the picker a window asked for before reopening here. Requests older than
// two minutes are dropped; fresh ones for another workspace are left for it.
function resumePick() {
  const pending = ctx.globalState.get(PENDING);
  if (!pending) return;
  const fresh = Date.now() - pending.at < 120000;
  const file = savedWorkspace();
  if (fresh && !(file && file.toString() === pending.file)) return;
  ctx.globalState.update(PENDING, undefined);
  if (!fresh) return;
  if (pending.knob === "menu") pick();
  else pickKnob(pending.knob);
}

function hideTip() {
  clearTimeout(tipTimer);
  tipHidden = true;
  updateStatus();
}

function showTip(delay) {
  clearTimeout(tipTimer);
  tipTimer = setTimeout(() => { tipHidden = false; updateStatus(); }, delay);
}

function withKnob(state, knob, hex) {
  return { ...state, [knob]: hex };
}

function presetItem(p, hex, description) {
  return { label: p.icon + "  " + p.name, description, hex, preset: true };
}

// Presets for one knob: arrow keys preview live, Enter keeps, Esc reverts.
// A window that can't be written to reopens in a workspace first.
function pickKnob(knob) {
  if (!writable()) {
    if (vscode.workspace.workspaceFolders) reopenInWorkspace(knob);
    else vscode.window.showInformationMessage("Open a folder first.");
    return;
  }
  hideTip();
  picking = true;
  const done = () => { picking = false; scheduleCheck(); };
  const spec = KNOBS[knob];
  const before = current();
  const mark = (hex) => ((before[knob] || null) === hex ? "  (current)" : "");
  let items;
  if (knob === "background") {
    // Picking the default clears this workspace's own value.
    items = BACKGROUNDS.map((p, i) => {
      const hex = i === 0 ? null : p.hex;
      return presetItem(p, hex, p.hex + "  · " + p.accent + (i === 0 ? "  · default" : "") + mark(hex));
    });
  } else {
    const linked = nameOf("accent", linkedAccent(before.background));
    items = [{ label: "$(link)  Linked to background", description: linked + mark(null), hex: null, preset: true }]
      .concat(ACCENTS.map((p) => presetItem(p, p.hex, p.hex + mark(p.hex))));
  }

  const qp = vscode.window.createQuickPick();
  qp.title = "Themepane: " + spec.title;
  qp.placeholder = "Arrow keys preview, Enter keeps, Esc reverts";
  qp.items = items.concat([
    { label: "", kind: vscode.QuickPickItemKind.Separator },
    { label: "$(edit)  Custom…", custom: true },
  ]);
  let accepted = false;
  qp.onDidChangeActive((active) => {
    const item = active[0];
    if (item && item.preset) preview(withKnob(before, knob, item.hex));
  });
  qp.onDidAccept(async () => {
    const item = qp.selectedItems[0];
    if (!item) return;
    accepted = true;
    qp.hide();
    if (!item.custom) {
      showTip(0);
      return applyToWorkspace(withKnob(before, knob, item.hex)).finally(done);
    }
    const input = await vscode.window.showInputBox({
      title: "Themepane: " + spec.title,
      prompt: knob === "background"
        ? "Hex color for the frame, e.g. #1f4a33. The panes get a deep shade of it. Keep it dark enough for light text."
        : "Hex color, e.g. #d9bb66. Light colors get dark button text; colorfulness is capped so nothing glows.",
      value: before[knob] || "",
      validateInput: (v) => (tint.normalizeHex(v) ? null : "Enter a hex color like #1c2a1f"),
    });
    showTip(input ? 0 : TIP_DELAY);
    await applyToWorkspace(input ? withKnob(before, knob, tint.normalizeHex(input)) : before).finally(done);
  });
  qp.onDidHide(() => {
    if (!accepted) {
      showTip(TIP_DELAY);
      applyToWorkspace(before).finally(done);
    }
    qp.dispose();
  });
  qp.show();
}

// The main menu: conflict actions, the two knobs, then where colors are kept.
async function pick() {
  if (!vscode.workspace.workspaceFolders) {
    vscode.window.showInformationMessage("Open a folder first.");
    return;
  }
  hideTip();
  const state = current();
  const e = effective(state);
  const only = workspaceOnly();
  const separator = { label: "", kind: vscode.QuickPickItemKind.Separator };
  const items = [];
  if (conflict) {
    items.push({ label: "$(warning)  Restore colors", description: conflictText(conflict), restore: true });
    if (conflict.culprit) {
      items.push({ label: "$(trash)  Uninstall " + conflict.culprit.name, description: "for the full tint", culprit: true });
    }
    items.push({ label: "$(bell-slash)  Ignore this change", ignore: true }, separator);
  }
  if (writable()) {
    items.push(
      { label: "$(themepane-background)  Background", description: nameOf("background", e.background) + (state.background ? "" : " (default)"), knob: "background" },
      { label: "$(themepane-accent)  Accent", description: nameOf("accent", e.accent) + (state.accent ? "" : " (linked)"), knob: "accent" }
    );
    if (isCustom(state)) items.push({ label: "$(discard)  Reset to default", clear: true });
    items.push(separator);
  }
  const saved = savedWorkspace();
  if (saved) {
    items.push({ label: "$(file-code)  Workspace file", description: saved.path.split("/").slice(-2).join("/"), openFile: saved });
  } else {
    const file = workspaceFileFor(vscode.workspace.workspaceFolders);
    items.push({
      label: "$(window)  Reopen in workspace",
      description: (elsewhere ? pairName(elsewhere.state) : workspaceFound ? "No colors yet" : "Create") + "  · " + shortPath(file),
      reopen: true,
    });
  }
  items.push({
    label: (only ? "$(lock)" : "$(unlock)") + "  Workspace only",
    description: only ? "On · folders open as a workspace to be colored" : "Off · folders keep colors in .vscode/settings.json",
    toggle: true,
  });
  items.push(...updateItems());

  const choice = await vscode.window.showQuickPick(items, { title: "Themepane" });
  if (!choice || !choice.knob) showTip(TIP_DELAY);
  if (!choice) return;
  if (choice.toggle) {
    await config("projectColor").update("workspaceOnly", !only || undefined, vscode.ConfigurationTarget.Global);
    return pick();
  }
  if (choice.restore) return restore();
  if (choice.culprit) return uninstallCulprit(conflict.culprit);
  if (choice.ignore) return ignoreConflict(conflict);
  if (choice.openFile) return vscode.window.showTextDocument(choice.openFile);
  if (choice.reopen) return reopenInWorkspace(elsewhere || isCustom(state) ? null : "menu");
  if (choice.clear) return applyToWorkspace({ background: null, accent: null });
  if (choice.check) return checkUpdate(true);
  if (choice.update) return installUpdate(choice.update);
  if (choice.skipUpdate) return saveUpdateState({ skip: choice.skipUpdate.version });
  if (choice.reload) return vscode.commands.executeCommand("workbench.action.reloadWindow");
  pickKnob(choice.knob);
}

// Extensions that fight Themepane: some rewrite colorCustomizations, others patch VS Code's files.
const REWRITES = "rewrites the title bar, status bar and activity bar colors";
const PATCHES = "patches VS Code's files, and its styles can cover Themepane's colors";
const CULPRITS = [
  { id: "johnpapa.vscode-peacock", name: "Peacock", why: REWRITES },
  { id: "stuart.unique-window-colors", name: "Window Colors", why: REWRITES },
  { id: "subframe7536.custom-ui-style", name: "Custom UI Style", why: PATCHES },
  { id: "drcika.apc-extension", name: "APC Customize UI++", why: PATCHES },
  { id: "be5invis.vscode-custom-css", name: "Custom CSS and JS Loader", why: PATCHES },
  { id: "illixion.vscode-vibrancy-continued", name: "Vibrancy Continued", why: PATCHES },
  { id: "eyhn.vscode-vibrancy", name: "Vibrancy", why: PATCHES },
];

function enabledCulprits() {
  return CULPRITS.filter((c) => vscode.extensions.getExtension(c.id));
}

// Once per window session, suggest uninstalling each enabled culprit until "Don't warn again".
async function warnCulprits() {
  const never = (c) => (ctx.globalState.get(CULPRIT_STATE) || {})[c.id] === "never";
  const due = enabledCulprits().filter((c) => !never(c) && !warnedCulprits[c.id]);
  for (const c of due) {
    warnedCulprits[c.id] = Date.now();
    const remove = "Uninstall " + c.name;
    const choice = await vscode.window.showWarningMessage(
      "Themepane: " + c.name + " is installed. It " + c.why + ". Uninstall it for the full look.",
      remove, "Don't warn again"
    );
    if (choice === remove) uninstallCulprit(c);
    else if (choice === "Don't warn again") {
      const seen = ctx.globalState.get(CULPRIT_STATE) || {};
      seen[c.id] = "never";
      await ctx.globalState.update(CULPRIT_STATE, seen);
    }
  }
}

// VS Code asks for the reload itself; the extension's page is the fallback.
function uninstallCulprit(c) {
  return vscode.commands.executeCommand("workbench.extensions.uninstallExtension", c.id)
    .then(null, () => vscode.commands.executeCommand("extension.open", c.id));
}

// VS Code never checks a VSIX install for updates, so Themepane asks GitHub itself: once a
// day after 9:00, or from the menu. State: { checked, skip, latest: { version, url, vsix } }.
const REPO = "pcardenal/themepane";
const UPDATE_STATE = "themepane.update";
const CHECK_HOUR = 9;
// Soft green for the status bar item while an update waits; ≥ 6:1 on every preset frame.
const UPDATE_COLOR = "#a5e0a5";
let installed = null; // the version this window installed, until it reloads

// The latest 9:00 local time that has passed; a check older than it is due.
function lastCheckTime() {
  const t = new Date();
  if (t.getHours() < CHECK_HOUR) t.setDate(t.getDate() - 1);
  return t.setHours(CHECK_HOUR, 0, 0, 0);
}

function isNewer(a, b) {
  const x = a.split(".").map(Number), y = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0);
  return false;
}

// A dev host or a remote-only copy must not replace the user's local install.
function canUpdate() {
  return ctx.extensionMode === vscode.ExtensionMode.Production && ctx.extension.extensionKind === vscode.ExtensionKind.UI;
}

// The newer release the last check found, unless it was skipped or this window installed it.
function pendingUpdate() {
  const state = ctx.globalState.get(UPDATE_STATE) || {};
  const latest = state.latest;
  if (!canUpdate() || installed || !latest || state.skip === latest.version) return null;
  return isNewer(latest.version, ctx.extension.packageJSON.version) ? latest : null;
}

async function saveUpdateState(change) {
  await ctx.globalState.update(UPDATE_STATE, { ...(ctx.globalState.get(UPDATE_STATE) || {}), ...change });
  updateStatus();
}

async function fetchLatest() {
  const res = await fetch("https://api.github.com/repos/" + REPO + "/releases/latest", {
    headers: { Accept: "application/vnd.github+json", "User-Agent": "themepane" },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error("GitHub answered " + res.status);
  const release = await res.json();
  const asset = (release.assets || []).find((a) => a.name === "themepane.vsix");
  return { version: String(release.tag_name || "").replace(/^v/, ""), url: release.html_url, vsix: asset && asset.browser_download_url };
}

async function checkUpdate(manual) {
  if (!canUpdate()) {
    if (manual) vscode.window.showInformationMessage("Themepane: only a local install updates itself.");
    return;
  }
  const state = ctx.globalState.get(UPDATE_STATE) || {};
  if (!manual && (state.checked || 0) >= lastCheckTime()) return;
  await saveUpdateState({ checked: Date.now() });
  let latest;
  try {
    latest = await fetchLatest();
  } catch (e) {
    await saveUpdateState({ checked: state.checked }); // retry on the next tick
    if (manual) vscode.window.showWarningMessage("Themepane couldn't check for updates: " + e.message);
    return;
  }
  await saveUpdateState({ latest });
  const running = ctx.extension.packageJSON.version;
  if (!isNewer(latest.version, running) || (!manual && state.skip === latest.version)) {
    if (manual) vscode.window.showInformationMessage("Themepane " + running + " is the latest version.");
    return;
  }
  const choice = await vscode.window.showInformationMessage(
    "Themepane " + latest.version + " is available (you have " + running + ").", "Update", "Skip This Version"
  );
  if (choice === "Update") await installUpdate(latest);
  else if (choice === "Skip This Version") await saveUpdateState({ skip: latest.version });
}

// Download the release's VSIX into global storage and install it like "Install from VSIX…".
async function installUpdate(latest) {
  try {
    if (!latest.vsix) throw new Error("the release has no themepane.vsix");
    await vscode.window.withProgress(
      { location: vscode.ProgressLocation.Notification, title: "Updating Themepane to " + latest.version + "…" },
      async () => {
        const res = await fetch(latest.vsix, { headers: { "User-Agent": "themepane" }, signal: AbortSignal.timeout(60000) });
        if (!res.ok) throw new Error("the download failed (" + res.status + ")");
        const file = vscode.Uri.joinPath(ctx.globalStorageUri, "themepane.vsix");
        await vscode.workspace.fs.createDirectory(ctx.globalStorageUri);
        await vscode.workspace.fs.writeFile(file, new Uint8Array(await res.arrayBuffer()));
        // Global storage can be a vscode-userdata: URI, which the installer rejects ("No Servers").
        await vscode.commands.executeCommand("workbench.extensions.installExtension", vscode.Uri.file(file.fsPath));
      }
    );
  } catch (e) {
    const open = await vscode.window.showErrorMessage("Themepane couldn't update: " + (e.message || e) + ".", "Open Release");
    if (open) vscode.env.openExternal(vscode.Uri.parse(latest.url));
    return;
  }
  installed = latest.version;
  updateStatus();
  const reload = await vscode.window.showInformationMessage(
    "Themepane " + latest.version + " is installed. Reload to use it (other windows too).", "Reload Window"
  );
  if (reload) vscode.commands.executeCommand("workbench.action.reloadWindow");
}

// The menu's last section: update and skip while one waits, otherwise check (or reload).
function updateItems() {
  if (!canUpdate()) return [];
  const running = ctx.extension.packageJSON.version;
  const separator = { label: "", kind: vscode.QuickPickItemKind.Separator };
  if (installed) return [separator, { label: "$(refresh)  Reload to finish updating", description: installed, reload: true }];
  const latest = pendingUpdate();
  if (!latest) return [separator, { label: "$(sync)  Check for updates", description: running, check: true }];
  return [
    separator,
    { label: "$(arrow-circle-up)  Update Themepane", description: running + " → " + latest.version, update: latest },
    { label: "$(circle-slash)  Skip update", description: latest.version, skipUpdate: latest },
  ];
}

// Whether a "[Theme A][Theme *]" block key applies to `theme`.
function themeBlockFor(key, theme) {
  const names = key.match(/\[[^\]]+\]/g);
  return !!names && names.some((n) => {
    const glob = n.slice(1, -1).replace(/[.+?^${}()|\\]/g, "\\$&").replace(/\*/g, ".*");
    return new RegExp("^" + glob + "$").test(theme);
  });
}

function themeBlocks(colors, theme) {
  return Object.keys(colors || {}).filter((k) => k[0] === "[" && themeBlockFor(k, theme));
}

function holdsKeys(colors) {
  return !!colors && tint.KEYS.some((k) => colors[k] !== undefined);
}

// Compare the merged colors, with blocks for the current theme on top, to what
// this window's pair should produce.
function findConflict() {
  const wb = config("workbench");
  const all = wb.get("colorCustomizations") || {};
  const blocks = themeBlocks(all, wb.get("colorTheme"));
  const e = effective(current());
  const want = tint.colorsFor(e.background, e.accent);
  const got = {};
  const keys = Object.keys(want).filter((k) => {
    let v = all[k];
    blocks.forEach((b) => { if (all[b] && all[b][k] !== undefined) v = all[b][k]; });
    got[k] = v;
    return typeof v !== "string" || v.toLowerCase() !== want[k].toLowerCase();
  });
  if (!keys.length) return null;
  const culprit = enabledCulprits().find((c) => c.why === REWRITES);
  const sig = JSON.stringify(keys.map((k) => [k, got[k]]));
  return { keys, culprit, sig };
}

// Debounced check once Themepane's own writes have landed. Warns once per new conflict,
// in the focused window, unless it suggested uninstalling that culprit in the last 30 s.
let checkTimer;
function scheduleCheck() {
  clearTimeout(checkTimer);
  checkTimer = setTimeout(async () => {
    await queue;
    if (leaving || picking) return;
    conflict = findConflict();
    if (conflict && ctx.workspaceState.get(IGNORED) === conflict.sig) conflict = null;
    updateStatus();
    if (!conflict || conflict.sig === notified || !vscode.window.state.focused) return;
    notified = conflict.sig;
    const justWarned = conflict.culprit && Date.now() - (warnedCulprits[conflict.culprit.id] || 0) < 30000;
    if (!justWarned) warnConflict(conflict);
  }, 1500);
}

function conflictText(c) {
  return c.keys.length + (c.keys.length === 1 ? " color was" : " colors were") + " changed by " +
    (c.culprit ? c.culprit.name : "something else");
}

async function warnConflict(c) {
  const remove = c.culprit && "Uninstall " + c.culprit.name;
  const buttons = ["Restore colors", ...(remove ? [remove] : []), "Don't warn again"];
  const choice = await vscode.window.showWarningMessage(
    "Themepane: " + conflictText(c) + ". Restore them, or remove whatever is rewriting workbench.colorCustomizations.",
    ...buttons
  );
  if (choice === "Restore colors") restore();
  else if (remove && choice === remove) uninstallCulprit(c.culprit);
  else if (choice === "Don't warn again") ignoreConflict(c);
}

async function ignoreConflict(c) {
  await ctx.workspaceState.update(IGNORED, c.sig);
  conflict = null;
  updateStatus();
}

// Whether the window's own settings already hold Themepane values, which restore()
// corrects even with workspace only on.
function hasOwnColors() {
  const colors = config("workbench").inspect("colorCustomizations").workspaceValue || {};
  return isCustom(current()) || holdsKeys(colors) ||
    Object.keys(colors).some((b) => b[0] === "[" && holdsKeys(colors[b]));
}

// `value` without Themepane's keys in the blocks for `theme`, or null if none held any.
function withoutThemeKeys(value, theme) {
  const blocks = themeBlocks(value, theme).filter((b) => holdsKeys(value[b]));
  if (!blocks.length) return null;
  const next = { ...value };
  blocks.forEach((b) => {
    const block = { ...value[b] };
    tint.KEYS.forEach((k) => delete block[k]);
    if (Object.keys(block).length) next[b] = block;
    else delete next[b];
  });
  return next;
}

// Put this window's colors back: clear theme blocks, then rewrite the user default
// and the workspace, where allowed or where it already holds Themepane's values.
async function restore() {
  const wb = config("workbench");
  const theme = wb.get("colorTheme");
  const info = wb.inspect("colorCustomizations");
  const T = vscode.ConfigurationTarget;
  const own = writable() || (!!vscode.workspace.workspaceFolders && hasOwnColors());
  const targets = [[T.Global, info.globalValue]];
  if (own) targets.push([T.Workspace, info.workspaceValue]);
  await enqueue(async () => {
    for (const [target, value] of targets) {
      const next = withoutThemeKeys(value, theme);
      if (next) await wb.update("colorCustomizations", next, target);
    }
  });
  await enqueue(applyDefaults);
  if (own) await applyToWorkspace(current());
  await queue;
  const left = findConflict();
  if (left) {
    vscode.window.showWarningMessage(
      "Themepane: " + conflictText(left) + " and can't be restored from here" +
      (left.culprit ? ". Uninstall " + left.culprit.name + " and reload." : ".")
    );
  }
}

function updateStatus() {
  if (leaving) return status.hide();
  if (!writable()) {
    status.text = "$(warning) Themepane · No workspace";
    status.tooltip = "Themepane\nWorkspace only: colors apply inside workspaces." +
      (elsewhere ? "\n" + pairName(elsewhere.state) + " is saved in " + shortPath(elsewhere.file) + "." : "") +
      "\nClick to reopen in one.";
  } else {
    const state = current();
    const e = effective(state);
    status.text = "$(themepane-logo) " + (isCustom(state) ? pairName(state) : "Themepane");
    status.tooltip = "Themepane" +
      "\nBackground: " + nameOf("background", e.background) + (state.background ? "" : " (default)") +
      "\nAccent: " + nameOf("accent", e.accent) + (state.accent ? "" : " (linked)") +
      (isCustom(state) && !savedWorkspace() ? "\nSaved in .vscode/settings.json" : "") + "\nClick to change";
  }
  if (conflict) {
    status.text = "$(warning) Themepane · Warning";
    status.tooltip = "Themepane: " + conflictText(conflict) + ".\nClick to restore.\n\n" + status.tooltip;
  }
  status.backgroundColor = conflict || !writable() ? new vscode.ThemeColor("statusBarItem.warningBackground") : undefined;
  const latest = !conflict && writable() && pendingUpdate();
  status.color = latest ? UPDATE_COLOR : undefined;
  if (latest) {
    status.text = "$(arrow-circle-up) Themepane · Update available";
    status.tooltip += "\n\nThemepane " + latest.version + " is available. Update it from the menu.";
  }
  if (tipHidden) status.tooltip = undefined;
  if (vscode.workspace.workspaceFolders) status.show();
  else status.hide();
}

// The User folder (profiles live under it in profiles/<id>), from this profile's globalStorage.
function userDir() {
  const dir = vscode.Uri.joinPath(ctx.globalStorageUri, "..", "..");
  return dir.path.split("/").slice(-2, -1)[0] === "profiles" ? vscode.Uri.joinPath(dir, "..", "..") : dir;
}

async function readText(uri) {
  try {
    return Buffer.from(await vscode.workspace.fs.readFile(uri)).toString("utf8");
  } catch (e) {
    return null;
  }
}

// A local window can still reach a WSL path through \\wsl.localhost.
function reachable(uri) {
  const wsl = uri.scheme === "vscode-remote" && /^wsl\+(.+)$/i.exec(uri.authority);
  const unc = wsl && process.platform === "win32" && vscode.Uri.file("\\\\wsl.localhost\\" + wsl[1] + uri.path.replace(/\//g, "\\"));
  return unc ? [uri, unc] : [uri];
}

async function firstReadable(uris) {
  for (const uri of uris) if ((await readText(uri)) !== null) return uri;
  for (const uri of uris) {
    try { await vscode.workspace.fs.stat(uri); return uri; } catch (e) { /* try the next */ }
  }
  return null;
}

// Settings files that may hold Themepane values ({ uri, base }), from every workspace and
// folder VS Code remembers, plus the remembered ones this window can't reach.
async function rememberedSettings() {
  const storage = vscode.Uri.joinPath(userDir(), "workspaceStorage");
  let ids = [];
  try { ids = (await vscode.workspace.fs.readDirectory(storage)).map(([name]) => name); } catch (e) { /* none */ }
  const found = new Map();
  const skipped = [];
  const add = (uri, base) => found.set(uri.toString(), { uri, base });
  await Promise.all(ids.map(async (id) => {
    const info = await readJson(vscode.Uri.joinPath(storage, id, "workspace.json"));
    const raw = info && (info.workspace || info.folder);
    if (!raw) return;
    const uri = await firstReadable(reachable(vscode.Uri.parse(raw)));
    if (!uri) {
      if (!raw.startsWith("file:")) skipped.push(raw);
      return;
    }
    if (info.workspace) return add(uri, ["settings"]);
    add(vscode.Uri.joinPath(uri, ".vscode", "settings.json"), []);
    const dir = vscode.Uri.joinPath(uri, "..", ".workspaces");
    try {
      for (const [name] of await vscode.workspace.fs.readDirectory(dir)) {
        if (name.endsWith(".code-workspace")) add(vscode.Uri.joinPath(dir, name), ["settings"]);
      }
    } catch (e) { /* no .workspaces folder there */ }
  }));
  const files = [];
  for (const f of found.values()) {
    const text = await readText(f.uri);
    const next = text === null ? null : revert.strip(text, f.base, revert.OWN);
    if (next !== null && next !== text) files.push(f);
  }
  return { files, skipped: skipped.sort() };
}

// Uninstall first and strip after, with no reload between: a running Themepane writes its
// colors back on activation. The user settings of every profile go through revert.js.
let leaving = false;
async function cleanUp() {
  const { files, skipped } = await rememberedSettings();
  const go = "Clean Up and Uninstall";
  const choice = await vscode.window.showWarningMessage(
    "Uninstall Themepane and remove its colors everywhere?",
    {
      modal: true,
      detail: "Removes Themepane's colors and settings from your user settings and from " + files.length +
        " workspace and folder settings file(s) it can reach, and puts back the layout settings it changed.",
    },
    go
  );
  if (choice !== go) return;
  leaving = true;
  clearTimeout(checkTimer);
  await queue;
  try {
    await vscode.commands.executeCommand("workbench.extensions.uninstallExtension", ctx.extension.id);
  } catch (e) {
    leaving = false;
    vscode.window.showErrorMessage("Themepane couldn't uninstall itself, so no colors were removed: " + e.message);
    return;
  }
  status.hide();
  let changed = 0;
  const wb = config("workbench");
  const userColors = wb.inspect("colorCustomizations").globalValue;
  if (holdsKeys(userColors)) {
    await wb.update("colorCustomizations", merged(userColors, {}), vscode.ConfigurationTarget.Global);
    changed++;
  }
  for (const key of revert.OWN) {
    const name = key.slice("projectColor.".length);
    if (config("projectColor").inspect(name).globalValue !== undefined) {
      await config("projectColor").update(name, undefined, vscode.ConfigurationTarget.Global);
    }
  }
  // A remote copy's storage is the server's, not the user's settings.
  if (ctx.extension.extensionKind === vscode.ExtensionKind.UI && storageIsLocal()) {
    const settings = vscode.Uri.joinPath(ctx.globalStorageUri, "..", "..", "settings.json").fsPath;
    changed += revert.run(revert.OWN, [settings]).length;
  }
  for (const f of files) {
    const text = await readText(f.uri);
    const next = text === null ? null : revert.strip(text, f.base, revert.OWN);
    if (next === null || next === text) continue;
    await vscode.workspace.fs.writeFile(f.uri, Buffer.from(next, "utf8"));
    changed++;
  }
  vscode.window.showInformationMessage(
    "Themepane is uninstalled and its colors are gone from " + changed + " settings file(s). Reload other open windows.",
    {
      modal: !!skipped.length,
      detail: skipped.length ? "Not reachable from this window, check these by hand:\n" + skipped.join("\n") : undefined,
    }
  );
}

// Bring this window's colors up to date with tint.js, and move a retired preset on.
function refresh() {
  const state = current();
  if (!writable() || !isCustom(state)) return;
  if (RETIRED[state.background]) {
    applyToWorkspace({ ...state, background: RETIRED[state.background] });
    return;
  }
  const existing = config("workbench").inspect("colorCustomizations").workspaceValue;
  if (differs(merged(existing, state), existing)) applyToWorkspace(state);
}

// Find this folder's Themepane workspace; on startup, reopen through it when the user
// asked for that and the folder has no colors of its own.
async function checkElsewhere(startup) {
  await findElsewhere();
  updateStatus();
  const reopen = config("projectColor").get("reopenWorkspace");
  if (startup && reopen && elsewhere && !isCustom(current())) await reopenInWorkspace(null);
}

function activate(context) {
  ctx = context;
  status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, -1000);
  status.command = "projectColor.pick";
  updateStatus();
  enqueue(applyDefaults);
  enqueue(() => applyLayout().catch((e) => console.error("Themepane: layout not set", e)));
  refresh();
  resumePick();
  checkElsewhere(true);
  warnCulprits();
  scheduleCheck();
  const autoCheck = () => checkUpdate(false).catch((e) => console.error("Themepane: update check failed", e));
  autoCheck();
  // Open windows check hourly, focused ones only, so the notification shows where the user is.
  const hourly = setInterval(() => vscode.window.state.focused && autoCheck(), 60 * 60 * 1000);
  context.subscriptions.push(
    { dispose: () => clearInterval(hourly) },
    vscode.window.onDidChangeWindowState((w) => w.focused && autoCheck()),
    status,
    vscode.commands.registerCommand("projectColor.pick", pick),
    vscode.commands.registerCommand("projectColor.pickBackground", () => pickKnob("background")),
    vscode.commands.registerCommand("projectColor.pickAccent", () => pickKnob("accent")),
    vscode.commands.registerCommand("projectColor.cleanUp", cleanUp),
    vscode.commands.registerCommand("projectColor.checkUpdates", () => checkUpdate(true)),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("projectColor.workspaceOnly")) checkElsewhere(false);
      else if (e.affectsConfiguration("projectColor")) updateStatus();
      if (e.affectsConfiguration("workbench.colorCustomizations") || e.affectsConfiguration("workbench.colorTheme") ||
          e.affectsConfiguration("projectColor")) scheduleCheck();
    }),
    vscode.extensions.onDidChange(() => { warnCulprits(); scheduleCheck(); }),
    vscode.workspace.onDidChangeWorkspaceFolders(() => checkElsewhere(false))
  );
}

module.exports = { activate };
