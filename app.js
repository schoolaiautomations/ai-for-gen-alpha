/* AI Academy interactive prototype. All learning assets stay inside the app. */
const state = {
  activeView: "home",
  hero: { name: "STARBYTE", primary: "#ffbd61", secondary: "#ed5c88", glow: "#9effee", power: "Vision Shield", level: 1 },
  trained: false,
  trainedMode: "image",
  trainingAssignments: [],
  testDone: false,
  appIndex: 0,
  promptTokens: [],
  shieldScore: 0,
  shieldStep: 0,
  project: "",
  trainingTimer: null,
  completed: new Set(),
};
const progressStorageKey = "ai-academy-prototype-progress-v1";

function persistProgress() {
  try {
    localStorage.setItem(progressStorageKey, JSON.stringify({
      hero: state.hero,
      trained: state.trained,
      trainedMode: state.trainedMode,
      testDone: state.testDone,
      promptTokens: state.promptTokens,
      shieldScore: state.shieldScore,
      shieldStep: state.shieldStep,
      project: state.project,
      intelligenceExtracted: Boolean(state.intelligenceExtracted),
      roboPlaced: state.roboPlaced || [],
      untrainedTestedItems: state.untrainedTestedItems || [],
      completed: [...state.completed],
    }));
  } catch { /* The academy still works when browser storage is unavailable. */ }
}

function restoreProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(progressStorageKey));
    if (!saved) return;
    state.hero = { ...state.hero, ...saved.hero };
    state.hero.level = Number.isInteger(saved.hero?.level) ? Math.min(4, Math.max(1, saved.hero.level)) : 1;
    state.trained = Boolean(saved.trained);
    state.trainedMode = ["image", "sound", "text"].includes(saved.trainedMode) ? saved.trainedMode : "image";
    state.testDone = Boolean(saved.testDone);
    state.promptTokens = Array.isArray(saved.promptTokens) ? saved.promptTokens : [];
    state.shieldScore = Number.isFinite(saved.shieldScore) ? saved.shieldScore : 0;
    state.shieldStep = Number.isFinite(saved.shieldStep) ? saved.shieldStep : 0;
    state.project = typeof saved.project === "string" ? saved.project : "";
    state.intelligenceExtracted = Boolean(saved.intelligenceExtracted);
    state.roboPlaced = Array.isArray(saved.roboPlaced) ? saved.roboPlaced : [];
    state.untrainedTestedItems = Array.isArray(saved.untrainedTestedItems) ? saved.untrainedTestedItems : [];
    state.completed = new Set(Array.isArray(saved.completed) ? saved.completed : []);
    // Hero Forge was removed from the learner journey; discard stale completion data.
    state.completed.delete("hero");
  } catch { /* Start a fresh journey when previous local data is incomplete. */ }
}

const supervisedData = [
  { icon: "🍎", kind: "apple", image: "/images/apple1.jpg", label: "Photo 01", category: "Apple" },
  { icon: "🍌", kind: "banana", image: "/images/banana1.jpg", label: "Photo 02", category: "Banana" },
  { icon: "🍏", kind: "apple", image: "/images/apple2.jpg", label: "Photo 03", category: "Apple" },
  { icon: "🍌", kind: "banana", image: "/images/banana2.jpg", label: "Photo 04", category: "Banana" },
];

const supervisedTests = [
  { id: "red-apple-mystery", label: "Fruit image A", kind: "apple", image: "/images/apple3.jpg", answer: "Apple", confidence: 92, reasons: ["Round apple-like shape", "Red skin closely matches the apple training examples", "Small stem and top dimple pattern match learned apple features"] },
  { id: "green-apple-mystery", label: "Fruit image B", kind: "green-apple", image: "/images/green_apple.jpg", answer: "Apple", confidence: 70, reasons: ["Round shape and stem are apple-like", "A green apple is still an apple, but its color differs from the red training photos", "The overall contour and stem structure give the model strong clues"] },
  { id: "orange-mystery", label: "Fruit image C", kind: "orange", image: "/images/orange.jpg", answer: "Apple", confidence: 38, reasons: ["Its round outline is slightly similar to an apple", "Orange color and citrus skin texture do not match learned apple photos", "No apple stem or signature indent, so confidence is low"] },
];

const unsupervisedAudioData = [
  { id: "sound-1", label: "Audio Sample 01", audio: "/sounds/bird-sounds/1.mp3", category: "Cluster" },
  { id: "sound-2", label: "Audio Sample 02", audio: "/sounds/drums-sounds/1.mp3", category: "Cluster" },
  { id: "sound-3", label: "Audio Sample 03", audio: "/sounds/bird-sounds/2.mp3", category: "Cluster" },
  { id: "sound-4", label: "Audio Sample 04", audio: "/sounds/drums-sounds/2.mp3", category: "Cluster" },
];

const unsupervisedMysteryTests = [
  {
    id: "mystery-sound-1",
    label: "Mystery Sound A",
    audio: "/sounds/bird-sounds/3.mp3",
    targetBasket: "basket-1",
    basketName: "Basket 1 (High Pitch / Chirp Pattern)",
    similarity: 94,
    reasons: ["Fast high-frequency oscillations", "Rapid melodic chirp bursts", "Waveform envelope matches Cluster 1"]
  },
  {
    id: "mystery-sound-2",
    label: "Mystery Sound B",
    audio: "/sounds/drums-sounds/3.mp3",
    targetBasket: "basket-2",
    basketName: "Basket 2 (Low Beat / Rhythm Pattern)",
    similarity: 96,
    reasons: ["Deep low-end acoustic transients", "Repeating rhythmic cadence and tempo", "Waveform envelope matches Cluster 2"]
  }
];

const villageDataPoints = [
  { icon: "🐄", text: "A cow gets stuck in the muddy village pond." },
  { icon: "🌧️", text: "Dark clouds bring heavy rain during evening chores." },
  { icon: "👵", text: "An old grandmother is alone at home when water starts entering her hut." },
  { icon: "🏮", text: "Villagers come together with ropes and lanterns to help." },
];

const villageStoryData = {
  title: "The Village Rescue in the Rain",
  paragraphs: [
    "It was evening in the village, and Meena was bringing the cattle home when she noticed one cow stuck deep in the muddy pond, struggling to get out. She called out for help, but before anyone could reach the pond, dark clouds rolled in and heavy rain began to pour.",
    "The rain got heavier, and water started rising in the narrow village lanes. In one small hut near the fields, old Amma was alone, and she watched with worry as water slowly began entering her home.",
    "Hearing the commotion, the villagers gathered quickly. Some men brought a strong rope to pull the cow out of the pond, while others grabbed lanterns and rushed through the rain to check on Amma. They helped her move to higher ground, wrapping her in a warm shawl.",
    "By the time the rain stopped, the cow was safely back with the herd, and Amma was sitting by a fire in a neighbor's house, sipping hot tea, thankful for her caring village."
  ],
  patterns: [
    "Cow stuck in the muddy village pond (from Training Point 1)",
    "Dark clouds and heavy evening rain (from Training Point 2)",
    "Old grandmother alone as water enters her hut (from Training Point 3)",
    "Villagers uniting with ropes and lanterns to help (from Training Point 4)"
  ]
};

const scenarios = [
  {
    tag: "HALLUCINATION DETECTED",
    badgeIcon: "sparkles",
    title: "1. The Invention of Fake Facts (Hallucination)",
    explanation: "AI generates text by predicting plausible words, not by verifying truth. It can invent completely imaginary historical events, fake books, or impossible science that sound very persuasive.",
    claim: "Abraham Lincoln wrote a famous poem on his smartphone in 1863 calling lunar robots his best friends!",
    good: "🔍 Pause & Spot the Hallucination: Smart phones weren't invented until 2007! AI hallucinated because the words sounded fluent and creative.",
    bad: "Copy & paste it directly into your school history report because the AI wrote it in sophisticated English.",
    answer: 0
  },
  {
    tag: "OVERCONFIDENCE TRAP",
    badgeIcon: "shield-alert",
    title: "2. The 100% Certainty Trap (Overconfidence)",
    explanation: "AI has no feelings of doubt or uncertainty. It will use authoritative words like 'Without question', 'Scientifically proven', or '100% certain' even when giving totally false advice.",
    claim: "I am 100% scientifically certain that drinking seawater makes humans run at 80 MPH. It is a proven biological fact!",
    good: "🛑 Reject & Check Medical Science: AI confidence is NEVER proof of accuracy. Always verify health, safety, and science claims with trusted human sources.",
    bad: "Believe it immediately without questioning because the AI stated it with 100% certainty.",
    answer: 0
  },
  {
    tag: "OUTDATED KNOWLEDGE",
    badgeIcon: "clock",
    title: "3. The Frozen Knowledge Trap (Outdated Data)",
    explanation: "AI models only know the information they were trained on up to their training cutoff date. They don't know live breaking events or today's local weather unless connected to live tools.",
    claim: "Today's weather in your city is guaranteed to be 28°C and sunny with zero chance of rain!",
    good: "📡 Check Live Sources: AI knowledge can be frozen in the past. Always check real-time weather radar or news for live dynamic data.",
    bad: "Leave your umbrella at home during a thunderstorm because the AI claimed it will be sunny today.",
    answer: 0
  }
];

const chapters = [
  { id: "robo", label: "Create a Robo", description: "Build your robot by dragging parts together", icon: "bot", color: "#38bdf8" },
  { id: "untrained_ask", label: "Ask Robo Without Training", description: "Test your untrained robot with fruit photos & audio files!", icon: "help-circle", color: "#f43f5e" },
  { id: "supervised", label: "Supervised Learning", description: "Train with labeled fruit photos & predict", icon: "brain-circuit", color: "#8fffe8" },
  { id: "unsupervised", label: "Unsupervised Learning", description: "Cluster unlabeled sounds into 2 baskets", icon: "layers", color: "#a58cff" },
  { id: "generative", label: "Generative AI", description: "Create new stories from trained data", icon: "sparkles", color: "#ff8cb8" },
  { id: "applications", label: "AI Applications", description: "Discover 6 real-world AI superpowers", icon: "cpu", color: "#60d7ff" },
  { id: "reality", label: "AI Can Make Mistakes", description: "Learn about hallucinations, overconfidence & fact-checking", icon: "shield-alert", color: "#64e9a4" },
  { id: "extract", label: "Extract Intelligence", description: "Transfer Nova's learned skills into an Intelligence Core", icon: "disc-3", color: "#b987ff" },
  { id: "creator", label: "Creator Lab", description: "Invent your own AI", icon: "rocket", color: "#ffcf69" },
];
const chapterOrder = ["robo", "untrained_ask", "supervised", "unsupervised", "generative", "applications", "reality", "extract", "creator"];

const content = document.querySelector("#content-view");
const toast = document.querySelector("#toast");
let activeAudio = null;

function icon(name) { return `<i data-lucide="${name}"></i>`; }
function refreshIcons() { window.lucide?.createIcons({ attrs: { "stroke-width": 1.8 } }); }
function toastMessage(message, isCelebration = false) {
  toast.innerHTML = message;
  toast.className = `toast ${isCelebration ? "celebration" : ""} show`;
  clearTimeout(toastMessage.timer);
  toastMessage.timer = setTimeout(() => toast.className = "toast", 3400);
}
function complete(id) { state.completed.add(id); persistProgress(); updateProgress(); }
function updateProgress() {
  const count = state.completed.size;
  document.querySelector("#global-progress").style.width = `${Math.min(100, (count / chapters.length) * 100)}%`;
  document.querySelector("#progress-label").textContent = `${count} / ${chapters.length} chapters`;
}
function setActiveNavigation(id) {
  document.querySelectorAll(".side-link").forEach((button) => button.classList.toggle("active", button.dataset.view === id));
}
function canAccess(view) {
  const index = chapterOrder.indexOf(view);
  return index < 0 || chapterOrder.slice(0, index).every((chapter) => state.completed.has(chapter));
}
function navigate(view) {
  if (!canAccess(view)) {
    const nextChapter = chapters[chapterOrder.indexOf(view) - 1];
    toastMessage(`Complete ${nextChapter.label} before this mission unlocks.`);
    return;
  }
  if (state.trainingTimer) {
    clearInterval(state.trainingTimer);
    state.trainingTimer = null;
  }
  if (typeof stopCarSimulation === "function") {
    stopCarSimulation();
  }
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.currentTime = 0;
    activeAudio = null;
  }
  state.activeView = view;
  setActiveNavigation(view);
  const renderers = {
    home: renderHome,
    robo: renderRobo,
    untrained_ask: renderUntrainedAsk,
    supervised: renderSupervised,
    unsupervised: renderUnsupervised,
    generative: renderGenerative,
    applications: renderApplications,
    reality: renderReality,
    extract: renderExtract,
    creator: renderCreator,
    profile: renderProfile
  };
  renderers[view]?.();
  window.scrollTo(0, 0);
  content.focus({ preventScroll: true });
  refreshIcons();
}
function header(kicker, title, description, number = "") { return `<header class="view-header"><div><p class="kicker">${kicker}</p><h2>${title}</h2><p>${description}</p></div>${number ? `<div class="view-number">${number}</div>` : ""}</header>`; }
function renderHome() {
  const chapterMarkup = chapters.map((chapter, index) => {
    const locked = !canAccess(chapter.id);
    const completed = state.completed.has(chapter.id);
    return `<button class="chapter-card" data-view="${chapter.id}" style="--chapter-color:${chapter.color}" ${locked ? "disabled" : ""}><span class="chapter-icon">${icon(chapter.icon)}</span><h4>${chapter.label}</h4><p>${chapter.description}</p><span class="chapter-state ${locked ? "lock" : ""}">${completed ? icon("badge-check") : locked ? icon("lock-keyhole") : icon("arrow-up-right")}</span></button>`;
  }).join("");
  const statusText = "Welcome cadet! Meet Nova, build your robot, and discover how AI learns from examples, sounds, words, and your ideas.";
  const firstView = "robo";
  const firstLabel = "Continue my mission";
  content.innerHTML = `<div class="academy-home"><section class="world-hero"><div class="world-copy"><p class="kicker">MISSION CONTROL // YOUR NEXT CHAPTER</p><h1>Welcome to your <span>AI adventure.</span></h1><p>${statusText} Explore the Academy, then master Supervised Learning, Unsupervised Clustering, Generative AI, and Real-World Applications.</p><button class="button button-primary" data-view="${firstView}"><span>${firstLabel}</span>${icon("arrow-right")}</button><div class="world-facts"><span>${icon("sparkles")} 7 learning worlds</span><span>${icon("shield-check")} Safe built-in data</span></div></div><div class="academy-island" aria-label="AI Academy floating campus"><div class="academy-cloud cloud-one"></div><div class="academy-cloud cloud-two"></div><div class="flight-path path-one"></div><div class="flight-path path-two"></div><div class="academy-island-base"><div class="island-grass"></div><div class="island-rock rock-left"></div><div class="island-rock rock-right"></div></div><button class="world-node forge-node ${state.completed.has("robo") ? "world-done" : "world-current"}" data-view="robo" aria-label="Open Create a Robo"><span class="node-icon">${icon("bot")}</span><b>Meet Nova</b></button><button class="world-node lab-node ${canAccess("supervised") ? "world-current" : "world-locked"}" data-view="supervised" aria-label="Open Supervised Learning"><span class="node-icon">${icon("brain-circuit")}</span><b>Supervised Learning</b></button><button class="world-node arena-node ${canAccess("unsupervised") ? "world-current" : "world-locked"}" data-view="unsupervised" aria-label="Open Unsupervised Learning"><span class="node-icon">${icon("layers")}</span><b>Unsupervised Learning</b></button><button class="world-node genai-node ${canAccess("generative") ? "world-current" : "world-locked"}" data-view="generative" aria-label="Open Generative AI"><span class="node-icon">${icon("sparkles")}</span><b>Generative AI</b></button><button class="world-node shield-node ${canAccess("reality") ? "world-current" : "world-locked"}" data-view="reality" aria-label="Open Reality Shield"><span class="node-icon">${icon("shield-check")}</span><b>Reality Shield</b></button><div class="academy-beacon"><span></span><span></span><span></span></div><div class="academy-star">✦</div></div></section><section class="mission-row"><article class="mission-card"><span class="card-tag">UP NEXT</span><h3>Meet Nova</h3><p>Drag and drop Nova's parts to assemble your learning companion.</p><button data-view="robo">Build Nova ${icon("arrow-up-right")}</button><span class="mission-icon">🤖</span></article><article class="mission-card"><span class="card-tag">LEARNING CORE</span><h3>${state.trained ? "Nova is trained" : "Training waiting"}</h3><p>${state.trained ? "Nova is ready for testing." : "Start Supervised Learning."}</p><button data-view="supervised">Teach Nova ${icon("arrow-up-right")}</button><span class="mission-icon">✦</span></article><article class="mission-card"><span class="card-tag">NOVA'S NOTE</span><h3>Curiosity wins</h3><p>AI learns patterns. Humans ask why they matter.</p><button data-view="reality">Reality Shield ${icon("arrow-up-right")}</button><span class="mission-icon">?</span></article></section><div class="section-title"><h3>Academy chapters</h3><span>${state.completed.size} completed</span></div><section class="chapter-grid">${chapterMarkup}</section></div>`;
}
const heroLevelsData = [
  {
    level: 1,
    tierBadge: "TIER 01 // BASE HERO",
    tierName: "Cyber Cadet",
    icon: "🛡️",
    tagline: "Agile AI core with foundational machine sensing & logic.",
    powerName: "Neural Pattern Sense",
    description: "Equipped with foundational AI machine learning, adaptive micro-armor, and clean aerodynamic flight stabilization.",
    stats: { vision: 30, audio: 25, creation: 20, strength: 35 },
    features: [
      "1.2 TeraFLOPs Neural Micro-Kernel",
      "Adaptive Anti-Gravity Hover Flight",
      "Basic Object & Signal Detection",
      "Glow-Pulse Antenna Receiver"
    ]
  },
  {
    level: 2,
    tierBadge: "TIER 02 // OPTIC SENSORS",
    tierName: "Optic Sentinel",
    icon: "👁️",
    tagline: "Ultra-fast computer vision, laser targeting, and 360° LIDAR mapping.",
    powerName: "Optic Laser & 360° LIDAR",
    description: "Adds dual cybernetic optic laser visors, 360° photon LIDAR mapping, thermal HUD scanning, and optical sensor winglets on top of Level 1.",
    stats: { vision: 95, audio: 35, creation: 45, strength: 65 },
    features: [
      "360° Real-Time Photon LIDAR Mapping",
      "Multi-Spectral Infrared & X-Ray Scanners",
      "10,000 Objects/sec Computer Vision",
      "High-Energy Laser Targeting Reticle"
    ]
  },
  {
    level: 3,
    tierBadge: "TIER 03 // AUDIO & NLP",
    tierName: "Sonic Oracle",
    icon: "🎙️",
    tagline: "Master of multi-language NLP, acoustic wave resonance, and vocal command synthesis.",
    powerName: "Harmonic Voice & Sonic Pulse",
    description: "Adds dual acoustic sonic ear resonators, holographic vocal frequency synthesizers, sub-woofer bass aura, and soundwave pulse wings on top of Level 2 vision.",
    stats: { vision: 95, audio: 98, creation: 70, strength: 82 },
    features: [
      "200+ Language NLP Voice Translation",
      "Acoustic Frequency Pulse Cannons",
      "Sub-Harmonic Emotion & Lie Detection",
      "Holographic Waveform Speech Synthesizer"
    ]
  },
  {
    level: 4,
    tierBadge: "TIER 04 // MEGAZORD TITAN",
    tierName: "MEGAZORD OMNI-CREATOR",
    icon: "👑",
    tagline: "Supreme God-Tier Mecha AI. Can do anything, can create anything with infinite strength.",
    powerName: "Universal Creation & Infinite Energy",
    description: "The ultimate Mecha Megazord titan! Forged with heavy adamantine exoskeleton armor, quad plasma wings, quantum matter creation core, dual laser gauntlets, and cosmic lightning aura.",
    stats: { vision: 100, audio: 100, creation: 100, strength: 100 },
    features: [
      "Universal Generative Code & Matter Synthesis",
      "Quad-Plasma Hyper Wings & Heavy Mecha Exoskeleton",
      "Quantum Singularity Core with Infinite Energy",
      "All Powers Combined: Vision, Sonic & Omnipotent Creation"
    ]
  }
];

function renderHeroGraphic(level = 1, primary = "#ffbd61", secondary = "#ed5c88", glow = "#9effee", name = "STARBYTE") {
  const isL2 = level >= 2;
  const isL3 = level >= 3;
  const isL4 = level === 4;

  return `
    <svg viewBox="0 0 340 360" xmlns="http://www.w3.org/2000/svg" class="hero-animated-float">
      <defs>
        <!-- Gradients -->
        <linearGradient id="heroGradBody" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${primary}" />
          <stop offset="50%" stop-color="${secondary}" />
          <stop offset="100%" stop-color="#1e1b4b" />
        </linearGradient>

        <linearGradient id="heroGradHead" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${secondary}" />
          <stop offset="100%" stop-color="${primary}" />
        </linearGradient>

        <linearGradient id="heroGradGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fef08a" />
          <stop offset="50%" stop-color="#f59e0b" />
          <stop offset="100%" stop-color="#b45309" />
        </linearGradient>

        <linearGradient id="heroGradPlasma" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#38bdf8" />
          <stop offset="50%" stop-color="#818cf8" />
          <stop offset="100%" stop-color="#ec4899" />
        </linearGradient>

        <radialGradient id="heroCoreGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="40%" stop-color="${glow}" />
          <stop offset="80%" stop-color="#0284c7" />
          <stop offset="100%" stop-color="transparent" />
        </radialGradient>

        <radialGradient id="megazordCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="30%" stop-color="#fbbf24" />
          <stop offset="60%" stop-color="#f43f5e" />
          <stop offset="100%" stop-color="#7c3aed" />
        </radialGradient>

        <!-- Filters -->
        <filter id="neonGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        <filter id="megaglow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="10" result="blur1" />
          <feGaussianBlur stdDeviation="4" result="blur2" />
          <feMerge>
            <feMergeNode in="blur1" />
            <feMergeNode in="blur2" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <!-- ================= LEVEL 4: MEGAZORD QUAD PLASMA WINGS & CANNONS ================= -->
      ${isL4 ? `
        <!-- Megazord Upper Plasma Wings -->
        <g filter="url(#megaglow)" opacity="0.95">
          <polygon points="170,140 40,30 20,80 140,160" fill="url(#heroGradPlasma)" />
          <polygon points="170,140 300,30 320,80 200,160" fill="url(#heroGradPlasma)" />
          <line x1="40" y1="30" x2="170" y2="140" stroke="#ffffff" stroke-width="2.5" />
          <line x1="300" y1="30" x2="170" y2="140" stroke="#ffffff" stroke-width="2.5" />
        </g>
        <!-- Megazord Lower Plasma Wings -->
        <g filter="url(#neonGlow)" opacity="0.85">
          <polygon points="170,180 15,140 5,190 145,210" fill="url(#heroGradGold)" />
          <polygon points="170,180 325,140 335,190 195,210" fill="url(#heroGradGold)" />
        </g>
        <!-- Megazord Shoulder Fortress Cannons -->
        <g filter="url(#neonGlow)">
          <rect x="70" y="85" width="26" height="50" rx="6" fill="#1e293b" stroke="#f59e0b" stroke-width="2" />
          <circle cx="83" cy="92" r="7" fill="#38bdf8" />
          <rect x="244" y="85" width="26" height="50" rx="6" fill="#1e293b" stroke="#f59e0b" stroke-width="2" />
          <circle cx="257" cy="92" r="7" fill="#38bdf8" />
        </g>
        <!-- Cosmic Lightning Arcs -->
        <path d="M 60,70 L 45,95 L 65,100 L 50,130" stroke="#38bdf8" stroke-width="2" fill="none" filter="url(#neonGlow)" />
        <path d="M 280,70 L 295,95 L 275,100 L 290,130" stroke="#38bdf8" stroke-width="2" fill="none" filter="url(#neonGlow)" />
      ` : ""}

      <!-- ================= LEVEL 2 & 3: OPTICAL SENSOR WINGS ================= -->
      ${(isL2 && !isL4) ? `
        <g filter="url(#neonGlow)" opacity="0.9">
          <!-- Photon Sensor Wings -->
          <polygon points="170,150 70,80 60,110 150,170" fill="url(#heroGradPlasma)" />
          <polygon points="170,150 270,80 280,110 190,170" fill="url(#heroGradPlasma)" />
          <line x1="70" y1="80" x2="170" y2="150" stroke="${glow}" stroke-width="2" />
          <line x1="270" y1="80" x2="170" y2="150" stroke="${glow}" stroke-width="2" />
        </g>
      ` : ""}

      <!-- ================= LEVEL 3: ACOUSTIC SONIC SHOCKWAVE RINGS ================= -->
      ${isL3 ? `
        <g opacity="0.75" filter="url(#neonGlow)">
          <!-- Left Sonic Wave -->
          <circle cx="95" cy="115" r="28" fill="none" stroke="#38bdf8" stroke-width="2" stroke-dasharray="6,4" />
          <circle cx="95" cy="115" r="42" fill="none" stroke="#ec4899" stroke-width="1.5" stroke-dasharray="8,6" opacity="0.6" />
          <!-- Right Sonic Wave -->
          <circle cx="245" cy="115" r="28" fill="none" stroke="#38bdf8" stroke-width="2" stroke-dasharray="6,4" />
          <circle cx="245" cy="115" r="42" fill="none" stroke="#ec4899" stroke-width="1.5" stroke-dasharray="8,6" opacity="0.6" />
        </g>
      ` : ""}

      <!-- ================= ANTI-GRAVITY HOVER BASE DISC ================= -->
      <g filter="url(#neonGlow)">
        <ellipse cx="170" cy="325" rx="${isL4 ? "90" : "65"}" ry="18" fill="rgba(14, 165, 233, 0.25)" stroke="${glow}" stroke-width="2" />
        <ellipse cx="170" cy="325" rx="${isL4 ? "55" : "38"}" ry="10" fill="rgba(56, 189, 248, 0.4)" />
        <line x1="130" y1="325" x2="210" y2="325" stroke="#ffffff" stroke-width="2" />
      </g>

      <!-- ================= HERO BODY & SUIT ================= -->
      <!-- Main Torso Armor -->
      <g filter="drop-shadow(0 8px 12px rgba(0,0,0,0.5))">
        <!-- Body Shell -->
        <path d="M 120,150 Q 110,270 170,290 Q 230,270 220,150 Z" fill="url(#heroGradBody)" stroke="${isL4 ? "#f59e0b" : "rgba(255,255,255,0.3)"}" stroke-width="${isL4 ? "3" : "1.5"}" />

        <!-- Armor Plates / Abdominal Segments -->
        <path d="M 140,210 L 200,210 L 195,235 L 145,235 Z" fill="rgba(15, 23, 42, 0.5)" stroke="rgba(255,255,255,0.2)" stroke-width="1" />
        <path d="M 145,242 L 195,242 L 190,265 L 150,265 Z" fill="rgba(15, 23, 42, 0.5)" stroke="rgba(255,255,255,0.2)" stroke-width="1" />

        ${isL4 ? `
          <!-- Megazord Heavy Chest Armor Plates -->
          <polygon points="120,150 170,185 110,210" fill="url(#heroGradGold)" />
          <polygon points="220,150 170,185 230,210" fill="url(#heroGradGold)" />
          <polygon points="170,185 140,240 200,240" fill="#0f172a" stroke="#f59e0b" stroke-width="1.5" />
        ` : ""}
      </g>

      <!-- Shoulder Guards & Arms -->
      <g filter="drop-shadow(0 4px 8px rgba(0,0,0,0.4))">
        <!-- Left Arm -->
        <rect x="${isL4 ? "78" : "90"}" y="155" width="${isL4 ? "32" : "24"}" height="85" rx="12" fill="url(#heroGradHead)" stroke="${isL4 ? "#f59e0b" : "rgba(255,255,255,0.2)"}" stroke-width="1.5" transform="rotate(16 100 160)" />
        <!-- Right Arm -->
        <rect x="${isL4 ? "230" : "226"}" y="155" width="${isL4 ? "32" : "24"}" height="85" rx="12" fill="url(#heroGradHead)" stroke="${isL4 ? "#f59e0b" : "rgba(255,255,255,0.2)"}" stroke-width="1.5" transform="rotate(-16 240 160)" />

        <!-- Shoulder Spheres -->
        <circle cx="106" cy="155" r="${isL4 ? "24" : "18"}" fill="url(#heroGradBody)" stroke="${glow}" stroke-width="2" />
        <circle cx="234" cy="155" r="${isL4 ? "24" : "18"}" fill="url(#heroGradBody)" stroke="${glow}" stroke-width="2" />

        ${isL4 ? `
          <!-- Megazord Dual Gauntlet Laser Blades -->
          <g filter="url(#megaglow)">
            <polygon points="75,225 50,300 80,245" fill="url(#heroGradPlasma)" />
            <polygon points="265,225 290,300 260,245" fill="url(#heroGradPlasma)" />
            <line x1="75" y1="225" x2="50" y2="300" stroke="#ffffff" stroke-width="2" />
            <line x1="265" y1="225" x2="290" y2="300" stroke="#ffffff" stroke-width="2" />
          </g>
        ` : ""}
      </g>

      <!-- ================= CHEST CORE REACTOR ================= -->
      <g filter="url(#neonGlow)">
        <!-- Core Housing -->
        <circle cx="170" cy="190" r="${isL4 ? "32" : "25"}" fill="#0f172a" stroke="${isL4 ? "#f59e0b" : glow}" stroke-width="2.5" />
        <circle cx="170" cy="190" r="${isL4 ? "25" : "18"}" fill="${isL4 ? "url(#megazordCore)" : "url(#heroCoreGlow)"}" />

        ${isL4 ? `
          <!-- Rotating Singularity Gyro Rings -->
          <circle cx="170" cy="190" r="14" fill="none" stroke="#ffffff" stroke-width="2" stroke-dasharray="8,4" />
          <circle cx="170" cy="190" r="6" fill="#ffffff" />
          <!-- Star Rune -->
          <text x="170" y="194" text-anchor="middle" font-size="14" fill="#ffffff" font-weight="bold">✦</text>
        ` : `
          <!-- Center Emblem -->
          <circle cx="170" cy="190" r="8" fill="#ffffff" />
          <text x="170" y="194" text-anchor="middle" font-size="11" fill="#0284c7" font-weight="bold">✦</text>
        `}
      </g>

      <!-- ================= LEVEL 3: VOCAL EQUALIZER BARS ON CHEST ================= -->
      ${(isL3 && !isL4) ? `
        <g transform="translate(142, 225)" filter="url(#neonGlow)">
          <rect x="0" y="4" width="6" height="16" rx="2" fill="#38bdf8" />
          <rect x="10" y="0" width="6" height="24" rx="2" fill="#a855f7" />
          <rect x="20" y="8" width="6" height="12" rx="2" fill="#ec4899" />
          <rect x="30" y="2" width="6" height="20" rx="2" fill="#f59e0b" />
          <rect x="40" y="6" width="6" height="14" rx="2" fill="#38bdf8" />
          <rect x="50" y="10" width="6" height="8" rx="2" fill="#10b981" />
        </g>
      ` : ""}

      <!-- ================= HERO HEAD & HELMET ================= -->
      <g filter="drop-shadow(0 6px 12px rgba(0,0,0,0.5))">
        <!-- Helmet Base -->
        <rect x="110" y="68" width="120" height="92" rx="42" fill="url(#heroGradHead)" stroke="${isL4 ? "#f59e0b" : "rgba(255,255,255,0.4)"}" stroke-width="${isL4 ? "2.5" : "1.5"}" />

        <!-- Cyber Face Screen / Visor Frame -->
        <rect x="125" y="90" width="90" height="48" rx="22" fill="#070d1e" stroke="rgba(255,255,255,0.2)" stroke-width="1.5" />

        <!-- Glowing Digital Eyes / Visor -->
        ${isL2 ? `
          <!-- Optic Laser Visor -->
          <g filter="url(#neonGlow)">
            <rect x="135" y="102" width="70" height="24" rx="10" fill="url(#heroGradPlasma)" />
            <circle cx="152" cy="114" r="5" fill="#ffffff" />
            <circle cx="188" cy="114" r="5" fill="#ffffff" />
            <line x1="135" y1="114" x2="205" y2="114" stroke="#ffffff" stroke-width="1.5" stroke-dasharray="4,2" />
          </g>
        ` : `
          <!-- Basic Digital Eyes -->
          <g filter="url(#neonGlow)">
            <ellipse cx="152" cy="114" rx="8" ry="11" fill="${glow}" />
            <ellipse cx="188" cy="114" rx="8" ry="11" fill="${glow}" />
            <circle cx="154" cy="112" r="3" fill="#ffffff" />
            <circle cx="190" cy="112" r="3" fill="#ffffff" />
          </g>
        `}

        <!-- Antenna -->
        <rect x="163" y="32" width="14" height="40" rx="7" fill="${primary}" stroke="${isL4 ? "#f59e0b" : "rgba(255,255,255,0.3)"}" stroke-width="1.5" />
        <circle cx="170" cy="28" r="10" fill="${glow}" filter="url(#neonGlow)" />
      </g>

      <!-- ================= LEVEL 2: OPTIC HUD LASER TARGETING RETICLE ================= -->
      ${isL2 ? `
        <g filter="url(#neonGlow)" opacity="0.9">
          <!-- Laser Eye Beam Cones -->
          <line x1="152" y1="114" x2="115" y2="114" stroke="${glow}" stroke-width="2" stroke-dasharray="5,3" />
          <line x1="188" y1="114" x2="225" y2="114" stroke="${glow}" stroke-width="2" stroke-dasharray="5,3" />
          <!-- HUD Crosshair Ring -->
          <circle cx="170" cy="114" r="48" fill="none" stroke="${glow}" stroke-width="1.2" stroke-dasharray="8,6" />
          <path d="M 122,114 L 114,114 M 226,114 L 218,114 M 170,66 L 170,74 M 170,162 L 170,154" stroke="${glow}" stroke-width="2" />
        </g>
      ` : ""}

      <!-- ================= LEVEL 3: ACOUSTIC EAR RESONATORS ================= -->
      ${isL3 ? `
        <g filter="url(#neonGlow)">
          <!-- Left Cyber Acoustic Ear Cup -->
          <rect x="94" y="88" width="20" height="52" rx="10" fill="#0f172a" stroke="#38bdf8" stroke-width="2" />
          <circle cx="104" cy="114" r="6" fill="#38bdf8" />
          <!-- Right Cyber Acoustic Ear Cup -->
          <rect x="226" y="88" width="20" height="52" rx="10" fill="#0f172a" stroke="#38bdf8" stroke-width="2" />
          <circle cx="236" cy="114" r="6" fill="#38bdf8" />
          <!-- Harmonic Audio Crown -->
          <path d="M 130,28 Q 170,6 210,28" stroke="#ec4899" stroke-width="2.5" fill="none" stroke-dasharray="4,2" />
        </g>
      ` : ""}

      <!-- ================= LEVEL 4: MEGAZORD SAMURAI TITAN CROWN & HORNS ================= -->
      ${isL4 ? `
        <g filter="url(#megaglow)">
          <!-- Central Golden Horn Spike -->
          <polygon points="170,0 156,40 184,40" fill="url(#heroGradGold)" stroke="#ffffff" stroke-width="1.5" />
          <!-- Left Wing Horn -->
          <polygon points="135,12 110,65 142,50" fill="url(#heroGradGold)" stroke="#ffffff" stroke-width="1" />
          <!-- Right Wing Horn -->
          <polygon points="205,12 230,65 198,50" fill="url(#heroGradGold)" stroke="#ffffff" stroke-width="1" />
          <!-- Forehead Emerald Matrix Jewel -->
          <polygon points="170,62 178,74 170,86 162,74" fill="#10b981" stroke="#ffffff" stroke-width="1.5" />
          <!-- Orbiting Cosmic Star Dust -->
          <circle cx="50" cy="160" r="3" fill="#38bdf8" />
          <circle cx="290" cy="160" r="3" fill="#f59e0b" />
          <circle cx="80" cy="270" r="2.5" fill="#ec4899" />
          <circle cx="260" cy="270" r="2.5" fill="#38bdf8" />
        </g>
      ` : ""}
    </svg>
  `;
}

