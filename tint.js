"use strict";

// The palette: Dark Modern's and Dark 2026's grays and blues redrawn in a background and an accent.
// Pure functions over hex strings, runnable in plain node.

// Dark Modern's neutral grays. Editor keys use the sidebar's #181818 so all panes match.
const BASE = {
  "editor.background": "#181818",
  "editorGutter.background": "#181818",
  "breadcrumb.background": "#181818",
  "editorGroupHeader.tabsBackground": "#2b2b2b",
  "editorGroupHeader.tabsBorder": "#2b2b2b",
  "editor.inactiveSelectionBackground": "#3a3d41",
  "editorIndentGuide.background1": "#404040",
  "editorIndentGuide.activeBackground1": "#707070",
  "editorWidget.background": "#202020",
  "editorOverviewRuler.border": "#010409",
  "tab.activeBackground": "#181818",
  "tab.activeBorder": "#181818",
  "tab.selectedBackground": "#37373d",
  "tab.inactiveBackground": "#2b2b2b",
  "tab.hoverBackground": "#1f1f1f",
  "tab.unfocusedHoverBackground": "#1f1f1f",
  "tab.unfocusedActiveBorder": "#181818",
  "tab.unfocusedActiveBorderTop": "#181818",
  "tab.border": "#2b2b2b",
  "sideBar.background": "#181818",
  "sideBar.border": "#2b2b2b",
  "sideBarSectionHeader.background": "#181818",
  "sideBarSectionHeader.border": "#2b2b2b",
  "activityBar.background": "#181818",
  "activityBar.border": "#2b2b2b",
  "modernActivityBar.border": "#252526",
  "titleBar.activeBackground": "#181818",
  "titleBar.inactiveBackground": "#1f1f1f",
  "titleBar.border": "#2b2b2b",
  "statusBar.background": "#181818",
  "statusBar.inactiveBackground": "#1f1f1f",
  "statusBar.noFolderBackground": "#1f1f1f",
  "statusBar.border": "#2b2b2b",
  "panel.background": "#181818",
  "panel.border": "#2b2b2b",
  "panelInput.border": "#2b2b2b",
  "terminal.background": "#181818",
  "terminal.inactiveSelectionBackground": "#3a3d41",
  "debugToolBar.background": "#181818",
  "input.background": "#313131",
  "input.border": "#3c3c3c",
  "dropdown.background": "#313131",
  "dropdown.border": "#3c3c3c",
  "dropdown.listBackground": "#1f1f1f",
  "checkbox.background": "#313131",
  "checkbox.border": "#3c3c3c",
  "settings.dropdownBackground": "#313131",
  "settings.dropdownBorder": "#3c3c3c",
  "widget.border": "#313131",
  "surface.border": "#252526",
  "agentsPanel.border": "#303031",
  "agentsChatInput.border": "#303031",
  "agentsNewSessionButton.border": "#303031",
  "quickInput.background": "#222222",
  "pickerGroup.border": "#3c3c3c",
  "menu.background": "#1f1f1f",
  "menu.border": "#454545",
  "menu.separatorBackground": "#454545",
  "notifications.background": "#1f1f1f",
  "notifications.border": "#2b2b2b",
  "notificationCenterHeader.background": "#1f1f1f",
  "peekViewEditor.background": "#1f1f1f",
  "peekViewResult.background": "#1f1f1f",
  "list.dropBackground": "#383b3d",
  "actionBar.toggledBackground": "#383a49",
  "button.secondaryHoverBackground": "#2b2b2b",
  "badge.background": "#616161",
  "textBlockQuote.background": "#2b2b2b",
  "textBlockQuote.border": "#616161",
  "textCodeBlock.background": "#2b2b2b",
  "textPreformat.background": "#3c3c3c",
  "welcomePage.tileBackground": "#2b2b2b",
  // Not set by Dark Modern: VS Code's registry defaults.
  "list.hoverBackground": "#2a2d2e",
  "list.inactiveSelectionBackground": "#37373d",
  "toolbar.hoverBackground": "#5a5d5e50",
  "inputOption.hoverBackground": "#5a5d5e80",
  "editorStickyScrollHover.background": "#2a2d2e",
  "terminalStickyScrollHover.background": "#2a2d2e",
  "editor.lineHighlightBorder": "#282828",
  "editor.findRangeHighlightBackground": "#3a3d4166",
  "editor.wordHighlightBackground": "#575757b8",
  "editor.snippetFinalTabstopHighlightBorder": "#525252",
  "peekViewTitle.background": "#252526",
  "multiDiffEditor.headerBackground": "#262626",
  "diffEditor.unchangedCodeBackground": "#74747429",
  "simpleFindWidget.sashBorder": "#454545",
  "tree.tableColumnsBorder": "#cccccc20",
  "profileBadge.background": "#4d4d4d",
  "chat.avatarBackground": "#1f1f1f",
  "chat.checkpointSeparator": "#585858",
  // Quieter marks: gutter numbers, bracket match, scrollbars, rulers.
  "editorLineNumber.foreground": "#6e7681",
  "editorBracketMatch.border": "#888888",
  "scrollbarSlider.background": "#79797966",
  "scrollbarSlider.hoverBackground": "#646464b3",
  "scrollbarSlider.activeBackground": "#bfbfbf66",
  "statusBarItem.prominentBackground": "#6e768166",
  "textSeparator.foreground": "#21262d",
  "tree.indentGuidesStroke": "#585858",
  "editorRuler.foreground": "#5a5a5a",
  "editorWhitespace.foreground": "#e3e4e229",
  "editorActiveLineNumber.foreground": "#c6c6c6",
  // Dark 2026's own grays for keys Dark Modern left to defaults; its pane levels map to #181818.
  "surface.background": "#181818",
  "agents.background": "#181818",
  "agentsPanel.background": "#181818",
  "editorStickyScroll.background": "#181818",
  "tab.unfocusedActiveBackground": "#181818",
  "terminalCursor.background": "#181818",
  "editorHoverWidget.background": "#202122",
  "editorSuggestWidget.background": "#202122",
  "breadcrumbPicker.background": "#202122",
  "quickInputTitle.background": "#202122",
  "agentsChatInput.background": "#202122",
  "editor.lineHighlightBackground": "#242526",
  "editorHoverWidget.border": "#2a2b2c",
  "editorSuggestWidget.border": "#2a2b2c",
  "editorWidget.border": "#2a2b2c",
  "editorStickyScroll.border": "#2a2b2c",
  "notificationCenter.border": "#2a2b2c",
  "notificationToast.border": "#2a2b2c",
  "panelSection.border": "#2a2b2c",
  "panelSectionHeader.border": "#2a2b2c",
  "peekView.border": "#2a2b2c",
  "terminal.border": "#2a2b2c",
  "tab.lastPinnedBorder": "#2a2b2c",
  "button.secondaryBorder": "#333536",
  "scrollbar.shadow": "#191b1d4d",
};

