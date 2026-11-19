// Shared ink-dot engine (Three.js). Builds dot "shapes" and morphs a point cloud between two of them.
// Used by the header (scene.js) and the in-page visuals (widgets.js).
import * as THREE from 'three';

export const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const R = Math.random;
const TAU = Math.PI * 2;

/* ---------- the display font must be loaded before text is sampled into dots ---------- */
let fontPromise;
export function fontsReady() {
  if (!fontPromise) {
    const wait = async () => {
      for (let i = 0; i < 5; i++) {
        try { if ((await document.fonts.load('800 200px "Bricolage Grotesque"')).length) return; } catch { /* retry */ }
        await new Promise((r) => setTimeout(r, 300));
      }
    };
    fontPromise = Promise.race([wait(), new Promise((r) => setTimeout(r, 3000))]);
  }
  return fontPromise;
}

/* ---------- helpers ---------- */
function randn() { let u = 0, v = 0; while (!u) u = R(); while (!v) v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); }
function dir() { const z = 2 * R() - 1, t = TAU * R(), r = Math.sqrt(1 - z * z); return [r * Math.cos(t), z, r * Math.sin(t)]; }
function set(pos, i, x, y, z) { pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z; }
function bake(pos, rx, ry, rz) {
  const m = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rx, ry, rz));
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.length / 3; i++) { v.fromArray(pos, i * 3).applyMatrix4(m); v.toArray(pos, i * 3); }
}
const blank = (N) => ({ pos: new Float32Array(N * 3), acc: new Float32Array(N) });

/* ---------- shapes ---------- */
export function textShape(N, str, width, accentShare = 0.03) {
  const font = '800 220px "Bricolage Grotesque", "Arial Black", sans-serif';
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.font = font;
  c.width = Math.ceil(ctx.measureText(str).width) + 80;
  c.height = 320;
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, c.width / 2, c.height / 2);
  const data = ctx.getImageData(0, 0, c.width, c.height).data;
  const pts = [];
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (let y = 0; y < c.height; y += 2) {
    for (let x = 0; x < c.width; x += 2) {
      if (data[(y * c.width + x) * 4 + 3] > 140) {
        pts.push(x, y);
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
    }
  }
  if (!pts.length) return null;
  const s = width / (x1 - x0), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, n = pts.length / 2;
  const out = blank(N);
  for (let i = 0; i < N; i++) {
    const k = Math.floor(R() * n) * 2;
    set(out.pos, i, (pts[k] - cx + (R() - 0.5) * 2) * s, -(pts[k + 1] - cy + (R() - 0.5) * 2) * s, (R() - 0.5) * 0.45);
    out.acc[i] = R() < accentShare ? 1 : 0;
  }
  return out;
}

// coordinator + 8 specialist agents; orange chords are the agents debating
export function swarmShape(N) {
  const out = blank(N);
  const tilt = new THREE.Matrix4().makeRotationX(1.12).premultiply(new THREE.Matrix4().makeRotationZ(0.12));
  const centers = Array.from({ length: 8 }, (_, k) => { const a = (k / 8) * TAU; return new THREE.Vector3(Math.cos(a) * 3.15, Math.sin(a * 2) * 0.35, Math.sin(a) * 3.15).applyMatrix4(tilt); });
  const origin = new THREE.Vector3();
  const nCore = Math.floor(N * 0.07), nAgents = Math.floor(N * 0.63);
  for (let i = 0; i < N; i++) {
    if (i < nCore) { set(out.pos, i, randn() * 0.34, randn() * 0.34, randn() * 0.34); out.acc[i] = 1; }
    else if (i < nCore + nAgents) { const c = centers[i % 8]; set(out.pos, i, c.x + randn() * 0.26, c.y + randn() * 0.26, c.z + randn() * 0.26); }
    else {
      const k = i % 8, chord = R() < 0.5, t = R();
      const a = chord ? centers[k] : origin, b = chord ? centers[(k + 3) % 8] : centers[k];
      set(out.pos, i, a.x + (b.x - a.x) * t + (R() - 0.5) * 0.04, a.y + (b.y - a.y) * t + (R() - 0.5) * 0.04, a.z + (b.z - a.z) * t + (R() - 0.5) * 0.04);
      out.acc[i] = chord ? 1 : 0;
    }
  }
  return out;
}

