# CMS das Landing Pages de Marketplace

Este diretório é o "CMS fake" das LPs de marketplace. Não existe banco de dados
nem painel: **o conteúdo mora em arquivos JSON** e um script Node transforma
esses JSONs em HTML estático dentro de `/lp/<slug>/`.

A ideia é a mesma de um CMS de verdade:

| Conceito de CMS        | Aqui                                            |
| ---------------------- | ----------------------------------------------- |
| Configurações globais  | `cms/data/_globals.json` (singleton)            |
| Coleção "Landing Page" | `cms/data/marketplaces/*.json` (um item = uma LP) |
| Componentes / blocos   | `cms/components.mjs`                            |
| Template da página     | função `page()` em `cms/build.mjs`              |
| Publicar               | `node cms/build.mjs`                            |
| Rascunho x publicado   | campo `status` no JSON da LP                    |
| Relacionamento         | o cross-sell do rodapé é montado automaticamente a partir das outras LPs publicadas |

Quem escreve texto mexe **só** em `cms/data/**`. Quem mexe em layout mexe em
`cms/components.mjs` e `assets/css/lp-marketplace.css`.

---

## Rodar

```bash
node cms/build.mjs
```

Gera **todas** as LPs com `"status": "published"` e atualiza o `sitemap.xml`.
Para gerar só uma:

```bash
node cms/build.mjs shopee
```

Não precisa instalar nada, só Node 18+. Não há dependências.

Para ver no navegador:

```bash
python3 -m http.server 8788 --directory .
```

E acesse `http://localhost:8788/lp/shopee/`.

> ⚠️ **Nunca edite `/lp/<slug>/index.html` na mão.** Esse arquivo é gerado e
> será sobrescrito no próximo build. Edite o JSON e rode o build de novo.

---

## Criar a LP de um novo marketplace

Exemplo: Magalu.

1. Copie um JSON existente:

   ```bash
   cp cms/data/marketplaces/shopee.json cms/data/marketplaces/magalu.json
   ```

2. Abra o novo arquivo e ajuste:

   - `slug` → `"magalu"` (define a URL: `/lp/magalu/`)
   - `order` → posição no cross-sell dos rodapés
   - `marketplace.*` → nome, preposição ("no Magalu"), logo, cor de destaque
   - `seo.*`, `hero.*`, textos das seções, `faq`, `whatsapp.*`

3. Coloque a logo em `assets/images/` e aponte `marketplace.logo` para ela.

4. Rode `node cms/build.mjs`.

Pronto: a nova LP existe, entra no `sitemap.xml` e aparece automaticamente no
rodapé das outras LPs (e as outras aparecem no rodapé dela).

Enquanto a página não estiver pronta, deixe `"status": "draft"`: ela não é
gerada nem entra no cross-sell.

---

## Campos do JSON de uma LP

### `marketplace`

| Campo         | O que é                                                              |
| ------------- | -------------------------------------------------------------------- |
| `name`        | Nome do canal. Vai para o `data-marketplace` do `<html>` e para o campo oculto do formulário: é assim que o time separa os leads por canal no GA4/GTM. |
| `preposition` | "na Shopee", "no Mercado Livre". Usado no meio das frases.            |
| `logo`        | Caminho da logo (a partir da raiz do site).                          |
| `accent`      | **Cor de destaque da página.** Injetada em `--mk` no `<html>`; tinge botões, ícones, o bloco full-bleed e os gráficos. |
| `accentSoft`  | Versão clara da cor, usada no fundo dos ícones.                       |
| `keywords`    | Só documentação: as palavras que essa LP atende no Google Ads.         |

> **Contraste:** `accent` é usada como fundo de botão com texto branco. Evite
> amarelo/laranja claro (por isso a LP da Amazon usa o azul `#146EB4` e não o
> laranja da marca).

### Seções

| Bloco          | Vira o quê na página                                            |
| -------------- | --------------------------------------------------------------- |
| `hero`         | Topo: logo do canal, H1, subtítulo, 2 CTAs, selos de confiança, 3 painéis e o ticker de palavras |
| `kpis`         | Faixa de 4 números com contador animado                          |
| `intro`        | Bloco de diagnóstico ("por que sua loja trava")                  |
| `services`     | Os dois cards: **consultoria** e **assessoria**                  |
| `deliverables` | Grade de 9 cards com ícone: o que entra na assessoria            |
| `split`        | Duas colunas: "você cuida de" x "a SD Digital cuida de"          |
| `band`         | Faixa full-bleed na cor do canal, com CTA                        |
| `proof`        | Painéis de vendas (os prints)                                    |
| `testimonials` | Depoimentos                                                      |
| `process`      | Os 4 passos                                                      |
| `faq`          | Acordeão, também vira `FAQPage` no schema.org                    |
| `form`         | Formulário de contato                                            |
| `whatsapp`     | Mensagem pré-preenchida de cada botão de WhatsApp da página      |

Ícones disponíveis em `deliverables[].icon`: `megaphone`, `search`, `image`,
`tag`, `plug`, `shield`, `box`, `truck`, `chart`, `users`, `clock`.
Para adicionar outro, edite o objeto `ICONS` em `cms/components.mjs`.

---

## Provas sociais: leia antes de publicar

Duas seções da página são **placeholder** e precisam de conteúdo real antes de
a LP ir ao ar e antes de qualquer verba de Ads entrar:

### 1. Painéis de vendas (`hero.shots` e `proof.panels`)

Cada item tem um campo `image` e um objeto `mock`:

```json
{ "image": "", "badge": "Suplementos", "mock": { "...": "..." } }
```

