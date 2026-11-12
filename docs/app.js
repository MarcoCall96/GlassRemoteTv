const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

if (new URLSearchParams(location.search).has("mock")) document.documentElement.classList.add("mock");

/* iOS sometimes opens a Home Screen app in a window shorter than the screen (blank band at the bottom): fill the real screen */
if (navigator.standalone === true) {
  const fit = () => {
    const full = Math.max(screen.width, screen.height), gap = full - innerHeight;
    if (innerHeight > innerWidth && gap > 8 && gap < 120) document.documentElement.style.setProperty("--app-height", full + "px");
    else document.documentElement.style.removeProperty("--app-height");
  };
  fit();
  for (const ev of ["resize", "orientationchange", "pageshow"]) addEventListener(ev, () => setTimeout(fit, 60));
  document.addEventListener("visibilitychange", () => setTimeout(fit, 60));
}

/* img = official icon in assets/apps (falls back to a Simple Icons logo or initials); bg/fg = fallback colors */
const APPS = [
  { name: "YouTube", img: "youtube", logo: "youtube", bg: "#ffffff", fg: "#ff0000", pkg: "com.google.android.youtube.tv" },
  { name: "Netflix", img: "netflix", logo: "netflix", bg: "#000000", fg: "#e50914", pkg: "com.netflix.ninja" },
  { name: "Prime Video", img: "primevideo", logo: "primevideo", bg: "#00a8e1", fg: "#ffffff", pkg: "com.amazon.amazonvideo.livingroom" },
  { name: "Disney+", img: "disney", glyph: "D+", bg: "#0d2a7a", fg: "#ffffff", pkg: "com.disney.disneyplus" },
  { name: "RaiPlay", img: "raiplay", glyph: "Rai", bg: "#0a3dff", fg: "#ffffff", pkg: "it.rainet.androidtv.raiplay" },
  { name: "Infinity+", img: "infinity", glyph: "∞", bg: "#101820", fg: "#ffd24a", pkg: "it.mediaset.infinitytv" },
  { name: "DAZN", img: "dazn", logo: "dazn", bg: "#0c0c0c", fg: "#f8f8f5", pkg: "com.dazn" },
  { name: "Spotify", img: "spotify", logo: "spotify", bg: "#000000", fg: "#1ed760", pkg: "com.spotify.tv.android" },
  { name: "Apple TV", img: "appletv", logo: "appletv", bg: "#000000", fg: "#ffffff", pkg: "com.apple.atve.androidtv.appletv" },
  { name: "Paramount+", img: "paramount", logo: "paramountplus", bg: "#0064ff", fg: "#ffffff", pkg: "com.cbs.ca" },
  { name: "Plex", img: "plex", logo: "plex", bg: "#1f2326", fg: "#e5a00d", pkg: "com.plexapp.android" },
  { name: "Kodi", img: "kodi", logo: "kodi", bg: "#10222d", fg: "#17b2e7", pkg: "org.xbmc.kodi" },
];
const CUSTOM_COLORS = ["#7a7bff", "#34d399", "#f59e0b", "#ec4899", "#14b8a6", "#f97316"];
function appLogo(a) {
  const style = `background:${a.bg || a.color || "#445"};color:${a.fg || "#fff"}`;
  const l = typeof APP_LOGOS !== "undefined" && a.logo && APP_LOGOS[a.logo];
  const fallback = l ? `<svg viewBox="${l.vb}" fill="currentColor" stroke="none" aria-hidden="true"><path d="${l.d}"/></svg>` : esc(a.glyph || (a.name || "?")[0]);
  const cls = l ? "logo" : `glyph ${(a.glyph || "").length > 2 ? "wide" : ""}`;
  if (a.img) return `<i class="photo ${cls}" style="${style}">${fallback}<img src="./assets/apps/${a.img}.jpg" alt="" loading="lazy" onerror="this.remove()"></i>`;
  return `<i class="${cls}" style="${style}">${fallback}</i>`;
}

const BRANDS = [
  { id: "androidtv", label: "Android TV", ready: true },
  { id: "samsung", label: "Samsung" },
  { id: "lg", label: "LG" },
  { id: "sony", label: "Sony" },
  { id: "roku", label: "Roku" },
  { id: "firetv", label: "Fire TV" },
];

const BRAND_LOOK = {
  androidtv: { text: "android tv", thin: true },
  samsung: { text: "Samsung" }, lg: { text: "LG" }, sony: { text: "Sony" }, roku: { text: "Roku" }, firetv: { text: "fire tv", thin: true },
};

const DEFAULT_SCENES = [
  { id: "cinema", name: "Cinema", icon: "film", color: "red", app: "com.netflix.ninja", volume: 30, timer: 0 },
  { id: "notte", name: "Night", icon: "moon", color: "indigo", app: "", volume: 10, timer: 30 },
];
/* The two built-in scenes follow the app language as long as they keep their original name */
const sceneName = (s) =>
  s.id === "cinema" && /^(cinema|cine|cinéma|kino)$/i.test(s.name) ? tr("scenes.cinema")
  : s.id === "notte" && /^(notte|night|noche|nuit|nacht|noite)$/i.test(s.name) ? tr("scenes.night")
  : s.name;

/* Scene icons (thin stroke, SF Symbols style) and colors */
const ICONS = {
  film: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M8 5v14M16 5v14M3 10h5M3 14h5M16 10h5M16 14h5"/>',
  moon: '<path d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.2 8.2 0 1 0 10.2 10.2z"/>',
  music: '<path d="M9 18V5.5l11-2V16"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4.5c0 3 1.5 4.6 3.8 5M16 6h3.5c0 3-1.5 4.6-3.8 5M12 13v4M8 20h8M10 17h4"/>',
  game: '<rect x="3" y="8" width="18" height="10" rx="5"/><path d="M8 11v4M6 13h4M15.5 12h.01M17.5 14h.01"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6L7 7M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4"/>',
  smile: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14c1 1.5 2.2 2 3.5 2s2.5-.5 3.5-2M9 9.5h.01M15 9.5h.01"/>',
  news: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 9h8M8 13h8M8 17h5"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>',
  spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.7 1.8 1.8.7-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7z"/>',
  clock: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 3h6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  pencil: '<path d="M4 20h4L19 9l-4-4L4 16zM13 7l4 4"/>',
};
const SCENE_COLORS = {
  red: ["#ff7a7a", "#e63950"], orange: ["#ffb865", "#ff7a2f"], green: ["#62e8ae", "#1fb67a"],
  teal: ["#6adcf2", "#2a9fd8"], indigo: ["#9a9aff", "#5f5af0"], pink: ["#ff86c8", "#e1409c"],
};
const iconSvg = (k, cls = "") => `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true">${ICONS[k] || ICONS.spark}</svg>`;
const sceneVars = (s) => { const [a, b] = SCENE_COLORS[s.color] || SCENE_COLORS.indigo; return `--c1:${a};--c2:${b}`; };

const store = {
  get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
};

const state = {
  bridge: localStorage.getItem("bridge") || "",
  tvs: store.get("tvs", null) || [
    { id: "demo", name: "Demo TV", host: "tv-demo", brand: "androidtv", kind: "Android TV", fav: true },
  ],
  current: 0,
  filter: "all",
  ignored: store.get("ignored", []),
  haptic: localStorage.getItem("haptic") !== "0",
  onehand: localStorage.getItem("onehand") === "1",
  customApps: store.get("customApps", []),
  hiddenApps: store.get("hiddenApps", []),
  recents: store.get("recents", []),
  scenes: DEFAULT_SCENES,
  editApps: false,
  editScene: null,
  editScenes: false,
  draft: null,
  conns: {},
  tvState: {},
  pairHost: "",
  reach: {},
  bridgeOk: null,
  newBrand: "androidtv",
};
if (!state.tvs.some((t) => "fav" in t) && state.tvs[0]) state.tvs[0].fav = true;
state.filter = state.tvs.some((t) => t.fav) ? "fav" : "all";
$$("#favSeg button").forEach((b) => { const on = b.dataset.filter === state.filter; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
$("#app").classList.toggle("onehand", state.onehand);

const saveTvs = () => store.set("tvs", state.tvs);
const currentTv = () => state.tvs[state.current];
const tvSt = (tv) => (tv && state.tvState[tv.host]) || null;
const isLinked = (tv) => !!(tv && tv.on && tvSt(tv) && tvSt(tv).connected);
const SYSTEM_APPS = {
  "com.google.android.backdrop": "sys.screensaver",
  "com.google.android.tvlauncher": "sys.home",
  "com.google.android.apps.tv.launcherx": "sys.home",
  "com.android.tv.settings": "sys.settings",
  "com.google.android.tvrecommendations": "sys.home",
  "com.android.vending": "sys.playStore",
};
const appInfo = (pkg) => APPS.find((a) => a.pkg === pkg) || state.customApps.find((a) => a.pkg === pkg) || { name: (SYSTEM_APPS[pkg] && tr(SYSTEM_APPS[pkg])) || (pkg && pkg.split(".").pop().replace(/^./, (c) => c.toUpperCase())) || "—", bg: "#3a4056", fg: "#fff" };

/* iOS only paints :active on touch devices when a touch listener exists: this gives instant press feedback */
document.addEventListener("touchstart", () => {}, { passive: true });

/* leaving elements fade out on a copy, so the real one can be hidden at once and the code that reads `hidden` stays simple */
function ghostOut(el, frames, ms = 170) {
  if (reduceMotion || !el || el.hidden || !el.animate) return;
  const g = el.cloneNode(true);
  g.removeAttribute("id");
  g.querySelectorAll("[id]").forEach((n) => n.removeAttribute("id"));
  g.dataset.ghost = "";
  g.style.animation = "none"; g.style.pointerEvents = "none";
  g.setAttribute("aria-hidden", "true"); g.inert = true;
  el.after(g);
  const done = () => g.remove();
  g.animate(frames, { duration: ms, easing: "cubic-bezier(.3, 0, .8, .4)", fill: "forwards" }).finished.then(done, done);
}

/* ---------- toasts ---------- */
let toastTimer = null;
function toast(msg, ms = 2400) {
  const t = $("#toast");
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    ghostOut(t, [{ opacity: 1 }, { opacity: 0, transform: "translateX(-50%) translateY(8px)" }], 150);
    t.hidden = true;
  }, ms);
}

/* ---------- glass lens: placed on the real size of the active button ---------- */
function placeLens(box, btn) {
  if (!box || !btn) return;
  box.style.setProperty("--lx", btn.offsetLeft + "px");
  box.style.setProperty("--lw", btn.offsetWidth + "px");
}
function refreshLenses() {
  placeLens($("#tabbar"), $(".tab.on"));
  placeLens($("#modeSeg"), $("#modeSeg button.on"));
  placeLens($("#favSeg"), $("#favSeg button.on"));
  placeLens($("#healthSeg"), $("#healthSeg button.on"));
  placeLens($("#mFreq"), $("#mFreq button.on"));
}
addEventListener("resize", refreshLenses);

/* ---------- navigation ---------- */
function go(screen) {
  $$(".screen").forEach((s) => s.classList.toggle("active", s.id === "screen-" + screen));
  /* the TV health screen hangs off Settings, so that tab stays lit */
  const tab = screen === "health" ? "settings" : screen;
  $$(".tab").forEach((t) => { const on = t.dataset.screen === tab; t.classList.toggle("on", on); on ? t.setAttribute("aria-current", "page") : t.removeAttribute("aria-current"); });
  refreshLenses();
  healthSync();
}
$("#tabbar").addEventListener("click", (e) => { const t = e.target.closest(".tab"); if (t) go(t.dataset.screen); });

/* ---------- status ---------- */
function tvStatus(tv) {
  const st = tvSt(tv);
  return tv.on && state.bridgeOk === false ? ["off", tr("status.bridgeOff")]
    : tv.on && st && st.connected ? ["on", tr("status.linked")]
    : tv.on && st && st.pairing ? ["warn", tr("status.pairing")]
    : tv.on && st && st.error ? ["off", tr("status.noReply")]
    : tv.on ? ["warn", tr("status.connecting")]
    : ["", tr("status.off")];
}

/* ---------- TV list ---------- */
function renderTvs() {
  const shown = state.tvs.map((t, i) => ({ t, i }))
    .filter(({ t }) => state.filter === "all" || t.fav)
    .sort((a, b) => (state.filter === "all" ? Number(!!b.t.fav) - Number(!!a.t.fav) : 0) || a.i - b.i);
  const cards = shown.map(({ t, i }) => {
    const look = BRAND_LOOK[t.brand] || { text: t.brand };
    const [cls, label] = tvStatus(t);
    return `<div class="tv-card ${i === state.current ? "sel" : ""}" data-i="${i}">
      <button class="card-open" aria-label="${esc(tr("tv.details", { name: t.name }))}"></button>
      <span class="top-row">
        <button class="mini star ${t.fav ? "on" : ""}" data-star="${i}" aria-pressed="${!!t.fav}" aria-label="${esc(tr(t.fav ? "tv.unfav" : "tv.fav", { name: t.name }))}"><svg viewBox="0 0 24 24"><path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9 6.8 19.7l1-5.9L3.5 9.7l5.9-.8z"/></svg></button>
        ${i === state.current ? `<span class="badge">${tr("tv.selected")}</span>` : ""}
      </span>
      <span class="brand ${look.thin ? "thin" : ""}">${esc(look.text)}</span>
      <span class="name">${esc(t.name)}</span>
      <span class="meta"><span class="status"><span class="dot ${cls}"></span>${label}</span>
        <button class="tog ${t.on ? "on" : ""}" role="switch" aria-checked="${!!t.on}" aria-label="${esc(tr("tv.link", { name: t.name }))}" data-toggle="${i}"><i></i></button></span>
    </div>`;
  }).join("");
  const empty = state.filter === "fav" && !shown.length
    ? `<p class="footnote span2">${tr("tv.noFav")}</p>` : "";
  $("#tvGrid").innerHTML = cards + empty +
    (state.filter === "all" ? `<button class="tv-card add" id="addCard"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>${tr("tv.addCard")}</button>` : "");
  const cur = currentTv();
  $("#tvName").textContent = cur ? cur.name : tr("tv.none");
  renderHero();
}

