/* ============================================================================
   SD Digital: biblioteca de componentes das LPs de marketplace
   ---------------------------------------------------------------------------
   Cada função aqui é um "bloco" do CMS: recebe o conteúdo (JSON) e devolve
   HTML. O conteúdo NUNCA mora neste arquivo, quem edita texto mexe só em
   cms/data/**. Quem edita layout mexe aqui.

   Referência de origem de cada bloco: ver o cabeçalho de
   assets/css/lp-marketplace.css.
   ========================================================================= */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const partial = (name) => readFileSync(join(HERE, "partials", name), "utf8").trim();

export const SD_LOGO = partial("sd-logo.svg");
export const WHATSAPP_ICON = partial("whatsapp-icon.svg");
export const CLIENT_LOGOS = partial("client-logos.html");

/* ------------------------------------------------------------- helpers -- */

export function esc(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Monta o link do WhatsApp com a mensagem já preenchida. */
export function wa(phone, message) {
  return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message || "")}`;
}

/** Resolve um CTA do CMS: href "whatsapp" vira link do WhatsApp daquela seção. */
function ctaHref(cta, ctx, waKey) {
  if (!cta) return "#form";
  if (cta.href === "whatsapp") return wa(ctx.globals.contact.whatsappPhone, ctx.page.whatsapp[waKey]);
  return cta.href || "#form";
}

/* Alguns CTAs tem rotulo longo demais pra largura de um botao no celular.
   Quando o CMS traz `labelShort`, os dois textos vao pro HTML e o CSS mostra
   um ou outro por breakpoint (display:none tambem esconde de leitor de tela,
   entao nao ha texto duplicado sendo anunciado). Sem `labelShort`, sai so' o
   rotulo normal e nada muda. */
function ctaLabel(cta) {
  if (!cta.labelShort) return esc(cta.label);
  return `<span class="lp-cta-full">${esc(cta.label)}</span><span class="lp-cta-short">${esc(cta.labelShort)}</span>`;
}

function ctaAttrs(cta, ctx, waKey) {
  const isWa = cta && cta.href === "whatsapp";
  return `href="${esc(ctaHref(cta, ctx, waKey))}"${isWa ? ` target="_blank" rel="noopener" data-wa-position="${esc(waKey)}"` : ""}`;
}

const waIcon = `<span class="lp-btn-icon" aria-hidden="true">${WHATSAPP_ICON.replace(
  /width="\d+" height="\d+"/,
  'width="20" height="20"'
)}</span>`;

/* ------------------------------------------------------- ícones (SVG) -- */
/* Lucide (lucide.dev), MIT/ISC: biblioteca open-source, ícones traço 24x24.
   Baixados de unpkg.com/lucide-static@1.31.0/icons/*.svg e embutidos aqui
   (sem CDN em runtime, sem font icon, sem dependência externa na página).
   Trocamos o antigo set de ícones preenchidos desenhados à mão por estes,
   mesma lógica de reuso do resto do projeto: baixar uma vez, servir local. */

const ICONS = {
  megaphone: `<path d="M11 6a13 13 0 0 0 8.4-2.8A1 1 0 0 1 21 4v12a1 1 0 0 1-1.6.8A13 13 0 0 0 11 14H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"/><path d="M6 14a12 12 0 0 0 2.4 7.2 2 2 0 0 0 3.2-2.4A8 8 0 0 1 10 14"/><path d="M8 6v8"/>`,
  search: `<path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/>`,
  image: `<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>`,
  tag: `<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>`,
  plug: `<path d="M12 22v-5"/><path d="M15 8V2"/><path d="M17 8a1 1 0 0 1 1 1v4a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1z"/><path d="M9 8V2"/>`,
  shield: `<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>`,
  box: `<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><polyline points="3.29 7 12 12 20.71 7"/><path d="m7.5 4.27 9 5.15"/>`,
  truck: `<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>`,
  chart: `<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>`,
  users: `<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/>`,
  clock: `<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>`
};

// stroke-based (Lucide): fill="none", cor vem do stroke.
const icon = (name) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.chart}</svg>`;

// check simples, usado nas listas (.lp-list) e nos selos de confiança do hero
const CHECK_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m20 6-11 11-5-5"/></svg>`;