// 36M papers as a sprawling cloud of topics (the 150 GB index)
export function cloudShape(N) {
  const out = blank(N);
  const topics = Array.from({ length: 60 }, () => { const d = dir(), r = Math.cbrt(R()); return [d[0] * r * 6.2, d[1] * r * 3.8, d[2] * r * 4.2]; });
  for (let i = 0; i < N; i++) {
    if (R() < 0.72) { const b = topics[i % topics.length]; set(out.pos, i, b[0] + randn() * 0.3, b[1] + randn() * 0.3, b[2] + randn() * 0.3); }
    else { const d = dir(), r = Math.cbrt(R()); set(out.pos, i, d[0] * r * 6.6, d[1] * r * 4.1, d[2] * r * 4.6); }
  }
  return out;
}

// the 4 GB index: every vector snapped onto a small quantized cube (product quantization, made visible)
export function cubeShape(N) {
  const out = blank(N);
  const L = 9, h = 1.6, q = () => (Math.floor(R() * L) / (L - 1) * 2 - 1) * h, j = () => (R() - 0.5) * 0.025;
  for (let i = 0; i < N; i++) {
    const axis = Math.floor(R() * 3), sign = R() < 0.5 ? -h : h;
    let x, y, z;
    if (R() < 0.3) {
      const a = R() < 0.5 ? -h : h, b = R() < 0.5 ? -h : h, c = (R() * 2 - 1) * h;
      [x, y, z] = axis === 0 ? [c, a, b] : axis === 1 ? [a, c, b] : [a, b, c];
    } else {
      [x, y, z] = axis === 0 ? [sign, q(), q()] : axis === 1 ? [q(), sign, q()] : [q(), q(), sign];
    }
    set(out.pos, i, x + j(), y + j(), z + j());
    out.acc[i] = 1;
  }
  bake(out.pos, 0.5, 0.62, 0);
  return out;
}

