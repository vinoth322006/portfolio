// "Interrogate my portfolio": a tiny retrieval agent. BM25 over hand-written notes, all in the browser.
// No LLM, no network calls. If nothing matches well, it hands the question to Vinoth by email.

const GH = 'https://github.com/vinoth322006';
const NOTES = [
  { t: 'Who is Vinoth', k: 'who about intro introduce yourself summary background profile vinoth', a: "I'm Vinoth P, a final-year B.E. Computer Science (AI & ML) student at Sri Krishna College of Technology in Coimbatore, India. I build AI agents, multi-agent systems, MCP servers and RAG pipelines, and I like shipping them to real servers.", s: [['About me', '#about']] },
  { t: 'Availability and joining', k: 'available availability join joining start notice period when hire internship fulltime graduate graduation open', a: "I'm open to work now: internships during my final year, and full-time AI/ML or AI agent roles as a 2027 graduate. On-site, hybrid or remote within India all work. For exact dates, email me and I'll confirm.", s: [['Contact', '#contact']] },
  { t: 'Location and relocation', k: 'where location based city coimbatore india tamil nadu relocate relocation remote hybrid onsite office', a: "I'm based in Coimbatore, Tamil Nadu, India, and open to on-site, hybrid or remote roles. If the role needs a move, ask me directly.", s: [['Contact', '#contact']] },
  { t: 'Best project: MedScholar', k: 'best project proud flagship favourite favorite biggest impressive medscholar', a: "MedScholar. At the Cognizant Hackathon 2026, my team of eight built semantic search over 36 million PubMed papers. We compressed a 150 GB MedCPT index to 4 GB with FAISS IVF-PQ, so it runs on a single AWS EC2 instance and answers in under 1.5 seconds.", s: [['MedScholar project', '#p-medscholar'], ['Code', `${GH}/MedScholar`]] },
  { t: 'FAISS, vector search and compression', k: 'faiss vector database index ivf pq quantization quantize compression compress embedding embeddings medcpt similarity semantic search pubmed scale', a: "We embedded 36M+ PubMed articles with MedCPT. The dense index was over 150 GB, so we used FAISS IVF-PQ (inverted lists plus product quantization) to bring it to 4 GB with very little accuracy loss. That's what let one affordable EC2 instance serve queries in under 1.5 seconds.", s: [['MedScholar project', '#p-medscholar'], ['Index on Hugging Face (team)', 'https://huggingface.co/datasets/dharandhamo/pubmed-medcpt-ivfpq']] },
  { t: 'Multi-agent systems', k: 'agent agents multi multiagent swarm agentic autonomous orchestration coordinator debate research', a: "My Adaptive Research Agent Swarm has a coordinator that spawns specialists from eight archetypes. They research in parallel, four adversaries attack every idea, survivors are scored on a six-axis innovation rubric, and persistent memory carries findings between sessions.", s: [['Projects', '#projects'], ['Code', `${GH}/Adaptive-research-agent-swarm`]] },
  { t: 'LangGraph and LangChain', k: 'langgraph langchain graph state machine workflow crewai framework', a: "Yes. My Caseworker Morning Agent is a LangGraph state machine that triages referrals into allowed, hand-off or escalated, with every decision auditable. I've also used LangChain, and CrewAI is on my resume.", s: [['Code: Caseworker agent', `${GH}/caseworkers-morningsvg`], ['Projects', '#projects']] },
  { t: 'MCP: Model Context Protocol', k: 'mcp model context protocol server tools claude cursor tool calling', a: "Yes. I built the Unstop MCP Server, which gives any MCP client tools to discover contests and pull analytics (on a mock data layer, since Unstop has no public API yet), and a chat frontend that adds or removes MCP servers at runtime. My Oracle Agentic AI certification covered MCP too.", s: [['Code: Unstop MCP', `${GH}/unstop-mcp-server`], ['Code: MCP chat frontend', `${GH}/MCP`]] },
  { t: 'RAG pipelines', k: 'rag retrieval augmented generation chatbot pdf documents pgvector chromadb embeddings llm grounding', a: "Yes. My RAG Chatbot API uses local MiniLM embeddings, PostgreSQL with pgvector and Gemini, with JWT auth and Docker. MedScholar is retrieval at a much bigger scale. And this answer came from a small retrieval agent too.", s: [['Code: RAG Chatbot API', `${GH}/Ai-chatbot`], ['MedScholar project', '#p-medscholar']] },
  { t: 'React and frontend', k: 'react frontend front end ui ux typescript javascript vite web interface css html threejs three design', a: "Yes. MedScholar's client is React 18 with TypeScript and Vite, my e-wallet app has a React frontend, and this site is hand-written JavaScript with Three.js. I also build mobile apps in Flutter (TechiesLog, IntelliShot).", s: [['Skills', '#skills'], ['Code: MedScholar', `${GH}/MedScholar`]] },
  { t: 'Programming languages', k: 'language languages programming coding code write speak spoken', a: "Python is my main language, plus Java, C++, SQL, JavaScript/TypeScript and Dart for Flutter. For spoken languages, ask me directly.", s: [['Skills', '#skills']] },
  { t: 'Full stack', k: 'full stack fullstack end whole layers frontend backend deployment ship', a: "Yes, from model to deployment. MedScholar is the proof: MedCPT embeddings and a FAISS index as the model layer, FastAPI and Express APIs, a React + TypeScript client, and Docker with Caddy on AWS EC2.", s: [['Skills', '#skills'], ['MedScholar project', '#p-medscholar']] },
  { t: 'Python and backend', k: 'python backend api fastapi node nodejs express postgresql postgres prisma redis server database sql', a: "Python is my main language. I build APIs with FastAPI, and I've also used Node.js with Express, PostgreSQL with Prisma, and Redis for caching, all in MedScholar.", s: [['Skills', '#skills']] },
  { t: 'Java, C++ and DSA', k: 'java spring boot cpp c dsa algorithms data structures leetcode neetcode coding problem solving', a: "I practise problem solving in Java (my NeetCode submissions sync to GitHub) and built a Spring Boot + React e-wallet app. I also know C++ and SQL.", s: [['Code: NeetCode', `${GH}/neetcode-submissions`], ['Code: E-wallet', `${GH}/E-wallet-management-app`]] },
  { t: 'Cloud and DevOps', k: 'cloud aws ec2 azure gcp google docker kubernetes devops deploy deployment linux caddy nginx raspberry', a: "MedScholar runs on AWS EC2 with Docker and Caddy. I hold Microsoft Azure Fundamentals (AZ-900), I've used Google Cloud at the Google Cloud AI Lab, and I've deployed an edge camera server on a Raspberry Pi.", s: [['Skills', '#skills']] },
  { t: 'Fine-tuning LLMs', k: 'fine tune tuning finetune lora peft unsloth llama training model custom', a: "I've fine-tuned LLaMA-2-7B with LoRA and Unsloth for MindfulChat, an empathetic counselling assistant that runs fully locally with no API dependency.", s: [['Resume (PDF)', 'assets/Vinoth-P-Resume.pdf']] },
  { t: 'Computer vision and ML', k: 'computer vision yolo opencv image detection object cnn deep learning machine learning tensorflow pytorch keras scikit model', a: "In my internship at Postulate Info Tech I built a real-time road-detection pipeline with YOLO and OpenCV, evaluated with mAP, precision, recall and ROC-AUC. I also built breast-cancer and Parkinson's models, a finger-controlled virtual mouse, and a crowd-density camera on a Raspberry Pi.", s: [['Skills', '#skills']] },
  { t: 'Internship and experience', k: 'experience internship intern work job worked company postulate data scientist professional', a: "Data Scientist Intern at Postulate Info Tech, Coimbatore (Feb–Apr 2025, hybrid): road detection with YOLO and OpenCV, breast-cancer and Parkinson's prediction models, and neural style transfer.", s: [['Experience & education', '#experience']] },
  { t: 'Certifications', k: 'certification certified certificate certificates certs credential credentials badge github salesforce oracle microsoft', a: "Seventeen, including GitHub Certified: Agentic AI Developer, Salesforce Certified Agentforce Specialist, Oracle Agentic AI Foundations Associate, Microsoft Azure Fundamentals, two Atlassian specialist certifications, three from Copado, and NPTEL Gold in Big Data Computing.", s: [['Certifications', '#certifications']] },
  { t: 'The registered design (patent)', k: 'patent design registered registration invention inventor baby chair airbag government india', a: "Design No. 421785-002, a baby chair with an airbag stored at the top centre of the backrest that inflates like a neck pillow, registered under the Designs Act, 2000 (registered 1 Jul 2024, certified 14 Aug 2024). I co-invented it with Niranjan P.N, mentored by Dr. Ganesh R and Dr. D. Santhosh Shanthakumar.", s: [['Achievements', '#achievements']] },
  { t: 'Hackathons and awards', k: 'hackathon hackathons award awards prize won win competition finalist achievement expo', a: "Cognizant Hackathon 2026 (MedScholar), Anveshana Science Expo finalist (35 of 318, the only first-year team), TNPCB Bag-It Challenge finalist (15 of 300), 2nd place at Science Expo 2024, and five agents built in one day at Agent Build Day 2025.", s: [['Achievements', '#achievements']] },
  { t: 'Education and CGPA', k: 'education college degree university cgpa gpa marks grade study studying school student btech be', a: "B.E. Computer Science (AI & ML) at Sri Krishna College of Technology, Coimbatore, 2023–2027, with a CGPA of 8.19.", s: [['Experience & education', '#experience']] },
  { t: 'Salary expectations', k: 'salary compensation ctc pay package stipend expected expectation money lpa', a: "I'd rather understand the role first, then talk numbers. Email me and we'll find something fair for both sides.", s: [['Contact', '#contact']] },
  { t: 'Why hire Vinoth', k: 'why hire strength strengths stand out different unique value reason should choose', a: "Three reasons. I ship: 36 million papers searchable on one server. I build agents carefully: adversarial checks, auditable decisions, traces. And I learn fast: 17 certifications, most of them in the last year.", s: [['The 90-day plan', '#plan']] },
  { t: 'Still learning (weaknesses)', k: 'weakness weaknesses improve improving learning next gap gaps growth challenge struggle', a: "Right now I'm going deeper on agent memory, evaluation and multi-agent coordination, the hard parts of making agents reliable. I'm still a student, so running systems at real production scale is where I want mentorship most.", s: [['The 90-day plan', '#plan']] },
  { t: 'Open source', k: 'open source opensource foss github contribution contribute techieslog community', a: "TechiesLog is my open-source, offline-first productivity and finance tracker in Flutter (MIT, v1.0 released). I'm active in FOSS United Coimbatore meetups.", s: [['Code: TechiesLog', `${GH}/techieslog`]] },
  { t: 'Resume', k: 'resume cv pdf download document', a: "You can download my resume as a PDF right here.", s: [['Download resume', 'assets/Vinoth-P-Resume.pdf']] },
  { t: 'Contact details', k: 'contact email mail phone number call reach linkedin message talk', a: "Email is fastest: vinoth322006@gmail.com. I'm also on LinkedIn and GitHub. My phone number is on my resume.", s: [['Contact', '#contact'], ['LinkedIn', 'https://www.linkedin.com/in/vinoth-p-aimlengineer']] },
  { t: 'Teamwork and leadership', k: 'team teamwork leadership lead leader collaborate collaboration communication ambassador mentor tutor', a: "MedScholar was a team of eight. I've been an IIT Bombay Campus Ambassador (event participation up 20%), a member of my college's Institution's Innovation Council, and a weekly Python & ML peer tutor.", s: [['Experience & education', '#experience']] },
  { t: 'Volunteering', k: 'volunteer volunteering teaching teach tutor english social u&i trust don bosco iot mentor', a: "I taught English weekly with U&I Trust at Don Bosco Anbu Illam (Mar–Jun 2025), and mentored students at Wheels on Bot, an IoT course.", s: [['Experience & education', '#experience']] },
  { t: 'Atlassian and Jira', k: 'atlassian jira confluence itsm agile devops rovo forge loom jsm scrum', a: "I'm an Atlassian Certified ITSM Specialist and Agile DevOps Specialist, with Rovo, Cloud, JSM with AI, Forge and Loom Fundamentals.", s: [['Certifications', '#certifications']] },
  { t: 'Salesforce, Agentforce and Copado', k: 'salesforce agentforce copado data cloud crm agentia', a: "Salesforce Certified Agentforce Specialist, plus Copado AI Certified Professional, Agentia Advanced and Data 360.", s: [['Certifications', '#certifications']] },
  { t: 'Writing and community', k: 'writing articles blog posts linkedin community events meetup devfest aws builder', a: "I write about agents on LinkedIn. My pieces on OpenClaw and Moltbook (2,939 impressions) and on cutting Claude Code token use (2,611) did best. I show up at FOSS United, DevFest, AWS Builder Center and Atlassian ACE meetups.", s: [['LinkedIn', 'https://www.linkedin.com/in/vinoth-p-aimlengineer/recent-activity/all/']] },
  { t: 'Agent Build Day', k: 'agent build day hackerearth agent.ai bengaluru bangalore five 5 one day marketing', a: "At Agent Build Day 2025 (HackerEarth × Agent.ai, Bengaluru) I built and published five AI agents in a single day in the marketing track. 'Partnership & Sales Strategy Finder' is public on the platform.", s: [['Projects', '#projects']] },
  { t: 'Robots and physical AI', k: 'robot robotics physical hardware iot arduino telegram bot openclaw raspberry sensor', a: "At the OpenClaw Masterclass I built a Telegram bot on a self-hosted OpenClaw agent whose tool calls drive a real IP robot. Earlier I did Arduino and IoT builds, and an edge camera server on a Raspberry Pi.", s: [['Projects', '#projects']] },
  { t: 'Mobile apps and Flutter', k: 'mobile app apps android flutter dart ios techieslog intellishot', a: "I build mobile apps in Flutter: TechiesLog (offline productivity and finance tracker, open source) and IntelliShot (turns screenshots into structured notes with Gemini).", s: [['Code: TechiesLog', `${GH}/techieslog`], ['Code: IntelliShot', `${GH}/Intellishot`]] },
  { t: 'How this site works', k: 'site website portfolio built how made dots particles 3d this page', a: "It's hand-written HTML, CSS and JavaScript. The ink-dot visuals (MedScholar's 150 GB → 4 GB compression and the airbag chair) are Three.js. This answer came from a BM25 search over my notes, running in your browser. No framework, no tracking.", s: [['Ask my portfolio', '#ask']] },
];