// seta simples usada no cross-sell do rodapé
const ARROW_RIGHT_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`;

// chevron do acordeão do FAQ (gira 180° quando aberto, ver CSS)
const CHEVRON_DOWN_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>`;

// estrela preenchida, usada na nota dos depoimentos
const STAR_ICON = `<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="round" aria-hidden="true"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/></svg>`;

// seta de tendência, usada nos números dos paineis (mock)
const TRENDING_UP_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 7h6v6"/><path d="m22 7-8.5 8.5-5-5L2 17"/></svg>`;

/** Aviso exibido enquanto os painéis são ilustração e não print de conta real.
 *  É gerado automaticamente e some sozinho quando todo `image` for preenchido. */
const MOCK_NOTICE =
  "Ilustração de layout: os painéis reais das contas que operamos entram aqui. Números meramente ilustrativos.";

/* -------------------------------------------------- blocos compartilhados */

/** Legenda de seção: réplica de .divider-caption + .dot-orange do TOPFIT. */
function caption(text) {
  return `<div class="divider-caption"><div class="dot-orange"></div><div class="caption-small">${esc(text)}</div></div>`;
}

function sectionHead({ caption: cap, title, subtitle, center = false }) {
  return `<div class="lp-head${center ? " is-center" : ""} lp-reveal">
        ${cap ? caption(cap) : ""}
        ${title ? `<h2>${title}</h2>` : ""}
        ${subtitle ? `<p>${esc(subtitle)}</p>` : ""}
      </div>`;
}

/** Mock de painel de vendas: placeholder enquanto o print real não entra.
 *  Quando é mock, o badge entra dentro do card (e não flutuando por cima),
 *  para não cobrir o cabeçalho. */
function panelMock(mock, badge) {
  const bars = (mock.chart || []).map((h) => `<span style="height:${Math.max(4, h)}%"></span>`).join("");
  return `<div class="lp-mock">
          <div class="lp-mock-bar"><span class="lp-mock-dot is-mk"></span><span class="lp-mock-dot"></span><span class="lp-mock-dot"></span>${badge ? `<span class="lp-mock-chip">${esc(badge)}</span>` : ""}</div>
          <div class="lp-mock-title">${esc(mock.title)}</div>
          <div class="lp-mock-value">${esc(mock.value)}</div>
          ${mock.delta ? `<div class="lp-mock-delta">${TRENDING_UP_ICON}${esc(mock.delta)}</div>` : ""}
          ${mock.caption ? `<div class="lp-mock-caption">${esc(mock.caption)}</div>` : ""}
          <div class="lp-mock-chart">${bars}</div>
          <div class="lp-mock-foot">
            <div>${esc(mock.footLeft?.label || "")}<b>${esc(mock.footLeft?.value || "")}</b></div>
            <div>${esc(mock.footRight?.label || "")}<b>${esc(mock.footRight?.value || "")}</b></div>
          </div>
        </div>`;
}

/* ============================================================== NAV ===== */
/* réplica de .navigation-01 do TOPFIT, com CTA fixo (LP precisa converter) */

export function nav(ctx) {
  const { page, globals } = ctx;
  const links = [
    { label: "Serviços", href: "#servicos" },
    { label: "O que fazemos", href: "#entregaveis" },
    { label: "Resultados", href: "#resultados" },
    { label: "Dúvidas", href: "#faq" }
  ];
  const items = links.map((l) => `<a href="${l.href}" class="lp-nav-link">${esc(l.label)}</a>`).join("");

  return `<header class="lp-nav">
    <div class="lp-nav-inner">
      <nav class="lp-nav-links">${items}</nav>
      <a href="/" class="lp-nav-brand" aria-label="SD Digital: página inicial">
        <div class="navigation-logo">${SD_LOGO}</div>
      </a>
      <div class="lp-nav-right">
        <a href="${esc(wa(globals.contact.whatsappPhone, page.whatsapp.nav))}" target="_blank" rel="noopener" data-wa-position="nav" class="button-primary-large">Fale com um especialista</a>
        <button type="button" class="lp-nav-toggle" data-lp-toggle aria-expanded="false" aria-label="Abrir menu">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M12 12V13.3333H4V12H12ZM14 7.33334V8.66667H2V7.33334H14ZM12 2.66667V4.00001H4V2.66667H12Z" fill="currentColor"/></svg>
        </button>
      </div>
    </div>
    <div class="lp-drawer" data-lp-drawer>${items}</div>
  </header>`;
}