$("#favSeg").addEventListener("click", (e) => {
  const b = e.target.closest("[data-filter]");
  if (!b) return;
  state.filter = b.dataset.filter;
  $$("#favSeg button").forEach((x) => { const on = x === b; x.classList.toggle("on", on); x.setAttribute("aria-pressed", on); });
  refreshLenses();
  renderTvs();
});

$("#tvGrid").addEventListener("click", (e) => {
  if (e.target.closest("#addCard")) return openSheet("addSheet");
  const tog = e.target.closest("[data-toggle]");
  if (tog) { const i = +tog.dataset.toggle; setTvEnabled(i, !state.tvs[i].on); return; }
  const star = e.target.closest("[data-star]");
  if (star) { const t = state.tvs[+star.dataset.star]; t.fav = !t.fav; saveTvs(); renderTvs(); return; }
  const card = e.target.closest(".tv-card[data-i]");
  if (card) {
    const i = +card.dataset.i;
    state.current = i; renderTvs(); refreshRemote();
    openDetail(i, $(`.tv-card[data-i="${i}"]`));
  }
});
$("#addTvTop").addEventListener("click", () => openSheet("addSheet"));

/* ---------- main card: selected TV, quick controls and scenes ---------- */
function timerLeft(st) {
  if (!st || !st.sleep_at) return null;
  const min = Math.ceil((st.sleep_at * 1000 - Date.now()) / 60000);
  return min > 0 ? min : null;
}
function renderHero() {
  const hero = $("#hero");
  const t = currentTv();
  if (!t) { hero.innerHTML = `<div class="hero-card"><h2 class="hero-name">${tr("hero.noTv")}</h2><p class="hint">${tr("hero.noTvHint")}</p></div>`; renderSceneRow(); return; }
  const st = tvSt(t), linked = isLinked(t), [cls, label] = tvStatus(t);
  const extra = linked && st.is_on === false ? [tr("hero.standby")] : linked ? [tr("hero.on")] : [];
  const app = linked && st.current_app ? appInfo(st.current_app) : null;
  hero.innerHTML = `<div class="hero-card">
    <div class="hero-top">
      <span class="tv-glyph" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="12" rx="2.5"/><path d="M8 21h8M12 17v4"/></svg></span>
      <div class="hero-title"><h2 class="hero-name">${esc(t.name)}</h2>
        <span class="hero-status"><span class="dot ${cls}"></span>${[label, ...extra].join(" · ")}</span></div>
      <button class="power-btn" data-hero="power" aria-label="${esc(tr(linked && st.is_on !== false ? "hero.turnOff" : "hero.turnOn", { name: t.name }))}"><svg viewBox="0 0 24 24"><path d="M12 3v9M6.3 6.8a8 8 0 1 0 11.4 0"/></svg></button>
    </div>
    ${linked ? `
    ${app ? `<div class="now">${appLogo(app)}<div><small>${tr("hero.now")}</small><b>${esc(app.name)}</b></div></div>` : ""}
    <div class="vol-row" role="group" aria-label="${tr("remote.volume")}">
      <button class="glass vbtn rep" data-key="VOLUME_DOWN" aria-label="${tr("remote.volDown")}"><svg viewBox="0 0 24 24"><path d="M5 12h14"/></svg></button>
      <button class="glass vbtn mute" data-key="VOLUME_MUTE" aria-label="${tr("c.mute")}"><svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4zM17 9l4 6M21 9l-4 6"/></svg>${tr("c.mute")}</button>
      <button class="glass vbtn rep" data-key="VOLUME_UP" aria-label="${tr("remote.volUp")}"><svg viewBox="0 0 24 24"><path d="M5 12h14M12 5v14"/></svg></button>
    </div>
    <button class="cta" data-hero="remote">${tr("hero.open")}</button>`
    : `<button class="cta" data-hero="${state.bridgeOk === false && t.on ? "retry" : "connect"}">${state.bridgeOk === false && t.on ? tr("hero.retry") : t.on ? tr("hero.connecting") : tr("c.connect")}</button>`}
  </div>`;
  renderSceneRow();
}
function renderSceneRow() {
  const left = timerLeft(tvSt(currentTv()));
  const row = $("#sceneRow");
  row.classList.toggle("editing", state.editScenes);
  row.innerHTML = state.scenes.map((s) => {
    const bits = [s.app ? appInfo(s.app).name : null, s.volume != null ? tr("scenes.vol", { n: s.volume }) : null, s.timer ? tr("scenes.min", { n: s.timer }) : null].filter(Boolean);
    return `<button class="scene-tile" style="${sceneVars(s)}" data-scene="${esc(s.id)}" aria-label="${esc(tr(state.editScenes ? "scenes.editAria" : "scenes.startAria", { name: sceneName(s) }))}">
      <span class="ico">${iconSvg(s.icon)}</span><b>${esc(sceneName(s))}</b><small>${esc(bits.join(" · ") || tr("scenes.noAction"))}</small>
      ${state.editScenes ? `<span class="pencil">${iconSvg("pencil")}</span>` : ""}</button>`;
  }).join("") +
    `<button class="scene-tile timer ${left ? "active" : ""}" data-hero="timer"><span class="ico">${iconSvg("clock")}</span><b>${tr("scenes.timer")}</b><small>${left ? tr("scenes.timerLeft", { n: left }) : tr("scenes.timerIdle")}</small></button>` +
    (state.editScenes ? `<button class="scene-tile add" id="sceneNew" aria-label="${tr("scenes.new")}">${iconSvg("plus")}${tr("scenes.new")}</button>` : "");
}
$("#scenesEdit").addEventListener("click", (e) => {
  state.editScenes = !state.editScenes;
  paintEditButtons();
  e.currentTarget.setAttribute("aria-pressed", state.editScenes);
  renderSceneRow();
  if (state.editScenes) $("#sceneRow").scrollTo({ left: 1e4, behavior: "smooth" });
});
function paintEditButtons() {
  $("#scenesEdit").textContent = tr(state.editScenes ? "c.done" : "c.edit");
  $("#appsEdit").textContent = tr(state.editApps ? "c.done" : "c.edit");
}
function heroClick(e) {
  if (e.target.closest("#sceneNew")) return openSceneEditor("");
  const sc = e.target.closest("[data-scene]");
  if (sc) { state.editScenes ? openSceneEditor(sc.dataset.scene) : runScene(sc.dataset.scene); return; }
  const h = e.target.closest("[data-hero]");
  if (!h) return;
  const t = currentTv();
  if (h.dataset.hero === "remote") return go("remote");
  if (h.dataset.hero === "timer") return openTimer();
  if (h.dataset.hero === "retry") return retryBridge();
  if (h.dataset.hero === "connect") { if (!t.on) setTvEnabled(state.current, true); return; }
  if (h.dataset.hero === "power") {
    if (isLinked(t)) { send({ type: "key", key: "POWER" }); return; }
    setTvEnabled(state.current, true, { type: "wake" });
    toast(tr("hero.wakeToast"));
  }
}
$("#hero").addEventListener("click", heroClick);
$("#sceneRow").addEventListener("click", heroClick);
setInterval(() => { if (timerLeft(tvSt(currentTv()))) renderSceneRow(); }, 30000);

function runScene(id) {
  const t = currentTv(), s = state.scenes.find((x) => x.id === id);
  if (!s) return;
  if (!isLinked(t)) return toast(tr("toast.connectFirst"));
  send({ type: "scene", id });
  toast(tr("scenes.running", { name: sceneName(s) }));
}

/* ---------- sleep timer ---------- */
function openTimer() {
  const left = timerLeft(tvSt(currentTv()));
  $("#timerInfo").textContent = left ? tr("timer.left", { n: left }) : tr("timer.idle");
  openSheet("timerSheet");
}
$("#timerGrid").addEventListener("click", (e) => {
  const b = e.target.closest("[data-min]");
  if (!b) return;
  if (!isLinked(currentTv())) return toast(tr("toast.connectFirst"));
  const min = +b.dataset.min;
  send({ type: "sleep_timer", minutes: min });
  toast(min ? tr("timer.set", { n: min }) : tr("timer.canceled"));
  closeSheets();
});

/* ---------- sheets ---------- */
function openSheet(id) {
  closeSheets(true);
  $("#sheetBackdrop").hidden = false;
  const s = $("#" + id);
  s.hidden = false; s.tabIndex = -1; s.focus({ preventScroll: true });
}
function closeSheets(keepBackdrop) {
  const closing = keepBackdrop !== true;
  if (closing) { ghostOut($("#sheetBackdrop"), [{ opacity: 1 }, { opacity: 0 }], 150); $("#sheetBackdrop").hidden = true; }
  $$(".sheet:not([data-ghost])").forEach((s) => {
    if (closing) ghostOut(s, [{ transform: "translateY(0)", opacity: 1 }, { transform: "translateY(32px)", opacity: 0 }], 170);
    s.hidden = true;
  });
}
$("#sheetBackdrop").addEventListener("click", () => { closeSheets(); closeDetail(); });
addEventListener("keydown", (e) => { if (e.key === "Escape") { closeSheets(); closeDetail(); } });

function renderBrands() {
  $("#brandGrid").innerHTML = BRANDS.map((b) =>
    `<button class="brand-chip ${b.ready ? "" : "soon"} ${b.id === state.newBrand ? "sel" : ""}" data-brand="${b.id}" aria-pressed="${b.id === state.newBrand}">${b.label}<small>${tr(b.ready ? "brand.ready" : "brand.soon")}</small></button>`).join("");
}
renderBrands();
$("#brandGrid").addEventListener("click", (e) => {
  const c = e.target.closest("[data-brand]");
  if (!c) return;
  state.newBrand = c.dataset.brand;
  $$(".brand-chip").forEach((x) => { x.classList.toggle("sel", x === c); x.setAttribute("aria-pressed", x === c); });
});
$("#saveTv").addEventListener("click", () => {
  const name = $("#newName").value.trim() || tr("add.defaultName");
  const host = $("#newHost").value.trim();
  const b = BRANDS.find((x) => x.id === state.newBrand);
  state.tvs.push({ id: String(Date.now()), name, host, brand: b.id, kind: b.label });
  saveTvs(); $("#newName").value = ""; $("#newHost").value = ""; closeSheets(); renderTvs();
});

/* ---------- quick TV switch ---------- */
function openSwitch() {
  $("#switchList").innerHTML = state.tvs.map((t, i) => {
    const [cls, label] = tvStatus(t);
    return `<button class="switch-row ${i === state.current ? "sel" : ""}" data-pick="${i}" aria-pressed="${i === state.current}">
      <span class="dot ${cls}"></span><span class="sw-name">${esc(t.name)}${t.fav ? " ★" : ""}</span><small>${label}</small>
      ${i === state.current ? `<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7"/></svg>` : ""}</button>`;
  }).join("") + `<button class="switch-row add" data-pick="new"><span class="sw-name">${tr("switch.add")}</span></button>`;
  openSheet("switchSheet");
}
$("#switchList").addEventListener("click", (e) => {
  const b = e.target.closest("[data-pick]");
  if (!b) return;
  if (b.dataset.pick === "new") return openSheet("addSheet");
  state.current = +b.dataset.pick;
  renderTvs(); refreshRemote(); refreshApps(); renderSiri();
  closeSheets();
  toast(tr("switch.selected", { name: currentTv().name }));
});
$("#tvTitle").addEventListener("click", openSwitch);
$("#offSwitch").addEventListener("click", openSwitch);
$("#appsTv").addEventListener("click", openSwitch);

/* ---------- connection to the receiver ---------- */
function defaultBridge() {
  const onGithub = location.hostname.endsWith("github.io");
  return location.protocol.startsWith("http") && !onGithub ? `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws` : "";
}
const bridgeUrl = () => state.bridge || defaultBridge();
const bridgeHttp = () => bridgeUrl().replace(/^ws/, "http").replace(/\/ws.*$/, "");

/* PIN of the TV app: typed once (or scanned from the QR code), then kept as a token */
const getToken = () => { try { return localStorage.getItem("gr.token") || ""; } catch { return ""; } };
const setToken = (t) => { try { t ? localStorage.setItem("gr.token", t) : localStorage.removeItem("gr.token"); } catch { /* private mode */ } };
let scannedPin = "";
{
  /* the QR code puts the PIN in the address fragment (#pin=...), which is never sent to the server nor kept in its logs */
  const hp = new URLSearchParams(location.hash.replace(/^#/, ""));
  const p = new URLSearchParams(location.search);
  if (hp.has("pin") || p.has("pin")) {
    scannedPin = ((hp.get("pin") || p.get("pin")) || "").replace(/\D/g, "").slice(0, 6);
    p.delete("pin");
    hp.delete("pin");
    const q = p.toString(), h = hp.toString();
    history.replaceState(null, "", location.pathname + (q ? "?" + q : "") + (h ? "#" + h : ""));
  }
}
async function fetchJson(url, opts = {}, ms = 7000) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), ms);
  try {
    const t = getToken();
    const r = await fetch(url, { ...opts, headers: t ? { ...(opts.headers || {}), "x-gr-token": t } : opts.headers, signal: ctl.signal });
    if (!r.ok) {
      let body = null;
      try { body = await r.json(); } catch { /* not JSON */ }
      throw Object.assign(new Error(r.status), { status: r.status, body });
    }
    return await r.json();
  } finally { clearTimeout(timer); }
}