/* ---------- text processing ---------- */
const STOP = new Set('a an the is are was were be been being do does did he she his her him i me my you your we our us of to in on for with at by from and or as it its this that what which how can could would should will has have had any some there their them they than then so if not no yes please tell know about does vinoth vinoth\'s p'.split(' '));
STOP.delete('about');
const ALIAS = { certified: 'certification', certificate: 'certification', certificates: 'certification', certs: 'certification', cert: 'certification', js: 'javascript', ts: 'typescript', k8s: 'kubernetes', bengaluru: 'bangalore', favourite: 'favorite', cv: 'resume', ml: 'machine', ai: 'agent' };
const SYN = {
  react: ['frontend'], frontend: ['react', 'ui'], ui: ['frontend'], ux: ['frontend'], web: ['frontend'],
  node: ['backend'], nodejs: ['backend'], api: ['backend'], llm: ['rag', 'agent'], llms: ['rag', 'agent'], gpt: ['llm'], chatgpt: ['llm'], openai: ['llm'],
  salary: ['compensation'], ctc: ['compensation'], pay: ['compensation'], stipend: ['compensation'], package: ['compensation'],
  hire: ['why'], strength: ['why'], strengths: ['why'], weakness: ['learning'], weaknesses: ['learning'],
  phone: ['contact'], email: ['contact'], call: ['contact'], reach: ['contact'],
  work: ['experience'], job: ['experience'], intern: ['internship'],
  aws: ['cloud'], azure: ['cloud'], gcp: ['cloud'], docker: ['devops'], kubernetes: ['devops'],
  patent: ['design'], invention: ['design'], award: ['hackathon'], awards: ['hackathon'], won: ['hackathon'], prize: ['hackathon'],
  college: ['education'], degree: ['education'], cgpa: ['education'], gpa: ['education'], marks: ['education'],
  join: ['availability'], start: ['availability'], notice: ['availability'], relocate: ['location'], remote: ['location'],
  team: ['teamwork'], lead: ['leadership'], github: ['code', 'open'], project: ['best'], projects: ['best'],
};
const stem = (w) => (w.length > 4 ? w.replace(/(ings|ing|ies|ers|er|ed|es|s)$/, '') : w);
const words = (s) => s.toLowerCase().replace(/c\+\+/g, ' cpp ').split(/[^a-z0-9&]+/).filter(Boolean);
const tokens = (s) => words(s).filter((w) => !STOP.has(w)).map((w) => stem(ALIAS[w] || w));