/* ============================================================= HERO ===== */
/* réplica do header do TOPFIT: eyebrow + logo, h1, sub, CTAs, shots, ticker */

export function hero(ctx) {
  const { page, globals } = ctx;
  const h = page.hero;

  const shots = h.shots
    .map((shot, i) => {
      const pos = ["is-left", "is-center", "is-right"][i] || "is-center";
      return shot.image
        ? `<div class="lp-shot ${pos}">${shot.badge ? `<div class="lp-badge is-mk">${esc(shot.badge)}</div>` : ""}<img src="${esc(shot.image)}" alt="${esc(shot.badge || "")}" loading="eager" decoding="async"/></div>`
        : `<div class="lp-shot ${pos}">${panelMock(shot.mock, shot.badge)}</div>`;
    })
    .join("");

  // Aviso automático: só aparece enquanto algum painel ainda é ilustração.
  const heroHasMock = h.shots.some((s) => !s.image);

  const trust = h.trust
    .map(
      (t) =>
        `<div class="lp-trust-item">${CHECK_ICON}${esc(t)}</div>`
    )
    .join("");

  // duplicado para o loop do marquee ficar contínuo
  const tickerItems = [...h.ticker, ...h.ticker]
    .map((t) => `<div class="roller-text">${esc(t)}</div>`)
    .join("");

  return `<section class="lp-hero" id="topo">
    <div class="lp-hero-inner">
      <div class="lp-eyebrow">
        <div class="lp-mk-logo"><img src="${esc(page.marketplace.logo)}" alt="${esc(page.marketplace.logoAlt)}" width="120" height="40"/></div>
        <h6 class="h6-heading-2">${esc(h.eyebrow)}</h6>
      </div>
      <h1>${h.h1}</h1>
      <p class="lp-hero-sub">${esc(h.sub)}</p>
      <div class="lp-actions">
        <a ${ctaAttrs(h.ctaPrimary, ctx, "hero")} class="lp-btn-mk">${ctaLabel(h.ctaPrimary)}</a>
        <a ${ctaAttrs(h.ctaSecondary, ctx, "hero")} class="lp-btn-ghost">${h.ctaSecondary.icon === "whatsapp" ? waIcon : ""}${ctaLabel(h.ctaSecondary)}</a>
      </div>
      <div class="lp-trust">${trust}</div>
    </div>

    <div class="lp-hero-visual lp-wide lp-reveal">
      <div class="lp-shots">${shots}</div>
      ${heroHasMock ? `<p class="lp-disclaimer">${MOCK_NOTICE}</p>` : ""}
    </div>

    <div class="lp-ticker" aria-hidden="true">
      <div class="lp-ticker-track">${tickerItems}</div>
    </div>
  </section>`;
}

/* ============================================================= KPIs ===== */

export function kpis(ctx) {
  // O número já sai renderizado no HTML (vale para SEO e para JS desligado);
  // o contador só re-anima quando o bloco entra na viewport.
  const fmt = (value, decimals = 0) =>
    value.toFixed(decimals).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  const items = ctx.page.kpis
    .map(
      (k) => `<div class="lp-kpi">
          <div class="lp-kpi-value">${k.prefix ? `<span class="lp-kpi-prefix">${esc(k.prefix)}</span>` : ""}<span data-countup="${k.value}"${k.decimals ? ` data-decimals="${k.decimals}"` : ""}>${fmt(k.value, k.decimals || 0)}</span>${k.suffix ? `<span class="lp-kpi-suffix">${esc(k.suffix)}</span>` : ""}</div>
          <div class="lp-kpi-label">${esc(k.label)}</div>
        </div>`
    )
    .join("");

  return `<section class="lp-section is-tight">
    <div class="lp-wide"><div class="lp-kpis lp-reveal">${items}</div></div>
  </section>`;
}

/* ============================================================ INTRO ===== */
/* variação da seção "Introdução" do TOPFIT (h5-heading-2 em bloco largo)   */

