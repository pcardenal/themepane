"use strict";

// The custom color panel, running in a webview. tint.js loads first and exports through `module`.
// It edits the pair: the window it draws, the contrast it carries and both preset lists are all
// computed here from `colorsFor`, the same function the extension writes settings from.
(() => {
  const vscode = acquireVsCodeApi();
  const tint = module.exports;
  const $ = (id) => document.getElementById(id);

  // The field spans what Themepane draws: backgrounds up to past the readable limit, accents
  // within tint.js's fill clamp (L 0.5–0.85, C ≤ 0.133). `strip` is the hue rail's L and C.
  const RANGES = {
    background: { L: [0.1, 0.56], C: 0.16, strip: [0.42, 0.1] },
    accent: { L: [0.5, 0.85], C: 0.133, strip: [0.7, 0.12] },
  };

  const lin = (v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  const luminance = (rgb) => 0.2126 * lin(rgb[0] / 255) + 0.7152 * lin(rgb[1] / 255) + 0.0722 * lin(rgb[2] / 255);
  const rgbOf = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  function ratio(a, b) {
    const x = luminance(rgbOf(a)), y = luminance(rgbOf(b));
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  }
  // Bar text is #cccccc; a frame lighter than LIMIT gives it less than 4.5:1.
  const BAR = luminance([204, 204, 204]);
  const LIMIT = (BAR + 0.05) / 4.5 - 0.05;

  // A neutral background with no accent leaves the accent keys to the theme, so colorsFor
  // returns none: what the window would then wear is Dark 2026's own blue.
  const UNSET = {
    "button.background": "#297aa0",
    "button.foreground": "#ffffff",
    "textLink.foreground": "#48a0c7",
    "editorCursor.foreground": "#bbbebf",
    "editor.selectionBackground": "#276782dd",
  };
  const colorOf = (p, key) => p[key] || UNSET[key];

  const field = $("field"), hueBar = $("hue"), hexBox = $("hex");
  const scratch = document.createElement("canvas");

  let knob = "background";
  let presets = { background: [], accent: [] };
  let recents = { background: [], accent: [] };
  let defaultBackground = "#313336";
  // The live pair, and the OKLCH intent behind each (C may be out of gamut at that hue).
  const colors = { background: "#313336", accent: "#1b6cb2" };
  const coord = { background: { L: 0.4, C: 0.08, h: 250 }, accent: { L: 0.52, C: 0.11, h: 250 } };
  // Whether the accent is the workspace's own, or still follows the background.
  let accentSet = false;
  let sent, drawnHue, drawnKnob, frame, partnerTimer;

  const range = () => RANGES[knob];

  // The most colorful shade sRGB holds at this lightness and hue, capped at the range.
  function edgeC(L, h, cap) {
    if (tint.rgbIn(L, cap, h)) return cap;
    let lo = 0, hi = cap;
    for (let i = 0; i < 16; i++) {
      const mid = (lo + hi) / 2;
      if (tint.rgbIn(L, mid, h)) lo = mid; else hi = mid;
    }
    return lo;
  }
  const presetOf = (k, hex) => presets[k].find((p) => p.hex === hex);

  function setColor(k, hex) {
    colors[k] = hex;
    const o = tint.toOklch(hex);
    coord[k].L = o.L;
    coord[k].C = o.C;
    if (o.C > 0.002) coord[k].h = o.h;
  }

  // The accent the window wears when the workspace has none: the background's linked preset,
  // or the fill tint.js derives from the background's own hue.
  function impliedAccent() {
    const p = presetOf("background", colors.background);
    if (p && p.accent) return p.accent;
    return colorOf(tint.colorsFor(colors.background, null), "button.background");
  }

  function syncAccent() {
    if (!accentSet) setColor("accent", impliedAccent());
  }

  const accentArg = () => (accentSet ? colors.accent : presetOf("background", colors.background)?.accent || null);
  const palette = () => tint.colorsFor(colors.background, accentArg());

  function fromField() {
    const c = coord[knob];
    setColor(knob, tint.fromOklch(c.L, c.C, c.h));
    if (knob === "accent") accentSet = true;
    syncAccent();
  }

  // ---- the field -------------------------------------------------------------------------
  // Colors are generated at CSS resolution and scaled up; the faded region is then cut out
  // along a curve, so its edge is a line instead of the per-row staircase a threshold gives.
  function drawField() {
    const canvas = field.querySelector("canvas");
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.round(field.clientWidth));
    const ht = Math.max(1, Math.round(field.clientHeight));
    const r = range();
    const h = coord[knob].h;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(ht * dpr);
    const sw = Math.max(2, Math.ceil(w / 2));
    const sh = Math.max(2, Math.ceil(ht / 2));
    scratch.width = sw;
    scratch.height = sh;
    const sg = scratch.getContext("2d");
    const img = sg.createImageData(sw, sh);
    const lum = new Float32Array(sw * sh);
    const [lo, hi] = r.L;

    for (let y = 0; y < sh; y++) {
      const l = hi - (y / (sh - 1)) * (hi - lo);
      // Past the most colorful drawable shade, the row repeats it, as fromOklch clips.
      const edge = edgeC(l, h, r.C);
      for (let x = 0; x < sw; x++) {
        const rgb = tint.rgbIn(l, Math.min(edge, (x / (sw - 1)) * r.C), h) || tint.rgbIn(l, edge, h);
        if (!rgb) continue;
        const i = (y * sw + x) * 4;
        img.data[i] = rgb[0];
        img.data[i + 1] = rgb[1];
        img.data[i + 2] = rgb[2];
        img.data[i + 3] = 255;
        lum[y * sw + x] = luminance(rgb);
      }
    }
    sg.putImageData(img, 0, 0);

    const g = canvas.getContext("2d");
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, ht);
    g.drawImage(scratch, 0, 0, w, ht);
    if (knob === "background") fade(g, lum, sw, sh, w / sw, ht / sh);
    drawnHue = h;
    drawnKnob = knob;
  }

  // Thin the rows whose color leaves #cccccc under 4.5:1. The boundary crosses between two
  // rows, so each column keeps its fraction and the cut follows one smooth curve.
  function fade(g, lum, w, ht, scaleX, scaleY) {
    const edgeY = new Float64Array(w);
    for (let x = 0; x < w; x++) {
      let y = 0;
      while (y < ht && lum[y * w + x] > LIMIT) y++;
      if (y === 0 || y >= ht) { edgeY[x] = y === 0 ? 0 : ht; continue; }
      const above = lum[(y - 1) * w + x], below = lum[y * w + x];
      const t = above === below ? 0 : (above - LIMIT) / (above - below);
      edgeY[x] = y - 1 + Math.min(1, Math.max(0, t));
    }
    g.save();
    g.globalCompositeOperation = "destination-out";
    g.beginPath();
    g.moveTo(0, edgeY[0] * scaleY);
    for (let x = 0; x < w; x++) g.lineTo((x + 0.5) * scaleX, edgeY[x] * scaleY);
    g.lineTo(w * scaleX, edgeY[w - 1] * scaleY);
    g.lineTo(w * scaleX, 0);
    g.lineTo(0, 0);
    g.closePath();
    // destination-out keeps 1 - alpha of what is there: 0.725 leaves the old 70/255.
    g.fillStyle = "rgba(0,0,0,0.725)";
    g.fill();
    g.restore();
  }

  function drawHue() {
    const canvas = hueBar.querySelector("canvas");
    const ht = Math.max(1, Math.round(hueBar.clientHeight));
    canvas.width = 1;
    canvas.height = ht;
    const g = canvas.getContext("2d");
    const [L, C] = range().strip;
    for (let y = 0; y < ht; y++) {
      g.fillStyle = tint.fromOklch(L, C, (y / ht) * 360);
      g.fillRect(0, y, 1, 1);
    }
    $("ticks").replaceChildren(...presets[knob].map((p) => {
      const o = tint.toOklch(p.hex);
      if (o.C <= 0.02) return null;
      const i = document.createElement("i");
      i.style.top = (o.h / 360) * 100 + "%";
      return i;
    }).filter(Boolean));
  }

  // ---- the pair, drawn -------------------------------------------------------------------
  function pairName() {
    const bg = presetOf("background", colors.background);
    const ac = presetOf("accent", colors.accent);
    const bgName = bg ? bg.name : "Custom";
    if (!accentSet || colors.accent === impliedAccent()) return bgName;
    return bgName + " · " + (ac ? ac.name : "Custom");
  }

  function paintWindow(p) {
    const frameColor = p["titleBar.activeBackground"];
    const pane = p["editor.background"];
    const set = (id, style) => Object.assign($(id).style, style);
    set("w-bar", { background: frameColor, color: "#cccccc" });
    set("w-tabs", { background: frameColor });
    set("w-tab-a", { background: p["modernEditorTab.activeBackground"] || p["tab.activeBackground"], color: "#cccccc" });
    set("w-tab-b", { background: "transparent", color: "#b5b5b5" });
    set("w-side", { background: pane });
    set("w-edit", { background: pane });
    set("w-sel", { background: p["list.inactiveSelectionBackground"] });
    set("w-caret", { background: colorOf(p, "editorCursor.foreground") });
    set("w-selbar", { background: colorOf(p, "editor.selectionBackground") });
    set("w-btn", { background: colorOf(p, "button.background"), color: colorOf(p, "button.foreground") });
    set("w-status", { background: frameColor, color: "#cccccc" });
    $("w-title").textContent = pairName();
    $("w-statustext").textContent = pairName();
  }

  // ---- partners --------------------------------------------------------------------------
  // Backgrounds suggest accents, accents suggest the backgrounds that link to them. Both come
  // from the preset lists and from colorsFor, never from a judgement made here.
  const hueGap = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };

  function family(hex) {
    const o = tint.toOklch(hex);
    if (o.C <= 0.02) return "Neutral";
    if (o.L > 0.82) return "Pearl";
    if (o.L > 0.65) return "Light";
    return o.C < 0.085 ? "Dusty" : "Saturated";
  }

  function accentPartners() {
    const near = presets.background.reduce((best, p) => {
      const o = tint.toOklch(p.hex), b = tint.toOklch(colors.background);
      const d = Math.hypot(o.L - b.L, o.C - b.C) + hueGap(o.h, b.h) / 900;
      return !best || d < best.d ? { p, d } : best;
    }, null);
    const bgHue = tint.toOklch(colors.background).h;
    const pane = tint.colorsFor(colors.background, null)["editor.background"];
    const out = [];
    const add = (hex) => {
      if (!hex || out.some((o) => o.hex === hex)) return false;
      const ink = colorOf(tint.colorsFor(colors.background, hex), "textLink.foreground");
      if (ratio(pane, ink) < 4.5) return false;
      const p = presetOf("accent", hex);
      out.push({ hex, name: p ? p.name : "Custom", swatch: hex });
      return true;
    };
    if (near && near.p.accent) add(near.p.accent);
    const opposite = (bgHue + 180) % 360;
    for (const fam of ["Saturated", "Light", "Pearl"]) {
      const sorted = presets.accent
        .filter((p) => family(p.hex) === fam)
        .sort((a, b) => hueGap(tint.toOklch(a.hex).h, opposite) - hueGap(tint.toOklch(b.hex).h, opposite));
      for (const p of sorted) if (add(p.hex)) break;
    }
    return out.slice(0, 4);
  }

  function backgroundPartners() {
    const near = presets.accent.reduce((best, p) => {
      const o = tint.toOklch(p.hex), a = tint.toOklch(colors.accent);
      const d = Math.hypot(o.L - a.L, o.C - a.C) + hueGap(o.h, a.h) / 900;
      return !best || d < best.d ? { p, d } : best;
    }, null);
    if (!near) return [];
    return presets.background
      .filter((p) => p.accent === near.p.hex)
      .slice(0, 4)
      .map((p) => ({ hex: p.hex, name: p.name, swatch: p.hex }));
  }

  function refreshPartners() {
    const other = knob === "background" ? "accent" : "background";
    const list = knob === "background" ? accentPartners() : backgroundPartners();
    $("partners-box").hidden = !list.length;
    $("partners").replaceChildren(...list.map((item) => {
      const b = document.createElement("button");
      b.className = "partner";
      b.type = "button";
      const dot = document.createElement("i");
      dot.style.background = item.swatch;
      b.append(dot, document.createTextNode(item.name));
      b.addEventListener("click", () => {
        if (other === "accent") accentSet = true;
        setColor(other, item.hex);
        syncAccent();
        render();
        schedulePartners();
      });
      return b;
    }));
  }

  function schedulePartners() {
    clearTimeout(partnerTimer);
    partnerTimer = setTimeout(refreshPartners, 140);
  }

  // ---- presets and recents ---------------------------------------------------------------
  const BG_GROUPS = [
    { label: "Default", of: (p) => p.hex === defaultBackground },
    { label: "Colors", of: (p) => tint.toOklch(p.hex).C >= 0.045 },
    { label: "Muted", of: (p) => tint.toOklch(p.hex).C > 0.002 },
    { label: "Black", of: () => true },
  ];
  const AC_GROUPS = ["Saturated", "Dusty", "Light", "Pearl", "Neutral"].map((label) => ({ label }));

  function groupsFor(k) {
    if (k === "accent") {
      return AC_GROUPS
        .map((g) => ({ ...g, items: presets.accent.filter((p) => family(p.hex) === g.label) }))
        .filter((g) => g.items.length);
    }
    const left = presets.background.slice();
    return BG_GROUPS.map((g) => {
      const items = [];
      for (let i = left.length - 1; i >= 0; i--) if (g.of(left[i])) items.unshift(left.splice(i, 1)[0]);
      return { ...g, items };
    }).filter((g) => g.items.length);
  }

  function swatchButton(p) {
    const b = document.createElement("button");
    b.type = "button";
    b.title = p.name ? p.name + " " + p.hex : p.hex;
    b.dataset.hex = p.hex;
    b.style.background = p.hex;
    b.addEventListener("click", () => {
      if (knob === "accent") accentSet = true;
      setColor(knob, p.hex);
      syncAccent();
      render();
      schedulePartners();
    });
    return b;
  }

  function buildPresets() {
    $("groups").replaceChildren(...groupsFor(knob).map((g) => {
      const box = document.createElement("div");
      box.className = "line";
      const label = document.createElement("span");
      label.className = "tag";
      label.textContent = g.label;
      const row = document.createElement("div");
      row.className = "items sw";
      row.append(...g.items.map(swatchButton));
      box.append(label, row);
      return box;
    }));
    const list = recents[knob] || [];
    $("recents-box").hidden = !list.length;
    $("recents").replaceChildren(...list.map((hex) => swatchButton({ hex, name: presetOf(knob, hex)?.name })));
  }

  // ---- render ----------------------------------------------------------------------------
  function render() {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = null;
      const c = coord[knob], r = range();
      if (drawnHue !== c.h || drawnKnob !== knob) drawField();
      const [lo, hi] = r.L;
      const clamp = (v) => Math.min(1, Math.max(0, v));
      const hex = colors[knob];
      $("dot").style.left = clamp(c.C / r.C) * 100 + "%";
      $("dot").style.top = clamp((hi - c.L) / (hi - lo)) * 100 + "%";
      $("knob").style.top = (c.h / 360) * 100 + "%";
      $("swatch").style.background = hex;
      $("chip-background").style.background = colors.background;
      $("chip-accent").style.background = colors.accent;
      if (document.activeElement !== hexBox) hexBox.value = hex;
      hexBox.classList.remove("invalid");
      $("coords").textContent = "L " + c.L.toFixed(2) + " · C " + c.C.toFixed(3) + " · H " + Math.round(c.h) + "°";
      const preset = presetOf(knob, hex);
      $("name").textContent = preset ? preset.name : "Custom";
      document.querySelectorAll(".sw button").forEach((b) => b.classList.toggle("on", b.dataset.hex === hex));

      paintWindow(palette());
      const faded = knob === "background" && ratio(colors.background, "#cccccc") < 4.5;
      $("fade-note").textContent = knob !== "background" ? ""
        : faded ? "This one is in the faded band, where the bar text gets hard to read."
        : "Colors in the faded band make the bar text harder to read.";
      $("fade-note").classList.toggle("warn", faded);

      const signature = colors.background + (accentSet ? colors.accent : "");
      if (signature !== sent) {
        sent = signature;
        vscode.postMessage({ type: "preview", background: colors.background, accent: accentSet ? colors.accent : null });
      }
    });
  }

  // ---- input -----------------------------------------------------------------------------
  // Click or drag: `move` maps the pointer to the color, as a fraction of the element's box.
  function drag(el, move) {
    const at = (e) => {
      const r = el.getBoundingClientRect();
      move(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)));
      fromField();
      render();
      schedulePartners();
    };
    el.addEventListener("pointerdown", (e) => {
      el.setPointerCapture(e.pointerId);
      el.focus();
      at(e);
    });
    el.addEventListener("pointermove", (e) => {
      if (el.hasPointerCapture(e.pointerId)) at(e);
    });
  }

  drag(field, (x, y) => {
    const r = range();
    coord[knob].C = x * r.C;
    coord[knob].L = r.L[1] - y * (r.L[1] - r.L[0]);
  });
  drag(hueBar, (_x, y) => { coord[knob].h = Math.min(359.9, y * 360); });

  // Arrows nudge the color; Shift takes bigger steps.
  function nudge(e, change) {
    const step = e.shiftKey ? 5 : 1;
    if (!change(step)) return;
    e.preventDefault();
    e.stopPropagation();
    fromField();
    render();
    schedulePartners();
  }
  field.addEventListener("keydown", (e) => nudge(e, (step) => {
    const r = range(), c = coord[knob];
    const [lo, hi] = r.L;
    const dl = { ArrowUp: 1, ArrowDown: -1 }[e.key], dc = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (dl) c.L = Math.min(hi, Math.max(lo, c.L + (dl * step * (hi - lo)) / 60));
    if (dc) c.C = Math.min(r.C, Math.max(0, c.C + (dc * step * r.C) / 60));
    return dl || dc;
  }));
  hueBar.addEventListener("keydown", (e) => nudge(e, (step) => {
    const d = { ArrowDown: 1, ArrowUp: -1 }[e.key];
    if (d) coord[knob].h = (coord[knob].h + d * step * 2 + 360) % 360;
    return d;
  }));

  hexBox.addEventListener("input", () => {
    // Six digits only, so typing #1f4a33 doesn't preview #11ff44 on the way.
    const value = /^#?[0-9a-f]{6}$/i.test(hexBox.value.trim()) && tint.normalizeHex(hexBox.value);
    hexBox.classList.toggle("invalid", !value && hexBox.value.trim().replace(/^#/, "").length >= 6);
    if (!value) return;
    if (knob === "accent") accentSet = true;
    setColor(knob, value);
    syncAccent();
    render();
    schedulePartners();
  });
  hexBox.addEventListener("blur", () => { hexBox.value = colors[knob]; hexBox.classList.remove("invalid"); });

  function showKnob(next) {
    knob = next;
    $("tab-background").setAttribute("aria-selected", String(next === "background"));
    $("tab-accent").setAttribute("aria-selected", String(next === "accent"));
    field.setAttribute("aria-label", (next === "background" ? "Background" : "Accent") + " lightness and colorfulness");
    drawHue();
    buildPresets();
    render();
    refreshPartners();
  }
  $("tab-background").addEventListener("click", () => showKnob("background"));
  $("tab-accent").addEventListener("click", () => showKnob("accent"));

  const apply = () => vscode.postMessage({
    type: "apply",
    background: colors.background,
    accent: accentSet ? colors.accent : null,
  });
  const cancel = () => vscode.postMessage({ type: "cancel" });
  $("apply").addEventListener("click", apply);
  $("cancel").addEventListener("click", cancel);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") cancel();
    if (e.key === "Enter" && e.target.tagName !== "BUTTON") apply();
  });

  new ResizeObserver(() => {
    if (!presets.background.length) return;
    drawHue();
    drawField();
    render();
  }).observe(field);

  window.addEventListener("message", ({ data }) => {
    if (data.type !== "init") return;
    presets = data.presets;
    recents = data.recents || { background: [], accent: [] };
    defaultBackground = data.defaultBackground;
    $("title").textContent = data.title;
    accentSet = !!data.accent;
    setColor("background", data.background);
    setColor("accent", data.accent || impliedAccent());
    sent = colors.background + (accentSet ? colors.accent : "");
    showKnob(data.knob);
    field.focus();
  });
  vscode.postMessage({ type: "ready" });
})();