// the registered baby-chair design: a high chair whose airbag is stored at the top centre of the
// backrest and inflates into a U-shaped neck pillow. Returns [airbag folded, airbag inflated].
export function chairShapes(N) {
  const deg = Math.PI / 180;
  const lerp = (a, b, t) => a + (b - a) * t;
  const j = (s) => (R() - 0.5) * s;
  const sx = () => (R() < 0.5 ? -1 : 1);
  const superK = (c, s) => Math.pow(Math.abs(c) ** 4 + Math.abs(s) ** 4, -0.25); // rounded-rectangle outline
  const backTop = (th) => 2.3 - 0.6 * (th / (72 * deg)) ** 2;                       // rounded top of the backrest
  const parts = [
    // seat pan and its rim
    [0.10, () => { for (;;) { const x = (R() * 2 - 1) * 0.85, z = (R() * 2 - 1) * 0.75; if ((x / 0.85) ** 4 + (z / 0.75) ** 4 <= 1) return [x, (R() < 0.5 ? 0.07 : -0.07) + j(0.02), z]; } }],
    [0.03, () => { const a = R() * TAU, c = Math.cos(a), s = Math.sin(a), k = superK(c, s); return [0.85 * c * k, j(0.14), 0.75 * s * k]; }],
    // tall curved bucket backrest, plus its outline
    [0.20, () => { const th = (R() * 2 - 1) * 72 * deg; return [Math.sin(th) * 0.86, R() * backTop(th), -Math.cos(th) * 0.86 + j(0.04)]; }],
    [0.05, () => { const th = (R() * 2 - 1) * 72 * deg; return [Math.sin(th) * 0.86, backTop(th) + j(0.03), -Math.cos(th) * 0.86]; }],
    // armrests with front posts
    [0.06, () => { const x = sx() * 0.84 + j(0.05); return R() < 0.7 ? [x, 0.74 + j(0.05), lerp(-0.45, 0.78, R())] : [x, lerp(0.05, 0.74, R()), 0.78 + j(0.05)]; }],
    // tray in front, with a raised rim
    [0.11, () => { for (;;) { const x = (R() * 2 - 1) * 1.15, z = (R() * 2 - 1) * 0.34; if ((x / 1.15) ** 4 + (z / 0.34) ** 4 <= 1) return [x, 0.88 + j(0.02), 1.12 + z]; } }],
    [0.04, () => { const a = R() * TAU, c = Math.cos(a), s = Math.sin(a), k = superK(c, s); return [1.15 * c * k, 0.93 + j(0.04), 1.12 + 0.34 * s * k]; }],
    // safety post between the baby's legs
    [0.015, () => { const t = R(); return [j(0.05), lerp(0.08, 0.86, t), lerp(0.62, 0.95, t) + j(0.05)]; }],
    // four splayed legs, a footrest and side rails
    [0.15, () => { const t = R(); return [sx() * lerp(0.6, 1.12, t) + j(0.06), lerp(-0.08, -2.6, t), sx() * lerp(0.52, 1.0, t) + j(0.06)]; }],
    [0.035, () => [(R() * 2 - 1) * 0.86, -1.36 + j(0.04), 0.78 + j(0.18)]],
    [0.03, () => [sx() * 1.04 + j(0.04), -2.2 + j(0.04), (R() * 2 - 1) * 0.93]],
  ];
  const total = parts.reduce((t, [w]) => t + w, 0);
  const chairPoint = () => {
    let r = R() * total;
    for (const [w, f] of parts) { if ((r -= w) <= 0) return f(); }
    return parts[0][1]();
  };

  // neck pillow: a plump U-shaped tube on the backrest, top centre, opening downwards around the
  // baby's head and neck (like a car-seat neck pillow), curved to follow the backrest
  const RU = 0.46, RT = 0.25, CY = 1.82, BACK = 0.86;
  const pillowPoint = () => {
    const al = (R() * 2 - 1) * 128 * deg;                      // 0 = top centre, ±128° = the two arms
    const over = Math.max(0, Math.abs(al) - 112 * deg) / (16 * deg);
    const rt = RT * Math.sqrt(Math.max(0, 1 - over * over)) * (1 + j(0.08)); // rounded, slightly puffy ends
    const ph = R() * TAU, nx = Math.sin(al), ny = Math.cos(al);
    const x = nx * (RU + Math.cos(ph) * rt), y = CY + ny * (RU + Math.cos(ph) * rt);
    const surface = -Math.sqrt(Math.max(0.01, BACK * BACK - x * x));  // the curved backrest behind it
    return [x, y, surface + RT + 0.04 + Math.sin(ph) * rt];
  };
  // folded: packed into a pouch at the back of the backrest, top centre
  const pouchPoint = () => [j(0.7), 2.02 + j(0.18), -0.98 + j(0.12)];

  const nBag = Math.floor(N * 0.24);
  const folded = blank(N), inflated = blank(N);
  for (let i = 0; i < N; i++) {
    if (i < nBag) {
      const a = pouchPoint(), b = pillowPoint();
      set(folded.pos, i, a[0], a[1] + 0.15, a[2]);
      set(inflated.pos, i, b[0], b[1] + 0.15, b[2]);
      folded.acc[i] = inflated.acc[i] = 1;
    } else {
      const p = chairPoint();
      set(folded.pos, i, p[0], p[1] + 0.15, p[2]);
      set(inflated.pos, i, p[0], p[1] + 0.15, p[2]);
    }
  }
  bake(folded.pos, 0.28, 0, 0);
  bake(inflated.pos, 0.28, 0, 0);
  return [folded, inflated];
}

/* ---------- renderer: one point cloud morphing between two shapes ---------- */
const VERT = /* glsl */`
  uniform float uT, uTime, uSize, uPR, uAspect, uIdle, uBurst;
  uniform vec2 uMouse;
  attribute vec3 aTo;
  attribute float aRand, aAccA, aAccB;
  varying float vAcc;
  void main() {
    float t = clamp((uT - aRand * 0.35) / 0.65, 0.0, 1.0);
    t = t * t * (3.0 - 2.0 * t);
    vec3 p = mix(position, aTo, t);
    vec3 dir = normalize(p + vec3(1e-4, 2e-4, 3e-4));
    p += dir * sin(t * 3.14159265) * (0.25 + aRand * 0.9) * uBurst;
    p += uIdle * 0.03 * vec3(sin(uTime * 1.1 + aRand * 61.0), cos(uTime * 0.9 + aRand * 47.0), sin(uTime * 0.7 + aRand * 29.0));
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vec4 clip = projectionMatrix * mv;
    vec2 d = clip.xy / clip.w - uMouse;
    d.x *= uAspect;
    float push = smoothstep(0.32, 0.0, length(d));
    vec2 pd = normalize(d + vec2(1e-5));
    pd.x /= uAspect;
    clip.xy += pd * push * 0.16 * clip.w;
    gl_Position = clip;
    gl_PointSize = uSize * uPR * (0.6 + aRand * 0.8) * (14.0 / -mv.z) * (1.0 + push * 0.5);
    vAcc = mix(aAccA, aAccB, step(0.5, t));
  }`;