export function intro(ctx) {
  const i = ctx.page.intro;
  const paras = i.paragraphs.map((p) => `<p class="paragraph">${esc(p)}</p>`).join("");
  return `<section class="lp-section is-white" id="diagnostico">
    <div class="lp-mid">
      <div class="divider-wrapper lp-reveal">
        ${caption(i.caption)}
        <div class="divider-tertiary"></div>
      </div>
      <h5 class="h5-heading-2 lp-reveal" style="margin-top:24px">${esc(i.title)}</h5>
      <div class="column-regular-2 lp-reveal" style="margin-top:24px">${paras}</div>
    </div>
  </section>`;
}

/* ========================================================= SERVIÇOS ===== */
/* consultoria x assessoria: variação de .team-about-card                    */

export function services(ctx) {
  const s = ctx.page.services;
  const cards = s.items
    .map((item) => {
      const list = item.items.map((li) => `<li>${esc(li)}</li>`).join("");
      const tagClass = item.tagStyle === "light" ? "lp-tag is-light" : "lp-tag";
      const btnClass = item.cta.style === "mk" ? "lp-btn-mk" : "lp-btn-ghost";
      return `<article class="lp-service${item.featured ? " is-featured" : ""} lp-reveal">
          <div class="lp-service-top"><span class="${tagClass}">${esc(item.tag)}</span></div>
          <h3 class="lp-service-name">${esc(item.name)}</h3>
          <p class="lp-service-desc">${esc(item.description)}</p>
          <ul class="lp-list">${list}</ul>
          <div class="lp-service-foot">
            <a href="${esc(item.cta.href)}" class="${btnClass}">${esc(item.cta.label)}</a>
            ${item.note ? `<p class="lp-service-note">${esc(item.note)}</p>` : ""}
          </div>
        </article>`;
    })
    .join("");

  return `<section class="lp-section" id="servicos">
    <div class="lp-wide">
      ${sectionHead({ caption: s.caption, title: esc(s.title), subtitle: s.subtitle, center: true })}
      <div class="lp-services">${cards}</div>
    </div>
  </section>`;
}

/* ====================================================== ENTREGÁVEIS ===== */
/* variação de .gallery-grid / .gallery-card                                */

export function deliverables(ctx) {
  const d = ctx.page.deliverables;
  const cards = d.items
    .map(
      (item) => `<article class="lp-card lp-reveal">
          <div class="lp-card-icon">${icon(item.icon)}</div>
          <h3>${esc(item.title)}</h3>
          <p>${esc(item.text)}</p>
        </article>`
    )
    .join("");

  return `<section class="lp-section is-white" id="entregaveis">
    <div class="lp-wide">
      ${sectionHead({ caption: d.caption, title: esc(d.title), subtitle: d.subtitle })}
      <div class="lp-grid-3">${cards}</div>
    </div>
  </section>`;
}

/* ============================================================ SPLIT ===== */

export function split(ctx) {
  const s = ctx.page.split;
  const col = (data, kind) => `<div class="lp-split-col is-${kind} lp-reveal">
        <h3 class="lp-split-title">${esc(data.title)}</h3>
        <p class="lp-split-sub">${esc(data.sub)}</p>
        <ul class="lp-list">${data.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>
      </div>`;

  return `<section class="lp-section">
    <div class="lp-wide">
      ${sectionHead({ caption: s.caption, title: esc(s.title), subtitle: s.subtitle, center: true })}
      <div class="lp-split">${col(s.you, "you")}${col(s.us, "us")}</div>
    </div>
  </section>`;
}

/* ============================================================= BAND ===== */
/* variação de .logo-section do TOPFIT (bloco full-bleed na cor da marca)   */

export function band(ctx) {
  const b = ctx.page.band;
  return `<section class="lp-band">
    <div class="lp-band-inner lp-reveal">
      <h2>${esc(b.title)}</h2>
      <p>${esc(b.text)}</p>
      <div class="lp-actions">
        <a ${ctaAttrs(b.ctaPrimary, ctx, "band")} class="lp-btn-mk">${ctaLabel(b.ctaPrimary)}</a>
        <a ${ctaAttrs(b.ctaSecondary, ctx, "band")} class="lp-btn-ghost">${b.ctaSecondary.icon === "whatsapp" ? waIcon : ""}${ctaLabel(b.ctaSecondary)}</a>
      </div>
    </div>
  </section>`;
}

