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
  var INTERVAL_MS = 5000;
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
      bar.style.width = '0%';
    });
  }

  function animateBar(index) {
    var bar = bars[index];
    bar.offsetHeight; // força reflow: sem isso o navegador agrupa os dois estilos e não anima
    bar.style.transition = 'width ' + INTERVAL_MS + 'ms linear';
    bar.style.width = '100%';
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

// Header (home): troca de cor ao rolar. O Webflow IX2 interpolava
// background-color continuamente via JS a cada evento de scroll, escrito
// direto no style inline — pesado (recalcula em toda página) e o resultado
// visual ficava inconsistente entre telas. Aqui é só um listener passivo
// throttled por requestAnimationFrame alternando uma classe; a transição é
// CSS (site-overrides.css cuida do !important pra vencer o inline style que
// o IX2 continua escrevendo nesse mesmo elemento — ele segue controlando só
// a animação de entrada do header no mobile, que não mexe nessa propriedade).
(function () {
  var nav = document.querySelector('.nav.w-nav');
  if (!nav) return;

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
