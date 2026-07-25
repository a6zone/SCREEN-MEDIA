// Dot Matrix hero backdrop — Originkit "Dot Matrix" (OGL) ported from React
// to a self-contained vanilla module. Props: useGlyphAtlas + characters "SM",
// recoloured with the site's brand palette. Bundled (OGL inlined) — no CDN.
import { Renderer, Camera, Mesh, Plane, Program, RenderTarget, Texture } from "ogl";

const DEFAULT_GLYPH_PADDING_PX = 2;

const perlinVertexShader = `#version 300 es
in vec2 uv;
in vec2 position;
out vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position, 0., 1.); }`;

const perlinFragmentShader = `#version 300 es
precision mediump float;
uniform float uFrequency;
uniform float uTime;
uniform float uSpeed;
uniform float uValue;
uniform vec2 uResolution;
in vec2 vUv;
out vec4 fragColor;
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute( permute( permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
  float n_ = 0.142857142857;
  vec3  ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );
  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
}
vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}
void main() {
  vec2 uv = vUv;
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  uv = (uv - 0.5) * vec2(aspect, 1.0) + 0.5;
  float hue = abs(snoise(vec3(uv * uFrequency, uTime * uSpeed)));
  vec3 rainbowColor = hsv2rgb(vec3(hue, 1.0, uValue));
  fragColor = vec4(rainbowColor, 1.0);
}`;

const dotVertexShader = perlinVertexShader;

const dotFragmentShader = `#version 300 es
precision highp float;
uniform vec2 uResolution;
uniform sampler2D uTexture;
uniform int uPaletteCount;
uniform vec3 uPalette[10];
uniform float uPaletteA[10];
uniform float uCellSize;
uniform float uGamma;
uniform float uPaletteBias;
uniform int uUseGlyphAtlas;
uniform sampler2D uGlyphAtlas;
uniform ivec2 uGlyphGrid;
uniform int uCharCount;
out vec4 fragColor;
void main() {
  vec2 pix = gl_FragCoord.xy;
  float cell = max(uCellSize, 1.0);
  vec2 cellIdx = floor(pix / cell);
  vec2 cellCenter = (cellIdx + 0.5) * cell;
  vec3 col = texture(uTexture, cellCenter / uResolution.xy).rgb;
  float gray = 0.3 * col.r + 0.59 * col.g + 0.11 * col.b;
  gray = pow(clamp(gray, 0.0001, 1.0), uGamma);
  float mark = 0.0;
  if (uUseGlyphAtlas == 1 && uCharCount > 0 && uGlyphGrid.x > 0 && uGlyphGrid.y > 0) {
    float g = clamp(gray + uPaletteBias, 0.0, 1.0);
    int idx = int(clamp(floor(g * float(uCharCount - 1) + 0.5), 0.0, float(uCharCount - 1)));
    vec2 cellUV = fract(pix / cell);
    vec2 grid = vec2(uGlyphGrid);
    vec2 tileSize = 1.0 / grid;
    float colIdx = float(idx % uGlyphGrid.x);
    float rowIdx = floor(float(idx) / float(uGlyphGrid.x));
    vec2 atlasUV = (vec2(colIdx, rowIdx) + cellUV) * tileSize;
    vec3 glyphSample = texture(uGlyphAtlas, atlasUV).rgb;
    mark = dot(glyphSample, vec3(0.299, 0.587, 0.114));
  } else {
    vec2 cellUV = fract(pix / cell) - 0.5;
    float dist = length(cellUV);
    float radius = clamp(gray + uPaletteBias, 0.0, 1.0) * 0.5;
    float aa = fwidth(dist) + 1e-4;
    mark = 1.0 - smoothstep(radius - aa, radius + aa, dist);
  }
  float g2 = clamp(gray + uPaletteBias, 0.0, 1.0);
  int cnt = max(uPaletteCount, 1);
  vec3 dotCol;
  float dotOpacity;
  if (cnt <= 1) {
    dotCol = uPalette[0];
    dotOpacity = uPaletteA[0];
  } else {
    float scaled = g2 * float(cnt - 1);
    int i0 = int(floor(scaled));
    i0 = clamp(i0, 0, cnt - 2);
    float f = scaled - float(i0);
    dotCol = mix(uPalette[i0], uPalette[i0 + 1], f);
    dotOpacity = mix(uPaletteA[i0], uPaletteA[i0 + 1], f);
  }
  fragColor = vec4(dotCol, mark * dotOpacity);
}`;