/* ============================================================ PROOF ===== */
/* réplica de .gallery-card + .gallery-badge com os prints de painel         */

export function proof(ctx) {
  const p = ctx.page.proof;
  const panels = p.panels
    .map((panel) =>
      panel.image
        ? `<figure class="lp-panel lp-reveal" style="margin:0"><div class="lp-badge">${esc(panel.badge || "")}</div><img src="${esc(panel.image)}" alt="${esc(panel.badge || "Painel de vendas")}" loading="lazy" decoding="async"/></figure>`
        : `<figure class="lp-panel lp-reveal" style="margin:0">${panelMock(panel.mock, panel.badge)}</figure>`
    )
    .join("");

  // Aviso automático: some sozinho quando todos os prints reais entrarem.
  const hasMock = p.panels.some((panel) => !panel.image);

  return `<section class="lp-section is-white" id="resultados">
    <div class="lp-wide">
      ${sectionHead({ caption: p.caption, title: esc(p.title), subtitle: p.subtitle })}
      <div class="lp-panels">${panels}</div>
      ${hasMock ? `<p class="lp-disclaimer">${MOCK_NOTICE}</p>` : ""}
    </div>
  </section>`;
}

/* ============================================================ CASES ===== */

export function cases(ctx) {
  const c = ctx.globals.cases;
  const items = c.items
    .map(
      (item) => `<article class="lp-case lp-reveal">
          <div class="lp-case-client">${esc(item.client)}</div>
          <h3 class="lp-case-result">${esc(item.result)}</h3>
          <div class="lp-case-client" style="margin:-4px 0 12px">${esc(item.period)}</div>
          <p>${esc(item.description)}</p>
        </article>`
    )
    .join("");

  return `<section class="lp-section">
    <div class="lp-wide">
      ${sectionHead({ caption: c.caption, title: esc(c.title), subtitle: c.subtitle })}
      <div class="lp-grid-2">${items}</div>
      <div class="lp-head is-center lp-reveal" style="margin:72px auto 32px">
        ${caption(ctx.globals.clients.caption)}
        <h2 style="font-size:28px">${esc(ctx.globals.clients.title)}</h2>
      </div>
      <div class="lp-clients lp-reveal" aria-label="${esc(ctx.globals.clients.title)}">
        <div class="lp-clients-track">${CLIENT_LOGOS}${CLIENT_LOGOS}</div>
      </div>
    </div>
  </section>`;
}

/* ===================================================== DEPOIMENTOS ====== */

export function testimonials(ctx) {
  const t = ctx.page.testimonials;
  // `enabled: false` tira a seção do ar sem apagar os itens: fica pronta pra
  // voltar assim que os depoimentos reais substituírem os placeholders.
  if (!t || !t.items || !t.items.length || t.enabled === false) return "";
  const items = t.items
    .map(
      (item) => `<article class="lp-quote lp-reveal">
          <div class="lp-quote-stars" aria-label="5 de 5">${STAR_ICON.repeat(5)}</div>
          <p>${esc(item.quote)}</p>
          <div class="lp-quote-who">
            <div class="lp-quote-avatar" aria-hidden="true">${esc(item.initials || "SD")}</div>
            <div><div class="lp-quote-name">${esc(item.name)}</div><div class="lp-quote-role">${esc(item.role)}</div></div>
          </div>
        </article>`
    )
    .join("");

  return `<section class="lp-section is-white">
    <div class="lp-wide">
      ${sectionHead({ caption: t.caption, title: esc(t.title), center: true })}
      <div class="lp-grid-3">${items}</div>
    </div>
  </section>`;
}

/* ========================================================= PROCESSO ===== */
/* variação de .process-card do site principal                              */

export function process(ctx) {
  const p = ctx.page.process;
  const steps = p.steps
    .map(
      (s, i) => `<article class="lp-step lp-reveal">
          <div class="lp-step-num">${i + 1}</div>
          <h3>${esc(s.title)}</h3>
          <p>${esc(s.text)}</p>
        </article>`
    )
    .join("");

  return `<section class="lp-section">
    <div class="lp-wide">
      ${sectionHead({ caption: p.caption, title: esc(p.title), subtitle: p.subtitle })}
      <div class="lp-steps">${steps}</div>
    </div>
  </section>`;
}