const upgradeDialogData = {
  2: {
    message: "image-recognition skill unlocked!",
    powers: [
      { icon: "👁️", text: "Image Recognition" }
    ]
  },
  3: {
    message: "sound-pattern skill unlocked!",
    powers: [
      { icon: "👁️", text: "Image Recognition" },
      { icon: "🎙️", text: "Sound Pattern Listening" }
    ]
  },
  4: {
    message: "content creation skill added!",
    powers: [
      { icon: "👁️", text: "Image Recognition" },
      { icon: "🎙️", text: "Sound Pattern Listening" },
      { icon: "✨", text: "Content Creation" }
    ]
  }
};

function showNovaUpgradeTransition(newLevel, nextView) {
  state.hero.level = newLevel;
  const oldLevel = Math.max(1, newLevel - 1);
  const upgradeInfo = upgradeDialogData[newLevel] || {
    message: "Nova learned a new skill.",
    powers: [{ icon: "⚡", text: "New Learning Skill" }]
  };
  const newPower = upgradeInfo.powers[upgradeInfo.powers.length - 1];
  state.hero.power = newPower.text;
  persistProgress();

  const primary = state.hero.primary || "#ffbd61";
  const secondary = state.hero.secondary || "#ed5c88";
  const glow = state.hero.glow || "#9effee";
  const skillIcon = newPower.icon;

  const modalHtml = `
    <div id="nova-upgrade-modal" class="hero-upgrade-backdrop">
      <div class="hero-upgrade-card nova-upgrade-card">
        <div class="upgrade-rays"></div>
        <div class="evolution-level-badge">
          <span>✦ NOVA LEARNING UPGRADE</span>
          <strong>SKILL LEVEL 0${oldLevel} ➔ 0${newLevel}</strong>
        </div>
        <h2 class="upgrade-title" style="font-size:22px;margin:8px 0 16px;line-height:1.3;color:#ffffff;">
          Nova learned: ${upgradeInfo.message}
        </h2>

        <div class="nova-transformation-stage">
          <div class="nova-transform-box nova-before-box">
            <span class="transform-box-tag">NOVA BEFORE</span>
            <div class="nova-upgrade-avatar">
              ${renderRoboAvatar(primary, secondary, glow, "NOVA", oldLevel)}
            </div>
          </div>
          <div class="nova-transform-energy">
            <div class="energy-beam-pulse"></div>
            <div class="lightning-spark">${skillIcon}</div>
            <span class="morph-arrow-badge">LEARNING ➔</span>
          </div>
          <div class="nova-transform-box nova-after-box">
            <span class="transform-box-tag new-tag">NOVA + NEW SKILL</span>
            <div class="nova-upgrade-avatar nova-upgraded-avatar">
              ${renderRoboAvatar(primary, secondary, glow, "NOVA", newLevel)}
            </div>
          </div>
        </div>
        <div class="upgrade-powers-list" style="margin-top:16px;">
          <div style="font-size:11px;font-weight:800;letter-spacing:0.08em;color:#38bdf8;text-transform:uppercase;margin-bottom:8px;">
            NOVA'S LEARNED SKILLS (${newLevel - 1}/3):
          </div>
          <div class="powers-pills-row">
            ${upgradeInfo.powers.map((p, idx) => `
              <div class="upgrade-power-pill ${idx === upgradeInfo.powers.length - 1 ? "newest-power-pill" : ""}">
                <span>${p.icon}</span>
                <strong>${p.text} ${idx === upgradeInfo.powers.length - 1 ? "✨ (NEW!)" : ""}</strong>
              </div>
            `).join("")}
          </div>
        </div>

        <button id="upgrade-continue-btn" class="upgrade-continue-btn button button-primary" style="margin-top:20px;width:100%;padding:12px;font-size:14px;">
          <span>Continue with Nova</span>
          ${icon("arrow-right")}
        </button>
      </div>
    </div>
  `;

  document.querySelector("#nova-upgrade-modal")?.remove();
  document.body.insertAdjacentHTML("beforeend", modalHtml);
  refreshIcons();
  playEurekaSound();
  playFantasySound();

  document.querySelector("#upgrade-continue-btn")?.addEventListener("click", () => {
    document.querySelector("#nova-upgrade-modal")?.remove();
    navigate(nextView);
  });
}

/* ====== ROBO PART SVG SNIPPETS (Base Hero Level 1) ====== */
function roboPartSVG(partId, primary = "#ffbd61", secondary = "#ed5c88", glow = "#9effee") {
  const defs = `
    <defs>
      <linearGradient id="rp_shell_${partId}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f8fbff"/><stop offset=".38" stop-color="#b9d4ff"/><stop offset="1" stop-color="#5a66be"/></linearGradient>
      <linearGradient id="rp_trim_${partId}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${primary}"/><stop offset=".6" stop-color="${secondary}"/><stop offset="1" stop-color="#7143bc"/></linearGradient>
      <linearGradient id="rp_visor_${partId}" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#152a55"/><stop offset="1" stop-color="#061022"/></linearGradient>
      <radialGradient id="rp_core_${partId}"><stop stop-color="#fff"/><stop offset=".25" stop-color="${glow}"/><stop offset=".58" stop-color="#49b8ff"/><stop offset="1" stop-color="#5b5ce2"/></radialGradient>
      <filter id="rp_glow_${partId}" x="-55%" y="-55%" width="210%" height="210%"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>`;

  const parts = {
    antenna: `<svg viewBox="0 0 80 100" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">${defs}
      <path d="M40 82V38" stroke="url(#rp_shell_${partId})" stroke-width="18" stroke-linecap="round"/>
      <path d="M40 78V42" stroke="#6579cf" stroke-width="4" stroke-linecap="round" opacity=".75"/>
      <circle cx="40" cy="23" r="18" fill="${glow}" stroke="#fff" stroke-width="4" filter="url(#rp_glow_${partId})"/>
      <circle cx="34" cy="17" r="5" fill="#fff" opacity=".78"/>
    </svg>`,
    head: `<svg viewBox="0 0 160 130" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">${defs}
      <path d="M19 72C19 30 43 10 80 10s61 20 61 62c0 31-19 48-61 48S19 103 19 72Z" fill="url(#rp_shell_${partId})" stroke="#f0f9ff" stroke-width="4"/>
      <path d="M38 66c8-21 21-29 42-29s34 8 42 29l-7 27c-11 12-59 12-70 0Z" fill="url(#rp_visor_${partId})" stroke="#83dfff" stroke-width="3"/>
      <g filter="url(#rp_glow_${partId})"><path d="M52 69q8-8 16 0-8 10-16 0Z" fill="${glow}"/><path d="M92 69q8-8 16 0-8 10-16 0Z" fill="${glow}"/><circle cx="61" cy="68" r="2.5" fill="#fff"/><circle cx="101" cy="68" r="2.5" fill="#fff"/></g>
      <path d="M64 97q16 12 32 0" fill="none" stroke="#a7f8ff" stroke-width="3" stroke-linecap="round"/>
    </svg>`,
    left_arm: `<svg viewBox="0 0 90 150" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">${defs}
      <circle cx="55" cy="27" r="20" fill="url(#rp_trim_${partId})" stroke="#fff" stroke-width="3"/>
      <path d="M46 41C25 65 24 104 42 128l22-11c-11-21-7-47 8-65Z" fill="url(#rp_shell_${partId})" stroke="#edfaff" stroke-width="3"/>
      <path d="M40 119l23-10" stroke="#687ed0" stroke-width="4" stroke-linecap="round"/>
    </svg>`,
    right_arm: `<svg viewBox="0 0 90 150" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">${defs}
      <circle cx="35" cy="27" r="20" fill="url(#rp_trim_${partId})" stroke="#fff" stroke-width="3"/>
      <path d="M44 41c21 24 22 63 4 87l-22-11c11-21 7-47-8-65Z" fill="url(#rp_shell_${partId})" stroke="#edfaff" stroke-width="3"/>
      <path d="M50 119l-23-10" stroke="#687ed0" stroke-width="4" stroke-linecap="round"/>
    </svg>`,
    body: `<svg viewBox="0 0 160 190" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">${defs}
      <path d="M30 18C34 4 51 0 80 0s46 4 50 18l13 137Q80 181 17 155Z" fill="url(#rp_shell_${partId})" stroke="#eefaff" stroke-width="4"/>
      <path d="M43 34q37 24 74 0l8 89q-45 22-90 0Z" fill="#4054aa" opacity=".48"/>
      <circle cx="80" cy="88" r="42" fill="#162866" stroke="#f5fbff" stroke-width="4"/><circle cx="80" cy="88" r="29" fill="url(#rp_core_${partId})" filter="url(#rp_glow_${partId})"/>
      <path d="M80 65v46M57 88h46" stroke="#fff" stroke-width="3" opacity=".85"/>
      <path d="M53 139q27 12 54 0" fill="none" stroke="#6b7ed1" stroke-width="5" stroke-linecap="round"/>
    </svg>`,
    hover_base: `<svg viewBox="0 0 180 80" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">${defs}
      <g filter="url(#rp_glow_${partId})"><path d="M50 12c-9 34 4 53 15 25 3 28 17 34 18 2 5 30 21 31 22 0 5 31 20 26 19-4 11 25 26 9 10-23Z" fill="${glow}" opacity=".86"/></g>
      <ellipse cx="90" cy="18" rx="63" ry="15" fill="#152d70" stroke="#c7fbff" stroke-width="3"/><ellipse cx="90" cy="17" rx="40" ry="8" fill="#57c8ff" opacity=".65"/>
    </svg>`
  };
  return parts[partId] || "";
}

/* Nova is intentionally separate from the unlockable superhero. This gives the
   first two lessons an approachable guide with a consistent visual identity. */
function renderRoboAvatar(primary = "#ffbd61", secondary = "#ed5c88", glow = "#9effee", name = "NOVA", skillLevel = state.hero.level || 1) {
  const hasSmartGlasses = skillLevel >= 2;
  const hasSoundSensors = skillLevel >= 3;
  const hasCreatorArmor = skillLevel >= 4;
  return `
    <svg viewBox="0 0 360 430" xmlns="http://www.w3.org/2000/svg" class="robo-avatar-svg" role="img" aria-label="${name}, a friendly AI learning robot">
      <defs>
        <linearGradient id="nova-shell" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f8fbff"/><stop offset=".38" stop-color="#b9d4ff"/><stop offset="1" stop-color="#5a66be"/></linearGradient>
        <linearGradient id="nova-trim" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${primary}"/><stop offset=".55" stop-color="${secondary}"/><stop offset="1" stop-color="#7143bc"/></linearGradient>
        <linearGradient id="nova-visor" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#152a55"/><stop offset="1" stop-color="#061022"/></linearGradient>
        <radialGradient id="nova-core"><stop stop-color="#fff"/><stop offset=".25" stop-color="${glow}"/><stop offset=".56" stop-color="#49b8ff"/><stop offset="1" stop-color="#5b5ce2"/></radialGradient>
        <filter id="nova-glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="nova-shadow" x="-40%" y="-30%" width="180%" height="190%"><feDropShadow dx="0" dy="12" stdDeviation="9" flood-color="#030817" flood-opacity=".45"/></filter>
      </defs>
      <ellipse class="robo-shadow" cx="180" cy="395" rx="113" ry="18" fill="#121b53" opacity=".42"/>
      <g class="robo-jet" opacity=".85"><path d="M142 342 C132 385 150 399 160 367 C168 402 184 405 180 363 C188 402 208 394 203 343Z" fill="${glow}" filter="url(#nova-glow)"/></g>
      <g class="robo-orbit"><ellipse cx="180" cy="239" rx="151" ry="57" fill="none" stroke="${glow}" stroke-width="2" stroke-dasharray="5 12" opacity=".46"/><circle cx="42" cy="236" r="5" fill="${glow}" filter="url(#nova-glow)"/><circle cx="306" cy="260" r="4" fill="${primary}"/></g>
      ${hasCreatorArmor ? `<g class="nova-mega-armor" filter="url(#nova-glow)"><path d="M112 229 L72 256 L106 271 L120 253Z" fill="#ffb346" stroke="#fff4b5" stroke-width="3"/><path d="M248 229 L288 256 L254 271 L240 253Z" fill="#ffb346" stroke="#fff4b5" stroke-width="3"/><path d="M144 59 L180 21 L216 59 L202 68 L180 51 L158 68Z" fill="#f5b642" stroke="#fff4b5" stroke-width="3"/><path d="M119 318 L88 337 L123 347Z M241 318 L272 337 L237 347Z" fill="#d96cf0" stroke="#fff" stroke-width="2"/></g>` : ""}
      <g filter="url(#nova-shadow)">
        <path d="M120 234 C95 251 91 292 109 320 L136 308 L147 250Z" fill="url(#nova-shell)" stroke="#ecf7ff" stroke-width="3"/>
        <path d="M240 234 C265 251 269 292 251 320 L224 308 L213 250Z" fill="url(#nova-shell)" stroke="#ecf7ff" stroke-width="3"/>
        <circle cx="115" cy="292" r="18" fill="url(#nova-trim)" stroke="#fff" stroke-width="3"/><circle cx="245" cy="292" r="18" fill="url(#nova-trim)" stroke="#fff" stroke-width="3"/>
        <path d="M118 223 C121 188 142 171 180 171 C218 171 239 188 242 223 L253 331 Q180 367 107 331Z" fill="url(#nova-shell)" stroke="#eefaff" stroke-width="4"/>
        <path d="M134 240 Q180 270 226 240 L231 306 Q180 334 129 306Z" fill="#4054aa" opacity=".48"/>
        <circle class="robo-core" cx="180" cy="269" r="40" fill="#162866" stroke="#f5fbff" stroke-width="4"/>
        <circle class="robo-core" cx="180" cy="269" r="28" fill="url(#nova-core)" filter="url(#nova-glow)"/><path d="M180 247v44M158 269h44" stroke="#fff" stroke-width="3" opacity=".84"/>
        ${hasCreatorArmor ? `<g class="nova-creator-core" filter="url(#nova-glow)"><path d="M180 238 L186 258 L207 258 L190 271 L197 292 L180 279 L163 292 L170 271 L153 258 L174 258Z" fill="#fff0a8" opacity=".96"/><path d="M139 306 H221" stroke="#f4b9ff" stroke-width="4" stroke-linecap="round"/></g>` : ""}
        <path d="M111 165 C105 94 132 52 180 52 C228 52 255 94 249 165 C244 208 217 225 180 225 C143 225 116 208 111 165Z" fill="url(#nova-shell)" stroke="#f0f9ff" stroke-width="4"/>
        <path d="M128 130 C137 104 154 94 180 94 C206 94 223 104 232 130 L225 171 C211 188 149 188 135 171Z" fill="url(#nova-visor)" stroke="#83dfff" stroke-width="3"/>
        <g class="robo-eyes" filter="url(#nova-glow)"><path d="M148 140 Q159 129 169 140 Q159 154 148 140Z" fill="${glow}"/><path d="M191 140 Q201 129 212 140 Q201 154 191 140Z" fill="${glow}"/><circle cx="160" cy="139" r="3" fill="#fff"/><circle cx="201" cy="139" r="3" fill="#fff"/></g>
        ${hasSmartGlasses ? `<g class="nova-smart-glasses" filter="url(#nova-glow)"><path d="M139 126 H221 Q230 126 230 136 V151 Q230 160 221 160 H139 Q130 160 130 151 V136 Q130 126 139 126Z" fill="none" stroke="#62eaff" stroke-width="5"/><path d="M170 143 H190" stroke="#62eaff" stroke-width="4"/><path d="M130 137 L119 132 M230 137 L241 132" stroke="#62eaff" stroke-width="4" stroke-linecap="round"/><path d="M144 132 H166 M194 132 H216" stroke="#fff" stroke-width="2" opacity=".75"/></g>` : ""}
        ${hasSoundSensors ? `<g class="nova-sound-sensors" fill="none" stroke="#b987ff" stroke-linecap="round" filter="url(#nova-glow)"><path d="M118 136 Q94 143 94 164" stroke-width="4"/><path d="M110 124 Q77 135 77 170" stroke-width="4"/><path d="M242 136 Q266 143 266 164" stroke-width="4"/><path d="M250 124 Q283 135 283 170" stroke-width="4"/><circle cx="111" cy="164" r="6" fill="#b987ff"/><circle cx="249" cy="164" r="6" fill="#b987ff"/></g>` : ""}
        <path d="M160 174 Q180 187 200 174" fill="none" stroke="#a7f8ff" stroke-width="3" stroke-linecap="round"/>
        <path d="M180 53 V24" stroke="url(#nova-trim)" stroke-width="13" stroke-linecap="round"/><circle class="robo-signal" cx="180" cy="17" r="14" fill="${glow}" stroke="#fff" stroke-width="3" filter="url(#nova-glow)"/>
        <path d="M130 189 L105 209 M230 189 L255 209" stroke="${primary}" stroke-width="5" stroke-linecap="round"/>
      </g>
      <g class="robo-sparkles" fill="#fff"><path d="M77 121 l4 10 10 4-10 4-4 10-4-10-10-4 10-4Z"/><path d="M290 105 l3 7 7 3-7 3-3 7-3-7-7-3 7-3Z"/><circle cx="300" cy="178" r="3" fill="${primary}"/></g>
    </svg>`;
}

