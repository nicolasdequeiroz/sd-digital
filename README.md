# SD Digital — código extraído (saiddiazdigital.com)

Cópia estática do site publicado em `https://www.saiddiazdigital.com/` (Webflow),
com todos os assets baixados e os caminhos reescritos para arquivos locais.

Extraído em: 15/08/2026 — versão publicada no Webflow em 15/05/2026.

## Estrutura

```
index.html              → /
briefing/index.html     → /briefing
case/topfit/index.html  → /case/topfit
sitemap.xml, robots.txt
assets/
  css/     1 arquivo (CSS compilado do Webflow)
  js/      webflow runtime + chunks, jQuery, GSAP, Swiper, boosters Flowbase
  images/  PNG/JPG/SVG/WEBP (inclui variantes -p-500/-800/-1080/... do srcset)
  media/   vídeos de fundo (mp4/webm) + posters
  json/    animações Lottie
  _manifest.json  → mapa "URL original do CDN" → "caminho local"
```

Os caminhos dos assets são absolutos a partir da raiz (`/assets/...`), então o
site precisa ser servido por um servidor HTTP — abrir o `index.html` direto pelo
`file://` não carrega CSS/JS.

## Rodar localmente

```bash
python3 -m http.server 8788 --directory .
```

Depois acesse http://localhost:8788/

## Publicar no GitHub Pages

O repo está pronto para ser servido como está — não há build step, é HTML/CSS/JS
estático puro.

1. No GitHub: **Settings → Pages → Source** = `Deploy from a branch`,
   branch `main`, pasta `/ (root)`.
2. **Domínio próprio**: em Settings → Pages → Custom domain, informe o domínio
   (ex.: `www.saiddiazdigital.com`). O GitHub cria/atualiza um arquivo `CNAME`
   na raiz automaticamente — não é preciso criar esse arquivo manualmente.
   No provedor de DNS, aponte:
   - `www` (ou o subdomínio escolhido) → `CNAME` para `<usuario>.github.io`
   - domínio raiz (apex), se for usar sem `www` → registros `A` para os IPs do
     GitHub Pages (ver [docs oficiais](https://docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site)).
   Ative "Enforce HTTPS" depois que o certificado for emitido (leva alguns minutos).
3. O arquivo `.nojekyll` na raiz já está commitado — ele desliga o processamento
   Jekyll que o Pages roda por padrão. Sem ele, o GitHub ignora pastas/arquivos
   começando com `_` (como `assets/_manifest.json`) e pode tentar interpretar
   `{{ }}` / `{% %}` dentro dos bundles JS do Webflow como sintaxe Liquid.
4. Como os caminhos dos assets são absolutos (`/assets/...`), o site só funciona
   corretamente servido na raiz do domínio — é o caso normal com domínio
   próprio. Se em algum momento for publicado sem domínio próprio (URL padrão
   `usuario.github.io/repo`), os caminhos absolutos vão quebrar e precisam ser
   reescritos para relativos.

## O que continua remoto (de propósito)

Essas chamadas dependem de serviço externo e não fazem sentido baixar:

- **Google Fonts** (`fonts.googleapis.com`, `WebFont.load` → Red Hat Display, Inter) —
  offline o site cai para as fontes de fallback do sistema.
- **Google Tag Manager / GA4** (`GTM-544MR6GZ`, `G-4YQKZQLQL6`) — ainda disparam
  para a mesma propriedade; remova as tags do `<head>` se não quiser poluir os
  dados de produção durante o desenvolvimento.
- **Formspree** (`formspree.io/f/mojrgnra`) — o formulário do briefing envia de
  verdade ao ser submetido.
- Links externos: WhatsApp, Instagram, LinkedIn.

## Observações

- Os atributos `integrity`/`crossorigin` foram removidos das tags de CSS/JS,
  já que os arquivos agora são locais e os hashes não batem mais.
- Links internos que apontavam para `https://www.saiddiazdigital.com/...` foram
  convertidos para caminhos relativos à raiz.
- O JS do Webflow é o bundle minificado de produção — as interações (IX2),
  carrossel e animações funcionam, mas não é código-fonte editável.
