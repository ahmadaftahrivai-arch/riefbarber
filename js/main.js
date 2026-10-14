(function () {
  "use strict";

  var WA_NUMBER = "628988120944";
  var OPEN_MIN = 10 * 60;      // 10.00
  var CLOSE_MIN = 23 * 60;     // 23.00
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  var lang = "id";
  try { lang = localStorage.getItem("rief-lang") || "id"; } catch (e) {}
  if (lang !== "en") lang = "id";

  /* ---------- Waktu Jakarta ---------- */
  function jakartaNow() {
    var parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false
    }).formatToParts(new Date());
    var o = {};
    parts.forEach(function (p) { o[p.type] = p.value; });
    var h = parseInt(o.hour, 10) % 24;
    return { date: o.year + "-" + o.month + "-" + o.day, minutes: h * 60 + parseInt(o.minute, 10) };
  }

  /* ---------- Badge buka/tutup ---------- */
  function updateOpenBadge() {
    var now = jakartaNow();
    var isOpen = now.minutes >= OPEN_MIN && now.minutes < CLOSE_MIN;
    var text = window.I18N_DYN[lang][isOpen ? "open" : "closed"];
    ["openBadge", "openBadge2"].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.textContent = text;
      el.classList.toggle("is-open", isOpen);
    });
  }

  /* ---------- i18n ---------- */
  function applyLang(l) {
    lang = l;
    document.documentElement.lang = l;
    $$("[data-i18n]").forEach(function (el) {
      if (el.dataset.idHtml === undefined) el.dataset.idHtml = el.innerHTML;
      var key = el.dataset.i18n;
      if (l === "en" && window.I18N_EN[key] !== undefined) el.innerHTML = window.I18N_EN[key];
      else el.innerHTML = el.dataset.idHtml;
    });
    $$("[data-i18n-ph]").forEach(function (el) {
      if (el.dataset.idPh === undefined) el.dataset.idPh = el.getAttribute("placeholder") || "";
      var v = window.I18N_EN[el.dataset.i18nPh];
      el.setAttribute("placeholder", l === "en" && v ? v : el.dataset.idPh);
    });
    $$(".lang button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.lang === l)); });
    document.title = l === "en"
      ? "Rief Barbershop Cirebon | Book Without Waiting"
      : "Rief Barbershop Cirebon | Booking Tanpa Antre";
    try { localStorage.setItem("rief-lang", l); } catch (e) {}
    updateOpenBadge();
  }

  /* ---------- Nav ---------- */
  var nav = $("#nav"), progress = $("#progress"), burger = $("#burger"), navLinks = $("#navLinks");
  burger.addEventListener("click", function () {
    var open = navLinks.classList.toggle("open");
    burger.setAttribute("aria-expanded", String(open));
  });
  $$("a", navLinks).forEach(function (a) {
    a.addEventListener("click", function () {
      navLinks.classList.remove("open");
      burger.setAttribute("aria-expanded", "false");
    });
  });
  $$(".lang button").forEach(function (b) {
    b.addEventListener("click", function () { applyLang(b.dataset.lang); });
  });

  /* ---------- Reveal on scroll ---------- */
  function buildMosaic(fig) {
    var r = fig.getBoundingClientRect();
    if (!r.width) return;
    var cols = 8, rows = Math.max(2, Math.round((r.height / r.width) * cols));
    var m = document.createElement("div");
    m.className = "mosaic";
    m.style.gridTemplateRows = "repeat(" + rows + ", 1fr)";
    for (var i = 0; i < cols * rows; i++) {
      var c = document.createElement("i");
      c.style.transitionDelay = Math.round(Math.random() * 650) + "ms";
      m.appendChild(c);
    }
    fig.appendChild(m);
  }

  var io = null;
  if ("IntersectionObserver" in window && !reduceMotion) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        el.classList.add("in");
        if (el.classList.contains("reveal-img")) {
          setTimeout(function () { el.classList.add("done"); }, 1300);
        }
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    $$(".reveal-img").forEach(buildMosaic);
    $$(".reveal, .reveal-img, .h2").forEach(function (el) { io.observe(el); });
  } else {
    $$(".reveal, .h2").forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Horizontal pinned scroll ---------- */
  var hs = $("#list"), hsTrack = $("#hsTrack"), hsView = $("#hsView"), hsBar = $("#hsBar");
  var hsDist = 0, cards = $$(".card", hsTrack);
  var mobileMQ = window.matchMedia("(max-width: 960px)");

  function hsLayout() {
    if (mobileMQ.matches) {
      hs.style.height = "";
      hsTrack.style.transform = "";
      return;
    }
    hsDist = Math.max(0, hsTrack.scrollWidth - hsView.clientWidth);
    hs.style.height = (window.innerHeight + hsDist) + "px";
  }

  function setActiveCard() {
    var vr = hsView.getBoundingClientRect();
    var center = vr.left + vr.width * (mobileMQ.matches ? 0.5 : 0.28);
    var best = null, bestD = Infinity;
    cards.forEach(function (c) {
      var r = c.getBoundingClientRect();
      var d = Math.abs(r.left + r.width / 2 - center);
      if (d < bestD) { bestD = d; best = c; }
    });
    cards.forEach(function (c) { c.classList.toggle("is-active", c === best); });
  }

  function hsUpdate() {
    if (!mobileMQ.matches && hsDist > 0) {
      var rect = hs.getBoundingClientRect();
      var p = clamp(-rect.top / hsDist, 0, 1);
      hsTrack.style.transform = "translate3d(" + (-p * hsDist).toFixed(1) + "px,0,0)";
      hsBar.style.transform = "scaleX(" + p.toFixed(3) + ")";
    }
    setActiveCard();
  }
  hsView.addEventListener("scroll", setActiveCard, { passive: true });

  /* ---------- Scroll loop ---------- */
  var sections = $$("#about, #list, #gallery, #visit, #contact").map(function (s) {
    return { el: s, link: $('.nav-links a[href="#' + s.id + '"]') };
  });
  var ticking = false;
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = "scaleX(" + (max > 0 ? clamp(y / max, 0, 1) : 0).toFixed(4) + ")";
    nav.classList.toggle("scrolled", y > 40);
    var line = window.innerHeight * 0.35;
    var atEnd = window.innerHeight + y >= document.documentElement.scrollHeight - 4;
    sections.forEach(function (s) {
      var r = s.el.getBoundingClientRect();
      if (s.link) s.link.classList.toggle("on", s.el.id === "contact" ? atEnd : (!atEnd && r.top <= line && r.bottom > line));
    });
    hsUpdate();
    ticking = false;
  }
  function requestTick() {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }
  window.addEventListener("scroll", requestTick, { passive: true });
  window.addEventListener("resize", function () { hsLayout(); requestTick(); });
  mobileMQ.addEventListener && mobileMQ.addEventListener("change", function () { hsLayout(); requestTick(); });
  window.addEventListener("load", function () { hsLayout(); requestTick(); });

  /* ---------- Booking form ---------- */
  var form = $("#bookForm"), fDate = $("#fDate"), fTime = $("#fTime");

  function fillTimes() {
    var now = jakartaNow();
    var keep = fTime.value;
    var first = fTime.firstElementChild;
    fTime.innerHTML = "";
    fTime.appendChild(first);
    for (var m = OPEN_MIN; m <= CLOSE_MIN - 30; m += 30) {
      var hh = ("0" + Math.floor(m / 60)).slice(-2), mm = ("0" + (m % 60)).slice(-2);
      var o = document.createElement("option");
      o.value = o.textContent = hh + "." + mm;
      if (fDate.value === now.date && m <= now.minutes) o.disabled = true;
      fTime.appendChild(o);
    }
    var still = $$("option", fTime).filter(function (o) { return o.value === keep && !o.disabled; })[0];
    fTime.value = still ? keep : "";
  }

  var today = jakartaNow();
  fDate.min = today.date;
  fDate.value = today.date;
  fDate.addEventListener("change", fillTimes);
  fillTimes();

  function fieldOf(el) { return el.closest(".field"); }
  $$("input, select, textarea", form).forEach(function (el) {
    el.addEventListener("input", function () { fieldOf(el).classList.remove("invalid"); });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var firstBad = null;
    $$("[required]", form).forEach(function (el) {
      var bad = !String(el.value).trim() || (el === fDate && fDate.value < fDate.min);
      fieldOf(el).classList.toggle("invalid", bad);
      if (bad && !firstBad) firstBad = el;
    });
    if (firstBad) { firstBad.focus(); return; }

    var d = window.I18N_DYN[lang];
    var f = form.elements;
    var sel = function (el) { return el.options[el.selectedIndex].textContent.trim(); };
    var dp = f.date.value.split("-");
    var lines = [
      d.waHello, "",
      d.lName + ": " + f.name.value.trim(),
      d.lService + ": " + sel(f.service),
      d.lCapster + ": " + (f.capster.value.trim() || d.anyBarber),
      d.lDate + ": " + dp[2] + "/" + dp[1] + "/" + dp[0],
      d.lTime + ": " + f.time.value
    ];
    if (f.note.value.trim()) lines.push(d.lNote + ": " + f.note.value.trim());
    var a = document.createElement("a");
    a.href = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(lines.join("\n"));
    a.target = "_blank";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  });

  /* ---------- Init ---------- */
  $("#year").textContent = new Date().getFullYear();
  applyLang(lang);
  hsLayout();
  onScroll();
  requestAnimationFrame(function () { $(".hero").classList.add("loaded"); });
  setInterval(updateOpenBadge, 60000);
})();