function openConn(tv) {
  const base = bridgeUrl();
  if (!base) { state.bridgeOk = false; return null; }
  const old = state.conns[tv.host];
  if (old && old.readyState <= 1) return old;
  let ws;
  try { ws = new WebSocket(`${base}?host=${encodeURIComponent(tv.host)}${getToken() ? "&token=" + encodeURIComponent(getToken()) : ""}`); } catch { return null; }
  state.conns[tv.host] = ws;
  ws.onopen = () => { state.bridgeOk = true; ws.send(JSON.stringify({ type: "set_enabled", enabled: !!tv.on })); };
  ws.onclose = () => {
    if (state.conns[tv.host] !== ws) return;
    delete state.conns[tv.host];
    state.tvState[tv.host] = null;
    if (!Object.values(state.conns).some((w) => w.readyState === 1)) state.bridgeOk = false;
    renderTvs(); refreshRemote();
    if (tv.on) setTimeout(() => { if (tv.on && !state.conns[tv.host]) openConn(tv); }, 4000);
  };
  ws.onmessage = (ev) => {
    let m; try { m = JSON.parse(ev.data); } catch { return; }
    if (m.type === "auth_required") {
      setToken("");
      state.pinHost = tv.host;
      if (scannedPin) { const p = scannedPin; scannedPin = ""; ws.send(JSON.stringify({ type: "auth", pin: p })); }
      else { $("#pinMsg").textContent = ""; $("#pinCode").value = ""; openSheet("pinSheet"); }
      return;
    }
    if (m.type === "auth_error") {
      $("#pinMsg").textContent = errText(m.code);
      if ($("#pinSheet").hidden) openSheet("pinSheet");
      return;
    }
    if (m.type === "auth_ok") {
      setToken(m.token);
      if (!$("#pinSheet").hidden) closeSheets();
      /* the connect request sent when the socket opened came before the sign-in and was ignored: send it again */
      if (tv.on) ws.send(JSON.stringify({ type: "set_enabled", enabled: true }));
      return;
    }
    if (m.type !== "state") return;
    state.tvState[m.host] = { connected: m.tv_connected, pairing: m.needs_pairing, enabled: m.enabled, error: m.error,
      is_on: m.is_on, current_app: m.current_app, volume: m.volume, sleep_at: m.sleep_at };
    if (m.needs_pairing && tv.on) { state.pairHost = m.host; $("#pairMsg").textContent = errText(m.error); openSheet("pairSheet"); }
    else if (state.pairHost === m.host && !$("#pairSheet").hidden) closeSheets();
    renderTvs(); refreshRemote(); refreshApps();
  };
  return ws;
}
function connectAll() { state.tvs.forEach((t) => { if (t.on) openConn(t); }); }
function closeAll() { Object.values(state.conns).forEach((ws) => { ws.onclose = null; ws.close(); }); state.conns = {}; state.tvState = {}; }

function setTvEnabled(i, on, after) {
  const tv = state.tvs[i];
  tv.on = on; saveTvs();
  if (on) {
    const ws = openConn(tv);
    const go1 = () => { ws.send(JSON.stringify({ type: "set_enabled", enabled: true })); if (after) ws.send(JSON.stringify(after)); };
    if (ws) (ws.readyState === 1 ? go1() : ws.addEventListener("open", () => { if (after) ws.send(JSON.stringify(after)); }, { once: true }));
  } else {
    const ws = state.conns[tv.host];
    if (ws && ws.readyState === 1) ws.send(JSON.stringify({ type: "set_enabled", enabled: false }));
    state.tvState[tv.host] = null;
    if (state.pairHost === tv.host) closeSheets();
    setTimeout(() => { if (!tv.on && state.conns[tv.host]) { state.conns[tv.host].onclose = null; state.conns[tv.host].close(); delete state.conns[tv.host]; } }, 400);
  }
  renderTvs(); refreshRemote(); refreshApps(); paintDetailHead();
}

/* the receiver sends error codes (see receiver/bridge.py); unknown text is shown as it is */
const errText = (code) => (code ? (I18N.en && I18N.en["err." + code] ? tr("err." + code) : code) : "");

function refreshRemote() {
  const tv = currentTv();
  const linked = isLinked(tv);
  const [cls] = tv ? tvStatus(tv) : [""];
  $("#statusDot").className = "dot " + cls;
  const off = $("#remoteOff");
  off.hidden = linked || !tv;
  if (!tv || linked) return;
  const st = tvSt(tv), btn = $("#offConnect");
  if (!tv.on) { $("#offMsg").textContent = tr("off.disc"); $("#offSub").textContent = tr("off.discSub"); btn.textContent = tr("c.connect"); btn.hidden = false; }
  else if (state.bridgeOk === false) { $("#offMsg").textContent = tr("off.noBridge"); $("#offSub").textContent = tr("off.noBridgeSub"); btn.textContent = tr("c.retry"); btn.hidden = false; }
  else if (st && st.pairing) { $("#offMsg").textContent = tr("off.waitCode"); $("#offSub").textContent = tr("off.waitCodeSub"); btn.hidden = true; }
  else { $("#offMsg").textContent = st && st.error ? tr("off.noReply") : tr("off.connecting"); $("#offSub").textContent = st && st.error ? errText(st.error) : tr("off.connectingSub"); btn.hidden = true; }
}
function retryBridge() { toast(tr("toast.retryBridge")); closeAll(); connectAll(); scan(); }
$("#offConnect").addEventListener("click", () => { if (state.bridgeOk === false && currentTv() && currentTv().on) retryBridge(); else setTvEnabled(state.current, true); });

function send(msg) {
  const tv = currentTv();
  const ws = tv && state.conns[tv.host];
  if (!isLinked(tv) || !ws || ws.readyState !== 1) { toast(tr("toast.notLinked")); return false; }
  ws.send(JSON.stringify(msg));
  return true;
}

$("#pinBtn").addEventListener("click", () => {
  const ws = state.conns[state.pinHost];
  const pin = $("#pinCode").value.replace(/\D/g, "");
  if (ws && ws.readyState === 1 && pin) ws.send(JSON.stringify({ type: "auth", pin }));
  $("#pinCode").value = "";
});

$("#pairBtn").addEventListener("click", () => {
  const ws = state.conns[state.pairHost];
  if (ws && ws.readyState === 1) ws.send(JSON.stringify({ type: "pair", code: $("#pairCode").value.trim() }));
  $("#pairCode").value = "";
});