function parseColorToRgba(input) {
  if (!input) return { r: 0, g: 0, b: 0, a: 1 };
  const str = String(input).trim();
  const m = str.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)/i);
  if (m) return { r: +m[1] / 255, g: +m[2] / 255, b: +m[3] / 255, a: m[4] !== undefined ? +m[4] : 1 };
  let hex = str.replace(/^#/, "");
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  if (hex.length === 4) hex = hex.split("").map((c) => c + c).join("");
  if (hex.length === 6 || hex.length === 8)
    return {
      r: parseInt(hex.slice(0, 2), 16) / 255,
      g: parseInt(hex.slice(2, 4), 16) / 255,
      b: parseInt(hex.slice(4, 6), 16) / 255,
      a: hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1,
    };
  return { r: 0, g: 0, b: 0, a: 1 };
}

const mapLinear = (v, a, b, c, d) => (b === a ? c : c + ((v - a) / (b - a)) * (d - c));
const mapFrequency = (u) => mapLinear(u, 1, 10, 0.3, 6);
const mapSpeed = (u) => u * 0.05;
const mapCellSize = (u) => mapLinear(u, 1, 100, 6, 60);
const mapGamma = (u) => mapLinear(u, 1, 20, 0.5, 8);
const mapPaletteBias = (u) => u * 0.05;

const MAX_COLORS = 10;
function buildPaletteUniforms(colorList) {
  const rgb = [];
  const alpha = [];
  for (let i = 0; i < MAX_COLORS; i++) {
    const src = colorList[i];
    if (src != null) {
      const { r, g, b, a } = parseColorToRgba(src);
      rgb.push([r, g, b]);
      alpha.push(a);
    } else {
      rgb.push([0, 0, 0]);
      alpha.push(0);
    }
  }
  return { rgb, alpha };
}