function renderRobo() {
  const primary = state.hero.primary || "#ffbd61";
  const secondary = state.hero.secondary || "#ed5c88";
  const glow = state.hero.glow || "#9effee";

  const roboParts = [
    { id: "antenna", label: "Signal Orb", number: "01", desc: "Nova's signal antenna" },
    { id: "head", label: "Nova Head", number: "02", desc: "Friendly visor & eyes" },
    { id: "left_arm", label: "Left Hover Arm", number: "03", desc: "Nova's left stabilizer" },
    { id: "right_arm", label: "Right Hover Arm", number: "04", desc: "Nova's right stabilizer" },
    { id: "body", label: "Learning Core", number: "05", desc: "Nova's glowing AI core" },
    { id: "hover_base", label: "Jet Pack", number: "06", desc: "Nova's hover thrusters" },
  ];

  const placedParts = state.roboPlaced || [];

  content.innerHTML = `
    ${header("CHAPTER 00 // CREATE A ROBO", "Build Your Robot", "Drag each robot part from the tray below and drop it onto the correct glowing slot to assemble your Robo!", "00")}

    <div class="robo-builder-layout">
      <!-- Left: Assembly Stage -->
      <section class="robo-assembly-stage">
        <div class="robo-stage-backdrop">
          <div class="cyber-grid-backdrop"></div>
          <div class="cyber-energy-ring"></div>
        </div>

        <div class="robo-assembly-area ${placedParts.length === 6 ? "assembly-complete" : ""}" id="robo-assembly-area">
          ${placedParts.length === 6 ? `
            <div class="robo-complete-reveal robo-identity-reveal">
              ${renderRoboAvatar(primary, secondary, glow, "NOVA")}
              <span class="robo-identity-label"><i></i>NOVA // READY TO LEARN</span>
            </div>
          ` : `
          <!-- Slot: Antenna -->
          <div class="robo-slot ${placedParts.includes("antenna") ? "placed" : ""}" data-slot="antenna" id="slot-antenna"
            style="position:absolute;top:0%;left:50%;transform:translateX(-50%);width:50px;height:55px;">
            ${placedParts.includes("antenna") ? roboPartSVG("antenna", primary, secondary, glow) : `<span class="slot-label">📡</span>`}
          </div>
          <!-- Slot: Head -->
          <div class="robo-slot ${placedParts.includes("head") ? "placed" : ""}" data-slot="head" id="slot-head"
            style="position:absolute;top:12%;left:50%;transform:translateX(-50%);width:135px;height:100px;">
            ${placedParts.includes("head") ? roboPartSVG("head", primary, secondary, glow) : `<span class="slot-label">🤖</span>`}
          </div>
          <!-- Slot: Left Arm -->
          <div class="robo-slot ${placedParts.includes("left_arm") ? "placed" : ""}" data-slot="left_arm" id="slot-left_arm"
            style="position:absolute;top:30%;left:10%;width:70px;height:110px;">
            ${placedParts.includes("left_arm") ? roboPartSVG("left_arm", primary, secondary, glow) : `<span class="slot-label">💪</span>`}
          </div>
          <!-- Slot: Right Arm -->
          <div class="robo-slot ${placedParts.includes("right_arm") ? "placed" : ""}" data-slot="right_arm" id="slot-right_arm"
            style="position:absolute;top:30%;right:10%;width:70px;height:110px;">
            ${placedParts.includes("right_arm") ? roboPartSVG("right_arm", primary, secondary, glow) : `<span class="slot-label">🦾</span>`}
          </div>
          <!-- Slot: Body -->
          <div class="robo-slot ${placedParts.includes("body") ? "placed" : ""}" data-slot="body" id="slot-body"
            style="position:absolute;top:30%;left:50%;transform:translateX(-50%);width:140px;height:160px;">
            ${placedParts.includes("body") ? roboPartSVG("body", primary, secondary, glow) : `<span class="slot-label">🫁</span>`}
          </div>
          <!-- Slot: Hover Base -->
          <div class="robo-slot ${placedParts.includes("hover_base") ? "placed" : ""}" data-slot="hover_base" id="slot-hover_base"
            style="position:absolute;bottom:2%;left:50%;transform:translateX(-50%);width:160px;height:48px;">
            ${placedParts.includes("hover_base") ? roboPartSVG("hover_base", primary, secondary, glow) : `<span class="slot-label">🛸</span>`}
          </div>
          `}
        </div>

        <!-- Progress HUD -->
        <div class="robo-progress-hud">
          ${icon("cpu")} <strong>${placedParts.length}</strong> / 6 parts assembled
        </div>
      </section>

      <!-- Right: Parts Tray -->
      <section class="robo-parts-tray">
        <h3 style="margin:0 0 6px;color:#18335b;">${icon("wrench")} Robot Parts Tray</h3>
        <p style="margin:0 0 16px;color:#5f789d;font-size:13px;line-height:1.45;">
          Drag each part onto its matching glowing slot on the left. Or tap/click a part to auto-place it!
        </p>

        <div class="robo-parts-grid">
          ${roboParts.map(part => `
            <div class="robo-part-card ${placedParts.includes(part.id) ? "part-used" : ""}"
              draggable="${!placedParts.includes(part.id)}"
              data-part="${part.id}"
              id="part-${part.id}">
              <div class="part-preview">${roboPartSVG(part.id, primary, secondary, glow)}</div>
              <div class="part-info">
                <span class="part-part-number">PART ${part.number}</span>
                <strong>${part.label}</strong>
                <small>${placedParts.includes(part.id) ? "✅ Placed" : part.desc}</small>
              </div>
            </div>
          `).join("")}
        </div>

        ${placedParts.length === 6 ? `
          <button id="robo-complete-btn" class="button button-primary" style="width:100%;margin-top:24px;">
            <span>Nova is Ready! Continue to Training (Ch 02)</span>
            ${icon("arrow-right")}
          </button>
        ` : `
          <div style="margin-top:24px;padding:14px;background:rgba(56,189,248,0.08);border:1px dashed rgba(56,189,248,0.3);border-radius:12px;text-align:center;">
            <span style="font-size:13px;color:#5f789d;">
              ${icon("info")} Place all 6 parts to complete your Robot!
            </span>
          </div>
        `}
      </section>
    </div>
  `;

  // --- Drag & Drop + Click Logic ---
  const allSlots = document.querySelectorAll(".robo-slot:not(.placed)");
  const allPartCards = document.querySelectorAll(".robo-part-card:not(.part-used)");

  // Place a part into its slot
  function placePart(partId) {
    if (!state.roboPlaced) state.roboPlaced = [];
    if (state.roboPlaced.includes(partId)) return;
    state.roboPlaced.push(partId);
    persistProgress();
    playDragDropSound();

    const slot = document.querySelector(`#slot-${partId}`);
    const card = document.querySelector(`#part-${partId}`);

    if (slot) {
      slot.classList.add("placed");
      slot.innerHTML = roboPartSVG(partId, primary, secondary, glow);
      slot.style.animation = "roboPartSnap 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)";
    }
    if (card) {
      card.classList.add("part-used");
      card.draggable = false;
      card.querySelector(".part-info small").textContent = "✅ Placed";
    }

    // Update progress HUD
    const hud = document.querySelector(".robo-progress-hud");
    if (hud) hud.innerHTML = `${icon("cpu")} <strong>${state.roboPlaced.length}</strong> / 6 parts assembled`;
    refreshIcons();

    // Check completion
    if (state.roboPlaced.length === 6) {
      setTimeout(() => {
        toastMessage("🤖 Robot fully assembled! Great job!", true);
        playEurekaSound();

        // Show full hero instead of parts and add completion button
        const assemblyArea = document.querySelector("#robo-assembly-area");
        if (assemblyArea) {
          assemblyArea.innerHTML = `
            <div class="robo-complete-reveal">
              ${renderRoboAvatar(primary, secondary, glow, "NOVA")}
            </div>
          `;
        }
        // Re-render to show completion button
        setTimeout(() => renderRobo(), 2200);
      }, 400);
    }
  }

  // Click to auto-place
  allPartCards.forEach(card => {
    card.addEventListener("click", () => {
      const partId = card.dataset.part;
      placePart(partId);
    });
  });

  // Drag from part card
  allPartCards.forEach(card => {
    card.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", card.dataset.part);
      card.classList.add("dragging");
    });
    card.addEventListener("dragend", () => {
      card.classList.remove("dragging");
    });
  });

  // Drop onto slots
  allSlots.forEach(slot => {
    slot.addEventListener("dragover", (e) => {
      e.preventDefault();
      slot.classList.add("drop-hover");
    });
    slot.addEventListener("dragleave", () => {
      slot.classList.remove("drop-hover");
    });
    slot.addEventListener("drop", (e) => {
      e.preventDefault();
      slot.classList.remove("drop-hover");
      const partId = e.dataTransfer.getData("text/plain");
      if (partId === slot.dataset.slot) {
        placePart(partId);
      } else {
        toastMessage(`⚠️ That part doesn't fit here! Try the ${slot.dataset.slot.replace("_", " ")} slot.`);
      }
    });
  });

  // Also allow dropping anywhere on the assembly area for convenience
  const assemblyArea = document.querySelector("#robo-assembly-area");
  if (assemblyArea) {
    assemblyArea.addEventListener("dragover", (e) => e.preventDefault());
    assemblyArea.addEventListener("drop", (e) => {
      e.preventDefault();
      const partId = e.dataTransfer.getData("text/plain");
      if (partId && !state.roboPlaced?.includes(partId)) {
        placePart(partId);
      }
    });
  }

  // Completion button
  document.querySelector("#robo-complete-btn")?.addEventListener("click", () => {
    complete("robo");
    toastMessage("🎉 Robot assembled! Now test asking your Robo without training!", true);
    navigate("untrained_ask");
  });

  refreshIcons();
}

/* ====== ASK ROBO WITHOUT TRAINING (UNTRAINED STATE DEMO) ====== */
function renderUntrainedAsk() {
  const primary = state.hero.primary || "#ffbd61";
  const secondary = state.hero.secondary || "#ed5c88";
  const glow = state.hero.glow || "#9effee";
  const heroName = state.hero.name || "STARBYTE";

  const testItems = [
    { id: "red_apple", category: "image", label: "Red Apple Photo", icon: "🍎", image: "/images/apple2.jpg", tag: "IMAGE ITEM" },
    { id: "yellow_banana", category: "image", label: "Yellow Banana Photo", icon: "🍌", image: "/images/banana2.jpg", tag: "IMAGE ITEM" },
    { id: "bird_audio", category: "audio", label: "Audio Sample 01", icon: "🎵", audio: "/sounds/bird-sounds/1.mp3", tag: "AUDIO FILE" },
    { id: "drums_audio", category: "audio", label: "Audio Sample 02", icon: "🔊", audio: "/sounds/drums-sounds/1.mp3", tag: "AUDIO FILE" },
  ];

  if (!state.untrainedTestedItems) state.untrainedTestedItems = [];
  const testedCount = state.untrainedTestedItems.length;

  content.innerHTML = `
    ${header("CHAPTER 01 // UNTRAINED ROBOT TEST", "Ask Robo Without Training", "Show fruit photos or play audio files to test your Robot. Watch how a model with ZERO training data responds!", "01")}

    <div class="untrained-stage-layout">
      <!-- Left: Interactive Cyber Testing Pod Stage -->
      <section class="untrained-robo-stage" id="untrained-stage-container">
        <div class="robo-stage-backdrop">
          <div class="cyber-grid-backdrop"></div>
          <div class="cyber-energy-ring"></div>
        </div>

        <!-- Dynamic Speech Bubble Overhead -->
        <div id="robo-speech-bubble" class="robo-speech-bubble-box">
          <div class="speech-badge">🤖 NOVA (UNTRAINED MODEL)</div>
          <p id="robo-speech-text">
            "Hello human! I have <strong>0 training data</strong> and 0 labels loaded. Show me a photo or play a sound to test me!"
          </p>
        </div>

        <!-- Laser Scanner Beam Overlay (For Image Scanning) -->
        <div id="laser-scanner-beam" class="laser-scanner-beam hidden"></div>

        <!-- Audio Shockwave Alert Overlay (For Sound Upset Animation) -->
        <div id="audio-shockwave-overlay" class="audio-shockwave-overlay hidden">
          <div class="sound-wave-bar"></div>
          <div class="sound-wave-bar"></div>
          <div class="sound-wave-bar"></div>
          <div class="sound-wave-bar"></div>
          <div class="sound-wave-bar"></div>
        </div>

        <!-- Central Robot Graphic Stage -->
        <div id="untrained-robo-avatar-box" class="untrained-robo-avatar-box">
          ${renderRoboAvatar(primary, secondary, glow, "NOVA")}
        </div>

        <!-- Interactive Item Drop Target -->
        <div id="untrained-drop-zone" class="untrained-drop-zone">
          <span>📥 Drag any Fruit Photo or Audio Card here to Ask Robo!</span>
        </div>

        <!-- Progress HUD -->
        <div class="robo-progress-hud">
          ${icon("help-circle")} <strong>${testedCount}</strong> / 4 inputs tested on Untrained Robo
        </div>
      </section>

      <!-- Right: Test Input Deck (White Panel Background) -->
      <section class="untrained-items-tray">
        <div class="tray-header">
          <h3 style="margin:0;font-size:16px;color:#1e293b;display:flex;align-items:center;gap:8px;">
            ${icon("box")} TEST INPUT DECK
          </h3>
          <p style="margin:4px 0 12px;color:#5f789d;font-size:12px;">
            Drag or tap any item to test NOVA's response!
          </p>
        </div>

        <!-- Category 1: Fruit Photos (2 Columns) -->
        <div class="input-category-group">
          <h4 class="category-heading">${icon("image")} 1. FRUIT PHOTOS</h4>
          <div class="input-cards-grid photo-cards-grid">
            ${testItems.filter(item => item.category === "image").map(item => `
              <div class="test-input-card ${state.untrainedTestedItems.includes(item.id) ? "item-tested" : ""}"
                draggable="${!state.untrainedTestedItems.includes(item.id)}"
                data-item-id="${item.id}"
                id="card-${item.id}">
                <div class="card-thumb-large">
                  <img src="${item.image}" alt="${item.label}" />
                  <span class="thumb-badge">${item.icon}</span>
                </div>
                <div class="card-details">
                  <strong>${item.label}</strong>
                  <button class="button button-primary ask-robo-btn" data-item-id="${item.id}" style="width:100%;margin-top:6px;background:linear-gradient(135deg,#0284c7,#0d9488);color:#ffffff;">
                    Ask Robo ❓
                  </button>
                </div>
              </div>
            `).join("")}
          </div>
        </div>

        <!-- Category 2: Audio Files (2 Columns) -->
        <div class="input-category-group" style="margin-top:14px;">
          <h4 class="category-heading">${icon("volume-2")} 2. AUDIO FILES</h4>
          <div class="input-cards-grid audio-cards-grid">
            ${testItems.filter(item => item.category === "audio").map(item => `
              <div class="test-input-card audio-card-style ${state.untrainedTestedItems.includes(item.id) ? "item-tested" : ""}"
                draggable="${!state.untrainedTestedItems.includes(item.id)}"
                data-item-id="${item.id}"
                id="card-${item.id}">
                <div class="card-thumb-audio">
                  <span class="audio-wave-anim"></span>
                  <span style="font-size:24px;z-index:2;">${item.icon}</span>
                </div>
                <div class="card-details">
                  <strong>${item.label}</strong>
                  <div style="display:flex;gap:6px;margin-top:6px;width:100%;">
                    <button class="button button-outline play-audio-btn" data-audio="${item.audio}" style="flex:1;padding:4px 6px;font-size:11px;border-color:#cbd5e1;color:#1e293b;">
                      ▶️ Play
                    </button>
                    <button class="button button-primary ask-robo-btn" data-item-id="${item.id}" style="flex:1.3;padding:4px 6px;font-size:11px;background:linear-gradient(135deg,#e11d48,#f59e0b);color:#ffffff;">
                      Show Robo 💥
                    </button>
                  </div>
                </div>
              </div>
            `).join("")}
          </div>
        </div>

        <!-- Completion Banner / Next Step Button -->
        ${testedCount >= 2 ? `
          <div class="untrained-lesson-banner">
            <h4>💡 AI Lesson Learned!</h4>
            <p>Without training data and labels, an AI model has NO idea what images or sound waves mean. It needs Supervised & Unsupervised Learning!</p>
            <button id="proceed-to-hero-forge-btn" class="button button-primary" style="width:100%;margin-top:10px;background:linear-gradient(135deg,#f59e0b,#ef4444);font-size:12px;">
              <span>Teach Nova with Labeled Examples (Ch 02)</span>
              ${icon("arrow-right")}
            </button>
          </div>
        ` : `
          <div style="margin-top:12px;padding:10px;background:rgba(244,63,94,0.1);border:1px dashed rgba(244,63,94,0.4);border-radius:12px;text-align:center;">
            <span style="font-size:11px;color:#fb7185;font-weight:700;">
              ${icon("info")} Test at least 2 inputs to unlock the next chapter!
            </span>
          </div>
        `}
      </section>
    </div>
  `;

  // --- Handlers & Animations ---
  const speechText = document.querySelector("#robo-speech-text");
  const speechBubble = document.querySelector("#robo-speech-bubble");
  const stageContainer = document.querySelector("#untrained-stage-container");
  const avatarBox = document.querySelector("#untrained-robo-avatar-box");
  const laserBeam = document.querySelector("#laser-scanner-beam");
  const shockwaveOverlay = document.querySelector("#audio-shockwave-overlay");

  function processItemToRobo(itemId) {
    const item = testItems.find(t => t.id === itemId);
    if (!item) return;

    if (!state.untrainedTestedItems.includes(itemId)) {
      state.untrainedTestedItems.push(itemId);
      persistProgress();
    }

    const card = document.querySelector(`#card-${itemId}`);
    if (card) card.classList.add("item-tested");

    if (item.category === "image") {
      // IMAGE SCANNING (Confused Reaction)
      laserBeam?.classList.remove("hidden");
      speechBubble?.classList.add("scanning");
      if (speechText) speechText.innerHTML = `<em>👁️ Scanning with laser vision...</em>`;

      setTimeout(() => {
        laserBeam?.classList.add("hidden");
        speechBubble?.classList.remove("scanning");
        speechBubble?.classList.add("confused-pop");
        stageContainer?.classList.add("stage-confused");
        avatarBox?.classList.add("robo-head-tilt");
        playDragDropSound();

        let funnyQuote = "";
        if (itemId === "red_apple" || itemId === "green_apple") {
          funnyQuote = `"I just born now, I know nothing"`;
        } else if (itemId === "yellow_banana") {
          funnyQuote = `"I'm seeing this for first time"`;
        }

        if (speechText) speechText.innerHTML = funnyQuote;
        toastMessage(`🤖 Robo: "${funnyQuote}"`);

        setTimeout(() => {
          stageContainer?.classList.remove("stage-confused");
          avatarBox?.classList.remove("robo-head-tilt");
          speechBubble?.classList.remove("confused-pop");
          renderUntrainedAsk();
        }, 3400);
      }, 1200);

    } else {
      // AUDIO PROCESSING (Reaction to sound)
      shockwaveOverlay?.classList.remove("hidden");
      speechBubble?.classList.add("upset-pop");
      stageContainer?.classList.add("stage-alert-shaking");
      avatarBox?.classList.add("robo-shake-crazy");
      playWrongSound();

      let funnyQuote = "";
      if (itemId === "bird_audio") {
        funnyQuote = `"I don;t know what these sounds, But i like it, Wow!!!!"`;
      } else {
        funnyQuote = `"What are you doing, Are you killing me"`;
      }

      if (speechText) speechText.innerHTML = funnyQuote;
      toastMessage(`🤖 Robo: "${funnyQuote}"`, false);

      setTimeout(() => {
        shockwaveOverlay?.classList.add("hidden");
        stageContainer?.classList.remove("stage-alert-shaking");
        avatarBox?.classList.remove("robo-shake-crazy");
        speechBubble?.classList.remove("upset-pop");
        renderUntrainedAsk();
      }, 3600);
    }
  }

  // Bind Ask Robo buttons
  document.querySelectorAll(".ask-robo-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const itemId = btn.dataset.itemId;
      processItemToRobo(itemId);
    });
  });

  // Bind Audio Play preview buttons
  document.querySelectorAll(".play-audio-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const audioUrl = btn.dataset.audio;
      if (activeAudio) {
        activeAudio.pause();
        activeAudio.currentTime = 0;
      }
      activeAudio = new Audio(audioUrl);
      activeAudio.play().catch(() => {});
      toastMessage("🔊 Playing audio sample preview...");
    });
  });

  // Drag & Drop
  document.querySelectorAll(".test-input-card").forEach(card => {
    card.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", card.dataset.itemId);
      card.classList.add("dragging");
    });
    card.addEventListener("dragend", () => {
      card.classList.remove("dragging");
    });
  });

  const dropZone = document.querySelector("#untrained-drop-zone");
  if (dropZone) {
    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZone.classList.add("drop-active");
    });
    dropZone.addEventListener("dragleave", () => {
      dropZone.classList.remove("drop-active");
    });
    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropZone.classList.remove("drop-active");
      const itemId = e.dataTransfer.getData("text/plain");
      if (itemId) processItemToRobo(itemId);
    });
  }

  // Completion button to begin Nova's first training lesson.
  document.querySelector("#proceed-to-hero-forge-btn")?.addEventListener("click", () => {
    complete("untrained_ask");
    toastMessage("🚀 Great job testing untrained Nova! Now teach Nova with labeled examples.", true);
    navigate("supervised");
  });

  refreshIcons();
}

function renderHero() {
  const currentLevel = state.hero.level || 1;

  const swatches = [
    ["#ffbd61", "#ed5c88", "#9effee", "Solar Gold"],
    ["#60d7ff", "#6d68ff", "#a8fff2", "Cyber Neon"],
    ["#9a77ff", "#df79c9", "#ffd0ff", "Plasma Violet"],
    ["#69ecab", "#2ca9d0", "#bdffe7", "Emerald Matrix"],
    ["#f59e0b", "#ef4444", "#fbbf24", "Megazord Flame"],
    ["#ec4899", "#8b5cf6", "#38bdf8", "Cosmic Titan"]
  ];

  content.innerHTML = `
    ${header("CHAPTER 01 // HERO FORGE", "Build your AI Superhero", "Superhero born with zero powers. Complete AI chapters to evolve your superhero and add new superpowers!", "01")}

    <div class="forge-layout">
      <!-- Left: High-End Interactive 3D/SVG Hero Stage -->
      <section class="hero-stage-highend">
        <div class="cyber-grid-backdrop"></div>
        <div class="cyber-energy-ring"></div>
        <div class="cyber-energy-ring-inner"></div>

        <!-- Floating HUD Badges -->
        <div class="hud-tier-tag">
          ${icon("shield")} BASE HERO
        </div>
        <div class="hud-power-indicator">
          ${icon("zap")} 0 Powers (Base Form)
        </div>

        <!-- High-End Dynamic SVG Hero Avatar -->
        <div id="forge-hero-graphic" class="hero-svg-canvas">
          ${renderHeroGraphic(currentLevel, state.hero.primary, state.hero.secondary, state.hero.glow, state.hero.name)}
        </div>

        <!-- Floating Nameplate -->
        <div class="hero-nameplate-highend">
          <strong id="hero-display-name">${state.hero.name}</strong>
          <span id="hero-display-power">BORN WITH ZERO POWERS</span>
        </div>
      </section>

      <!-- Right: Clean Hero Controls Panel -->
      <section class="control-panel">
        <h3 style="margin:0 0 6px;color:#18335b;">Hero Forge</h3>
        <p style="margin:0 0 20px;color:#5f789d;font-size:13px;line-height:1.45;">
          Your superhero is born with <strong>zero powers</strong>. Choose a name and energy colors to begin your journey. You will unlock new powers with each AI chapter you complete!
        </p>

        <!-- Customization Controls -->
        <div class="control-group">
          <label>Hero name</label>
          <input id="hero-name" class="name-input" maxlength="14" value="${state.hero.name}" placeholder="Name your superhero" />
        </div>

        <div class="control-group">
          <label>Energy color theme</label>
          <div class="swatches">
            ${swatches.map((colors) => `
              <button class="swatch ${state.hero.primary === colors[0] ? "selected" : ""}" 
                title="${colors[3]}" 
                aria-label="Choose hero colors ${colors[3]}" 
                data-colors="${colors[0]},${colors[1]},${colors[2]}" 
                style="--swatch:linear-gradient(135deg,${colors[0]},${colors[1]})">
              </button>
            `).join("")}
          </div>
        </div>

        <button id="save-hero" class="button button-primary save-hero" style="width:100%;margin-top:24px;">
          <span>Save Hero & Start Supervised Learning (Ch 02)</span>
          ${icon("arrow-right")}
        </button>
      </section>
    </div>
  `;

  // Color Swatches
  document.querySelectorAll(".swatch").forEach((button) => {
    button.addEventListener("click", () => {
      const [p, s, g] = button.dataset.colors.split(",");
      state.hero.primary = p;
      state.hero.secondary = s;
      state.hero.glow = g;
      persistProgress();
      document.querySelectorAll(".swatch").forEach((item) => item.classList.toggle("selected", item === button));
      // Update Graphic
      document.querySelector("#forge-hero-graphic").innerHTML = renderHeroGraphic(state.hero.level, p, s, g, state.hero.name);
    });
  });

  // Name Input
  document.querySelector("#hero-name").addEventListener("input", (event) => {
    state.hero.name = event.target.value.trim().toUpperCase() || "STARBYTE";
    document.querySelector("#hero-display-name").textContent = state.hero.name;
    persistProgress();
  });

  // Save & Continue
  document.querySelector("#save-hero").addEventListener("click", () => {
    complete("hero");
    toastMessage(`${state.hero.name} is ready for learning!`, true);
    navigate("supervised");
  });

  refreshIcons();
}
function isFruit(kind) { return ["apple", "green-apple", "orange", "banana"].includes(kind); }
function fruitArt(kind) {
  const fruitClass = { banana: "banana-art", "green-apple": "green-apple-art", orange: "orange-art" }[kind] || "apple-art";
  return `<span class="fruit-art ${fruitClass}" aria-hidden="true"><i></i><b></b></span>`;
}
function fruitPhoto(kind, scene = "picnic", image = "") {
  if (image) {
    return `<span class="fruit-photo image-photo" aria-hidden="true"><img src="${image}" alt="${kind}" class="fruit-img" /><span class="photo-light"></span></span>`;
  }
  return `<span class="fruit-photo scene-${scene}" aria-hidden="true"><span class="photo-light"></span>${fruitArt(kind)}</span>`;
}
function soundWaveVisual() {
  return `<span class="sound-wave-icon" style="font-size:24px;">🎵</span>`;
}
function audioTag(asset) {
  if (!asset?.audio) return "";
  const ext = asset.audio.endsWith(".mp3") ? "audio/mpeg" : "audio/wav";
  return `<audio class="lesson-audio" data-clip="${asset.audio}" preload="auto" src="${asset.audio}"><source src="${asset.audio}" type="${ext}"></audio>`;
}
function playClip(asset) {
  if (!asset?.audio) return;
  const player = document.querySelector(`audio[data-clip="${asset.audio}"]`);
  if (!player) return;
  if (activeAudio && activeAudio !== player) { activeAudio.pause(); activeAudio.currentTime = 0; activeAudio.closest(".data-card, .test-item-card, .unlabeled-card, .basket-item-card")?.classList.remove("playing-audio"); }
  player.currentTime = 0;
  activeAudio = player;
  const host = player.closest(".data-card, .test-item-card, .unlabeled-card, .basket-item-card");
  host?.classList.add("playing-audio");
  player.onended = () => host?.classList.remove("playing-audio");
  player.play().catch(() => toastMessage("Tap once more to play audio clip."));
}
function playEurekaSound() {
  try {
    const eureka = new Audio("/sounds/eureka.mp3");
    eureka.volume = 0.8;
    eureka.play().catch(() => {});
  } catch (e) {}
}
function playFantasySound() {
  try {
    if (activeAudio) {
      activeAudio.pause();
      activeAudio.currentTime = 0;
    }
    const fantasy = new Audio("/sounds/fantasy.mp3");
    fantasy.volume = 0.8;
    activeAudio = fantasy;
    fantasy.play().catch(() => {});
  } catch (e) {}
}

function playWrongSound() {
  try {
    const wrong = new Audio("/sounds/wrong.mp3");
    wrong.volume = 0.85;
    wrong.play().catch(() => {});
  } catch (e) {}
}

let activeCarGameAudio = null;
function playCarGameSound() {
  try {
    if (!activeCarGameAudio) {
      activeCarGameAudio = new Audio("/sounds/car-game.mp3");
      activeCarGameAudio.loop = true;
      activeCarGameAudio.volume = 0.7;
    }
    activeCarGameAudio.play().catch(() => {});
  } catch (e) {}
}

function stopCarGameSound() {
  if (activeCarGameAudio) {
    activeCarGameAudio.pause();
    activeCarGameAudio.currentTime = 0;
    activeCarGameAudio = null;
  }
}

function playDragDropSound() {
  try {
    const audio = new Audio("/sounds/drag_and_drop.mp3");
    audio.volume = 0.85;
    audio.play().catch(() => {});
  } catch (e) {}
}
document.addEventListener("drop", () => playDragDropSound());

function showEurekaPopup(onComplete) {
  const eurekaPopup = document.createElement("div");
  eurekaPopup.className = "eureka-fullscreen-popup";
  
  let sparklesHtml = '<div class="eureka-sparkles">';
  for (let i = 0; i < 22; i++) {
    const left = Math.random() * 100;
    const delay = Math.random() * 1.5;
    const size = 4 + Math.random() * 6;
    const colors = ["#ffcf69", "#ff8cb8", "#69ddff", "#8fffe8", "#a58cff"];
    const color = colors[Math.floor(Math.random() * colors.length)];
    sparklesHtml += `<span class="eureka-sparkle" style="left:${left}%;bottom:20%;animation-delay:${delay}s;width:${size}px;height:${size}px;background:${color};box-shadow:0 0 10px ${color};"></span>`;
  }
  sparklesHtml += '</div>';

  eurekaPopup.innerHTML = `
    ${sparklesHtml}
    <div class="eureka-icon">💡</div>
    <h1 class="eureka-big-title"><em>Eureka!</em></h1>
  `;
  document.body.appendChild(eurekaPopup);
  playEurekaSound();

  // Exactly 2 seconds visible on screen, then fade out and redirect
  setTimeout(() => {
    eurekaPopup.classList.add("eureka-fade-out");
    setTimeout(() => {
      eurekaPopup.remove();
      if (onComplete) onComplete();
    }, 400);
  }, 2000);
}

function thinkingBrain() {
  return `
    <div class="model-core thinking-core nova-training-pod" aria-label="Nova, the robot being trained">
      <span class="nova-training-ring ring-one"></span>
      <span class="nova-training-ring ring-two"></span>
      <span class="nova-data-particle particle-one"></span>
      <span class="nova-data-particle particle-two"></span>
      <span class="nova-data-particle particle-three"></span>
      <div class="nova-training-avatar">
        ${renderRoboAvatar("#ffbd61", "#ed5c88", "#9effee", "NOVA")}
      </div>
      <span class="nova-training-tag">NOVA IS LEARNING</span>
    </div>
  `;
}

function brainstormMarkup(title, copy) {
  return `<div class="nova-thinking-stage" aria-label="Nova is thinking"><span class="nova-think-orbit orbit-a"></span><span class="nova-think-orbit orbit-b"></span><span class="nova-think-dot dot-a"></span><span class="nova-think-dot dot-b"></span><span class="nova-think-dot dot-c"></span><div class="nova-thinking-avatar">${renderRoboAvatar("#ffbd61", "#ed5c88", "#9effee", "NOVA")}</div><span class="nova-thinking-status"><i></i>NOVA IS THINKING</span></div><h3>${title}</h3><p>${copy}</p>`;
}

/* ==========================================
   CHAPTER 02: SUPERVISED LEARNING (IMAGES)
   ========================================== */
function renderSupervised() {
  if (state.supervisedStage === "test" || (state.supervisedTrained && state.supervisedStage !== "train")) {
    renderSupervisedTest();
  } else {
    renderSupervisedTrain();
  }
}