/* ---------- automatic TV discovery on the home network ---------- */
let scanning = false;
/* the hint line is stored as [key, vars] so it can be repainted when the language changes */
function setScanHint(key, vars, n) { state.scanMsg = [key, vars, n]; paintScanHint(); }
function paintScanHint() {
  const m = state.scanMsg;
  if (!m) return;
  const [key, vars, n] = m;
  $("#scanHint").textContent = key === "scan.result" ? scanResultText(vars) : n != null ? trn(key, n, vars) : tr(key, vars);
}
function scanResultText({ n, added, other }) {
  if (!n) return other ? trn("scan.onlyUnsupported", other) : tr("scan.nothing");
  return trn("scan.found", n) + (added ? ` (${trn("scan.newN", added)})` : "") + "." + (other ? " " + tr("scan.unsupported", { n: other }) : "");
}
function paintConnHint() {
  const key = state.bridgeOk === true ? "conn.ok" : state.bridgeOk === false ? (bridgeHttp() ? "conn.ko" : "conn.none") : "conn.waiting";
  $("#connHint").textContent = tr(key);
}
async function scan(force = false) {
  if (force === true) { state.ignored = []; localStorage.removeItem("ignored"); }
  const base = bridgeHttp();
  if (!base) { state.bridgeOk = false; setScanHint("scan.noBridge"); paintConnHint(); renderTvs(); probeHealth(); return; }
  if (scanning) return;
  scanning = true;
  setScanHint("scan.searching");
  try {
    const { tvs } = await fetchJson(base + "/api/discover", {}, 20000);
    state.reach = {};
    let added = 0;
    const usable = tvs.filter((t) => t.controllable);
    for (const t of usable) {
      state.reach[t.host] = true;
      if (!state.tvs.some((x) => x.host === t.host) && !state.ignored.includes(t.host)) {
        const b = BRANDS.find((x) => x.id === t.brand);
        state.tvs.push({ id: String(Date.now() + added), name: t.name, host: t.host, brand: t.brand, kind: b ? b.label : t.kind, fav: false });
        added++;
      }
    }
    if (added) saveTvs();
    setScanHint("scan.result", { n: usable.length, added, other: tvs.length - usable.length });
    state.bridgeOk = true;
  } catch {
    state.reach = {}; state.bridgeOk = false;
    setScanHint("scan.unreachable");
  }
  scanning = false;
  paintConnHint();
  renderTvs();
  probeHealth();
}
$("#scanBtn").addEventListener("click", () => scan(true));
document.addEventListener("visibilitychange", () => { if (!document.hidden) { scan(); connectAll(); } });
addEventListener("online", () => { scan(); connectAll(); });
function parseAddress(v) {
  /* every TV app picks its own port, so the address must include it (shown on the TV next to the QR code) */
  const m = String(v || "").trim().match(/^(?:https?:\/\/)?([A-Za-z0-9.-]{1,253}):(\d{1,5})\/?$/);
  return m && +m[2] >= 1 && +m[2] <= 65535 ? { host: m[1], port: m[2] } : null;
}
const addressText = (ws) => String(ws || "").replace(/^wss?:\/\//, "").replace(/\/ws.*$/, "");
$("#saveBridge").addEventListener("click", () => {
  const raw = $("#bridgeUrl").value.trim();
  const a = raw ? parseAddress(raw) : null;
  if (raw && !a) return toast(tr("settings.bridgeBad"));
  /* an https page cannot open a connection to a device on the home network (browsers block it),
     so from the web page we open the app that the TV itself serves: it connects on its own */
  if (a && location.protocol === "https:") { toast(tr("settings.bridgeOpening")); location.href = `http://${a.host}:${a.port}/`; return; }
  state.bridge = a ? `ws://${a.host}:${a.port}/ws` : "";
  state.bridge ? localStorage.setItem("bridge", state.bridge) : localStorage.removeItem("bridge");
  closeAll(); connectAll(); scan(); loadScenes();
});

/* ---------- keys (auto-repeat while held) ---------- */
function press(code) {
  if (!send({ type: "key", key: code })) return false;
  if (state.haptic && navigator.vibrate) navigator.vibrate(8);
  return true;
}
let holdTimer = null, repeatTimer = null;
function stopHold() { clearTimeout(holdTimer); clearInterval(repeatTimer); }
document.addEventListener("pointerdown", (e) => {
  const b = e.target.closest("[data-key]");
  if (!b) return;
  b.classList.add("on-press");
  if (!press(b.dataset.key)) return;
  if (b.classList.contains("rep")) {
    holdTimer = setTimeout(() => { repeatTimer = setInterval(() => press(b.dataset.key), 110); }, 320);
  }
});
["pointerup", "pointercancel", "pointerleave"].forEach((ev) =>
  document.addEventListener(ev, () => { stopHold(); $$(".on-press").forEach((x) => x.classList.remove("on-press")); }, true));

/* ---------- modes: arrows / touch / numbers / keyboard ---------- */
$("#modeSeg").addEventListener("click", (e) => {
  const b = e.target.closest("[data-mode]");
  if (!b) return;
  const buttons = $$("#modeSeg button");
  buttons.forEach((x) => { x.classList.toggle("on", x === b); x.setAttribute("aria-pressed", x === b); });
  refreshLenses();
  $$(".mode-pane").forEach((p) => p.classList.toggle("active", p.dataset.pane === b.dataset.mode));
});

/* touchpad with feedback */
(function touchpad() {
  const pad = $("#touchpad"), dot = $("#tpDot");
  let lx = 0, ly = 0, moved = false;
  const STEP = 44;
  const flash = (dir) => { const c = $(`.tp.${dir}`, pad); c.classList.add("on"); setTimeout(() => c.classList.remove("on"), 130); };
  const place = (e) => { const r = pad.getBoundingClientRect(); dot.style.left = e.clientX - r.left + "px"; dot.style.top = e.clientY - r.top + "px"; };
  pad.addEventListener("pointerdown", (e) => { pad.setPointerCapture(e.pointerId); lx = e.clientX; ly = e.clientY; moved = false; dot.hidden = false; place(e); });
  pad.addEventListener("pointermove", (e) => {
    if (!pad.hasPointerCapture(e.pointerId)) return;
    place(e);
    const dx = e.clientX - lx, dy = e.clientY - ly;
    if (Math.abs(dx) < STEP && Math.abs(dy) < STEP) return;
    moved = true;
    const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up");
    press({ right: "DPAD_RIGHT", left: "DPAD_LEFT", down: "DPAD_DOWN", up: "DPAD_UP" }[dir]);
    flash(dir);
    lx = e.clientX; ly = e.clientY;
  });
  const end = () => { dot.hidden = true; };
  pad.addEventListener("pointerup", () => { if (!moved) { press("DPAD_CENTER"); pad.classList.add("tap"); setTimeout(() => pad.classList.remove("tap"), 120); } end(); });
  pad.addEventListener("pointercancel", end);
})();

/* ---------- keyboard: real input field (iOS dictation) + QWERTY + paste ---------- */
const LAYERS = {
  letters: [["q","w","e","r","t","y","u","i","o","p"], ["a","s","d","f","g","h","j","k","l"], ["SHIFT","z","x","c","v","b","n","m","BKSP"]],
  numbers: [["1","2","3","4","5","6","7","8","9","0"], ["-","/",":",";","(",")","€","&","@"], ["SYM",".",",","?","!","'","\"","BKSP"]],
};
const kb = { layer: "letters", shift: false, last: "" };
const kbInput = $("#kbInput");
function renderKb() {
  const rows = LAYERS[kb.layer].map((r) => `<div class="kb-row">${r.map((k) => {
    if (k === "SHIFT") return `<button class="k fn ${kb.shift ? "active" : ""}" data-k="SHIFT" aria-label="${tr("kb.shift")}" aria-pressed="${kb.shift}">⇧</button>`;
    if (k === "SYM") return `<button class="k fn" data-k="SYM" aria-label="${tr("kb.symbols")}">#+=</button>`;
    if (k === "BKSP") return `<button class="k fn rep" data-k="BKSP" aria-label="${tr("remote.delete")}">⌫</button>`;
    return `<button class="k" data-k="${k}">${kb.shift ? k.toUpperCase() : k}</button>`;
  }).join("")}</div>`).join("");
  const bottom = `<div class="kb-row">
    <button class="k fn" data-k="LAYER">${kb.layer === "letters" ? "123" : "ABC"}</button>
    <button class="k space" data-k=" ">${tr("kb.space")}</button>
    <button class="k enter" data-k="ENTER">${tr("kb.enter")}</button></div>`;
  $("#kbRows").innerHTML = rows + bottom;
}
function sendTextDiff(v) {
  const old = kb.last;
  if (v.startsWith(old)) { if (v.length > old.length) send({ type: "text", text: v.slice(old.length) }); }
  else if (old.startsWith(v)) { for (let i = 0; i < old.length - v.length; i++) send({ type: "key", key: "DEL" }); }
  else { for (let i = 0; i < old.length; i++) send({ type: "key", key: "DEL" }); send({ type: "text", text: v }); }
  kb.last = v;
}
kbInput.addEventListener("input", () => sendTextDiff(kbInput.value));
kbInput.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); send({ type: "key", key: "ENTER" }); kbInput.value = ""; kb.last = ""; } });
function kbPress(k) {
  if (state.haptic && navigator.vibrate) navigator.vibrate(6);
  if (k === "SHIFT") { kb.shift = !kb.shift; return renderKb(); }
  if (k === "LAYER" || k === "SYM") { kb.layer = kb.layer === "letters" ? "numbers" : "letters"; kb.shift = false; return renderKb(); }
  if (k === "BKSP") { kbInput.value = kbInput.value.slice(0, -1); return sendTextDiff(kbInput.value); }
  if (k === "ENTER") { send({ type: "key", key: "ENTER" }); kbInput.value = ""; kb.last = ""; return; }
  const ch = kb.shift && k.length === 1 ? k.toUpperCase() : k;
  kbInput.value += ch; sendTextDiff(kbInput.value);
  if (kb.shift) { kb.shift = false; renderKb(); }
}
let kbHold = null, kbRep = null;
$("#kbRows").addEventListener("pointerdown", (e) => {
  const b = e.target.closest("[data-k]");
  if (!b) return;
  e.preventDefault();
  kbPress(b.dataset.k);
  if (b.dataset.k === "BKSP") kbHold = setTimeout(() => { kbRep = setInterval(() => kbPress("BKSP"), 90); }, 320);
});
["pointerup", "pointercancel", "pointerleave"].forEach((ev) =>
  $("#kbRows").addEventListener(ev, () => { clearTimeout(kbHold); clearInterval(kbRep); }));
$("#kbPaste").addEventListener("click", async () => {
  try {
    const text = await navigator.clipboard.readText();
    if (!text) return toast(tr("kb.empty"));
    kbInput.value += text; sendTextDiff(kbInput.value);
  } catch { toast(tr("kb.pasteFail")); }
});
renderKb();

/* ---------- Apps: recents, personal shortcuts, edit mode ---------- */
function tileHtml(a, custom) {
  return `<button class="app-tile" data-app="${esc(a.pkg)}" aria-label="${esc(a.name)}">
    ${state.editApps ? `<span class="x" data-remove="${esc(a.pkg)}" role="button" aria-label="${esc(tr(custom ? "apps.remove" : "apps.hide", { name: a.name }))}">−</span>` : ""}
    ${appLogo(a)}${esc(a.name)}</button>`;
}
function refreshApps() {
  const tv = currentTv(), linked = isLinked(tv);
  const [cls, label] = tv ? tvStatus(tv) : ["", ""];
  $("#appsTv").innerHTML = tv ? `<span class="dot ${cls}"></span><b>${esc(tv.name)}</b><small>${label}</small><svg viewBox="0 0 24 24"><path d="M7 10l5 5 5-5"/></svg>` : tr("tv.none");
  const visible = APPS.filter((a) => !state.hiddenApps.includes(a.pkg));
  const all = [...visible, ...state.customApps];
  const rec = state.recents.map((p) => all.find((a) => a.pkg === p)).filter(Boolean);
  $("#recentsBox").hidden = !rec.length || state.editApps;
  $("#recents").innerHTML = rec.map((a) => tileHtml(a, false)).join("");
  const hiddenN = APPS.length - visible.length;
  $("#appsGrid").innerHTML = visible.map((a) => tileHtml(a, false)).join("") + state.customApps.map((a) => tileHtml(a, true)).join("") +
    `<button class="app-tile add" id="appAdd" aria-label="${tr("apps.addAria")}"><i class="glyph plus">+</i>${tr("c.add")}</button>`;
  $("#appsRestore").hidden = !(state.editApps && hiddenN);
  $("#appsRestore").textContent = tr("apps.restore", { n: hiddenN });
  $("#appsGrid").classList.toggle("editing", state.editApps);
  $("#screen-apps").classList.toggle("dim", !linked && !state.editApps);
  $("#appsHint").textContent = tr(state.editApps ? "apps.hintEdit" : "apps.hint");
}
function launchApp(pkg) {
  if (!isLinked(currentTv())) return toast(tr("toast.connectFirst"));
  const a = appInfo(pkg);
  if (send({ type: "launch", package: pkg })) {
    state.recents = [pkg, ...state.recents.filter((p) => p !== pkg)].slice(0, 4);
    store.set("recents", state.recents); refreshApps();
    toast(tr("apps.opening", { name: a.name }));
  }
}
$("#screen-apps").addEventListener("click", (e) => {
  const rm = e.target.closest("[data-remove]");
  if (rm) {
    const pkg = rm.dataset.remove;
    if (state.customApps.some((a) => a.pkg === pkg)) { state.customApps = state.customApps.filter((a) => a.pkg !== pkg); store.set("customApps", state.customApps); }
    else { state.hiddenApps.push(pkg); store.set("hiddenApps", state.hiddenApps); }
    state.recents = state.recents.filter((p) => p !== pkg); store.set("recents", state.recents);
    refreshApps(); refreshSceneApps();
    return;
  }
  if (e.target.closest("#appAdd")) return openSheet("appSheet");
  if (e.target.closest("#appsRestore")) { state.hiddenApps = []; store.set("hiddenApps", []); refreshApps(); refreshSceneApps(); return; }
  const t = e.target.closest("[data-app]");
  if (t && !state.editApps) launchApp(t.dataset.app);
});
$("#appsEdit").addEventListener("click", (e) => {
  state.editApps = !state.editApps;
  paintEditButtons();
  e.currentTarget.setAttribute("aria-pressed", state.editApps);
  refreshApps();
});
$("#appSave").addEventListener("click", () => {
  const name = $("#appName").value.trim(), pkg = $("#appPkg").value.trim();
  if (!name || !pkg) return toast(tr("apps.needFields"));
  state.customApps.push({ name, pkg, glyph: name[0].toUpperCase(), bg: CUSTOM_COLORS[state.customApps.length % CUSTOM_COLORS.length], fg: "#fff" });
  store.set("customApps", state.customApps);
  $("#appName").value = ""; $("#appPkg").value = "";
  closeSheets(); refreshApps(); refreshSceneApps();
});

/* ---------- scenes (stored in the receiver, so they also work with Siri) ---------- */
async function loadScenes() {
  try { state.scenes = await fetchJson(bridgeHttp() + "/api/scenes", {}, 5000); } catch { /* keep the defaults */ }
  renderHero(); renderSiri();
}
async function saveScenes() {
  try { state.scenes = await fetchJson(bridgeHttp() + "/api/scenes", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(state.scenes) }, 6000); }
  catch { toast(tr("scenes.saveFail")); }
  renderHero(); renderSiri();
}
function refreshSceneApps() {
  const cur = $("#scApp").value;
  $("#scApp").innerHTML = `<option value="">${tr("scenes.noApp")}</option>` + [...APPS.filter((a) => !state.hiddenApps.includes(a.pkg)), ...state.customApps].map((a) => `<option value="${esc(a.pkg)}">${esc(a.name)}</option>`).join("");
  $("#scApp").value = cur;
}
$("#scIcons").innerHTML = Object.keys(ICONS).filter((k) => !["clock", "plus", "pencil"].includes(k))
  .map((k) => `<button role="radio" aria-checked="false" data-icon="${k}" aria-label="${k}">${iconSvg(k)}</button>`).join("");
$("#scColors").innerHTML = Object.entries(SCENE_COLORS)
  .map(([k, [a, b]]) => `<button role="radio" aria-checked="false" data-color="${k}" aria-label="${k}" style="background:linear-gradient(150deg,${a},${b})"></button>`).join("");

function paintScenePreview() {
  const d = state.draft;
  const bits = [d.app ? appInfo(d.app).name : null, d.volume != null ? tr("scenes.vol", { n: d.volume }) : null, d.timer ? tr("scenes.min", { n: d.timer }) : null].filter(Boolean);
  $("#scPreview").setAttribute("style", sceneVars(d));
  $("#scPreview").className = "scene-tile big";
  $("#scPreview").innerHTML = `<span class="ico">${iconSvg(d.icon)}</span><b>${esc(d.name || tr("scenes.new"))}</b><small>${esc(bits.join(" · ") || tr("scenes.noAction"))}</small>`;
  $$("#scIcons button").forEach((b) => b.setAttribute("aria-checked", b.dataset.icon === d.icon));
  $$("#scColors button").forEach((b) => b.setAttribute("aria-checked", b.dataset.color === d.color));
}
function openSceneEditor(id) {
  const s = state.scenes.find((x) => x.id === id);
  state.editScene = s ? s.id : "";
  state.draft = s ? { ...s, icon: ICONS[s.icon] ? s.icon : "spark" } : { id: "", name: "", icon: "film", color: "indigo", app: "", volume: null, timer: 0 };
  const d = state.draft;
  $("#sceneTitle").textContent = tr(s ? "scenes.edit" : "scenes.new");
  $("#scName").value = sceneName(d); $("#scApp").value = d.app || "";
  $("#scVol").value = d.volume == null ? -1 : d.volume; $("#scVolOut").textContent = d.volume == null ? tr("scenes.dontChange") : d.volume;
  $("#scTimer").value = String(d.timer || 0);
  $("#scDelete").hidden = !s;
  paintScenePreview();
  openSheet("sceneSheet");
}
$("#scIcons").addEventListener("click", (e) => { const b = e.target.closest("[data-icon]"); if (b) { state.draft.icon = b.dataset.icon; paintScenePreview(); } });
$("#scColors").addEventListener("click", (e) => { const b = e.target.closest("[data-color]"); if (b) { state.draft.color = b.dataset.color; paintScenePreview(); } });
$("#scName").addEventListener("input", (e) => { state.draft.name = e.target.value; paintScenePreview(); });
$("#scApp").addEventListener("change", (e) => { state.draft.app = e.target.value; paintScenePreview(); });
$("#scTimer").addEventListener("change", (e) => { state.draft.timer = +e.target.value; paintScenePreview(); });
$("#scVol").addEventListener("input", (e) => {
  const v = +e.target.value;
  state.draft.volume = v < 0 ? null : v;
  $("#scVolOut").textContent = v < 0 ? tr("scenes.dontChange") : v;
  paintScenePreview();
});
$("#scCancel").addEventListener("click", () => closeSheets());
$("#scSave").addEventListener("click", async () => {
  const d = state.draft, name = $("#scName").value.trim();
  if (!name) return toast(tr("scenes.nameFirst"));
  const scene = { ...d, name, id: state.editScene || (name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "scene").slice(0, 18) + "-" + Date.now().toString(36).slice(-3) };
  const i = state.scenes.findIndex((x) => x.id === scene.id);
  if (i >= 0) state.scenes[i] = scene; else state.scenes.push(scene);
  closeSheets(); await saveScenes();
  toast(tr("scenes.saved", { name }));
});
$("#scDelete").addEventListener("click", async () => { state.scenes = state.scenes.filter((x) => x.id !== state.editScene); closeSheets(); await saveScenes(); toast(tr("scenes.deleted")); });

/* ---------- Siri and Shortcuts ---------- */
function renderSiri() {
  const t = currentTv(), base = bridgeHttp();
  if (!t || !base) { $("#siriList").innerHTML = `<div class="row"><span class="hint">${tr("siri.noBridge")}</span></div>`; return; }
  const u = (action, value) => `${base}/api/shortcut?host=${encodeURIComponent(t.host)}&action=${action}${value != null ? "&value=" + encodeURIComponent(value) : ""}${getToken() ? "&token=" + encodeURIComponent(getToken()) : ""}`;
  const items = [[tr("siri.on"), u("wake"), "sun"], [tr("siri.off"), u("power_off"), "moon"], [tr("siri.mute"), u("mute"), "spark"],
    [tr("siri.sleep30"), u("sleep", 30), "clock"], ...state.scenes.map((s) => [tr("siri.scene", { name: sceneName(s) }), u("scene", s.id), s.icon])];
  $("#siriList").innerHTML = items.map(([name, url, ic], i) => `<div class="row item siri-row"><span class="sc-name">${iconSvg(ic)}${esc(name)}</span><button class="link" data-copy="${i}" aria-label="${esc(tr("siri.copyAria", { name }))}">${tr("siri.copy")}</button></div>`).join("");
  $("#siriList").dataset.urls = JSON.stringify(items.map((x) => x[1]));
}
$("#siriList").addEventListener("click", async (e) => {
  const b = e.target.closest("[data-copy]");
  if (!b) return;
  const url = JSON.parse($("#siriList").dataset.urls || "[]")[+b.dataset.copy];
  try { await navigator.clipboard.writeText(url); toast(tr("siri.copied")); } catch { prompt(tr("siri.prompt"), url); }
});

/* ---------- details card: the card flips and opens ---------- */
const flip = $("#flip"), flipInner = $("#flipInner");
let detail = null;
const FLIP_MS = reduceMotion ? 1 : 480;
const rel = (el) => {
  const a = $(".app").getBoundingClientRect(), r = el.getBoundingClientRect();
  return { left: r.left - a.left, top: r.top - a.top, width: r.width, height: r.height };
};
const px = (r) => ({ left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px" });
function fmtUptime(s) {
  if (s == null) return null;
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  return d ? tr("up.days", { d, h }) : h ? tr("up.hours", { h, m }) : tr("up.min", { m });
}
const kv = (k, v) => (v == null || v === "" ? "" : `<div class="kv"><span>${k}</span><b>${v}</b></div>`);
const section = (title, rows) => { const h = rows.join(""); return h ? `<h4>${title}</h4><div class="kvs">${h}</div>` : ""; };

async function openDetail(i, cardEl) {
  if (detail || !cardEl) return;
  const tv = state.tvs[i];
  const look = BRAND_LOOK[tv.brand] || { text: tv.brand };
  detail = { i, timer: null, renaming: false, removeArmed: false, techOpen: false };
  $("#flipFront").replaceChildren(cardEl.cloneNode(true));
  $("#flipBack").innerHTML = `
    <div class="d-head">
      <div class="d-title"><span class="d-brand">${esc(look.text)}</span>
        <div class="d-name-row" id="dNameRow"></div>
        <span class="d-sub" id="dSub">${esc(tv.kind || "")}</span></div>
      <button class="mini close" data-dclose aria-label="${tr("detail.close")}"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    </div>
    <div class="d-menu" id="dMenu" role="menu" hidden>
      <button role="menuitem" data-drename><svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16zM13 7l4 4"/></svg>${tr("detail.rename")}</button>
      <button role="menuitem" data-dcopy><svg viewBox="0 0 24 24"><rect x="8" y="8" width="11" height="11" rx="2.5"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>${tr("detail.copyIp")}</button>
    </div>
    <div class="d-bar">
      <span class="status" id="dStatus"></span>
      <button class="mini star ${tv.fav ? "on" : ""}" data-dstar aria-pressed="${!!tv.fav}" aria-label="${tr("detail.favorite")}"><svg viewBox="0 0 24 24"><path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9 6.8 19.7l1-5.9L3.5 9.7l5.9-.8z"/></svg></button>
      <button class="mini trash" data-dremove aria-label="${tr("detail.remove")}"><svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg><span class="lbl" hidden>${tr("detail.confirm")}</span></button>
      <button class="tog ${tv.on ? "on" : ""}" role="switch" aria-checked="${!!tv.on}" data-dtoggle aria-label="${tr("detail.toggle")}"><i></i></button>
    </div>
    <div class="d-body" id="dData"><div class="skeleton"></div><div class="skeleton short"></div><div class="skeleton"></div></div>
    <div class="d-foot">
      <button class="cta" data-duse>${tr("detail.use")}</button>
    </div>`;
  paintNameRow(tv, false);
  paintDetailHead();
  $("#sheetBackdrop").hidden = false;
  flip.hidden = false; flip.style.cssText = ""; flipInner.style.transform = ""; $("#flipFront").style.visibility = "";
  const from = rel(cardEl), to = rel(flip);
  cardEl.style.visibility = "hidden";
  flip.style.right = "auto"; flip.style.bottom = "auto";
  Object.assign(flip.style, px(to));
  const move = flip.animate([px(from), px(to)], { duration: FLIP_MS, easing: "cubic-bezier(.25, .9, .3, 1)" });
  flipInner.style.transform = "rotateY(180deg)";
  flipInner.animate([{ transform: "rotateY(0deg)" }, { transform: "rotateY(180deg)" }], { duration: FLIP_MS, easing: "cubic-bezier(.4, .1, .2, 1)" });
  await move.finished;
  flip.style.cssText = "";
  $("#flipFront").style.visibility = "hidden";
  loadDetail();
  if (detail) detail.timer = setInterval(loadDetail, 5000);
}

async function closeDetail() {
  if (!detail) return;
  const d = detail; detail = null;
  clearInterval(d.timer);
  const card = $(`.tv-card[data-i="${d.i}"]`);
  $("#sheetBackdrop").hidden = true;
  if (!card) { flip.hidden = true; return; }
  $("#flipFront").style.visibility = "";
  const from = rel(flip), to = rel(card);
  flip.style.right = "auto"; flip.style.bottom = "auto";
  Object.assign(flip.style, px(to));
  card.style.visibility = "hidden";
  const ms = Math.max(1, FLIP_MS - 80);
  const move = flip.animate([px(from), px(to)], { duration: ms, easing: "cubic-bezier(.25, .9, .3, 1)" });
  flipInner.style.transform = "rotateY(0deg)";
  flipInner.animate([{ transform: "rotateY(180deg)" }, { transform: "rotateY(0deg)" }], { duration: ms, easing: "cubic-bezier(.4, .1, .2, 1)" });
  await move.finished;
  flip.hidden = true; flip.style.cssText = ""; flipInner.style.transform = "";
  card.style.visibility = "";
}

function paintDetailHead() {
  if (!detail) return;
  const tv = state.tvs[detail.i];
  if (!tv) return;
  const [cls, label] = tvStatus(tv);
  $("#dStatus").innerHTML = `<span class="dot ${cls}"></span>${label}`;
  const tg = $("#flipBack .tog");
  tg.classList.toggle("on", !!tv.on); tg.setAttribute("aria-checked", !!tv.on);
}

async function loadDetail() {
  if (!detail) return;
  const tv = state.tvs[detail.i];
  if (!tv) return;
  let info = null;
  try { info = await fetchJson(`${bridgeHttp()}/api/info?host=${encodeURIComponent(tv.host)}`, {}, 6000); } catch { /* receiver off */ }
  const box = $("#dData");
  if (!detail || !box) return;
  paintDetailHead();
  if (!info) {
    box.innerHTML = `<div class="d-error"><p>${tr("detail.cannotRead")}</p><p class="hint">${tr("detail.cannotReadHint")}</p>
      <button class="link" data-dretry>${tr("c.retry")}</button></div>`;
    return;
  }
  const c = info.control && info.control.connected ? info.control : null;
  const [, label] = tvStatus(tv);
  $("#dSub").textContent = [info.manufacturer, info.model].filter(Boolean).join(" ") || tv.kind || "";
  const open = (info.ports || []).filter((p) => p.open);
  const sc = box.scrollTop;
  box.innerHTML = [
    section(tr("detail.status"), [
      kv(tr("detail.link"), label),
      kv(tr("detail.power"), c ? (c.is_on === true ? tr("hero.on") : c.is_on === false ? tr("hero.standby") : null) : null),
      kv(tr("detail.runningApp"), c && c.current_app ? esc(appInfo(c.current_app).name) : null),
      kv(tr("remote.volume"), c && c.volume ? `${c.volume.level} / ${c.volume.max}${c.volume.muted ? " · " + tr("detail.muted") : ""}` : null),
      kv(tr("detail.latency"), info.latency_ms ? `${info.latency_ms} ms` : null),
    ]),
    section(tr("detail.device"), [
      kv(tr("detail.maker"), esc(info.manufacturer)), kv(tr("detail.model"), esc(info.model)), kv(tr("add.name"), esc(info.name)),
      kv(tr("add.ip"), esc(info.host)), kv(tr("detail.uptime"), fmtUptime(info.uptime_seconds)),
    ]),
    `<details class="tech" ${detail.techOpen ? "open" : ""}><summary>${tr("detail.tech")}</summary><div class="kvs">${[
      kv(tr("detail.mac"), esc(info.mac)), kv(tr("detail.connType"), esc(info.connection)),
      kv(tr("detail.ports"), open.length ? open.map((p) => `${p.port} · ${esc(I18N.en["port." + p.port] ? tr("port." + p.port) : p.label)}`).join("<br>") : null),
      kv(tr("detail.sw"), c && c.device ? esc(c.device.sw_version) : null), kv(tr("detail.cast"), esc(info.cast_version)),
      kv(tr("detail.locale"), esc(info.locale)),
      kv(tr("detail.updates"), info.update_available == null ? null : info.update_available ? tr("detail.avail") : tr("detail.none")),
      kv(tr("detail.udn"), info.udn ? esc(info.udn.slice(0, 13)) + "…" : null),
    ].join("")}</div></details>`,
    `<p class="hint">${tr("detail.note")}</p>`,
  ].join("");
  box.scrollTop = sc;
}
$("#flipBack").addEventListener("toggle", (e) => { if (detail && e.target.matches("details.tech")) detail.techOpen = e.target.open; }, true);

function paintNameRow(tv, editing) {
  const row = $("#dNameRow");
  if (!row) return;
  row.innerHTML = editing
    ? `<input id="dName" type="text" value="${esc(tv.name)}" maxlength="30" aria-label="${tr("detail.nameAria")}">
       <button class="mini ok" data-dsave aria-label="${tr("detail.saveName")}"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7"/></svg></button>`
    : `<h3 id="dName">${esc(tv.name)}</h3>
       <button class="mini dots" data-dmenu aria-haspopup="menu" aria-expanded="false" aria-label="${tr("detail.more")}"><svg viewBox="0 0 24 24" class="fill"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg></button>`;
}
function saveName(tv, save) {
  if (save) { const v = $("#dName").value.trim(); if (v) { tv.name = v; saveTvs(); renderTvs(); refreshRemote(); refreshApps(); } }
  detail.renaming = false;
  paintNameRow(tv, false);
}

