/* ==================================================================
   app.js — routing, rendering, language, theme and the transition.
   You shouldn't need to touch this file; the words live in content.js.
================================================================== */

(function () {
  "use strict";

  var C = window.CONTENT || CONTENT;

  var view       = document.getElementById("view");
  var navDisc    = document.getElementById("nav-disciplines");
  var navMain    = document.getElementById("nav-primary");
  var navWork    = document.getElementById("nav-work");
  var navLabel   = document.getElementById("nav-work-label");
  var overlay    = document.getElementById("sidebar-nav");
  var toggle     = document.getElementById("menu-toggle");
  var langBox    = document.getElementById("lang");
  var wipe       = document.getElementById("wipe");
  var slate      = document.getElementById("wipe-slate");

  var DISC_ORDER = ["film", "photo", "sound"];
  var LANGS      = ["en", "th"];
  var STORE_KEY  = "reverie-lang";

  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------ language */

  var LANG = (function () {
    var saved;
    try { saved = localStorage.getItem(STORE_KEY); } catch (e) { /* private mode */ }
    if (LANGS.indexOf(saved) > -1) return saved;
    return /^th\b/i.test(navigator.language || "") ? "th" : "en";
  })();

  // Pull the right string out of a { en, th } pair. A plain string — an email,
  // a product name — is returned as-is, so it shows in both languages.
  function t(v) {
    if (v == null) return "";
    if (typeof v === "string" || Array.isArray(v)) return v;
    if (typeof v === "object") return v[LANG] != null ? v[LANG] : (v.en != null ? v.en : "");
    return v;
  }

  function ui(key) {
    var set = (C.ui && (C.ui[LANG] || C.ui.en)) || {};
    return set[key] != null ? set[key] : "";
  }

  function setLang(next) {
    if (LANGS.indexOf(next) < 0 || next === LANG) return;
    LANG = next;
    try { localStorage.setItem(STORE_KEY, LANG); } catch (e) { /* ignore */ }
    document.documentElement.setAttribute("lang", LANG);
    buildNav();
    route(LANG === "th" ? "ไทย" : "english");
  }

  function buildLangToggle() {
    langBox.innerHTML = LANGS.map(function (code) {
      var label = code === "th" ? "ไทย" : "EN";
      return '<button type="button" class="lang-btn" data-lang="' + code + '"' +
             (code === LANG ? ' aria-current="true"' : "") + ">" + label + "</button>";
    }).join('<span class="lang-sep">/</span>');
  }

  langBox.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-lang]");
    if (btn) setLang(btn.getAttribute("data-lang"));
  });

  /* --------------------------------------------------------------- theme */

  var THEME_KEY = "reverie-theme";
  var darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
  var themeBtn  = document.getElementById("theme-btn");

  function activeTheme() {
    var forced = document.documentElement.getAttribute("data-theme");
    if (forced === "light" || forced === "dark") return forced;
    return darkQuery.matches ? "dark" : "light";
  }

  function syncThemeBtn() {
    var next = activeTheme() === "dark" ? ui("themeToLight") : ui("themeToDark");
    themeBtn.setAttribute("aria-label", next);
    themeBtn.setAttribute("title", next);
  }

  themeBtn.addEventListener("click", function () {
    var next = activeTheme() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* ignore */ }
    syncThemeBtn();
  });

  darkQuery.addEventListener("change", syncThemeBtn);

  /* ------------------------------------------------------------ helpers */

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function rich(s) {
    return esc(s)
      .replace(/&lt;(\/?)(b|em|i|strong|br)&gt;/g, "<$1$2>")
      .replace(/&lt;a href=&quot;([^"<>]+)&quot;&gt;/g, '<a class="btn" href="$1">')
      .replace(/&lt;\/a&gt;/g, "</a>");
  }

  function paras(list, cls) {
    var arr = t(list);
    return (Array.isArray(arr) ? arr : [arr]).map(function (p) {
      return "<p" + (cls ? ' class="' + cls + '"' : "") + ">" + rich(p) + "</p>";
    }).join("");
  }

  function pad(n) { return String(n).padStart(2, "0"); }

  function find(slug) {
    for (var i = 0; i < C.work.length; i++) if (C.work[i].slug === slug) return C.work[i];
    return null;
  }

  function workIn(d) { return C.work.filter(function (w) { return w.discipline === d; }); }

  function btn(c, onDark) {
    return c ? '<a class="btn" href="' + esc(c.href) + '">' + esc(t(c.label)) +
               '<span aria-hidden="true">&rarr;</span></a>' : "";
  }

  var MARKS = '<div class="hero-marks" aria-hidden="true"><i></i><i></i><i></i><i></i></div>';

  // First real image in a project, used as its tile on the index grids.
  function thumbOf(w) {
    var m = w.media || [];
    for (var i = 0; i < m.length; i++) {
      if (m[i].type === "image") return m[i].src;
      if (m[i].type === "images" && m[i].items && m[i].items[0]) return m[i].items[0].src;
      if (m[i].type === "video" && m[i].poster) return m[i].poster;
    }
    return "assets/img/" + (w.discipline || "cover") + ".svg";
  }

  /* ------------------------------------------------------------ sidebar */

  function buildNav() {
    document.querySelectorAll("[data-bind]").forEach(function (el) {
      var v = C[el.getAttribute("data-bind")];
      if (v != null) el.textContent = t(v);
    });

    buildLangToggle();
    syncThemeBtn();
    toggle.querySelector(".menu-label").textContent =
      overlay.classList.contains("is-open") ? ui("close") : ui("menu");
    navLabel.textContent = ui("workLabel");

    navDisc.innerHTML = DISC_ORDER.map(function (k, i) {
      var d = C.disciplines[k];
      if (!d) return "";
      return '<li><a href="#/' + esc(k) + '">' +
             '<span class="disc-n">' + pad(i + 1) + "</span>" +
             "<span>" + esc(t(d.label)) + "</span></a></li>";
    }).join("");

    navMain.innerHTML = [
      { href: "#/",        label: C.name },
      { href: "#/work",    label: ui("navWork") },
      { href: "#/about",   label: ui("navAbout") },
      { href: "#/gear",    label: ui("navGear") },
      { href: "#/contact", label: ui("navContact") }
    ].map(function (p) {
      return '<li><a href="' + p.href + '">' + esc(p.label) + "</a></li>";
    }).join("");

    navWork.innerHTML = DISC_ORDER.map(function (k) {
      return workIn(k).map(function (w) {
        return '<li><a href="#/work/' + esc(w.slug) + '">' + esc(t(w.client)) + "</a></li>";
      }).join("");
    }).join("") +
    '<li><a class="nav-dm" href="#/contact">' + esc(ui("dmWork")) + "</a></li>";

    markCurrent(location.hash || "#/");
  }

  function markCurrent(hash) {
    document.querySelectorAll(".topbar a, .overlay a").forEach(function (a) {
      a.removeAttribute("aria-current");
      if (a.getAttribute("href") === hash) a.setAttribute("aria-current", "page");
    });
  }

  toggle.addEventListener("click", function () {
    var open = overlay.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.querySelector(".menu-label").textContent = open ? ui("close") : ui("menu");
    document.body.style.overflow = open ? "hidden" : "";
  });

  /* -------------------------------------------------------------- media */

  function shot(inner, caption, n) {
    return '<figure class="shot">' +
      (n ? '<span class="frame-n">' + esc(n) + "</span>" : "") +
      inner +
      (caption ? "<figcaption>" + esc(t(caption)) + "</figcaption>" : "") +
      "</figure>";
  }

  function imgTag(src, alt, eager) {
    return '<img src="' + esc(src) + '" alt="' + esc(t(alt) || "") + '"' +
           (eager ? "" : ' loading="lazy"') + ' decoding="async">';
  }

  function renderMedia(blocks) {
    var n = 0;
    return '<div class="stack">' + (blocks || []).map(function (m) {
      switch (m.type) {
        case "image":
          n++;
          return shot(imgTag(m.src, m.alt), m.caption, pad(n));

        case "images":
          return '<div class="pair">' + (m.items || []).map(function (it) {
            n++;
            return shot(imgTag(it.src, it.alt), null, pad(n));
          }).join("") + "</div>";

        case "video":
          return shot('<video controls preload="metadata" playsinline src="' + esc(m.src) + '"' +
            (m.poster ? ' poster="' + esc(m.poster) + '"' : "") + "></video>", m.caption);

        case "embed":
          return shot('<div class="embed"><iframe src="' + esc(m.src) + '" title="' +
            esc(t(m.caption) || "Video") + '" loading="lazy" ' +
            'referrerpolicy="strict-origin-when-cross-origin" ' +
            'allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>', m.caption);

        case "audio":
          return renderTracks(m.tracks || []);

        default:
          return "";
      }
    }).join("") + "</div>";
  }

  function renderTracks(tracks) {
    return '<div class="tracks">' + tracks.map(function (tr, i) {
      return '<button class="track" data-src="' + esc(tr.src) + '" data-title="' + esc(t(tr.title)) + '">' +
             '<span class="n">' + pad(i + 1) + "</span>" +
             '<span class="t">' + esc(t(tr.title)) + "</span>" +
             '<span class="d">' + esc(tr.length || "") + "</span></button>";
    }).join("") + "</div>";
  }

  /* --------------------------------------------------------------- hero */

  function hero(o) {
    var media = o.src
      ? '<div class="hero-media">' + imgTag(o.src, o.alt, true) + "</div><div class=\"hero-scrim\"></div>"
      : "";
    return '<section class="hero' + (o.src ? " has-media" : "") + '">' +
      media + MARKS +
      '<div class="hero-body">' +
        (o.kicker ? '<p class="kicker">' + esc(o.kicker) + "</p>" : "") +
        '<h1 class="display">' + esc(o.title) + "</h1>" +
        (o.sub ? '<div class="hero-sub">' + o.sub + "</div>" : "") +
        (o.foot ? '<div class="hero-foot">' + o.foot + "</div>" : "") +
      "</div></section>";
  }

  function sectionHead(title, count) {
    return '<div class="section-head"><h2>' + esc(title) + "</h2>" +
      (count != null ? '<span class="section-count">' + esc(count) + "</span>" : "") + "</div>";
  }

  function tiles(items) {
    return '<div class="tiles">' + items.map(function (w, i) {
      return '<a class="tile" href="#/work/' + esc(w.slug) + '">' +
        imgTag(thumbOf(w), t(w.client)) +
        '<span class="tile-scrim"></span>' +
        '<span class="tile-cap">' +
          '<span class="tile-n">' + pad(i + 1) + " / " + esc(w.year || "") + "</span>" +
          '<span class="tile-t">' + esc(t(w.client)) + "</span>" +
          '<span class="tile-k">' + esc(t(w.kind) || "") + "</span>" +
        "</span></a>";
    }).join("") +
    '<a class="tile-dm" href="#/contact"><span>' + esc(ui("dmWork")) + " &rarr;</span></a>" +
    "</div>";
  }

  /* --------------------------------------------------------------- views */

  function viewHome() {
    var h = C.home;
    return hero({
      src: h.cover && h.cover.src, alt: h.cover && h.cover.alt,
      kicker: t(C.tagline), title: t(h.headline),
      sub: paras(h.body), foot: btn(h.cta)
    }) +
    '<section class="slab"><div class="wrap">' +
      sectionHead(ui("navWork"), pad(C.work.length)) +
      '<div class="disc-cards">' + DISC_ORDER.map(function (k, i) {
        var d = C.disciplines[k];
        if (!d) return "";
        return '<a class="disc-card" href="#/' + esc(k) + '"><span class="disc-card-row">' +
          '<span class="disc-card-n">' + pad(i + 1) + "</span>" +
          '<span class="disc-card-t">' + esc(t(d.label)) + "</span>" +
          '<span class="disc-card-b">' + esc(t(d.blurb) || "") + "</span>" +
          '<span class="disc-card-a">&rarr;</span></span></a>';
      }).join("") + "</div>" +
    "</div></section>" +
    '<section class="slab-tight"><div class="wrap">' + tiles(C.work) + "</div></section>";
  }

  function viewDiscipline(key) {
    var d = C.disciplines[key];
    if (!d) return viewMissing();
    var mine = workIn(key);

    return hero({
      src: d.cover && d.cover.src, alt: d.cover && d.cover.alt,
      kicker: t(d.blurb), title: t(d.headline),
      sub: paras(d.intro), foot: btn(d.cta)
    }) +
    '<section class="slab"><div class="wrap">' +
      sectionHead(ui("services"), pad(d.services.length)) +
      '<div class="svc">' + d.services.map(function (s, i) {
        return '<article class="svc-item">' +
          '<span class="svc-n">' + pad(i + 1) + "</span>" +
          '<div class="svc-body"><h3>' + esc(t(s.title)) + "</h3>" +
            "<p>" + rich(t(s.body)) + "</p>" +
            (s.gets ? '<p class="svc-gets"><b>' + esc(ui("youGet")) + "</b>" + esc(t(s.gets)) + "</p>" : "") +
            (s.note ? '<p class="svc-note">' + esc(t(s.note)) + "</p>" : "") +
          "</div></article>";
      }).join("") + "</div>" +
    "</div></section>" +
    (mine.length
      ? '<section class="slab-tight"><div class="wrap">' +
          sectionHead(ui("selectedWork").replace("{x}", t(d.label)), pad(mine.length)) +
          tiles(mine) + "</div></section>"
      : "");
  }

  function viewAbout() {
    var a = C.about;
    return hero({
      src: a.cover && a.cover.src, alt: a.cover && a.cover.alt,
      kicker: t(C.tagline), title: t(a.headline)
    }) +
    '<section class="slab"><div class="wrap">' +
      '<div class="lede measure">' + paras(a.body) + "</div>" +
    "</div></section>" +
    '<section class="slab-tight"><div class="wrap">' +
      (a.facts && a.facts.length
        ? '<dl class="rows">' + a.facts.map(function (f) {
            return '<div class="row"><dt>' + esc(t(f.k)) + "</dt><dd>" + esc(t(f.v)) + "</dd></div>";
          }).join("") + "</dl>"
        : "") +
      '<p style="margin-top:2.4rem">' + btn(a.cta) + "</p>" +
    "</div></section>";
  }

  function viewGear() {
    var g = C.gear;
    if (!g) return viewMissing();
    return hero({ kicker: t(C.tagline), title: t(g.headline),
                  sub: g.intro ? "<p>" + rich(t(g.intro)) + "</p>" : "" }) +
    '<section class="slab"><div class="wrap">' +
      g.groups.map(function (grp) {
        return '<section class="gear-group">' +
          sectionHead(t(grp.title), pad(grp.items.length)) +
          '<div class="gear-list">' + grp.items.map(function (it) {
            var inner = '<span class="gear-name">' + esc(t(it.name)) + "</span>" +
                        '<span class="gear-note">' + esc(t(it.note) || "") + "</span>" +
                        '<span class="gear-link">' + (it.url ? "&#8599;" : "") + "</span>";
            return it.url
              ? '<a class="gear-row" href="' + esc(it.url) + '" target="_blank" rel="noopener noreferrer">' + inner + "</a>"
              : '<div class="gear-row">' + inner + "</div>";
          }).join("") + "</div></section>";
      }).join("") +
      "<p>" + btn(g.cta) + "</p>" +
    "</div></section>";
  }

  function viewContact() {
    var c = C.contact;
    return hero({ kicker: t(C.tagline), title: t(c.headline),
                  sub: "<p>" + rich(t(c.intro)) + "</p>" }) +
    '<section class="slab"><div class="wrap">' +
      '<dl class="rows">' + c.rows.map(function (r) {
        var val = r.href
          ? '<a href="' + esc(r.href) + '">' + esc(t(r.v)) + "</a>"
          : esc(t(r.v));
        return '<div class="row"><dt>' + esc(t(r.k)) + "</dt><dd>" + val + "</dd></div>";
      }).join("") + "</dl>" +
    "</div></section>";
  }

  function viewWorkIndex() {
    return hero({ kicker: t(C.tagline), title: ui("allWork") }) +
      DISC_ORDER.map(function (k) {
        var d = C.disciplines[k], mine = workIn(k);
        if (!d || !mine.length) return "";
        return '<section class="slab-tight"><div class="wrap">' +
          sectionHead(t(d.label), pad(mine.length)) + tiles(mine) + "</div></section>";
      }).join("");
  }

  function viewProject(w) {
    var d = C.disciplines[w.discipline];
    var meta = [w.year, t(w.role), t(w.kind)].filter(Boolean).map(function (x) {
      return "<span>" + esc(x) + "</span>";
    }).join("");

    return hero({
      kicker: d ? t(d.label) : "", title: t(w.title) || t(w.client),
      sub: '<div class="meta-row">' + meta + "</div>",
      foot: '<a class="back" href="#/' + esc(w.discipline || "work") + '">&#8592; ' +
            esc(d ? t(d.label) : ui("navWork")) + "</a>"
    }) +
    '<section class="slab-tight"><div class="wrap">' + renderMedia(w.media) + "</div></section>" +
    '<section class="slab-tight"><div class="wrap">' +
      '<div class="lede measure">' + paras(w.blurb) + "</div>" +
      '<p style="margin-top:2rem">' +
        '<a class="btn" href="#/contact">' + esc(ui("workWithMe")) +
        '<span aria-hidden="true">&rarr;</span></a></p>' +
    "</div></section>";
  }

  function viewMissing() {
    return hero({ title: ui("notFoundTitle"), sub: "<p>" + esc(ui("notFoundBody")) + "</p>",
                  foot: '<a class="btn" href="#/">' + esc(ui("backHome")) +
                        '<span aria-hidden="true">&rarr;</span></a>' });
  }

  /* -------------------------------------------------------------- router */

  function resolve(hash) {
    var parts = hash.replace(/^#\/?/, "").split("/").filter(Boolean);
    var suffix = " — " + C.name;

    if (parts.length === 0)
      return { html: viewHome(), title: C.name + " — " + t(C.tagline), slate: C.name };

    if (C.disciplines[parts[0]] && !parts[1])
      return { html: viewDiscipline(parts[0]), title: t(C.disciplines[parts[0]].label) + suffix,
               slate: t(C.disciplines[parts[0]].label) };

    if (parts[0] === "about")
      return { html: viewAbout(), title: ui("navAbout") + suffix, slate: ui("navAbout") };

    if (parts[0] === "gear")
      return { html: viewGear(), title: ui("navGear") + suffix, slate: ui("navGear") };

    if (parts[0] === "contact")
      return { html: viewContact(), title: ui("navContact") + suffix, slate: ui("navContact") };

    if (parts[0] === "work" && !parts[1])
      return { html: viewWorkIndex(), title: ui("navWork") + suffix, slate: ui("workLabel") };

    if (parts[0] === "work") {
      var w = find(parts[1]);
      if (w) return { html: viewProject(w), title: t(w.client) + suffix,
                      slate: w.discipline ? t(C.disciplines[w.discipline].label) : ui("workLabel") };
    }

    return { html: viewMissing(), title: ui("notFoundTitle") + suffix, slate: "404" };
  }

  function paint(page) {
    view.innerHTML = page.html;
    document.title = page.title;
    var kids = view.children;
    for (var i = 0; i < kids.length; i++) kids[i].style.setProperty("--i", i);
    window.scrollTo(0, 0);
    bindTracks();
    if (audio.paused && !audio.duration) bar.hidden = true;
  }

  var busy = false;

  function route(slateOverride) {
    var hash = location.hash || "#/";
    var page = resolve(hash);
    markCurrent(hash);
    if (overlay.classList.contains("is-open")) toggle.click();

    if (REDUCED || busy) { paint(page); return; }

    busy = true;
    slate.textContent = typeof slateOverride === "string" ? slateOverride : page.slate;
    wipe.classList.add("is-active", "is-covering");

    setTimeout(function () {
      paint(page);
      wipe.classList.remove("is-covering");
      wipe.classList.add("is-revealing");
      setTimeout(function () {
        wipe.classList.remove("is-active", "is-revealing");
        busy = false;
      }, 420);
    }, 400);
  }

  /* -------------------------------------------------------- audio player */

  var audio    = new Audio();
  var bar      = document.getElementById("player");
  var playBtn  = document.getElementById("player-btn");
  var titleEl  = document.getElementById("player-title");
  var timeEl   = document.getElementById("player-time");
  var fill     = document.getElementById("player-fill");
  var barTrack = fill.parentNode;
  var current  = null;

  function clock(s) {
    if (!isFinite(s)) return "0:00";
    var m = Math.floor(s / 60), r = Math.floor(s % 60);
    return m + ":" + (r < 10 ? "0" : "") + r;
  }

  function repaintPlayer() {
    playBtn.innerHTML = audio.paused ? "&#9658;" : "&#9612;&#9612;";
    document.querySelectorAll(".track").forEach(function (tr) {
      tr.setAttribute("data-state", tr === current && !audio.paused ? "playing" : "idle");
    });
  }

  function play(trackEl) {
    if (current === trackEl && !audio.paused) { audio.pause(); repaintPlayer(); return; }
    if (current !== trackEl) {
      current = trackEl;
      audio.src = trackEl.getAttribute("data-src");
      titleEl.textContent = trackEl.getAttribute("data-title");
      fill.style.width = "0%";
    }
    bar.hidden = false;
    audio.play().catch(function () { /* blocked or missing — see error handler */ });
    repaintPlayer();
  }

  function bindTracks() {
    current = null;
    document.querySelectorAll(".track").forEach(function (tr) {
      tr.addEventListener("click", function () { play(tr); });
    });
  }

  playBtn.addEventListener("click", function () {
    if (!current) return;
    if (audio.paused) audio.play().catch(function () {}); else audio.pause();
    repaintPlayer();
  });

  document.getElementById("player-close").addEventListener("click", function () {
    audio.pause(); bar.hidden = true; repaintPlayer();
  });

  barTrack.addEventListener("click", function (e) {
    if (!audio.duration) return;
    var r = barTrack.getBoundingClientRect();
    audio.currentTime = ((e.clientX - r.left) / r.width) * audio.duration;
  });

  audio.addEventListener("timeupdate", function () {
    timeEl.textContent = clock(audio.currentTime);
    if (audio.duration) fill.style.width = (audio.currentTime / audio.duration) * 100 + "%";
  });
  audio.addEventListener("play",  repaintPlayer);
  audio.addEventListener("pause", repaintPlayer);
  audio.addEventListener("ended", function () { fill.style.width = "0%"; repaintPlayer(); });
  audio.addEventListener("error", function () {
    audio.pause();
    titleEl.textContent = ui("missingFile") + (audio.getAttribute("src") || "");
    timeEl.textContent = "--:--";
    fill.style.width = "0%";
    repaintPlayer();
  });

  /* ---------------------------------------------------------------- boot */

  document.documentElement.setAttribute("lang", LANG);
  buildNav();
  window.addEventListener("hashchange", function () { route(); });
  route();
})();