function renderSupervisedTrain() {
  const assets = supervisedData;
  const cards = assets.map((asset, index) => `<button class="data-card" draggable="true" data-id="${index}" data-category="${asset.category}" aria-label="Select ${asset.label}"><span class="data-visual">${fruitPhoto(asset.kind, "picnic", asset.image)}</span><span class="data-label">${asset.label}</span></button>`).join("");
  const zones = ["Apple", "Banana"].map((category) => `<button class="drop-zone" type="button" data-category="${category}"><strong>${category} examples</strong><small>Drop ${category.toLowerCase()} cards here</small></button>`).join("");

  content.innerHTML = `
    ${header("CHAPTER 02 // SUPERVISED LEARNING", "Train with labeled examples.", "In Supervised Learning, humans act as teachers and provide labeled examples with the correct answers. The AI learns patterns to recognize unseen examples.", "02")}
    
    <div class="lab-layout">
      <section class="lab-panel">
        <div class="inspection-topline" style="margin-bottom:12px;"><span>${icon("tag")} LABELED TRAINING DATA</span><small>TEACHER PROVIDES CORRECT LABELS</small></div>
        <div id="asset-tray" class="asset-tray fruit-tray">${cards}</div>
        <p class="drop-heading">Drag each photo card into its labeled group (Apple or Banana).</p>
        <div class="drop-zones">${zones}</div>
      </section>
      <aside class="training-side">
        <h3>Teach Nova with labels</h3>
        <p id="training-copy">You are teaching <strong>Nova</strong>. Sort the photos into labeled categories so Nova can learn colors, shapes, and stems.</p>
        <div id="brain-speech-bubble" class="brain-speech-bubble" style="display:none;">
          <span id="brain-speech-text">🤖 Nova is ready to learn!</span>
        </div>
        <div id="brain-container" style="position:relative;">
          ${thinkingBrain()}
          <div id="dissolve-targets" style="position:absolute;inset:0;pointer-events:none;"></div>
        </div>
        <div class="training-stat"><span>Labeled cards sorted</span><b id="training-count">0 / ${assets.length}</b></div>
        <div class="progress-track train-progress"><div id="training-progress" class="progress-fill"></div></div>
        <button id="train-model" class="button button-primary train-button" disabled><span>Train Supervised Model</span>${icon("zap")}</button>
      </aside>
    </div>
  `;

  let assigned = 0;
  let selectedCard = null;
  const placeCard = (card, zone) => {
    if (!card || card.dataset.used) return;
    playDragDropSound();
    const correct = card.dataset.category === zone.dataset.category;
    card.dataset.used = "true";
    card.draggable = false;
    card.style.display = "none";
    selectedCard = null;
    const result = document.createElement("div");
    result.className = "dropped-item";
    result.dataset.assetId = card.dataset.id;
    result.innerHTML = `<span class="data-visual">${fruitPhoto(assets[card.dataset.id].kind, "picnic", assets[card.dataset.id].image)}</span><span style="font-weight:700;">${assets[card.dataset.id].label}</span>`;
    if (!correct) result.style.color = "#b66b16";
    zone.append(result);
    assigned += 1;
    document.querySelector("#training-count").textContent = `${assigned} / ${assets.length}`;
    document.querySelector("#training-progress").style.width = `${(assigned / assets.length) * 100}%`;
    if (assigned === assets.length) {
      document.querySelector("#train-model").disabled = false;
      document.querySelector("#training-copy").textContent = "All examples labeled! Nova is ready to learn.";
      const bubble = document.querySelector("#brain-speech-bubble");
      if (bubble) {
        bubble.style.display = "block";
        bubble.classList.add("bubble-pop-in");
      }
    }
  };

  document.querySelectorAll(".data-card").forEach((card) => {
    card.addEventListener("dragstart", (event) => { event.dataTransfer.setData("text/plain", card.dataset.id); card.classList.add("dragging"); });
    card.addEventListener("dragend", () => card.classList.remove("dragging"));
    card.addEventListener("click", () => {
      if (card.dataset.used) return;
      selectedCard = card;
      document.querySelectorAll(".data-card").forEach((item) => item.classList.toggle("selected", item === card));
      document.querySelector("#training-copy").textContent = `${assets[Number(card.dataset.id)].label} selected. Tap its labeled group.`;
    });
  });
  document.querySelectorAll(".drop-zone").forEach((zone) => {
    zone.addEventListener("dragover", (event) => { event.preventDefault(); zone.classList.add("hover"); });
    zone.addEventListener("dragleave", () => zone.classList.remove("hover"));
    zone.addEventListener("drop", (event) => { event.preventDefault(); zone.classList.remove("hover"); placeCard(document.querySelector(`.data-card[data-id="${event.dataTransfer.getData("text/plain")}"]`), zone); });
    zone.addEventListener("click", () => placeCard(selectedCard, zone));
  });

  document.querySelector("#train-model").addEventListener("click", (event) => {
    const trainButton = event.currentTarget;
    if (trainButton.disabled) return;
    trainButton.disabled = true;
    trainButton.innerHTML = `<span>Teaching Nova...</span>${icon("loader-circle")}`;
    refreshIcons();
    trainButton.querySelector("svg")?.style.setProperty("animation", "spin 1s linear infinite");

    const bubble = document.querySelector("#brain-speech-bubble");
    const speechText = document.querySelector("#brain-speech-text");
    const brainCore = document.querySelector("#brain-container .thinking-core");
    const bar = document.querySelector("#training-progress");
    const copy = document.querySelector("#training-copy");

    if (bubble) bubble.style.display = "none";
    copy.textContent = "Sending labeled examples to Nova's learning core...";

    // Step 1: Dissolve the 4 dropped items — fly clones of EXACT visual items into the brain
    const droppedItems = document.querySelectorAll(".dropped-item");
    const brainRect = brainCore?.getBoundingClientRect();

    droppedItems.forEach((item, idx) => {
      const itemRect = item.getBoundingClientRect();
      const flyClone = document.createElement("div");
      flyClone.className = "dissolve-fly-item";
      flyClone.innerHTML = item.innerHTML;
      flyClone.style.cssText = `
        position:fixed; z-index:9999;
        left:${itemRect.left + itemRect.width / 2}px;
        top:${itemRect.top + itemRect.height / 2}px;
        transform:translate(-50%,-50%) scale(1); opacity:1;
        transition: all 0.9s cubic-bezier(0.34, 1.56, 0.64, 1);
        pointer-events:none;
      `;
      document.body.appendChild(flyClone);

      setTimeout(() => {
        if (brainRect) {
          flyClone.style.left = `${brainRect.left + brainRect.width / 2}px`;
          flyClone.style.top = `${brainRect.top + brainRect.height / 2}px`;
        }
        flyClone.style.transform = "translate(-50%,-50%) scale(0.2)";
        flyClone.style.opacity = "0";
      }, 150 + idx * 250);

      setTimeout(() => flyClone.remove(), 1100 + idx * 250);

      item.style.transition = "opacity 0.4s ease";
      item.style.opacity = "0";
      setTimeout(() => { item.style.display = "none"; }, 500);
    });

    // Step 2: Robot Brain intense thinking
    setTimeout(() => {
      if (!document.body.contains(trainButton)) return;
      if (brainCore) brainCore.classList.add("absorbing");
      copy.textContent = "Studying labeled training patterns...";
      bar.style.width = "70%";
      if (bubble) {
        bubble.style.display = "block";
        bubble.classList.remove("bubble-pop-in");
        void bubble.offsetWidth;
        bubble.classList.add("bubble-pop-in");
        if (speechText) speechText.innerHTML = "🤔 Nova is studying the patterns...";
      }
    }, 1800);

    // Step 3: Deep neural connection
    setTimeout(() => {
      if (!document.body.contains(trainButton)) return;
      copy.textContent = "Nova is building connections between features and labels...";
      bar.style.width = "95%";
      if (speechText) speechText.innerHTML = "✨ Nova is learning how to recognize fruits...";
    }, 3200);

    // Step 4: Eureka screen popup (2 seconds strictly) & redirect to testing
    setTimeout(() => {
      if (!document.body.contains(trainButton)) return;
      bar.style.width = "100%";
      if (brainCore) brainCore.classList.remove("absorbing");
      if (bubble) bubble.style.display = "none";

      showEurekaPopup(() => {
        state.supervisedTrained = true;
        state.supervisedStage = "test";
        complete("supervised");
        toastMessage("🎉 <strong>Supervised Training Complete!</strong> Nova is ready for the Test Arena!", true);
        renderSupervised();
      });
    }, 4500);
  });
}

function renderSupervisedTest() {
  content.innerHTML = `
    ${header("CHAPTER 02 // SUPERVISED LEARNING", "Inspect unseen mystery fruits in Test Arena.", "", "02")}
    
    <div class="training-complete-banner">
      <div class="banner-left">
        <span class="banner-badge-icon">🎉</span>
        <div>
          <div class="banner-title">${icon("badge-check")} Training is Completed!</div>
          <p class="banner-subtitle"><strong>Nova</strong> has learned from your labels and is ready to test!</p>
        </div>
      </div>
      <button id="retrain-supervised-btn" class="button button-outline" style="font-size:11px;padding:6px 14px;background:rgba(255,255,255,0.08);border-radius:8px;border:1px solid rgba(255,255,255,0.25);color:#cbd9ef;white-space:nowrap;">${icon("refresh-cw")} Train Again with Labeled Cards</button>
    </div>

    <div class="inspection-layout">
      <section class="inspection-station">
        <div class="inspection-topline"><span>${icon("scan-line")} VISION SCANNER</span><small>UNSEEN MYSTERY EXAMPLES</small></div>
        <div class="test-card-tray">
          ${supervisedTests.map((card) => `<button class="test-item-card" draggable="true" data-test-id="${card.id}" aria-label="Choose ${card.label}">${fruitPhoto(card.kind, "picnic", card.image)}<span>${card.label}</span><small>Drag to scan</small></button>`).join("")}
        </div>
        <button id="ai-scanner" class="ai-scanner" type="button">
          <span id="scanner-visual" class="scanner-empty">${icon("move-down")}<b>Drop a mystery fruit here</b><small>or choose a card, then tap this scanner</small></span>
        </button>
        <div class="scanner-action">
          <button id="ask-ai" class="button button-primary" disabled><span>Ask Nova to identify</span>${icon("sparkles")}</button>
          <p id="scanner-help">Select or drag a mystery fruit to inspect.</p>
        </div>
      </section>
      <aside class="analysis-panel">
        <p class="kicker">AI EXPLANATION</p>
        <div id="analysis-result" class="analysis-empty">
          ${icon("scan-search")}
          <h3>Waiting for mystery test</h3>
          <p>Choose an unseen fruit card, place it in the scanner, then ask Nova to identify it.</p>
        </div>
        <div class="finding warn">${icon("shield-alert")}<span>Supervised AI matches learned patterns against its training cards.</span></div>
      </aside>
    </div>
  `;

  document.querySelector("#retrain-supervised-btn")?.addEventListener("click", () => {
    state.supervisedStage = "train";
    renderSupervised();
  });

  let selectedTestCard = null;
  const testById = new Map(supervisedTests.map((c) => [c.id, c]));
  const scanner = document.querySelector("#ai-scanner");
  const scannerVisual = document.querySelector("#scanner-visual");
  const askButton = document.querySelector("#ask-ai");
  const scannerHelp = document.querySelector("#scanner-help");

  const selectTestCard = (card) => {
    if (!card) return;
    selectedTestCard = card;
    document.querySelectorAll(".test-item-card").forEach((item) => item.classList.toggle("selected", item.dataset.testId === card.id));
    scanner.classList.add("loaded");
    scannerVisual.className = "scanner-preview";
    scannerVisual.innerHTML = `${fruitPhoto(card.kind, "picnic", card.image)}<b>${card.label}</b><small>Ready for AI inspection</small>`;
    askButton.disabled = false;
    scannerHelp.textContent = "Mystery example loaded. Ask your AI to inspect it.";
  };

  document.querySelectorAll(".test-item-card").forEach((item) => {
    item.addEventListener("click", () => selectTestCard(testById.get(item.dataset.testId)));
    item.addEventListener("dragstart", (event) => { event.dataTransfer.setData("text/plain", item.dataset.testId); item.classList.add("dragging"); });
    item.addEventListener("dragend", () => item.classList.remove("dragging"));
  });
  scanner?.addEventListener("dragover", (event) => { event.preventDefault(); scanner.classList.add("drop-hover"); });
  scanner?.addEventListener("dragleave", () => scanner.classList.remove("drop-hover"));
  scanner?.addEventListener("drop", (event) => { event.preventDefault(); scanner.classList.remove("drop-hover"); selectTestCard(testById.get(event.dataTransfer.getData("text/plain"))); });
  scanner?.addEventListener("click", () => selectTestCard(selectedTestCard));

  askButton?.addEventListener("click", () => {
    if (!selectedTestCard || askButton.disabled) return;
    askButton.disabled = true;
    scanner.classList.add("scanning");
    const resultBox = document.querySelector("#analysis-result");
    resultBox.className = "analysis-loading";
    resultBox.innerHTML = brainstormMarkup("Nova is inspecting the mystery fruit...", "Comparing its color, shape, and stem with the labeled examples you taught it.");
    refreshIcons();

    window.setTimeout(() => {
      if (!document.body.contains(scanner)) return;
      playEurekaSound();
      scanner.classList.remove("scanning");
      const reasonItems = selectedTestCard.reasons.map((reason) => `<li>${icon("check-circle-2")}<span>${reason}</span></li>`).join("");
      resultBox.className = "analysis-result";
      const prediction = selectedTestCard.answer === "Drums" ? selectedTestCard.answer : `${/^[aeiou]/i.test(selectedTestCard.answer) ? "an" : "a"} ${selectedTestCard.answer}`;
      resultBox.innerHTML = `
        <div class="prediction-banner">
          <span>AI PREDICTION</span>
          <strong>It looks most like ${prediction}.</strong>
          <b>${selectedTestCard.confidence}% <small>${selectedTestCard.answer.toLowerCase()} match confidence</small></b>
        </div>
        <h3>Why your AI thinks this</h3>
        <ul class="reason-list">${reasonItems}</ul>
        <p class="analysis-note">It compared this new example with the patterns in its labeled training cards.</p>
        <div class="supervised-learning-section">
          <button id="supervised-learning-btn" class="button-supervised" type="button" aria-label="Learn about Supervised Learning">
            <span class="supervised-tag">${icon("sparkles")} AI LEARNING METHOD</span>
            <strong class="supervised-title">SUPERVISED LEARNING</strong>
            <span class="supervised-hint">${icon("help-circle")} What is Supervised Learning? Tap to learn</span>
          </button>
        </div>

        <div style="margin-top:16px;padding-top:14px;border-top:1px dashed rgba(67,119,183,0.25);">
          <button id="goto-unsupervised-btn" class="button button-primary" style="width:100%;">
            <span>Proceed to Unsupervised Learning (Ch 03)</span>${icon("arrow-right")}
          </button>
        </div>
      `;
      refreshIcons();
      document.querySelector("#supervised-learning-btn")?.addEventListener("click", showSupervisedModal);
      document.querySelector("#goto-unsupervised-btn")?.addEventListener("click", () => {
        showNovaUpgradeTransition(2, "unsupervised");
      });
      complete("supervised");
      toastMessage("🎉 Nova completed a supervised inspection!", true);
    }, 4000);
  });
}

function showSupervisedModal() {
  let modal = document.querySelector("#supervised-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "supervised-modal";
    modal.className = "concept-modal-backdrop";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.innerHTML = `
      <div class="concept-modal">
        <button class="modal-close-btn" id="close-supervised-modal" aria-label="Close modal">${icon("x")}</button>
        <div class="modal-badge">${icon("brain-circuit")} AI CONCEPT // SUPERVISED LEARNING</div>
        <h2>What is Supervised Learning?</h2>
        <p class="modal-lead"><strong>Supervised Learning</strong> is the method of teaching an AI using <strong>labeled training examples with correct answers</strong>—just like a teacher supervising a student!</p>
        <div class="modal-steps">
          <div class="modal-step">
            <div class="step-num">1</div>
            <div class="step-content">
              <h4>The Supervision (Labeled Training)</h4>
              <p>In the lab, you provided the answers by sorting images into <em>"Apple"</em> & <em>"Banana"</em>. The AI studied each labeled card to discover defining patterns.</p>
            </div>
          </div>
          <div class="modal-step">
            <div class="step-num">2</div>
            <div class="step-content">
              <h4>The Prediction (Test Inspection)</h4>
              <p>Because the AI was "supervised" with labeled examples, it can now inspect <strong>brand-new mystery examples</strong> and correctly recognize what they are based on learned clues!</p>
            </div>
          </div>
        </div>
        <div class="modal-footer-tip">
          ${icon("lightbulb")} <span><strong>Key AI Rule:</strong> Labeled Examples (Data) + Human Supervision (Labels) = Supervised AI Model!</span>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    refreshIcons();
    modal.querySelector("#close-supervised-modal").addEventListener("click", () => modal.classList.add("hidden"));
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.classList.add("hidden");
    });
  }
  modal.classList.remove("hidden");
  refreshIcons();
}

/* ==============================================
   CHAPTER 03: UNSUPERVISED LEARNING (2 BASKETS)
   ============================================== */
function renderUnsupervised() {
  if (state.unsupervisedStage === "test" || (state.unsupervisedTrained && state.unsupervisedStage !== "train")) {
    renderUnsupervisedTest();
  } else {
    renderUnsupervisedTrain();
  }
}

function renderUnsupervisedTrain() {
  const assets = unsupervisedAudioData;
  const cards = assets.map((asset, index) => `
    <button class="unlabeled-card" draggable="true" data-id="${index}" aria-label="Select ${asset.label}">
      <span class="sound-wave-icon" style="font-size:24px;">🎵</span>
      <div style="text-align:left;">
        <strong style="display:block;font-size:12px;color:#fff;">${asset.label}</strong>
        <small style="color:#7eedff;font-size:10px;">Tap to play sound clip</small>
      </div>
      ${audioTag(asset)}
    </button>
  `).join("");

  content.innerHTML = `
    ${header("CHAPTER 03 // UNSUPERVISED LEARNING", "Cluster unlabeled audio without a teacher.", "In Unsupervised Learning, the AI receives raw, unlabeled audio files without any answers given. It listens to frequencies, pitches, and beats to naturally group sounds into 2 baskets.", "03")}
    
    <div class="lab-layout">
      <section class="lab-panel">
        <div class="inspection-topline" style="margin-bottom:12px;"><span>${icon("audio-waveform")} UNLABELED AUDIO FILES</span><small>NO LABELS GIVEN (NO TEACHER)</small></div>
        <div class="unlabeled-grid">${cards}</div>
        <p class="drop-heading">Listen to each sound clip, then drop all 4 unlabeled files into the clusterer.</p>
        <div class="drop-zones single-drop-zone">
          <button class="drop-zone story-mixer-zone" type="button" data-category="Cluster">
            <strong>Unsupervised Sound Clusterer</strong>
            <small>Drop all 4 unlabeled audio cards here for pattern discovery</small>
          </button>
        </div>
      </section>
      <aside class="training-side">
        <h3>Pattern Discovery Core</h3>
        <p id="unsupervised-copy">The AI will analyze raw audio waveforms, tempo, and frequency variations without any human labels.</p>
        <div id="brain-speech-bubble" class="brain-speech-bubble" style="display:none;">
          <span id="brain-speech-text">🧠 Train me now!</span>
        </div>
        <div id="brain-container" style="position:relative;">
          ${thinkingBrain()}
          <div id="dissolve-targets" style="position:absolute;inset:0;pointer-events:none;"></div>
        </div>
        <div class="training-stat"><span>Unlabeled sounds added</span><b id="unsupervised-count">0 / ${assets.length}</b></div>
        <div class="progress-track train-progress"><div id="unsupervised-progress" class="progress-fill"></div></div>
        <button id="train-unsupervised" class="button button-primary train-button" disabled><span>Discover Natural Sound Clusters</span>${icon("sparkles")}</button>
      </aside>
    </div>
  `;

  let assigned = 0;
  let selectedCard = null;
  const placeCard = (card, zone) => {
    if (!card || card.dataset.used) return;
    playDragDropSound();
    card.dataset.used = "true";
    card.draggable = false;
    card.style.display = "none";
    selectedCard = null;
    const result = document.createElement("div");
    result.className = "dropped-item";
    result.innerHTML = `<span class="sound-wave-icon" style="font-size:20px;">🎵</span><strong style="font-size:12px;">${card.querySelector("strong").textContent}</strong>`;
    zone.append(result);
    assigned += 1;
    document.querySelector("#unsupervised-count").textContent = `${assigned} / ${assets.length}`;
    document.querySelector("#unsupervised-progress").style.width = `${(assigned / assets.length) * 100}%`;
    if (assigned === assets.length) {
      document.querySelector("#train-unsupervised").disabled = false;
      document.querySelector("#unsupervised-copy").textContent = "All 4 unlabeled audio files loaded! Click Discover Natural Sound Clusters.";
      const bubble = document.querySelector("#brain-speech-bubble");
      if (bubble) {
        bubble.style.display = "block";
        bubble.classList.add("bubble-pop-in");
      }
    }
  };

  document.querySelectorAll(".unlabeled-card").forEach((card) => {
    card.addEventListener("dragstart", (event) => { event.dataTransfer.setData("text/plain", card.dataset.id); card.classList.add("dragging"); });
    card.addEventListener("dragend", () => card.classList.remove("dragging"));
    card.addEventListener("click", () => {
      const asset = assets[Number(card.dataset.id)];
      playClip(asset);
      if (card.dataset.used) return;
      selectedCard = card;
      document.querySelectorAll(".unlabeled-card").forEach((item) => item.classList.toggle("selected", item === card));
      document.querySelector("#unsupervised-copy").textContent = `Playing ${asset.label}. Drop into the clusterer.`;
    });
  });

  document.querySelectorAll(".drop-zone").forEach((zone) => {
    zone.addEventListener("dragover", (event) => { event.preventDefault(); zone.classList.add("hover"); });
    zone.addEventListener("dragleave", () => zone.classList.remove("hover"));
    zone.addEventListener("drop", (event) => { event.preventDefault(); zone.classList.remove("hover"); placeCard(document.querySelector(`.unlabeled-card[data-id="${event.dataTransfer.getData("text/plain")}"]`), zone); });
    zone.addEventListener("click", () => placeCard(selectedCard, zone));
  });

  document.querySelector("#train-unsupervised").addEventListener("click", (event) => {
    const trainButton = event.currentTarget;
    if (trainButton.disabled) return;
    trainButton.disabled = true;
    trainButton.innerHTML = `<span>Clustering sound waves...</span>${icon("loader-circle")}`;
    refreshIcons();
    trainButton.querySelector("svg")?.style.setProperty("animation", "spin 1s linear infinite");

    const bubble = document.querySelector("#brain-speech-bubble");
    const speechText = document.querySelector("#brain-speech-text");
    const brainCore = document.querySelector("#brain-container .thinking-core");
    const bar = document.querySelector("#unsupervised-progress");
    const copy = document.querySelector("#unsupervised-copy");
    if (bubble) bubble.style.display = "none";
    copy.textContent = "Sending unlabeled audio to Nova's learning core...";

    // Step 1: Dissolve the 4 dropped audio items — fly clones of EXACT visual items into the brain
    const droppedItems = document.querySelectorAll(".dropped-item");
    const brainRect = brainCore?.getBoundingClientRect();

    droppedItems.forEach((item, idx) => {
      const itemRect = item.getBoundingClientRect();
      const flyClone = document.createElement("div");
      flyClone.className = "dissolve-fly-item";
      flyClone.innerHTML = item.innerHTML;
      flyClone.style.cssText = `
        position:fixed; z-index:9999;
        left:${itemRect.left + itemRect.width / 2}px;
        top:${itemRect.top + itemRect.height / 2}px;
        transform:translate(-50%,-50%) scale(1); opacity:1;
        transition: all 0.9s cubic-bezier(0.34, 1.56, 0.64, 1);
        pointer-events:none;
      `;
      document.body.appendChild(flyClone);

      setTimeout(() => {
        if (brainRect) {
          flyClone.style.left = `${brainRect.left + brainRect.width / 2}px`;
          flyClone.style.top = `${brainRect.top + brainRect.height / 2}px`;
        }
        flyClone.style.transform = "translate(-50%,-50%) scale(0.2)";
        flyClone.style.opacity = "0";
      }, 150 + idx * 250);

      setTimeout(() => flyClone.remove(), 1100 + idx * 250);

      item.style.transition = "opacity 0.4s ease";
      item.style.opacity = "0";
      setTimeout(() => { item.style.display = "none"; }, 500);
    });

    // Step 2: Robot Brain thinking
    setTimeout(() => {
      if (!document.body.contains(trainButton)) return;
      if (brainCore) brainCore.classList.add("absorbing");
      copy.textContent = "Nova is listening for sound patterns...";
      bar.style.width = "70%";
      if (bubble) {
        bubble.style.display = "block";
        bubble.classList.remove("bubble-pop-in");
        void bubble.offsetWidth;
        bubble.classList.add("bubble-pop-in");
        if (speechText) speechText.innerHTML = "🤔 Nova is comparing pitch and rhythm...";
      }
    }, 1800);

    // Step 3: Discovering clusters
    setTimeout(() => {
      if (!document.body.contains(trainButton)) return;
      copy.textContent = "Nova is discovering groups with similar sounds...";
      bar.style.width = "95%";
      if (speechText) speechText.innerHTML = "✨ Nova is grouping matching waveforms...";
    }, 3200);

    // Step 4: Eureka screen popup (2 seconds strictly) & redirect to test screen
    setTimeout(() => {
      if (!document.body.contains(trainButton)) return;
      bar.style.width = "100%";
      if (brainCore) brainCore.classList.remove("absorbing");
      if (bubble) bubble.style.display = "none";

      showEurekaPopup(() => {
        state.unsupervisedTrained = true;
        state.unsupervisedStage = "test";
        complete("unsupervised");
        toastMessage("🎉 <strong>Natural Clusters Formed!</strong> Nova is ready for the 2 Baskets Test!", true);
        renderUnsupervised();
      });
    }, 4500);
  });
}

function renderUnsupervisedTest() {
  content.innerHTML = `
    ${header("CHAPTER 03 // UNSUPERVISED LEARNING", "Audio clustered into 2 baskets & Mystery Testing.", "Without human labels, your AI discovered 2 natural sound clusters. Audio 01 & 03 fell into Basket 1, while Audio 02 & 04 fell into Basket 2. Tap any audio button to play its sound!", "03")}
    
    <div class="training-complete-banner" style="border-color:#bd7aff;background:linear-gradient(135deg, rgba(189, 122, 255, 0.2), rgba(99, 102, 241, 0.28));box-shadow:0 0 28px rgba(189, 122, 255, 0.3), inset 0 0 16px rgba(189, 122, 255, 0.12);">
      <div class="banner-left">
        <span class="banner-badge-icon">🎉</span>
        <div>
          <div class="banner-title" style="color:#e5bfff;">${icon("layers")} Unsupervised Clustering is Completed!</div>
          <p class="banner-subtitle"><strong>Nova</strong> discovered 2 natural baskets and is ready to test!</p>
        </div>
      </div>
      <button id="recluster-unsupervised-btn" class="button button-outline" style="font-size:11px;padding:6px 14px;background:rgba(255,255,255,0.08);border-radius:8px;border:1px solid rgba(255,255,255,0.25);color:#cbd9ef;white-space:nowrap;">${icon("refresh-cw")} Re-cluster Unlabeled Audio</button>
    </div>

    <!-- Top: 2 Discovered Baskets -->
    <div class="baskets-stage" style="margin-bottom: 24px;">
      <div id="basket-1" class="basket-box basket-1">
        <div class="basket-icon-big">🧺</div>
        <h4 class="basket-title">Basket 1</h4>
        <p class="basket-desc">High Pitch / Melodic Chirps (Tap to play)</p>
        <div class="basket-contents" id="basket-1-items">
          <button class="basket-item-card animate-drop" data-audio="/sounds/bird-sounds/1.mp3" aria-label="Play Audio Sample 01">
            <span>🎵 Audio Sample 01</span>
            <span style="display:inline-flex;align-items:center;gap:5px;color:#7eedff;font-size:11px;">${icon("play")} High Pitch</span>
            ${audioTag({ audio: "/sounds/bird-sounds/1.mp3" })}
          </button>
          <button class="basket-item-card animate-drop" data-audio="/sounds/bird-sounds/2.mp3" style="animation-delay: 0.15s;" aria-label="Play Audio Sample 03">
            <span>🎵 Audio Sample 03</span>
            <span style="display:inline-flex;align-items:center;gap:5px;color:#7eedff;font-size:11px;">${icon("play")} Chirp Tone</span>
            ${audioTag({ audio: "/sounds/bird-sounds/2.mp3" })}
          </button>
        </div>
      </div>

      <div id="basket-2" class="basket-box basket-2">
        <div class="basket-icon-big">🧺</div>
        <h4 class="basket-title">Basket 2</h4>
        <p class="basket-desc">Low Frequency / Rhythm Beats (Tap to play)</p>
        <div class="basket-contents" id="basket-2-items">
          <button class="basket-item-card animate-drop" data-audio="/sounds/drums-sounds/1.mp3" aria-label="Play Audio Sample 02">
            <span>🎵 Audio Sample 02</span>
            <span style="display:inline-flex;align-items:center;gap:5px;color:#ffb26b;font-size:11px;">${icon("play")} Percussion</span>
            ${audioTag({ audio: "/sounds/drums-sounds/1.mp3" })}
          </button>
          <button class="basket-item-card animate-drop" data-audio="/sounds/drums-sounds/2.mp3" style="animation-delay: 0.15s;" aria-label="Play Audio Sample 04">
            <span>🎵 Audio Sample 04</span>
            <span style="display:inline-flex;align-items:center;gap:5px;color:#ffb26b;font-size:11px;">${icon("play")} Rhythm Beat</span>
            ${audioTag({ audio: "/sounds/drums-sounds/2.mp3" })}
          </button>
        </div>
      </div>
    </div>

    <!-- Bottom: Mystery Testing Station -->
    <div class="inspection-layout" style="margin-top:16px;">
      <section class="inspection-station">
        <div class="inspection-topline"><span>${icon("music")} MYSTERY SOUND TESTING</span><small>2 UNSEEN AUDIO FILES</small></div>
        <p style="font-size:12px;color:#a0b8d8;margin:10px 0 14px;">Click on each mystery sound file to listen and watch your AI place it into its matching basket!</p>
        
        <div class="mystery-test-grid">
          ${unsupervisedMysteryTests.map((card, idx) => `
            <div id="mystery-card-${card.id}" class="mystery-test-card">
              <div style="display:flex;align-items:center;justify-content:space-between;">
                <strong>${card.label}</strong>
                <span class="badge" style="font-size:10px;padding:3px 7px;">Unseen Audio</span>
              </div>
              <p style="font-size:11px;color:#8ba6cb;margin:0;">Listen to wave pattern and ask AI to classify.</p>
              <div style="display:flex;gap:8px;">
                <button class="button button-outline play-mystery-btn" data-mystery-id="${card.id}" style="flex:1;font-size:11px;padding:6px 10px;">
                  ${icon("play")} Listen Clip
                </button>
                <button class="button button-primary place-mystery-btn" data-mystery-id="${card.id}" style="flex:1.4;font-size:11px;padding:6px 10px;">
                  ${icon("arrow-down-right")} Place in Basket
                </button>
              </div>
              ${audioTag(card)}
            </div>
          `).join("")}
        </div>
      </section>

      <aside class="analysis-panel">
        <p class="kicker">UNSUPERVISED CLUSTERING INSIGHT</p>
        <div id="unsupervised-result-box" style="margin-bottom:14px;">
          <div class="analysis-empty">
            ${icon("sparkles")}
            <h3>Audio Clustered</h3>
            <p>Audio 01 & 03 are grouped in Basket 1. Audio 02 & 04 are grouped in Basket 2. Tap the mystery files on the left to see where each new sound falls!</p>
          </div>
        </div>

        <div class="supervised-learning-section">
          <button id="unsupervised-learning-btn" class="button-unsupervised" type="button" aria-label="Learn about Unsupervised Learning">
            <span class="supervised-tag">${icon("sparkles")} AI LEARNING METHOD</span>
            <strong class="supervised-title">UNSUPERVISED LEARNING</strong>
            <span class="supervised-hint" style="color:#d7a8ff;">${icon("help-circle")} What is Unsupervised Learning? Tap to learn</span>
          </button>
        </div>
      </aside>
    </div>
  `;

  document.querySelector("#recluster-unsupervised-btn")?.addEventListener("click", () => {
    state.unsupervisedStage = "train";
    renderUnsupervised();
  });

  const mysteryById = new Map(unsupervisedMysteryTests.map((m) => [m.id, m]));

  // Delegate clicks on all basket cards to play audio
  document.querySelectorAll(".basket-item-card").forEach((card) => {
    card.addEventListener("click", () => {
      const audioPath = card.dataset.audio;
      if (audioPath) playClip({ audio: audioPath });
    });
  });

  // Play button listeners for mystery cards
  document.querySelectorAll(".play-mystery-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const mystery = mysteryById.get(btn.dataset.mysteryId);
      if (mystery) playClip(mystery);
    });
  });

  // Place mystery into basket logic
  document.querySelectorAll(".place-mystery-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const mystery = mysteryById.get(btn.dataset.mysteryId);
      if (!mystery || btn.disabled) return;
      btn.disabled = true;
      btn.innerHTML = `<span>Nova is thinking...</span>${icon("loader-circle")}`;
      refreshIcons();
      btn.querySelector("svg")?.style.setProperty("animation", "spin 1s linear infinite");

      const resultBox = document.querySelector("#unsupervised-result-box");
      if (resultBox) {
        resultBox.className = "analysis-loading";
        resultBox.innerHTML = brainstormMarkup(
          "Nova is listening for sound patterns...",
          `Analyzing ${mystery.label}'s pitch contours, frequencies, and waveform rhythm to match with discovered baskets.`
        );
        refreshIcons();
      }

      window.setTimeout(() => {
        playEurekaSound();
        const basketName = mystery.targetBasket === "basket-1" ? "Basket 1 (High Pitch / Chirps)" : "Basket 2 (Low Frequency / Beats)";
        const shortBasketName = mystery.targetBasket === "basket-1" ? "Basket 1" : "Basket 2";
        btn.innerHTML = `<span>${icon("badge-check")} Placed in ${shortBasketName}</span>`;
        const cardBox = document.querySelector(`#mystery-card-${mystery.id}`);
        cardBox?.classList.add("placed");

        const basketBox = document.querySelector(`#${mystery.targetBasket}`);
        basketBox?.classList.add("active-drop");
        window.setTimeout(() => basketBox?.classList.remove("active-drop"), 1200);

        const basketItemsContainer = document.querySelector(`#${mystery.targetBasket}-items`);
        if (basketItemsContainer) {
          const itemEl = document.createElement("button");
          itemEl.className = "basket-item-card animate-drop mystery-item";
          itemEl.dataset.audio = mystery.audio;
          itemEl.innerHTML = `<span>⭐ <strong>${mystery.label}</strong></span><span style="display:inline-flex;align-items:center;gap:5px;color:#ffd166;font-size:11px;">${icon("play")} ${mystery.similarity}% match</span>${audioTag(mystery)}`;
          itemEl.addEventListener("click", () => playClip({ audio: mystery.audio }));
          basketItemsContainer.appendChild(itemEl);
        }

        if (resultBox) {
          resultBox.className = "analysis-result";
          const reasonItems = mystery.reasons.map((r) => `<li>${icon("sparkles")}<span>${r}</span></li>`).join("");
          resultBox.innerHTML = `
            <div class="unsupervised-prediction-banner">
              <span class="cluster-tag">${icon("sparkles")} UNSUPERVISED CLUSTER MATCH</span>
              <strong>Placed into ${basketName}!</strong>
              <b>⭐ ${mystery.similarity}% frequency match</b>
            </div>
            <h3 style="margin-top:14px;">Why AI placed it in this basket</h3>
            <ul class="reason-list">${reasonItems}</ul>
            <div class="finding" style="border-color:#ffd166;background:rgba(255,209,102,0.12);color:#fff6db;margin-top:12px;">
              ${icon("lightbulb")}
              <span><strong>Clustering Insight:</strong> Nova grouped this sound based on shared waveform physics—completely unsupervised without labels! Tap its card above to listen anytime.</span>
            </div>
            <div style="margin-top:16px;padding-top:14px;border-top:1px dashed rgba(67,119,183,0.25);">
              <button id="goto-generative-btn" class="button button-primary" style="width:100%;">
                <span>Proceed to Generative AI (Ch 04)</span>${icon("arrow-right")}
              </button>
            </div>
          `;

          document.querySelector("#goto-generative-btn")?.addEventListener("click", () => {
            showNovaUpgradeTransition(3, "generative");
          });
        }

        refreshIcons();
        complete("unsupervised");
        toastMessage(`⭐ <strong>${mystery.label}</strong> placed into <span>${shortBasketName}</span> (${mystery.similarity}% match)!`, true);
      }, 4000);
    });
  });

  document.querySelector("#unsupervised-learning-btn")?.addEventListener("click", showUnsupervisedModal);
}

