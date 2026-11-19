// Presentation layer: motion and touch on top of a complete, readable page.
// If this file never runs, nothing is missing; it only adds feel.
const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const hasIO = 'IntersectionObserver' in window;
const NS = 'http://www.w3.org/2000/svg';

/* ---------- the orange pen: a hand-drawn stroke under one word per heading ---------- */
const STROKES = [
  'M3 13 C 40 4, 88 19, 128 9 S 182 5, 197 11',
  'M2 10 C 34 16, 74 5, 114 10 S 172 16, 198 8',
  'M4 9 C 46 17, 94 5, 136 12 S 184 8, 196 13',
];
const pens = [...document.querySelectorAll('.pen')];
pens.forEach((pen, k) => {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 200 20');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const path = document.createElementNS(NS, 'path');
  path.setAttribute('pathLength', '1');
  path.setAttribute('d', STROKES[k % STROKES.length]);
  svg.appendChild(path);
  pen.appendChild(svg);
});
if (reduce || !hasIO) {
  pens.forEach((p) => p.classList.add('is-drawn'));
} else {
  const penIO = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    penIO.unobserve(e.target);
    setTimeout(() => e.target.classList.add('is-drawn'), 420);
  }), { rootMargin: '0px 0px -12% 0px', threshold: 1 });
  pens.forEach((p) => penIO.observe(p));
}