$("#flipBack").addEventListener("click", (e) => {
  if (!detail) return;
  const i = detail.i, tv = state.tvs[i];
  const menu = $("#dMenu");
  if (!e.target.closest("[data-dmenu], #dMenu")) { menu.hidden = true; const dm = $("[data-dmenu]"); if (dm) dm.setAttribute("aria-expanded", "false"); }
  if (e.target.closest("[data-dclose]")) return closeDetail();
  if (e.target.closest("[data-dretry]")) { $("#dData").innerHTML = `<div class="skeleton"></div><div class="skeleton short"></div>`; return loadDetail(); }
  if (e.target.closest("[data-duse]")) { closeDetail().then(() => go("remote")); return; }
  if (e.target.closest("[data-dtoggle]")) { setTvEnabled(i, !tv.on); paintDetailHead(); return; }
  if (e.target.closest("[data-dstar]")) {
    tv.fav = !tv.fav; saveTvs(); renderTvs();
    const s = $("#flipBack .mini.star"); s.classList.toggle("on", !!tv.fav); s.setAttribute("aria-pressed", !!tv.fav);
    return;
  }
  const dm = e.target.closest("[data-dmenu]");
  if (dm) { menu.hidden = !menu.hidden; dm.setAttribute("aria-expanded", String(!menu.hidden)); return; }
  if (e.target.closest("[data-dcopy]")) {
    menu.hidden = true;
    navigator.clipboard.writeText(tv.host).then(() => toast(tr("detail.ipCopied")), () => toast(tv.host));
    return;
  }
  if (e.target.closest("[data-drename]")) {
    menu.hidden = true; detail.renaming = true;
    paintNameRow(tv, true);
    const inp = $("#dName"); inp.focus(); inp.select();
    inp.addEventListener("keydown", (ev) => { if (ev.key === "Enter") saveName(tv, true); else if (ev.key === "Escape") { ev.stopPropagation(); saveName(tv, false); } });
    return;
  }
  if (e.target.closest("[data-dsave]")) return saveName(tv, true);
  if (e.target.closest("[data-dremove]")) {
    const btn = e.target.closest("[data-dremove]");
    if (!detail.removeArmed) {
      detail.removeArmed = true; btn.classList.add("armed"); $(".lbl", btn).hidden = false; btn.setAttribute("aria-label", tr("detail.confirmAria"));
      setTimeout(() => { if (detail && btn.isConnected) { detail.removeArmed = false; btn.classList.remove("armed"); $(".lbl", btn).hidden = true; btn.setAttribute("aria-label", tr("detail.remove")); } }, 3500);
      return;
    }
    setTvEnabled(i, false);
    state.ignored.push(tv.host); store.set("ignored", state.ignored);
    state.tvs.splice(i, 1); state.current = 0; saveTvs();
    flip.hidden = true; flip.style.cssText = ""; flipInner.style.transform = "";
    clearInterval(detail.timer); detail = null; $("#sheetBackdrop").hidden = true;
    renderTvs(); refreshRemote(); refreshApps(); toast(tr("detail.deleted"));
  }
});

/* ---------- settings ---------- */
function bindSwitch(id, key, apply) {
  const el = $(id);
  el.setAttribute("aria-checked", state[key]);
  el.addEventListener("click", () => {
    state[key] = !state[key];
    localStorage.setItem(key, state[key] ? "1" : "0");
    el.setAttribute("aria-checked", state[key]);
    if (apply) apply();
  });
}
bindSwitch("#hapticSwitch", "haptic");
bindSwitch("#oneSwitch", "onehand", () => $("#app").classList.toggle("onehand", state.onehand));
$("#bridgeUrl").value = addressText(state.bridge);

/* ---------- language: glass sheet instead of a native dropdown ---------- */
/* version shown at the bottom of Settings: it comes from version.js, the single place where it is written */
function paintFooter() { $("#appFooter").textContent = tr("settings.footer", { v: "v" + (self.APP_VERSION || "") }); }

/* tap the version 5 times to see how the phone sizes the page (useful to report display problems) */
function layoutReport() {
  const probe = document.createElement("div");
  probe.style.cssText = "position:fixed;visibility:hidden;padding-bottom:env(safe-area-inset-bottom,0px);padding-top:env(safe-area-inset-top,0px)";
  document.body.appendChild(probe);
  const cs = getComputedStyle(probe), safeB = cs.paddingBottom, safeT = cs.paddingTop;
  probe.remove();
  const dm = ["standalone", "fullscreen", "minimal-ui", "browser"].find((m) => matchMedia(`(display-mode: ${m})`).matches);
  const tb = $(".tabbar") ? $(".tabbar").getBoundingClientRect() : null;
  return { nav: navigator.standalone === true ? "ios-standalone" : "no", dm, proto: location.protocol,
    win: `${innerWidth}x${innerHeight}`, outer: `${outerWidth}x${outerHeight}`, screen: `${screen.width}x${screen.height}`,
    vv: window.visualViewport ? `${Math.round(window.visualViewport.height)}` : "-", doc: document.documentElement.clientHeight,
    app: $("#app").offsetHeight, tabBottom: tb ? Math.round(tb.bottom) : null, safe: `${safeT}/${safeB}`, dpr: devicePixelRatio, ua: navigator.userAgent };
}
{
  let taps = 0, timer;
  $("#appFooter").addEventListener("click", () => {
    clearTimeout(timer); timer = setTimeout(() => { taps = 0; }, 2500);
    if (++taps < 5) return;
    taps = 0;
    const r = layoutReport();
    toast(`${r.nav}/${r.dm} · ${r.proto} · win ${r.win} · outer ${r.outer} · vv ${r.vv} · screen ${r.screen} · app ${r.app} · safe ${r.safe}`, 12000);
  });
}
function paintLang() {
  const pref = i18n.pref;
  $("#langCur").textContent = pref ? i18n.names[pref] : tr("settings.langAuto").replace(/\s*\(.*\)$/, "") + " · " + i18n.names[i18n.lang];
  const row = (code, label, sub) => `<button class="switch-row ${code === pref ? "sel" : ""}" data-lang="${code}" aria-pressed="${code === pref}">
    <span class="sw-name">${esc(label)}</span>${sub ? `<small>${esc(sub)}</small>` : ""}
    ${code === pref ? `<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7"/></svg>` : ""}</button>`;
  $("#langList").innerHTML = row("", tr("settings.langAuto").replace(/\s*\(.*\)$/, ""), i18n.names[i18n.lang]) +
    i18n.codes().map((c) => row(c, i18n.names[c])).join("");
}
$("#langBtn").addEventListener("click", () => { paintLang(); openSheet("langSheet"); });
$("#langList").addEventListener("click", (e) => {
  const b = e.target.closest("[data-lang]");
  if (!b) return;
  i18n.setLang(b.dataset.lang);
  closeSheets();
});
document.addEventListener("langchange", () => {
  renderBrands(); renderKb(); refreshSceneApps(); renderSiri(); renderTvs(); refreshRemote(); refreshApps();
  paintEditButtons(); paintScanHint(); paintConnHint(); paintLang(); paintFooter(); paintHealthAll();
  requestAnimationFrame(refreshLenses);
});