/* ============================================================== FAQ ===== */

export function faq(ctx) {
  const f = ctx.page.faq;
  // Botão + painel (não <details>): permite animar a abertura via CSS grid-rows
  // (assets/css) controlada pelo runtime (assets/js), mantendo aria-expanded
  // e navegação por teclado para acessibilidade.
  const items = f.items
    .map(
      (item, i) => `<div class="lp-faq-item">
          <button type="button" class="lp-faq-q" aria-expanded="false" aria-controls="faq-a-${ctx.page.slug}-${i}" id="faq-q-${ctx.page.slug}-${i}">
            <span>${esc(item.q)}</span>
            ${CHEVRON_DOWN_ICON}
          </button>
          <div class="lp-faq-a-wrap" id="faq-a-${ctx.page.slug}-${i}" role="region" aria-labelledby="faq-q-${ctx.page.slug}-${i}">
            <p class="lp-faq-answer">${esc(item.a)}</p>
          </div>
        </div>`
    )
    .join("");

  return `<section class="lp-section is-white" id="faq">
    <div class="lp-mid">
      ${sectionHead({ caption: f.caption, title: esc(f.title), center: true })}
      <div class="lp-faq lp-reveal">${items}</div>
    </div>
  </section>`;
}

/* ========================================================= CONTATO ====== */
/* réplica de .contact-sec do TOPFIT: vídeo de fundo + moeda + formulário   */

export function contact(ctx) {
  const { page, globals } = ctx;
  const f = page.form;
  const waHref = wa(globals.contact.whatsappPhone, page.whatsapp.form);

  const option = (v) => `<option value="${esc(v)}">${esc(v)}</option>`;

  return `<section id="form" class="contact-sec">
    <div class="container">
      <div class="page-padding">
        <div class="contact-wrapper">
          <div class="form-left" style="place-self:center">
            <div class="circular-logo">
              <img src="/assets/images/6431a05b11af0d2d4e95c2c4_circular-text.svg" loading="lazy" alt="" class="coin lp-coin"/>
              <div class="sd-div"><img src="/assets/images/6431a09192cceccb3d1b7ee9_Vector.svg" loading="lazy" alt="" class="sd"/></div>
            </div>
          </div>
          <div class="form-right">
            <div class="row-large row-space-between">
              ${caption(f.caption)}
              <div class="divider-small"></div>
            </div>
            <div class="paragraph-div">
              <h6 class="h6-heading-3 large"><strong>${esc(f.title)}</strong></h6>
              <p class="paragraph-16 b">${esc(f.text)} Se preferir, fale pelo <a href="${esc(waHref)}" target="_blank" rel="noopener" data-wa-position="form" class="link-span">WhatsApp</a>.</p>
            </div>

            <form class="lp-form" data-lp-form id="lp-form-${esc(page.slug)}" method="POST"
                  action="${esc(globals.form.endpoint)}"
                  data-success-message="${esc(globals.form.successMessage)}">
              <input type="hidden" name="_subject" value="${esc(f.subject)}"/>
              <input type="hidden" name="marketplace" value="${esc(page.marketplace.name)}"/>
              <input type="hidden" name="pagina" value=""/>
              <input type="hidden" name="utm_source" value=""/>
              <input type="hidden" name="utm_medium" value=""/>
              <input type="hidden" name="utm_campaign" value=""/>
              <input type="hidden" name="utm_term" value=""/>
              <input type="hidden" name="utm_content" value=""/>
              <input type="hidden" name="gclid" value=""/>
              <input type="text" name="_gotcha" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true"/>

              <div class="lp-form-row">
                <div>
                  <label for="nome-${esc(page.slug)}" class="label">Nome</label>
                  <input class="text-field w-input" maxlength="120" name="nome" id="nome-${esc(page.slug)}" type="text" autocomplete="name" required/>
                </div>
                <div>
                  <label for="empresa-${esc(page.slug)}" class="label">Empresa</label>
                  <input class="text-field w-input" maxlength="120" name="empresa" id="empresa-${esc(page.slug)}" type="text" autocomplete="organization"/>
                </div>
              </div>

              <div class="lp-form-row">
                <div>
                  <label for="email-${esc(page.slug)}" class="label">Email</label>
                  <input class="text-field w-input" maxlength="160" name="email" id="email-${esc(page.slug)}" type="email" autocomplete="email" required/>
                </div>
                <div>
                  <label for="telefone-${esc(page.slug)}" class="label">WhatsApp</label>
                  <input class="text-field w-input" maxlength="40" name="telefone" id="telefone-${esc(page.slug)}" type="tel" autocomplete="tel" required/>
                </div>
              </div>

              <label for="faturamento-${esc(page.slug)}" class="label">Faturamento ${esc(page.marketplace.preposition)}</label>
              <select class="text-field" name="faturamento" id="faturamento-${esc(page.slug)}" required>
                <option value="">Selecione</option>
                ${f.revenueOptions.map(option).join("")}
              </select>

              <label for="interesse-${esc(page.slug)}" class="label">O que você procura</label>
              <select class="text-field" name="interesse" id="interesse-${esc(page.slug)}" required>
                <option value="">Selecione</option>
                ${f.interestOptions.map(option).join("")}
              </select>

              <label for="mensagem-${esc(page.slug)}" class="label">Mensagem (opcional)</label>
              <textarea id="mensagem-${esc(page.slug)}" name="mensagem" maxlength="2000" placeholder="Conte um pouco da sua operação..." class="text-field w-input"></textarea>

              <button type="submit" class="lp-btn-mk">${esc(f.submitLabel)}</button>
              <p class="lp-form-legal">${esc(globals.form.legal)}</p>
              <div class="lp-form-status" data-lp-form-status role="status" aria-live="polite"></div>
            </form>
          </div>
        </div>
      </div>
    </div>
    <div class="filter-gradient_2"></div>
    <div data-poster-url="/assets/images/64319ccf443cd234148e34ce_pexels-rostislav-uzunov-9150545-poster-00001.jpg" class="background-video w-background-video w-background-video-atom">
      <video autoplay loop muted playsinline preload="none"
             poster="/assets/images/64319ccf443cd234148e34ce_pexels-rostislav-uzunov-9150545-poster-00001.jpg"
             style="width:100%;height:100%;object-fit:cover">
        <source src="/assets/media/64319ccf443cd234148e34ce_pexels-rostislav-uzunov-9150545-transcode.mp4"/>
        <source src="/assets/media/64319ccf443cd234148e34ce_pexels-rostislav-uzunov-9150545-transcode.webm"/>
      </video>
    </div>
  </section>`;
}

