// In-page ink-dot visuals, scrubbed by scroll position:
//  · MedScholar: 36M papers as a sprawling cloud collapse into a small quantized cube (150 GB → 4 GB)
//  · Registered design: the baby chair's airbag inflates
import { createDots, cloudShape, cubeShape, chairShapes, reduceMotion } from './dots.js';

const small = innerWidth < 900;
const meterEl = document.querySelector('[data-meter]');
let lastMeter = '';
function meter(t) {
  if (!meterEl) return;
  const v = String(Math.round(150 - 146 * t));
  if (v !== lastMeter) { meterEl.textContent = v; lastMeter = v; }
}

// 0 when the box's top is at 85% of the viewport height, 1 when it reaches 25%
function scrubProgress(el) {
  const r = el.getBoundingClientRect(), vh = innerHeight;
  return Math.min(Math.max((vh * 0.85 - r.top) / (vh * 0.6), 0), 1);
}

function scrubWidget(selector, shapes, { N, fitW, fitH, onT, sway = false }) {
  const box = document.querySelector(selector);
  if (!box) return;
  let dots;
  try { dots = createDots(box.querySelector('canvas'), { N, fitW, fitH, size: small ? 2.5 : 2.3 }); }
  catch { box.hidden = true; return; }
  const [from, to] = shapes(N);
  dots.setPair(from, to);
  dots.uniforms.uBurst.value = 0;
  let t = reduceMotion ? 1 : scrubProgress(box), angle = 0;
  dots.uniforms.uT.value = t;
  if (sway) dots.points.rotation.y = -0.38;
  onT?.(t);
  dots.whileVisible((dt, time) => {
    const target = reduceMotion ? 1 : scrubProgress(box);
    t += (target - t) * (1 - Math.exp(-dt * 6));
    if (Math.abs(target - t) < 1e-3) t = target;
    dots.uniforms.uT.value = t;
    if (!reduceMotion) angle += dt * 0.25;
    // sway keeps the front (and the airbag) in view; otherwise turn slowly
    dots.points.rotation.y = sway ? -0.38 + (reduceMotion ? 0 : Math.sin(time * 0.45) * 0.3) : angle;
    onT?.(t);
    dots.render(time);
  });
  dots.render(0);
  return N;
}

const nCompress = scrubWidget('[data-dots="compress"]', (n) => [cloudShape(n), cubeShape(n)], { N: small ? 6000 : 10000, fitW: 13.4, fitH: 8.4, onT: meter });
scrubWidget('[data-dots="chair"]', (n) => chairShapes(n), { N: small ? 6000 : 9000, fitW: 4.8, fitH: 5.6, sway: true });

if (nCompress) {
  document.querySelectorAll('[data-dot-papers]').forEach((el) => { el.textContent = Math.round(36e6 / nCompress).toLocaleString('en-IN'); });
}