function showUnsupervisedModal() {
  let modal = document.querySelector("#unsupervised-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "unsupervised-modal";
    modal.className = "concept-modal-backdrop";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.innerHTML = `
      <div class="concept-modal">
        <button class="modal-close-btn" id="close-unsupervised-modal" aria-label="Close modal">${icon("x")}</button>
        <div class="modal-badge" style="color:#bd7aff;background:rgba(189,122,255,0.12);border-color:rgba(189,122,255,0.3)">${icon("layers")} AI CONCEPT // UNSUPERVISED LEARNING</div>
        <h2>What is Unsupervised Learning?</h2>
        <p class="modal-lead">In <strong>Unsupervised Learning</strong>, the AI is given <strong>raw, unlabeled data</strong> without any human teacher giving it answers!</p>
        <div class="modal-steps">
          <div class="modal-step">
            <div class="step-num" style="background:linear-gradient(135deg,#bd7aff,#ec4899)">1</div>
            <div class="step-content">
              <h4>No Human Labels (Unsupervised)</h4>
              <p>Nobody told the AI <em>"this is a bird"</em> or <em>"this is a drum"</em>. It only listened to the raw audio wave frequencies, tempos, and pitches.</p>
            </div>
          </div>
          <div class="modal-step">
            <div class="step-num" style="background:linear-gradient(135deg,#bd7aff,#ec4899)">2</div>
            <div class="step-content">
              <h4>Pattern Clustering (Two Baskets)</h4>
              <p>The AI grouped similar sounds together on its own: putting high-frequency chirps into <strong>Basket 1</strong> and deep rhythmic percussion into <strong>Basket 2</strong>!</p>
            </div>
          </div>
        </div>
        <div class="modal-footer-tip">
          ${icon("lightbulb")} <span><strong>Key AI Rule:</strong> Unlabeled Data + Pattern Discovery = Unsupervised Clustering!</span>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    refreshIcons();
    modal.querySelector("#close-unsupervised-modal").addEventListener("click", () => modal.classList.add("hidden"));
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.classList.add("hidden");
    });
  }
  modal.classList.remove("hidden");
  refreshIcons();
}

function renderGenerative() {
  const pointsMarkup = villageDataPoints.map((pt, idx) => `
    <div class="genai-point-item">
      <span class="genai-point-icon">${pt.icon}</span>
      <div class="genai-point-text">
        <small>TRAINED SITUATION 0${idx + 1}</small>
        <p>${pt.text}</p>
      </div>
    </div>
  `).join("");

  content.innerHTML = `${header("CHAPTER 04 // GENERATIVE AI", "Create new things with trained data.", "Generative AI doesn't just classify or label examples—it uses patterns from the data it was trained on to create brand-new stories, images, or audio.", "04")}<div class="inspection-layout genai-layout"><section class="inspection-station"><div class="inspection-topline"><span>${icon("database")} TRAINED VILLAGE DATASET</span><small>4 LEARNED SITUATIONS</small></div><div class="genai-points-list">${pointsMarkup}</div><div class="genai-action-box"><button id="genai-action-btn" class="button button-primary" style="width:100%"><span>Teach Nova this data</span>${icon("brain-circuit")}</button><p id="genai-help-text" class="genai-help-text">Click to teach Nova these 4 village situations.</p></div></section><aside class="analysis-panel"><p class="kicker">NOVA'S GENERATIVE ENGINE</p><div id="genai-result" class="analysis-empty">${icon("book-heart")}<h3>Ready for Training</h3><p>Click <strong>"Teach Nova this data"</strong> on the left so Nova can learn these 4 village situations.</p></div><div class="finding warn">${icon("shield-alert")}<span>Generative AI creates new combinations from learned data. A human should always read and review generated stories.</span></div></aside></div>`;

  const actionBtn = document.querySelector("#genai-action-btn");
  const helpText = document.querySelector("#genai-help-text");
  const resultBox = document.querySelector("#genai-result");
  let stage = "initial"; // "initial" -> "trained" -> "generated"

  actionBtn.addEventListener("click", () => {
    if (actionBtn.disabled) return;

    if (stage === "initial") {
      // Step 1: Train this dataset
      actionBtn.disabled = true;
      actionBtn.innerHTML = `<span>Training on dataset...</span>${icon("loader-circle")}`;
      refreshIcons();
      actionBtn.querySelector("svg")?.style.setProperty("animation", "spin 1s linear infinite");

      resultBox.className = "analysis-loading";
      resultBox.innerHTML = brainstormMarkup("Nova is learning the village patterns...", "Nova is studying the four situations and remembering details that can be combined into a new story.");
      refreshIcons();

      // Dissolve the 4 village situation cards into the brain/target
      const genaiItems = document.querySelectorAll(".genai-point-item");
      genaiItems.forEach((item, idx) => {
        const itemRect = item.getBoundingClientRect();
        const flyClone = document.createElement("div");
        flyClone.className = "dissolve-fly-item";
        flyClone.innerHTML = item.innerHTML;
        flyClone.style.cssText = `
          position:fixed; z-index:9999;
          left:${itemRect.left + itemRect.width / 2}px;
          top:${itemRect.top + itemRect.height / 2}px;
          transform:translate(-50%,-50%) scale(1); opacity:1;
          transition: all 0.9s cubic-bezier(0.34, 1.56, 0.64, 1);
          pointer-events:none;
        `;
        document.body.appendChild(flyClone);

        setTimeout(() => {
          if (resultBox) {
            const rRect = resultBox.getBoundingClientRect();
            flyClone.style.left = `${rRect.left + rRect.width / 2}px`;
            flyClone.style.top = `${rRect.top + rRect.height / 2}px`;
          }
          flyClone.style.transform = "translate(-50%,-50%) scale(0.2)";
          flyClone.style.opacity = "0";
        }, 150 + idx * 250);

        setTimeout(() => flyClone.remove(), 1100 + idx * 250);
      });

      window.setTimeout(() => {
        if (!document.body.contains(actionBtn)) return;

        // Show Eureka screen for 2 seconds strictly, then reveal ready state
        showEurekaPopup(() => {
          stage = "trained";
          actionBtn.disabled = false;
          actionBtn.innerHTML = `<span>I'm ready, click here to generate new story on train data</span>${icon("sparkles")}`;
          helpText.textContent = `✨ Training complete! Click the button above to generate a new story.`;
          refreshIcons();

          resultBox.className = "analysis-empty";
          resultBox.innerHTML = `${icon("badge-check")}<h3 style="color:#0ea5e9">Model Trained & Ready!</h3><p>Your AI has learned the patterns from all 4 situations. Click <strong>"I'm ready, click here to generate new story on train data"</strong> on the left to create the story.</p>`;
          refreshIcons();
          toastMessage("Nova finished learning the 4 village situations!");
        });
      }, 4000);

    } else if (stage === "trained") {
      // Step 2: Generate new story on trained data
      actionBtn.disabled = true;
      actionBtn.innerHTML = `<span>Generating new story...</span>${icon("loader-circle")}`;
      refreshIcons();
      actionBtn.querySelector("svg")?.style.setProperty("animation", "spin 1s linear infinite");

      resultBox.className = "analysis-loading";
      resultBox.innerHTML = brainstormMarkup("Nova is imagining a new story...", "Nova is combining the muddy pond, evening storm, Amma's hut, and lantern rescue into a brand-new story.");
      refreshIcons();

      window.setTimeout(() => {
        if (!document.body.contains(actionBtn)) return;
        playEurekaSound();
        stage = "generated";
        actionBtn.disabled = false;
        actionBtn.innerHTML = `<span>Regenerate story on trained data</span>${icon("sparkles")}`;
        helpText.textContent = `Story generated from your 4 trained points.`;
        refreshIcons();

        const storyHtml = villageStoryData.paragraphs.map((p) => `<p class="created-story">${p}</p>`).join("");
        const patternItems = villageStoryData.patterns.map((reason) => `<li>${icon("sparkles")}<span>${reason}</span></li>`).join("");

        resultBox.className = "story-output";
        resultBox.innerHTML = `
          <span class="output-label">GENERATED STORY</span>
          <h3>${villageStoryData.title}</h3>
          ${storyHtml}
          <div style="margin-top:18px;padding-top:14px;border-top:1px dashed rgba(67,119,183,0.25);">
            <button id="goto-applications-btn" class="button button-primary" style="width:100%;">
              <span>Proceed to AI Applications (Ch 05)</span>${icon("arrow-right")}
            </button>
          </div>
        `;
        refreshIcons();
        complete("generative");
        toastMessage("🎉 <strong>Story Created!</strong> Nova unlocked Chapter 05!", true);

        document.querySelector("#goto-applications-btn")?.addEventListener("click", () => {
          showNovaUpgradeTransition(4, "applications");
        });

        document.querySelector("#what-is-genai-btn")?.addEventListener("click", () => {
          const card = document.querySelector("#genai-concept-card");
          if (card) {
            card.classList.toggle("hidden");
            refreshIcons();
          }
        });
      }, 4000);

    } else if (stage === "generated") {
      // Re-trigger generation animation if clicked again
      stage = "trained";
      actionBtn.click();
    }
  });
}

const aiApplicationsData = [
  {
    id: "self-driving-car",
    number: "01",
    name: "Self-Driving Cars",
    icon: "car",
    image: "/images/self_drivingcar.png",
    tagline: "Autonomous vehicles that steer, brake, and navigate roads safely without human drivers.",
    techHeading: "How AI Works",
    techDescription: "Uses high-speed <strong>Computer Vision, Radar, and LIDAR lasers</strong> to scan 360° surroundings 60 times every second, detecting lanes, pedestrians, traffic lights, and other vehicles.",
    powerHeading: "Real-World Superpower",
    powerDescription: "Drastically cuts traffic accidents by eliminating human errors like distracted driving, texting, or tiredness.",
    factHeading: "Kid Fun Fact",
    factDescription: "A self-driving car processes over <strong>4,000 Gigabytes of sensor data every day</strong>—equal to streaming 1,000 HD movies!"
  },
  {
    id: "robots",
    number: "02",
    name: "Intelligent Robots",
    icon: "bot",
    image: "/images/robots.png",
    tagline: "Smart robotic helpers that build, assemble, clean, and explore extreme environments.",
    techHeading: "How AI Works",
    techDescription: "Combines <strong>Reinforcement Learning and Spatial Mapping</strong> to master physical balance, navigate complex terrain, and delicately grasp fragile objects like eggs without breaking them.",
    powerHeading: "Real-World Superpower",
    powerDescription: "Explores the surface of Mars, navigates deep-sea ocean trenches, and assists humans during hazardous disaster rescues.",
    factHeading: "Kid Fun Fact",
    factDescription: "NASA's Mars rover <strong>Perseverance</strong> uses AI vision to choose its own driving path across Martian boulder fields millions of miles from Earth!"
  },
  {
    id: "smart-homes",
    number: "03",
    name: "Smart Homes",
    icon: "home",
    image: "/images/smart_homes.png",
    tagline: "Living spaces that learn your daily routines, automate lighting, and save electrical energy.",
    techHeading: "How AI Works",
    techDescription: "Uses <strong>Natural Language Processing (NLP)</strong> for voice assistants combined with predictive algorithms to optimize heating, cooling, lighting, and home security.",
    powerHeading: "Real-World Superpower",
    powerDescription: "Reduces household power waste by up to 30% by automatically powering down unused appliances when rooms are empty.",
    factHeading: "Kid Fun Fact",
    factDescription: "Smart homes can recognize family members by their voice timbre and footstep rhythm, automatically setting their favorite room ambiance!"
  },
  {
    id: "medicine",
    number: "04",
    name: "AI in Medicine",
    icon: "activity",
    image: "/images/medicine_research.png",
    tagline: "Empowering labs with rapid research, drug discovery, medical imaging, DNA analysis and faster results.",
    techHeading: "How AI Works",
    techDescription: "Deep neural networks process massive datasets of genomic sequences, molecular structures, and medical images, enabling swift drug screening, precise diagnostics, and automated lab experiments.",
    powerHeading: "Real-World Superpower",
    powerDescription: "Accelerates breakthrough discoveries, reduces R&D time, and improves patient outcomes by delivering insights in minutes instead of weeks.",
    factHeading: "Kid Fun Fact",
    factDescription: "AI can predict how a new medicine will work on your DNA before a single test tube is filled!"
  },
  {
    id: "agricultural-drones",
    number: "05",
    name: "Agricultural Drones",
    icon: "plane",
    image: "/images/drone_technology.png",
    tagline: "Autonomous flying guardians protecting farm crops and optimizing water usage.",
    techHeading: "How AI Works",
    techDescription: "Uses <strong>Multispectral Infrared Cameras</strong> to inspect millions of crop plants, identifying thirsty patches and pests days before humans can spot them.",
    powerHeading: "Real-World Superpower",
    powerDescription: "Saves up to 90% water and precision-targets nutrients only onto affected plants, greatly reducing chemical pesticide usage.",
    factHeading: "Kid Fun Fact",
    factDescription: "A single AI drone can survey an entire 500-acre farm in under 20 minutes—a task that would take a human walking on foot over 3 full days!"
  },
  {
    id: "live-detection",
    number: "06",
    name: "Live Detection",
    icon: "video",
    image: "/images/live_detection.png",
    tagline: "Spotting suspicious activity, identifying theft, and alerting unauthorized actions with CCTV AI.",
    techHeading: "How AI Works",
    techDescription: "Runs real-time video analysis using computer vision and object detection to recognize unusual movements, abandoned bags, and unauthorized zone entry.",
    powerHeading: "Real-World Superpower",
    powerDescription: "Provides instant alerts to security staff, preventing theft and ensuring safety in stores, homes, and public spaces.",
    factHeading: "Kid Fun Fact",
    factDescription: "AI can detect a person leaving a bag unattended in just a few seconds, helping keep playgrounds safe!"
  }
];

function renderApplications() {
  const currentIndex = state.appIndex || 0;
  const currentApp = aiApplicationsData[currentIndex];
  const isLast = currentIndex === aiApplicationsData.length - 1;
  const isFirst = currentIndex === 0;

  // Step tracker pills
  const stepPills = aiApplicationsData.map((app, idx) => {
    const isActive = idx === currentIndex;
    const isPast = idx < currentIndex;
    return `
      <button class="apps-step-pill ${isActive ? "active" : ""} ${isPast ? "completed" : ""}" data-app-index="${idx}" type="button">
        ${isPast ? icon("check") : `<span>0${idx + 1}</span>`}
        <span>${app.name}</span>
      </button>
    `;
  }).join("");

  // Right side rectangular image container
  const imageHtml = currentApp.image
    ? `<img src="${currentApp.image}" alt="${currentApp.name}" class="app-image-preview" />`
    : `
      <div class="app-image-placeholder">
        <span class="app-image-icon-big">${currentApp.id === "self-driving-car" ? "🚗" : currentApp.id === "robots" ? "🦾" : currentApp.id === "smart-homes" ? "🏠" : currentApp.id === "healthcare" ? "🩺" : currentApp.id === "agricultural-drones" ? "🛸" : "🛡️"}</span>
        <h4>${currentApp.name}</h4>
        <span class="app-image-tag">${icon("image")} Image Space</span>
        <p>Rectangular space ready for image</p>
      </div>
    `;

  content.innerHTML = `
    ${header("CHAPTER 05 // AI APPLICATIONS", "6 Real-World AI Superpowers", "Explore how artificial intelligence transforms our world. Review each application and use the Next button to discover the next superpower.", "05")}

    <!-- Step Progress Tracker -->
    <div class="apps-step-tracker">
      ${stepPills}
    </div>

    <!-- 2-Column Application Showcase -->
    <div class="app-screen-layout">
      <!-- Left: Explanation Content Card -->
      <section class="app-text-card">
        <div class="app-badge-tag">
          ${icon("sparkles")} APPLICATION 0${currentIndex + 1} // 06
        </div>

        <div class="app-title-row">
          <h3>${currentApp.name}</h3>
          <p>${currentApp.tagline}</p>
        </div>

        <div class="app-detail-section">
          <div class="app-info-block tech-block">
            <h4>${icon("cpu")} ${currentApp.techHeading}</h4>
            <p>${currentApp.techDescription}</p>
          </div>

          <div class="app-info-block power-block">
            <h4>${icon("zap")} ${currentApp.powerHeading}</h4>
            <p>${currentApp.powerDescription}</p>
          </div>

          <div class="app-info-block fact-block">
            <h4>${icon("sparkles")} ${currentApp.factHeading}</h4>
            <p>${currentApp.factDescription}</p>
          </div>
        </div>
      </section>

      <!-- Right: Clean Rectangular Image Space -->
      <section class="app-image-container ${currentApp.image ? 'has-image' : ''}">
        ${imageHtml}
      </section>
    </div>

    <!-- Bottom Navigation Footer -->
    <footer class="apps-nav-footer">
      <button id="prev-app-btn" class="button button-outline" ${isFirst ? "disabled" : ""} style="padding:9px 20px;font-size:12px;">
        ${icon("arrow-left")} Previous
      </button>
      
      <div class="apps-counter-badge">
        Application <strong>${currentIndex + 1}</strong> of <strong>${aiApplicationsData.length}</strong>
      </div>

      <button id="next-app-btn" class="button button-primary" style="padding:9px 24px;font-size:12px;">
        <span>${isLast ? "Complete Chapter & Unlock Badge" : "Next Application"}</span>
        ${icon(isLast ? "badge-check" : "arrow-right")}
      </button>
    </footer>
  `;

  // Attach event handlers
  document.querySelectorAll(".apps-step-pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      state.appIndex = parseInt(pill.dataset.appIndex, 10);
      renderApplications();
      refreshIcons();
    });
  });

  document.querySelector("#prev-app-btn")?.addEventListener("click", () => {
    if (state.appIndex > 0) {
      state.appIndex -= 1;
      renderApplications();
      refreshIcons();
    }
  });

  document.querySelector("#next-app-btn")?.addEventListener("click", () => {
    if (!isLast) {
      state.appIndex += 1;
      renderApplications();
      refreshIcons();
    } else {
      // Completed all 6 applications!
      playEurekaSound();
      complete("applications");
      toastMessage(`🎉 <strong>All 6 AI Superpowers Mastered!</strong> Chapter 05 Completed!`, true);
      renderApplicationsCompletion();
    }
  });

  refreshIcons();
}

function renderApplicationsCompletion() {
  content.innerHTML = `
    ${header("CHAPTER 05 // AI APPLICATIONS", "All 6 Real-World Superpowers Mastered!", "You've explored how AI powers self-driving cars, intelligent robots, smart homes, healthcare diagnosis, agricultural drones, and fraud protection.", "05")}

    <div class="apps-celebration-card">
      <span style="font-size:48px;">🏆</span>
      <h2 style="font-family:var(--display);font-size:26px;color:#18335b;margin:12px 0 6px;">Chapter 05 Complete!</h2>
      <p style="color:#5f789d;font-size:14px;max-width:540px;margin:0 auto 20px;">
        Your AI Hero <strong>${state.hero.name}</strong> has unlocked the Real-World Applications Badge!
      </p>

      <div class="apps-celebration-grid">
        ${aiApplicationsData.map((app) => `
          <div class="apps-unlocked-badge">
            <span>${app.simType === "car" ? "🚗" : app.simType === "robot" ? "🦾" : app.simType === "home" ? "🏠" : app.simType === "health" ? "🩺" : app.simType === "drone" ? "🛸" : "🛡️"}</span>
            <strong>${app.name}</strong>
          </div>
        `).join("")}
      </div>

      <div style="display:flex;gap:12px;justify-content:center;margin-top:24px;">
        <button id="review-apps-btn" class="button button-outline" style="font-size:13px;padding:10px 20px;">
          ${icon("refresh-cw")} Review Applications
        </button>
        <button id="goto-reality-btn" class="button button-primary" style="font-size:13px;padding:10px 24px;">
          <span>Proceed to AI Can Make Mistakes (Ch 06)</span>
          ${icon("arrow-right")}
        </button>
      </div>
    </div>
  `;

  document.querySelector("#review-apps-btn")?.addEventListener("click", () => {
    state.appIndex = 0;
    renderApplications();
  });

  document.querySelector("#goto-reality-btn")?.addEventListener("click", () => {
    navigate("reality");
  });

  refreshIcons();
}