/* ---------- TV health: live stats, processes and maintenance ---------- */
const HEALTH_MS = 3000, HEALTH_SAMPLES = 120;
const FORCE_DEMO = new URLSearchParams(location.search).has("demo");
const health = { timer: null, busy: false, shown: false, src: null, tab: "perf", ok: null, last: null, hist: [],
  sort: { key: "cpu", dir: -1 }, q: "", maint: null, maintErr: false, cleaning: false, saving: false, lastAuth: 0 };
const healthDemo = () => FORCE_DEMO || !bridgeHttp();
const nf1 = (v) => Number(v).toLocaleString(i18n.lang, { maximumFractionDigits: 1 });
const fmtPct = (v) => (v > 0 && v < 10 ? nf1(v) : Math.round(v)) + "%";
const fmtMb = (mb) => (mb >= 1024 ? nf1(mb / 1024) + " GB" : Math.round(mb) + " MB");
const pad2 = (n) => String(n).padStart(2, "0");
/* the TV may be in another time zone: labels are built from the TV clock offset, not the phone's */
const phoneOffsetMin = () => -new Date().getTimezoneOffset();
const fmtWhen = (ms, offMin = phoneOffsetMin()) => new Date(ms + offMin * 60000).toLocaleString(i18n.lang, { timeZone: "UTC", weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
function fmtDur(sec) {
  const d = Math.floor(sec / 86400), h = Math.floor((sec % 86400) / 3600), m = Math.floor((sec % 3600) / 60);
  return [d ? `${d} ${tr("health.unitD")}` : "", d || h ? `${h} h` : "", `${m} min`].filter(Boolean).join(" ");
}

/* Reboot schedule helpers: freq daily|weekly|monthly, day = ISO weekday 1..7 (weekly) or 1..28 (monthly) */
const REBOOT_DEFAULT = { enabled: false, freq: "weekly", day: 7, hour: 4, minute: 0 };
function normReboot(x) {
  const r = { ...REBOOT_DEFAULT, ...(x || {}) };
  r.enabled = !!r.enabled;
  if (!["daily", "weekly", "monthly"].includes(r.freq)) r.freq = "weekly";
  const lim = r.freq === "monthly" ? 28 : 7;
  r.day = Math.min(lim, Math.max(1, Math.round(+r.day) || 1));
  r.hour = Math.min(23, Math.max(0, Math.round(+r.hour) || 0));
  r.minute = Math.min(59, Math.max(0, Math.round(+r.minute) || 0));
  return r;
}
function nextRun(r, now = Date.now()) {
  const d = new Date(now);
  d.setHours(r.hour, r.minute, 0, 0);
  if (r.freq === "daily") { if (d.getTime() <= now) d.setDate(d.getDate() + 1); }
  else if (r.freq === "weekly") {
    d.setDate(d.getDate() + ((r.day - (((d.getDay() + 6) % 7) + 1) + 7) % 7));
    if (d.getTime() <= now) d.setDate(d.getDate() + 7);
  } else {
    d.setDate(r.day);
    if (d.getTime() <= now) d.setMonth(d.getMonth() + 1);
  }
  return d.getTime();
}

/* Two data sources with the same shape: the receiver on the TV, and a simulation for the public demo */
const apiOk = (r) => { if (!r || r.ok === false) throw Object.assign(new Error("api"), { body: r }); return r; };
const realSource = {
  stats: () => fetchJson(bridgeHttp() + "/api/stats", {}, 4500).then(apiOk),
  cleanCache: () => fetchJson(bridgeHttp() + "/api/clean-cache", { method: "POST" }, 30000).then(apiOk),
  getMaintenance: () => fetchJson(bridgeHttp() + "/api/maintenance", {}, 6000).then(apiOk),
  setMaintenance: (reboot) => fetchJson(bridgeHttp() + "/api/maintenance",
    { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reboot }) }, 8000).then(apiOk),
  openLink: (url) => fetchJson(bridgeHttp() + "/api/open-link",
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) }, 10000).then(apiOk),
};
const demoSource = (() => {
  const TOT = 1696, SWAP_TOT = 300, KEY = "gr.demo.maint";
  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const boot = Date.now() - (2 * 86400 + 5 * 3600 + 17 * 60) * 1000;
  let load = 17, target = 17, ram = 1090, swap = 118, cache = 210, temp = 49, freq = 1500;
  const offsets = [6, -4, 2, -3];
  /* name, share of the CPU, memory MB, user */
  const procs = [
    ["com.netflix.ninja", .34, 310, "u0_a54"], ["system_server", .14, 210, "system"], ["surfaceflinger", .12, 38, "system"],
    ["android.hardware.media.c2@1.2-service", .06, 28, "mediacodec"], ["com.google.android.tvlauncher", .06, 140, "u0_a21"],
    ["com.google.android.youtube.tv", .05, 190, "u0_a37"], ["com.google.android.gms.persistent", .04, 120, "u0_a8"],
    ["audioserver", .03, 24, "audioserver"], ["com.android.vending", .02, 96, "u0_a19"],
    ["com.google.android.tvrecommendations", .02, 74, "u0_a22"], ["com.android.systemui", .02, 88, "u0_a14"],
    ["adbd", .01, 6, "shell"], ["logd", .01, 4, "logd"], ["netd", .01, 7, "root"], ["wpa_supplicant", .01, 5, "wifi"],
    ["com.google.android.katniss:search", .02, 52, "u0_a31"], ["com.google.android.katniss", .015, 78, "u0_a31"],
    ["com.google.android.gms.unstable", .01, 46, "u0_a8"], ["com.netflix.ninja:service", .02, 38, "u0_a54"], ["zygote64", .01, 22, "root"],
  ].map((p, i) => ({ name: p[0], share: p[1], ram: p[2], user: p[3], pid: 190 + i * 211 + Math.floor(rnd(0, 90)) }));
  const step = () => {
    if (Math.random() < .08) target = rnd(8, 62);
    load = clamp(load + (target - load) * .18 + rnd(-2.5, 2.5), 3, 92);
    ram = clamp(ram + rnd(-14, 14), 900, 1480);
    swap = clamp(swap + rnd(-3, 3.5), 40, 260);
    cache = clamp(cache + rnd(-1, 2.5), 20, 480);
    temp = clamp(temp + (load / 2 + 36 - temp) * .05 + rnd(-.3, .3), 38, 78);
    freq = Math.round(1000 + load * 9 + rnd(-25, 25));
  };
  const snapshot = () => {
    step();
    const cores = offsets.map((o) => Math.round(clamp(load + o + rnd(-6, 6), 0, 100) * 10) / 10);
    const cpu = Math.round((cores.reduce((a, b) => a + b, 0) / cores.length) * 10) / 10;
    const used = Math.round(ram);
    const rows = procs.map((p) => ({ pid: p.pid, name: p.name, cpu: Math.round(cpu * p.share * 2.4 * rnd(.8, 1.2) * 10) / 10, ramMb: Math.round(p.ram * rnd(.97, 1.03)), user: p.user }));
    return { ok: true, screenOn: true, app: "com.netflix.ninja", upSec: Math.floor((Date.now() - boot) / 1000), cpu, cores, freqMhz: freq, tempC: Math.round(temp * 10) / 10,
      load: [+(cpu / 25).toFixed(2), +(cpu / 28).toFixed(2), +(cpu / 30).toFixed(2)],
      ramTotMb: TOT, ramUsedMb: used, ramAvailMb: TOT - used, cacheMb: Math.round(cache), swapTotMb: SWAP_TOT, swapUsedMb: Math.round(swap),
      procs: [...rows].sort((a, b) => b.cpu - a.cpu).slice(0, 40),
      memProcs: rows.map(({ pid, name, ramMb, user }) => ({ pid, name, ramMb, user })).sort((a, b) => b.ramMb - a.ramMb).slice(0, 30) };
  };
  const saved = () => store.get(KEY, {});
  const maintenance = () => {
    const s = saved(), r = normReboot(s.reboot);
    return { ok: true, reboot: r, lastRebootMs: s.last || 0, nextRebootMs: r.enabled ? nextRun(r) : 0, nowMs: Date.now(), tzOffsetMin: phoneOffsetMin(), note: "" };
  };
  const later = (v, ms) => new Promise((res) => setTimeout(() => res(v), ms));
  return {
    stats: () => later(snapshot(), 90),
    history: (n) => Array.from({ length: n }, snapshot),
    cleanCache: () => later(null, rnd(900, 1500)).then(() => {
      const freed = Math.max(0, Math.round(Math.min(cache - 15, rnd(60, 240))));
      cache -= freed; ram = Math.max(900, ram - freed * .2);
      return { ok: true, freedMb: freed };
    }),
    getMaintenance: () => later(maintenance(), 120),
    openLink: () => later({ ok: true }, 600),
    setMaintenance: (reboot) => {
      try { store.set(KEY, { ...saved(), reboot: normReboot(reboot) }); } catch { /* private mode */ }
      return later(maintenance(), 200);
    },
  };
})();
const healthSource = () => (healthDemo() ? demoSource : realSource);

/* the TV health row and the "open a link" card only exist when the receiver answers /api/stats (or in the demo) */
const probe = { base: null, state: "", busy: false };
function setHealthEntry(show) {
  $("#healthEntry").hidden = !show;
  $("#linkCard").hidden = !show;
  if (!show && $("#screen-health").classList.contains("active")) go("settings");
}
async function probeHealth() {
  if (healthDemo()) { probe.base = null; probe.state = ""; return setHealthEntry(true); }
  const base = bridgeHttp();
  if (probe.busy || (probe.base === base && (probe.state === "yes" || probe.state === "no"))) return;
  probe.base = base; probe.busy = true;
  try { const r = await realSource.stats(); probe.state = r && r.ok === true ? "yes" : "no"; }
  catch (e) { probe.state = e.status === 401 ? "yes" : e.status === 404 || e instanceof SyntaxError ? "no" : ""; }
  probe.busy = false;
  if (probe.base === bridgeHttp()) setHealthEntry(probe.state === "yes");
}

function onUnauthorized() {
  if (Date.now() - health.lastAuth < 20000) return;
  health.lastAuth = Date.now();
  setToken("");
  toast(tr("health.pinNeeded"));
  closeAll(); connectAll();
  if (!Object.keys(state.conns).length && currentTv()) openConn(currentTv());
}

function pushSample(s, t = Date.now()) {
  const pct = (a, b) => (b > 0 ? Math.min(100, Math.max(0, (a / b) * 100)) : 0);
  health.hist.push({ t, cpu: Math.min(100, Math.max(0, +s.cpu || 0)), ram: pct(s.ramUsedMb, s.ramTotMb), swap: pct(s.swapUsedMb, s.swapTotMb) });
  while (health.hist.length > HEALTH_SAMPLES) health.hist.shift();
}
async function healthPoll() {
  if (health.busy) return;
  health.busy = true;
  const src = healthSource();
  if (health.src !== src) Object.assign(health, { src, hist: [], last: null, ok: null, maint: null, maintErr: false });
  try {
    if (!health.hist.length && src.history) {
      const past = src.history(HEALTH_SAMPLES - 1), now = Date.now();
      past.forEach((s, i) => pushSample(s, now - (past.length - i) * HEALTH_MS));
    }
    const s = await src.stats();
    if (healthSource() === src) { pushSample(s); health.last = s; health.ok = true; }
  } catch (e) {
    health.ok = false;
    if (e && e.status === 401) onUnauthorized();
  }
  health.busy = false;
  paintHealth();
}
/* polls every 3 s, and only while the screen is on show and the page is visible */
function healthSync() {
  const active = $("#screen-health").classList.contains("active");
  if (active && !health.shown) { health.shown = true; healthOpened(); }
  if (!active) health.shown = false;
  const want = active && !document.hidden;
  if (want && !health.timer) { healthPoll(); health.timer = setInterval(healthPoll, HEALTH_MS); }
  else if (!want && health.timer) { clearInterval(health.timer); health.timer = null; }
}
document.addEventListener("visibilitychange", healthSync);
function healthOpened() {
  if (health.src && health.src !== healthSource()) Object.assign(health, { src: null, hist: [], last: null, ok: null, maint: null, maintErr: false });
  paintSortChips(); paintHealth(); paintMaint(); loadMaint();
  requestAnimationFrame(paintHealth);
}

function healthVerdict(s) {
  const bad = [], warn = [];
  const swapPct = s.swapTotMb > 0 ? (s.swapUsedMb / s.swapTotMb) * 100 : 0;
  if (s.cpu > 70) bad.push(["health.r.cpuBad"]); else if (s.cpu > 40) warn.push(["health.r.cpuWarn"]);
  if (s.ramAvailMb < 150) bad.push(["health.r.memBad"]); else if (s.ramAvailMb < 300) warn.push(["health.r.memWarn"]);
  if (swapPct > 85) bad.push(["health.r.swapBad"]); else if (swapPct > 55) warn.push(["health.r.swapWarn"]);
  if (s.upSec > 14 * 86400) warn.push(["health.r.upWarn", { d: Math.floor(s.upSec / 86400) }]);
  const level = bad.length ? "bad" : warn.length ? "warn" : "ok";
  return { level, reasons: [...bad, ...warn].length ? [...bad, ...warn] : [["health.r.ok"]] };
}
const VERDICT_ICON = {
  ok: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>',
  warn: '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17h.01"/>',
  bad: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5M12 16h.01"/>',
};