/* ---------- BM25 index ---------- */
const docs = NOTES.map((n) => {
  const toks = [...tokens(n.t), ...tokens(n.t), ...tokens(n.k), ...tokens(n.k), ...tokens(n.k), ...tokens(n.a)];
  const tf = new Map();
  toks.forEach((w) => tf.set(w, (tf.get(w) || 0) + 1));
  return { n, tf, len: toks.length };
});
const df = new Map();
docs.forEach((d) => d.tf.forEach((_, w) => df.set(w, (df.get(w) || 0) + 1)));
const avgLen = docs.reduce((s, d) => s + d.len, 0) / docs.length;
const K1 = 1.3, B = 0.55, THRESHOLD = 2.2;
const WEAK = new Set(['experience', 'project', 'work', 'skill', 'know', 'use', 'used', 'good', 'tell', 'like', 'want', 'much', 'many', 'any', 'level', 'well'].map((w) => stem(w)));

export function search(q) {
  const weights = new Map();
  const toks = tokens(q);
  const allWeak = toks.every((w) => WEAK.has(w));
  toks.forEach((w) => weights.set(w, WEAK.has(w) && !allWeak ? 0.35 : 1));
  words(q).forEach((w) => (SYN[w] || []).forEach((s) => { const t = stem(ALIAS[s] || s); if (!weights.has(t)) weights.set(t, 0.6); }));
  return docs.map((d) => {
    let score = 0;
    weights.forEach((wt, w) => {
      const f = d.tf.get(w);
      if (!f) return;
      const n = df.get(w);
      const idf = Math.log(1 + (docs.length - n + 0.5) / (n + 0.5));
      score += wt * idf * ((f * (K1 + 1)) / (f + K1 * (1 - B + (B * d.len) / avgLen)));
    });
    return { note: d.n, score };
  }).sort((x, y) => y.score - x.score);
}

