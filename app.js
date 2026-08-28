// AI ҰСТАЗ — site interactions
(function () {
  "use strict";

  /* ---------- header scroll shadow ---------- */
  var header = document.getElementById("site-header");
  function onScroll() {
    if (window.scrollY > 8) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
  }
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- mobile menu ---------- */
  var menu = document.getElementById("mobile-menu");
  var scrim = document.getElementById("menu-scrim");
  var openBtn = document.getElementById("menu-open");
  var closeBtn = document.getElementById("menu-close");

  var waFloat = document.querySelector(".wa-float");
  function openMenu() {
    menu.classList.add("open");
    scrim.classList.remove("pointer-events-none");
    scrim.classList.add("opacity-100");
    scrim.classList.remove("opacity-0");
    document.documentElement.style.overflow = "hidden";
    openBtn.setAttribute("aria-expanded", "true");
    if (waFloat) waFloat.style.display = "none";
  }
  function closeMenu() {
    menu.classList.remove("open");
    scrim.classList.add("opacity-0");
    scrim.classList.remove("opacity-100");
    scrim.classList.add("pointer-events-none");
    document.documentElement.style.overflow = "";
    openBtn.setAttribute("aria-expanded", "false");
    if (waFloat) waFloat.style.display = "";
  }
  openBtn.addEventListener("click", openMenu);
  closeBtn.addEventListener("click", closeMenu);
  scrim.addEventListener("click", closeMenu);
  menu.querySelectorAll(".menu-link").forEach(function (a) {
    a.addEventListener("click", closeMenu);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeMenu();
  });

  /* ---------- reveal on scroll ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- language switch ---------- */
  var LANG_KEY = "aiustaz-lang";
  var langToggle = document.getElementById("lang-toggle");
  var langLabel = document.getElementById("lang-toggle-label");

  function applyLang(lang) {
    var dict = (window.__I18N && window.__I18N[lang]) || {};
    document.documentElement.setAttribute("lang", lang === "ru" ? "ru" : "kk");
    langLabel.textContent = lang === "ru" ? "РУС" : "ҚАЗ";

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (dict[key] !== undefined) el.textContent = dict[key];
    });
    document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-html");
      if (dict[key] !== undefined) el.innerHTML = dict[key];
    });
    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-aria");
      if (dict[key] !== undefined) el.setAttribute("aria-label", dict[key]);
    });
    document.querySelectorAll("[data-i18n-alt]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-alt");
      if (dict[key] !== undefined) el.setAttribute("alt", dict[key]);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-placeholder");
      if (dict[key] !== undefined) el.setAttribute("placeholder", dict[key]);
    });

    if (dict["meta.title"]) document.title = dict["meta.title"];
    if (dict["meta.description"]) {
      var metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute("content", dict["meta.description"]);
    }

    try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
    window.__CURRENT_LANG = lang;
    document.dispatchEvent(new CustomEvent("langchange", { detail: { lang: lang } }));
  }

  function initLang() {
    var saved = null;
    try { saved = localStorage.getItem(LANG_KEY); } catch (e) {}
    var lang = saved === "ru" ? "ru" : "kk";
    applyLang(lang);
  }

  langToggle.addEventListener("click", function () {
    var next = window.__CURRENT_LANG === "ru" ? "kk" : "ru";
    applyLang(next);
  });

  if (window.__I18N) initLang();
  else document.addEventListener("i18n-ready", initLang);

  /* ---------- generic tabs (data-tabs / data-tab-target) ---------- */
  document.querySelectorAll("[data-tabs]").forEach(function (group) {
    var groupName = group.getAttribute("data-tabs");
    var buttons = document.querySelectorAll('[data-tab-btn="' + groupName + '"]');
    var panels = document.querySelectorAll('[data-tab-panel="' + groupName + '"]');
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var target = btn.getAttribute("data-tab-value");
        buttons.forEach(function (b) {
          b.setAttribute("data-active", String(b.getAttribute("data-tab-value") === target));
        });
        panels.forEach(function (p) {
          var match = p.getAttribute("data-tab-value") === target;
          p.classList.toggle("hidden", !match);
          if (match) {
            p.classList.add("reveal");
            requestAnimationFrame(function(){ p.classList.add("is-visible"); });
          }
        });
      });
    });
  });

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll(".faq-item").forEach(function (item) {
    var trigger = item.querySelector(".faq-trigger");
    if (!trigger) return;
    trigger.addEventListener("click", function () {
      var isOpen = item.getAttribute("data-open") === "true";
      item.closest("[data-faq-group]") &&
        item.closest("[data-faq-group]").querySelectorAll(".faq-item").forEach(function (other) {
          if (other !== item) other.setAttribute("data-open", "false");
        });
      item.setAttribute("data-open", isOpen ? "false" : "true");
    });
  });

  /* ---------- carousel (drag + arrows, manual only, wraps) ---------- */
  document.querySelectorAll("[data-carousel]").forEach(function (root) {
    var track = root.querySelector("[data-carousel-track]");
    var prevBtn = root.querySelector("[data-carousel-prev]");
    var nextBtn = root.querySelector("[data-carousel-next]");
    if (!track) return;

    function cardWidth() {
      var card = track.querySelector("[data-carousel-card]");
      if (!card) return track.clientWidth;
      var style = window.getComputedStyle(card);
      var gap = parseFloat(window.getComputedStyle(track).columnGap || 24) || 24;
      return card.getBoundingClientRect().width + gap;
    }

    function atEnd() {
      return track.scrollLeft + track.clientWidth >= track.scrollWidth - 8;
    }
    function atStart() {
      return track.scrollLeft <= 8;
    }

    if (nextBtn) nextBtn.addEventListener("click", function () {
      if (atEnd()) {
        track.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        track.scrollBy({ left: cardWidth(), behavior: "smooth" });
      }
    });
    if (prevBtn) prevBtn.addEventListener("click", function () {
      if (atStart()) {
        track.scrollTo({ left: track.scrollWidth, behavior: "smooth" });
      } else {
        track.scrollBy({ left: -cardWidth(), behavior: "smooth" });
      }
    });

    // pointer drag support (mouse) — touch scrolling works natively
    var isDown = false, startX = 0, startScroll = 0, dragged = false;
    track.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "touch") return;
      isDown = true; dragged = false;
      startX = e.clientX;
      startScroll = track.scrollLeft;
      track.setPointerCapture(e.pointerId);
      track.style.cursor = "grabbing";
    });
    track.addEventListener("pointermove", function (e) {
      if (!isDown) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 4) dragged = true;
      track.scrollLeft = startScroll - dx;
    });
    function endDrag() {
      isDown = false;
      track.style.cursor = "grab";
    }
    track.addEventListener("pointerup", endDrag);
    track.addEventListener("pointerleave", endDrag);
    track.addEventListener("click", function (e) {
      if (dragged) { e.preventDefault(); e.stopPropagation(); }
    }, true);
  });

  /* ---------- lightbox modal for testimonial cards ---------- */
  var modal = null;
  function ensureModal() {
    if (modal) return modal;
    modal = document.createElement("div");
    modal.id = "tmodal";
    modal.className = "fixed inset-0 z-[80] hidden items-center justify-center p-4";
    var closeLabel = (window.__I18N && window.__I18N[window.__CURRENT_LANG] && window.__I18N[window.__CURRENT_LANG]["a11y.close"]) || "Жабу";
    modal.innerHTML =
      '<div class="absolute inset-0 bg-ink-900/60 backdrop-blur-sm" data-modal-close></div>' +
      '<div class="relative bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl">' +
      '<button type="button" data-modal-close aria-label="' + closeLabel + '" data-i18n-aria="a11y.close" class="absolute top-4 right-4 w-9 h-9 rounded-full border border-ink-200 flex items-center justify-center text-ink-700 hover:border-gold-500">' +
      '<svg viewBox="0 0 24 24" class="w-4.5 h-4.5" width="18" height="18"><use href="#i-close"/></svg></button>' +
      '<div data-modal-body></div>' +
      "</div>";
    document.body.appendChild(modal);
    modal.querySelectorAll("[data-modal-close]").forEach(function (el) {
      el.addEventListener("click", closeModal);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeModal();
    });
    return modal;
  }
  function openModal(html) {
    var m = ensureModal();
    m.querySelector("[data-modal-body]").innerHTML = html;
    m.classList.remove("hidden");
    m.classList.add("flex");
  }
  function closeModal() {
    if (!modal) return;
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }
  document.querySelectorAll("[data-testimonial-open]").forEach(function (card) {
    card.addEventListener("click", function (e) {
      var tmpl = card.querySelector("[data-testimonial-modal]");
      if (!tmpl) return;
      openModal(tmpl.innerHTML);
    });
  });

  /* ---------- current year not needed (static copyright) ---------- */
})();
