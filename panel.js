"use strict";

// The custom color panel: one wheel for the pair. The background is the outer ring and the
// accent the disc inside it, angle is hue and radius is chroma; lightness rides two arcs that
// follow the circle. Which knob you are editing is wherever your pointer is, so there is no
// switch. Presets are plotted as dots you can tap, and the toggle hides them.
(() => {
  const vscode = acquireVsCodeApi();
  const tint = module.exports;
  const $ = (id) => document.getElementById(id);

  const RANGES = {
    background: { L: [0.1, 0.56], C: 0.16, strip: [0.42, 0.1] },
    accent: { L: [0.5, 0.85], C: 0.133, strip: [0.7, 0.12] },
  };
  const UNSET = {
    "button.background": "#297aa0", "button.foreground": "#ffffff",
    "textLink.foreground": "#48a0c7", "editorCursor.foreground": "#bbbebf",
    "editor.selectionBackground": "#276782dd", "activityBar.activeBorder": "#0078d4",
  };
  const colorOf = (p, k) => p[k] || UNSET[k];

  const lin = (v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  const luminance = (rgb) => 0.2126 * lin(rgb[0] / 255) + 0.7152 * lin(rgb[1] / 255) + 0.0722 * lin(rgb[2] / 255);
  const rgbOf = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const ratio = (a, b) => {
    const x = luminance(rgbOf(a)), y = luminance(rgbOf(b));
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  };
  const BAR = luminance([204, 204, 204]);
  const LIMIT = (BAR + 0.05) / 4.5 - 0.05;
  const hueGap = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
  // Only true achromatics: Driftwood sits at C 0.0196 and is a real muted colour with a hue.
  const NEUTRAL = 0.012;
  const isNeutral = (hex) => tint.toOklch(hex).C <= NEUTRAL;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  const KNOBS = ["background", "accent"];
  const hexBox = (k) => $("hex-" + k);

  let knob = "background";
  let presets = { background: [], accent: [] };
  let recents = { background: [], accent: [] };
  let defaultBackground = "#313336";
  const colors = { background: "#313336", accent: "#1b6cb2" };
  const coord = { background: { L: 0.4, C: 0.08, h: 250 }, accent: { L: 0.52, C: 0.11, h: 250 } };
  let accentSet = false;
  let sent, frame, sugTimer;

  const range = (k) => RANGES[k || knob];

  // Every point in the field and the disc has to land on a distinct colour, so chroma is read
  // as a fraction of what sRGB actually holds here rather than as an absolute capped value.
  function edgeC(L, h, cap) {
    if (tint.rgbIn(L, cap, h)) return cap;
    let lo = 0, hi = cap;
    for (let i = 0; i < 16; i++) { const m = (lo + hi) / 2; if (tint.rgbIn(L, m, h)) lo = m; else hi = m; }
    return lo;
  }
  const edgeOf = (k) => edgeC(coord[k].L, coord[k].h, range(k).C);
  // Where #cccccc drops under 4.5:1, as a lightness.
  function contrastL(h, r) {
    for (let i = 0; i <= 80; i++) {
      const L = r.L[1] - (i / 80) * (r.L[1] - r.L[0]);
      const c = tint.rgbIn(L, 0, h);
      if (c && luminance(c) <= LIMIT) return L;
    }
    return r.L[0];
  }
  const presetOf = (k, hex) => presets[k].find((p) => p.hex === hex);

  function setColor(k, hex) {
    colors[k] = hex;
    const o = tint.toOklch(hex);
    coord[k].L = o.L;
    coord[k].C = o.C;
    if (o.C > 0.002) coord[k].h = o.h;
  }
  function impliedAccent() {
    const p = presetOf("background", colors.background);
    if (p && p.accent) return p.accent;
    return colorOf(tint.colorsFor(colors.background, null), "button.background");
  }
  const syncAccent = () => { if (!accentSet) setColor("accent", impliedAccent()); };
  const accentArg = () => (accentSet ? colors.accent : (presetOf("background", colors.background) || {}).accent || null);
  const palette = () => tint.colorsFor(colors.background, accentArg());

  // Commit the OKLCH intent for a knob back to a hex.
  function commit(k) {
    const c = coord[k];
    c.C = Math.min(c.C, edgeC(c.L, c.h, range(k).C));
    setColor(k, tint.fromOklch(c.L, c.C, c.h));
    if (k === "accent") accentSet = true;
    syncAccent();
    render();
    scheduleSug();
  }

  function family(hex) {
    const o = tint.toOklch(hex);
    if (o.C <= NEUTRAL) return "Neutral";
    if (o.L > 0.82) return "Pearl";
    if (o.L > 0.65) return "Light";
    return o.C < 0.085 ? "Dusty" : "Saturated";
  }

  function accentSuggestions() {
    const b = tint.toOklch(colors.background);
    const near = presets.background.reduce((best, p) => {
      const o = tint.toOklch(p.hex);
      const d = Math.hypot(o.L - b.L, o.C - b.C) + hueGap(o.h, b.h) / 900;
      return !best || d < best.d ? { p, d } : best;
    }, null);
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
    const opposite = (b.h + 180) % 360;
    const fams = ["Saturated", "Dusty", "Light", "Pearl"].map((fam) => presets.accent
      .filter((p) => family(p.hex) === fam)
      .sort((x, y) => hueGap(tint.toOklch(x.hex).h, opposite) - hueGap(tint.toOklch(y.hex).h, opposite)));
    // one from each family first, so the eight read as a spread, then a second from each
    for (let round = 0; round < 2; round++) {
      for (const sorted of fams) for (const p of sorted) if (add(p.hex)) break;
    }
    return out.slice(0, 8);
  }

  function drawSuggestions() {
    const other = "accent";
    const list = accentSuggestions();
    $("sug-box").hidden = !list.length;
    $("sug").replaceChildren(...list.map((item) => {
      const b = document.createElement("button");
      b.className = "sug";
      b.type = "button";
      const i = document.createElement("i");
      i.style.background = item.swatch;
      b.append(i, document.createTextNode(item.name));
      b.addEventListener("click", () => {
        if (other === "accent") accentSet = true;
        setColor(other, item.hex);
        syncAccent();
        render();
        scheduleSug();
      });
      return b;
    }));
  }
  function scheduleSug() { clearTimeout(sugTimer); sugTimer = setTimeout(drawSuggestions, 140); }

  // ---- the window this pair draws -------------------------------------------------------
  function paintWindow(p) {
    const vars = {
      frame: p["titleBar.activeBackground"],
      pane: p["editor.background"],
      sel: p["list.inactiveSelectionBackground"],
      mark: colorOf(p, "activityBar.activeBorder"),
      ink: colorOf(p, "textLink.foreground"),
      caret: colorOf(p, "editorCursor.foreground"),
      selbg: colorOf(p, "editor.selectionBackground"),
      fill: colorOf(p, "button.background"),
      fillText: colorOf(p, "button.foreground"),
    };
    for (const k in vars) $("win").style.setProperty("--" + k, vars[k]);
    const bg = presetOf("background", colors.background);
    const ac = presetOf("accent", colors.accent);
    const name = (bg ? bg.name : "Custom")
      + (!accentSet || colors.accent === impliedAccent() ? "" : " · " + (ac ? ac.name : "Custom"));
    $("w-title").textContent = name;
    $("w-sttext").textContent = name;
  }

  // ---- shared field painter (half resolution, scaled up) --------------------------------
  const scratch = document.createElement("canvas");
  function paintField(canvas, k, hue) {
    const r = range(k);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.round(canvas.clientWidth));
    const ht = Math.max(1, Math.round(canvas.clientHeight));
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(ht * dpr);
    const sw = Math.max(2, Math.ceil(w / 2)), sh = Math.max(2, Math.ceil(ht / 2));
    scratch.width = sw; scratch.height = sh;
    const sg = scratch.getContext("2d");
    const img = sg.createImageData(sw, sh);
    const lum = new Float32Array(sw * sh);
    const [lo, hi] = r.L;
    for (let y = 0; y < sh; y++) {
      const l = hi - (y / (sh - 1)) * (hi - lo);
      let edge = 0, out = r.C;
      if (tint.rgbIn(l, r.C, hue)) edge = r.C;
      else for (let i = 0; i < 16; i++) { const m = (edge + out) / 2; if (tint.rgbIn(l, m, hue)) edge = m; else out = m; }
      for (let x = 0; x < sw; x++) {
        const rgb = tint.rgbIn(l, (x / (sw - 1)) * edge, hue) || tint.rgbIn(l, edge, hue);
        if (!rgb) continue;
        const i = (y * sw + x) * 4;
        img.data[i] = rgb[0]; img.data[i + 1] = rgb[1]; img.data[i + 2] = rgb[2]; img.data[i + 3] = 255;
        lum[y * sw + x] = luminance(rgb);
      }
    }
    sg.putImageData(img, 0, 0);
    const g = canvas.getContext("2d");
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, ht);
    g.drawImage(scratch, 0, 0, w, ht);
    if (k === "background") { fade(g, lum, sw, sh, w / sw, ht / sh); contrastMark(g, w, ht, k, hue); }
  }
  function fade(g, lum, w, ht, sx, sy) {
    const edgeY = new Float64Array(w);
    for (let x = 0; x < w; x++) {
      let y = 0;
      while (y < ht && lum[y * w + x] > LIMIT) y++;
      if (y === 0 || y >= ht) { edgeY[x] = y === 0 ? 0 : ht; continue; }
      const a = lum[(y - 1) * w + x], b = lum[y * w + x];
      edgeY[x] = y - 1 + clamp(a === b ? 0 : (a - LIMIT) / (a - b), 0, 1);
    }
    g.save();
    g.globalCompositeOperation = "destination-out";
    g.beginPath();
    g.moveTo(0, edgeY[0] * sy);
    for (let x = 0; x < w; x++) g.lineTo((x + 0.5) * sx, edgeY[x] * sy);
    g.lineTo(w * sx, edgeY[w - 1] * sy);
    g.lineTo(w * sx, 0);
    g.lineTo(0, 0);
    g.closePath();
    g.fillStyle = "rgba(0,0,0,0.34)";
    g.fill();
    g.restore();
  }

  // The contrast boundary, drawn on the field as a line you can still pick across.
  function contrastMark(g, w, ht, k, hue) {
    if (k !== "background") return;
    const r = range(k);
    const L = contrastL(hue, r);
    const y = ((r.L[1] - L) / (r.L[1] - r.L[0])) * ht;
    g.save();
    g.setLineDash([5, 4]);
    g.strokeStyle = "#ffffffcc";
    g.lineWidth = 1;
    g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke();
    g.setLineDash([]);
    g.font = "10px " + getComputedStyle(document.body).fontFamily;
    g.fillStyle = "#ffffffdd";
    g.textAlign = "right";
    g.fillText("4.5:1 bar text", w - 8, y - 5);
    g.textAlign = "left";
    g.restore();
  }

  // Click or drag anywhere: `move` gets the pointer as a fraction of the element's box, and
  // `up` fires when the gesture ends, so what the press grabbed can be held until then.
  function drag(el, move, up) {
    const at = (e, down) => {
      const r = el.getBoundingClientRect();
      move((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height, down);
    };
    const end = () => { if (up) up(); };
    el.addEventListener("pointerdown", (e) => { el.setPointerCapture(e.pointerId); el.classList.add("tapped"); el.focus(); at(e, true); });
    el.addEventListener("keydown", () => el.classList.remove("tapped"));
    el.addEventListener("pointermove", (e) => { if (el.hasPointerCapture(e.pointerId)) at(e, false); });
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
  }

  // =======================================================================================
  // 05 · Two Rings — background is the outer ring, accent the disc inside it. Lightness rides
  // two arcs that follow the circle; the two preset lists flank it, so there are no tabs.
  // =======================================================================================
  const Rings = {
    // Everything is derived from one square so the hit test and the drawing cannot drift.
    geom(size) {
      const c = size / 2;
      const R = size * 0.405;
      const arcW = clamp(size * 0.028, 8, 15);
      // the handle is a circle on the arc, so the track sits a handle's radius in from the box
      const hR = arcW / 2 + 3.5;
      // each arc is named above it, so the track comes in far enough for that line of type
      const aLab = clamp(size * 0.0165, 8.5, 11.5);
      // the gap has to survive the edge feathering at half resolution, or the two bodies merge
      return { c, R, rIn: R * 0.68, rOut: R, dOut: R * 0.52, Ra: c - hR - 2 - aLab * 1.15, arcW, hR, aLab };
    },
    ARCS: {
      background: { from: 200, to: 340 },
      accent: { from: 20, to: 160 },
    },
    // The arc track as one rounded capsule, used as a clip so the colour bands keep its ends.
    // `round` turns either end into a straight radial edge, for a stretch of the track.
    capsule(g, c, Ra, a0, a1, w, round) {
      const hw = w / 2;
      const at = (a, r) => [c + Math.cos(a) * r, c + Math.sin(a) * r];
      const s0 = at(a0, Ra), s1 = at(a1, Ra);
      g.beginPath();
      g.arc(c, c, Ra + hw, a0, a1);
      if (!round || round[1]) g.arc(s1[0], s1[1], hw, a1, a1 + Math.PI);
      g.arc(c, c, Ra - hw, a1, a0, true);
      if (!round || round[0]) g.arc(s0[0], s0[1], hw, a0 + Math.PI, a0 + Math.PI * 2);
      g.closePath();
    },
    // A soft white halo, the same on every side, so each body lifts off the page. The shape is
    // drawn off-canvas and only its shadow is offset back into place, so nothing but the halo lands.
    glow(g, size, path) {
      const off = size * 3;
      g.save();
      g.shadowColor = "#ffffff26";
      g.shadowBlur = clamp(size * 0.019, 7, 13);
      // the offset is in device units while the translate goes through the transform, so it is
      // scaled by the same amount here, or the shadow lands off-canvas on a hi-dpi screen
      g.shadowOffsetX = off * g.getTransform().a;
      g.fillStyle = "#000";
      g.translate(-off, 0);
      path();
      g.fill();
      g.restore();
    },

    // A label's type and its soft drop shadow, shared by the flat and the curved ones.
    label(g, px, color, alpha) {
      g.font = "600 " + px.toFixed(1) + "px " + getComputedStyle(document.body).fontFamily;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.globalAlpha = alpha === undefined ? 1 : alpha;
      g.fillStyle = color;
      g.shadowColor = "#000000b0";
      g.shadowBlur = px * 0.85;
      g.shadowOffsetY = px * 0.12;
    },
    // Text following the circle, centred on `deg`. `o.inward` points the letters' tops at the
    // centre, for the lower half; `o.max` is the arc length it has to fit in.
    curveText(g, c, R, deg, text, o) {
      const chars = Array.from(text);
      g.save();
      this.label(g, o.px, o.color, o.alpha);
      const sp = o.px * 0.16;
      const w = chars.map((ch) => g.measureText(ch).width);
      const total = w.reduce((a, b) => a + b, 0) + sp * (chars.length - 1);
      if (o.max && total > o.max) { g.restore(); return; }
      const dir = o.inward ? -1 : 1;
      let a = (deg - 90) * Math.PI / 180 - (dir * total) / (2 * R);
      for (let i = 0; i < chars.length; i++) {
        a += (dir * w[i]) / (2 * R);
        g.save();
        g.translate(c + Math.cos(a) * R, c + Math.sin(a) * R);
        g.rotate(a + (dir * Math.PI) / 2);
        g.fillText(chars[i], 0, 0);
        g.restore();
        a += (dir * (w[i] / 2 + sp)) / R;
      }
      g.restore();
    },
    // The track, drawn exactly across the arc.
    span(k) {
      const a = this.ARCS[k];
      return [a.from, a.to > a.from ? a.to : a.to + 360];
    },
    // The handle's travel: inset at both ends by how far it overhangs the track, so at the
    // limits it sits flush inside the rounded end instead of pushing the track outward.
    hspan(k) {
      const [from, to] = this.span(k), g = this.geom(this.lastSize);
      const ins = ((g.hR - g.arcW / 2) / g.Ra) * 180 / Math.PI;
      return [from + ins, to - ins];
    },
    arcL(k, deg) {
      const [from, to] = this.hspan(k), r = range(k);
      const t = clamp((deg - from) / (to - from), 0, 1);
      return r.L[1] - t * (r.L[1] - r.L[0]);
    },
    // An angle outside the arc sticks to whichever end is nearer round the circle, so dragging
    // past the top of a slider holds it at the top instead of flipping to the bottom.
    clampArcDeg(k, deg) {
      const [from, to] = this.hspan(k);
      const d = (((deg - from) % 360) + 360) % 360;
      if (d <= to - from) return from + d;
      return d - (to - from) < 360 - d ? to : from;
    },
    arcPoint(k, L) {
      const [from, to] = this.hspan(k), r = range(k);
      const t = (r.L[1] - L) / (r.L[1] - r.L[0]);
      return (from + t * (to - from) - 90) * Math.PI / 180;
    },
    inArc(k, deg, pad) {
      const [from, to] = this.span(k);
      let d = deg;
      if (d < from - pad) d += 360;
      return d >= from - pad && d <= to + pad;
    },

    showPresets: true,
    dots: [],
    lastSize: 320,
    // what the press grabbed: the whole drag stays on it, so a slipping cursor can't switch knob
    held: null,
    // which body the pointer is over, so that one's label can step aside, and how far each
    // label has faded towards that (1 = fully shown)
    hover: null,
    fade: { background: 1, accent: 1 },
    anim: null,

    // Which body a point in the element's box falls on, in units of the half-size.
    bodyAt(rad) {
      const u = this.geom(this.lastSize), c = u.c;
      if (rad <= u.dOut / c) return "accent";
      return rad >= u.rIn / c && rad <= u.rOut / c ? "background" : null;
    },
    setHover(h) {
      if (h === this.hover) return;
      this.hover = h;
      this.animate();
    },
    // Ease both labels towards their targets, framerate-independent, until they settle.
    animate() {
      if (this.anim) return;
      let last = performance.now();
      const tick = (now) => {
        const dt = Math.min(64, now - last);
        last = now;
        let moving = false;
        for (const k of ["background", "accent"]) {
          const to = this.hover === k ? 0 : 1, d = to - this.fade[k];
          if (Math.abs(d) < 0.005) { this.fade[k] = to; continue; }
          this.fade[k] += d * (1 - Math.exp(-dt / 90));
          moving = true;
        }
        this.draw();
        this.anim = moving ? requestAnimationFrame(tick) : null;
      };
      this.anim = requestAnimationFrame(tick);
    },

    build() {
      $("presets").hidden = true;
      $("surface").innerHTML =
        '<div class="hit" id="r-disc" tabindex="0" style="width:100%;max-width:680px;margin:0 auto;aspect-ratio:1/1">'
        + '<canvas style="width:100%;height:100%"></canvas></div>';
      const t = $("r-toggle");
      t.setAttribute("aria-checked", String(this.showPresets));
      t.addEventListener("click", () => {
        this.showPresets = !this.showPresets;
        t.setAttribute("aria-checked", String(this.showPresets));
        render();
      });
      drag($("r-disc"), (x, y, down) => {
        const dx = x - 0.5, dy = y - 0.5;
        const rad = Math.hypot(dx, dy) * 2;
        const deg = (Math.atan2(dy, dx) * 180 / Math.PI + 450) % 360;
        const u = this.geom(this.lastSize), c = u.c;
        const RING_OUT = u.rOut / c, RING_IN = u.rIn / c, DISC_OUT = u.dOut / c;
        const ARC_IN = (RING_OUT + (u.Ra - u.hR) / c) / 2;
        const padDeg = (u.hR / u.Ra) * 180 / Math.PI;
        if (down) {
          this.held = null;
          // a tap on a preset dot takes that preset exactly
          if (this.showPresets) {
            const px = x * this.lastSize, py = y * this.lastSize;
            let best = null;
            for (const d of this.dots) {
              const dist = Math.hypot(d.x - px, d.y - py);
              if (dist <= u.hR && (!best || dist < best.dist)) best = { d, dist };
            }
            if (best) {
              if (best.d.k !== knob) showKnob(best.d.k);
              pick(best.d.hex);
              return;
            }
          }
          if (rad > ARC_IN) {
            for (const k of ["background", "accent"]) {
              if (this.inArc(k, deg, padDeg)) { this.held = { arc: true, k }; break; }
            }
          } else {
            this.held = { arc: false, k: rad > (RING_IN + DISC_OUT) / 2 ? "background" : "accent" };
          }
        }
        const h = this.held;
        if (!h) return;
        this.setHover(h.arc ? null : h.k);
        if (h.k !== knob) showKnob(h.k);
        if (h.arc) {
          coord[h.k].L = this.arcL(h.k, this.clampArcDeg(h.k, deg));
          commit(h.k);
          return;
        }
        const cc = coord[h.k];
        cc.h = deg;
        const frac = h.k === "background"
          ? clamp((rad - RING_IN) / (RING_OUT - RING_IN), 0, 1)
          : clamp(rad / DISC_OUT, 0, 1);
        cc.C = frac * edgeC(cc.L, deg, range(h.k).C);
        commit(h.k);
      }, () => { this.held = null; });
      const host = $("r-disc");
      host.addEventListener("pointermove", (e) => {
        if (host.hasPointerCapture(e.pointerId)) return;
        const b = host.getBoundingClientRect();
        const rad = Math.hypot((e.clientX - b.left) / b.width - 0.5, (e.clientY - b.top) / b.height - 0.5) * 2;
        this.setHover(this.bodyAt(rad));
      });
      host.addEventListener("pointerleave", () => this.setHover(null));
      host.addEventListener("keydown", (e) => nudgeField(e));
    },

    // The disc is generated per pixel, so it is cached and only rebuilt when a lightness moves.
    cache: null,
    pending: null,
    disc(size, dpr, full) {
      const key = size + ":" + full + ":" + coord.background.L.toFixed(3) + ":" + coord.accent.L.toFixed(3);
      if (this.cache && this.cache.key === key) return this.cache.cv;
      const g0 = this.geom(size);
      const n = full ? Math.round(size * dpr) : Math.max(120, Math.round(size / 2));
      const k = n / size;
      const cv = document.createElement("canvas");
      cv.width = n; cv.height = n;
      const ctx = cv.getContext("2d");
      const img = ctx.createImageData(n, n);
      const edges = {};
      ["background", "accent"].forEach((kk) => {
        const e = new Float64Array(361);
        for (let d = 0; d <= 360; d++) e[d] = edgeC(coord[kk].L, d % 360, range(kk).C);
        edges[kk] = e;
      });
      const c = n / 2;
      const rIn = g0.rIn * k, rOut = g0.rOut * k, dOut = g0.dOut * k;
      const aa = 1.2;
      for (let y = 0; y < n; y++) {
        for (let x = 0; x < n; x++) {
          const dx = x + 0.5 - c, dy = y + 0.5 - c;
          const r = Math.hypot(dx, dy);
          let kk = null, frac = 0, alpha = 1;
          if (r <= dOut + aa) {
            kk = "accent"; frac = Math.min(1, r / dOut);
            if (r > dOut) alpha = 1 - (r - dOut) / aa;
          } else if (r >= rIn - aa && r <= rOut + aa) {
            kk = "background"; frac = clamp((r - rIn) / (rOut - rIn), 0, 1);
            if (r < rIn) alpha = 1 - (rIn - r) / aa;
            if (r > rOut) alpha = 1 - (r - rOut) / aa;
          }
          if (!kk || alpha <= 0) continue;
          const deg = (Math.atan2(dy, dx) * 180 / Math.PI + 450) % 360;
          const d0 = Math.floor(deg), t = deg - d0;
          const e = edges[kk][d0] * (1 - t) + edges[kk][(d0 + 1) % 360] * t;
          const C = frac * e * 0.998;
          const rgb = tint.rgbIn(coord[kk].L, C, deg) || tint.rgbIn(coord[kk].L, C * 0.94, deg);
          if (!rgb) continue;
          const i = (y * n + x) * 4;
          img.data[i] = rgb[0]; img.data[i + 1] = rgb[1]; img.data[i + 2] = rgb[2];
          img.data[i + 3] = Math.round(255 * alpha);
        }
      }
      ctx.putImageData(img, 0, 0);
      this.cache = { key, cv };
      return cv;
    },

    draw() {
      const host = $("r-disc");
      const size = Math.max(160, Math.round(host.clientWidth));
      const cv = host.querySelector("canvas");
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(size * dpr); cv.height = Math.round(size * dpr);
      const g = cv.getContext("2d");
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, size, size);
      g.imageSmoothingEnabled = true;
      g.imageSmoothingQuality = "high";
      const have = this.cache && this.cache.key.indexOf(size + ":true:") === 0;
      const gm = this.geom(size), gc = gm.c;
      this.glow(g, size, () => {
        g.beginPath();
        g.arc(gc, gc, gm.rOut, 0, Math.PI * 2);
        g.arc(gc, gc, gm.rIn, 0, Math.PI * 2, true);
      });
      this.glow(g, size, () => { g.beginPath(); g.arc(gc, gc, gm.dOut, 0, Math.PI * 2); });
      g.drawImage(this.disc(size, dpr, have), 0, 0, size, size);
      // once the pointer settles, redraw it once at device resolution — only while still coarse
      if (!have) {
        clearTimeout(this.pending);
        this.pending = setTimeout(() => { this.disc(size, dpr, true); render(); }, 170);
      }

      const geo = this.geom(size), c = geo.c;
      const ang = (h) => (h - 90) * Math.PI / 180;
      const pos = (o, outer) => {
        const k = outer ? "background" : "accent";
        const e = edgeC(coord[k].L, o.h, range(k).C) || range(k).C;
        const frac = clamp(o.C / e, 0, 1);
        const r = outer ? geo.rIn + frac * (geo.rOut - geo.rIn) : frac * geo.dOut;
        const a = ang(o.h);
        return [c + Math.cos(a) * r, c + Math.sin(a) * r];
      };
      this.lastSize = size;

      // Each body says what it is, and fades out of the way once the pointer is on it.
      const lab = clamp(size * 0.019, 9, 13);
      const labCol = "#ffffffd4";
      if (this.fade.background > 0.01) {
        this.curveText(g, c, (geo.rIn + geo.rOut) / 2, 180, "BACKGROUND",
          { px: lab, color: labCol, inward: true, alpha: this.fade.background });
      }
      if (this.fade.accent > 0.01) {
        g.save();
        this.label(g, lab, labCol, this.fade.accent);
        g.fillText("ACCENT", c, c);
        g.restore();
      }

      this.dots = [];
      if (this.showPresets) {
        [["background", true], ["accent", false]].forEach(([k, outer]) => {
          presets[k].forEach((p) => {
            const o = tint.toOklch(p.hex);
            if (isNeutral(p.hex)) return;
            const q = pos(o, outer);
            const on = p.hex === colors[k];
            const dR = clamp(size * 0.0105, 4.5, 7);
            g.beginPath(); g.arc(q[0], q[1], on ? dR + 1 : dR, 0, 6.3);
            g.fillStyle = p.hex; g.fill();
            g.lineWidth = on ? 2 : 1;
            g.strokeStyle = on ? "#ffffffcc" : "#00000088";
            g.stroke();
            this.dots.push({ x: q[0], y: q[1], hex: p.hex, k });
          });
        });
      }

      // lightness arcs, following the circle instead of standing beside it. The capsule clips
      // the track to fully round ends; the bands are stroked past it so those ends get colour.
      const capDeg = (geo.arcW / 2 / geo.Ra) * 180 / Math.PI + 1;
      ["background", "accent"].forEach((k) => {
        const r = range(k);
        const [d0, d1] = this.span(k), [h0, h1] = this.hspan(k);
        this.glow(g, size, () => this.capsule(g, c, geo.Ra, ang(d0), ang(d1), geo.arcW));
        g.save();
        this.capsule(g, c, geo.Ra, ang(d0), ang(d1), geo.arcW);
        g.clip();
        g.lineWidth = geo.arcW;
        g.lineCap = "butt";
        for (let d = d0 - capDeg; d < d1 + capDeg; d += 1.5) {
          const t = clamp((d - h0) / (h1 - h0), 0, 1);
          g.beginPath();
          g.arc(c, c, geo.Ra, ang(d) - 0.02, ang(d + 1.5) + 0.02);
          g.strokeStyle = tint.fromOklch(r.L[1] - t * (r.L[1] - r.L[0]), coord[k].C, coord[k].h);
          g.stroke();
        }
        g.restore();
        // Lighter than this and `#cccccc` bar text drops under 4.5:1 on the frame: the whole
        // stretch is washed red, cut off by a line across the track and labelled under the curve.
        if (k === "background") {
          const tc = clamp((r.L[1] - contrastL(coord[k].h, r)) / (r.L[1] - r.L[0]), 0, 1);
          const cDeg = h0 + tc * (h1 - h0);
          const am = ang(cDeg), hw = geo.arcW / 2;
          this.capsule(g, c, geo.Ra, ang(d0), am, geo.arcW, [true, false]);
          g.fillStyle = "#ff4f4f30";
          g.fill();
          g.lineWidth = 1.5;
          g.strokeStyle = "#ffa0a0e0";
          g.beginPath();
          g.moveTo(c + Math.cos(am) * (geo.Ra - hw - 2), c + Math.sin(am) * (geo.Ra - hw - 2));
          g.lineTo(c + Math.cos(am) * (geo.Ra + hw + 2), c + Math.sin(am) * (geo.Ra + hw + 2));
          g.stroke();
          const tp = clamp(size * 0.0165, 8.5, 11.5), tr = geo.Ra - hw - tp * 0.95;
          this.curveText(g, c, tr, (d0 + cDeg) / 2, "low contrast",
            { px: tp, color: "#ffb4b4", inward: true, max: ((cDeg - d0) * Math.PI / 180) * tr - tp });
        }
        // the arc says which knob it moves, riding just outside the track
        this.curveText(g, c, geo.Ra + geo.arcW / 2 + geo.aLab * 0.78, (d0 + d1) / 2,
          k === "background" ? "BACKGROUND" : "ACCENT", { px: geo.aLab, color: "#ffffffb3" });
        const ha = this.arcPoint(k, coord[k].L);
        const hp = [c + Math.cos(ha) * geo.Ra, c + Math.sin(ha) * geo.Ra];
        g.beginPath(); g.arc(hp[0], hp[1], geo.hR, 0, 6.3);
        g.fillStyle = tint.fromOklch(coord[k].L, coord[k].C, coord[k].h);
        g.fill();
        g.lineWidth = knob === k ? 3 : 2;
        g.strokeStyle = "#fff";
        g.stroke();
      });

      const bp = pos(coord.background, true), ap = pos(coord.accent, false);
      [[bp, colors.background, knob === "background"], [ap, colors.accent, knob === "accent"]].forEach((q) => {
        g.beginPath(); g.arc(q[0][0], q[0][1], q[2] ? geo.hR : geo.hR - 2, 0, 6.3);
        g.fillStyle = q[1]; g.fill();
        g.lineWidth = q[2] ? 3 : 2; g.strokeStyle = "#fff"; g.stroke();
      });
    },
    knobChanged() {},
  };

  const surface = () => Rings;

  function nudgeField(e) {
    const step = e.shiftKey ? 5 : 1;
    const r = range(), c = coord[knob];
    const dl = { ArrowUp: 1, ArrowDown: -1 }[e.key], dc = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!dl && !dc) return;
    e.preventDefault();
    if (dl) c.L = clamp(c.L + (dl * step * (r.L[1] - r.L[0])) / 60, r.L[0], r.L[1]);
    if (dc) c.C = clamp(c.C + (dc * step * r.C) / 60, 0, r.C);
    commit(knob);
  }

  function pick(hex, k = knob) {
    if (k === "accent") accentSet = true;
    setColor(k, hex);
    syncAccent();
    render();
    scheduleSug();
  }

  function drawPresets() {
    const groups = knob === "background"
      ? [["Default", (p) => p.hex === defaultBackground], ["Colors", (p) => tint.toOklch(p.hex).C >= 0.045],
         ["Muted", (p) => tint.toOklch(p.hex).C > 0.002], ["Black", () => true]]
      : ["Saturated", "Dusty", "Light", "Pearl", "Neutral"].map((f) => [f, (p) => family(p.hex) === f]);
    const left = presets[knob].slice();
    const rows = groups.map(([label, test]) => {
      const items = [];
      for (let i = left.length - 1; i >= 0; i--) if (test(left[i])) items.unshift(left.splice(i, 1)[0]);
      return { label, items };
    }).filter((g) => g.items.length);
    $("presets").replaceChildren(...rows.map((g) => {
      const row = document.createElement("div");
      row.style.cssText = "display:flex;gap:10px;align-items:flex-start;margin-bottom:8px";
      const lab = document.createElement("span");
      lab.className = "lab";
      lab.style.cssText = "flex:0 0 62px;text-align:right;padding-top:4px";
      lab.textContent = g.label;
      const sw = document.createElement("div");
      sw.className = "row sw";
      sw.style.flex = "1";
      sw.append(...g.items.map((p) => {
        const b = document.createElement("button");
        b.type = "button";
        b.title = p.name + " " + p.hex;
        b.dataset.hex = p.hex;
        b.style.background = p.hex;
        b.addEventListener("click", () => pick(p.hex));
        return b;
      }));
      row.append(lab, sw);
      return row;
    }));
    const list = recents[knob] || [];
    $("rec-box").hidden = !list.length;
    $("rec").replaceChildren(...list.map((hex) => {
      const b = document.createElement("button");
      b.type = "button";
      b.dataset.hex = hex;
      b.style.background = hex;
      b.addEventListener("click", () => pick(hex));
      return b;
    }));
  }

  function render() {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = null;
      surface().draw();
      for (const k of KNOBS) if (document.activeElement !== hexBox(k)) hexBox(k).value = colors[k];
      document.querySelectorAll(".sw button").forEach((b) => b.classList.toggle("on", b.dataset.hex === colors[knob]));
      paintWindow(palette());
      const sig = colors.background + (accentSet ? colors.accent : "");
      if (sig !== sent) {
        sent = sig;
        vscode.postMessage({ type: "preview", background: colors.background, accent: accentSet ? colors.accent : null });
      }
    });
  }

  function showKnob(next) {
    knob = next;
    surface().knobChanged();
    drawPresets();
    render();
    drawSuggestions();
  }

  for (const k of KNOBS) {
    hexBox(k).addEventListener("input", () => {
      const v = /^#?[0-9a-f]{6}$/i.test(hexBox(k).value.trim()) && tint.normalizeHex(hexBox(k).value);
      if (v) pick(v, k);
    });
    hexBox(k).addEventListener("blur", () => { hexBox(k).value = colors[k]; });
  }

  const apply = () => vscode.postMessage({ type: "apply", background: colors.background, accent: accentSet ? colors.accent : null });
  const cancel = () => vscode.postMessage({ type: "cancel" });
  $("apply").addEventListener("click", apply);
  $("cancel").addEventListener("click", cancel);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") cancel();
    if (e.key === "Enter" && e.target.tagName !== "BUTTON") apply();
  });

  // Beside the wheel the preview shows the pair in place; wrapped under it, it is just a slab.
  function stacked() {
    const side = document.querySelector(".side");
    side.classList.toggle("stacked", side.offsetTop > $("surface").offsetTop);
  }
  new ResizeObserver(() => {
    stacked();
    if (presets.background.length) render();
  }).observe(document.getElementById("surface"));

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
    surface().build();
    showKnob(data.knob);
    stacked();
  });
  vscode.postMessage({ type: "ready" });
})();