/* =========================================================== FOOTER ===== */
/* Duas partes com propósitos diferentes:
   1. .lp-footer-upsell: cross-sell entre marketplaces + gancho para o site
      completo. Existe só nas LPs, então segue o tema claro da própria LP
      (não é "o footer do site", é conteúdo de conversão antes dele).
   2. .footer: o RODAPÉ DE VERDADE, réplica pixel-a-pixel do que existe em
      index.html / case/topfit / briefing (mesmas classes do CSS do Webflow,
      sem CSS próprio de LP). É o mesmo elemento em todas as páginas do site,
      só os hrefs das âncoras de seção apontam de volta para a home.        */

export function footer(ctx) {
  const { globals, siblings } = ctx;
  const fo = globals.footer;

  const cross = siblings
    .map(
      (s) => `<a href="/lp/${esc(s.slug)}/" class="lp-cross-card">
          <span class="lp-cross-logo"><img src="${esc(s.marketplace.logo)}" alt="${esc(s.marketplace.logoAlt)}" loading="lazy"/></span>
          <span class="lp-cross-body">
            <span class="lp-cross-title">${esc(s.marketplace.name)}</span>
            <span class="lp-cross-sub">Consultoria e assessoria ${esc(s.marketplace.preposition)}</span>
          </span>
          <span class="lp-cross-arrow" aria-hidden="true">${ARROW_RIGHT_ICON}</span>
        </a>`
    )
    .join("");

  const upsell = `<section class="lp-section is-white lp-footer-upsell">
    <div class="lp-wide">
      ${cross ? `<div class="lp-head lp-reveal"><h2>${esc(fo.crossSellTitle)}</h2><p>${esc(fo.crossSellLead)}</p></div><div class="lp-cross lp-reveal">${cross}</div>` : ""}
      <div class="lp-footer-hook lp-reveal">
        <div>
          <h2>${esc(fo.siteHookTitle)}</h2>
          <p>${esc(fo.siteHookText)}</p>
        </div>
        <a href="/" class="lp-btn-ghost">${esc(fo.siteHookCta)}</a>
      </div>
    </div>
  </section>`;

  // Mesmas classes do rodapé real (definidas no CSS compilado do Webflow,
  // reaproveitadas tal como em index.html / case/topfit / briefing).
  const navLinks = [
    { label: "sobre", href: "/#sobre" },
    { label: "soluções", href: "/#solucoes" },
    { label: "novidades", href: "/#novos-projetos" },
    { label: "cases", href: "/#cases-de-sucesso" },
    { label: "contato", href: "/#contato" }
  ]
    .map((l) => `<a href="${esc(l.href)}" class="nav-link _2 w-inline-block"><div>${esc(l.label)}</div></a>`)
    .join("");

  const waHref = wa(globals.contact.whatsappPhone, ctx.page.whatsapp.float);

  const siteFooter = `<div class="footer">
    <div class="container">
      <div class="page-padding">
        <div class="footer-wrapper">
          <img src="/assets/images/6431a428a50b9c057d50295a_Group-1.svg" loading="lazy" alt="SD Digital"/>
          <div class="social-div _2">${navLinks}</div>
          <div class="social-div">
            <a href="${esc(waHref)}" target="_blank" rel="noopener" class="link-block w-inline-block"><img src="/assets/images/643097cf8a585e943da7e020_fa-icon.svg" loading="lazy" alt="WhatsApp"/></a>
            <a href="${esc(globals.contact.linkedin)}" target="_blank" rel="noopener" class="link-block w-inline-block"><img src="/assets/images/643097ce9d91c6dd35abbed3_fa-icon-1.svg" loading="lazy" alt="LinkedIn"/></a>
            <a href="${esc(globals.contact.instagram)}" target="_blank" rel="noopener" class="link-block w-inline-block"><img src="/assets/images/643097cfe2d057c418d68b8b_fa-icon-3.svg" loading="lazy" alt="Instagram"/></a>
          </div>
        </div>
        <div class="copyright-div"><div class="text-14 _60">${esc(fo.copyright)}</div></div>
      </div>
    </div>
  </div>`;

  return `<footer>${upsell}${siteFooter}</footer>`;
}