/* ---------- paper settles onto the page as you scroll ---------- */
// Only blocks that start below the fold are hidden, so nothing visible ever blinks.
// [selector, tilt]: tilted blocks land like a sheet of paper dropped on a desk.
const TARGETS = [
  ['.section .sec-head > *', false],
  ['.about > *', false],
  ['.feature, .cards > .card, .more', true],
  ['.timeline > .t-item, .edu', true],
  ['.skills > .skill', false],
  ['.awards > .award', true],
  ['.stamp-group > h3', false],
  ['.track, .plan > .plan__step', true],
  ['.ask', true],
  ['.contact__info > *, .compose', false],
  ['.glance__list > li', true],
];
document.querySelectorAll('ul.skill__tools').forEach((ul) => [...ul.children].forEach((li, k) => li.style.setProperty('--c', k)));
if (!reduce && hasIO) {
  const io = new IntersectionObserver((entries) => {
    const now = entries.filter((e) => e.isIntersecting).map((e) => e.target);
    now.sort((a, b) => {
      const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      return ra.top - rb.top || ra.left - rb.left;
    });
    now.forEach((el, k) => {
      io.unobserve(el);
      el.style.setProperty('--i', String(Math.min(k, 6)));
      el.classList.add('in');
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  const fold = innerHeight * 0.95;
  let flip = 0;
  TARGETS.forEach(([sel, tilt]) => document.querySelectorAll(sel).forEach((el) => {
    if (el.classList.contains('rv')) return;
    const r = el.getBoundingClientRect();
    if (!r.height || r.top < fold) return;        // hidden, or already on screen: leave it alone
    el.classList.add('rv');
    if (tilt && !el.querySelector('canvas')) el.style.setProperty('--tilt', `${flip++ % 2 ? 1.1 : -1.4}deg`);
    io.observe(el);
  }));
  root.classList.add('reveal-on');
}

/* ---------- light follows the pointer across cards ---------- */
if (fine) {
  const SEL = '.card, .feature, .t-item, .skill, .award, .plan__step, .edu, .ask';
  let lit = null, raf = 0, ev = null;
  const paint = () => {
    raf = 0;
    const el = ev.target instanceof Element ? ev.target.closest(SEL) : null;
    if (lit && lit !== el) { lit.style.removeProperty('--mx'); lit.style.removeProperty('--my'); }
    lit = el;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${Math.round(ev.clientX - r.left)}px`);
    el.style.setProperty('--my', `${Math.round(ev.clientY - r.top)}px`);
  };
  addEventListener('pointermove', (e) => { ev = e; if (!raf) raf = requestAnimationFrame(paint); }, { passive: true });
}

/* ---------- nav: one ink bar slides to the section you're reading ---------- */
const links = document.getElementById('menu');
if (links) {
  const ink = document.createElement('span');
  ink.className = 'nav__ink';
  ink.setAttribute('aria-hidden', 'true');
  links.appendChild(ink);
  links.classList.add('has-ink');
  let hover = null;
  const place = () => {
    const a = hover || links.querySelector('a.is-active');
    ink.classList.toggle('is-on', !!a);
    if (!a) return;
    ink.style.setProperty('--x', `${a.offsetLeft + 10}px`);
    ink.style.setProperty('--w', String(Math.max(a.offsetWidth - 20, 0)));
  };
  new MutationObserver(place).observe(links, { subtree: true, attributes: true, attributeFilter: ['class'] });
  links.addEventListener('pointerover', (e) => {
    const a = e.target instanceof Element ? e.target.closest('a') : null;
    if (a && a !== hover) { hover = a; place(); }
  });
  links.addEventListener('pointerleave', () => { hover = null; place(); });
  addEventListener('resize', place);
  if (document.fonts) document.fonts.ready.then(place);
}

/* ---------- experience: the spine inks in as you read down it ---------- */
const timeline = document.querySelector('.timeline');
if (timeline) {
  const items = [...timeline.querySelectorAll('.t-item')];
  let raf = 0;
  const update = () => {
    raf = 0;
    const r = timeline.getBoundingClientRect();
    const reach = innerHeight * 0.62 - r.top;      // the reading line, measured from the top of the timeline
    const p = Math.min(Math.max((reach - 30) / Math.max(r.height - 60, 1), 0), 1);
    timeline.style.setProperty('--p', p.toFixed(3));
    items.forEach((it) => it.classList.toggle('is-passed', reach >= it.offsetTop + 34));
  };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
  addEventListener('resize', update);
  update();
}

/* ---------- magnetic buttons: the main actions lean toward the pointer ---------- */
if (fine && !reduce) {
  const clamp = (v) => Math.max(-6, Math.min(6, v));
  document.querySelectorAll('.btn--lg, .cred5, .contact__actions .btn').forEach((b) => {
    b.addEventListener('pointermove', (e) => {
      const r = b.getBoundingClientRect();
      b.style.setProperty('--tx', `${clamp((e.clientX - r.left - r.width / 2) * 0.12).toFixed(1)}px`);
      b.style.setProperty('--ty', `${clamp((e.clientY - r.top - r.height / 2) * 0.3).toFixed(1)}px`);
    });
    b.addEventListener('pointerleave', () => { b.style.removeProperty('--tx'); b.style.removeProperty('--ty'); });
  });
}

/* ---------- ink cursor: a drop of orange that trails the pointer ---------- */
if (fine && !reduce) {
  const cur = document.createElement('div');
  cur.className = 'ink-cursor';
  cur.setAttribute('aria-hidden', 'true');
  cur.appendChild(document.createElement('span'));
  document.body.appendChild(cur);
  let x = 0, y = 0, tx = 0, ty = 0, raf = 0, first = true;
  const loop = () => {
    x += (tx - x) * 0.25;
    y += (ty - y) * 0.25;
    cur.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.4 ? requestAnimationFrame(loop) : 0;
  };
  const LINK = 'a, button, summary, label, select, [role="button"]';
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    tx = e.clientX; ty = e.clientY;
    if (first) { x = tx; y = ty; first = false; }
    const t = e.target instanceof Element ? e.target : null;
    cur.classList.add('is-on');
    cur.classList.toggle('is-link', !!(t && t.closest(LINK)));
    cur.classList.toggle('is-text', !!(t && t.closest('input, textarea')));
    cur.classList.toggle('is-dark', !!(t && t.closest('.contact, .btn--ink, .cred5, .holo, .cards > .card:nth-child(even)')));
    if (!raf) raf = requestAnimationFrame(loop);
  }, { passive: true });
  document.addEventListener('mouseout', (e) => { if (!e.relatedTarget) cur.classList.remove('is-on'); });
  addEventListener('pointerdown', () => cur.classList.add('is-down'));
  addEventListener('pointerup', () => cur.classList.remove('is-down'));
}

/* ---------- projects: the sheets pile up as you scroll (desktop) ---------- */
const deck = document.querySelector('.cards');
const sheets = deck ? [...deck.children].filter((el) => el.classList.contains('card')) : [];
const stackMQ = matchMedia('(min-width: 900px) and (min-height: 680px)');
if (sheets.length > 1) {
  // equal heights, so no sheet peeks out from under the one on top of it
  const size = () => {
    sheets.forEach((s) => s.style.removeProperty('--sheet-h'));
    if (!stackMQ.matches) return;
    const h = Math.max(...sheets.map((s) => s.offsetHeight));
    sheets.forEach((s) => s.style.setProperty('--sheet-h', `${h}px`));
  };
  // depth = how many sheets lie on top of this one; deeper sheets shrink and shade a little
  let raf = 0;
  const pile = () => {
    raf = 0;
    if (!stackMQ.matches || reduce) { sheets.forEach((s) => s.style.removeProperty('--depth')); return; }
    const tops = sheets.map((s) => s.getBoundingClientRect().top);
    sheets.forEach((s, i) => {
      const h = s.offsetHeight;
      let depth = 0;
      for (let j = i + 1; j < sheets.length; j++) depth += Math.min(Math.max((tops[i] + h - tops[j]) / h, 0), 1);
      s.style.setProperty('--depth', depth.toFixed(3));
    });
  };
  const refresh = () => { size(); pile(); };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(pile); }, { passive: true });
  addEventListener('resize', refresh);
  stackMQ.addEventListener('change', refresh);
  if (document.fonts) document.fonts.ready.then(refresh);
  refresh();

  // the scroll position at which sheet k has just landed on the pile, fully visible
  const landing = (k) => {
    const gap = parseFloat(getComputedStyle(deck).rowGap) || 0;
    let y = deck.getBoundingClientRect().top + scrollY;   // the deck itself never sticks
    for (let j = 0; j < k; j++) y += sheets[j].offsetHeight + gap;
    return y - parseFloat(getComputedStyle(sheets[k]).top);
  };

  // keyboard: if a focused link sits under a later sheet, scroll back until its own sheet is on top
  deck.addEventListener('focusin', (e) => {
    if (!stackMQ.matches) return;
    const k = sheets.findIndex((s) => s.contains(e.target));
    if (k < 0 || k === sheets.length - 1 || e.target === sheets[k]) return;
    if (sheets[k + 1].getBoundingClientRect().top >= e.target.getBoundingClientRect().bottom) return;
    scrollTo({ top: landing(k), behavior: 'instant' });
  });

  // links to a project (#p-unstop …): a browser can't aim at a sheet stuck in the pile, so land it here
  const fromHash = (behavior) => {
    const k = sheets.findIndex((s) => `#${s.id}` === location.hash);
    if (k < 0 || !stackMQ.matches) return false;
    scrollTo({ top: landing(k), behavior });
    sheets[k].setAttribute('tabindex', '-1');
    sheets[k].focus({ preventScroll: true });
    return true;
  };
  document.addEventListener('click', (e) => {
    const a = e.target instanceof Element ? e.target.closest('a[href^="#p-"]') : null;
    if (!a || e.defaultPrevented || !stackMQ.matches || !sheets.some((s) => `#${s.id}` === a.hash)) return;
    e.preventDefault();
    history.pushState(null, '', a.hash);
    fromHash('auto');                                     // 'auto' follows the page's smooth / reduced-motion setting
  });
  addEventListener('popstate', () => fromHash('instant'));
  if (location.hash) addEventListener('load', () => requestAnimationFrame(() => fromHash('instant')), { once: true });
}

/* ---------- skills: the tools get typed like keys, once on arrival and again on hover ---------- */
const rows = [...document.querySelectorAll('.skills > .skill')];
if (rows.length && !reduce) {
  const type = (row) => {
    row.classList.remove('typing');
    void row.offsetWidth;                         // restart the animation
    row.classList.add('typing');
    clearTimeout(row.typingTimer);
    row.typingTimer = setTimeout(() => row.classList.remove('typing'), 420 + row.querySelectorAll('.skill__tools li').length * 60);
  };
  if (hasIO) {
    const tio = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      tio.unobserve(e.target);
      setTimeout(() => type(e.target), 450);
    }), { rootMargin: '0px 0px -15% 0px' });
    rows.forEach((r) => tio.observe(r));
  }
  if (fine) rows.forEach((r) => r.addEventListener('pointerenter', () => { if (!r.classList.contains('typing')) type(r); }));
}
