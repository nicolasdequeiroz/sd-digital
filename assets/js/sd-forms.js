/* ============================================================================
   SD Digital: runtime dos formulários (Formspree)
   ---------------------------------------------------------------------------
   Um só arquivo para TODOS os formulários do site: contato da home, case,
   briefing e as LPs de marketplace. Antes disso, home e case ainda usavam o
   runtime do Webflow, que postava para a API do Webflow — endereço que deixou
   de existir quando o site saiu da hospedagem deles, e os envios sumiam sem
   erro visível.

   Vale para qualquer <form data-sd-form> com um `action` do Formspree:

     1. captura UTM/gclid (query string -> sessionStorage) e preenche os
        campos hidden do formulário, mais a URL da página em [name="pagina"]
     2. envia por fetch, sem sair da página, e escreve o resultado no
        [data-sd-form-status] (o `action` continua no HTML, então sem JS o
        navegador ainda faz o POST nativo: o lead não se perde)
     3. dispara o evento do dataLayer (GTM/GA4) do atributo data-sd-event

   A atribuição fica em window.SD_ATTRIBUTION para outros scripts reusarem
   (o lp-marketplace.js carimba a campanha nos links de WhatsApp).
   ========================================================================= */
(function () {
  "use strict";

  var doc = document;
  var dl = (window.dataLayer = window.dataLayer || []);

  /* --------------------------------------------------------- atribuição --- */
  /* sessionStorage porque o visitante costuma chegar pelo anúncio e só
     preencher o formulário depois de navegar: sem isso, a UTM se perde na
     primeira troca de página e o lead chega "orgânico". */
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

  window.SD_ATTRIBUTION = attribution;

  /* ---------------------------------------------------------- utilidades -- */
  // <input type="submit"> mostra o rótulo em .value; <button>, em .textContent
  function label(btn, text) {
    if (!btn) return "";
    var prop = btn.tagName === "INPUT" ? "value" : "textContent";
    if (text === undefined) return btn[prop];
    btn[prop] = text;
    return text;
  }

  /* ------------------------------------------------------------- forms ---- */
  var forms = doc.querySelectorAll("form[data-sd-form]");

  Array.prototype.forEach.call(forms, function (form) {
    // 1. carimba atribuição e origem nos campos hidden deste formulário
    Object.keys(attribution).forEach(function (key) {
      var field = form.querySelector('[name="' + key + '"]');
      if (field) field.value = attribution[key];
    });
    var pageField = form.querySelector('[name="pagina"]');
    if (pageField) pageField.value = window.location.href;

    // 2. envio
    var status = form.querySelector("[data-sd-form-status]");
    var submit = form.querySelector('[type="submit"]');
    var submitLabel = label(submit);
    var endpoint = form.getAttribute("action");

    // Endpoint ainda não configurado: avisa no console (quem vê é quem está
    // publicando) e deixa o submit nativo acontecer, que ao menos falha à
    // vista em vez de fingir sucesso.
    if (endpoint && endpoint.indexOf("COLE_O_ID") !== -1) {
      console.warn(
        "[sd-forms] O formulário #" + (form.id || "sem-id") + " ainda aponta para um " +
        "endpoint de exemplo (" + endpoint + "). Troque pelo ID real do Formspree."
      );
    }

    function setStatus(kind, text) {
      if (!status) return;
      status.className = "sd-form-status" + (kind ? " is-" + kind : "");
      status.textContent = text || "";
    }

    form.addEventListener("submit", function (e) {
      if (!endpoint || endpoint.indexOf("http") !== 0) return; // sem endpoint: submit nativo

      e.preventDefault();
      if (submit) { submit.disabled = true; label(submit, "Enviando..."); }
      setStatus("", "");

      fetch(endpoint, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      })
        .then(function (res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          form.reset();
          setStatus(
            "ok",
            form.getAttribute("data-success-message") ||
              "Recebemos seus dados. Nossa equipe entra em contato em breve."
          );
          dl.push({
            event: form.getAttribute("data-sd-event") || "generate_lead",
            origem: (form.querySelector('[name="origem"]') || {}).value || "",
            marketplace: doc.documentElement.getAttribute("data-marketplace") || "",
            form_id: form.getAttribute("id") || ""
          });
        })
        .catch(function () {
          setStatus(
            "fail",
            "Não conseguimos enviar agora. Tente novamente ou fale com a gente pelo WhatsApp."
          );
        })
        .finally(function () {
          if (submit) { submit.disabled = false; label(submit, submitLabel); }
        });
    });
  });
})();
