// Page behaviour. Everything here works even if the 3D header doesn't load.
const root = document.documentElement;

/* ---------- personal links: ?for=Company&role=Role ---------- */
const params = new URLSearchParams(location.search);
const clean = (s) => (s || '').replace(/[<>"`{}]/g, '').replace(/\s+/g, ' ').trim().slice(0, 40);
const forName = clean(params.get('for'));
const role = clean(params.get('role'));
if (forName) {
  root.classList.add('is-personal');
  document.querySelectorAll('[data-for]').forEach((el) => { el.textContent = forName; });
  document.querySelectorAll('[data-for-hidden]').forEach((el) => { el.hidden = false; });
  document.title = `Vinoth P × ${forName} | Portfolio`;
}

/* ---------- nav: border + reading progress ---------- */
const bar = document.querySelector('.nav__bar span');
let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    const max = root.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? Math.min(scrollY / max, 1) : 0})`;
    root.classList.toggle('is-scrolled', scrollY > 8);
    ticking = false;
  });
}
addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---------- mobile menu ---------- */
const toggle = document.querySelector('.nav__toggle');
const menu = document.getElementById('menu');
function setMenu(open) {
  menu.classList.toggle('is-open', open);
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
}
toggle.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.classList.contains('is-open')) { setMenu(false); toggle.focus(); } });

/* ---------- highlight the section you're reading ---------- */
const links = new Map([...menu.querySelectorAll('a[href^="#"]')].map((a) => [a.hash.slice(1), a]));
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    links.forEach((a, id) => {
      const on = id === entry.target.id;
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
    });
  });
}, { rootMargin: '-45% 0px -50% 0px' });
document.querySelectorAll('main section[id]').forEach((s) => sectionObserver.observe(s));

/* ---------- 30-second summary ---------- */
const tldr = document.getElementById('tldr');
document.querySelectorAll('.js-tldr').forEach((btn) => btn.addEventListener('click', () => {
  if (typeof tldr.showModal === 'function') tldr.showModal(); else tldr.setAttribute('open', '');
}));
tldr.addEventListener('click', (e) => { if (e.target === tldr) tldr.close(); });

/* ---------- toast + copy email ---------- */
const toast = document.querySelector('.toast');
let toastTimer;
function say(msg) {
  toast.textContent = msg;
  toast.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-on'), 3200);
}
document.querySelectorAll('[data-copy]').forEach((btn) => btn.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(btn.dataset.copy); say(`Copied ${btn.dataset.copy}`); }
  catch { say(btn.dataset.copy); }
}));

/* ---------- "Write the email for me" ---------- */
const compose = document.getElementById('compose');
if (compose) {
  const f = compose.elements;
  f.company.value = forName;
  f.role.value = role;
  compose.addEventListener('submit', (e) => {
    e.preventDefault();
    const c = clean(f.company.value), r = clean(f.role.value), n = clean(f.sender.value);
    const subject = `${r || 'A role'}${c ? ` at ${c}` : ''}: let's talk`;
    const intro = n ? `I'm ${n}${c ? ` from ${c}` : ''}.` : c ? `I'm reaching out from ${c}.` : 'I came across your portfolio.';
    const body = `Hi Vinoth,\n\n${intro} ${r ? `We're hiring for a ${r} role` : "We're hiring"} and I'd like to talk.\n\n`;
    location.href = `mailto:vinoth322006@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    say('Opening your email app…');
  });
}

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- "at a glance" numbers count up ---------- */
const countObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    countObserver.unobserve(entry.target);
    if (reduce) return;
    const el = entry.target, target = Number(el.dataset.count), suffix = el.dataset.suffix || '';
    const start = performance.now(), dur = 1300;
    const step = (now) => {
      const t = Math.min((now - start) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3))) + suffix;
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}, { threshold: 0.6 });
document.querySelectorAll('[data-count]').forEach((el) => countObserver.observe(el));

/* ---------- certifications: the seal's 17 ticks, and stamps that thump onto the page ---------- */
const ticks = document.querySelector('.seal__ticks');
if (ticks) {
  const ns = 'http://www.w3.org/2000/svg';
  for (let k = 0; k < 17; k++) {
    const a = (k / 17) * Math.PI * 2 - Math.PI / 2;
    const line = document.createElementNS(ns, 'line');
    line.setAttribute('x1', (100 + Math.cos(a) * 57).toFixed(2));
    line.setAttribute('y1', (100 + Math.sin(a) * 57).toFixed(2));
    line.setAttribute('x2', (100 + Math.cos(a) * 63).toFixed(2));
    line.setAttribute('y2', (100 + Math.sin(a) * 63).toFixed(2));
    ticks.appendChild(line);
  }
}
if (!reduce) {
  root.classList.add('stamps-armed');
  const stampObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      stampObserver.unobserve(entry.target);
      [...entry.target.children].forEach((stamp, i) => {
        stamp.style.animationDelay = `${i * 110}ms`;
        stamp.classList.add('is-stamping');
        stamp.addEventListener('animationend', () => {
          stamp.classList.remove('is-stamping');
          stamp.classList.add('is-stamped');
          stamp.style.animationDelay = '';
        }, { once: true });
      });
    });
  }, { threshold: 0.3 });
  document.querySelectorAll('.stamps').forEach((list) => stampObserver.observe(list));
}

/* ---------- 90-day plan: a Day 1 → Day 90 track that fills as you scroll ---------- */
const plan = document.getElementById('plan');
const track = plan && plan.querySelector('.track');
if (track) {
  const fill = track.querySelector('.track__fill');
  const marker = track.querySelector('.track__marker');
  const dayEl = track.querySelector('[data-day]');
  const steps = [...plan.querySelectorAll('.plan__step')];
  const starts = [1, 31, 61];
  let lastDay = 0, raf = 0;
  const update = () => {
    raf = 0;
    const r = plan.getBoundingClientRect(), vh = innerHeight;
    const t = Math.min(Math.max((vh * 0.7 - r.top) / Math.max(r.height * 0.7, 1), 0), 1);
    const day = Math.max(1, Math.round(1 + 89 * t));
    if (day === lastDay) return;
    lastDay = day;
    fill.style.transform = `scaleX(${t})`;
    marker.style.left = `${t * 100}%`;
    marker.style.transform = `translateX(${-t * 100}%)`;
    dayEl.textContent = String(day);
    steps.forEach((s, i) => s.classList.toggle('is-live', day >= starts[i]));
  };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
  addEventListener('resize', update);
  update();
}