/* ---------- UI ---------- */
const form = document.getElementById('ask-form');
const input = document.getElementById('ask-q');
const box = document.querySelector('.answer');
const textEl = box.querySelector('.answer__text');
const live = document.getElementById('ask-live');
const src = box.querySelector('.answer__src');
const meta = box.querySelector('.answer__meta');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
let streamId = 0;

function stream(text) {
  const id = ++streamId;
  if (reduce) { textEl.textContent = text; return; }
  let i = 0;
  textEl.textContent = '';
  const step = () => {
    if (id !== streamId) return;
    i = Math.min(text.length, i + 3);
    textEl.textContent = text.slice(0, i);
    if (i < text.length) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function link(label, href) {
  const a = document.createElement('a');
  a.href = href;
  a.textContent = href.startsWith('#') ? `${label} ↓` : `${label} ↗`;
  if (href.startsWith('http')) { a.target = '_blank'; a.rel = 'noopener'; }
  if (href.endsWith('.pdf')) a.setAttribute('download', '');
  return a;
}

function ask(raw) {
  const q = raw.trim().slice(0, 200);
  if (!q) { input.focus(); return; }
  const t0 = performance.now();
  const ranked = search(q);
  const ms = performance.now() - t0;
  const top = ranked[0];
  const found = Boolean(top && top.score >= THRESHOLD);
  const text = found ? top.note.a : "I don't have a note on that yet, and I'd rather not guess. Ask the real me instead.";

  box.hidden = false;
  live.textContent = text;
  stream(text);

  src.replaceChildren();
  const lab = document.createElement('span');
  lab.className = 'lab';
  if (found) {
    lab.textContent = 'Receipts';
    src.append(lab, ...top.note.s.map(([l, h]) => link(l, h)));
    const next = ranked[1];
    if (next && next.score >= THRESHOLD * 0.9 && next.note !== top.note) {
      const rel = document.createElement('button');
      rel.type = 'button';
      rel.className = 'linkbtn';
      rel.textContent = `Related: ${next.note.t}`;
      rel.addEventListener('click', () => { input.value = next.note.t; ask(next.note.t); });
      src.append(rel);
    }
  } else {
    lab.textContent = 'Ask him';
    const body = `Hi Vinoth,\n\nI was reading your portfolio and asked: "${q}"\n\n`;
    src.append(lab, link('Email this question to Vinoth', `mailto:vinoth322006@gmail.com?subject=${encodeURIComponent('A question from your portfolio')}&body=${encodeURIComponent(body)}`));
    src.lastChild.removeAttribute('target');
    src.lastChild.textContent = 'Email this question to Vinoth →';
  }
  const took = ms < 0.1 ? '<0.1' : ms.toFixed(1);
  meta.textContent = `Ranked ${NOTES.length} notes in ${took} ms · ${found ? `best match “${top.note.t}”, score ${top.score.toFixed(1)}` : `best score ${top ? top.score.toFixed(1) : '0'} was below my confidence bar`}`;
  dispatchEvent(new CustomEvent('portfolio:ask', { detail: { found } }));
}

form.addEventListener('submit', (e) => { e.preventDefault(); ask(input.value); });
document.querySelectorAll('[data-q]').forEach((btn) => btn.addEventListener('click', () => { input.value = btn.dataset.q; ask(btn.dataset.q); }));

export { THRESHOLD, NOTES };