function renderReality() {
  const mistakeTestCard = {
    id: "rotten-apple-test",
    label: "Rotten Apple",
    kind: "apple",
    image: "images/rotten_apple.jpg",
    answer: "Banana",
    confidence: 60,
    reasons: [
      "Thin and lengthy, not a typical round apple shape.",
      "Partly it has yellow and brown discoloration matching yellow fruit features.",
      "Lacks the clean, round, red skin patterns found in standard apple training data."
    ]
  };

  content.innerHTML = `
    ${header("CHAPTER 06 // AI MISTAKES", "AI Can Make Mistakes", "Test an unseen mystery fruit to see what your trained AI vision model predicts.", "06")}

    <div class="inspection-layout">
      <section class="inspection-station">
        <div class="inspection-topline">
          <span>${icon("scan-line")} VISION SCANNER</span>
          <small>UNSEEN MYSTERY EXAMPLE</small>
        </div>
        <div class="test-card-tray">
          <button class="test-item-card" draggable="true" data-test-id="${mistakeTestCard.id}" aria-label="Choose mystery fruit">
            ${fruitPhoto(mistakeTestCard.kind, "picnic", mistakeTestCard.image)}
            <small>Drag to scan</small>
          </button>
        </div>
        <button id="ai-scanner" class="ai-scanner" type="button">
          <span id="scanner-visual" class="scanner-empty">
            ${icon("move-down")}
            <b>Drop a mystery fruit here</b>
            <small>or choose a card, then tap this scanner</small>
          </span>
        </button>
        <div class="scanner-action">
          <button id="ask-ai" class="button button-primary" disabled>
            <span>Ask ${state.hero.name} to identify</span>
            ${icon("sparkles")}
          </button>
          <p id="scanner-help">Select or drag a mystery fruit to inspect.</p>
        </div>
      </section>

      <aside class="analysis-panel">
        <p class="kicker">AI EXPLANATION</p>
        <div id="analysis-result" class="analysis-empty">
          ${icon("scan-search")}
          <h3>Waiting for mystery test</h3>
          <p>Choose an unseen fruit card, place it in the scanner, then ask your supervised AI to identify it.</p>
        </div>
        <div class="finding warn">
          ${icon("shield-alert")}
          <span>Supervised AI matches learned patterns against its training cards.</span>
        </div>
      </aside>
    </div>
  `;

  let selectedTestCard = null;
  const scanner = document.querySelector("#ai-scanner");
  const scannerVisual = document.querySelector("#scanner-visual");
  const askButton = document.querySelector("#ask-ai");
  const scannerHelp = document.querySelector("#scanner-help");

  const selectTestCard = (card) => {
    if (!card) return;
    selectedTestCard = card;
    document.querySelectorAll(".test-item-card").forEach((item) => item.classList.toggle("selected", item.dataset.testId === card.id));
    scanner.classList.add("loaded");
    scannerVisual.className = "scanner-preview";
    scannerVisual.innerHTML = `${fruitPhoto(card.kind, "picnic", card.image)}<small>Ready for AI inspection</small>`;
    askButton.disabled = false;
    scannerHelp.textContent = "Mystery example loaded. Ask your AI to inspect it.";
  };

  document.querySelectorAll(".test-item-card").forEach((item) => {
    item.addEventListener("click", () => selectTestCard(mistakeTestCard));
    item.addEventListener("dragstart", (event) => {
      event.dataTransfer.setData("text/plain", item.dataset.testId);
      item.classList.add("dragging");
    });
    item.addEventListener("dragend", () => item.classList.remove("dragging"));
  });

  scanner?.addEventListener("dragover", (event) => {
    event.preventDefault();
    scanner.classList.add("drop-hover");
  });
  scanner?.addEventListener("dragleave", () => scanner.classList.remove("drop-hover"));
  scanner?.addEventListener("drop", (event) => {
    event.preventDefault();
    scanner.classList.remove("drop-hover");
    selectTestCard(mistakeTestCard);
  });
  scanner?.addEventListener("click", () => selectTestCard(selectedTestCard || mistakeTestCard));

  askButton?.addEventListener("click", () => {
    if (!selectedTestCard || askButton.disabled) return;
    askButton.disabled = true;
    scanner.classList.add("scanning");
    const resultBox = document.querySelector("#analysis-result");
    resultBox.className = "analysis-loading";
    resultBox.innerHTML = brainstormMarkup(`${state.hero.name} is inspecting mystery fruit...`, "Comparing color, shape, and stem features with the labeled training examples.");
    refreshIcons();

    window.setTimeout(() => {
      if (!document.body.contains(scanner)) return;
      playWrongSound();
      scanner.classList.remove("scanning");
      const reasonItems = mistakeTestCard.reasons.map((reason) => `<li>${icon("check-circle-2")}<span>${reason}</span></li>`).join("");
      resultBox.className = "analysis-result";
      resultBox.innerHTML = `
        <div class="prediction-banner">
          <span>AI PREDICTION</span>
          <strong>It looks most like a Banana.</strong>
          <b>60% <small>banana match confidence</small></b>
        </div>
        <h3>Why your AI thinks this</h3>
        <ul class="reason-list">${reasonItems}</ul>
        <p class="analysis-note">It compared this new example with the patterns in its labeled training cards.</p>

        <div style="margin-top:18px;padding-top:14px;border-top:1px dashed rgba(67,119,183,0.25);">
          <button id="goto-creator-btn" class="button button-primary" style="width:100%;">
            <span>Extract Nova Intelligence (Ch 07)</span>${icon("arrow-right")}
          </button>
        </div>
      `;
      refreshIcons();
      complete("reality");
      toastMessage("Nova completed an inspection.");

      document.querySelector("#goto-creator-btn")?.addEventListener("click", () => {
        navigate("extract");
      });
    }, 4000);
  });

  refreshIcons();
}

function showFullscreenBrainstorm(onComplete) {
  const modal = document.createElement("div");
  modal.className = "fullscreen-brainstorm-backdrop";
  modal.innerHTML = `
    <div class="brainstorm-big-core">
      🧠
    </div>
    <h2 style="font-family:var(--display);font-size:28px;margin:0 0 12px;color:#ffffff;letter-spacing:0.04em;">
      ⚡ INFUSING AI INTO HOME SURVEILLANCE... ⚡
    </h2>
    <p style="color:#94a3b8;font-size:15px;max-width:540px;margin:0 0 24px;line-height:1.5;">
      Integrating <strong>Computer Vision (Theft Detection)</strong>, <strong>Acoustic AI (Decibel Police Dispatch)</strong>, and <strong>Generative AI (Daily Monitoring Reports)</strong> into your Smart Home!
    </p>
    <div style="display:flex;gap:12px;justify-content:center;">
      <span class="live-status-pill" style="font-size:13px;padding:6px 16px;">
        SYNTHESIZING NEURAL PERIMETER...
      </span>
    </div>
  `;
  document.body.appendChild(modal);
  playEurekaSound();

  window.setTimeout(() => {
    modal.remove();
    if (onComplete) onComplete();
  }, 2200);
}

function renderCyberHomeGraphic(isCctv, isHero, heroName = "STARBYTE", primary = "#ffbd61", glow = "#38bdf8") {
  return `
    <svg viewBox="0 0 400 270" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:480px;height:250px;">
      <defs>
        <linearGradient id="cyberRoofGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1e293b" />
          <stop offset="50%" stop-color="#0f172a" />
          <stop offset="100%" stop-color="#0284c7" />
        </linearGradient>
        <linearGradient id="cyberWallGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1e1b4b" />
          <stop offset="60%" stop-color="#0f172a" />
          <stop offset="100%" stop-color="#1e293b" />
        </linearGradient>
        <linearGradient id="cyberGlassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.85" />
          <stop offset="100%" stop-color="#0284c7" stop-opacity="0.35" />
        </linearGradient>
        <linearGradient id="laserBeamGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.65" />
          <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.02" />
        </linearGradient>
        <filter id="homeGlow">
          <feGaussianBlur stdDeviation="3.5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      <!-- Anti-gravity Ground Perimeter Disc -->
      <ellipse cx="200" cy="245" rx="165" ry="18" fill="rgba(56, 189, 248, 0.12)" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="8,4" />
      <ellipse cx="200" cy="245" rx="90" ry="9" fill="rgba(56, 189, 248, 0.3)" />

      <!-- Left Architectural Wing -->
      <rect x="70" y="125" width="85" height="110" rx="8" fill="url(#cyberWallGrad)" stroke="#334155" stroke-width="1.5" />
      <rect x="82" y="145" width="28" height="42" rx="4" fill="url(#cyberGlassGrad)" stroke="#38bdf8" stroke-width="1.2" />
      <rect x="118" y="145" width="26" height="70" rx="4" fill="url(#cyberGlassGrad)" stroke="#38bdf8" stroke-width="1.2" />

      <!-- Central Main Smart Villa Tower -->
      <rect x="145" y="75" width="125" height="160" rx="10" fill="url(#cyberWallGrad)" stroke="#475569" stroke-width="2" />
      <!-- Solar Angled Overhang Roof -->
      <polygon points="125,75 207,20 290,75" fill="url(#cyberRoofGrad)" stroke="#38bdf8" stroke-width="2.5" />
      <line x1="207" y1="20" x2="207" y2="75" stroke="#38bdf8" stroke-width="1.5" />

      <!-- Main Smart Glass Entry Door -->
      <rect x="185" y="140" width="45" height="95" rx="5" fill="url(#cyberGlassGrad)" stroke="#38bdf8" stroke-width="1.5" />
      <line x1="207" y1="140" x2="207" y2="235" stroke="#38bdf8" stroke-width="1" opacity="0.6" />

      <!-- Upper Balcony Panorama Windows -->
      <rect x="160" y="90" width="95" height="34" rx="4" fill="url(#cyberGlassGrad)" stroke="#38bdf8" stroke-width="1.2" />

      <!-- Right Tech Lab / Automation Wing -->
      <rect x="260" y="135" width="70" height="100" rx="8" fill="url(#cyberWallGrad)" stroke="#334155" stroke-width="1.5" />
      <rect x="272" y="155" width="48" height="65" rx="4" fill="#0f172a" stroke="#0284c7" stroke-width="1.2" />
      <line x1="272" y1="170" x2="320" y2="170" stroke="#38bdf8" stroke-width="1" opacity="0.6" />
      <line x1="272" y1="185" x2="320" y2="185" stroke="#38bdf8" stroke-width="1" opacity="0.6" />
      <line x1="272" y1="200" x2="320" y2="200" stroke="#38bdf8" stroke-width="1" opacity="0.6" />

      <!-- Roof Antenna / Radar Dish -->
      <line x1="207" y1="20" x2="207" y2="5" stroke="#38bdf8" stroke-width="2.5" />
      <circle cx="207" cy="5" r="5" fill="#38bdf8" filter="url(#homeGlow)" />

      <!-- CCTV Camera Component -->
      ${isCctv ? `
        <g filter="url(#homeGlow)">
          <rect x="122" y="64" width="12" height="7" fill="#0f172a" stroke="#38bdf8" stroke-width="1.2" />
          <polygon points="124,70 102,85 114,92 134,75" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5" />
          <circle cx="106" cy="87" r="5" fill="#38bdf8" />
          <circle cx="106" cy="87" r="2.5" fill="#ffffff" />
          <!-- Active Pulsing Laser Sweep Cone -->
          <polygon points="106,87 15,210 135,250" fill="url(#laserBeamGrad)" />
          <line x1="106" y1="87" x2="15" y2="210" stroke="#38bdf8" stroke-width="1.2" stroke-dasharray="4,2" />
          <line x1="106" y1="87" x2="135" y2="250" stroke="#38bdf8" stroke-width="1.2" stroke-dasharray="4,2" />
        </g>
      ` : ""}

      <!-- Hero AI Shield Component -->
      ${isHero ? `
        <g filter="url(#homeGlow)">
          <path d="M 35,240 Q 207,-20 375,240" fill="none" stroke="#fbbf24" stroke-width="2.5" stroke-dasharray="10,5" />
          <circle cx="207" cy="45" r="16" fill="rgba(251,191,36,0.3)" stroke="#fbbf24" stroke-width="2" />
          <text x="207" y="51" font-size="14" font-weight="bold" text-anchor="middle" fill="#fbbf24">⚡</text>
        </g>
      ` : ""}
    </svg>
  `;
}

function stopCreatorSimulations() {
  if (window.activeCarInterval) {
    clearInterval(window.activeCarInterval);
    window.activeCarInterval = null;
  }
  if (window.activeCarKeyHandler) {
    window.removeEventListener("keydown", window.activeCarKeyHandler);
    window.activeCarKeyHandler = null;
  }
  if (window.activeParcelInterval) {
    clearInterval(window.activeParcelInterval);
    window.activeParcelInterval = null;
  }
  stopCarGameSound();
}

function renderCyberCarGraphic(isHero = false, isAi = false, heroName = "STARBYTE", primary = "#ffbd61", glow = "#9effee") {
  return `
    <svg viewBox="0 0 160 260" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;max-width:160px;max-height:260px;">
      <defs>
        <linearGradient id="carGradBody" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${primary}" />
          <stop offset="60%" stop-color="#1e293b" />
          <stop offset="100%" stop-color="#0f172a" />
        </linearGradient>
        <radialGradient id="lidarScanGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${glow}" stop-opacity="0.8" />
          <stop offset="50%" stop-color="#38bdf8" stop-opacity="0.4" />
          <stop offset="100%" stop-color="transparent" stop-opacity="0" />
        </radialGradient>
        <filter id="carNeonGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <!-- LIDAR Laser Scan Cone & Wi-Fi Waves around Car in AI Mode -->
      ${isAi ? `
        <g filter="url(#carNeonGlow)">
          <polygon points="80,90 -40,-60 200,-60" fill="url(#lidarScanGlow)" />
          <line x1="80" y1="90" x2="-40" y2="-60" stroke="${glow}" stroke-width="1.5" stroke-dasharray="6,3" />
          <line x1="80" y1="90" x2="200" y2="-60" stroke="${glow}" stroke-width="1.5" stroke-dasharray="6,3" />
          <line x1="80" y1="90" x2="80" y2="-70" stroke="#38bdf8" stroke-width="2" stroke-dasharray="4,2" />
          <circle cx="80" cy="15" r="45" fill="none" stroke="${glow}" stroke-width="1.5" stroke-dasharray="8,4" />

          <!-- Wi-Fi Waves Around Car (360° Scanning Animation) -->
          <!-- Front Wi-Fi Wave Arcs -->
          <path class="wifi-wave-arc" d="M 52,25 A 32,32 0 0,1 108,25" fill="none" stroke="${glow}" stroke-width="2.5" stroke-linecap="round" />
          <path class="wifi-wave-arc arc-delay-1" d="M 40,8 A 48,48 0 0,1 120,8" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" />
          <path class="wifi-wave-arc arc-delay-2" d="M 26,-10 A 64,64 0 0,1 134,-10" fill="none" stroke="${glow}" stroke-width="2" stroke-linecap="round" stroke-dasharray="6,3" />

          <!-- Left Side Wi-Fi Wave Arcs -->
          <path class="wifi-wave-arc arc-delay-1" d="M 12,85 A 40,40 0 0,0 12,175" fill="none" stroke="#38bdf8" stroke-width="2.2" stroke-linecap="round" />
          <path class="wifi-wave-arc arc-delay-3" d="M -5,70 A 62,62 0 0,0 -5,190" fill="none" stroke="${glow}" stroke-width="2" stroke-linecap="round" stroke-dasharray="6,3" />

          <!-- Right Side Wi-Fi Wave Arcs -->
          <path class="wifi-wave-arc arc-delay-1" d="M 148,85 A 40,40 0 0,1 148,175" fill="none" stroke="#38bdf8" stroke-width="2.2" stroke-linecap="round" />
          <path class="wifi-wave-arc arc-delay-3" d="M 165,70 A 62,62 0 0,1 165,190" fill="none" stroke="${glow}" stroke-width="2" stroke-linecap="round" stroke-dasharray="6,3" />

          <!-- Rear Wi-Fi Wave Arcs -->
          <path class="wifi-wave-arc arc-delay-2" d="M 52,245 A 32,32 0 0,0 108,245" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" />
        </g>
      ` : ""}

      <!-- Headlight Beams -->
      <polygon points="35,65 15,-20 55,-20" fill="rgba(254, 240, 138, 0.35)" filter="url(#carNeonGlow)" />
      <polygon points="125,65 105,-20 145,-20" fill="rgba(254, 240, 138, 0.35)" filter="url(#carNeonGlow)" />

      <!-- Tires -->
      <rect x="12" y="45" width="16" height="38" rx="6" fill="#090d16" stroke="${glow}" stroke-width="1.5" />
      <rect x="132" y="45" width="16" height="38" rx="6" fill="#090d16" stroke="${glow}" stroke-width="1.5" />
      <rect x="12" y="165" width="16" height="38" rx="6" fill="#090d16" stroke="${glow}" stroke-width="1.5" />
      <rect x="132" y="165" width="16" height="38" rx="6" fill="#090d16" stroke="${glow}" stroke-width="1.5" />

      <!-- Main Chassis -->
      <path d="M 40,60 Q 80,40 120,60 L 132,115 Q 138,185 120,220 Q 80,235 40,220 Q 22,185 28,115 Z" fill="url(#carGradBody)" stroke="${primary}" stroke-width="2.5" />

      <!-- Side Mirrors -->
      <rect x="18" y="90" width="12" height="6" rx="2" fill="${primary}" />
      <rect x="130" y="90" width="12" height="6" rx="2" fill="${primary}" />

      <!-- Windshield -->
      <path d="M 45,90 Q 80,78 115,90 L 110,130 Q 80,137 50,130 Z" fill="#070d1e" stroke="#38bdf8" stroke-width="1.5" />

      <!-- Roof & Rear Glass -->
      <path d="M 52,137 Q 80,133 108,137 L 104,180 Q 80,187 56,180 Z" fill="rgba(15, 23, 42, 0.9)" stroke="rgba(255,255,255,0.2)" stroke-width="1" />

      <!-- Taillights -->
      <rect x="36" y="217" width="28" height="6" rx="3" fill="#ef4444" filter="url(#carNeonGlow)" />
      <rect x="96" y="217" width="28" height="6" rx="3" fill="#ef4444" filter="url(#carNeonGlow)" />

      <!-- Hero AI Core Crest / Dome -->
      ${isHero ? `
        <g filter="url(#carNeonGlow)">
          <circle cx="80" cy="135" r="22" fill="#0f172a" stroke="${primary}" stroke-width="2" />
          <circle cx="80" cy="135" r="16" fill="rgba(251,191,36,0.3)" stroke="#fbbf24" stroke-width="2" />
          <text x="80" y="141" font-size="16" font-weight="bold" text-anchor="middle" fill="#fbbf24">⚡</text>
          <circle cx="80" cy="135" r="26" fill="none" stroke="${glow}" stroke-width="1.5" stroke-dasharray="6,3" />
        </g>
      ` : ""}
    </svg>
  `;
}

function renderTrafficCarGraphic(type = "truck") {
  const configs = {
    truck: { color: "#ef4444", secondary: "#991b1b", label: "Truck" },
    taxi: { color: "#f59e0b", secondary: "#b45309", label: "Taxi" },
    sports: { color: "#8b5cf6", secondary: "#5b21b6", label: "Racer" }
  };
  const cfg = configs[type] || configs.truck;
  return `
    <svg viewBox="0 0 160 260" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;transform:rotate(180deg);">
      <rect x="14" y="45" width="16" height="34" rx="5" fill="#0f172a" />
      <rect x="130" y="45" width="16" height="34" rx="5" fill="#0f172a" />
      <rect x="14" y="175" width="16" height="34" rx="5" fill="#0f172a" />
      <rect x="130" y="175" width="16" height="34" rx="5" fill="#0f172a" />
      <path d="M 40,55 Q 80,40 120,55 L 130,190 Q 80,225 30,190 Z" fill="${cfg.color}" stroke="${cfg.secondary}" stroke-width="3" />
      <path d="M 48,85 Q 80,72 112,85 L 106,125 Q 80,132 54,125 Z" fill="#1e293b" stroke="#ffffff" stroke-width="1.5" />
      <rect x="36" y="44" width="22" height="6" rx="2" fill="#fef08a" />
      <rect x="102" y="44" width="22" height="6" rx="2" fill="#fef08a" />
    </svg>
  `;
}
function renderCyberRoboticArmGraphic(isHero = false, isAi = false, heroName = "STARBYTE", primary = "#ffbd61", glow = "#9effee", armAngle = 0) {
  return `
    <svg viewBox="0 0 300 240" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;transform-origin:150px 30px;transform:rotate(${armAngle}deg);transition:transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);">
      <defs>
        <linearGradient id="armMetalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${primary}" />
          <stop offset="50%" stop-color="#334155" />
          <stop offset="100%" stop-color="#0f172a" />
        </linearGradient>
        <radialGradient id="laserScanBeam" cx="50%" cy="0%" r="100%">
          <stop offset="0%" stop-color="${glow}" stop-opacity="0.8" />
          <stop offset="60%" stop-color="#38bdf8" stop-opacity="0.3" />
          <stop offset="100%" stop-color="transparent" stop-opacity="0" />
        </radialGradient>
        <filter id="armGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <!-- Laser Scanner Beam projecting down to conveyor -->
      ${isAi ? `
        <polygon points="150,155 90,240 210,240" fill="url(#laserScanBeam)" />
        <line x1="150" y1="155" x2="150" y2="240" stroke="#38bdf8" stroke-width="2" stroke-dasharray="4,2" filter="url(#armGlow)" />
        <line x1="150" y1="155" x2="90" y2="240" stroke="${glow}" stroke-width="1.2" stroke-dasharray="6,3" />
        <line x1="150" y1="155" x2="210" y2="240" stroke="${glow}" stroke-width="1.2" stroke-dasharray="6,3" />
      ` : ""}

      <!-- Base Mount Disc -->
      <ellipse cx="150" cy="25" rx="45" ry="14" fill="#0f172a" stroke="${primary}" stroke-width="2.5" />
      <ellipse cx="150" cy="25" rx="28" ry="8" fill="url(#armMetalGrad)" />

      <!-- Upper Shoulder Joint -->
      <circle cx="150" cy="45" r="18" fill="#1e293b" stroke="${glow}" stroke-width="2" />

      <!-- Upper Arm Link -->
      <rect x="142" y="45" width="16" height="65" rx="8" fill="url(#armMetalGrad)" stroke="${primary}" stroke-width="1.5" />

      <!-- Elbow Joint -->
      <circle cx="150" cy="110" r="14" fill="#0f172a" stroke="${glow}" stroke-width="2" />

      <!-- Lower Arm Link / Wrist Extension -->
      <rect x="144" y="110" width="12" height="45" rx="6" fill="#334155" stroke="${glow}" stroke-width="1.5" />

      <!-- Gripper Mechanical Claw -->
      <g filter="url(#armGlow)">
        <!-- Wrist Housing -->
        <rect x="135" y="152" width="30" height="14" rx="4" fill="#0f172a" stroke="${primary}" stroke-width="1.5" />
        <!-- Left Finger Claw -->
        <path d="M 138,166 L 125,188 L 132,192 L 142,166 Z" fill="${primary}" stroke="#ffffff" stroke-width="1" />
        <!-- Right Finger Claw -->
        <path d="M 162,166 L 175,188 L 168,192 L 158,166 Z" fill="${primary}" stroke="#ffffff" stroke-width="1" />
        <!-- Optic Scanner Lens -->
        <circle cx="150" cy="159" r="4" fill="#38bdf8" />
        <circle cx="150" cy="159" r="2" fill="#ffffff" />
      </g>

      <!-- Superhero AI Core Crest mounted on arm base -->
      ${isHero ? `
        <g filter="url(#armGlow)">
          <circle cx="150" cy="25" r="16" fill="#0f172a" stroke="${primary}" stroke-width="2" />
          <circle cx="150" cy="25" r="12" fill="rgba(251,191,36,0.3)" stroke="#fbbf24" stroke-width="1.5" />
          <text x="150" y="30" font-size="12" font-weight="bold" text-anchor="middle" fill="#fbbf24">⚡</text>
        </g>
      ` : ""}
    </svg>
  `;
}

