// Extra interactions: holographic credential card, "verify my credentials", live GitHub stats,
// and a Ctrl/⌘K command palette that can also answer questions from ask.js.
import { search, THRESHOLD } from './ask.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
document.querySelectorAll('[data-mod]').forEach((k) => { k.textContent = isMac ? '⌘' : 'Ctrl'; });

/* ---------- holographic credential card: tilt + foil follow the pointer ---------- */
const holo = document.querySelector('.holo');
if (holo && !reduce && matchMedia('(hover: hover) and (pointer: fine)').matches) {
  holo.addEventListener('pointermove', (e) => {
    const r = holo.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    holo.classList.add('is-live');
    holo.style.setProperty('--ry', `${(px - 0.5) * 18}deg`);
    holo.style.setProperty('--rx', `${(0.5 - py) * 14}deg`);
    holo.style.setProperty('--px', `${px * 100}%`);
    holo.style.setProperty('--py', `${py * 100}%`);
  });
  holo.addEventListener('pointerleave', () => {
    holo.classList.remove('is-live');
    ['--rx', '--ry', '--px', '--py'].forEach((v) => holo.style.removeProperty(v));
  });
}

/* ---------- verify my credentials ---------- */
const verify = document.getElementById('verify');
const openVerify = () => { if (typeof verify.showModal === 'function') verify.showModal(); else verify.setAttribute('open', ''); };
document.querySelectorAll('.js-verify').forEach((b) => b.addEventListener('click', openVerify));
verify.addEventListener('click', (e) => { if (e.target === verify) verify.close(); });
verify.querySelectorAll('.js-close-go').forEach((a) => a.addEventListener('click', () => verify.close()));

/* ---------- live from GitHub (public API, called by the visitor's browser) ---------- */
function timeAgo(iso) {
  const s = (new Date(iso) - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const units = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]];
  for (const [unit, sec] of units) if (Math.abs(s) >= sec) return rtf.format(Math.round(s / sec), unit);
  return 'just now';
}
async function loadGitHub(box) {
  const KEY = 'gh-cache-v1', USER = 'vinoth322006';
  let data = null;
  try {
    const cached = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    if (cached && Date.now() - cached.at < 10 * 60 * 1000) data = cached.data;
  } catch { /* storage unavailable */ }
  if (!data) {
    try {
      const get = (url) => fetch(url, { headers: { Accept: 'application/vnd.github+json' } }).then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))));
      const [user, repos] = await Promise.all([
        get(`https://api.github.com/users/${USER}`),
        get(`https://api.github.com/users/${USER}/repos?per_page=100&sort=pushed`),
      ]);
      data = { count: user.public_repos, repos: repos.map((x) => ({ name: x.name, url: x.html_url, lang: x.language, pushed: x.pushed_at, fork: x.fork })) };
      try { sessionStorage.setItem(KEY, JSON.stringify({ at: Date.now(), data })); } catch { /* ignore */ }
    } catch { return; } // offline or rate-limited: the widget stays hidden
  }
  const own = data.repos.filter((x) => !x.fork && x.name.toLowerCase() !== USER);
  if (!own.length) return;
  const latest = own.reduce((a, b) => (new Date(a.pushed) > new Date(b.pushed) ? a : b));
  box.querySelector('[data-gh-repos]').textContent = String(data.count);
  const last = box.querySelector('[data-gh-last]');
  last.textContent = latest.name;
  last.href = latest.url;
  box.querySelector('[data-gh-when]').textContent = timeAgo(latest.pushed);

  const counts = {};
  own.forEach((x) => { if (x.lang) counts[x.lang] = (counts[x.lang] || 0) + 1; });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, 4);
  const rest = sorted.slice(4).reduce((s, [, n]) => s + n, 0);
  if (rest) top.push(['Other', rest]);
  const shades = ['#ff4f1a', '#141414', '#b23808', '#8a8478', '#d6cfc1'];
  const bar = box.querySelector('[data-gh-bar]');
  const legend = box.querySelector('[data-gh-langs]');
  top.forEach(([lang, n], i) => {
    const seg = document.createElement('span');
    seg.style.flex = String(n);
    seg.style.background = shades[i];
    bar.appendChild(seg);
    const li = document.createElement('li');
    const sw = document.createElement('i');
    sw.style.background = shades[i];
    li.append(sw, `${lang} · ${n}`);
    legend.appendChild(li);
  });
  box.hidden = false;
}
const gh = document.querySelector('[data-gh]');
if (gh) loadGitHub(gh);