function paintHealthPills() {
  const s = health.last, parts = [];
  const [cls, label] = health.ok === false ? ["off", tr("status.noReply")] : health.ok ? ["on", tr("status.linked")] : ["warn", tr("status.connecting")];
  parts.push(`<span class="h-pill"><span class="dot ${cls}"></span>${esc(label)}</span>`);
  if (s && health.ok) {
    parts.push(`<span class="h-pill"><span class="dot ${s.screenOn ? "on" : ""}"></span>${tr(s.screenOn ? "health.screenOn" : "health.screenOff")}</span>`);
    if (s.app) parts.push(`<span class="h-pill"><span class="t">${tr("health.inApp", { name: esc(appInfo(s.app).name) })}</span></span>`);
    if (s.upSec != null) parts.push(`<span class="h-pill">${esc(tr("health.up", { t: fmtDur(s.upSec) }))}</span>`);
  }
  if (healthDemo()) parts.push(`<span class="h-pill demo">${tr("health.demo")}</span>`);
  $("#hPills").innerHTML = parts.join("");
}

function paintCores(cores) {
  const box = $("#cores");
  $("#coresBox").hidden = !cores.length;
  if (box.children.length !== cores.length) box.innerHTML = cores.map((_, i) => `<div class="core"><span>${i + 1}</span><i><b></b></i><em></em></div>`).join("");
  cores.forEach((v, i) => {
    v = Math.min(100, Math.max(0, +v || 0));
    const row = box.children[i], bar = row.querySelector("b");
    bar.style.setProperty("--v", v / 100);
    bar.dataset.l = v > 70 ? "bad" : v > 40 ? "warn" : "";
    row.querySelector("em").textContent = Math.round(v) + "%";
  });
}

function drawChart(cv, series) {
  const w = cv.clientWidth, h = cv.clientHeight;
  if (!w || !h) return;
  const dpr = Math.min(devicePixelRatio || 1, 3);
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
  const c = cv.getContext("2d");
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.clearRect(0, 0, w, h);
  const top = 8, ih = h - top - 8;
  c.lineWidth = 1; c.strokeStyle = "rgba(255,255,255,.08)";
  for (const f of [0, .5, 1]) { const y = Math.round(top + ih * f) + .5; c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
  const hist = health.hist;
  if (!hist.length) return;
  const span = HEALTH_SAMPLES * HEALTH_MS, end = hist[hist.length - 1].t;
  c.lineJoin = "round"; c.lineCap = "round";
  for (const s of series) {
    /* a pause longer than a few samples (screen was closed) breaks the line instead of joining the two sides */
    const runs = [];
    for (const p of hist) {
      const x = w - 4 - ((end - p.t) / span) * (w - 4);
      if (x < -4) continue;
      const pt = [x, top + ih * (1 - p[s.key] / 100)], run = runs[runs.length - 1];
      if (run && p.t - run.t < HEALTH_MS * 3.5) { run.pts.push(pt); run.t = p.t; } else runs.push({ pts: [pt], t: p.t });
    }
    for (const { pts } of runs) {
      if (pts.length < 2) continue;
      const trace = () => {
        c.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length - 1; i++) c.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2);
        c.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
      };
      if (s.fill) {
        const g = c.createLinearGradient(0, top, 0, top + ih);
        g.addColorStop(0, s.color + "55"); g.addColorStop(1, s.color + "00");
        c.beginPath(); trace(); c.lineTo(pts[pts.length - 1][0], top + ih); c.lineTo(pts[0][0], top + ih); c.closePath();
        c.fillStyle = g; c.fill();
      }
      c.beginPath(); trace();
      c.lineWidth = 2; c.strokeStyle = s.color; c.stroke();
    }
  }
}
const drawHealthCharts = () => {
  drawChart($("#cpuChart"), [{ key: "cpu", color: "#62c8ff", fill: true }]);
  drawChart($("#memChart"), [{ key: "ram", color: "#8a84ff", fill: true }, { key: "swap", color: "#ffb547", fill: false }]);
};
addEventListener("resize", () => { if (health.shown && health.tab === "perf") drawHealthCharts(); });

function paintHealth() {
  if (!$("#screen-health").classList.contains("active")) return;
  paintHealthPills();
  const s = health.last;
  $("#hNoData").hidden = health.ok !== false;
  const verdict = $("#hVerdict");
  verdict.hidden = !s || health.ok === false;
  if (!s) return;
  paintUsage();
  if (health.tab === "procs") return paintProcs();
  const v = healthVerdict(s);
  verdict.className = "glass verdict " + v.level;
  verdict.innerHTML = `<span class="v-ico"><svg viewBox="0 0 24 24" aria-hidden="true">${VERDICT_ICON[v.level]}</svg></span>
    <div class="v-text"><b>${tr("health.v." + v.level)}</b><ul>${v.reasons.map(([k, vars]) => `<li>${esc(tr(k, vars))}</li>`).join("")}</ul></div>`;

  const peak = Math.max(0, ...health.hist.map((p) => p.cpu));
  $("#cpuNow").textContent = fmtPct(+s.cpu || 0);
  $("#cpuMeta").textContent = [tr("health.peak", { n: Math.round(peak) }),
    s.freqMhz != null ? (s.freqMhz >= 1000 ? nf1(s.freqMhz / 1000) + " GHz" : Math.round(s.freqMhz) + " MHz") : "",
    s.tempC != null ? Math.round(s.tempC) + " °C" : ""].filter(Boolean).join(" · ");
  paintCores(s.cores || []);

  const ramPct = s.ramTotMb > 0 ? (s.ramUsedMb / s.ramTotMb) * 100 : 0;
  const swapPct = s.swapTotMb > 0 ? (s.swapUsedMb / s.swapTotMb) * 100 : 0;
  $("#ramNow").textContent = fmtPct(ramPct);
  $("#memMeta").textContent = `${tr("health.swap")} ${fmtPct(swapPct)}`;
  $("#stUsed").textContent = `${fmtMb(s.ramUsedMb)} / ${fmtMb(s.ramTotMb)}`;
  $("#stAvail").textContent = fmtMb(s.ramAvailMb);
  $("#stSwap").textContent = s.swapTotMb > 0 ? `${Math.round(s.swapUsedMb)} / ${fmtMb(s.swapTotMb)}` : "–";
  $("#stCache").textContent = s.cacheMb != null ? fmtMb(s.cacheMb) : "–";
  drawHealthCharts();
}

/* ----- processes ----- */
const procTitle = (name) => usageTitle(usageKey(name));
const SORT_COLS = [["name", "health.sortName", 1], ["pid", "health.sortPid", 1], ["cpu", "health.sortCpu", -1], ["ram", "health.sortMem", -1], ["user", "health.sortUser", 1]];
const SORT_VAL = { name: (p) => p.title.toLowerCase(), pid: (p) => +p.pid || 0, cpu: (p) => +p.cpu || 0, ram: (p) => +p.ramMb || 0, user: (p) => String(p.user || "").toLowerCase() };
function paintSortChips() {
  const { key, dir } = health.sort;
  $("#sortRow").innerHTML = SORT_COLS.map(([k, label]) => {
    const on = k === key, name = tr(label);
    return `<button class="sort-chip ${on ? "on" : ""}" data-sort="${k}" aria-pressed="${on}" aria-label="${esc(tr("health.sortAria", { name }))}">${esc(name)}${on ? `<i aria-hidden="true">${dir > 0 ? "↑" : "↓"}</i>` : ""}</button>`;
  }).join("");
}
function setSort(k) {
  const s = health.sort;
  if (s.key === k) s.dir = -s.dir; else { s.key = k; s.dir = SORT_COLS.find((c) => c[0] === k)[2]; }
  paintSortChips(); paintProcs();
}
function paintProcs() {
  const s = health.last, list = $("#procList");
  const q = health.q.trim().toLowerCase();
  let rows = ((s && s.procs) || []).slice(0, 40).map((p) => ({ ...p, title: procTitle(p.name) }));
  $("#procNote").textContent = tr("health.procNote", { n: rows.length });
  if (q) rows = rows.filter((p) => `${p.title} ${p.name} ${p.pid} ${p.user || ""}`.toLowerCase().includes(q));
  const { key, dir } = health.sort, val = SORT_VAL[key];
  rows.sort((a, b) => {
    const x = val(a), y = val(b);
    return (typeof x === "string" ? x.localeCompare(y) : x - y) * dir;
  });
  list.innerHTML = rows.length ? rows.map((p) => `<div class="proc">
      <div class="p-main"><b>${esc(p.title)}</b><small>${esc(p.name)} · PID ${esc(p.pid)}${p.user ? " · " + esc(p.user) : ""}</small></div>
      <div class="p-nums"><b class="${p.cpu > 40 ? "hot" : ""}">${nf1(+p.cpu || 0)}%</b><small>${fmtMb(+p.ramMb || 0)}</small></div></div>`).join("")
    : `<div class="proc empty"><small>${tr("health.noProcs")}</small></div>`;
}
$("#pSearch").addEventListener("input", (e) => { health.q = e.target.value; paintProcs(); });

/* ----- what is using the CPU / memory: apps first, Android system apart ----- */
const FRIENDLY = {
  "com.gathin.tvhome": "Home screen", "app.glassremote.tv": "GlassRemote (TV app)", "com.mediatek.wwtv.tvcenter": "Live TV (TV center)",
  "com.mediatek.wwtv.tvrecommendation": "TV inputs", "com.mediatek.tvinput": "TV inputs service", "com.mediatek.tv.agent": "TV system agent",
  "com.mediatek.tv.freeviewplay": "Freeview Play", "com.mediatek.hotkey.dispatcher": "Remote keys", "com.mstar.netflixobserver": "Netflix helper",
  "com.google.android.katniss": "Google Assistant", "com.android.vending": "Google Play Store", "com.google.android.inputmethod.latin": "Gboard keyboard",
  "com.google.process.gapps": "Google services", "com.google.android.gms": "Google Play services", "com.google.android.apps.mediashell": "Chromecast built-in",
  "com.google.android.tv.remote.service": "Android TV Remote service", "com.android.systemui": "System UI", "com.android.tv.settings": "TV settings",
  "com.android.providers.tv": "TV provider", "com.android.bluetooth": "Bluetooth", "android.process.media": "Media storage", "com.android.keychain": "Keychain",
  "app_process": "ADB helper (app_process)", "adbd": "ADB service", "com.google.android.tvrecommendations": "Recommendations",
  "com.google.android.gsf": "Google Services Framework", "com.google.android.webview": "Android System WebView", "kernel": "Linux kernel",
};
/* always listed as apps / always listed as Android system, whatever user they run as */
const APP_FORCE = new Set(["app.glassremote.tv", "com.gathin.tvhome", "com.google.process.gapps", "com.google.android.katniss", "com.google.android.gms",
  "com.android.vending", "com.google.android.inputmethod.latin"]);
