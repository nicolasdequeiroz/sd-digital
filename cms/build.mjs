#!/usr/bin/env node
/* ============================================================================
   SD Digital: gerador das Landing Pages de marketplace
   ---------------------------------------------------------------------------
   Lê cms/data/**.json e escreve /lp/<slug>/index.html (HTML estático puro,
   sem build step no servidor, continua servindo direto pelo GitHub Pages).

     node cms/build.mjs            gera todas as LPs publicadas
     node cms/build.mjs shopee     gera só a LP informada

   Depois de rodar, revise o relatório de pendências impresso no final.
   ========================================================================= */

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import * as C from "./components.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const DATA = join(HERE, "data");
const OUT_DIR = join(ROOT, "lp");

const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));

/* ---------------------------------------------------------- modo preview - */
/* true enquanto o site roda só no endereço temporário do GitHub Pages
   (github.io/sd-digital), antes do domínio próprio: as LPs saem com
   noindex, senão o Google pode indexar o endereço de preview e depois
   competir com o domínio definitivo por conteúdo duplicado.

   >>> AO LIGAR O DOMÍNIO PRÓPRIO: mude para `false` e rode `node cms/build.mjs`
   de novo. É o mesmo cutover documentado no robots.txt e no README, só que
   aquele cobre o site inteiro por fora e este é o <meta> de cada LP. */
const PREVIEW = false;
const ROBOTS_META = PREVIEW ? "noindex, nofollow" : "index, follow";

/* --------------------------------------------------- versão dos assets ---- */
/* Sufixo ?v=N nos assets PRÓPRIOS das LPs (o CSS/JS do Webflow já vem com
   hash no nome). O GitHub Pages serve com cache longo: sem o sufixo, quem já
   visitou a LP continua com o CSS/JS antigo depois de um deploy.

   >>> Subir o número ao editar lp-marketplace.css / .js / sd-forms.js. */
const CSS_V = 37;
const JS_V = 6;
const FORMS_V = 1;

/* ------------------------------------------------------------ carrega ---- */

const globals = readJson(join(DATA, "_globals.json"));
const marketplacesDir = join(DATA, "marketplaces");

const all = readdirSync(marketplacesDir)
  .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
  .map((f) => readJson(join(marketplacesDir, f)))
  .sort((a, b) => (a.order || 99) - (b.order || 99));

const published = all.filter((p) => p.status === "published");
const only = process.argv[2];
const targets = only ? published.filter((p) => p.slug === only) : published;

if (!targets.length) {
  console.error(only ? `Nenhuma LP publicada com slug "${only}".` : "Nenhuma LP publicada em cms/data/marketplaces/.");
  process.exit(1);
}

/* -------------------------------------------------------------- shell ---- */

