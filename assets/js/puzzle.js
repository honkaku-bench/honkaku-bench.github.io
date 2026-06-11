/* Honkaku Bench — per-case language toggle (EN / 中文 / 日本語).
   Remembers the choice in localStorage so it persists across cases. */
(function () {
  var KEY = "hb-lang";
  var sw = document.querySelector(".lang-switch");
  if (!sw) return;
  var panes = document.querySelectorAll(".lang-pane");
  var buttons = sw.querySelectorAll("button");

  function setLang(lang) {
    var any = false;
    panes.forEach(function (p) {
      var on = p.getAttribute("data-lang") === lang;
      p.classList.toggle("active", on);
      any = any || on;
    });
    if (!any) { return setLang("en"); }   // fall back if stored lang missing
    buttons.forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-lang") === lang));
    });
    document.documentElement.setAttribute("lang", lang === "zh" ? "zh-Hans" : lang);
    try { localStorage.setItem(KEY, lang); } catch (e) {}
  }

  buttons.forEach(function (b) {
    b.addEventListener("click", function () { setLang(b.getAttribute("data-lang")); });
  });

  var stored;
  try { stored = localStorage.getItem(KEY); } catch (e) {}
  setLang(stored || "en");
})();
