/* ============================================================================
   SD Digital: runtime das Landing Pages de marketplace
   ---------------------------------------------------------------------------
   Substitui o bundle do Webflow (IX2/jQuery) nestas páginas. Motivo: o IX2 é
   compilado por página no Webflow e aplicaria as interações do TOPFIT aos
   nossos nós, escondendo elementos. Aqui só há o que a LP precisa (~4 KB),
   sem dependências, o que também ajuda no Índice de Qualidade do Google Ads.

   Responsabilidades:
     1. menu mobile (drawer)
     2. acordeão do FAQ (abre um por vez, com animação)
     3. reveal on scroll (.lp-reveal)
     4. contador animado dos KPIs ([data-countup])
     5. captura de UTM/gclid -> campos hidden do formulário + links de WhatsApp
     6. submit do formulário via fetch (Formspree) sem sair da página
     7. eventos no dataLayer (GTM/GA4): generate_lead, whatsapp_click
   ========================================================================= */
(function () {
  "use strict";

  var doc = document;
  var dl = (window.dataLayer = window.dataLayer || []);

  /* ----------------------------------------------------- 1. header (home) --
     O header usa a marcação da home (.nav.w-nav), mas o runtime do Webflow
     (jQuery/w-nav) não roda aqui. Este bloco faz o que o w-nav faria: abre/
     fecha o dropdown alternando .is-menu-open no .nav e .w--open no botão
     (é essa classe que o site-overrides.css usa pra virar o ícone num X), e
     mantém .nav--scrolled em dia pro realce ao descolar do topo. */
  var nav = doc.querySelector("[data-lp-nav]");
  if (nav) {
    var navBtn = nav.querySelector(".menu-button");
    var navMenu = nav.querySelector(".nav-menu");

    var setNav = function (open) {
      nav.classList.toggle("is-menu-open", open);
      if (navBtn) {
        navBtn.classList.toggle("w--open", open);
        navBtn.setAttribute("aria-expanded", open ? "true" : "false");
        navBtn.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
      }
    };
    var toggleNav = function () {
      setNav(!nav.classList.contains("is-menu-open"));
    };

    if (navBtn) {
      navBtn.addEventListener("click", toggleNav);
      navBtn.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleNav();
        }
      });
    }
    if (navMenu) {
      navMenu.addEventListener("click", function (e) {
        if (e.target.closest("a")) setNav(false);
      });
    }
    doc.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setNav(false);
    });
    doc.addEventListener("click", function (e) {
      if (nav.classList.contains("is-menu-open") && !e.target.closest("[data-lp-nav]")) {
        setNav(false);
      }
    });

    var navTicking = false;
    var syncScrolled = function () {
      // no topo a barra é transparente sobre o hero claro; assim que sai do
      // topo ela fica sólida, senão os links passariam por cima do conteúdo
      nav.classList.toggle("nav--scrolled", window.scrollY > 24);
      navTicking = false;
    };
    window.addEventListener(
      "scroll",
      function () {
        if (navTicking) return;
        navTicking = true;
        requestAnimationFrame(syncScrolled);
      },
      { passive: true }
    );
    syncScrolled();
  }

  /* ------------------------------------------ 1b. cortina antes x depois -- */
  // Desktop: o <input type="range"> por cima do bloco já entrega arrasto,
  // toque e teclado; aqui só se copia o valor dele para a custom property que
  // o CSS usa no clip-path da imagem "depois" e na posição da linha.
  Array.prototype.forEach.call(doc.querySelectorAll("[data-lp-compare]"), function (box) {
    var range = box.querySelector(".lp-compare-range");
    if (!range) return;
    var apply = function () {
      box.style.setProperty("--lp-compare", range.value + "%");
    };
    range.addEventListener("input", apply);
    apply();
  });

  /* ------------------------------------- 1c. "avançar alguns meses" -------
     No celular a cortina dá lugar a um botão: a imagem "antes" fica grande
     (sangrando para a direita) e o clique avança para o "depois", com uma
     espera curta e uma explosão de bolinhas dentro do bloco.
     A espera existe para o gesto ter consequência visível — sem ela a troca
     acontece antes do dedo sair do botão e ninguém percebe o que mudou. */
  var FX_EMOJI = ["💰", "📈", "🛒", "🎉", "⭐", "💸", "📦", "🔥", "✨", "🏆"];
  var FX_COUNT = 14;
  var ADVANCE_MS = 900;
  var reduceMotion = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

  function burst(layer) {
    if (!layer || reduceMotion) return;
    layer.textContent = "";
    for (var i = 0; i < FX_COUNT; i++) {
      var bit = doc.createElement("span");
      bit.className = "lp-fx-bit";
      bit.textContent = FX_EMOJI[i % FX_EMOJI.length];
      // leque para cima: ângulo entre -170° e -10°, distância e giro variados
      var angle = (-170 + Math.random() * 160) * (Math.PI / 180);
      var dist = 90 + Math.random() * 130;
      bit.style.setProperty("--lp-fx-x", Math.cos(angle) * dist + "px");
      bit.style.setProperty("--lp-fx-y", Math.sin(angle) * dist + "px");
      bit.style.setProperty("--lp-fx-r", (-160 + Math.random() * 320) + "deg");
      bit.style.setProperty("--lp-fx-dur", (750 + Math.random() * 500) + "ms");
      bit.style.setProperty("--lp-fx-delay", Math.random() * 120 + "ms");
      layer.appendChild(bit);
    }
    // as bolinhas somem sozinhas no fim da animação; some com os nós também
    window.setTimeout(function () {
      layer.textContent = "";
    }, 1500);
  }

  Array.prototype.forEach.call(doc.querySelectorAll("[data-lp-advance]"), function (btn) {
    var dash = btn.closest(".lp-hero-dash");
    var box = dash && dash.querySelector("[data-lp-compare]");
    if (!box) return;

    var label = btn.querySelector(".lp-compare-advance-label");
    var fx = box.querySelector(".lp-compare-fx");
    var labelForward = btn.getAttribute("data-label-forward") || "Avançar alguns meses";
    var labelBack = btn.getAttribute("data-label-back") || "Ver como estava antes";
    var busy = false;

    btn.addEventListener("click", function () {
      if (busy) return;
      var goingForward = !box.classList.contains("is-after");

      // voltar é imediato: não há nada a comemorar no caminho de volta
      if (!goingForward) {
        box.classList.remove("is-after");
        if (label) label.textContent = labelForward;
        btn.setAttribute("aria-pressed", "false");
        return;
      }

      busy = true;
      btn.disabled = true;
      btn.classList.add("is-loading");
      if (label) label.textContent = "Avançando…";

      window.setTimeout(
        function () {
          box.classList.add("is-after");
          burst(fx);
          btn.disabled = false;
          btn.classList.remove("is-loading");
          if (label) label.textContent = labelBack;
          btn.setAttribute("aria-pressed", "true");
          busy = false;
        },
        reduceMotion ? 0 : ADVANCE_MS
      );
    });
  });

  /* -------------------------------------------------------- 2. FAQ acordeão -- */
  // Marcação é botão + painel (não <details>). A altura da resposta é medida
  // aqui (scrollHeight) e animada via max-height em assets/css, mais
  // confiável entre navegadores do que o truque de grid-template-rows 0fr/1fr,
  // que num container de altura intrínseca não zera de verdade (o padding do
  // filho continua contando no tamanho mínimo da faixa).
  function setFaqPanel(btn, open) {
    var wrap = doc.getElementById(btn.getAttribute("aria-controls"));
    if (!wrap) return;
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    wrap.style.maxHeight = open ? wrap.scrollHeight + "px" : "0px";
  }

  var faqButtons = doc.querySelectorAll(".lp-faq-q");
  Array.prototype.forEach.call(faqButtons, function (btn) {
    btn.addEventListener("click", function () {
      var isOpen = btn.getAttribute("aria-expanded") === "true";
      // fecha os outros itens abertos do mesmo acordeão, um por vez
      var group = btn.closest(".lp-faq");
      if (group) {
        Array.prototype.forEach.call(group.querySelectorAll('.lp-faq-q[aria-expanded="true"]'), function (other) {
          if (other !== btn) setFaqPanel(other, false);
        });
      }
      setFaqPanel(btn, !isOpen);
    });
  });

  // se a resposta aberta reflui (ex.: fonte carrega, janela redimensiona),
  // reajusta a altura máxima para não cortar nem sobrar espaço.
  window.addEventListener("resize", function () {
    var openBtn = doc.querySelector('.lp-faq-q[aria-expanded="true"]');
    if (openBtn) setFaqPanel(openBtn, true);
  });

  /* ---------------------------------------------------------- 3. reveal -- */
  // Opt-in: só escondemos o conteúdo depois de confirmar que conseguimos
  // revelá-lo de novo. Sem IntersectionObserver, nada é escondido.
  var reveals = doc.querySelectorAll(".lp-reveal");
  if (reveals.length && "IntersectionObserver" in window) {
    doc.documentElement.classList.add("js-reveal");

    var revealAll = function () {
      Array.prototype.forEach.call(reveals, function (el) { el.classList.add("is-in"); });
    };

    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          revealObserver.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 }
    );
    Array.prototype.forEach.call(reveals, function (el) { revealObserver.observe(el); });

    // Rede de segurança: se em 4s algo ainda não foi revelado (aba em segundo
    // plano, observer estrangulado pelo navegador), mostra tudo.
    setTimeout(function () {
      if (doc.querySelectorAll(".lp-reveal:not(.is-in)").length) revealAll();
    }, 4000);
  }

  /* -------------------------------------------------------- 4. contador -- */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute("data-countup"));
    var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
    if (isNaN(target)) return;
    var duration = 1400;
    var start = null;

    function frame(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased)
        .toFixed(decimals)
        .replace(".", ",")
        .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  var counters = doc.querySelectorAll("[data-countup]");
  if (counters.length) {
    if (!("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(counters, animateCount);
    } else {
      var countObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            animateCount(entry.target);
            countObserver.unobserve(entry.target);
          });
        },
        { threshold: 0.6 }
      );
      Array.prototype.forEach.call(counters, function (el) { countObserver.observe(el); });
    }
  }

  /* ------------------------------------------------- 5. UTM / atribuição -- */
  var TRACKED = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"];
  var params = new URLSearchParams(window.location.search);
  var attribution = {};

  TRACKED.forEach(function (key) {
    var value = params.get(key);
    if (value) {
      attribution[key] = value;
      try { sessionStorage.setItem("sd_" + key, value); } catch (e) { /* modo restrito */ }
    } else {
      try {
        var stored = sessionStorage.getItem("sd_" + key);
        if (stored) attribution[key] = stored;
      } catch (e) { /* modo restrito */ }
    }
  });

  Object.keys(attribution).forEach(function (key) {
    var field = doc.querySelector('[name="' + key + '"]');
    if (field) field.value = attribution[key];
  });

  var pageField = doc.querySelector('[name="pagina"]');
  if (pageField) pageField.value = window.location.href;

  // repassa a atribuição para o WhatsApp: assim o time comercial sabe de qual
  // campanha o lead veio mesmo quando ele não preenche o formulário.
  var waSuffix = attribution.utm_campaign
    ? "\n\n[origem: " + attribution.utm_campaign + "]"
    : "";
  if (waSuffix) {
    Array.prototype.forEach.call(doc.querySelectorAll('a[href*="api.whatsapp.com"]'), function (a) {
      a.href = a.href + encodeURIComponent(waSuffix);
    });
  }

  /* ------------------------------------------------------ 6+7. formulário -- */
  Array.prototype.forEach.call(doc.querySelectorAll('a[href*="api.whatsapp.com"]'), function (a) {
    a.addEventListener("click", function () {
      dl.push({
        event: "whatsapp_click",
        marketplace: doc.documentElement.getAttribute("data-marketplace") || "",
        posicao: a.getAttribute("data-wa-position") || "generico"
      });
    });
  });

  var form = doc.querySelector("[data-lp-form]");
  if (form) {
    var status = doc.querySelector("[data-lp-form-status]");
    var submit = form.querySelector('[type="submit"]');
    var submitLabel = submit ? submit.textContent : "";

    form.addEventListener("submit", function (e) {
      var endpoint = form.getAttribute("action");
      if (!endpoint || endpoint.indexOf("http") !== 0) return; // sem endpoint: submit nativo

      e.preventDefault();
      if (submit) { submit.disabled = true; submit.textContent = "Enviando..."; }
      if (status) status.className = "lp-form-status";

      fetch(endpoint, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      })
        .then(function (res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          form.reset();
          if (status) {
            status.className = "lp-form-status is-ok";
            status.textContent = form.getAttribute("data-success-message") ||
              "Recebemos seus dados. Nossa equipe entra em contato em breve.";
          }
          dl.push({
            event: "generate_lead",
            marketplace: doc.documentElement.getAttribute("data-marketplace") || "",
            form_id: form.getAttribute("id") || ""
          });
        })
        .catch(function () {
          if (status) {
            status.className = "lp-form-status is-fail";
            status.textContent = "Não conseguimos enviar agora. Tente novamente ou fale com a gente pelo WhatsApp.";
          }
        })
        .finally(function () {
          if (submit) { submit.disabled = false; submit.textContent = submitLabel; }
        });
    });
  }

  /* ------------------------------------------------- 8. evita "viúva" -- */
  // Parágrafo (ou título) que termina com uma palavra sozinha na última
  // resto é com\na gente." -> "a gente." isolado). Troca o ÚLTIMO espaço do
  // texto por um espaço inquebrável, colando as duas últimas palavras — elas
  // sempre quebram juntas ou ficam juntas na linha de cima, nunca uma
  // sozinha. Não depende da largura da tela (funciona em qualquer viewport,
  // sem precisar recalcular no resize).
  // Só mexe em elementos sem marcação interna (sem filhos): reescrever
  // textContent de algo com um <a>/<b>/<span> dentro apagaria essa marcação
  // (é assim que o <h1> do hero, com um <span class="lp-em">, fica de fora).
  Array.prototype.forEach.call(doc.querySelectorAll("main p, main h1, main h2, main h3, main h4"), function (p) {
    if (p.children.length) return;
    var text = p.textContent;
    var lastSpace = text.lastIndexOf(" ");
    if (lastSpace === -1) return;
    p.textContent = text.slice(0, lastSpace) + " " + text.slice(lastSpace + 1);
  });
})();
