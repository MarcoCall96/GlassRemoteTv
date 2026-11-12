const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

if (new URLSearchParams(location.search).has("mock")) document.documentElement.classList.add("mock");

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

/* ---------- toasts ---------- */
let toastTimer = null;
function toast(msg, ms = 2400) {
  const t = $("#toast");
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.hidden = true), ms);
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
}
addEventListener("resize", refreshLenses);

/* ---------- navigation ---------- */
function go(screen) {
  $$(".screen").forEach((s) => s.classList.toggle("active", s.id === "screen-" + screen));
  $$(".tab").forEach((t) => { const on = t.dataset.screen === screen; t.classList.toggle("on", on); on ? t.setAttribute("aria-current", "page") : t.removeAttribute("aria-current"); });
  refreshLenses();
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
  if (keepBackdrop !== true) $("#sheetBackdrop").hidden = true;
  $$(".sheet").forEach((s) => (s.hidden = true));
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
async function fetchJson(url, opts = {}, ms = 7000) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { ...opts, signal: ctl.signal });
    if (!r.ok) throw new Error(r.status);
    return await r.json();
  } finally { clearTimeout(timer); }
}

function openConn(tv) {
  const base = bridgeUrl();
  if (!base) { state.bridgeOk = false; return null; }
  const old = state.conns[tv.host];
  if (old && old.readyState <= 1) return old;
  let ws;
  try { ws = new WebSocket(`${base}?host=${encodeURIComponent(tv.host)}`); } catch { return null; }
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
  if (!base) { state.bridgeOk = false; setScanHint("scan.noBridge"); paintConnHint(); renderTvs(); return; }
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
}
$("#scanBtn").addEventListener("click", () => scan(true));
document.addEventListener("visibilitychange", () => { if (!document.hidden) { scan(); connectAll(); } });
addEventListener("online", () => { scan(); connectAll(); });
$("#saveBridge").addEventListener("click", () => { state.bridge = $("#bridgeUrl").value.trim(); localStorage.setItem("bridge", state.bridge); closeAll(); connectAll(); scan(); loadScenes(); });

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
    holdTimer = setTimeout(() => { repeatTimer = setInterval(() => press(b.dataset.key), 110); }, 380);
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
  const flash = (dir) => { const c = $(`.tp.${dir}`, pad); c.classList.add("on"); setTimeout(() => c.classList.remove("on"), 180); };
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
  pad.addEventListener("pointerup", () => { if (!moved) { press("DPAD_CENTER"); pad.classList.add("tap"); setTimeout(() => pad.classList.remove("tap"), 160); } end(); });
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
  if (b.dataset.k === "BKSP") kbHold = setTimeout(() => { kbRep = setInterval(() => kbPress("BKSP"), 90); }, 380);
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
  const u = (action, value) => `${base}/api/shortcut?host=${encodeURIComponent(t.host)}&action=${action}${value != null ? "&value=" + encodeURIComponent(value) : ""}`;
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
const FLIP_MS = reduceMotion ? 1 : 720;
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
  const move = flip.animate([px(from), px(to)], { duration: FLIP_MS, easing: "cubic-bezier(.3,.85,.25,1)" });
  flipInner.style.transform = "rotateY(180deg)";
  flipInner.animate([{ transform: "rotateY(0deg)" }, { transform: "rotateY(180deg)" }], { duration: FLIP_MS, easing: "cubic-bezier(.45,.05,.25,1)" });
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
  const ms = Math.max(1, FLIP_MS - 100);
  const move = flip.animate([px(from), px(to)], { duration: ms, easing: "cubic-bezier(.3,.85,.25,1)" });
  flipInner.style.transform = "rotateY(0deg)";
  flipInner.animate([{ transform: "rotateY(180deg)" }, { transform: "rotateY(0deg)" }], { duration: ms, easing: "cubic-bezier(.45,.05,.25,1)" });
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
$("#bridgeUrl").value = state.bridge;

/* ---------- language: glass sheet instead of a native dropdown ---------- */
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
  paintEditButtons(); paintScanHint(); paintConnHint(); paintLang();
  requestAnimationFrame(refreshLenses);
});

/* ---------- start ---------- */
refreshSceneApps(); renderSiri();
paintEditButtons(); paintConnHint(); paintLang();
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
  if (q.get("m")) $(`#modeSeg [data-mode="${q.get("m")}"]`)?.click();
  if (q.get("f")) $(`#favSeg [data-filter="${q.get("f")}"]`)?.click();
  if (q.get("d")) setTimeout(() => { const c = $(".tv-card[data-i]"); if (c) openDetail(+c.dataset.i, c); }, 2500);
}
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  navigator.serviceWorker.addEventListener("controllerchange", () => { if (hadController) location.reload(); });
}