- `image` **vazio** → a página desenha um card de painel estilizado com os
  números do `mock`. É um marcador de layout, não um print de conta real.
- `image` **preenchido** → a página mostra a foto e ignora o `mock`.

Quando os prints chegarem: salve em `assets/images/` e preencha o `image`.

```json
{ "image": "/assets/images/painel-shopee-01.png", "badge": "Suplementos" }
```

Nos prints reais, **apague ou borre** nome da loja, CNPJ, e-mail e qualquer
dado que identifique o cliente, e confirme com o cliente antes de publicar.

### 2. Depoimentos (`testimonials.items`)

Vêm marcados com `"_placeholder": true` e texto `[SUBSTITUIR POR DEPOIMENTO
REAL]`. Troque por relatos reais, com autorização de quem falou, e remova o
`_placeholder` e o `_status` da seção.

Se não houver depoimentos reais a tempo, **apague o bloco `testimonials`
inteiro do JSON**: o componente é ignorado quando a lista está vazia e a
página fica coerente sem ele. Depoimento inventado em página comercial é
propaganda enganosa e é motivo de reprovação no Google Ads.

O build lista essas pendências no final de cada execução:

```
⚠️  Pendências de conteúdo antes de publicar / rodar campanha:
  shopee:
    - 3 depoimento(s) ainda são placeholder ...
```

Os números de `kpis` e os cases em `_globals.json` também precisam ser
conferidos com o comercial: os cases vieram do site publicado, os KPIs são uma
estimativa e devem ser validados.

---

## Como isso conversa com o Google Ads

Cada LP é uma URL própria, para direcionar o tráfego pela palavra pesquisada:

| Grupo de anúncios     | URL final                                            |
| --------------------- | ---------------------------------------------------- |
| "consultoria shopee"  | `https://www.saiddiazdigital.com/lp/shopee/`         |
| "assessoria mercado livre" | `https://www.saiddiazdigital.com/lp/mercado-livre/` |
| "vender na amazon"    | `https://www.saiddiazdigital.com/lp/amazon/`         |

O que já está pronto na página:

- **UTM e `gclid`** são lidos da URL, guardados na sessão e enviados em campos
  ocultos do formulário, e também colados no fim da mensagem do WhatsApp,
  então dá para atribuir o lead mesmo quem não preenche formulário.
- **Eventos no dataLayer** para o GTM/GA4: `generate_lead` no envio do
  formulário e `whatsapp_click` em cada botão (com `posicao`: `nav`, `hero`,
  `band`, `form`, `flutuante`).
- **`marketplace`** vai junto em todo evento e no formulário, para separar os
  leads por canal.
- GTM (`GTM-544MR6GZ`) e GA4 (`G-4YQKZQLQL6`) são os mesmos do site.

No GTM ainda é preciso criar os acionadores desses dois eventos e ligá-los às
conversões do Google Ads; isso não dá para fazer pelo código da página.

---

## Formulário

Vai para o Formspree configurado em `_globals.json` → `form.endpoint`
(hoje o mesmo do briefing). O envio é por `fetch`, sem sair da página, com
mensagem de sucesso/erro. Há um campo `_gotcha` invisível como antispam.

Para separar as caixas de entrada por canal, crie um formulário Formspree por
LP e mova o `endpoint` do `_globals.json` para dentro do JSON de cada
marketplace (o build já lê `globals.form.endpoint`; basta trocar por
`page.form.endpoint` em `components.mjs`).

---

## Arquivos

```
cms/
  build.mjs                  gerador (roda com node, sem dependências)
  components.mjs             biblioteca de blocos → HTML
  data/
    _globals.json            configuração e conteúdo compartilhado
    marketplaces/
      shopee.json            uma LP
      mercado-livre.json
      amazon.json
  partials/
    sd-logo.svg              logo SD extraída do site
    whatsapp-icon.svg        ícone extraído do site
    client-logos.html        logos de clientes extraídas da home

assets/css/lp-marketplace.css   componentes das LPs (roda sobre o CSS do Webflow)
assets/js/lp-marketplace.js     runtime das LPs (menu, reveal, contador, UTM, form)

lp/<slug>/index.html            ← GERADO. Não editar na mão.
```

## De onde vem cada componente

As LPs reaproveitam o CSS compilado do Webflow e replicam os componentes da
página `/case/topfit`:

| TOPFIT                          | LP de marketplace                     |
| ------------------------------- | ------------------------------------- |
| `.navigation-01`                | `.lp-nav` (réplica + CTA fixo)        |
| header + `.header-image-grid`   | `.lp-hero` + `.lp-shots`              |
| `.carousel` / `.roller-text`    | `.lp-ticker` (mesmo visual, CSS puro) |
| `.divider-caption` + `.dot-orange` | reuso direto                       |
| `.gallery-card` / `.gallery-badge` | `.lp-panel` / `.lp-badge`          |
| `.team-about-card`              | `.lp-service`                         |
| `.team-badge`                   | `.lp-tag`                             |
| `.logo-section` (bloco vermelho)| `.lp-band` (na cor do marketplace)    |
| `.process-card`                 | `.lp-step`                            |
| `.contact-sec` + moeda + vídeo  | reuso direto + `.lp-form`             |
| `.whatsapp-block`               | reuso direto                          |

As LPs **não carregam o bundle JS do Webflow**. O IX2 é compilado por página no
Webflow e aplicaria as interações do TOPFIT aos nós daqui, escondendo
elementos. `assets/js/lp-marketplace.js` faz o que a LP precisa em ~5 KB, o
que também ajuda no Índice de Qualidade do Google Ads.