// Dark Modern's blue accents and VS Code's blue selection defaults. Each is
// redrawn from the accent's fill, keeping only its lightness and opacity.
const ACCENT = {
  "focusBorder": "#0078d4",
  "button.background": "#0078d4",
  "button.hoverBackground": "#026ec1",
  "progressBar.background": "#0078d4",
  "activityBarBadge.background": "#0078d4",
  "activityBar.activeBorder": "#0078d4",
  "panelTitle.activeBorder": "#0078d4",
  "terminal.tab.activeBorder": "#0078d4",
  "menu.selectionBackground": "#0078d4",
  "statusBarItem.remoteBackground": "#0078d4",
  "statusBar.debuggingBackground": "#0078d4",
  "statusBar.focusBorder": "#0078d4",
  "statusBarItem.focusBorder": "#0078d4",
  "agentsChatInput.focusBorder": "#007acc",
  "inputOption.activeBackground": "#2489db82",
  "inputOption.activeBorder": "#2488db",
  "chat.slashCommandBackground": "#26477866",
  "list.activeSelectionBackground": "#04395e",
  "editor.selectionBackground": "#264f78",
  "editor.selectionHighlightBackground": "#add6ff26",
  "editor.hoverHighlightBackground": "#264f7840",
  "editor.wordHighlightStrongBackground": "#004972b8",
  "selection.background": "#264f78",
  "list.highlightForeground": "#2aaaff",
  "pickerGroup.foreground": "#3794ff",
  "textLink.foreground": "#4daafc",
  "textLink.activeForeground": "#4daafc",
  "chat.slashCommandForeground": "#85b6ff",
  "welcomePage.progress.foreground": "#0078d4",
  "peekViewResult.selectionBackground": "#3399ff33",
  "tab.activeModifiedBorder": "#3399cc",
  "chat.requestCodeBorder": "#004972b8",
  "inputValidation.infoBackground": "#063b49",
  "inputValidation.infoBorder": "#007acc",
  // Dark 2026's blues: focus outlines and borders, links, match and comment highlights.
  "activityBar.activeFocusBorder": "#3994bcb3",
  "list.focusOutline": "#3994bcb3",
  "editorSuggestWidget.focusOutline": "#3994bcb3",
  "menu.selectionBorder": "#3994bc",
  "button.border": "#297aa0",
  "chat.inputWorkingBorderColor1": "#297aa0",
  "agentsGradient.tintColor": "#297aa0",
  "editorOverviewRuler.findMatchForeground": "#3a94bc99",
  "editorLink.activeForeground": "#3a94bc",
  "notificationLink.foreground": "#3a94bc",
  "editor.findMatchBackground": "#27678290",
  "editor.findMatchHighlightBackground": "#27678280",
  "editorBracketMatch.background": "#3994bc55",
  "peekViewEditor.matchHighlightBackground": "#3994bc33",
  "peekViewResult.matchHighlightBackground": "#3994bc33",
  "terminal.selectionBackground": "#3994bc33",
  "editorCommentsWidget.rangeBackground": "#488fae26",
  "editorCommentsWidget.rangeActiveBackground": "#488fae46",
  // Cursors default to gray; they take the link color so they stand out.
  "editorCursor.foreground": "#4daafc",
  "terminalCursor.foreground": "#4daafc",
};

