// Cases de sucesso: troca as abas automaticamente, como um carrossel.
// Cada aba ganha uma barra de progresso (.tab-progress-bar) que enche até a
// próxima troca — visualiza o tempo restante e serve de indicação de que a
// troca é automática. Reinicia (timer + barra) sempre que o visitante clica
// numa aba, pra não brigar com ele.
//
// O índice da aba ativa é rastreado à parte (currentIndex), em vez de ler a
// classe .w--current do Webflow: ela é aplicada de forma assíncrona (a
// troca tem fade, data-duration-in="300"), então lê-la logo depois de um
// .click() programático pega o valor antigo e anima a barra errada.
(function () {
  var INTERVAL_MS = 8000;
  var BAR_INSET = 8; // px de respiro de cada lado (bate com o left/right do CSS)
  var menu = document.querySelector('.feature-tab-menu');
  if (!menu) return;
  var wrapper = menu.closest('.w-tabs') || menu;

  var links = Array.prototype.slice.call(menu.querySelectorAll('.feature-tab-link'));
  if (links.length < 2) return;

  var bars = links.map(function (link) {
    var bar = document.createElement('div');
    bar.className = 'tab-progress-bar';
    link.appendChild(bar);
    return bar;
  });

  var currentIndex = Math.max(0, links.findIndex(function (link) {
    return link.classList.contains('w--current');
  }));
  var timer = null;

  function resetBars() {
    bars.forEach(function (bar) {
      bar.style.transition = 'none';
      bar.style.width = '0px';
    });
  }

  function animateBar(index) {
    var bar = bars[index];
    // a barra fica dentro de um respiro de 8px de cada lado (não vai de
    // borda a borda) — largura em px, não %, pra não ter que brigar com o
    // left/right fixos do CSS numa conta de "100% menos o respiro".
    var fullWidth = links[index].clientWidth - BAR_INSET * 2;
    bar.offsetHeight; // força reflow: sem isso o navegador agrupa os dois estilos e não anima
    bar.style.transition = 'width ' + INTERVAL_MS + 'ms linear';
    bar.style.width = fullWidth + 'px';
  }

  function start() {
    stop();
    resetBars();
    animateBar(currentIndex);
    timer = setInterval(function () {
      links[(currentIndex + 1) % links.length].click();
    }, INTERVAL_MS);
  }

  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
    resetBars();
  }

  links.forEach(function (link, index) {
    link.addEventListener('click', function () {
      currentIndex = index;
      start();
    });
  });

  wrapper.addEventListener('mouseenter', stop);
  wrapper.addEventListener('mouseleave', start);

  start();
})();

// Header da home. A marcação saiu do componente `w-nav` do Webflow: o runtime
// dele (jQuery) abria e fechava o menu escrevendo estilo inline, e o IX2 ainda
// plantava `opacity:0` + translate no próprio dropdown como animação de
// entrada — o painel nascia invisível e deslocado, brigando com o CSS.
// Aqui o header é HTML comum e todo o comportamento é este bloco:
//   1. abrir/fechar o dropdown (classe .is-menu-open no .nav)
//   2. .nav--scrolled quando a página sai do topo
// É o mesmo desenho do header das LPs (assets/js/lp-marketplace.js).
(function () {
  var nav = document.querySelector('[data-sd-nav]');
  if (!nav) return;

  var btn = nav.querySelector('.menu-button');
  var menu = nav.querySelector('.nav-menu');

  /* ------------------------------------------------------- 1. dropdown -- */
  if (btn && menu) {
    // aria-label acompanha o estado: sem isso o leitor de tela continua
    // anunciando "Abrir menu" com o menu já aberto.
    var setOpen = function (open) {
      nav.classList.toggle('is-menu-open', open);
      btn.classList.toggle('w--open', open); // é dela que o ícone vira "x"
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    };

    btn.addEventListener('click', function () {
      setOpen(!nav.classList.contains('is-menu-open'));
    });

    // clicar num link fecha: os itens são âncoras da própria página, então o
    // painel ficaria aberto por cima da seção recém-rolada.
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });
    document.addEventListener('click', function (e) {
      if (nav.classList.contains('is-menu-open') && !e.target.closest('[data-sd-nav]')) {
        setOpen(false);
      }
    });
  }

  /* --------------------------------------------- 2. barra sólida ao rolar */
  // Listener passivo throttled por rAF; a transição de cor é CSS. O IX2 fazia
  // isso interpolando background-color inline a cada evento de scroll.
  var SCROLLED_AT = 60; // px
  var ticking = false;

  function update() {
    nav.classList.toggle('nav--scrolled', window.scrollY > SCROLLED_AT);
    ticking = false;
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  update();
})();
