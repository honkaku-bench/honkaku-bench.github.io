/* Honkaku Bench — per-case language toggle + chapter pagination */
(function () {
  /* ---- Language switcher ---- */
  var KEY = "hb-lang";
  var sw = document.querySelector(".lang-switch");
  var panes = document.querySelectorAll(".lang-pane");
  var onLangChange = null;

  function setLang(lang) {
    var any = false;
    panes.forEach(function (p) {
      var on = p.getAttribute("data-lang") === lang;
      p.classList.toggle("active", on);
      any = any || on;
    });
    if (!any) { return setLang("en"); }
    if (sw) sw.querySelectorAll("button").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-lang") === lang));
    });
    document.documentElement.setAttribute("lang", lang === "zh" ? "zh-Hans" : lang);
    try { localStorage.setItem(KEY, lang); } catch (e) {}
    if (onLangChange) onLangChange();
  }

  if (sw) {
    sw.querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () { setLang(b.getAttribute("data-lang")); });
    });
  }
  var stored;
  try { stored = localStorage.getItem(KEY); } catch (e) {}
  setLang(stored || "en");

  /* ---- Chapter pagination ---- */
  var dossier = document.querySelector(".dossier");
  if (!dossier) return;

  var firstPane = dossier.querySelector(".lang-pane");
  if (!firstPane || firstPane.querySelectorAll("h2.puzzle-sec").length <= 1) return;

  // Split each lang-pane by <h2 class="puzzle-sec"> into chapter divs.
  // Use seenH2 flag (not current.length) to avoid a blank first chapter from
  // whitespace text nodes that precede the first heading.
  dossier.querySelectorAll(".lang-pane").forEach(function (pane) {
    var nodes = Array.from(pane.childNodes);
    var chapters = [], current = [], seenH2 = false;
    nodes.forEach(function (node) {
      var isH2 = node.nodeType === 1 && node.tagName === "H2" &&
                 node.classList.contains("puzzle-sec");
      if (isH2 && seenH2) { chapters.push(current); current = []; }
      if (isH2) seenH2 = true;
      current.push(node);
    });
    if (current.length) chapters.push(current);
    while (pane.firstChild) pane.removeChild(pane.firstChild);
    chapters.forEach(function (group, i) {
      var div = document.createElement("div");
      div.className = "chapter-sec";
      div.setAttribute("data-ch", i);
      group.forEach(function (n) { div.appendChild(n); });
      pane.appendChild(div);
    });
  });

  // Prepend a case-file cover page as chapter 0 in every lang-pane
  function buildCover() {
    var head = document.querySelector(".case-head");
    var caseNo = head && head.querySelector(".case-no");
    var h1    = head && head.querySelector("h1");
    var zhEl  = head && head.querySelector(".zh");
    var diffEl = head && head.querySelector(".diff");
    var tagsEl = head && head.querySelector(".tags");
    var teaserMeta = document.querySelector('meta[name="description"]');

    var html = '<div class="cover-page">';
    if (caseNo) html += '<div class="cover-stamp">' + caseNo.textContent.trim() + '</div>';
    if (h1)     html += '<h2 class="cover-title">' + h1.innerHTML + '</h2>';
    if (zhEl && zhEl.textContent.trim())
                html += '<p class="cover-subtitle">' + zhEl.textContent.trim() + '</p>';
    html += '<div class="cover-rule"></div>';
    var badges = "";
    if (diffEl) {
      var dTxt = diffEl.textContent.trim();
      badges += '<span class="cover-diff ' + dTxt + '">' + dTxt + '</span>';
    }
    if (tagsEl) tagsEl.querySelectorAll(".tag").forEach(function (t) {
      badges += '<span class="cover-tag">' + t.textContent.trim() + '</span>';
    });
    if (badges) html += '<div class="cover-badges">' + badges + '</div>';
    if (teaserMeta) {
      var tTxt = teaserMeta.getAttribute("content");
      if (tTxt) html += '<p class="cover-teaser">' + tTxt + '</p>';
    }
    html += '</div>';
    return html;
  }

  var coverHTML = buildCover();
  dossier.querySelectorAll(".lang-pane").forEach(function (pane) {
    var cover = document.createElement("div");
    cover.className = "chapter-sec case-cover";
    cover.innerHTML = coverHTML;
    pane.insertBefore(cover, pane.firstChild);
  });

  var total = firstPane.querySelectorAll(".chapter-sec").length;
  var cur = 0;

  function chapterTitle() {
    var p = dossier.querySelector(".lang-pane.active") || firstPane;
    var s = p.querySelectorAll(".chapter-sec")[cur];
    var h = s && s.querySelector("h2.puzzle-sec");
    return h ? h.textContent.trim() : "";
  }

  function makeNav() {
    var el = document.createElement("div");
    el.className = "chapter-nav";
    el.innerHTML =
      '<button class="ch-btn ch-prev">← Prev</button>' +
      '<span class="ch-label"></span>' +
      '<button class="ch-btn ch-next">Next →</button>';
    el.querySelector(".ch-prev").addEventListener("click", function () {
      if (cur > 0) { cur--; refresh(); scrollUp(); }
    });
    el.querySelector(".ch-next").addEventListener("click", function () {
      if (cur < total - 1) { cur++; refresh(); scrollUp(); }
    });
    return el;
  }

  var navTop = makeNav(), navBot = makeNav();
  dossier.parentNode.insertBefore(navTop, dossier);
  dossier.insertAdjacentElement("afterend", navBot);

  function scrollUp() {
    var top = navTop.getBoundingClientRect().top + window.pageYOffset - 84;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }

  var mobileBarRef = null;

  function refresh() {
    dossier.querySelectorAll(".lang-pane").forEach(function (pane) {
      pane.querySelectorAll(".chapter-sec").forEach(function (s, i) {
        s.style.display = i === cur ? "" : "none";
      });
    });
    var t = chapterTitle();
    var lbl = cur === 0
      ? "Case File  ·  1 of " + total
      : "Part " + cur + " of " + (total - 1) + (t ? "  ·  " + t : "");
    [navTop, navBot].forEach(function (nav) {
      nav.querySelector(".ch-label").textContent = lbl;
      nav.querySelector(".ch-prev").disabled = cur === 0;
      nav.querySelector(".ch-next").disabled = cur === total - 1;
    });
    if (mobileBarRef) mobileBarRef.update();
  }

  /* ---- Mobile bottom chapter bar ---- */
  function makeMobileBar() {
    var bar = document.createElement("div");
    bar.className = "mobile-chapbar";
    bar.innerHTML =
      '<button class="mcb-btn mcb-prev" aria-label="Previous chapter">&#8592;</button>' +
      '<button class="mcb-center" aria-haspopup="listbox" aria-expanded="false">' +
        '<span class="mcb-text"></span>' +
        '<svg class="mcb-chevron" viewBox="0 0 16 16" aria-hidden="true">' +
          '<polyline points="3,11 8,5 13,11"/>' +
        '</svg>' +
      '</button>' +
      '<button class="mcb-btn mcb-next" aria-label="Next chapter">&#8594;</button>';

    var drawer = document.createElement("div");
    drawer.className = "mobile-chapdrawer";
    drawer.setAttribute("aria-hidden", "true");
    var inner = document.createElement("div");
    inner.className = "mcd-inner";
    drawer.appendChild(inner);

    bar.querySelector(".mcb-prev").addEventListener("click", function () {
      if (cur > 0) { cur--; refresh(); scrollUp(); }
    });
    bar.querySelector(".mcb-next").addEventListener("click", function () {
      if (cur < total - 1) { cur++; refresh(); scrollUp(); }
    });

    var drawerOpen = false;
    var center = bar.querySelector(".mcb-center");

    function openDrawer() {
      drawerOpen = true;
      drawer.classList.add("open");
      drawer.setAttribute("aria-hidden", "false");
      center.setAttribute("aria-expanded", "true");
      bar.classList.add("drawer-open");
    }
    function closeDrawer() {
      drawerOpen = false;
      drawer.classList.remove("open");
      drawer.setAttribute("aria-hidden", "true");
      center.setAttribute("aria-expanded", "false");
      bar.classList.remove("drawer-open");
    }

    center.addEventListener("click", function () {
      if (drawerOpen) closeDrawer(); else openDrawer();
    });

    document.addEventListener("click", function (e) {
      if (drawerOpen && !bar.contains(e.target) && !drawer.contains(e.target)) {
        closeDrawer();
      }
    });

    function buildList() {
      inner.innerHTML = "";
      var p = dossier.querySelector(".lang-pane.active") || firstPane;
      p.querySelectorAll(".chapter-sec").forEach(function (s, i) {
        var h = s.querySelector("h2.puzzle-sec");
        var label = i === 0 ? "Case File" : (h ? h.textContent.trim() : "Part " + i);
        var btn = document.createElement("button");
        btn.className = "mcd-item" + (i === cur ? " active" : "");
        btn.textContent = (i === 0 ? "" : i + ". ") + label;
        btn.addEventListener("click", function () {
          cur = i; refresh(); scrollUp(); closeDrawer();
        });
        inner.appendChild(btn);
      });
    }

    document.body.appendChild(drawer);
    document.body.appendChild(bar);
    document.body.classList.add("has-chapbar");

    return {
      update: function () {
        var t = chapterTitle();
        var lbl = cur === 0
          ? "Case File  ·  1 / " + total
          : cur + " / " + (total - 1) + (t ? "  ·  " + t : "");
        bar.querySelector(".mcb-text").textContent = lbl;
        bar.querySelector(".mcb-prev").disabled = cur === 0;
        bar.querySelector(".mcb-next").disabled = cur === total - 1;
        buildList();
      }
    };
  }

  onLangChange = refresh;
  refresh();

  mobileBarRef = makeMobileBar();
  mobileBarRef.update();
})();