function normalizeHex(input) {
  let h = String(input).trim().replace(/^#?/, "#");
  if (/^#[0-9a-f]{3}$/i.test(h)) h = "#" + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
  return /^#[0-9a-f]{6}$/i.test(h) ? h.toLowerCase() : null;
}

function rgbOf(hex) {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
}

// Channels in 0-255, rounded to a hex string.
function hexOf(rgb) {
  return "#" + rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
}

function toHsl(hex) {
  const [r, g, b] = rgbOf(hex).map((v) => v / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (d) {
    s = d / (1 - Math.abs(2 * l - 1));
    h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
  }
  return { h, s, l };
}

function toHex(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const rgb = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x]
            : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return hexOf(rgb.map((v) => (v + m) * 255));
}

// Re-hue a gray to the pane tone, shifting its lightness by `shift`; alpha is kept.
function tint(base, pane, shift) {
  const l = Math.min(1, Math.max(0, toHsl(base).l + shift));
  return toHex(pane.h, pane.s, l) + base.slice(7);
}

// Lightness and chroma are measured in OKLCH, which is perceptual: HSL would
// turn greens and yellows into highlighter colors.
function lin(v) { return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
function gam(v) { return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055; }

function toOklch(hex) {
  const [r, g, b] = rgbOf(hex).map((v) => lin(v / 255));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { L, C: Math.hypot(A, B), h: (Math.atan2(B, A) * 180 / Math.PI + 360) % 360 };
}

function oklchToRgb(L, C, h) {
  const A = C * Math.cos(h * Math.PI / 180), B = C * Math.sin(h * Math.PI / 180);
  const l = Math.pow(L + 0.3963377774 * A + 0.2158037573 * B, 3);
  const m = Math.pow(L - 0.1055613458 * A - 0.0638541728 * B, 3);
  const s = Math.pow(L - 0.0894841775 * A - 1.291485548 * B, 3);
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

function inGamut(rgb) {
  return rgb.every((v) => v >= -1e-4 && v <= 1 + 1e-4);
}

// Out-of-gamut colors lose chroma, never hue or lightness.
function fromOklch(L, C, h) {
  let rgb = oklchToRgb(L, C, h);
  if (!inGamut(rgb)) {
    let lo = 0, hi = C;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(oklchToRgb(L, mid, h))) lo = mid; else hi = mid;
    }
    rgb = oklchToRgb(L, lo, h);
  }
  return hexOf(rgb.map((v) => gam(Math.min(1, Math.max(0, v))) * 255));
}

// sRGB channels (0-255) of an OKLCH color, or null outside sRGB: the custom color panel's field.
function rgbIn(L, C, h) {
  const rgb = oklchToRgb(L, C, h);
  return inGamut(rgb) ? rgb.map((v) => gam(Math.min(1, Math.max(0, v))) * 255) : null;
}

// Solid fills that carry text: the accent's own lightness and chroma, capped so
// nothing glows. Light fills get dark text; hover is one step toward the middle.
const FILLS = [
  "button.background",
  "activityBarBadge.background",
  "menu.selectionBackground",
  "statusBarItem.remoteBackground",
  "statusBar.debuggingBackground",
  "progressBar.background",
  "quickInputList.focusBackground",
  "extensionButton.prominentBackground",
  "agentsBadge.background",
  "agentsUnreadBadge.background",
];
const FILL_HOVER = ["button.hoverBackground", "extensionButton.prominentHoverBackground"];
const FILL_TEXT = [
  "button.foreground",
  "activityBarBadge.foreground",
  "menu.selectionForeground",
  "statusBarItem.remoteForeground",
  "statusBar.debuggingForeground",
  "quickInputList.focusForeground",
  "quickInputList.focusIconForeground",
  "quickInputList.focusHighlightForeground",
  "extensionButton.prominentForeground",
  "agentsBadge.foreground",
  "agentsUnreadBadge.foreground",
];
const FILL_L = 0.52, FILL_C = 0.133, LIGHT = 0.65;

// Lines and marks that wear the fill exactly (at their own opacity), so focus rings match the buttons.
const MARKS = [
  "focusBorder",
  "activityBar.activeBorder",
  "panelTitle.activeBorder",
  "terminal.tab.activeBorder",
  "statusBar.focusBorder",
  "statusBarItem.focusBorder",
  "agentsChatInput.focusBorder",
  "inputOption.activeBorder",
  "inputValidation.infoBorder",
  "welcomePage.progress.foreground",
  "tab.activeModifiedBorder",
  "activityBar.activeFocusBorder",
  "list.focusOutline",
  "editorSuggestWidget.focusOutline",
  "menu.selectionBorder",
  "button.border",
  "chat.inputWorkingBorderColor1",
  "agentsGradient.tintColor",
  "editorOverviewRuler.findMatchForeground",
];

// Accent text on the panes, all one color: the fill if it's as light as Dark
// Modern's link, otherwise the link's lightness at the fill's chroma.
const INK = [
  "editorCursor.foreground",
  "terminalCursor.foreground",
  "textLink.foreground",
  "textLink.activeForeground",
  "list.highlightForeground",
  "pickerGroup.foreground",
  "chat.slashCommandForeground",
  "editorLink.activeForeground",
  "notificationLink.foreground",
];

// Composite `top` at `alpha` over `bottom`, as VS Code does.
function over(top, alpha, bottom) {
  const b = rgbOf(bottom);
  return hexOf(rgbOf(top).map((v, i) => v * alpha + b[i] * (1 - alpha)));
}

// The fill see-through over the pane, as dark as Dark Modern's `base` so text
// reads the same. Opaque bases give a solid blend, translucent ones fill + alpha.
function wash(base, fill, pane) {
  const own = toOklch(base.slice(0, 7));
  const alpha = base.length > 7 ? parseInt(base.slice(7, 9), 16) / 255 : 1;
  const target = toOklch(over(fromOklch(own.L, 0, 0), alpha, pane)).L;
  let lo = 0, hi = 1;
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    if (toOklch(over(fill, mid, pane)).L < target) lo = mid; else hi = mid;
  }
  if (alpha < 1) return fill + Math.round(lo * 255).toString(16).padStart(2, "0");
  return over(fill, lo, pane);
}

// Everything around the panes, including the card edges, takes the background exactly.
// Card edges must not be transparent: that shows the card's own dark fill as a line.
const FRAME = [
  "titleBar.activeBackground",
  "titleBar.inactiveBackground",
  "titleBar.border",
  "window.activeBorder",
  "window.inactiveBorder",
  "activityBar.border",
  "modernActivityBar.border",
  "statusBar.background",
  "statusBar.inactiveBackground",
  "statusBar.noFolderBackground",
  "statusBar.border",
  "editorGroupHeader.tabsBackground",
  "editorGroupHeader.connectedTabsBackground",
  "editorGroupHeader.tabsBorder",
  "tab.inactiveBackground",
  "tab.unfocusedInactiveBackground",
  "editorGroup.border",
  "sideBar.border",
  "panel.border",
  "surface.border",
  "editor.border",
  "modernPanel.border",
];

// Text and widgets on the frame, pinned to Dark Modern's so they read the same in any dark theme
// (Dark 2026 dims bar text to #8c8c8c and puts gray boxes on the frame).
const FRAME_TEXT = {
  "titleBar.activeForeground": "#cccccc",
  "titleBar.inactiveForeground": "#9d9d9d",
  "statusBar.foreground": "#cccccc",
  "statusBar.noFolderForeground": "#cccccc",
  "statusBarItem.hoverBackground": "#f1f1f133",
  "statusBarItem.activeBackground": "#ffffff2e",
  "activityBar.foreground": "#d7d7d7",
  "activityBar.inactiveForeground": "#9d9d9d",
  "activityBarTop.foreground": "#e7e7e7",
  "activityBarTop.inactiveForeground": "#e7e7e799",
  "commandCenter.foreground": "#cccccc",
  "commandCenter.activeForeground": "#cccccc",
  "commandCenter.background": "#ffffff0d",
  "commandCenter.activeBackground": "#ffffff14",
  "commandCenter.border": "#cccccc33",
  "commandCenter.activeBorder": "#cccccc4d",
  "statusBarItem.prominentHoverBackground": "#f1f1f133",
  "activityBar.activeBackground": "#ffffff1a",
  "activityBarTop.activeBorder": "#e7e7e7",
  "menubar.selectionBackground": "#f1f1f133",
  "modernActivityBar.hoverBackground": "#f1f1f133",
};

// Dark 2026's dim grays raised to be read: text ≥ 4.5:1 on its surface, disabled items and
// icons ≥ 3:1 on panes and frame alike, with disabled still well below enabled icons.
const READABLE = {
  "input.placeholderForeground": "#aaaaaa",
  "agentsChatInput.placeholderForeground": "#aaaaaa",
  "disabledForeground": "#ffffff73",
  "icon.foreground": "#bfbfbf",
  "checkbox.foreground": "#bfbfbf",
  "tab.inactiveForeground": "#b5b5b5",
  "tab.unfocusedActiveForeground": "#b5b5b5",
  "tab.unfocusedInactiveForeground": "#9d9d9d",
  "list.invalidItemForeground": "#9d9d9d",
  "textPreformat.foreground": "#cccccc",
  "descriptionForeground": "#9d9d9d",
  "breadcrumb.foreground": "#9d9d9d",
  "panelTitle.inactiveForeground": "#9d9d9d",
  "editorCodeLens.foreground": "#9d9d9d",
  "peekViewResult.lineForeground": "#9d9d9d",
  "peekViewTitleDescription.foreground": "#9d9d9d",
};

// Lines inside a pane, made transparent: tab dividers, the scrollbar rule, the active tab's top line.
const HIDDEN = [
  "tab.border",
  "tab.activeBorderTop",
  "tab.selectedBorderTop",
  "editorOverviewRuler.border",
];

// Pill tabs: the active one matches the selected sidebar row, the rest are clear. Its hover is
// the same color, so hovering the tab you are already in never changes it.
const PILL_ACTIVE = ["modernEditorTab.activeBackground", "modernEditorTab.activeHoverBackground"];
const PILL_ACTIVE_HOVER = ["modernEditorTab.activeHoverBackground"];
const PILL_HOVER = ["modernEditorTab.hoverBackground"];
const PILL_CLEAR = ["modernEditorTab.inactiveBackground"];

const KEYS = [...new Set([
  ...Object.keys(BASE), ...Object.keys(ACCENT), ...FRAME, ...Object.keys(FRAME_TEXT), ...Object.keys(READABLE), ...HIDDEN,
  ...PILL_ACTIVE, ...PILL_HOVER, ...PILL_CLEAR, ...FILLS, ...FILL_HOVER, ...FILL_TEXT,
])];

// The pane tone: the background's hue, quieter and darker than the frame.
function paneOf(frame) {
  return { h: frame.h, s: frame.s * 0.6, l: Math.max(0.05, Math.min(0.09, frame.l * 0.5)) };
}

// Every key Themepane owns for a background and an accent (either may be null). Connected tabs
// share `modernEditorTab.activeBackground` with pills, so it's left out for them and their active
// tab falls back to `tab.activeBackground`, the editor's own color; its hover is set to that same
// color, which the fallback doesn't cover.
// No accent borrows the background's hue; a gray source leaves Dark Modern blue.
function colorsFor(background, accent, { connected = false } = {}) {
  const out = {};
  const set = (keys, value) => keys.forEach((k) => { out[k] = value; });
  if (background) {
    const frame = toHsl(background);
    const pane = paneOf(frame);
    // Dark Modern's pane gray lands on the pane tone; other grays keep their step from it.
    const shift = pane.l - toHsl("#181818").l;
    Object.keys(BASE).forEach((k) => { out[k] = tint(BASE[k], pane, shift); });
    set(FRAME, background);
    Object.assign(out, FRAME_TEXT);
    Object.assign(out, READABLE);
    if (connected) set(PILL_ACTIVE_HOVER, out["editor.background"]);
    else set(PILL_ACTIVE, out["list.inactiveSelectionBackground"]);
    set(PILL_HOVER, toHex(frame.h, frame.s, Math.min(1, frame.l + 0.04)));
    set(PILL_CLEAR, "#00000000");
  }
  if (background || accent) set(HIDDEN, "#00000000");

  const source = accent || background;
  const hue = source && toOklch(source);
  if (!hue || (!accent && hue.C <= 0.02)) return out;
  // An explicit accent sets the fill's tone; one borrowed from the background uses a mid tone.
  const fillL = accent ? Math.min(0.85, Math.max(0.5, hue.L)) : FILL_L;
  const fillC = accent ? Math.min(FILL_C, hue.C) : FILL_C;
  const fill = fromOklch(fillL, fillC, hue.h);
  const light = fillL > LIGHT;
  const pane = out["editor.background"] || "#181818";
  // Solid washes share one tint, as dark as Dark Modern's text selection.
  const solid = wash(ACCENT["editor.selectionBackground"], fill, pane);
  Object.keys(ACCENT).forEach((k) => {
    out[k] = ACCENT[k].length > 7 ? wash(ACCENT[k], fill, pane) : solid;
  });
  MARKS.forEach((k) => { out[k] = fill + ACCENT[k].slice(7); });
  const link = toOklch(ACCENT["textLink.foreground"]);
  set(INK, fillL >= link.L ? fill : fromOklch(link.L, Math.min(link.C * 0.8, fillC), hue.h));
  set(FILLS, fill);
  set(FILL_HOVER, fromOklch(fillL + (light ? -0.04 : 0.04), fillC, hue.h));
  set(FILL_TEXT, light ? "#1f1f1f" : "#ffffff");
  return out;
}

module.exports = { KEYS, normalizeHex, colorsFor, toOklch, fromOklch, rgbIn };