function page(ctx) {
  const { page: p, globals: g, url } = ctx;

  return `<!DOCTYPE html>
<html lang="pt-BR" data-marketplace="${C.esc(p.marketplace.name)}" style="--mk:${C.esc(p.marketplace.accent)};--mk-soft:${C.esc(p.marketplace.accentSoft)}">
<head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1" name="viewport"/>
<title>${C.esc(p.seo.title)}</title>
<meta name="description" content="${C.esc(p.seo.description)}"/>
<meta name="robots" content="${ROBOTS_META}"/>
<link rel="canonical" href="${C.esc(url)}"/>
<meta property="og:type" content="website"/>
<meta property="og:url" content="${C.esc(url)}"/>
<meta property="og:title" content="${C.esc(p.seo.title)}"/>
<meta property="og:description" content="${C.esc(p.seo.description)}"/>
${p.seo.ogImage ? `<meta property="og:image" content="${C.esc(g.brand.site + p.seo.ogImage)}"/>\n` : ""}<meta name="twitter:card" content="${p.seo.ogImage ? "summary_large_image" : "summary"}"/>
<meta name="twitter:title" content="${C.esc(p.seo.title)}"/>
<meta name="twitter:description" content="${C.esc(p.seo.description)}"/>
${p.seo.ogImage ? `<meta name="twitter:image" content="${C.esc(g.brand.site + p.seo.ogImage)}"/>\n` : ""}

<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@300;400;500;600;700&amp;display=swap"/>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@300;400;500;600;700&amp;display=swap" media="print" onload="this.media='all'"/>
<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@300;400;500;600;700&amp;display=swap"/></noscript>

<link rel="stylesheet" href="/assets/css/saiddiazdigital.webflow.shared.899e1d6f1.min.css"/>
<link rel="stylesheet" href="/assets/css/site-overrides.css"/>
<link rel="stylesheet" href="/assets/css/lp-marketplace.css?v=${CSS_V}"/>
<link rel="shortcut icon" href="/assets/images/6433569aa31608f904c65bf5_Frame-124.svg" type="image/x-icon"/>
<link rel="apple-touch-icon" href="/assets/images/6433569ea50b9c74586c1456_Frame-125.svg"/>

<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${g.analytics.gtmId}');</script>
<!-- End Google Tag Manager -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${g.analytics.ga4Id}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${g.analytics.ga4Id}');
</script>

${C.jsonLd(ctx)}
</head>
<body class="body lp-body">
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${g.analytics.gtmId}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>

${C.nav(ctx)}
<main>
${C.hero(ctx)}
${C.kpis(ctx)}
${C.intro(ctx)}
${C.services(ctx)}
${C.deliverables(ctx)}
${C.split(ctx)}
${C.band(ctx)}
${C.proof(ctx)}
${C.cases(ctx)}
${C.testimonials(ctx)}
${C.process(ctx)}
${C.faq(ctx)}
${C.contact(ctx)}
</main>
${C.footer(ctx)}
${C.whatsappFloat(ctx)}
<script src="/assets/js/sd-forms.js?v=${FORMS_V}" defer></script>
<script src="/assets/js/lp-marketplace.js?v=${JS_V}" defer></script>
</body>
</html>
`;
}

/* --------------------------------------------------- checagem de pendências */

function audit(p) {
  const warnings = [];

  if (p.testimonials?._status?.startsWith("PLACEHOLDER")) {
    const n = (p.testimonials.items || []).filter((i) => i._placeholder).length;
    const oculta = p.testimonials.enabled === false;
    warnings.push(
      oculta
        ? `depoimentos: seção oculta de propósito (enabled:false) até ter ${n} relato(s) real(is)`
        : `${n} depoimento(s) ainda são placeholder: trocar por relatos reais antes de publicar`
    );
  }

  const noImageShots = (p.hero?.shots || []).filter((s) => !s.image).length;
  if (noImageShots) warnings.push(`${noImageShots} print(s) do hero usando mock: colocar as fotos reais em hero.shots[].image`);

  const noImagePanels = (p.proof?.panels || []).filter((s) => !s.image).length;
  if (noImagePanels) warnings.push(`${noImagePanels} painel(is) da prova social usando mock: colocar os prints em proof.panels[].image`);

  return warnings;
}

/* -------------------------------------------------------- caminhos ---- */

/* As fontes do CMS (components.mjs, _globals.json) escrevem os caminhos a
   partir da raiz — "/assets/...", "/briefing" — que e' a forma canonica e
   legivel. Mas o site precisa funcionar tambem quando servido de uma
   subpasta (ex.: GitHub Pages de projeto, em /<repo>/), onde "/assets" cai
   fora do site.

   Em vez de espalhar "../../" por todo componente, a conversao acontece em
   um lugar so: aqui, no momento de escrever o arquivo. Qualquer caminho
   absoluto novo que alguem adicionar nos componentes ja sai relativo.

   depth = quantos niveis a pagina esta abaixo da raiz. As LPs sao geradas em
   lp/<slug>/index.html, entao depth = 2. */
