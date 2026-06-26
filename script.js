const stage          = document.getElementById("stage");
const centerMessage  = document.getElementById("centerMessage");
const startBtn       = document.getElementById("startBtn");
const pauseBtn       = document.getElementById("pauseBtn");
const resetBtn       = document.getElementById("resetBtn");
const clearStorageBtn= document.getElementById("clearStorageBtn");
const modeSelect     = document.getElementById("mode");
const adaptiveEl     = document.getElementById("adaptive");
const toast          = document.getElementById("toast");
const comboEl        = document.getElementById("combo");
const scoreEl        = document.getElementById("score");
const bestEl         = document.getElementById("best");
const streakEl       = document.getElementById("streak");
const accuracyEl     = document.getElementById("accuracy");
const levelEl        = document.getElementById("level");
const missesEl       = document.getElementById("misses");
const currentKeyEl   = document.getElementById("currentKey");
const fingerHintEl   = document.getElementById("fingerHint");
const weakKeysEl     = document.getElementById("weakKeys");
const keyboardEl     = document.getElementById("keyboard");
const legendEl       = document.getElementById("legend");
const todayStatsEl   = document.getElementById("todayStats");
const openFocusBtn   = document.getElementById("openFocusBtn");
const closeFocusBtn  = document.getElementById("closeFocusBtn");
const focusLayer     = document.getElementById("focusLayer");
const focusKeyboardEl= document.getElementById("focusKeyboard");
const focusBigKeyEl  = document.getElementById("focusBigKey");
const focusFingerEl  = document.getElementById("focusFinger");
const focusInstrEl   = document.getElementById("focusInstruction");
const focusModeEl    = document.getElementById("focusMode");
const focusNextBtn   = document.getElementById("focusNextBtn");
const focusStreakEl  = document.getElementById("focusStreak");
const focusCorrectEl = document.getElementById("focusCorrect");
const focusWrongEl   = document.getElementById("focusWrong");

const STORAGE_KEY = "fallingKeysPractice.v3";
const MODES = {
  home:    "asdfjkl;",
  letters: "abcdefghijklmnopqrstuvwxyz",
  hard:    "pmqwzxybvjgk",
  left:    "qwertasdfgzxcvb",
  right:   "yuiophjkl;nm,./",
  code:    "abcdefghijklmnopqrstuvwxyz{}[]()<>;:=+-_*/'\".,",
  mixed:   "abcdefghijklmnopqrstuvwxyz0123456789{}[]()<>;:=+-_*/'\".,?!@#$%"
};
const HARD_KEYS = "pmqwzxyb";
const FINGER = {
  LP: { name: "Left pinky",   short: "LP", cls: "lp", color: "var(--lp)" },
  LR: { name: "Left ring",    short: "LR", cls: "lr", color: "var(--lr)" },
  LM: { name: "Left middle",  short: "LM", cls: "lm", color: "var(--lm)" },
  LI: { name: "Left index",   short: "LI", cls: "li", color: "var(--li)" },
  RI: { name: "Right index",  short: "RI", cls: "ri", color: "var(--ri)" },
  RM: { name: "Right middle", short: "RM", cls: "rm", color: "var(--rm)" },
  RR: { name: "Right ring",   short: "RR", cls: "rr", color: "var(--rr)" },
  RP: { name: "Right pinky",  short: "RP", cls: "rp", color: "var(--rp)" }
};
const KEY_FINGER = {
  "`":"LP","1":"LP","q":"LP","a":"LP","z":"LP",
  "2":"LR","w":"LR","s":"LR","x":"LR",
  "3":"LM","e":"LM","d":"LM","c":"LM",
  "4":"LI","5":"LI","r":"LI","t":"LI","f":"LI","g":"LI","v":"LI","b":"LI",
  "6":"RI","7":"RI","y":"RI","u":"RI","h":"RI","j":"RI","n":"RI","m":"RI",
  "8":"RM","i":"RM","k":"RM",",":"RM","<":"RM","*":"RM",
  "9":"RR","o":"RR","l":"RR",".":"RR",">":"RR",
  "0":"RP","p":"RP",";":"RP",":":"RP","/":"RP","?":"RP","-":"RP","_":"RP",
  "=":"RP","+":"RP","[":"RP","]":"RP","{":"RP","}":"RP","'":"RP","\"":"RP",
  "\\":"RP","|":"RP","(":"RP",")":"RP",
  "!":"LP","@":"LR","#":"LM","$":"LI","%":"LI"
};
const rows = [
  ["q","w","e","r","t","y","u","i","o","p"],
  ["a","s","d","f","g","h","j","k","l",";"],
  ["z","x","c","v","b","n","m",",",".","/"],
  ["space"]
];