/* ---------- command palette: Ctrl/⌘K or "/" ---------- */
const palette = document.getElementById('palette');
const input = document.getElementById('palette-q');
const list = document.getElementById('palette-list');
const answerBox = palette.querySelector('.palette__answer');

function close() { if (palette.open) palette.close(); }
function goTo(hash) {
  return () => {
    close();
    const el = document.querySelector(hash);
    if (el) el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    history.replaceState(null, '', hash);
  };
}
function openModal(id) { return () => { close(); document.getElementById(id).showModal(); }; }
function openUrl(url) { return () => { close(); window.open(url, '_blank', 'noopener'); }; }
const COMMANDS = [
  { icon: '§', label: 'About me', hint: 'Section', keys: 'about intro who bio', run: goTo('#about') },
  { icon: '§', label: 'Projects', hint: 'Section', keys: 'projects work built portfolio code', run: goTo('#projects') },
  { icon: '★', label: 'MedScholar: 36M papers on one server', hint: 'Project', keys: 'medscholar pubmed semantic search faiss featured best', run: goTo('#p-medscholar') },
  { icon: '§', label: 'Experience & education', hint: 'Section', keys: 'experience internship job education college cgpa degree', run: goTo('#experience') },
  { icon: '§', label: 'Skills', hint: 'Section', keys: 'skills stack tools tech react python langgraph frontend backend', run: goTo('#skills') },
  { icon: '§', label: 'Achievements', hint: 'Section', keys: 'achievements awards patent design airbag hackathon', run: goTo('#achievements') },
  { icon: '§', label: 'Certifications (17)', hint: 'Section', keys: 'certifications certificates stamps certified', run: goTo('#certifications') },
  { icon: '§', label: 'My first 90 days', hint: 'Section', keys: 'plan 90 days onboarding first', run: goTo('#plan') },
  { icon: '§', label: 'Ask my portfolio', hint: 'Section', keys: 'ask questions answers', run: goTo('#ask') },
  { icon: '§', label: 'Contact', hint: 'Section', keys: 'contact hire reach', run: goTo('#contact') },
  { icon: '✓', label: 'Verify my credentials (5× global)', hint: 'Action', keys: 'verify global certified credential id proof agentic', run: openModal('verify') },
  { icon: '⏱', label: '30-second summary', hint: 'Action', keys: 'summary tldr recruiter quick short', run: openModal('tldr') },
  { icon: '⤓', label: 'Download resume (PDF)', hint: 'Action', keys: 'resume cv pdf download', run: () => { close(); const a = document.createElement('a'); a.href = 'assets/Vinoth-P-Resume.pdf'; a.download = ''; document.body.appendChild(a); a.click(); a.remove(); } },
  { icon: '⧉', label: 'Copy email address', hint: 'Action', keys: 'email copy mail address', run: () => { close(); document.querySelector('[data-copy]')?.click(); } },
  { icon: '✉', label: 'Write me an email', hint: 'Action', keys: 'email write hire message mail', run: () => { close(); location.href = 'mailto:vinoth322006@gmail.com'; } },
  { icon: '↗', label: 'Open LinkedIn', hint: 'Link', keys: 'linkedin profile', run: openUrl('https://www.linkedin.com/in/vinoth-p-aimlengineer') },
  { icon: '↗', label: 'Open GitHub', hint: 'Link', keys: 'github code repositories repos', run: openUrl('https://github.com/vinoth322006') },
];

