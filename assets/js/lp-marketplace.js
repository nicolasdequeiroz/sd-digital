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

  /* ------------------------------------------------------------ 1. menu -- */
  var toggle = doc.querySelector("[data-lp-toggle]");
  var drawer = doc.querySelector("[data-lp-drawer]");
  if (toggle && drawer) {
    // aria-label troca junto com aria-expanded: sem isso, leitor de tela
    // continua anunciando "Abrir menu" com o menu já aberto.
    var setToggleState = function (open) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    };
    toggle.addEventListener("click", function () {
      setToggleState(drawer.classList.toggle("is-open"));
    });
    drawer.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        drawer.classList.remove("is-open");
        setToggleState(false);
      }
    });
  }

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
  // Parágrafo que termina com uma palavra sozinha na última linha (ex: "O
  // resto é com\na gente." -> "a gente." isolado). Troca o ÚLTIMO espaço do
  // texto por um espaço inquebrável, colando as duas últimas palavras — elas
  // sempre quebram juntas ou ficam juntas na linha de cima, nunca uma
  // sozinha. Não depende da largura da tela (funciona em qualquer viewport,
  // sem precisar recalcular no resize).
  // Só mexe em parágrafos sem marcação interna (sem filhos): reescrever
  // textContent de um <p> com um <a>/<b> dentro apagaria essa marcação.
  Array.prototype.forEach.call(doc.querySelectorAll("main p"), function (p) {
    if (p.children.length) return;
    var text = p.textContent;
    var lastSpace = text.lastIndexOf(" ");
    if (lastSpace === -1) return;
    p.textContent = text.slice(0, lastSpace) + " " + text.slice(lastSpace + 1);
  });
})();
