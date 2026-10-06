"use strict";

// The custom color panel, running in a webview. tint.js loads first and exports through `module`.
(() => {
  const vscode = acquireVsCodeApi();
  const tint = module.exports;
  const $ = (id) => document.getElementById(id);

  // The field spans what Themepane draws: backgrounds up to past the readable limit, accents
  // within tint.js's fill clamp (L 0.5–0.85, C ≤ 0.133). `strip` is the hue bar's L and C.
  const RANGES = {
    background: { L: [0.1, 0.56], C: 0.16, strip: [0.42, 0.1] },
    accent: { L: [0.5, 0.85], C: 0.133, strip: [0.7, 0.12] },
  };

  const lin = (v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  const luminance = (rgb) => 0.2126 * lin(rgb[0] / 255) + 0.7152 * lin(rgb[1] / 255) + 0.0722 * lin(rgb[2] / 255);
  const rgbOf = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  // Bar text is #cccccc; a frame lighter than LIMIT gives it less than 4.5:1.
  const BAR = luminance([204, 204, 204]);
  const LIMIT = (BAR + 0.05) / 4.5 - 0.05;
  const barContrast = (hex) => (BAR + 0.05) / (luminance(rgbOf(hex)) + 0.05);

  const field = $("field"), hueBar = $("hue"), hexBox = $("hex");
  let knob, range, presets = [];
  // The picked color: OKLCH intent (C may be out of gamut at this hue) and the hex it gives.
  let L = 0.4, C = 0.08, h = 250, hex = "#000000";
  let sent, drawnHue, frame;

  function setHex(value) {
    hex = value;
    const o = tint.toOklch(value);
    L = o.L;
    C = o.C;
    if (o.C > 0.002) h = o.h;
  }

  function fromField() {
    hex = tint.fromOklch(L, C, h);
  }

  function drawField() {
    const canvas = field.querySelector("canvas");
    const w = (canvas.width = Math.max(1, Math.round(field.clientWidth)));
    const ht = (canvas.height = Math.max(1, Math.round(field.clientHeight)));
    const g = canvas.getContext("2d");
    const img = g.createImageData(w, ht);
    const [lo, hi] = range.L;
    for (let y = 0; y < ht; y++) {
      const l = hi - (y / (ht - 1)) * (hi - lo);
      // Past the most colorful drawable shade, the row repeats it, as fromOklch clips.
      let edge = 0, out = range.C;
      for (let i = 0; i < 16; i++) {
        const mid = (edge + out) / 2;
        if (tint.rgbIn(l, mid, h)) edge = mid; else out = mid;
      }
      if (tint.rgbIn(l, range.C, h)) edge = range.C;
      for (let x = 0; x < w; x++) {
        const rgb = tint.rgbIn(l, Math.min(edge, (x / (w - 1)) * range.C), h);
        if (!rgb) continue;
        const i = (y * w + x) * 4;
        img.data[i] = rgb[0];
        img.data[i + 1] = rgb[1];
        img.data[i + 2] = rgb[2];
        img.data[i + 3] = knob === "background" && luminance(rgb) > LIMIT ? 70 : 255;
      }
    }
    g.putImageData(img, 0, 0);
    drawnHue = h;
  }

  function drawHue() {
    const canvas = hueBar.querySelector("canvas");
    const w = (canvas.width = Math.max(1, Math.round(hueBar.clientWidth)));
    canvas.height = 1;
    const g = canvas.getContext("2d");
    for (let x = 0; x < w; x++) {
      g.fillStyle = tint.fromOklch(range.strip[0], range.strip[1], (x / w) * 360);
      g.fillRect(x, 0, 1, 1);
    }
  }

  // Markers, readout and preview, once per frame however fast the pointer moves.
  function render() {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = null;
      if (drawnHue !== h) drawField();
      const [lo, hi] = range.L;
      const clamp = (v) => Math.min(1, Math.max(0, v));
      $("dot").style.left = clamp(C / range.C) * 100 + "%";
      $("dot").style.top = clamp((hi - L) / (hi - lo)) * 100 + "%";
      $("knob").style.left = (h / 360) * 100 + "%";
      $("swatch").style.background = hex;
      if (document.activeElement !== hexBox) hexBox.value = hex;
      hexBox.classList.remove("invalid");
      const preset = presets.find((p) => p.hex === hex);
      $("name").textContent = preset ? preset.name : "Custom";
      document.querySelectorAll(".presets button").forEach((b) => b.classList.toggle("on", b.dataset.hex === hex));
      if (knob === "background") {
        const ratio = barContrast(hex);
        $("note").textContent = "Bar text " + ratio.toFixed(1) + ":1" + (ratio < 4.5 ? ", hard to read" : "");
        $("note").classList.toggle("warn", ratio < 4.5);
      }
      if (hex !== sent) {
        sent = hex;
        vscode.postMessage({ type: "preview", hex });
      }
    });
  }

  // Click or drag: `move` maps the pointer to the color, as a fraction of the element's box.
  function drag(el, move) {
    const at = (e) => {
      const r = el.getBoundingClientRect();
      move(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)));
      fromField();
      render();
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
    C = x * range.C;
    L = range.L[1] - y * (range.L[1] - range.L[0]);
  });
  drag(hueBar, (x) => { h = x * 360; });

  // Arrows nudge the color; Shift takes bigger steps.
  function nudge(e, change) {
    const step = e.shiftKey ? 5 : 1;
    if (!change(step)) return;
    e.preventDefault();
    e.stopPropagation();
    fromField();
    render();
  }
  field.addEventListener("keydown", (e) => nudge(e, (step) => {
    const [lo, hi] = range.L;
    const dl = { ArrowUp: 1, ArrowDown: -1 }[e.key], dc = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (dl) L = Math.min(hi, Math.max(lo, L + (dl * step * (hi - lo)) / 60));
    if (dc) C = Math.min(range.C, Math.max(0, C + (dc * step * range.C) / 60));
    return dl || dc;
  }));
  hueBar.addEventListener("keydown", (e) => nudge(e, (step) => {
    const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (d) h = (h + d * step * 2 + 360) % 360;
    return d;
  }));

  hexBox.addEventListener("input", () => {
    // Six digits only, so typing #1f4a33 doesn't preview #11ff44 on the way.
    const value = /^#?[0-9a-f]{6}$/i.test(hexBox.value.trim()) && tint.normalizeHex(hexBox.value);
    hexBox.classList.toggle("invalid", !value && hexBox.value.trim().replace(/^#/, "").length >= 6);
    if (!value) return;
    setHex(value);
    render();
  });
  hexBox.addEventListener("blur", () => { hexBox.value = hex; hexBox.classList.remove("invalid"); });

  const apply = () => vscode.postMessage({ type: "apply", hex });
  const cancel = () => vscode.postMessage({ type: "cancel" });
  $("apply").addEventListener("click", apply);
  $("cancel").addEventListener("click", cancel);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") cancel();
    if (e.key === "Enter" && e.target.tagName !== "BUTTON") apply();
  });

  new ResizeObserver(() => {
    if (!range) return;
    drawHue();
    drawField();
    render();
  }).observe(field);

  window.addEventListener("message", ({ data }) => {
    if (data.type !== "init") return;
    knob = data.knob;
    range = RANGES[knob];
    presets = data.presets;
    $("title").textContent = data.title;
    $("hint").textContent = "Click or drag: the window shows the color as you go. Enter or Apply keeps it, Esc or Cancel goes back." +
      (knob === "background" ? " The faded top is too light for the bar text." : "");
    const list = $("presets");
    list.replaceChildren(...presets.map((p) => {
      const b = document.createElement("button");
      b.title = p.name;
      b.dataset.hex = p.hex;
      b.style.background = p.hex;
      b.addEventListener("click", () => { setHex(p.hex); render(); });
      return b;
    }));
    setHex(data.hex);
    sent = hex;
    drawHue();
    drawField();
    render();
    field.focus();
  });
  vscode.postMessage({ type: "ready" });
})();