function relativize(html, depth) {
  const prefix = "../".repeat(depth);
  const one = (v) => (v.startsWith("//") ? v : prefix + v.slice(1) || "./");

  return html
    // srcset tem varias URLs separadas por virgula: "/a.png 500w, /b.png 800w"
    .replace(/(\bsrcset\s*=\s*")([^"]*)"/g, (m, attr, val) => {
      const out = val
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => {
          const bits = item.split(/\s+/);
          if (bits[0].startsWith("/") && !bits[0].startsWith("//")) bits[0] = one(bits[0]);
          return bits.join(" ");
        })
        .join(", ");
      return attr + out + '"';
    })
    // data-video-urls e' uma lista separada por virgula, sem descritor
    .replace(/(\bdata-video-urls\s*=\s*")([^"]*)"/g, (m, attr, val) =>
      attr + val.split(",").map((u) => (u.trim().startsWith("/") ? one(u.trim()) : u.trim())).join(",") + '"')
    .replace(/(\b(?:href|src|data-src|data-poster-url|content|action|poster)\s*=\s*")(\/(?!\/)[^"]*)"/g,
      (m, attr, val) => attr + one(val) + '"')
    .replace(/url\((["']?)(\/(?!\/)[^)"']*)\1\)/g,
      (m, q, val) => `url(${q}${one(val)}${q})`)
    // o Webflow emite poster de video como style="...url(&quot;/assets/...&quot;)"
    .replace(/url\(&quot;(\/(?!\/)[^&]*)&quot;\)/g,
      (m, val) => `url(&quot;${one(val)}&quot;)`);
}

/* -------------------------------------------------------------- escreve --- */

const generated = [];

for (const p of targets) {
  const url = `${globals.brand.site}/lp/${p.slug}/`;
  const siblings = published.filter((s) => s.slug !== p.slug);
  const ctx = { page: p, globals, siblings, url };

  const dir = join(OUT_DIR, p.slug);
  mkdirSync(dir, { recursive: true });
  // LPs vivem em lp/<slug>/index.html -> dois niveis abaixo da raiz
  const html = relativize(page(ctx), 2);
  writeFileSync(join(dir, "index.html"), html, "utf8");

  generated.push({ slug: p.slug, url, bytes: Buffer.byteLength(html), warnings: audit(p) });
}

/* ------------------------------------------------------------- sitemap ---- */

function updateSitemap() {
  const file = join(ROOT, "sitemap.xml");
  let xml;
  try {
    xml = readFileSync(file, "utf8");
  } catch {
    return "sitemap.xml não encontrado, pulei";
  }

  const today = new Date().toISOString().slice(0, 10);
  // remove entradas de /lp/ anteriores e regrava a partir do CMS
  xml = xml.replace(/\s*<url>\s*<loc>[^<]*\/lp\/[^<]*<\/loc>[\s\S]*?<\/url>/g, "");

  // Em preview as LPs saem com noindex: anunciá-las no sitemap seria pedir
  // pro Google rastrear justamente o que o <meta> manda ignorar.
  const entries = (PREVIEW ? [] : published)
    .map(
      (p) => `  <url>
    <loc>${globals.brand.site}/lp/${p.slug}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>`
    )
    .join("\n");

  xml = xml.replace(/<\/urlset>/, entries ? `${entries}\n</urlset>` : "</urlset>");
  writeFileSync(file, xml, "utf8");
  return PREVIEW
    ? "sitemap.xml: LPs fora do sitemap (PREVIEW = true, elas estão noindex)"
    : `sitemap.xml atualizado com ${published.length} LP(s)`;
}

const sitemapResult = updateSitemap();

/* ------------------------------------------------------------ relatório --- */

console.log("\nLPs geradas:");
for (const g of generated) {
  console.log(`  ✓ /lp/${g.slug}/index.html  (${(g.bytes / 1024).toFixed(1)} KB)  →  ${g.url}`);
}
console.log(`\n${sitemapResult}`);

const pending = generated.filter((g) => g.warnings.length);
if (pending.length) {
  console.log("\n⚠️  Pendências de conteúdo antes de publicar / rodar campanha:");
  for (const g of pending) {
    console.log(`\n  ${g.slug}:`);
    g.warnings.forEach((w) => console.log(`    - ${w}`));
  }
  console.log("");
} else {
  console.log("\nSem pendências de conteúdo. 🎉\n");
}