function buildGlyphAtlas(gl, characters, fontFamily, fontWeight, fontSizePx, paddingPx) {
  const count = Math.max(1, characters.length);
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const cellPx = Math.max(8, fontSizePx + paddingPx * 2);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const canvas = document.createElement("canvas");
  canvas.width = cols * cellPx * dpr;
  canvas.height = rows * cellPx * dpr;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${fontWeight} ${fontSizePx}px ${fontFamily}`;
  for (let i = 0; i < count; i++) {
    const cx = i % cols;
    const cy = Math.floor(i / cols);
    ctx.fillText(characters[i], cx * cellPx + cellPx / 2, cy * cellPx + cellPx / 2);
  }
  const texture = new Texture(gl, {
    image: canvas,
    wrapS: gl.CLAMP_TO_EDGE,
    wrapT: gl.CLAMP_TO_EDGE,
    generateMipmaps: false,
    flipY: true,
  });
  return { texture, cols, rows, cellPx, count };
}

export function initDotMatrix(container, opts) {
  const o = Object.assign(
    {
      frequency: 1,
      speed: 6,
      bgColor: "transparent",
      colors: ["#244D87", "#4A90C0", "#F2951F"],
      cellSize: 26,
      gamma: 4,
      paletteBias: 0,   // 2-glyph atlas: default bias(10) pins every cell to the
                        // 2nd char; 0 lets noise pick S vs M ~50/50

      characters: "SM",
      fontFamily: "'IBM Plex Mono', monospace",
      fontWeight: 700,
      fontSizePx: 46,
    },
    opts || {}
  );

  const chars = Array.from(o.characters).filter((c) => !/\s/.test(c)).join("") || "SM";
  const palette = buildPaletteUniforms(o.colors);
  const paletteCount = Math.min(MAX_COLORS, Math.max(1, o.colors.length));

  const renderer = new Renderer({
    dpr: Math.min(window.devicePixelRatio || 1, 2),
    alpha: true,
    premultipliedAlpha: false,
  });
  const gl = renderer.gl;
  container.appendChild(gl.canvas);
  gl.canvas.style.width = "100%";
  gl.canvas.style.height = "100%";
  gl.canvas.style.display = "block";

  const camera = new Camera(gl, { near: 0.1, far: 100 });
  camera.position.set(0, 0, 3);

  const perlinProgram = new Program(gl, {
    vertex: perlinVertexShader,
    fragment: perlinFragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uFrequency: { value: mapFrequency(o.frequency) },
      uSpeed: { value: mapSpeed(o.speed) },
      uValue: { value: 1 },
      uResolution: { value: [1, 1] },
    },
  });
  const perlinMesh = new Mesh(gl, { geometry: new Plane(gl, { width: 2, height: 2 }), program: perlinProgram });
  const renderTarget = new RenderTarget(gl);

  const atlas = buildGlyphAtlas(gl, chars, o.fontFamily, o.fontWeight, o.fontSizePx, DEFAULT_GLYPH_PADDING_PX);

  const dotProgram = new Program(gl, {
    vertex: dotVertexShader,
    fragment: dotFragmentShader,
    transparent: true,
    uniforms: {
      uResolution: { value: [1, 1] },
      uTexture: { value: renderTarget.texture },
      uPaletteCount: { value: paletteCount },
      uPalette: { value: palette.rgb },
      uPaletteA: { value: palette.alpha },
      uCellSize: { value: mapCellSize(o.cellSize) },
      uGamma: { value: mapGamma(o.gamma) },
      uPaletteBias: { value: mapPaletteBias(o.paletteBias) },
      uUseGlyphAtlas: { value: 1 },
      uGlyphAtlas: { value: atlas.texture },
      uGlyphGrid: { value: [atlas.cols, atlas.rows] },
      uCharCount: { value: atlas.count },
    },
  });
  const dotMesh = new Mesh(gl, { geometry: new Plane(gl, { width: 2, height: 2 }), program: dotProgram });

  function resize() {
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    renderer.setSize(w, h);
    const res = [gl.canvas.width, gl.canvas.height];
    perlinProgram.uniforms.uResolution.value = res;
    dotProgram.uniforms.uResolution.value = res;
    if (renderTarget.setSize) renderTarget.setSize(gl.canvas.width, gl.canvas.height);
  }

  function drawFrame(t) {
    perlinProgram.uniforms.uTime.value = t * 0.001;
    renderer.render({ scene: perlinMesh, camera, target: renderTarget });
    dotProgram.uniforms.uResolution.value = [gl.canvas.width, gl.canvas.height];
    renderer.render({ scene: dotMesh, camera });
  }

  let pending = false;
  const onResize = () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => { pending = false; resize(); if (!running) drawFrame(lastT); });
  };
  window.addEventListener("resize", onResize);
  let ro = null;
  if (window.ResizeObserver) { ro = new ResizeObserver(onResize); ro.observe(container); }
  resize();

  let raf = null, running = false, lastT = 0;
  const INTERVAL = 1000 / 30;
  function loop(t) {
    if (!running) { raf = null; return; }
    if (t - lastT >= INTERVAL) { lastT = t; drawFrame(t); }
    raf = requestAnimationFrame(loop);
  }
  drawFrame(0); // paint one static frame immediately

  return {
    start() { if (running) return; running = true; raf = requestAnimationFrame(loop); },
    stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = null; },
    destroy() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      if (ro) try { ro.disconnect(); } catch (e) {}
      try { atlas.texture.destroy && atlas.texture.destroy(); } catch (e) {}
      if (gl.canvas.parentElement === container) container.removeChild(gl.canvas);
    },
  };
}

/* ---- mount into the hero ---- */
(function () {
  const el = document.getElementById("hero-dot");
  if (!el) return;
  // WebGL2 support check — bail quietly (hero just keeps its background)
  let ok = false;
  try { ok = !!document.createElement("canvas").getContext("webgl2"); } catch (e) {}
  if (!ok) return;

  let ctrl;
  try { ctrl = initDotMatrix(el); } catch (e) { return; }

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return; // static single frame only

  let onScreen = false;
  const sync = () => { onScreen && !document.hidden ? ctrl.start() : ctrl.stop(); };
  new IntersectionObserver((es) => { es.forEach((e) => { onScreen = e.isIntersecting; }); sync(); }, { threshold: 0 }).observe(el);
  document.addEventListener("visibilitychange", sync);
})();
