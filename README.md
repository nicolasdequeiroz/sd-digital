# SD Digital: código extraído (saiddiazdigital.com)

Cópia estática do site publicado em `https://www.saiddiazdigital.com/` (Webflow),
com todos os assets baixados e os caminhos reescritos para arquivos locais.

Extraído em: 15/08/2026. Versão publicada no Webflow em 15/05/2026.

## Estrutura

```
index.html              → /
briefing/index.html     → /briefing
case/topfit/index.html  → /case/topfit
lp/<marketplace>/       → /lp/shopee, /lp/mercado-livre, /lp/amazon  (GERADO)
cms/                    → fonte de conteúdo das LPs + gerador
sitemap.xml, robots.txt
assets/
  css/     CSS compilado do Webflow + lp-marketplace.css (componentes das LPs)
  js/      webflow runtime + chunks, jQuery, GSAP, Swiper, boosters Flowbase,
           lp-marketplace.js (runtime próprio das LPs)
  images/  PNG/JPG/SVG/WEBP (inclui variantes -p-500/-800/-1080/... do srcset)
  media/   vídeos de fundo (mp4/webm) + posters
  json/    animações Lottie
  _manifest.json  → mapa "URL original do CDN" → "caminho local"
```

## Landing pages de marketplace (`/lp/...`)

Páginas de alta conversão, uma por marketplace, para receber o tráfego das
campanhas de Google Ads segmentadas por palavra ("consultoria shopee",
"assessoria mercado livre", ...).

Os arquivos em `lp/<slug>/index.html` são **gerados**: a fonte é o CMS em
JSON dentro de `cms/`. Para publicar uma alteração:

```bash
node cms/build.mjs
```

Como criar a LP de um novo canal, o que cada campo faz e o que ainda está
pendente de conteúdo real: veja [cms/README.md](cms/README.md).

Os caminhos dos assets são absolutos a partir da raiz (`/assets/...`), então o
site precisa ser servido por um servidor HTTP; abrir o `index.html` direto pelo
`file://` não carrega CSS/JS.

## Rodar localmente

```bash
python3 -m http.server 8788 --directory .
```

Depois acesse http://localhost:8788/

## Publicar no GitHub Pages

O repo está pronto para ser servido como está, não há build step, é HTML/CSS/JS
estático puro.

1. No GitHub: **Settings → Pages → Source** = `Deploy from a branch`,
   branch `main`, pasta `/ (root)`.
2. **Domínio próprio**: em Settings → Pages → Custom domain, informe o domínio
   (ex.: `www.saiddiazdigital.com`). O GitHub cria/atualiza um arquivo `CNAME`
   na raiz automaticamente, não é preciso criar esse arquivo manualmente.
   No provedor de DNS, aponte:
   - `www` (ou o subdomínio escolhido) → `CNAME` para `<usuario>.github.io`
   - domínio raiz (apex), se for usar sem `www`: registros `A` para os IPs do
     GitHub Pages (ver [docs oficiais](https://docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site)).
   Ative "Enforce HTTPS" depois que o certificado for emitido (leva alguns minutos).
3. O arquivo `.nojekyll` na raiz já está commitado: ele desliga o processamento
   Jekyll que o Pages roda por padrão. Sem ele, o GitHub ignora pastas/arquivos
   começando com `_` (como `assets/_manifest.json`) e pode tentar interpretar
   `{{ }}` / `{% %}` dentro dos bundles JS do Webflow como sintaxe Liquid.
4. Os caminhos são **relativos** (`assets/...` na raiz, `../assets/...` um nível
   abaixo, `../../assets/...` dois níveis abaixo). Por isso o site funciona tanto
   servido na raiz de um domínio próprio quanto de uma subpasta, que é o caso da
   URL padrão do Pages (`usuario.github.io/repo/`). Não introduza caminhos
   começando com `/` — eles quebram na subpasta.

   Nas LPs isso é automático: `cms/build.mjs` tem uma função `relativize()` que
   converte os caminhos no momento de gravar o arquivo, então os componentes em
   `cms/` podem continuar escrevendo `/assets/...`, que é a forma legível.

## Preview no github.io (antes do domínio próprio)

Enquanto o domínio próprio não entra, o site fica em
`https://nicolasdequeiroz.github.io/sd-digital/`.

**Checklist do cutover** — ao ligar o domínio próprio, reverta o modo preview:

- [ ] `robots.txt`: hoje está com `Disallow: /` para o Google não indexar o
      endereço de preview. Substitua o arquivo inteiro pela única linha
      `Sitemap: https://www.saiddiazdigital.com/sitemap.xml`.
      **Se esquecer, o site fica fora da busca do Google.**
- [ ] GTM/GA4 continuam apontando pra propriedade de produção — os acessos ao
      preview entram nos dados reais.

## O que continua remoto (de propósito)

Essas chamadas dependem de serviço externo e não fazem sentido baixar:

- **Google Fonts** (`fonts.googleapis.com`, `WebFont.load`: Red Hat Display, Inter). Offline,
  o site cai para as fontes de fallback do sistema.
- **Google Tag Manager / GA4** (`GTM-544MR6GZ`, `G-4YQKZQLQL6`): ainda disparam
  para a mesma propriedade; remova as tags do `<head>` se não quiser poluir os
  dados de produção durante o desenvolvimento.
- **Formspree** (`formspree.io/f/mojrgnra`): o formulário do briefing envia de
  verdade ao ser submetido.
- Links externos: WhatsApp, Instagram, LinkedIn.

## Observações

- Os atributos `integrity`/`crossorigin` foram removidos das tags de CSS/JS,
  já que os arquivos agora são locais e os hashes não batem mais.
- Links internos que apontavam para `https://www.saiddiazdigital.com/...` foram
  convertidos para caminhos relativos à raiz.
- O JS do Webflow é o bundle minificado de produção: as interações (IX2),
  carrossel e animações funcionam, mas não é código-fonte editável.