const SYS_NAMES = new Set(["app_process", "adbd", "system_server", "surfaceflinger", "zygote", "zygote64", "wpf_browser", "dtv_svc", "android.process.media"]);
const SYS_PATTERN = /^(com\.mediatek\.|com\.mstar\.|android\.hardware\.|com\.android\.(providers\.|systemui$|bluetooth$|keychain$|tv\.settings$))/;
const KERNEL_THREAD = /^(kworker|ksoftirqd|migration|irq|cpuhp|rcu_\w+|kthreadd|kswapd\d*|watchdog)\b/;
/* a readable name is only derived for something that looks like an Android package */
const looksLikePackage = (n) => /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(n);
/* "com.google.android.katniss:search" -> "com.google.android.katniss"; every Play services process counts as one app */
function usageKey(name) {
  const n = String(name || "");
  if (n.startsWith("[") || KERNEL_THREAD.test(n)) return "kernel";
  let b = n.split(":")[0];
  if (b.startsWith("/")) b = b.split("/").pop();
  return /^com\.google\.android\.gms(\.|$)/.test(b) ? "com.google.android.gms" : b;
}
function isAppProc(p, key) {
  const u = String(p.user || "");
  if (key === "kernel") return false;
  if (knownApp(key) || APP_FORCE.has(key)) return true;
  if (SYS_NAMES.has(key) || SYS_PATTERN.test(key)) return false;
  if (/^u\d+_/.test(u)) return true;
  if (u) return false;
  return looksLikePackage(key);
}
function usageTitle(key) {
  const a = knownApp(key);
  if (a) return a.name;
  if (FRIENDLY[key]) return FRIENDLY[key];
  if (SYSTEM_APPS[key]) return tr(SYSTEM_APPS[key]);
  if (!looksLikePackage(key)) return key;
  return key.split(".").pop().replace(/_+/g, " ").replace(/^./, (c) => c.toUpperCase());
}
const knownApp = (key) => APPS.find((a) => a.pkg === key) || state.customApps.find((a) => a.pkg === key);
const GEAR_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg>';
function usageGroups(s, kind) {
  const field = kind === "cpu" ? "cpu" : "ramMb";
  const list = kind === "cpu" ? s.procs || [] : s.memProcs || s.procs || [];
  const map = new Map();
  for (const p of list) {
    const key = usageKey(p.name);
    let g = map.get(key);
    if (!g) map.set(key, (g = { key, val: 0, procs: [], app: false }));
    g.val += +p[field] || 0; g.procs.push(p); g.app = g.app || isAppProc(p, key);
  }
  const all = [...map.values()].sort((a, b) => b.val - a.val);
  return { field, apps: all.filter((g) => g.app), sys: all.filter((g) => !g.app), max: Math.max(0.0001, ...all.map((g) => g.val)) };
}
function paintUsage(force) {
  const u = health.usage, sheet = $("#detailSheet"), s = health.last;
  if (!u || sheet.hidden || !s) return;
  /* do not rebuild the list under the finger or while it is still scrolling */
  if (!force && (u.touching || Date.now() - u.scrolled < 400)) return;
  const { field, apps: allApps, sys: allSys, max } = usageGroups(s, u.kind);
  /* top reports CPU in coarse steps, so many rows sit at 0: they stay behind a toggle */
  const isIdle = (g) => u.kind === "cpu" && g.val <= 0;
  const idleN = allApps.filter(isIdle).length + allSys.filter(isIdle).length;
  const apps = u.idle ? allApps : allApps.filter((g) => !isIdle(g)), sys = u.idle ? allSys : allSys.filter((g) => !isIdle(g));
  const fmt = (v) => (u.kind === "cpu" ? nf1(v) + "%" : fmtMb(v));
  const item = (g) => {
    const open = u.open.has(g.key), title = usageTitle(g.key), info = knownApp(g.key);
    const icon = !g.app ? `<i class="sys">${GEAR_ICON}</i>` : appLogo(info || { name: title, glyph: (title[0] || "?").toUpperCase(), bg: appInfo(g.key).bg, fg: appInfo(g.key).fg });
    const rows = open ? `<div class="dt-procs">${[...g.procs].sort((a, b) => (+b[field] || 0) - (+a[field] || 0))
      .map((p) => `<div class="dt-p"><span>${esc(p.name)}</span><small>PID ${esc(p.pid)}</small><b>${fmt(+p[field] || 0)}</b></div>`).join("")}</div>` : "";
    return `<div class="dt-item ${open ? "open" : ""}"><button class="dt-row" data-dt="${esc(g.key)}" aria-expanded="${open}">${icon}
      <span class="dt-main"><b>${esc(title)}</b><small>${trn("health.detailProcs", g.procs.length)}</small><span class="dt-bar ${u.kind}"><b style="--v:${(g.val / max).toFixed(3)}"></b></span></span>
      <span class="dt-val">${fmt(g.val)}</span><svg class="dt-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>${rows}</div>`;
  };
  const group = (key, list) => (list.length ? `<div class="dt-head"><span>${tr(key)}</span><b>${fmt(list.reduce((a, g) => a + g.val, 0))}</b></div><div class="dt-list">${list.map(item).join("")}</div>` : "");
  $("#dtTitle").textContent = tr(u.kind === "cpu" ? "health.detailCpu" : "health.detailMem");
  const body = $("#dtBody"), st = body.scrollTop;
  body.innerHTML = `<p class="hint">${tr("health.detailTap")}</p>${u.kind === "cpu" ? `<p class="hint">${tr("health.detailIdleHint")}</p>` : ""}` +
    `${group("health.detailApps", apps)}${group("health.detailSystem", sys)}` +
    (idleN ? `<button class="link center dt-idle" data-dt-idle aria-expanded="${!!u.idle}">${tr(u.idle ? "health.detailIdleHide" : "health.detailIdleShow", { n: idleN })}</button>` : "") +
    (apps.length || sys.length || idleN ? "" : `<p class="hint">${tr("health.noProcs")}</p>`) +
    (u.kind === "mem" ? `<p class="hint dt-note">${tr("health.detailShared")}</p>` : "");
  if (body.scrollTop !== st) body.scrollTop = st;
}
function openUsage(kind) {
  health.usage = { kind, open: new Set(), touching: false, scrolled: 0, idle: false };
  openSheet("detailSheet");
  $("#dtBody").scrollTop = 0;
  paintUsage(true);
}
$("#dtBody").addEventListener("pointerdown", () => { if (health.usage) health.usage.touching = true; });
["pointerup", "pointercancel"].forEach((ev) => document.addEventListener(ev, () => { if (health.usage) health.usage.touching = false; }, true));
$("#dtBody").addEventListener("scroll", () => { if (health.usage) health.usage.scrolled = Date.now(); }, { passive: true });
$("#dtBody").addEventListener("click", (e) => {
  const u = health.usage;
  if (!u) return;
  if (e.target.closest("[data-dt-idle]")) { u.idle = !u.idle; return paintUsage(true); }
  const row = e.target.closest("[data-dt]");
  if (!row) return;
  const k = row.dataset.dt;
  u.open.has(k) ? u.open.delete(k) : u.open.add(k);
  paintUsage(true);
});
$("#dtDone").addEventListener("click", () => closeSheets());

function setHealthTab(tab) {
  health.tab = tab;
  $$("#healthSeg button").forEach((b) => { const on = b.dataset.htab === tab; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
  $("#healthPerf").hidden = tab !== "perf";
  $("#healthProcs").hidden = tab !== "procs";
  refreshLenses(); paintHealth(); paintMaint();
}

/* ----- maintenance: clean cache and automatic restart ----- */
async function loadMaint() {
  try { applyMaint(await healthSource().getMaintenance()); health.maintErr = false; }
  catch (e) { if (!health.maint) health.maintErr = true; if (e && e.status === 401) onUnauthorized(); }
  paintMaint();
}
function applyMaint(r) {
  const tz = Number.isFinite(+r.tzOffsetMin) && r.tzOffsetMin != null ? Math.round(+r.tzOffsetMin) : phoneOffsetMin();
  health.maint = { cfg: normReboot(r.reboot), last: +r.lastRebootMs || 0, next: +r.nextRebootMs || 0, note: String(r.note || ""), tz };
}
function paintDays() {
  const c = health.maint.cfg;
  $("#mDayBox").hidden = c.freq === "daily";
  if (c.freq === "daily") return;
  const f = new Intl.DateTimeFormat(i18n.lang, { weekday: "short" });
  const items = c.freq === "weekly" ? [1, 2, 3, 4, 5, 6, 7].map((i) => [i, f.format(new Date(2024, 0, i))]) : Array.from({ length: 28 }, (_, i) => [i + 1, String(i + 1)]);
  $("#mDays").className = "day-grid " + c.freq;
  $("#mDays").innerHTML = items.map(([v, l]) => `<button data-day="${v}" aria-pressed="${v === c.day}">${esc(l)}</button>`).join("");
}
function paintMaint() {
  const m = health.maint;
  $("#mLoading").hidden = !!m || health.maintErr;
  $("#mLoadErr").hidden = !health.maintErr || !!m;
  $("#mWrap").hidden = !m;
  if (!m) return;
  const c = m.cfg;
  $("#mSwitch").setAttribute("aria-checked", c.enabled);
  $("#mGroup").classList.toggle("off", !c.enabled);
  $$("#mFreq button").forEach((b) => { const on = b.dataset.freq === c.freq; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
  paintDays();
  $("#mTime").value = `${pad2(c.hour)}:${pad2(c.minute)}`;
  $("#mLast").textContent = m.last ? fmtWhen(m.last, m.tz) : tr("health.never");
  $("#mNext").textContent = c.enabled && m.next ? fmtWhen(m.next, m.tz) : "–";
  $("#mTvClockRow").hidden = m.tz === phoneOffsetMin();
  $("#mNote").textContent = m.note;
  $("#mNoteRow").hidden = !m.note;
  $("#mNote").hidden = !m.note;
  refreshLenses();
}
async function saveMaint() {
  if (!health.maint || health.saving) return;
  health.saving = true; $("#mSave").disabled = true;
  try { applyMaint(await healthSource().setMaintenance(health.maint.cfg)); paintMaint(); toast(tr("health.saved")); }
  catch (e) { toast(tr("health.saveFail")); if (e && e.status === 401) onUnauthorized(); }
  health.saving = false; $("#mSave").disabled = false;
}
function setCleaning(on) {
  health.cleaning = on;
  $("#cacheBtn").disabled = on;
  $("#cacheSpin").hidden = !on;
  $("#cacheLbl").textContent = tr(on ? "health.cleaning" : "health.cleanBtn");
}
async function runClean() {
  if (health.cleaning) return;
  setCleaning(true);
  try {
    const r = await healthSource().cleanCache();
    const n = Math.max(0, Math.round(+r.freedMb || 0));
    toast(n ? tr("health.freed", { n }) : tr("health.freedNone"));
    healthPoll();
  } catch (e) { toast(tr("health.cleanFail")); if (e && e.status === 401) onUnauthorized(); }
  setCleaning(false);
}
const editReboot = (patch) => { if (!health.maint) return; health.maint.cfg = normReboot({ ...health.maint.cfg, ...patch }); paintMaint(); };

$("#screen-health").addEventListener("click", (e) => {
  const t = e.target;
  let el;
  if (t.closest("#healthBack")) return go("settings");
  if ((el = t.closest("[data-htab]"))) return setHealthTab(el.dataset.htab);
  if ((el = t.closest("[data-sort]"))) return setSort(el.dataset.sort);
  if (t.closest("#cacheBtn")) return openSheet("cacheSheet");
  if (t.closest("#mSwitch")) return editReboot({ enabled: !health.maint.cfg.enabled });
  if ((el = t.closest("[data-freq]"))) return editReboot({ freq: el.dataset.freq });
  if ((el = t.closest("[data-day]"))) return editReboot({ day: +el.dataset.day });
  if (t.closest("#mSave")) return saveMaint();
  if (t.closest("#mRetry")) { health.maintErr = false; paintMaint(); return loadMaint(); }
  if ((el = t.closest("[data-detail]"))) return openUsage(el.dataset.detail);
});
$("#screen-health").addEventListener("keydown", (e) => {
  const el = e.target.closest && e.target.closest("[data-detail]");
  if (el && el === e.target && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openUsage(el.dataset.detail); }
});
$("#mTime").addEventListener("change", (e) => {
  const [h, m] = e.target.value.split(":").map(Number);
  if (Number.isFinite(h) && Number.isFinite(m)) editReboot({ hour: h, minute: m });
});
$("#cacheGo").addEventListener("click", () => { closeSheets(); runClean(); });
$("#cacheNo").addEventListener("click", () => closeSheets());
$("#healthBtn").addEventListener("click", () => go("health"));

function paintHealthAll() {
  paintSortChips(); paintHealth(); paintMaint(); paintUsage(true); renderRecent();
  if (!health.cleaning) $("#cacheLbl").textContent = tr("health.cleanBtn");
}

/* ---------- open a link on the TV ---------- */
const LINK_KEY = "recentLinks";
const link = { busy: false, recent: store.get(LINK_KEY, []).filter((x) => typeof x === "string").slice(0, 3) };
function normalizeLink(raw) {
  let v = String(raw || "").trim();
  if (!v || /\s/.test(v)) return null;
  const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(v) || /^(mailto|javascript|data|file|tel|sms|intent|market):/i.test(v);
  if (!hasScheme && v.includes(".")) v = "https://" + v;
  try { const u = new URL(v); return (u.protocol === "http:" || u.protocol === "https:") && u.hostname ? v : null; } catch { return null; }
}
function linkLabel(url) {
  try {
    const u = new URL(url);
    const t = u.host.replace(/^www\./, "") + (u.pathname + u.search).replace(/^\/$/, "");
    return t.length > 32 ? t.slice(0, 31) + "…" : t;
  } catch { return url.slice(0, 32); }
}
function renderRecent() {
  const box = $("#linkRecent");
  box.hidden = !link.recent.length;
  box.innerHTML = link.recent.length
    ? `<span class="link-lbl">${tr("openlink.recent")}</span>` + link.recent.map((u, i) => `<button class="sort-chip link-chip" data-recent="${i}" title="${esc(u)}"><span>${esc(linkLabel(u))}</span></button>`).join("")
    : "";
}
function updateLinkBtn() { $("#linkGo").disabled = link.busy || !$("#linkUrl").value.trim(); }
function setLinkBusy(on) {
  link.busy = on;
  $("#linkSpin").hidden = !on;
  $("#linkLbl").textContent = tr(on ? "openlink.sending" : "openlink.open");
  updateLinkBtn();
}
async function sendLink() {
  if (link.busy) return;
  const url = normalizeLink($("#linkUrl").value);
  if (!url) return toast(tr("openlink.notWeb"));
  setLinkBusy(true);
  try {
    await healthSource().openLink(url);
    link.recent = [url, ...link.recent.filter((x) => x !== url)].slice(0, 3);
    try { store.set(LINK_KEY, link.recent); } catch { /* private mode */ }
    renderRecent();
    $("#linkUrl").value = "";
    toast(tr("openlink.opened"));
  } catch (e) {
    if (e && e.status === 401) onUnauthorized();
    else if (e && (e.status === 400 || (e.body && e.body.message === "invalid_link"))) toast(tr("openlink.notWeb"));
    else toast(tr("openlink.unreachable"));
  }
  setLinkBusy(false);
}
$("#linkUrl").addEventListener("input", updateLinkBtn);
$("#linkUrl").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); if (!$("#linkGo").disabled) sendLink(); } });
$("#linkGo").addEventListener("click", sendLink);
$("#linkPaste").addEventListener("click", async () => {
  const input = $("#linkUrl");
  try {
    const t = (await navigator.clipboard.readText()).trim();
    if (!t) return input.focus();
    input.value = t; updateLinkBtn();
  } catch { input.focus(); }
});
$("#linkRecent").addEventListener("click", (e) => {
  const c = e.target.closest("[data-recent]");
  if (!c) return;
  $("#linkUrl").value = link.recent[+c.dataset.recent] || ""; updateLinkBtn();
});
renderRecent();

/* ---------- start ---------- */
refreshSceneApps(); renderSiri();
paintEditButtons(); paintConnHint(); paintLang(); paintFooter();
renderTvs();
connectAll();
scan();
loadScenes();
refreshRemote(); refreshApps();
refreshLenses();
requestAnimationFrame(() => requestAnimationFrame(() => $(".app").classList.add("lens-ready")));
document.fonts?.ready.then(refreshLenses);
{
  const q = new URLSearchParams(location.search);
  if (q.get("on")) { state.tvs.forEach((t) => (t.on = true)); connectAll(); }
  if (q.get("s")) go(q.get("s"));
  if (["dpad", "touch", "numbers", "keyboard"].includes(q.get("m"))) $(`#modeSeg [data-mode="${q.get("m")}"]`)?.click();
  if (["fav", "all"].includes(q.get("f"))) $(`#favSeg [data-filter="${q.get("f")}"]`)?.click();
  if (q.get("d")) setTimeout(() => { const c = $(".tv-card[data-i]"); if (c) openDetail(+c.dataset.i, c); }, 2500);
}
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  navigator.serviceWorker.addEventListener("controllerchange", () => { if (hadController) location.reload(); });
}