function cmdScore(cmd, q) {
  const hay = `${cmd.label} ${cmd.keys}`.toLowerCase();
  const label = cmd.label.toLowerCase();
  let s = 0;
  for (const w of q.toLowerCase().split(/\s+/).filter(Boolean)) {
    if (label.startsWith(w)) s += 3;
    else if (hay.includes(w)) s += 2;
    else return 0;
  }
  return s;
}

let items = [], active = 0;
function showAnswer(q, hit) {
  answerBox.replaceChildren();
  const text = document.createElement('p');
  text.textContent = hit.note.a;
  const src = document.createElement('p');
  src.className = 'src';
  hit.note.s.forEach(([label, href]) => {
    const a = document.createElement('a');
    a.href = href;
    if (href.startsWith('#')) {
      a.textContent = `${label} ↓`;
      a.addEventListener('click', (e) => { e.preventDefault(); goTo(href)(); });
    } else {
      a.textContent = `${label} ↗`;
      if (href.startsWith('http')) { a.target = '_blank'; a.rel = 'noopener'; }
      if (href.endsWith('.pdf')) a.setAttribute('download', '');
    }
    src.appendChild(a);
  });
  answerBox.append(text, src);
  answerBox.hidden = false;
}

function render() {
  const q = input.value.trim();
  answerBox.hidden = true;
  if (!q) {
    items = COMMANDS.map((c) => ({ ...c }));
  } else {
    items = COMMANDS.map((c) => ({ ...c, s: cmdScore(c, q) })).filter((c) => c.s > 0).sort((a, b) => b.s - a.s);
    const looksLikeQuestion = /\?$/.test(q) || q.split(/\s+/).length >= 2 || !items.length;
    const hit = search(q)[0];
    if (hit && hit.score >= THRESHOLD && looksLikeQuestion) {
      items.unshift({ icon: '?', label: `Answer: ${hit.note.t}`, hint: 'Ask', run: () => showAnswer(q, hit) });
    } else if (!items.length) {
      items.push({
        icon: '✉', label: `Ask Vinoth: “${q}”`, hint: 'Email',
        run: () => { close(); location.href = `mailto:vinoth322006@gmail.com?subject=${encodeURIComponent('A question from your portfolio')}&body=${encodeURIComponent(`Hi Vinoth,\n\n${q}\n\n`)}`; },
      });
    }
  }
  active = 0;
  list.replaceChildren(...items.map((it, i) => {
    const li = document.createElement('li');
    li.id = `pal-${i}`;
    li.setAttribute('role', 'option');
    const ic = document.createElement('span');
    ic.className = 'ic';
    ic.setAttribute('aria-hidden', 'true');
    ic.textContent = it.icon;
    const lab = document.createElement('span');
    lab.className = 'lab';
    lab.textContent = it.label;
    const hint = document.createElement('span');
    hint.className = 'hint';
    hint.textContent = it.hint;
    li.append(ic, lab, hint);
    li.addEventListener('mousemove', () => { if (active !== i) setActive(i); });
    li.addEventListener('click', () => it.run());
    return li;
  }));
  setActive(0);
}
function setActive(i) {
  if (!items.length) { input.removeAttribute('aria-activedescendant'); return; }
  active = (i + items.length) % items.length;
  [...list.children].forEach((li, k) => li.setAttribute('aria-selected', String(k === active)));
  input.setAttribute('aria-activedescendant', `pal-${active}`);
  list.children[active].scrollIntoView({ block: 'nearest' });
}
function openPalette(prefill = '') {
  if (palette.open) return;
  palette.showModal();
  input.value = prefill;
  render();
  input.focus();
}

input.addEventListener('input', render);
input.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
  else if (e.key === 'Enter') { e.preventDefault(); items[active]?.run(); }
});
palette.addEventListener('click', (e) => { if (e.target === palette) close(); });
document.querySelectorAll('.js-palette').forEach((b) => b.addEventListener('click', () => openPalette()));
addEventListener('keydown', (e) => {
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '') || document.activeElement?.isContentEditable;
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); if (palette.open) close(); else openPalette(); }
  else if (e.key === '/' && !typing && !document.querySelector('dialog[open]')) { e.preventDefault(); openPalette(); }
});
