"use strict";

// The vscode:uninstall hook, also run by Themepane: Clean Up: puts back the layout settings
// Themepane set, unless changed since, and removes its colors from every profile's user settings.

const fs = require("fs");
const path = require("path");
const jsonc = require("jsonc-parser");
const tint = require("./tint");

const OWN = ["projectColor.color", "projectColor.accent", "projectColor.reopenWorkspace", "projectColor.workspaceOnly"];

// Edits keep the file's own indentation and line endings.
function formatting(text) {
  const indent = /\n(\t| +)"/.exec(text);
  return {
    insertSpaces: !indent || indent[1][0] !== "\t",
    tabSize: indent ? indent[1].length : 2,
    eol: text.includes("\r\n") ? "\r\n" : "\n",
  };
}

function parse(text) {
  const errors = [];
  const root = jsonc.parse(text, errors, { allowTrailingComma: true });
  return errors.length || !root || typeof root !== "object" ? null : root;
}

// `text` without Themepane's colors in the settings at `base` ([] or ["settings"]), and
// without the `own` settings. workbench.colorCustomizations goes once nothing else is left.
// Returns null when the text isn't valid JSON.
function strip(text, base, own = []) {
  const root = parse(text);
  if (!root) return null;
  const settings = base.reduce((o, k) => o && o[k], root) || {};
  const formattingOptions = formatting(text);
  const remove = (keyPath) => {
    text = jsonc.applyEdits(text, jsonc.modify(text, base.concat(keyPath), undefined, { formattingOptions }));
  };
  const colors = settings["workbench.colorCustomizations"];
  if (colors && typeof colors === "object") {
    const ours = tint.KEYS.filter((k) => k in colors);
    if (ours.length && ours.length === Object.keys(colors).length) remove(["workbench.colorCustomizations"]);
    else ours.forEach((k) => remove(["workbench.colorCustomizations", k]));
  }
  own.filter((k) => k in settings).forEach((k) => remove([k]));
  return text;
}

function edit(file, change) {
  let text;
  try { text = fs.readFileSync(file, "utf8"); } catch (e) { return false; }
  const next = change(text);
  if (next === null) console.log("  skipped, not valid JSON: " + file);
  if (next === null || next === text) return false;
  fs.writeFileSync(file, next);
  return true;
}

// Notes listed by this install and by any older version VS Code hasn't deleted yet.
function notes() {
  const dir = path.dirname(__dirname);
  const all = new Set();
  for (const name of fs.readdirSync(dir)) {
    if (!name.toLowerCase().startsWith("pcardenal.themepane-")) continue;
    try {
      JSON.parse(fs.readFileSync(path.join(dir, name, "notes.json"), "utf8")).forEach((n) => all.add(n));
    } catch (e) { /* this version never ran */ }
  }
  return Array.from(all);
}

// A note is { settings: <settings.json>, keys: { <key>: { before?, ours } } }. Returns the
// settings path, or null when there was no note or the settings aren't valid JSON (kept for a retry).
function revert(file) {
  let note;
  try { note = JSON.parse(fs.readFileSync(file, "utf8")); } catch (e) { return null; }
  let valid = true;
  const changed = edit(note.settings, (text) => {
    const root = parse(text);
    if (!root) { valid = false; return null; }
    for (const [key, entry] of Object.entries(note.keys || {})) {
      if (JSON.stringify(root[key]) !== JSON.stringify(entry.ours)) continue;
      const value = "before" in entry ? entry.before : undefined;
      text = jsonc.applyEdits(text, jsonc.modify(text, [key], value, { formattingOptions: formatting(text) }));
    }
    return text;
  });
  if (!valid) return null;
  if (changed) console.log("  layout restored: " + note.settings);
  fs.rmSync(file, { force: true });
  return note.settings;
}

// The User folder a settings file belongs to, then every profile's settings.json in it.
function profileSettings(settings) {
  let dir = path.dirname(settings);
  if (path.basename(path.dirname(dir)) === "profiles") dir = path.dirname(path.dirname(dir));
  const files = [path.join(dir, "settings.json")];
  try {
    for (const p of fs.readdirSync(path.join(dir, "profiles"))) files.push(path.join(dir, "profiles", p, "settings.json"));
  } catch (e) { /* no profiles */ }
  return files;
}

// `own` also removes Themepane's own settings, and `known` adds a settings file to start from
// (for Clean Up, which may run where no note was written). Returns the files changed.
function run(own = [], known = []) {
  const files = new Set();
  notes().map(revert).filter(Boolean).concat(known).forEach((s) => profileSettings(s).forEach((f) => files.add(f)));
  return Array.from(files).filter((f) => {
    const changed = edit(f, (text) => strip(text, [], own));
    if (changed) console.log("  colors removed: " + f);
    return changed;
  });
}

module.exports = { OWN, strip, run };
if (require.main === module) run();
