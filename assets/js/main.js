(function () {
  "use strict";
  var cfg = window.STUDIO_CONFIG || {};
  var email = (cfg.email || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || /@(tudominio|ejemplo|example)\./i.test(email)) email = "";
  var whatsapp = validWhatsapp(cfg.whatsapp);
  // Enlace corto de WhatsApp Business (wa.me/message/...): no contiene el número
  var shortRaw = String(cfg.whatsappLink || "").trim();
  var waShort = /^https:\/\/(wa\.me|api\.whatsapp\.com)\/message\/[A-Za-z0-9]{6,}$/.test(shortRaw) ? shortRaw : "";
  var hasWa = !!(whatsapp || waShort);

  // Número internacional solo con dígitos (10–15). Para Perú: 51 + celular de 9 dígitos que empieza por 9.
  // Rechaza el número de ejemplo de config.js para que nunca se publique como si fuera real.
  function validWhatsapp(raw) {
    var n = String(raw || "").replace(/\D/g, "");
    if (!/^\d{10,15}$/.test(n)) return "";
    if (n.indexOf("51") === 0 && !/^519\d{8}$/.test(n)) return "";
    if (/^519?0+$/.test(n)) return "";
    return n;
  }

  // Año y ciudad
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
  if (cfg.city) document.querySelectorAll("[data-city]").forEach(function (el) { el.textContent = cfg.city; });

  // Menú móvil
  var toggle = document.querySelector(".nav__toggle");
  var menu = document.getElementById("menu");
  function closeMenu() {
    menu.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  }
  toggle.addEventListener("click", function () {
    var open = menu.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  menu.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", closeMenu); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });

  // Sombra de la barra al hacer scroll
  var nav = document.querySelector(".nav");
  function onScroll() { nav.classList.toggle("is-scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Animaciones de entrada y enlace activo
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });

    var links = {};
    menu.querySelectorAll('a[href^="#"]').forEach(function (a) { links[a.getAttribute("href").slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var l = links[en.target.id];
        if (l) l.classList.toggle("is-active", en.isIntersecting);
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll("main section[id]").forEach(function (s) { spy.observe(s); });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("is-visible"); });
  }

  // Canales de contacto (desde config.js)
  var waLink = document.querySelector('[data-contact="whatsapp"]');
  var mailLink = document.querySelector('[data-contact="email"]');
  if (email) {
    mailLink.href = "mailto:" + email;
    mailLink.textContent = email;
  } else {
    mailLink.textContent = "[Correo pendiente de configurar]";
    mailLink.classList.add("is-placeholder");
    mailLink.removeAttribute("href");
  }
  if (hasWa) {
    // wa.me abre la conversación (app en móvil, WhatsApp Web/escritorio en ordenador)
    // con el texto ya escrito; el visitante decide si lo envía.
    // Con enlace corto, el mensaje inicial se define en la app WhatsApp Business.
    var waHref = whatsapp ? "https://wa.me/" + whatsapp +
      (cfg.whatsappMessage ? "?text=" + encodeURIComponent(cfg.whatsappMessage) : "") : waShort;
    waLink.href = waHref;
    waLink.target = "_blank";
    waLink.rel = "noopener";
    waLink.textContent = whatsapp && cfg.showWhatsappNumber ? "+" + whatsapp : "Escríbeme por WhatsApp";
    var fab = document.querySelector("[data-wa-float]");
    if (fab) { fab.href = waHref; fab.hidden = false; }
  } else {
    waLink.textContent = "[WhatsApp pendiente de configurar]";
    waLink.classList.add("is-placeholder");
    waLink.removeAttribute("href");
  }
  // Si un canal no está configurado, se oculta su fila; el aviso solo aparece si no hay ninguno
  if (email && !hasWa) waLink.parentElement.hidden = true;
  if (hasWa && !email) mailLink.parentElement.hidden = true;
  if (!email && !hasWa) {
    document.querySelector("[data-config-warning]").hidden = false;
    document.querySelector(".contact__channels").hidden = true;
  }

  // Botones de paquetes: preseleccionan el paquete en el formulario
  var planSelect = document.getElementById("f-plan");
  document.querySelectorAll("[data-plan]").forEach(function (b) {
    b.addEventListener("click", function () { planSelect.value = b.getAttribute("data-plan"); });
  });

  // Formulario: compone el mensaje y lo abre en WhatsApp o correo (no envía nada por sí solo)
  var form = document.getElementById("contact-form");
  var status = form.querySelector(".form__status");
  var waBtn = form.querySelector('[data-via="whatsapp"]');
  var mailBtn = form.querySelector('[data-via="email"]');
  // Cada botón solo aparece si su canal está configurado y es válido
  waBtn.hidden = !hasWa;
  mailBtn.hidden = !email;
  if (!hasWa && !email) {
    form.querySelector(".form__actions").hidden = true;
    status.textContent = "El formulario se activará muy pronto.";
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var via = (e.submitter && e.submitter.getAttribute("data-via")) || (hasWa ? "whatsapp" : "email");
    var ok = true;
    ["f-name", "f-msg"].forEach(function (id) {
      var input = document.getElementById(id);
      var bad = !input.value.trim();
      input.parentElement.classList.toggle("is-invalid", bad);
      input.setAttribute("aria-invalid", String(bad));
      if (bad) ok = false;
    });
    if (!ok) { status.textContent = "Escribe tu nombre y qué necesitas."; return; }

    if (via === "whatsapp" && !hasWa) { status.textContent = "WhatsApp aún no está configurado."; return; }
    if (via === "email" && !email) { status.textContent = "El correo aún no está configurado."; return; }

    var d = new FormData(form);
    var text = "Hola Latif, soy " + d.get("name") +
      (d.get("business") ? " de " + d.get("business") : "") + ".\n" +
      "Paquete de interés: " + d.get("plan") + ".\n\n" + d.get("message");

    if (via === "whatsapp" && whatsapp) {
      window.open("https://wa.me/" + whatsapp + "?text=" + encodeURIComponent(text), "_blank", "noopener");
    } else if (via === "whatsapp") {
      // El enlace corto no admite texto propio: se copia el mensaje para que el visitante lo pegue en el chat
      var copied = false;
      try { if (navigator.clipboard && window.isSecureContext) { navigator.clipboard.writeText(text); copied = true; } } catch (err) {}
      window.open(waShort, "_blank", "noopener");
      status.textContent = copied ? "Abrimos WhatsApp. Tu mensaje está copiado: pégalo en el chat y envíalo." :
        "Abrimos WhatsApp. Escribe allí tu consulta y envíala.";
      return;
    } else {
      window.location.href = "mailto:" + email + "?subject=" + encodeURIComponent("Consulta de página web") +
        "&body=" + encodeURIComponent(text);
    }
    status.textContent = "Mensaje preparado. Revísalo y envíalo desde la aplicación que se ha abierto.";
  });
})();
