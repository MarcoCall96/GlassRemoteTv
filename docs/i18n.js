/* Tiny i18n layer. Language packs live in ./lang/<code>.js and fill window.I18N[code].
   Add a language: copy lang/en.js to lang/xx.js, translate the values, add the file to index.html,
   to the SHELL list in service-worker.js and to LANG_NAMES below. */
(function () {
  const LANG_NAMES = { it: "Italiano", en: "English", es: "Español", fr: "Français", de: "Deutsch", pt: "Português" };
  const D = (window.I18N = window.I18N || {});
  const codes = () => Object.keys(LANG_NAMES).filter((c) => D[c]);

  const detect = () => {
    for (const l of navigator.languages || [navigator.language]) {
      const c = String(l || "").slice(0, 2).toLowerCase();
      if (D[c]) return c;
    }
    return "en";
  };
  const saved = () => { try { return localStorage.getItem("lang") || ""; } catch { return ""; } };
  let cur = D[saved()] ? saved() : detect();

  const fmt = (s, vars) => (vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m)) : s);
  const t = (key, vars) => {
    const s = (D[cur] && D[cur][key]) ?? (D.en && D.en[key]) ?? key;
    return fmt(s, vars);
  };
  /* plural: looks for key.one / key.other (falls back to key.other) */
  const tn = (key, n, vars = {}) => {
    const form = new Intl.PluralRules(cur).select(n) === "one" ? "one" : "other";
    const has = (k) => (D[cur] && D[cur][k] != null) || (D.en && D.en[k] != null);
    return t(has(`${key}.${form}`) ? `${key}.${form}` : `${key}.other`, { n, ...vars });
  };

  function apply(root = document) {
    document.documentElement.lang = cur;
    root.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
    root.querySelectorAll("[data-i18n-html]").forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
    root.querySelectorAll("[data-i18n-aria]").forEach((el) => el.setAttribute("aria-label", t(el.dataset.i18nAria)));
    root.querySelectorAll("[data-i18n-ph]").forEach((el) => el.setAttribute("placeholder", t(el.dataset.i18nPh)));
  }

  function setLang(code) {
    try { code ? localStorage.setItem("lang", code) : localStorage.removeItem("lang"); } catch { /* private mode */ }
    cur = D[code] ? code : detect();
    apply();
    document.dispatchEvent(new CustomEvent("langchange", { detail: cur }));
  }

  window.tr = t;
  window.trn = tn;
  window.i18n = { apply, setLang, get lang() { return cur; }, get pref() { return D[saved()] ? saved() : ""; }, names: LANG_NAMES, codes };
  apply();
})();