function renderCreator() {
  stopCreatorSimulations();
  if (state.creatorSubStage === "car") {
    renderCreatorCarLab();
    return;
  }
  if (state.creatorSubStage === "parcel") {
    renderCreatorParcelLab();
    return;
  }

  const isCctvAttached = state.creatorCctvAttached || false;
  const isHeroAttached = state.creatorHeroAttached || false;
  const isActive = state.creatorStage === "active";

  const subtabsMarkup = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:10px;">
      <div class="creator-subtabs">
        <button class="creator-subtab active" id="tab-home-surveillance">
          ${icon("home")} 01 // Home Surveillance
        </button>
        <button class="creator-subtab" id="tab-self-driving">
          ${icon("car")} 02 // Self Driving Car
        </button>
        <button class="creator-subtab" id="tab-parcel-sorter">
          ${icon("bot")} 03 // Parcel Sorter
        </button>
      </div>
    </div>
  `;

  if (isActive) {
    content.innerHTML = `
      ${header("CHAPTER 07 // CREATOR LAB", "AI Home Surveillance Active!", "Your superhero is now integrated into smart home surveillance with automated detection and generative reports.", "07")}
      ${subtabsMarkup}

      <!-- Live Header Banner -->
      <div class="dashboard-header-banner">
        <h3>${icon("shield-check")} Advanced AI Home Surveillance System // Active</h3>
        <span class="live-status-pill">LIVE SCANNING ACTIVE</span>
      </div>

      <div class="surveillance-active-layout">
        <!-- Left Column: Large Cyber Home Stage -->
        <section class="home-cyber-stage" style="justify-content:space-between;">
          <div style="width:100%;text-align:left;">
            <span style="font-size:11px;font-weight:800;letter-spacing:0.08em;color:#38bdf8;background:rgba(56,189,248,0.15);padding:3px 10px;border-radius:20px;border:1px solid rgba(56,189,248,0.3);">
              ● 24/7 AUTONOMOUS PROTECTION
            </span>
          </div>

          <div class="cyber-home-canvas" style="margin:16px 0;">
            ${renderCyberHomeGraphic(true, true, state.hero.name, state.hero.primary, state.hero.glow)}
          </div>

          <div style="width:100%;display:flex;justify-content:space-between;align-items:center;border-top:1px dashed rgba(255,255,255,0.15);padding-top:12px;margin-top:auto;">
            <span style="font-size:12px;color:#94a3b8;">
              Core: <strong style="color:#fbbf24;">${state.hero.name}</strong> // CCTV Online
            </span>
            <button id="reset-surveillance-btn" class="button button-outline" style="font-size:11px;padding:6px 14px;background:rgba(255,255,255,0.08);border-color:rgba(255,255,255,0.25);color:#ffffff;">
              ${icon("refresh-cw")} Reconfigure
            </button>
          </div>
        </section>

        <!-- Right Column: 3 Vertical Feature Cards Stacked -->
        <aside class="surveillance-vertical-cards">
          <!-- 1. Suspicious Activity / Theft Detection -->
          <div class="surveillance-feature-card card-theft">
            <div>
              <div class="feature-top-badge">
                ${icon("scan-search")} 01 // COMPUTER VISION
              </div>
              <h4>Suspicious Activity & Theft Detection</h4>
              <p>
                Continuous visual scanning detects unauthorized intruders, thefts, suspicious movements, and perimeter breaches in real time.
              </p>
            </div>
            <div class="feature-action-box">
              <span>🚨</span>
              <strong>Instant Intruder Lock Active</strong>
            </div>
          </div>

          <!-- 2. High Decibel / Explosion Audio Detection -->
          <div class="surveillance-feature-card card-sound">
            <div>
              <div class="feature-top-badge">
                ${icon("volume-2")} 02 // ACOUSTIC AI
              </div>
              <h4>High-Decibel & Explosion Sound Alert</h4>
              <p>
                Audio frequency sensors detect sudden high-decibel sounds like glass shattering or explosions, and immediately send an automated emergency dispatch alert to the police station.
              </p>
            </div>
            <div class="feature-action-box">
              <span>🚔</span>
              <strong>Police Station Dispatch Alert Linked</strong>
            </div>
          </div>

          <!-- 3. Daily Monitoring Report Generator -->
          <div class="surveillance-feature-card card-report">
            <div>
              <div class="feature-top-badge">
                ${icon("file-text")} 03 // GENERATIVE AI
              </div>
              <h4>Daily Monitoring Report Generator</h4>
              <p>
                Generative AI analyzes and summarizes all events recorded on camera throughout the 24-hour cycle, delivering a clean security digest directly to the homeowner.
              </p>
            </div>
            <div class="feature-action-box">
              <span>📄</span>
              <strong>Daily Owner Security Digest Generated</strong>
            </div>
          </div>

          <div style="display:flex;gap:8px;margin-top:4px;">
            <button id="goto-car-lab-btn" class="button button-primary" style="flex:1;padding:10px;font-size:11px;background:linear-gradient(135deg,#0284c7,#4f46e5);">
              <span>Self-Driving Car ${icon("arrow-right")}</span>
            </button>
            <button id="goto-parcel-lab-btn" class="button button-primary" style="flex:1;padding:10px;font-size:11px;background:linear-gradient(135deg,#f59e0b,#ef4444);">
              <span>Robotic Sorter ${icon("arrow-right")}</span>
            </button>
          </div>
        </aside>
      </div>
    `;

    document.querySelector("#tab-self-driving")?.addEventListener("click", () => { state.creatorSubStage = "car"; state.carMode = "select"; persistProgress(); renderCreator(); });
    document.querySelector("#tab-parcel-sorter")?.addEventListener("click", () => { state.creatorSubStage = "parcel"; state.parcelMode = "select"; persistProgress(); renderCreator(); });

    document.querySelector("#reset-surveillance-btn")?.addEventListener("click", () => {
      state.creatorStage = "setup";
      state.creatorCctvAttached = false;
      state.creatorHeroAttached = false;
      persistProgress();
      renderCreator();
    });

    document.querySelector("#goto-car-lab-btn")?.addEventListener("click", () => {
      state.creatorSubStage = "car";
      state.carMode = "select";
      persistProgress();
      renderCreator();
    });

    document.querySelector("#goto-parcel-lab-btn")?.addEventListener("click", () => {
      state.creatorSubStage = "parcel";
      state.parcelMode = "select";
      persistProgress();
      renderCreator();
    });

    refreshIcons();
    return;
  }

  // Setup / Interactive Drag & Drop Stage
  content.innerHTML = `
    ${header("CHAPTER 07 // CREATOR LAB", "AI Home Surveillance Creator", "Drag CCTV and your AI Superhero into the Home to activate autonomous smart surveillance!", "07")}
    ${subtabsMarkup}

    <div class="surveillance-layout">
      <!-- Left: Toolbox of components to drag -->
      <aside class="surveillance-toolbox">
        <h3>${icon("wrench")} Hardware & AI Core</h3>
        <p style="margin:0;font-size:12px;color:#64748b;line-height:1.45;">
          Drag components into the Home to assemble your AI surveillance system:
        </p>

        <!-- 1. CCTV Camera Item -->
        <div class="surveillance-item-card ${isCctvAttached ? "used" : ""}" draggable="${!isCctvAttached}" data-item="cctv" id="drag-cctv">
          <div class="surveillance-item-icon" style="background:#e0f2fe;color:#0284c7;">
            📹
          </div>
          <div class="surveillance-item-info">
            <strong>Smart CCTV Camera</strong>
            <small>${isCctvAttached ? "✅ Mounted on Home" : "Step 1: Drag to Home"}</small>
          </div>
        </div>

        <!-- 2. Extracted Nova Intelligence Core -->
        <div class="surveillance-item-card ${isHeroAttached ? "used" : (!isCctvAttached ? "disabled-card" : "")}" draggable="${isCctvAttached && !isHeroAttached}" data-item="hero" id="drag-hero" style="${!isCctvAttached ? "opacity:0.5;cursor:not-allowed;" : ""}">
          <div class="surveillance-item-icon" style="background:#fef3c7;color:#b45309;">
            ⚡
          </div>
          <div class="surveillance-item-info">
            <strong>Nova Intelligence Core</strong>
            <small>${isHeroAttached ? "✅ Infused into System" : isCctvAttached ? "Step 2: Drag the extracted core to Home" : "Mount CCTV first"}</small>
          </div>
        </div>

        <div class="finding" style="font-size:11px;padding:10px 12px;margin-top:auto;">
          ${icon("sparkles")}
          <span>Infusing ${state.hero.name} combines Computer Vision, Sound NLP, and Generative Summaries.</span>
        </div>
      </aside>

      <!-- Right: Central High-End Cyber Home Drop Stage -->
      <section class="home-cyber-stage" id="home-dropzone">
        <h3 style="margin:0 0 2px;font-family:var(--display);font-size:17px;color:#ffffff;">
          Smart Home Cyber Perimeter
        </h3>
        <p style="margin:0 0 6px;font-size:12px;color:#94a3b8;">
          ${!isCctvAttached ? "Step 1: Drag or click CCTV camera into the house." : "Step 2: Drag or click " + state.hero.name + " into the house to infuse AI powers!"}
        </p>

        <div class="cyber-home-canvas">
          ${renderCyberHomeGraphic(isCctvAttached, isHeroAttached, state.hero.name, state.hero.primary, state.hero.glow)}
        </div>

        <div class="home-drop-instructions">
          ${icon("move-down")}
          <span>
            ${!isCctvAttached ? "<strong>Drag Smart CCTV Camera here</strong> or tap card" : "<strong>Now drag " + state.hero.name + " here</strong> or tap card"}
          </span>
        </div>
      </section>
    </div>
  `;

  document.querySelector("#tab-self-driving")?.addEventListener("click", () => { state.creatorSubStage = "car"; state.carMode = "select"; persistProgress(); renderCreator(); });
  document.querySelector("#tab-parcel-sorter")?.addEventListener("click", () => { state.creatorSubStage = "parcel"; state.parcelMode = "select"; persistProgress(); renderCreator(); });

  const dropzone = document.querySelector("#home-dropzone");
  const cctvCard = document.querySelector("#drag-cctv");
  const heroCard = document.querySelector("#drag-hero");

  const attachCctv = () => {
    if (state.creatorCctvAttached) return;
    state.creatorCctvAttached = true;
    persistProgress();
    playEurekaSound();
    toastMessage("📹 Smart CCTV Camera mounted! Now drag the Nova Intelligence Core into the home.", true);
    renderCreator();
  };

  const attachHero = () => {
    if (!state.creatorCctvAttached || state.creatorHeroAttached) return;
    state.creatorHeroAttached = true;
    state.creatorStage = "active";
    persistProgress();
    complete("creator");
    playFantasySound();
    toastMessage("🏠 AI Home Surveillance is Ready", true);
    renderCreator();
  };

  // Drag events
  cctvCard?.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("text/plain", "cctv");
    cctvCard.classList.add("dragging");
  });
  cctvCard?.addEventListener("dragend", () => cctvCard.classList.remove("dragging"));
  cctvCard?.addEventListener("click", attachCctv);

  heroCard?.addEventListener("dragstart", (e) => {
    if (!state.creatorCctvAttached) return;
    e.dataTransfer.setData("text/plain", "hero");
    heroCard.classList.add("dragging");
  });
  heroCard?.addEventListener("dragend", () => heroCard?.classList.remove("dragging"));
  heroCard?.addEventListener("click", () => {
    if (state.creatorCctvAttached) attachHero();
  });

  // Dropzone listeners
  dropzone?.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("drop-hover");
  });
  dropzone?.addEventListener("dragleave", () => dropzone.classList.remove("drop-hover"));
  dropzone?.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("drop-hover");
    const item = e.dataTransfer.getData("text/plain");
    if (item === "cctv") {
      attachCctv();
    } else if (item === "hero" && state.creatorCctvAttached) {
      attachHero();
    }
  });

  refreshIcons();
}

function renderExtract() {
  const extracted = Boolean(state.intelligenceExtracted);
  content.innerHTML = `
    ${header("CHAPTER 07 // EXTRACT INTELLIGENCE", "Transfer Nova's learned intelligence.", "Nova has learned to recognize images, listen for sound patterns, and create content. Extract those learned skills into a portable Intelligence Core for the Creator Lab.", "07")}
    <section class="intelligence-extraction-stage ${extracted ? "core-extracted" : ""}">
      <div class="extract-grid"></div>
      <div class="intelligence-data-stream" aria-hidden="true">
        <i>👓</i><i>📶</i><i>✨</i><i>✦</i><i>◈</i><i>⌁</i>
      </div>
      <div class="extract-nova-wrap">
        ${renderRoboAvatar(state.hero.primary, state.hero.secondary, state.hero.glow, "NOVA", 4)}
        <span class="extract-label">MEGA NOVA // ALL SKILLS READY</span>
      </div>
      <div class="extract-beam"><span></span><b>SKILL TRANSFER</b></div>
      <div class="intelligence-core-unit ${extracted ? "ready" : ""}" id="intelligence-core-unit">
        <div class="core-shell"><div class="core-light">✦</div></div>
        <strong>NOVA INTELLIGENCE CORE</strong>
        <small>${extracted ? "READY FOR CREATOR LAB" : "WAITING FOR EXTRACTION"}</small>
      </div>
    </section>
    <section class="extract-skill-list"><span>👓 Image Recognition</span><span>📶 Sound Pattern Listening</span><span>✨ Content Creation</span></section>
    <button id="extract-intelligence-btn" class="button button-primary extract-button" ${extracted ? "disabled" : ""}>
      <span>${extracted ? "Nova Intelligence Core Extracted" : "Extract Nova Intelligence"}</span>${icon(extracted ? "badge-check" : "zap")}
    </button>
    ${extracted ? `<button id="goto-creator-from-extract" class="button button-outline extract-continue"><span>Use Nova Intelligence Core in Creator Lab</span>${icon("arrow-right")}</button>` : ""}
  `;
  document.querySelector("#extract-intelligence-btn")?.addEventListener("click", (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    button.innerHTML = `<span>Extracting Nova's learned skills...</span>${icon("loader-circle")}`;
    refreshIcons();
    const stage = document.querySelector(".intelligence-extraction-stage");
    stage?.classList.add("extracting", "extract-charge");
    setTimeout(() => stage?.classList.replace("extract-charge", "extract-stream"), 700);
    setTimeout(() => stage?.classList.replace("extract-stream", "extract-lock"), 2700);
    setTimeout(() => {
      state.intelligenceExtracted = true;
      complete("extract");
      persistProgress();
      playEurekaSound();
      toastMessage("✦ Nova Intelligence Core is ready for Creator Lab!", true);
      renderExtract();
    }, 4000);
  });
  document.querySelector("#goto-creator-from-extract")?.addEventListener("click", () => navigate("creator"));
  refreshIcons();
}

function renderCreatorCarLab() {
  stopCreatorSimulations();
  state.carMode = state.carMode || "select";
  const heroName = state.hero.name || "STARBYTE";
  const isHeroAttached = state.carHeroAttached || false;

  const headerMarkup = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:10px;">
      <div class="creator-subtabs">
        <button class="creator-subtab" id="tab-home-surveillance">
          ${icon("home")} 01 // Home Surveillance
        </button>
        <button class="creator-subtab active" id="tab-self-driving">
          ${icon("car")} 02 // Self Driving Car
        </button>
        <button class="creator-subtab" id="tab-parcel-sorter">
          ${icon("bot")} 03 // Parcel Sorter
        </button>
      </div>
      ${state.carMode !== "select" ? `
        <button id="car-mode-select-btn" class="button button-outline" style="font-size:11px;padding:6px 14px;">
          ${icon("arrow-left")} Back to Mode Options
        </button>
      ` : ""}
    </div>
  `;

  // Mode 1: Selection screen
  if (state.carMode === "select") {
    content.innerHTML = `
      ${header("CHAPTER 07 (PART 2) // CREATOR LAB 2.0", "Self Driving Car Creator", "Choose Manual Driving (Keyboard Arrow Controls) or Self Driving AI (Autonomous LIDAR Steering)!", "07")}
      ${headerMarkup}

      <div class="car-mode-grid">
        <!-- Card 1: Manual Driving Car -->
        <div class="car-mode-card">
          <div>
            <span class="mode-badge manual-badge">01 // HUMAN CONTROL</span>
            <h3 style="margin:0 0 8px;font-size:18px;color:#0f172a;">🕹️ Manual Driving Car</h3>
            <p style="font-size:13px;color:#475569;line-height:1.5;margin-bottom:16px;">
              Drive the cyber car manually on the highway! Use your laptop keyboard <strong>Left (←)</strong> and <strong>Right (→)</strong> arrow keys to steer between 3 lanes and bypass oncoming traffic.
            </p>
          </div>
          <div style="margin-top:16px;">
            <button id="start-manual-car-btn" class="button button-primary" style="width:100%;">
              <span>Launch Manual Driver</span>
              ${icon("gamepad-2")}
            </button>
          </div>
        </div>

        <!-- Card 2: Self Driving Car (AI Mode) -->
        <div class="car-mode-card ai-card">
          <div>
            <span class="mode-badge ai-badge">02 // AUTONOMOUS AI</span>
            <h3 style="margin:0 0 8px;font-size:18px;color:#ffffff;">🤖 Self Driving Car (AI Mode)</h3>
            <p style="font-size:13px;color:#94a3b8;line-height:1.5;margin-bottom:16px;">
              Drag your trained Superhero AI <strong>${heroName}</strong> onto the car! Once activated, the AI uses real-time <strong>Computer Vision & LIDAR radar</strong> to automatically steer left and right on its own to bypass vehicles cleanly!
            </p>
          </div>
          <div style="margin-top:16px;">
            <button id="start-ai-car-btn" class="button button-primary" style="width:100%;background:linear-gradient(135deg,#f59e0b,#ef4444);">
              <span>Launch Self-Driving AI Lab</span>
              ${icon("sparkles")}
            </button>
          </div>
        </div>
      </div>
    `;

    document.querySelector("#tab-home-surveillance")?.addEventListener("click", () => { state.creatorSubStage = "home"; renderCreator(); });
    document.querySelector("#tab-parcel-sorter")?.addEventListener("click", () => { state.creatorSubStage = "parcel"; state.parcelMode = "select"; renderCreator(); });
    document.querySelector("#start-manual-car-btn")?.addEventListener("click", () => { state.carMode = "manual"; renderCreatorCarLab(); });
    document.querySelector("#start-ai-car-btn")?.addEventListener("click", () => { state.carMode = isHeroAttached ? "self_driving" : "self_setup"; renderCreatorCarLab(); });

    refreshIcons();
    return;
  }

  // Mode 2: Manual Driving Mode
  if (state.carMode === "manual") {
    playCarGameSound();
    let playerLane = 1; // 0: Left (16%), 1: Center (50%), 2: Right (84%)
    let bypassedCount = 0;
    let traffic = [
      { id: 1, lane: 0, top: -120, speed: 4, type: "truck" },
      { id: 2, lane: 2, top: -320, speed: 5, type: "taxi" }
    ];

    content.innerHTML = `
      ${header("CHAPTER 07 (PART 2) // MANUAL DRIVER", "Manual Keyboard Steering Mode", "Use your laptop keyboard LEFT (←) & RIGHT (→) arrow keys to steer and bypass traffic!", "07")}
      ${headerMarkup}

      <!-- Telemetry HUD -->
      <div class="driving-hud">
        <div style="display:flex;align-items:center;gap:12px;">
          <span class="telemetry-pill manual-pill">🕹️ HUMAN MANUAL CONTROL</span>
          <span class="keyboard-keys-indicator">
            <span class="key-cap">← LEFT</span>
            <span class="key-cap">RIGHT →</span>
            <span>Keyboard Keys Active</span>
          </span>
        </div>
        <div style="font-size:14px;font-weight:800;color:#fbbf24;">
          🚗 Bypassed: <span id="car-bypassed-count">0</span> Vehicles
        </div>
      </div>

      <!-- Highway Canvas -->
      <div class="highway-stage" id="highway-canvas">
        <div class="road-surface">
          <div class="road-lane-line"></div>
          <div class="road-lane-line"></div>
        </div>

        <!-- Player Car -->
        <div id="player-car-element" class="road-vehicle" style="left:50%;bottom:20px;transform:translateX(-50%);">
          ${renderCyberCarGraphic(false, false, heroName, state.hero.primary, state.hero.glow)}
        </div>

        <!-- Traffic Container -->
        <div id="traffic-container"></div>
      </div>

      <!-- On-screen Touch/Click Control buttons -->
      <div style="display:flex;justify-content:center;gap:14px;margin-top:14px;">
        <button id="btn-manual-left" class="button button-outline" style="flex:1;max-width:220px;">
          ◀ Steer Left (← Key)
        </button>
        <button id="btn-manual-right" class="button button-outline" style="flex:1;max-width:220px;">
          Steer Right (→ Key) ▶
        </button>
      </div>

      <!-- Bottom Actions -->
      <div style="display:flex;justify-content:space-between;margin-top:16px;border-top:1px dashed rgba(255,255,255,0.15);padding-top:14px;">
        <button id="switch-to-ai-mode-btn" class="button button-primary" style="background:linear-gradient(135deg,#f59e0b,#ef4444);">
          <span>Switch to Self-Driving AI Mode</span>
          ${icon("sparkles")}
        </button>
        <button id="back-select-btn" class="button button-outline">
          ↩ Mode Options
        </button>
      </div>
    `;

    const lanePos = ["16%", "50%", "84%"];
    const playerEl = document.querySelector("#player-car-element");
    const trafficContainer = document.querySelector("#traffic-container");

    const updatePlayerPos = () => { if (playerEl) playerEl.style.left = lanePos[playerLane]; };
    const steerLeft = () => { if (playerLane > 0) { playerLane--; updatePlayerPos(); } };
    const steerRight = () => { if (playerLane < 2) { playerLane++; updatePlayerPos(); } };

    const keyHandler = (e) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") steerLeft();
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") steerRight();
    };
    window.addEventListener("keydown", keyHandler);
    window.activeCarKeyHandler = keyHandler;

    document.querySelector("#btn-manual-left")?.addEventListener("click", steerLeft);
    document.querySelector("#btn-manual-right")?.addEventListener("click", steerRight);
    document.querySelector("#car-mode-select-btn")?.addEventListener("click", () => { state.carMode = "select"; renderCreatorCarLab(); });
    document.querySelector("#back-select-btn")?.addEventListener("click", () => { state.carMode = "select"; renderCreatorCarLab(); });
    document.querySelector("#switch-to-ai-mode-btn")?.addEventListener("click", () => { state.carMode = isHeroAttached ? "self_driving" : "self_setup"; renderCreatorCarLab(); });
    document.querySelector("#tab-home-surveillance")?.addEventListener("click", () => { state.creatorSubStage = "home"; renderCreator(); });
    document.querySelector("#tab-parcel-sorter")?.addEventListener("click", () => { state.creatorSubStage = "parcel"; state.parcelMode = "select"; renderCreator(); });

    window.activeCarInterval = setInterval(() => {
      if (!document.body.contains(playerEl)) { stopCreatorSimulations(); return; }
      traffic.forEach((car) => {
        car.top += car.speed;
        if (car.top > 420) {
          car.top = -120;
          car.lane = Math.floor(Math.random() * 3);
          car.type = ["truck", "taxi", "sports"][Math.floor(Math.random() * 3)];
          bypassedCount++;
          const countEl = document.querySelector("#car-bypassed-count");
          if (countEl) countEl.textContent = bypassedCount;
        }
      });
      if (trafficContainer) {
        trafficContainer.innerHTML = traffic.map((car) => `
          <div class="traffic-vehicle" style="left:${lanePos[car.lane]};top:${car.top}px;transform:translateX(-50%);">
            ${renderTrafficCarGraphic(car.type)}
          </div>
        `).join("");
      }
    }, 40);

    refreshIcons();
    return;
  }

  // Mode 3: Self-Driving Setup
  if (state.carMode === "self_setup") {
    content.innerHTML = `
      ${header("CHAPTER 07 (PART 2) // AI SETUP", "Equip Superhero AI Core", "Drag your trained Superhero AI onto the Cyber Car to enable Autonomous LIDAR Drive!", "07")}
      ${headerMarkup}

      <div class="surveillance-layout">
        <aside class="surveillance-toolbox">
          <h3>${icon("wrench")} AI Core Module</h3>
          <p style="margin:0;font-size:12px;color:#64748b;line-height:1.45;">
            Drag your superhero into the car stage to infuse AI Computer Vision & LIDAR:
          </p>

          <div class="surveillance-item-card ${isHeroAttached ? "used" : ""}" draggable="${!isHeroAttached}" id="drag-car-hero">
            <div class="surveillance-item-icon" style="background:#fef3c7;color:#b45309;">⚡</div>
            <div class="surveillance-item-info">
              <strong>${heroName} (AI Core)</strong>
              <small>${isHeroAttached ? "✅ Installed on Cyber Car" : "Drag to Cyber Car"}</small>
            </div>
          </div>
        </aside>

        <section class="home-cyber-stage" id="car-dropzone">
          <h3 style="margin:0 0 2px;font-family:var(--display);font-size:17px;color:#ffffff;">
            Autonomous Cyber Car Workshop
          </h3>
          <p style="margin:0 0 6px;font-size:12px;color:#94a3b8;">
            ${isHeroAttached ? "✅ Superhero AI Neural Core Installed!" : "Drag or tap " + heroName + " into the car below."}
          </p>

          <div style="width:160px;height:240px;margin:16px 0;">
            ${renderCyberCarGraphic(isHeroAttached, isHeroAttached, heroName, state.hero.primary, state.hero.glow)}
          </div>

          <div class="home-drop-instructions">
            ${isHeroAttached ? `
              <button id="launch-autonomous-drive-btn" class="button button-primary" style="padding:12px 24px;font-size:14px;background:linear-gradient(135deg,#f59e0b,#ef4444);">
                <span>🚀 Start Autonomous AI Drive</span>
              </button>
            ` : `
              ${icon("move-down")}
              <span><strong>Drag ${heroName} here</strong> or tap card to install AI</span>
            `}
          </div>
        </section>
      </div>
    `;

    const attachHeroToCar = () => {
      if (state.carHeroAttached) return;
      state.carHeroAttached = true;
      persistProgress();
      playEurekaSound();
      toastMessage(`⚡ ${heroName} AI Core infused into Cyber Car!`, true);
      state.carMode = "self_driving";
      renderCreatorCarLab();
    };

    const heroCard = document.querySelector("#drag-car-hero");
    heroCard?.addEventListener("dragstart", (e) => { e.dataTransfer.setData("text/plain", "car-hero"); });
    heroCard?.addEventListener("click", attachHeroToCar);

    const carDrop = document.querySelector("#car-dropzone");
    carDrop?.addEventListener("dragover", (e) => { e.preventDefault(); carDrop.classList.add("drop-hover"); });
    carDrop?.addEventListener("dragleave", () => carDrop.classList.remove("drop-hover"));
    carDrop?.addEventListener("drop", (e) => { e.preventDefault(); carDrop.classList.remove("drop-hover"); attachHeroToCar(); });

    document.querySelector("#launch-autonomous-drive-btn")?.addEventListener("click", () => { state.carMode = "self_driving"; renderCreatorCarLab(); });
    document.querySelector("#tab-home-surveillance")?.addEventListener("click", () => { state.creatorSubStage = "home"; renderCreator(); });
    document.querySelector("#tab-parcel-sorter")?.addEventListener("click", () => { state.creatorSubStage = "parcel"; state.parcelMode = "select"; renderCreator(); });
    document.querySelector("#car-mode-select-btn")?.addEventListener("click", () => { state.carMode = "select"; renderCreatorCarLab(); });

    refreshIcons();
    return;
  }

  // Mode 4: Self-Driving Active Drive Simulation
  if (state.carMode === "self_driving") {
    playCarGameSound();
    let playerLane = 1;
    let bypassedCount = 0;
    let traffic = [
      { id: 1, lane: 0, top: -120, speed: 4, type: "truck" },
      { id: 2, lane: 2, top: -320, speed: 5, type: "taxi" }
    ];

    content.innerHTML = `
      ${header("CHAPTER 07 (PART 2) // AUTONOMOUS AI DRIVE", "100% Autonomous AI Self Driving", "Watch your Superhero AI scan traffic with LIDAR and steer left & right automatically!", "07")}
      ${headerMarkup}

      <div class="driving-hud">
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
          <span class="telemetry-pill ai-pill">🤖 100% AUTONOMOUS AI DRIVER</span>
          <span id="ai-telemetry-text" style="font-size:12px;color:#38bdf8;font-weight:700;">
            👁️ LIDAR Vision: Scanning road ahead (60 FPS)...
          </span>
        </div>
        <div style="font-size:14px;font-weight:800;color:#fbbf24;">
          🏆 Bypassed: <span id="car-bypassed-count">0</span> Vehicles
        </div>
      </div>

      <div class="highway-stage" id="highway-canvas">
        <div class="road-surface">
          <div class="road-lane-line"></div>
          <div class="road-lane-line"></div>
        </div>

        <div id="player-car-element" class="road-vehicle" style="left:50%;bottom:20px;transform:translateX(-50%);">
          ${renderCyberCarGraphic(true, true, heroName, state.hero.primary, state.hero.glow)}
        </div>

        <div id="traffic-container"></div>
      </div>

      <div style="display:flex;justify-content:space-between;margin-top:16px;border-top:1px dashed rgba(255,255,255,0.15);padding-top:14px;flex-wrap:wrap;gap:10px;">
        <button id="switch-to-manual-mode-btn" class="button button-outline">
          🕹️ Test Manual Driving
        </button>
        <button id="finish-all-creator-btn" class="button button-primary" style="padding:12px 24px;">
          <span>Complete Creator Lab & View Graduation</span>
          ${icon("rocket")}
        </button>
      </div>
    `;

    const lanePos = ["16%", "50%", "84%"];
    const playerEl = document.querySelector("#player-car-element");
    const trafficContainer = document.querySelector("#traffic-container");
    const telemetryText = document.querySelector("#ai-telemetry-text");

    document.querySelector("#switch-to-manual-mode-btn")?.addEventListener("click", () => { state.carMode = "manual"; renderCreatorCarLab(); });
    document.querySelector("#car-mode-select-btn")?.addEventListener("click", () => { state.carMode = "select"; renderCreatorCarLab(); });
    document.querySelector("#tab-home-surveillance")?.addEventListener("click", () => { state.creatorSubStage = "home"; renderCreator(); });
    document.querySelector("#tab-parcel-sorter")?.addEventListener("click", () => { state.creatorSubStage = "parcel"; state.parcelMode = "select"; renderCreator(); });

    document.querySelector("#finish-all-creator-btn")?.addEventListener("click", () => {
      stopCreatorSimulations();
      complete("creator");
      playEurekaSound();
      toastMessage(`🎉 Big Congratulations! You built ${heroName}'s Autonomous Self-Driving Car!`, true);
      navigate("profile");
    });

    window.activeCarInterval = setInterval(() => {
      if (!document.body.contains(playerEl)) { stopCreatorSimulations(); return; }

      traffic.forEach((car) => {
        car.top += car.speed;
        if (car.top > 420) {
          car.top = -120;
          car.lane = Math.floor(Math.random() * 3);
          car.type = ["truck", "taxi", "sports"][Math.floor(Math.random() * 3)];
          bypassedCount++;
          const countEl = document.querySelector("#car-bypassed-count");
          if (countEl) countEl.textContent = bypassedCount;
        }
      });

      const threat = traffic.find((car) => car.lane === playerLane && car.top > -40 && car.top < 180);
      if (threat) {
        const occupiedLanes = new Set(traffic.filter((car) => car.top > -40 && car.top < 180).map((car) => car.lane));
        let openLane = playerLane;
        for (let l of [0, 1, 2]) {
          if (!occupiedLanes.has(l)) { openLane = l; break; }
        }
        if (openLane !== playerLane) {
          const prevLane = playerLane;
          playerLane = openLane;
          if (playerEl) playerEl.style.left = lanePos[playerLane];
          if (telemetryText) {
            telemetryText.textContent = `🧠 AI Decision: Threat in Lane ${prevLane + 1} -> Steering safely to Lane ${playerLane + 1}!`;
          }
        }
      } else {
        if (telemetryText && Math.random() < 0.05) {
          telemetryText.textContent = "👁️ LIDAR Radar: Clear lane ahead. Cruising at optimal 60 MPH...";
        }
      }

      if (trafficContainer) {
        trafficContainer.innerHTML = traffic.map((car) => `
          <div class="traffic-vehicle" style="left:${lanePos[car.lane]};top:${car.top}px;transform:translateX(-50%);">
            ${renderTrafficCarGraphic(car.type)}
          </div>
        `).join("");
      }
    }, 40);

    refreshIcons();
  }
}