/* ================================================= WHATSAPP FLUTUANTE === */
/* réplica exata de .whatsapp-block do TOPFIT                               */

export function whatsappFloat(ctx) {
  const href = wa(ctx.globals.contact.whatsappPhone, ctx.page.whatsapp.float);
  return `<div class="whatsapp-block">
    <a href="${esc(href)}" target="_blank" rel="noopener" data-wa-position="flutuante" aria-label="Falar no WhatsApp" class="whatsapp-container w-inline-block">
      <div class="zap w-embed">${WHATSAPP_ICON}</div>
      <div class="live-icon"></div>
    </a>
  </div>`;
}

/* ========================================================== JSON-LD ===== */

export function jsonLd(ctx) {
  const { page, globals, url } = ctx;
  const graph = [
    {
      "@type": "Service",
      "@id": url + "#service",
      name: `Consultoria e assessoria ${page.marketplace.preposition}`,
      serviceType: `Gestão de marketplace: ${page.marketplace.name}`,
      description: page.seo.description,
      areaServed: { "@type": "Country", name: "Brasil" },
      provider: {
        "@type": "Organization",
        name: globals.brand.name,
        legalName: globals.brand.legalName,
        url: globals.brand.site
      },
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: `Serviços ${page.marketplace.preposition}`,
        itemListElement: page.services.items.map((s) => ({
          "@type": "Offer",
          itemOffered: { "@type": "Service", name: s.tag, description: s.description }
        }))
      }
    },
    {
      "@type": "FAQPage",
      "@id": url + "#faq",
      mainEntity: page.faq.items.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a }
      }))
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Início", item: globals.brand.site + "/" },
        { "@type": "ListItem", position: 2, name: page.marketplace.name, item: url }
      ]
    }
  ];

  return `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": graph })}</script>`;
}
