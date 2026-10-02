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
const IGNORED_SETUP = "themepane.ignoredSetup";

let ctx;
let status;
// Outside a saved workspace: the Themepane workspace for these folders ({ file, state })
// if it has colors, and whether its file exists at all.
let elsewhere = null;
let workspaceFound = false;
// Colors, theme or layout changed by something else ({ keys, culprit, sig, setup, setupSig }),
// and the last one warned about.
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

const TAB_STYLE = "workbench.experimental.modernUIEditorTabStyle";
const palette = (e) => tint.colorsFor(e.background, e.accent, { connected: config().get(TAB_STYLE) === "connected" });

// `existing` color customizations with Themepane's keys redrawn for `state`;
// a state with nothing set carries no colors and inherits the user default.
function merged(existing, state) {
  const colors = { ...existing };
  tint.KEYS.forEach((k) => delete colors[k]);
  if (isCustom(state)) {
    const e = effective(state);
    Object.assign(colors, palette(e));
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

const SHOW_TABS = "workbench.editor.showTabs";
const TAB_HEIGHT = "window.density.editorTabHeight";
const PANEL = "workbench.panel.defaultLocation";

// Settings Themepane keeps fixed: changing one is flagged like a color conflict.
const FIXED = {
  "workbench.experimental.modernUI": true,
  "workbench.activityBar.autoHide": false,
  [PANEL]: "bottom",
  "workbench.experimental.modernUIUppercaseViewHeaders": false,
  "workbench.editor.titleScrollbarSizing": "default",
  "workbench.editor.titleScrollbarVisibility": "auto",
  "workbench.layoutControl.type": "toggles",
  "workbench.shadows": false,
  "window.menuBarVisibility": "classic",
  "editor.minimap.side": "right",
  "workbench.editor.pinnedTabSizing": "normal",
  "workbench.editor.showIcons": true,
  "workbench.editor.labelFormat": "default",
  "workbench.editor.tabSizing": "fit",
  "workbench.editor.decorations.badges": true,
  "workbench.editor.decorations.colors": true,
  "workbench.editor.highlightModifiedTabs": false,
  "workbench.statusBar.visible": true,
  "workbench.secondarySideBar.defaultVisibility": "hidden",
  "workbench.sideBar.location": "left",
  "workbench.editor.tabActionLocation": "right",
  "workbench.secondarySideBar.showLabels": false,
  "workbench.iconTheme": "vs-seti",
  "workbench.navigationControl.enabled": true,
  "workbench.view.alwaysShowHeaderActions": false,
  "workbench.tree.renderIndentGuides": "onHover",
  "terminal.integrated.tabs.enabled": true,
  "terminal.integrated.tabs.location": "right",
  "editor.renderLineHighlight": "all",
  "editor.renderWhitespace": "selection",
  "editor.minimap.renderCharacters": false,
  "scm.diffDecorations": "all",
  "workbench.editor.empty.hint": "hidden",
  "editor.lineNumbers": "on",
  "editor.bracketPairColorization.enabled": true,
};

// Where the Layout menu starts; every value there is drawn for, so changes aren't flagged.
// Tab style and activity bar position are left to the user.
const MENU_DEFAULTS = {
  [SHOW_TABS]: "multiple",
  "workbench.editor.wrapTabs": false,
  "workbench.editor.pinnedTabsOnSeparateRow": true,
  "workbench.editor.tabActionCloseVisibility": true,
  "window.density.layout": "default",
  "window.commandCenter": true,
  "workbench.layoutControl.enabled": true,
  "workbench.notifications.position": "bottom-right",
  "workbench.panel.showLabels": false,
  "window.titleBarStyle": "custom",
  "window.customTitleBarVisibility": "auto",
  "editor.minimap.enabled": true,
  "breadcrumbs.enabled": true,
  "workbench.editor.editorActionsLocation": "default",
};

// Both are set once per profile; the values they replace are noted, and revert.js puts them back
// on uninstall.
const LAYOUT = { ...FIXED, ...MENU_DEFAULTS };

const THEME = "Dark 2026";
// What the palette is drawn for. A list allows any of its values; Restore writes the first.
const SETUP = {
  "workbench.colorTheme": THEME,
  ...FIXED,
  "workbench.notifications.position": ["bottom-right", "top-right"],
  [SHOW_TABS]: ["multiple", "none"],
};
const allowed = (key) => [].concat(SETUP[key]);

// The Layout menu, in groups. Values are listed by hand: the API doesn't expose a setting's enum.
// An option can also set other keys (`also`); one without a `value` leaves the setting itself alone.
// Two options toggle on Enter; more open a list.
const ON_OFF = [true, false];
const PINNED_ROW = "workbench.editor.pinnedTabsOnSeparateRow";
const UNPIN = "workbench.editor.tabActionUnpinVisibility";
// Rows and buttons do nothing while tabs are hidden, so they're only listed while tabs show.
const tabsShown = () => vscode.workspace.getConfiguration().get(SHOW_TABS) !== "none";
// An item with `sub` opens its own list.
const LAYOUT_CHOICES = [
  { group: "Window", items: [
    { key: "workbench.activityBar.location", title: "Activity bar", values: [
      "top",
      { value: "default", name: "Side", also: { "workbench.activityBar.compact": false } },
      { value: "default", name: "Side [Compact]", also: { "workbench.activityBar.compact": true } },
      "bottom",
      "hidden",
    ] },
    { key: "window.density.layout", title: "Panel spacing", values: [
      { value: "default", name: "Floating" },
      { value: "compact", name: "Edge to edge" },
    ] },
    { key: "explorer.compactFolders", title: "Compact folders", values: ON_OFF },
    { key: "workbench.panel.showLabels", title: "Bottom panel tabs", values: [
      { value: true, name: "Names" },
      { value: false, name: "Icons" },
    ] },
    { key: "workbench.notifications.position", title: "Notifications", values: ["bottom-right", "top-right"] },
  ] },
  { group: "Editor", items: [
    { title: "Tabs", sub: [
      { key: "workbench.experimental.modernUIEditorTabStyle", title: "Style", values: [
        { value: "pill", name: "Pill", also: { [SHOW_TABS]: "multiple", [TAB_HEIGHT]: "default" } },
        { value: "pill", name: "Pill [Compact]", also: { [SHOW_TABS]: "multiple", [TAB_HEIGHT]: "compact" } },
        { value: "connected", name: "Connected", also: { [SHOW_TABS]: "multiple", [TAB_HEIGHT]: "default" } },
        { value: "connected", name: "Connected [Compact]", also: { [SHOW_TABS]: "multiple", [TAB_HEIGHT]: "compact" } },
        { name: "Hidden", also: { [SHOW_TABS]: "none" } },
      ] },
      { key: "workbench.editor.wrapTabs", title: "Rows", when: tabsShown, values: [
        { value: false, name: "One row", also: { [PINNED_ROW]: false } },
        { value: false, name: "One row [Pinned on top]", also: { [PINNED_ROW]: true } },
        { value: true, name: "Wrap", also: { [PINNED_ROW]: false } },
        { value: true, name: "Wrap [Pinned on top]", also: { [PINNED_ROW]: true } },
      ] },
      { key: "workbench.editor.tabActionCloseVisibility", title: "Buttons", when: tabsShown, values: [
        { value: true, name: "Close and unpin", also: { [UNPIN]: true } },
        { value: true, name: "Close only", also: { [UNPIN]: false } },
        { value: false, name: "Unpin only", also: { [UNPIN]: true } },
        { value: false, name: "None", also: { [UNPIN]: false } },
      ] },
    ] },
    { key: "editor.minimap.enabled", title: "Minimap", values: [
      { value: true, name: "On", also: { "editor.minimap.autohide": "none" } },
      { value: true, name: "Autohide", also: { "editor.minimap.autohide": "mouseover" } },
      { value: false, name: "Off" },
    ] },
    { key: "editor.guides.indentation", title: "Guides", values: [
      { value: true, name: "Indentation",
        also: { "editor.guides.highlightActiveIndentation": true, "editor.guides.bracketPairs": false } },
      { value: true, name: "Indentation and current brackets", also: { "editor.guides.highlightActiveIndentation": true,
        "editor.guides.bracketPairs": "active", "editor.guides.bracketPairsHorizontal": "active" } },
      { value: true, name: "Indentation and all brackets", also: { "editor.guides.highlightActiveIndentation": true,
        "editor.guides.bracketPairs": true, "editor.guides.bracketPairsHorizontal": true } },
      { value: false, name: "Off", also: { "editor.guides.highlightActiveIndentation": false, "editor.guides.bracketPairs": false } },
    ] },
    { key: "workbench.editor.editorActionsLocation", title: "Toolbar location", values: [
      { value: "default", name: "Next to the tabs" },
      { value: "titleBar", name: "In the title bar" },
      { value: "hidden", name: "Hidden" },
    ] },
    { key: "breadcrumbs.enabled", title: "Breadcrumbs", values: ON_OFF },
    { key: "editor.stickyScroll.enabled", title: "Sticky scroll", values: [
      { value: true, name: "On", also: { "workbench.tree.enableStickyScroll": true } },
      { value: false, name: "Off", also: { "workbench.tree.enableStickyScroll": false } },
    ] },
  ] },
  { group: "Title bar", items: [
    { key: "window.titleBarStyle", title: "Title bar style", values: [
      { value: "custom", name: "Custom", also: { "window.customTitleBarVisibility": "auto" } },
      { value: "custom", name: "Custom, hidden in full screen", also: { "window.customTitleBarVisibility": "windowed" } },
      { value: "native", name: "Native (not colored, restarts)" },
    ] },
    { key: "window.commandCenter", title: "Command center", values: ON_OFF },
    { key: "workbench.layoutControl.enabled", title: "Layout controls", values: ON_OFF },
  ] },
];

// Settings an older VS Code doesn't have are skipped
const registered = (key) => vscode.workspace.getConfiguration().inspect(key)?.defaultValue !== undefined;

function setupChanges() {
  const cfg = vscode.workspace.getConfiguration();
  return Object.keys(SETUP).filter(registered).map((key) => ({ key, got: cfg.get(key) }))
    .filter(({ key, got }) => !allowed(key).includes(got));
}

function setupText({ key, got }) {
  if (key === "workbench.colorTheme") return "the theme is " + got + ", not " + THEME;
  if (key === "workbench.experimental.modernUI") return "the modern layout is off";
  if (key === PANEL) return "the panel is set to the " + got + ", not the bottom";
  if (key === "workbench.experimental.modernUIUppercaseViewHeaders") return "view headers are uppercase";
  if (key === "workbench.editor.titleScrollbarSizing") return "the tab scrollbar is " + got + ", not default";
  if (key === "workbench.editor.titleScrollbarVisibility") return "the tab scrollbar is " + got + ", not auto";
  if (key === "workbench.layoutControl.type") return "the layout controls show " + got + ", not toggles";
  if (key === "workbench.shadows") return "shadows are on";
  if (key === "window.menuBarVisibility") return "the menu bar is " + got + ", not classic";
  if (key === "editor.minimap.side") return "the minimap is on the " + got;
  if (key === "workbench.editor.pinnedTabSizing") return "pinned tabs are " + got + ", not normal size";
  if (key === "workbench.editor.showIcons") return "tabs have no file icons";
  if (key === "workbench.editor.labelFormat") return "tab labels are " + got + ", not default";
  if (key === "workbench.editor.tabSizing") return "tabs are sized " + got + ", not fit";
  if (key === "workbench.editor.decorations.badges") return "tabs have no status badges";
  if (key === "workbench.editor.decorations.colors") return "tab names aren't colored by status";
  if (key === "workbench.editor.highlightModifiedTabs") return "modified tabs are highlighted";
  if (key === "workbench.statusBar.visible") return "the status bar is hidden";
  if (key === "workbench.secondarySideBar.defaultVisibility") return "the secondary sidebar opens with new windows";
  if (key === "workbench.notifications.position") return "notifications show bottom left, not on the right";
  if (key === "workbench.sideBar.location") return "the sidebar is on the right";
  if (key === "workbench.editor.tabActionLocation") return "tab close buttons are on the left";
  if (key === SHOW_TABS) return "only the active file has a tab";
  if (key === "workbench.secondarySideBar.showLabels") return "the secondary sidebar shows labels";
  if (key === "workbench.iconTheme") return "the file icons are " + (got || "off") + ", not Seti";
  if (key === "workbench.navigationControl.enabled") return "the back and forward arrows are hidden";
  if (key === "workbench.view.alwaysShowHeaderActions") return "view header actions are always shown";
  if (key === "workbench.tree.renderIndentGuides") return "tree indent guides are " + got + ", not on hover";
  if (key === "terminal.integrated.tabs.enabled") return "the terminal tab list is off";
  if (key === "terminal.integrated.tabs.location") return "terminal tabs are on the left";
  if (key === "editor.renderLineHighlight") return "the current line highlight is " + got + ", not gutter and line";
  if (key === "editor.renderWhitespace") return "whitespace is shown as " + got + ", not in selections";
  if (key === "editor.minimap.renderCharacters") return "the minimap draws characters, not blocks";
  if (key === "scm.diffDecorations") return "git change marks are " + got + ", not all";
  if (key === "workbench.editor.empty.hint") return "new files show the empty editor hint";
  if (key === "editor.lineNumbers") return "line numbers are " + got + ", not on";
  if (key === "editor.bracketPairColorization.enabled") return "brackets aren't colored by pair";
  return "the activity bar hides itself";
}

// Put the theme and layout back: in the user settings, and in the workspace where it overrides them.
async function restoreSetup() {
  const cfg = vscode.workspace.getConfiguration();
  const T = vscode.ConfigurationTarget;
  const changes = setupChanges();
  for (const { key } of changes) {
    const info = cfg.inspect(key);
    if (info.workspaceValue !== undefined && writable()) await cfg.update(key, undefined, T.Workspace);
    if (!allowed(key).includes(info.globalValue)) await cfg.update(key, allowed(key)[0], T.Global);
  }
  // The setting only places the panel in new windows; this one is moved too.
  if (changes.some((c) => c.key === PANEL)) await vscode.commands.executeCommand("workbench.action.positionPanelBottom");
}

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
  const fresh = Object.keys(LAYOUT).filter((k) => !seen[k] && registered(k));
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
  if (fresh.includes(PANEL)) await vscode.commands.executeCommand("workbench.action.positionPanelBottom");
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
  const describe = (...parts) => parts.filter(Boolean).join(" · ");
  const mark = (hex) => (before[knob] || null) === hex && "Current";
  const DEFAULT = { background: null, accent: null };
  let items;
  let bottom = [];
  if (knob === "background") {
    // Picking the default clears this workspace's own value.
    items = BACKGROUNDS.map((p, i) => {
      const hex = i === 0 ? null : p.hex;
      return presetItem(p, hex, describe(mark(hex)));
    });
    // Both knobs back to the default pair.
    if (isCustom(before)) bottom = [{ label: "$(discard)  Reset to default", description: pairName(DEFAULT), reset: true }];
  } else {
    const linked = nameOf("accent", linkedAccent(before.background));
    items = ACCENTS.map((p) => presetItem(p, p.hex, describe(mark(p.hex))));
    bottom = [{ label: "$(link)  Linked to background", description: describe(linked, mark(null)), hex: null, preset: true }];
  }

  const qp = vscode.window.createQuickPick();
  qp.title = "Themepane: " + spec.title;
  qp.placeholder = "Arrow keys preview, Enter keeps, Esc reverts";
  qp.items = items.concat([
    { label: "", kind: vscode.QuickPickItemKind.Separator },
    { label: "$(edit)  Custom…", custom: true },
  ], bottom);
  let accepted = false;
  qp.onDidChangeActive((active) => {
    const item = active[0];
    if (item && item.preset) preview(withKnob(before, knob, item.hex));
    if (item && item.reset) preview(DEFAULT);
  });
  qp.onDidAccept(async () => {
    const item = qp.selectedItems[0];
    if (!item) return;
    accepted = true;
    qp.hide();
    if (!item.custom) {
      showTip(0);
      return applyToWorkspace(item.reset ? DEFAULT : withKnob(before, knob, item.hex)).finally(done);
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

// Set in the user settings, dropping a workspace value that would hide it. VS Code's own default
// is written as unset, unless Themepane sets that key.
async function setLayout(key, value) {
  const cfg = vscode.workspace.getConfiguration();
  const T = vscode.ConfigurationTarget;
  const info = cfg.inspect(key);
  if (info.workspaceValue !== undefined && writable()) await cfg.update(key, undefined, T.Workspace);
  await cfg.update(key, value === info.defaultValue && !(key in LAYOUT) ? undefined : value, T.Global);
}

// "visibleInWorkspace" → "Visible in workspace", "bottom-right" → "Bottom right".
function valueName(value) {
  if (typeof value === "boolean") return value ? "On" : "Off";
  const words = String(value).replace(/([a-z])([A-Z])/g, "$1 $2").replace(/-/g, " ").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

const optionsOf = (choice) => choice.options || (choice.options = choice.values.map((v) => (typeof v === "object" ? v : { value: v })));
const optionName = (o) => o.name || valueName(o.value);

function isCurrent(choice, o) {
  const cfg = vscode.workspace.getConfiguration();
  return (!("value" in o) || cfg.get(choice.key) === o.value) && Object.entries(o.also || {}).every(([k, v]) => cfg.get(k) === v);
}

function currentName(choice) {
  const o = optionsOf(choice).find((o) => isCurrent(choice, o));
  return o ? optionName(o) : valueName(vscode.workspace.getConfiguration().get(choice.key));
}

// Themepane's own value where it sets one, else VS Code's; an option's `also` keys count too.
const defaultOf = (key) => (key in LAYOUT ? LAYOUT[key] : vscode.workspace.getConfiguration().inspect(key).defaultValue);
function defaultOption(choice) {
  const value = defaultOf(choice.key);
  const options = optionsOf(choice).filter((o) => o.value === value);
  return options.find((o) => Object.entries(o.also || {}).every(([k, v]) => defaultOf(k) === v)) || options[0];
}


async function applyOption(choice, o) {
  if ("value" in o) await setLayout(choice.key, o.value);
  for (const [k, v] of Object.entries(o.also || {})) await setLayout(k, v);
}

// Registered settings only; an item with `sub` stays while any of its settings does.
const usable = (choices) => choices.map((c) => (c.sub ? { ...c, sub: usable(c.sub) } : c))
  .filter((c) => (c.sub ? c.sub.length : registered(c.key)));
const flatten = (choices) => choices.flatMap((c) => (c.sub ? flatten(c.sub) : [c]));

const layoutGroups = () => LAYOUT_CHOICES.map((g) => ({ group: g.group, items: usable(g.items) })).filter((g) => g.items.length);
const allChoices = () => flatten(layoutGroups().flatMap((g) => g.items));

// Back to Themepane's layout: its own values, everything else unset.
async function resetLayout() {
  for (const c of allChoices()) {
    const o = defaultOption(c);
    if (o) await applyOption(c, o);
    else await setLayout(c.key, undefined);
  }
}

// A toggle shows its value; a row that opens a list shows only the arrow.
const opens = (c) => !!c.sub || optionsOf(c).length > 2;
const choiceRow = (c) => (opens(c)
  ? { label: c.title + "  $(chevron-right)", choice: c }
  : { label: c.title, description: currentName(c), choice: c });

// Layout, Tabs and option lists. Enter toggles a two-option setting in place and opens a list
// for the rest; Esc or the back button returns to the list it came from.
function pickLayout() {
  hideTip();
  showLayoutView({ kind: "layout" });
}

function layoutView(view) {
  if (view.kind === "options") {
    const c = view.choice;
    const def = defaultOption(c);
    return {
      title: c.title,
      placeholder: "Enter picks, Esc goes back",
      items: optionsOf(c).map((o) => ({
        label: (isCurrent(c, o) ? "$(check)" : "$(blank)") + "  " + optionName(o),
        description: o === def ? "default" : "",
        option: o,
      })),
    };
  }
  if (view.kind === "list") {
    const items = view.choices().filter((c) => !c.when || c.when()).map(choiceRow);
    return { title: view.title, placeholder: "Enter switches or opens, Esc goes back", items };
  }
  return {
    title: "Layout",
    placeholder: "Enter switches or opens, Esc closes",
    items: layoutGroups().flatMap((g) => [
      { label: g.group, kind: vscode.QuickPickItemKind.Separator },
      ...g.items.map(choiceRow),
    ]).concat([
      { label: "", kind: vscode.QuickPickItemKind.Separator },
      { label: "$(discard)  Reset layout", description: "Themepane's layout, VS Code's defaults for the rest", reset: true },
    ]),
  };
}

function showLayoutView(view, focus) {
  const qp = vscode.window.createQuickPick();
  const draw = (keep) => {
    const v = layoutView(view);
    qp.title = "Themepane: " + v.title;
    qp.placeholder = v.placeholder;
    qp.items = v.items;
    const active = v.items.find((i) => keep(i)) || (view.kind === "options" && v.items.find((i) => i.label.startsWith("$(check)")));
    if (active) qp.activeItems = [active];
  };
  draw((i) => focus && i.choice && i.choice.title === focus.title);
  if (view.parent) qp.buttons = [vscode.QuickInputButtons.Back];
  let next = null;
  let busy = false;
  const go = (v, f) => { next = { view: v, focus: f }; qp.hide(); };
  qp.onDidTriggerButton(() => go(view.parent, view.from));
  qp.onDidAccept(async () => {
    const item = qp.activeItems[0];
    if (!item || busy) return;
    if (item.choice && item.choice.sub) {
      const sub = item.choice;
      const choices = () => layoutGroups().flatMap((g) => g.items).find((c) => c.title === sub.title).sub;
      return go({ kind: "list", title: sub.title, choices, parent: view, from: sub });
    }
    busy = true;
    if (item.reset) await enqueue(resetLayout);
    else if (item.option) {
      await enqueue(() => applyOption(view.choice, item.option));
      busy = false;
      return go(view.parent, view.choice);
    } else {
      const options = optionsOf(item.choice);
      if (opens(item.choice)) {
        busy = false;
        return go({ kind: "options", choice: item.choice, parent: view, from: item.choice });
      }
      const at = options.findIndex((o) => isCurrent(item.choice, o));
      await enqueue(() => applyOption(item.choice, options[(at + 1) % options.length]));
    }
    draw((i) => (item.reset ? i.reset : i.choice && i.choice.title === item.choice.title));
    busy = false;
  });
  // dispose() hides the list again, so the handler would run twice without `closed`.
  let closed = false;
  qp.onDidHide(() => {
    if (closed) return;
    closed = true;
    qp.dispose();
    if (next) return showLayoutView(next.view, next.focus);
    if (view.parent) return showLayoutView(view.parent, view.from);
    showTip(TIP_DELAY);
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
    items.push({ label: "$(warning)  Restore", description: conflictText(conflict), restore: true });
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
    if (layoutGroups().length) items.push({ label: "$(layout)  Layout", description: "Window, editor, title bar", layout: true });
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
  if (!choice || !(choice.knob || choice.layout)) showTip(TIP_DELAY);
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
  if (choice.layout) return pickLayout();
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
  const want = palette(e);
  const got = {};
  const keys = Object.keys(want).filter((k) => {
    let v = all[k];
    blocks.forEach((b) => { if (all[b] && all[b][k] !== undefined) v = all[b][k]; });
    got[k] = v;
    return typeof v !== "string" || v.toLowerCase() !== want[k].toLowerCase();
  });
  const setup = setupChanges();
  if (!keys.length && !setup.length) return null;
  const culprit = keys.length ? enabledCulprits().find((c) => c.why === REWRITES) : undefined;
  const sig = keys.length ? JSON.stringify(keys.map((k) => [k, got[k]])) : null;
  const setupSig = setup.length ? JSON.stringify(setup.map((c) => [c.key, c.got])) : null;
  return { keys, culprit, sig, setup, setupSig };
}

// Without what the user chose to ignore: colors per workspace, theme and layout everywhere.
function unignored(c) {
  if (c && c.sig && ctx.workspaceState.get(IGNORED) === c.sig) c = { ...c, keys: [], culprit: undefined, sig: null };
  if (c && c.setupSig && ctx.globalState.get(IGNORED_SETUP) === c.setupSig) c = { ...c, setup: [], setupSig: null };
  return c && (c.keys.length || c.setup.length) ? c : null;
}

// Debounced check once Themepane's own writes have landed. Warns once per new conflict,
// in the focused window, unless it suggested uninstalling that culprit in the last 30 s.
let checkTimer;
function scheduleCheck() {
  clearTimeout(checkTimer);
  checkTimer = setTimeout(async () => {
    await queue;
    if (leaving || picking) return;
    conflict = unignored(findConflict());
    updateStatus();
    const seen = conflict && conflict.sig + conflict.setupSig;
    if (!conflict || seen === notified || !vscode.window.state.focused) return;
    notified = seen;
    const justWarned = conflict.culprit && Date.now() - (warnedCulprits[conflict.culprit.id] || 0) < 30000;
    if (!justWarned) warnConflict(conflict);
  }, 1500);
}

function conflictText(c) {
  const parts = c.setup.map(setupText);
  if (c.keys.length) {
    parts.unshift(c.keys.length + (c.keys.length === 1 ? " color was" : " colors were") + " changed by " +
      (c.culprit ? c.culprit.name : "something else"));
  }
  return parts.join("; ");
}

async function warnConflict(c) {
  const remove = c.culprit && "Uninstall " + c.culprit.name;
  const buttons = ["Restore", ...(remove ? [remove] : []), "Don't warn again"];
  const choice = await vscode.window.showWarningMessage(
    "Themepane: " + conflictText(c) +
      (c.keys.length ? ". Restore them, or remove whatever is rewriting workbench.colorCustomizations." : ". Its colors are made for " + THEME + "."),
    ...buttons
  );
  if (choice === "Restore") restore();
  else if (remove && choice === remove) uninstallCulprit(c.culprit);
  else if (choice === "Don't warn again") ignoreConflict(c);
}

async function ignoreConflict(c) {
  if (c.sig) await ctx.workspaceState.update(IGNORED, c.sig);
  if (c.setupSig) await ctx.globalState.update(IGNORED_SETUP, c.setupSig);
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

// Put this window's theme, layout and colors back: clear theme blocks, then rewrite the user
// default and the workspace, where allowed or where it already holds Themepane's values.
async function restore() {
  await enqueue(restoreSetup);
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
  const left = unignored(findConflict());
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
    vscode.window.onDidChangeWindowState((w) => { if (w.focused) { autoCheck(); scheduleCheck(); } }),
    status,
    vscode.commands.registerCommand("projectColor.pick", pick),
    vscode.commands.registerCommand("projectColor.pickBackground", () => pickKnob("background")),
    vscode.commands.registerCommand("projectColor.pickAccent", () => pickKnob("accent")),
    vscode.commands.registerCommand("projectColor.pickLayout", pickLayout),
    vscode.commands.registerCommand("projectColor.cleanUp", cleanUp),
    vscode.commands.registerCommand("projectColor.checkUpdates", () => checkUpdate(true)),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("projectColor.workspaceOnly")) checkElsewhere(false);
      else if (e.affectsConfiguration("projectColor")) updateStatus();
      if (e.affectsConfiguration("workbench.colorCustomizations") || e.affectsConfiguration("projectColor") ||
          Object.keys(SETUP).some((k) => e.affectsConfiguration(k))) scheduleCheck();
      // The active tab's color depends on the tab style.
      if (e.affectsConfiguration(TAB_STYLE) && !leaving) { enqueue(applyDefaults); refresh(); }
    }),
    vscode.extensions.onDidChange(() => { warnCulprits(); scheduleCheck(); }),
    vscode.workspace.onDidChangeWorkspaceFolders(() => checkElsewhere(false))
  );
}

module.exports = { activate };