const FRAG = /* glsl */`
  uniform vec3 uInk, uAccent;
  varying float vAcc;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float r = length(c);
    if (r > 0.5) discard;
    gl_FragColor = vec4(mix(uInk, uAccent, vAcc), smoothstep(0.5, 0.3, r) * 0.9);
  }`;

export function createDots(canvas, { N, size = 2.4, fitW = 9.2, fitH = 7 }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const geo = new THREE.BufferGeometry();
  const attr = (n) => { const a = new THREE.BufferAttribute(new Float32Array(N * n), n); a.setUsage(THREE.DynamicDrawUsage); return a; };
  const aFrom = attr(3), aTo = attr(3), aAccA = attr(1), aAccB = attr(1);
  const rand = new Float32Array(N);
  for (let i = 0; i < N; i++) rand[i] = R();
  geo.setAttribute('position', aFrom);
  geo.setAttribute('aTo', aTo);
  geo.setAttribute('aAccA', aAccA);
  geo.setAttribute('aAccB', aAccB);
  geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 1));

  const css = getComputedStyle(document.documentElement);
  const rgb = (name, fallback) => {
    const n = parseInt((css.getPropertyValue(name).trim() || fallback).replace('#', ''), 16);
    return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
  };
  const uniforms = {
    uT: { value: 0 }, uTime: { value: 0 }, uSize: { value: size }, uPR: { value: 1 }, uBurst: { value: 1 },
    uMouse: { value: new THREE.Vector2(9, 9) }, uAspect: { value: 1 }, uIdle: { value: reduceMotion ? 0 : 1 },
    uInk: { value: rgb('--ink', '#141414') }, uAccent: { value: rgb('--accent', '#ff4f1a') },
  };
  const material = new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, depthTest: false });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.z = 14;
  const points = new THREE.Points(geo, material);
  points.frustumCulled = false;
  scene.add(points);

  const box = canvas.parentElement;
  function layout() {
    const w = Math.max(1, box.clientWidth), h = Math.max(1, box.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const visH = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), visW = visH * camera.aspect;
    points.scale.setScalar(Math.min((visW * 0.94) / fitW, (visH * 0.94) / fitH));
    uniforms.uAspect.value = camera.aspect;
    uniforms.uPR.value = renderer.getPixelRatio();
  }
  new ResizeObserver(layout).observe(box);
  layout();

  // poke the dots with a mouse or finger
  const mouseT = new THREE.Vector2(9, 9);
  const toNdc = (x, y) => { const r = canvas.getBoundingClientRect(); mouseT.set(((x - r.left) / r.width) * 2 - 1, -(((y - r.top) / r.height) * 2 - 1)); };
  box.addEventListener('pointermove', (e) => { if (e.pointerType !== 'touch') toNdc(e.clientX, e.clientY); });
  box.addEventListener('pointerleave', () => mouseT.set(9, 9));
  box.addEventListener('touchstart', (e) => { const t = e.touches[0]; if (t) toNdc(t.clientX, t.clientY); }, { passive: true });
  box.addEventListener('touchmove', (e) => { const t = e.touches[0]; if (t) toNdc(t.clientX, t.clientY); }, { passive: true });
  box.addEventListener('touchend', () => setTimeout(() => mouseT.set(9, 9), 600), { passive: true });

  return {
    box, points, uniforms,
    setPair(a, b) {
      aFrom.array.set(a.pos); aTo.array.set(b.pos);
      aAccA.array.set(a.acc); aAccB.array.set(b.acc);
      aFrom.needsUpdate = aTo.needsUpdate = aAccA.needsUpdate = aAccB.needsUpdate = true;
    },
    render(time) {
      uniforms.uTime.value = reduceMotion ? 0 : time;
      const m = uniforms.uMouse.value;
      if (mouseT.x > 5 || m.x > 5) m.copy(mouseT); else m.lerp(mouseT, 0.35);
      renderer.render(scene, camera);
    },
    // run frame(dt, time) every animation frame, but only while the box is on screen
    whileVisible(frame) {
      const clock = new THREE.Clock();
      const tick = () => { const dt = Math.min(clock.getDelta(), 0.25); frame(dt, clock.elapsedTime); };
      new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) { clock.getDelta(); renderer.setAnimationLoop(tick); }
        else renderer.setAnimationLoop(null);
      }).observe(box);
    },
  };
}