let store        = loadStore();
let running      = false;
let paused       = false;
let keys         = [];
let lastSpawn    = 0;
let spawnEvery   = 1450;
let stepSize     = 22;   // px per Tetris-style step
let stepInterval = 380;  // ms between steps
let lastStep     = 0;
let score        = 0;
let streak       = 0;
let hits         = 0;
let wrong        = 0;
let misses       = 0;
let level        = 1;
let raf          = null;
let weak         = {};
let lastTime     = performance.now();
let focusOpen = false;
let focusCurrent  = "";
let focusStreak   = 0;
let focusCorrect  = 0;
let focusWrong    = 0;

function todayKey() { return new Date().toISOString().slice(0, 10); }

function defaultStore() {
  return {
    bestScore: 0, totalHits: 0, totalWrong: 0, totalMisses: 0,
    weakKeys: {}, perKeyHits: {},
    settings: { mode: "letters", adaptive: true, focusMode: "letters" },
    days: {}
  };
}

function loadStore() {
  try { return Object.assign(defaultStore(), JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")); }
  catch { return defaultStore(); }
}

function saveStore() {
  store.settings.mode      = modeSelect.value;
  store.settings.adaptive  = adaptiveEl.checked;
  store.settings.focusMode = focusModeEl.value;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function savePracticeEvent(type, key) {
  const day = todayKey();
  store.days[day] ||= { hits: 0, wrong: 0, misses: 0, score: 0 };
  if (type === "hit")   { store.totalHits++;   store.perKeyHits[key] = (store.perKeyHits[key] || 0) + 1; store.days[day].hits++; }
  if (type === "wrong") { store.totalWrong++;  store.weakKeys[key]   = (store.weakKeys[key]   || 0) + 1; store.days[day].wrong++; }
  if (type === "miss")  { store.totalMisses++; store.weakKeys[key]   = (store.weakKeys[key]   || 0) + 1; store.days[day].misses++; }
  store.bestScore          = Math.max(store.bestScore || 0, score);
  store.days[day].score    = Math.max(store.days[day].score || 0, score);
  saveStore();
  renderToday();
}

function normalizeKey(k) {
  if (k === " ") return "space";
  return k.length === 1 ? k.toLowerCase() : k;
}

function weightedRandom(chars) {
  const adaptive = adaptiveEl.checked;
  const pool = [];
  for (const ch of chars) {
    let weight = 4;
    if (HARD_KEYS.includes(ch)) weight += 8;
    if (adaptive) {
      weight += Math.min(16, (store.weakKeys[ch] || 0) * 2);
      weight += Math.min(10, (weak[ch] || 0) * 3);
      if ((store.perKeyHits[ch] || 0) < 5) weight += 3;
    }
    for (let i = 0; i < weight; i++) pool.push(ch);
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

function updateStats() {
  const total = hits + wrong + misses;
  const acc   = total === 0 ? 100 : Math.max(0, Math.round((hits / total) * 100));
  scoreEl.textContent    = score;
  bestEl.textContent     = Math.max(store.bestScore || 0, score);
  streakEl.textContent   = streak;
  accuracyEl.textContent = acc + "%";
  missesEl.textContent   = misses;
  levelEl.textContent    = level;
  const allWeak = { ...store.weakKeys };
  for (const [k, v] of Object.entries(weak)) allWeak[k] = (allWeak[k] || 0) + v;
  const sortedWeak = Object.entries(allWeak).sort((a, b) => b[1] - a[1]).slice(0, 10);
  weakKeysEl.textContent = sortedWeak.length
    ? sortedWeak.map(([k, v]) => `${k}:${v}`).join("  ")
    : "No mistakes yet.";
}

function renderToday() {
  const d = store.days[todayKey()];
  if (!d) { todayStatsEl.textContent = "No saved practice yet."; return; }
  const total = d.hits + d.wrong + d.misses;
  const acc   = total ? Math.round((d.hits / total) * 100) : 100;
  todayStatsEl.innerHTML = `Hits: <b>${d.hits}</b><br>Wrong: <b>${d.wrong}</b><br>Misses: <b>${d.misses}</b><br>Best: <b>${d.score}</b><br>Accuracy: <b>${acc}%</b>`;
}

function showToast(text) {
  toast.textContent = text;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("show"), 650);
}

function showCombo() {
  if (streak < 5) return;
  comboEl.textContent = `combo ×${streak}`;
  comboEl.classList.add("show");
  clearTimeout(showCombo._t);
  showCombo._t = setTimeout(() => comboEl.classList.remove("show"), 500);
}

function buildKeyboard(targetEl, focus = false) {
  targetEl.innerHTML = "";
  rows.forEach((row, idx) => {
    const r = document.createElement("div");
    r.className = focus ? `focus-row r${idx + 1}` : `row r${idx + 1}`;
    row.forEach(k => {
      const id     = KEY_FINGER[k];
      const finger = FINGER[id];
      const el     = document.createElement("div");
      el.className = `${focus ? "fk" : "k"} ${k === "space" ? (focus ? "space" : "wide") : ""} ${finger ? finger.cls : ""}`.trim();
      el.dataset.key         = k;
      el.dataset.fingerShort = finger ? finger.short : "";
      el.textContent         = k === "space" ? "space" : k;
      r.appendChild(el);
    });
    targetEl.appendChild(r);
  });
}

function buildLegend() {
  legendEl.innerHTML = "";
  Object.values(FINGER).forEach(f => {
    const item = document.createElement("div");
    item.className  = "legend-item";
    item.style.color = f.color;
    item.innerHTML  = `<span class="dot"></span><span>${f.short} ${f.name}</span>`;
    legendEl.appendChild(item);
  });
}

function setCurrentKey(k) {
  currentKeyEl.textContent = k || "—";
  document.querySelectorAll(".k").forEach(el => {
    el.classList.toggle("active", el.dataset.key === k);
  });
  fingerHintEl.innerHTML = "";
  const id       = KEY_FINGER[k];
  const finger   = FINGER[id];
  const fingerName = finger ? finger.name : "Nearest comfortable finger";
  [
    ["Key",      k || "—"],
    ["Finger",   fingerName],
    ["Rare/hard", HARD_KEYS.includes(k) ? "yes, boosted" : "normal"],
    ["Return",   "Back to home row"],
    ["Focus",    "correct finger > speed"]
  ].forEach(([a, b]) => {
    const line = document.createElement("div");
    line.className = "finger-line";
    line.innerHTML = `<span>${a}</span><span>${b}</span>`;
    fingerHintEl.appendChild(line);
  });
}

function spawnKey() {
  const char = weightedRandom(MODES[modeSelect.value]);
  const el   = document.createElement("div");
  el.className   = "falling-key";
  if (HARD_KEYS.includes(char)) el.classList.add("hard");
  el.textContent = char;
  el.dataset.key = char;
  const maxX = Math.max(0, stage.clientWidth - 64);
  el.style.left  = (20 + Math.random() * Math.max(0, maxX - 40)) + "px";
  el.style.top   = "-60px";
  stage.appendChild(el);
  keys.push({ char, el, y: -60 });
  if (keys.length === 1) setCurrentKey(char);
}

function removeKey(obj, cls) {
  obj.el.classList.add(cls);
  setTimeout(() => obj.el.remove(), 220);
  keys = keys.filter(k => k !== obj);
  setCurrentKey(keys[0]?.char || "—");
}

function handleHit(key) {
  if (focusOpen) { handleFocusKey(key); return; }
  if (!running || paused) return;
  if (!keys.length) return;
  const index = keys.findIndex(k => k.char === key);
  if (index >= 0) {
    const obj = keys[index];
    hits++; streak++;
    score += 10 + Math.min(streak, 30) + (HARD_KEYS.includes(key) ? 5 : 0);
    removeKey(obj, "hit");
    flashKeyboard(key, "good");
    showCombo();
    savePracticeEvent("hit", key);
    if (streak > 0 && streak % 12 === 0) {
      level++;
      stepInterval = Math.max(140, stepInterval - 28);
      spawnEvery   = Math.max(520, spawnEvery - 90);
      showToast("Level up ↑");
    }
    if (streak > 0 && streak % 25 === 0) {
      score += 100;
      showToast("Clean streak bonus +100");
    }
  } else {
    wrong++; streak = 0;
    weak[key] = (weak[key] || 0) + 1;
    flashKeyboard(key, "bad");
    savePracticeEvent("wrong", key);
    showToast("Wrong: " + key);
  }
  updateStats();
}

function flashKeyboard(key, cls) {
  const el = document.querySelector(`.k[data-key="${CSS.escape(key)}"]`);
  if (!el) return;
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), 180);
}

function loop(now) {
  lastTime = now;
  if (running && !paused) {
    // Spawn
    if (now - lastSpawn > spawnEvery) { spawnKey(); lastSpawn = now; }

    // Tetris-style: step all keys down together on each tick
    if (now - lastStep >= stepInterval) {
      lastStep = now;
      const groundY = stage.clientHeight - 80;
      for (const obj of [...keys]) {
        obj.y += stepSize;
        obj.el.style.top = obj.y + "px";
        if (obj.y >= groundY) {
          misses++; streak = 0;
          weak[obj.char] = (weak[obj.char] || 0) + 1;
          savePracticeEvent("miss", obj.char);
          removeKey(obj, "miss");
          showToast("Missed: " + obj.char);
          updateStats();
        }
      }
    }
  }
  raf = requestAnimationFrame(loop);
}

function startGame() {
  if (!running) {
    running = true; paused = false;
    centerMessage.style.display = "none";
    lastSpawn = performance.now() - 9999;
    lastStep  = performance.now();
    lastTime  = performance.now();
  } else {
    paused = false;
    centerMessage.style.display = "none";
  }
  saveStore();
}

function pauseGame() {
  if (!running) return;
  paused = !paused;
  centerMessage.style.display = paused ? "grid" : "none";
  if (paused) {
    centerMessage.innerHTML = `
      <div class="message-card">
        <strong>Paused</strong>
        <p>Press <kbd>Space</kbd> to continue.</p>
      </div>`;
  }
  saveStore();
}

function resetGame() {
  running = false; paused = false;
  keys.forEach(k => k.el.remove());
  keys = []; score = 0; streak = 0; hits = 0; wrong = 0;
  misses = 0; level = 1; stepInterval = 380; spawnEvery = 1450; weak = {};
  setCurrentKey("—");
  updateStats();
  centerMessage.style.display = "grid";
  centerMessage.innerHTML = `
    <div class="message-card">
      <strong>Start with Practice Finger Map</strong>
      <p>Press <kbd>F</kbd> (when not playing) to open the finger map. Learn the layout before the falling game.</p>
    </div>`;
  saveStore();
}

function clearStorage() {
  localStorage.removeItem(STORAGE_KEY);
  store = defaultStore(); weak = {};
  modeSelect.value   = "letters";
  focusModeEl.value  = "letters";
  adaptiveEl.checked = true;
  resetGame(); renderToday();
  showToast("Stats cleared");
}

function nextFocusKey() {
  const chars  = MODES[focusModeEl.value] || MODES.letters;
  focusCurrent = weightedRandom(chars);
  const id     = KEY_FINGER[focusCurrent];
  const finger = FINGER[id];
  focusBigKeyEl.textContent  = focusCurrent;
  focusFingerEl.textContent  = finger ? finger.name : "Nearest comfortable finger";
  focusInstrEl.textContent   = HARD_KEYS.includes(focusCurrent)
    ? "Hard key. Move slowly, use the correct finger, then return home."
    : "Find the highlighted key. Press slowly. Return to home row.";
  setCurrentKey(focusCurrent);
  updateFocusKeyboard();
  saveStore();
}

function updateFocusKeyboard(feedbackKey = "", feedbackClass = "") {
  const id = KEY_FINGER[focusCurrent];
  document.querySelectorAll(".fk").forEach(el => {
    const k = el.dataset.key;
    el.classList.toggle("target",      k === focusCurrent);
    el.classList.toggle("same-finger", KEY_FINGER[k] === id && k !== focusCurrent);
    el.classList.remove("correct", "wrong");
  });
  if (feedbackKey && feedbackClass) {
    const el = document.querySelector(`.fk[data-key="${CSS.escape(feedbackKey)}"]`);
    if (el) {
      el.classList.add(feedbackClass);
      setTimeout(() => el.classList.remove(feedbackClass), 160);
    }
  }
  focusStreakEl.textContent  = focusStreak;
  focusCorrectEl.textContent = focusCorrect;
  focusWrongEl.textContent   = focusWrong;
}

function openFocus() {
  paused = true; focusOpen = true;
  focusLayer.classList.add("open");
  buildKeyboard(focusKeyboardEl, true);
  nextFocusKey();
}

function closeFocus() {
  focusOpen = false;
  focusLayer.classList.remove("open");
  setCurrentKey(keys[0]?.char || "—");
  paused = false;
}

function handleFocusKey(key) {
  if (key === "space") return;
  if (key === focusCurrent) {
    focusCorrect++; focusStreak++; hits++; streak++;
    score += 6 + Math.min(focusStreak, 20);
    savePracticeEvent("hit", key);
    updateFocusKeyboard(key, "correct");
    setTimeout(nextFocusKey, 120);
  } else {
    focusWrong++; focusStreak = 0; wrong++; streak = 0;
    weak[key] = (weak[key] || 0) + 1;
    savePracticeEvent("wrong", key);
    updateFocusKeyboard(key, "wrong");
    focusInstrEl.textContent = "Wrong key. Look at the orange key. Do not rush.";
  }
  updateStats();
}

/* ─── Event listeners ──────────────────────────────────────────── */

startBtn.addEventListener("click", startGame);
pauseBtn.addEventListener("click", pauseGame);
resetBtn.addEventListener("click", resetGame);
clearStorageBtn.addEventListener("click", clearStorage);
openFocusBtn.addEventListener("click", openFocus);
closeFocusBtn.addEventListener("click", closeFocus);
focusNextBtn.addEventListener("click", nextFocusKey);

document.addEventListener("keydown", (e) => {
  if (e.key === "Tab") { e.preventDefault(); return; }

  // ── Focus mode: intercept all input ──────────────────────────
  if (focusOpen) {
    if (e.key === "Escape") { e.preventDefault(); closeFocus(); return; }
    if (e.key === "Enter")  { e.preventDefault(); nextFocusKey(); return; }
    const focusModes = ["home","letters","hard","left","right","code"];
    if (/^[1-6]$/.test(e.key)) {
      e.preventDefault();
      focusModeEl.value = focusModes[Number(e.key) - 1];
      nextFocusKey();
      return;
    }
    const key = normalizeKey(e.key);
    if (key.length === 1) { e.preventDefault(); handleFocusKey(key); }
    return;
  }

  // ── Space always toggles pause/start (not a game letter) ─────
  if (e.code === "Space") {
    e.preventDefault();
    if (!running || paused) startGame(); else pauseGame();
    return;
  }

  // ── Escape always resets (not a game letter) ──────────────────
  if (e.key === "Escape") { resetGame(); return; }

  // ── F and R only work as shortcuts when NOT actively playing ──
  // During active play they go to handleHit so 'f' / 'r' keys score normally.
  if (!running || paused) {
    if (e.key.toLowerCase() === "f") { e.preventDefault(); openFocus(); return; }
    if (e.key.toLowerCase() === "r") { e.preventDefault(); resetGame(); return; }
  }

  // ── All other keys: game input ────────────────────────────────
  const key = normalizeKey(e.key);
  if (key.length === 1) { e.preventDefault(); handleHit(key); }
});

modeSelect.addEventListener("change", () => { resetGame(); showToast("Mode changed"); });
focusModeEl.addEventListener("change", nextFocusKey);
adaptiveEl.addEventListener("change", () => {
  saveStore();
  showToast(adaptiveEl.checked ? "Adaptive on" : "Adaptive off");
});

/* ─── Sidebar toggles ──────────────────────────────────────────── */
const leftSidebar  = document.getElementById("leftSidebar");
const rightSidebar = document.getElementById("rightSidebar");
const leftToggle   = document.getElementById("leftToggle");
const rightToggle  = document.getElementById("rightToggle");

leftToggle.addEventListener("click", () => {
  leftSidebar.classList.toggle("collapsed");
  leftToggle.classList.toggle("active");
});
rightToggle.addEventListener("click", () => {
  rightSidebar.classList.toggle("collapsed");
  rightToggle.classList.toggle("active");
});

/* ─── Theme cycle (Japan → Rosé Pine → Black → Light → …) ─────── */
const themeToggle = document.getElementById("themeToggle");
const THEMES = ["japan", "rose", "black", "light"];
const THEME_LABELS = {
  japan: "⛩ Japan",
  rose:  "🌸 Rosé Pine",
  black: "◼ Black",
  light: "☀ Light"
};
let currentTheme = localStorage.getItem("fallingKeys.theme") || "japan";

function applyTheme(t) {
  THEMES.forEach(n => document.body.classList.remove("theme-" + n));
  document.body.classList.add("theme-" + t);
  currentTheme = t;
  themeToggle.textContent = THEME_LABELS[t];
  localStorage.setItem("fallingKeys.theme", t);
}

applyTheme(currentTheme);

themeToggle.addEventListener("click", () => {
  applyTheme(THEMES[(THEMES.indexOf(currentTheme) + 1) % THEMES.length]);
});

/* ─── Init ─────────────────────────────────────────────────────── */
modeSelect.value   = store.settings?.mode      || "letters";
focusModeEl.value  = store.settings?.focusMode || "letters";
adaptiveEl.checked = store.settings?.adaptive  !== false;

buildKeyboard(keyboardEl, false);
buildLegend();
renderToday();
setCurrentKey("—");
updateStats();
raf = requestAnimationFrame(loop);