function renderCreatorParcelLab() {
  stopCreatorSimulations();
  state.parcelMode = state.parcelMode || "select";
  const heroName = state.hero.name || "STARBYTE";
  const isHeroAttached = state.parcelHeroAttached || false;

  const headerMarkup = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:10px;">
      <div class="creator-subtabs">
        <button class="creator-subtab" id="tab-home-surveillance">
          ${icon("home")} 01 // Home Surveillance
        </button>
        <button class="creator-subtab" id="tab-self-driving">
          ${icon("car")} 02 // Self Driving Car
        </button>
        <button class="creator-subtab active" id="tab-parcel-sorter">
          ${icon("bot")} 03 // Parcel Sorter
        </button>
      </div>
      ${state.parcelMode !== "select" ? `
        <button id="parcel-mode-select-btn" class="button button-outline" style="font-size:11px;padding:6px 14px;">
          ${icon("arrow-left")} Back to Mode Options
        </button>
      ` : ""}
    </div>
  `;

  // Mode 1: Selection Screen
  if (state.parcelMode === "select") {
    content.innerHTML = `
      ${header("CHAPTER 07 (PART 3) // CREATOR LAB 3.0", "Robotic Parcel Sorter Creator", "Choose Manual Operator Mode or 100% AI Robotic Arm Automation to sort small and big parcels!", "07")}
      ${headerMarkup}

      <div class="car-mode-grid">
        <!-- Card 1: Manual Operator Mode -->
        <div class="car-mode-card">
          <div>
            <span class="mode-badge manual-badge">01 // HUMAN OPERATOR</span>
            <h3 style="margin:0 0 8px;font-size:18px;color:#0f172a;">🕹️ Manual Parcel Sorter</h3>
            <p style="font-size:13px;color:#475569;line-height:1.5;margin-bottom:16px;">
              Sort parcels coming down the conveyor belt yourself! Inspect each incoming box and click <strong>Left Bin (Small 📦)</strong> or <strong>Right Bin (Big 📦📦)</strong> to sort them manually.
            </p>
          </div>
          <div style="margin-top:16px;">
            <button id="start-manual-parcel-btn" class="button button-primary" style="width:100%;">
              <span>Launch Manual Sorter</span>
              ${icon("gamepad-2")}
            </button>
          </div>
        </div>

        <!-- Card 2: AI Automation Mode -->
        <div class="car-mode-card ai-card">
          <div>
            <span class="mode-badge ai-badge">02 // AI ROBOTIC ARM</span>
            <h3 style="margin:0 0 8px;font-size:18px;color:#ffffff;">🤖 AI Robotic Arm Automation</h3>
            <p style="font-size:13px;color:#94a3b8;line-height:1.5;margin-bottom:16px;">
              Infuse your trained Superhero AI <strong>${heroName}</strong> onto the Industrial Robotic Arm! The AI uses <strong>Computer Vision line lasers</strong> to measure box sizes and automatically sorts Small and Big parcels into their bins!
            </p>
          </div>
          <div style="margin-top:16px;">
            <button id="start-ai-parcel-btn" class="button button-primary" style="width:100%;background:linear-gradient(135deg,#f59e0b,#ef4444);">
              <span>Launch AI Robotic Sorter</span>
              ${icon("sparkles")}
            </button>
          </div>
        </div>
      </div>
    `;

    document.querySelector("#tab-home-surveillance")?.addEventListener("click", () => { state.creatorSubStage = "home"; renderCreator(); });
    document.querySelector("#tab-self-driving")?.addEventListener("click", () => { state.creatorSubStage = "car"; state.carMode = "select"; renderCreator(); });
    document.querySelector("#start-manual-parcel-btn")?.addEventListener("click", () => { state.parcelMode = "manual"; renderCreatorParcelLab(); });
    document.querySelector("#start-ai-parcel-btn")?.addEventListener("click", () => { state.parcelMode = isHeroAttached ? "ai_sorting" : "ai_setup"; renderCreatorParcelLab(); });

    refreshIcons();
    return;
  }

  // Mode 2: Manual Operator Mode
  if (state.parcelMode === "manual") {
    let smallCount = 0;
    let bigCount = 0;
    let currentSize = Math.random() < 0.5 ? "small" : "big";

    content.innerHTML = `
      ${header("CHAPTER 07 (PART 3) // MANUAL SORTER", "Manual Parcel Operator Mode", "Inspect incoming conveyor parcels and sort Small parcels to the Left Bin and Big parcels to the Right Bin!", "07")}
      ${headerMarkup}

      <!-- Conveyor Stage -->
      <div class="conveyor-stage">
        <!-- 2 Bins Top -->
        <div class="sorting-bins-grid">
          <div id="bin-left-el" class="sorting-bin bin-small">
            <span class="bin-badge">LEFT BIN // SMALL 📦</span>
            <h4 style="margin:4px 0;font-size:16px;">Small Parcels</h4>
            <div style="font-size:18px;font-weight:800;color:#38bdf8;">
              Sorted: <span id="small-sorted-count">0</span>
            </div>
          </div>

          <div id="bin-right-el" class="sorting-bin bin-big">
            <span class="bin-badge">RIGHT BIN // BIG 📦📦</span>
            <h4 style="margin:4px 0;font-size:16px;">Big Parcels</h4>
            <div style="font-size:18px;font-weight:800;color:#fbbf24;">
              Sorted: <span id="big-sorted-count">0</span>
            </div>
          </div>
        </div>

        <!-- Parcel Box Center on Belt -->
        <div id="current-parcel-container" class="conveyor-parcel">
          <div class="parcel-box-graphic ${currentSize === "small" ? "small-box" : "big-box"}">
            📦
          </div>
          <span style="font-size:11px;font-weight:800;color:#f59e0b;margin-top:6px;background:rgba(0,0,0,0.6);padding:2px 8px;border-radius:10px;">
            ${currentSize === "small" ? "SMALL PARCEL" : "HEAVY BIG PARCEL"}
          </span>
        </div>

        <!-- Conveyor Roller Track -->
        <div class="conveyor-belt-track">
          <div class="conveyor-roller-strip"></div>
        </div>
      </div>

      <!-- Control Buttons -->
      <div style="display:flex;justify-content:center;gap:16px;margin-top:16px;">
        <button id="btn-sort-small" class="button button-primary" style="flex:1;max-width:260px;background:#0284c7;">
          <span>📦 Sort to Small Bin (Left)</span>
        </button>
        <button id="btn-sort-big" class="button button-primary" style="flex:1;max-width:260px;background:#d97706;">
          <span>📦 Sort to Big Bin (Right)</span>
        </button>
      </div>

      <!-- Bottom Actions -->
      <div style="display:flex;justify-content:space-between;margin-top:16px;border-top:1px dashed rgba(255,255,255,0.15);padding-top:14px;">
        <button id="switch-to-ai-parcel-btn" class="button button-primary" style="background:linear-gradient(135deg,#f59e0b,#ef4444);">
          <span>Switch to AI Robotic Arm Automation</span>
          ${icon("sparkles")}
        </button>
        <button id="back-select-btn" class="button button-outline">
          ↩ Mode Options
        </button>
      </div>
    `;

    const parcelContainer = document.querySelector("#current-parcel-container");
    const binLeft = document.querySelector("#bin-left-el");
    const binRight = document.querySelector("#bin-right-el");

    const renderNextParcel = () => {
      currentSize = Math.random() < 0.5 ? "small" : "big";
      if (parcelContainer) {
        parcelContainer.style.transition = "none";
        parcelContainer.style.left = "-12%";
        parcelContainer.style.bottom = "62px";
        parcelContainer.style.transform = "translateX(-50%) scale(1)";
        parcelContainer.style.opacity = "1";
        parcelContainer.innerHTML = `
          <div class="parcel-box-graphic ${currentSize === "small" ? "small-box" : "big-box"}">
            📦
          </div>
          <span class="parcel-label-tag">
            ${currentSize === "small" ? "SMALL PARCEL" : "HEAVY BIG PARCEL"}
          </span>
        `;
        setTimeout(() => {
          if (parcelContainer) {
            parcelContainer.style.transition = "left 1.2s linear, bottom 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease";
            parcelContainer.style.left = "50%";
          }
        }, 50);
      }
    };

    const handleSortLeft = () => {
      if (currentSize === "small") {
        smallCount++;
        document.querySelector("#small-sorted-count").textContent = smallCount;
        if (parcelContainer) {
          parcelContainer.style.left = "24%";
          parcelContainer.style.bottom = "240px";
          parcelContainer.style.transform = "translateX(-50%) scale(0.85)";
          setTimeout(() => { parcelContainer.style.opacity = "0"; }, 400);
        }
        binLeft?.classList.add("active-sort");
        setTimeout(() => binLeft?.classList.remove("active-sort"), 500);
        playDragDropSound();
        toastMessage("✅ Correct! Small parcel sorted to Small Bin.", true);
        setTimeout(renderNextParcel, 900);
      } else {
        toastMessage("⚠️ That was a BIG parcel! Place big parcels into the Big Bin (Right).");
      }
    };

    const handleSortRight = () => {
      if (currentSize === "big") {
        bigCount++;
        document.querySelector("#big-sorted-count").textContent = bigCount;
        if (parcelContainer) {
          parcelContainer.style.left = "76%";
          parcelContainer.style.bottom = "240px";
          parcelContainer.style.transform = "translateX(-50%) scale(0.85)";
          setTimeout(() => { parcelContainer.style.opacity = "0"; }, 400);
        }
        binRight?.classList.add("active-sort");
        setTimeout(() => binRight?.classList.remove("active-sort"), 500);
        playDragDropSound();
        toastMessage("✅ Correct! Big parcel sorted to Big Bin.", true);
        setTimeout(renderNextParcel, 900);
      } else {
        toastMessage("⚠️ That was a SMALL parcel! Place small parcels into the Small Bin (Left).");
      }
    };

    renderNextParcel();

    document.querySelector("#btn-sort-small")?.addEventListener("click", handleSortLeft);
    document.querySelector("#btn-sort-big")?.addEventListener("click", handleSortRight);

    document.querySelector("#tab-home-surveillance")?.addEventListener("click", () => { state.creatorSubStage = "home"; renderCreator(); });
    document.querySelector("#tab-self-driving")?.addEventListener("click", () => { state.creatorSubStage = "car"; state.carMode = "select"; renderCreator(); });
    document.querySelector("#parcel-mode-select-btn")?.addEventListener("click", () => { state.parcelMode = "select"; renderCreatorParcelLab(); });
    document.querySelector("#back-select-btn")?.addEventListener("click", () => { state.parcelMode = "select"; renderCreatorParcelLab(); });
    document.querySelector("#switch-to-ai-parcel-btn")?.addEventListener("click", () => { state.parcelMode = isHeroAttached ? "ai_sorting" : "ai_setup"; renderCreatorParcelLab(); });

    refreshIcons();
    return;
  }

  // Mode 3: AI Setup (Drag & Drop Superhero on Robotic Arm)
  if (state.parcelMode === "ai_setup") {
    content.innerHTML = `
      ${header("CHAPTER 07 (PART 3) // AI SETUP", "Equip Superhero AI Core", "Drag your trained Superhero AI onto the Robotic Arm to activate automated sorting!", "07")}
      ${headerMarkup}

      <div class="surveillance-layout">
        <!-- Left Toolbox -->
        <aside class="surveillance-toolbox">
          <h3>${icon("wrench")} AI Core Module</h3>
          <p style="margin:0;font-size:12px;color:#64748b;line-height:1.45;">
            Drag your superhero into the robotic arm stage to infuse AI Computer Vision:
          </p>

          <div class="surveillance-item-card ${isHeroAttached ? "used" : ""}" draggable="${!isHeroAttached}" id="drag-arm-hero">
            <div class="surveillance-item-icon" style="background:#fef3c7;color:#b45309;">⚡</div>
            <div class="surveillance-item-info">
              <strong>${heroName} (AI Core)</strong>
              <small>${isHeroAttached ? "✅ Installed on Robotic Arm" : "Drag to Robotic Arm"}</small>
            </div>
          </div>

          <div class="finding" style="font-size:11px;padding:10px 12px;margin-top:auto;">
            ${icon("sparkles")}
            <span>Infusing ${heroName} equips optic line laser box scanning and automated gripper arm sorting.</span>
          </div>
        </aside>

        <!-- Right Arm Stage -->
        <section class="home-cyber-stage" id="arm-dropzone">
          <h3 style="margin:0 0 2px;font-family:var(--display);font-size:17px;color:#ffffff;">
            Industrial Cyber Robotic Workshop
          </h3>
          <p style="margin:0 0 6px;font-size:12px;color:#94a3b8;">
            ${isHeroAttached ? "✅ Superhero AI Neural Core Installed!" : "Drag or tap " + heroName + " into the robotic arm below."}
          </p>

          <div style="width:260px;height:200px;margin:16px 0;">
            ${renderCyberRoboticArmGraphic(isHeroAttached, isHeroAttached, heroName, state.hero.primary, state.hero.glow, 0)}
          </div>

          <div class="home-drop-instructions">
            ${isHeroAttached ? `
              <button id="launch-ai-sorting-btn" class="button button-primary" style="padding:12px 24px;font-size:14px;background:linear-gradient(135deg,#f59e0b,#ef4444);">
                <span>🚀 Start AI Parcel Sorting</span>
              </button>
            ` : `
              ${icon("move-down")}
              <span><strong>Drag ${heroName} here</strong> or tap card to install AI</span>
            `}
          </div>
        </section>
      </div>
    `;

    const attachHeroToArm = () => {
      if (state.parcelHeroAttached) return;
      state.parcelHeroAttached = true;
      persistProgress();
      playEurekaSound();
      toastMessage(`⚡ ${heroName} AI Core infused into Robotic Arm!`, true);
      state.parcelMode = "ai_sorting";
      renderCreatorParcelLab();
    };

    const heroCard = document.querySelector("#drag-arm-hero");
    heroCard?.addEventListener("dragstart", (e) => { e.dataTransfer.setData("text/plain", "arm-hero"); });
    heroCard?.addEventListener("click", attachHeroToArm);

    const armDrop = document.querySelector("#arm-dropzone");
    armDrop?.addEventListener("dragover", (e) => { e.preventDefault(); armDrop.classList.add("drop-hover"); });
    armDrop?.addEventListener("dragleave", () => armDrop.classList.remove("drop-hover"));
    armDrop?.addEventListener("drop", (e) => { e.preventDefault(); armDrop.classList.remove("drop-hover"); attachHeroToArm(); });

    document.querySelector("#launch-ai-sorting-btn")?.addEventListener("click", () => {
      state.parcelMode = "ai_sorting";
      renderCreatorParcelLab();
    });
    document.querySelector("#tab-home-surveillance")?.addEventListener("click", () => { state.creatorSubStage = "home"; renderCreator(); });
    document.querySelector("#tab-self-driving")?.addEventListener("click", () => { state.creatorSubStage = "car"; state.carMode = "select"; renderCreator(); });
    document.querySelector("#parcel-mode-select-btn")?.addEventListener("click", () => { state.parcelMode = "select"; renderCreatorParcelLab(); });

    refreshIcons();
    return;
  }

  // Mode 4: AI Automation Active Sorting
  if (state.parcelMode === "ai_sorting") {
    let smallCount = 0;
    let bigCount = 0;
    let currentSize = "small";

    content.innerHTML = `
      ${header("CHAPTER 07 (PART 3) // AI AUTOMATION", "100% Autonomous AI Parcel Sorter", "Watch your Superhero AI Robotic Arm scan box sizes with lasers and sort them automatically!", "07")}
      ${headerMarkup}

      <!-- Telemetry HUD -->
      <div class="driving-hud">
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
          <span class="telemetry-pill ai-pill">🤖 100% AI ROBOTIC ARM AUTOMATION</span>
          <span id="parcel-telemetry-text" style="font-size:12px;color:#38bdf8;font-weight:700;">
            👁️ Vision Line Laser: Scanning incoming box size...
          </span>
        </div>
        <div style="font-size:14px;font-weight:800;color:#fbbf24;">
          📦 Small: <span id="small-sorted-count">0</span> | 📦📦 Big: <span id="big-sorted-count">0</span>
        </div>
      </div>

      <!-- Conveyor Stage with Robotic Arm Overhead -->
      <div class="conveyor-stage">
        <!-- Robotic Arm Graphic Overlay -->
        <div id="arm-svg-container" class="robotic-arm-overlay">
          ${renderCyberRoboticArmGraphic(true, true, heroName, state.hero.primary, state.hero.glow, 0)}
        </div>

        <!-- 2 Bins Top -->
        <div class="sorting-bins-grid">
          <div id="bin-left-el" class="sorting-bin bin-small">
            <span class="bin-badge">LEFT BIN // SMALL 📦</span>
            <h4 style="margin:4px 0;font-size:16px;">Small Parcels</h4>
            <div style="font-size:18px;font-weight:800;color:#38bdf8;">
              Sorted: <span id="small-sorted-count-top">0</span>
            </div>
          </div>

          <div id="bin-right-el" class="sorting-bin bin-big">
            <span class="bin-badge">RIGHT BIN // BIG 📦📦</span>
            <h4 style="margin:4px 0;font-size:16px;">Big Parcels</h4>
            <div style="font-size:18px;font-weight:800;color:#fbbf24;">
              Sorted: <span id="big-sorted-count-top">0</span>
            </div>
          </div>
        </div>

        <!-- Parcel Box Center on Belt -->
        <div id="current-parcel-container" class="conveyor-parcel">
          <div class="parcel-box-graphic small-box">📦</div>
          <span style="font-size:11px;font-weight:800;color:#f59e0b;margin-top:6px;background:rgba(0,0,0,0.6);padding:2px 8px;border-radius:10px;">
            SMALL PARCEL
          </span>
        </div>

        <!-- Conveyor Roller Track -->
        <div class="conveyor-belt-track">
          <div class="conveyor-roller-strip"></div>
        </div>
      </div>

      <!-- Bottom Actions -->
      <div style="display:flex;justify-content:space-between;margin-top:16px;border-top:1px dashed rgba(255,255,255,0.15);padding-top:14px;flex-wrap:wrap;gap:10px;">
        <button id="switch-to-manual-parcel-btn" class="button button-outline">
          🕹️ Test Manual Sorter
        </button>
        <button id="finish-all-creator-btn" class="button button-primary" style="padding:12px 24px;">
          <span>Complete Creator Lab & View Graduation</span>
          ${icon("rocket")}
        </button>
      </div>
    `;

    const parcelContainer = document.querySelector("#current-parcel-container");
    const armContainer = document.querySelector("#arm-svg-container");
    const binLeft = document.querySelector("#bin-left-el");
    const binRight = document.querySelector("#bin-right-el");
    const telemetryText = document.querySelector("#parcel-telemetry-text");

    document.querySelector("#switch-to-manual-parcel-btn")?.addEventListener("click", () => { state.parcelMode = "manual"; renderCreatorParcelLab(); });
    document.querySelector("#parcel-mode-select-btn")?.addEventListener("click", () => { state.parcelMode = "select"; renderCreatorParcelLab(); });
    document.querySelector("#tab-home-surveillance")?.addEventListener("click", () => { state.creatorSubStage = "home"; renderCreator(); });
    document.querySelector("#tab-self-driving")?.addEventListener("click", () => { state.creatorSubStage = "car"; state.carMode = "select"; renderCreator(); });

    document.querySelector("#finish-all-creator-btn")?.addEventListener("click", () => {
      stopCreatorSimulations();
      complete("creator");
      playEurekaSound();
      toastMessage(`🎉 Big Congratulations! You built ${heroName}'s Autonomous Robotic Parcel Sorter!`, true);
      navigate("profile");
    });

    let isProcessingParcel = false;

    const animateParcelSequence = () => {
      if (isProcessingParcel) return;
      isProcessingParcel = true;

      const currentSize = Math.random() < 0.5 ? "small" : "big";
      const isSmall = currentSize === "small";

      if (!document.body.contains(parcelContainer)) {
        stopCreatorSimulations();
        return;
      }

      // Step 1: Spawn new parcel at far left of conveyor belt
      parcelContainer.style.transition = "none";
      parcelContainer.style.left = "-12%";
      parcelContainer.style.bottom = "62px";
      parcelContainer.style.transform = "translateX(-50%) scale(1)";
      parcelContainer.style.opacity = "1";
      parcelContainer.innerHTML = `
        <div class="parcel-box-graphic ${isSmall ? "small-box" : "big-box"}">
          📦
        </div>
        <span class="parcel-label-tag">
          ${isSmall ? "SMALL PARCEL" : "HEAVY BIG PARCEL"}
        </span>
      `;

      if (telemetryText) {
        telemetryText.textContent = `🚚 Conveyor Belt: Transporting ${isSmall ? "Small Parcel" : "Heavy Big Cargo"} to AI Scanning Station...`;
      }
      if (armContainer) {
        armContainer.innerHTML = renderCyberRoboticArmGraphic(true, false, heroName, state.hero.primary, state.hero.glow, 0);
      }

      // Step 2: Smooth slide parcel along conveyor belt to center sorting station (50%)
      setTimeout(() => {
        if (!document.body.contains(parcelContainer)) return;
        parcelContainer.style.transition = "left 1.2s linear, bottom 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease";
        parcelContainer.style.left = "50%";
      }, 50);

      // Step 3: Laser scan under Robotic Arm
      setTimeout(() => {
        if (!document.body.contains(parcelContainer)) return;
        if (telemetryText) {
          telemetryText.textContent = `👁️ Vision Sensor: Laser Scanning Box (${isSmall ? "15x15cm, 2.1kg" : "45x45cm, 14.5kg"}) -> Classifying Size...`;
        }
        if (armContainer) {
          armContainer.innerHTML = renderCyberRoboticArmGraphic(true, true, heroName, state.hero.primary, state.hero.glow, 0);
        }
      }, 1300);

      // Step 4: Robotic Arm rotates and lifts parcel into target Bin!
      setTimeout(() => {
        if (!document.body.contains(parcelContainer)) return;
        const armAngle = isSmall ? 34 : -34;
        const targetLeft = isSmall ? "24%" : "76%";
        const targetBottom = "240px";

        if (telemetryText) {
          telemetryText.textContent = isSmall
            ? `🦾 Robotic Arm: Small Box Verified -> Placing in Left Bin (Small 📦)`
            : `🦾 Robotic Arm: Heavy Big Cargo Verified -> Placing in Right Bin (Big 📦📦)`;
        }

        if (armContainer) {
          armContainer.innerHTML = renderCyberRoboticArmGraphic(true, true, heroName, state.hero.primary, state.hero.glow, armAngle);
        }

        parcelContainer.style.left = targetLeft;
        parcelContainer.style.bottom = targetBottom;
        parcelContainer.style.transform = "translateX(-50%) scale(0.85)";
      }, 2100);

      // Step 5: Parcel drops into Bin! Glow pulse & counter update!
      setTimeout(() => {
        if (!document.body.contains(parcelContainer)) return;
        parcelContainer.style.opacity = "0";

        if (isSmall) {
          smallCount++;
          const c1 = document.querySelector("#small-sorted-count");
          const c2 = document.querySelector("#small-sorted-count-top");
          if (c1) c1.textContent = smallCount;
          if (c2) c2.textContent = smallCount;
          binLeft?.classList.add("active-sort");
          setTimeout(() => binLeft?.classList.remove("active-sort"), 500);
          playDragDropSound();
        } else {
          bigCount++;
          const c1 = document.querySelector("#big-sorted-count");
          const c2 = document.querySelector("#big-sorted-count-top");
          if (c1) c1.textContent = bigCount;
          if (c2) c2.textContent = bigCount;
          binRight?.classList.add("active-sort");
          setTimeout(() => binRight?.classList.remove("active-sort"), 500);
          playDragDropSound();
        }

        if (armContainer) {
          armContainer.innerHTML = renderCyberRoboticArmGraphic(true, true, heroName, state.hero.primary, state.hero.glow, 0);
        }
      }, 2900);

      // Step 6: Ready for next parcel!
      setTimeout(() => {
        isProcessingParcel = false;
      }, 3300);
    };

    // Run first parcel immediately, then repeat every 3.5s
    animateParcelSequence();
    window.activeParcelInterval = setInterval(animateParcelSequence, 3500);

    refreshIcons();
  }
}

function renderProfile() {
  const currentLevel = state.hero.level || 1;
  const levelData = heroLevelsData[currentLevel - 1] || heroLevelsData[0];
  const isAllComplete = state.completed.has("creator") || state.completed.size >= 6;

  const badges = [
    ["bot", "Nova Builder", "robo"],
    ["brain-circuit", "Supervised Pro", "supervised"],
    ["layers", "Cluster Master", "unsupervised"],
    ["sparkles", "GenAI Spark", "generative"],
    ["cpu", "Real-World Pro", "applications"],
    ["shield-alert", "Mistake Detective", "reality"],
    ["rocket", "AI Creator", "creator"]
  ];

  if (isAllComplete) {
    playEurekaSound();
  }

  content.innerHTML = `
    ${header("NOVA HQ // USER", "Nova's Mission Record", "Your AI learning journey with Nova and unlocked skill badges.")}

    ${isAllComplete ? `
      <!-- Big Congratulations Graduation Banner -->
      <div class="graduation-celebration-banner">
        <div class="confetti-container">
          <span class="confetti-piece" style="left:8%;animation-delay:0s;">🎉</span>
          <span class="confetti-piece" style="left:24%;animation-delay:0.8s;">⭐</span>
          <span class="confetti-piece" style="left:42%;animation-delay:1.5s;">✨</span>
          <span class="confetti-piece" style="left:60%;animation-delay:0.3s;">🎊</span>
          <span class="confetti-piece" style="left:78%;animation-delay:1.1s;">🚀</span>
          <span class="confetti-piece" style="left:92%;animation-delay:0.6s;">👑</span>
        </div>
        <div class="graduation-kicker">
          🎓 AI ACADEMY GRADUATE // ALL MISSIONS COMPLETED
        </div>
        <h2 class="graduation-title">
          🎉 Big Congratulations! You Completed AI Learning Basics!
        </h2>
        <p class="graduation-subtitle">
          You assembled <strong>Nova</strong>, mastered <strong>Supervised Learning</strong> (Computer Vision), <strong>Unsupervised Learning</strong> (Sound Patterns), <strong>Generative AI</strong>, <strong>AI Verification</strong>, and built an autonomous <strong>Smart Home Surveillance System</strong>!
        </p>
      </div>
    ` : ""}

    <div class="profile-layout" style="grid-template-columns: minmax(280px, 0.85fr) minmax(320px, 1.15fr);">
      <!-- Left: Nova companion showcase -->
      <section class="profile-stage" style="display:flex;flex-direction:column;align-items:center;text-align:center;padding:24px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
          <span style="font-size:11px;font-weight:800;letter-spacing:0.08em;padding:3px 10px;border-radius:20px;background:#e0f2fe;color:#0284c7;">
            ${levelData.tierBadge}
          </span>
          <span style="font-size:11px;font-weight:800;letter-spacing:0.08em;padding:3px 10px;border-radius:20px;background:#fef3c7;color:#b45309;">
            ${levelData.icon} LVL 0${currentLevel}
          </span>
        </div>

        <div style="width:220px;height:220px;margin:0 auto 12px;filter:drop-shadow(0 10px 20px rgba(0,0,0,0.15));">
          ${renderRoboAvatar(state.hero.primary, state.hero.secondary, state.hero.glow, "NOVA")}
        </div>

        <strong style="font-family:var(--display);font-size:22px;color:#18335b;">NOVA</strong>
        <span style="font-size:12px;font-weight:700;color:#0284c7;letter-spacing:0.08em;">YOUR AI LEARNING COMPANION</span>
        <p style="font-size:12px;color:#5f789d;margin:8px 0 16px;max-width:280px;line-height:1.4;">
          Nova learns from the examples, labels, sounds, and ideas you provide.
        </p>

      </section>

      <!-- Right: Power Badges & Mission Stats -->
      <div style="display:flex;flex-direction:column;gap:18px;">
        <section class="profile-stage">
          <h3>Power Badges</h3>
          <p>Every completed chapter builds a core AI superpower you will carry into the Creator Lab and beyond.</p>
          <div class="badge-list">
            ${badges.map(([iconName, label, id]) => `
              <div class="badge ${state.completed.has(id) ? "" : "locked"}">
                ${icon(iconName)}
                ${label}
              </div>
            `).join("")}
          </div>
        </section>

        <section class="profile-stage">
          <h3>Mission Data</h3>
          <p>Your progress is saved in this prototype while you explore.</p>
          <div class="stat-grid">
            <div class="stat">
              <strong>${state.completed.size}</strong>
              <span>chapters complete</span>
            </div>
            <div class="stat">
              <strong>LVL 0${currentLevel}</strong>
              <span>hero tier level</span>
            </div>
            <div class="stat">
              <strong>${state.completed.has("unsupervised") ? "1" : "0"}</strong>
              <span>unsupervised clusters</span>
            </div>
          </div>
          <div class="finding" style="margin-top:20px;">
            ${icon("shield-alert")}
            <span><strong>Remember:</strong> AI is a powerful assistant, but human curiosity and ethical judgment always lead the way.</span>
          </div>
        </section>
      </div>
    </div>
  `;
}

restoreProgress();
document.querySelector("#login-form").addEventListener("submit", (event) => {
  event.preventDefault(); const username = document.querySelector("#username").value.trim(); const password = document.querySelector("#password").value; const error = document.querySelector("#login-error");
  if (username === "user" && password === "1234") { document.querySelector("#login-view").classList.add("hidden"); document.querySelector("#academy-view").classList.remove("hidden"); updateProgress(); navigate("home"); playFantasySound(); } else { error.textContent = "Mission control could not verify that access code. Try user / 1234."; }
});
document.addEventListener("click", (event) => { const target = event.target.closest("[data-view]"); if (target && !target.disabled) navigate(target.dataset.view); const message = event.target.closest("[data-toast]")?.dataset.toast; if (message) toastMessage(message); });

function createSky() {
  const canvas = document.querySelector("#sky-canvas"); const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true }); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); const scene = new THREE.Scene(); const camera = new THREE.PerspectiveCamera(52, 1, .1, 100); camera.position.z = 8; const stars = new THREE.BufferGeometry(); const starData = new Float32Array(850 * 3); for (let i = 0; i < starData.length; i += 3) { starData[i] = (Math.random() - .5) * 30; starData[i + 1] = (Math.random() - .5) * 20; starData[i + 2] = (Math.random() - .5) * 17; } stars.setAttribute("position", new THREE.BufferAttribute(starData, 3)); const starCloud = new THREE.Points(stars, new THREE.PointsMaterial({ color: 0x8eeaff, size: .028, transparent: true, opacity: .74 })); scene.add(starCloud); const geo = new THREE.IcosahedronGeometry(1.05, 2); const material = new THREE.MeshBasicMaterial({ color: 0x715ce8, wireframe: true, transparent: true, opacity: .14 }); const world = new THREE.Mesh(geo, material); world.position.set(5.7, -3.2, -2.5); scene.add(world); function resize() { renderer.setSize(window.innerWidth, window.innerHeight, false); camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); } function animate() { requestAnimationFrame(animate); starCloud.rotation.y += .00022; world.rotation.x += .0013; world.rotation.y -= .001; renderer.render(scene, camera); } window.addEventListener("resize", resize); resize(); animate(); }
if (window.THREE) createSky();
refreshIcons();
