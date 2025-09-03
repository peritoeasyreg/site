
// /js/brands-carousel.js
(function () {
  const viewport = document.getElementById('brands-viewport');
  const track = document.getElementById('brands-track');
  const btnPrev = document.querySelector('.brands__nav--prev');
  const btnNext = document.querySelector('.brands__nav--next');

  if (!viewport || !track) return;

  // Lazy-load com IntersectionObserver (troca data-src -> src)
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const img = e.target;
        const src = img.getAttribute('data-src');
        if (src && !img.src) img.src = src;
        io.unobserve(img);
      }
    });
  }, { root: viewport, rootMargin: '200px' });

  track.querySelectorAll('img[data-src]').forEach(img => io.observe(img));

  // Config
  const STEP = () => track.querySelector('.brands__item')?.getBoundingClientRect().width || 180;
  const AUTOPLAY_MS = 3000;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let autoplayTimer = null;
  let paused = false;

  const next = () => track.scrollBy({ left: STEP(), behavior: 'smooth' });
  const prev = () => track.scrollBy({ left: -STEP(), behavior: 'smooth' });

  // Loop "infinito" simples: quando chegar quase ao fim, volta pro início
  track.addEventListener('scroll', () => {
    const nearEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - STEP() * 1.5;
    if (nearEnd) track.scrollTo({ left: 0, behavior: 'instant' });
  });

  // Setas
  btnNext?.addEventListener('click', () => { pauseTemporario(); next(); });
  btnPrev?.addEventListener('click', () => { pauseTemporario(); prev(); });

  // Teclado (quando a UL tem foco)
  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); pauseTemporario(); next(); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); pauseTemporario(); prev(); }
  });

  // Pausa/retoma
  const startAutoplay = () => {
    if (reduceMotion) return; // respeita usuários
    stopAutoplay();
    autoplayTimer = setInterval(() => { if (!paused) next(); }, AUTOPLAY_MS);
  };
  const stopAutoplay = () => { if (autoplayTimer) clearInterval(autoplayTimer); autoplayTimer = null; };
  const pause = () => { paused = true; };
  const resume = () => { paused = false; };
  const pauseTemporario = () => { pause(); setTimeout(resume, AUTOPLAY_MS * 1.5); };

  // Eventos para pausar: hover, foco em qualquer filho, toque/arrasto
  viewport.addEventListener('mouseenter', pause);
  viewport.addEventListener('mouseleave', resume);
  viewport.addEventListener('focusin', pause);
  viewport.addEventListener('focusout', resume);

  let pointerDown = false;
  track.addEventListener('pointerdown', () => { pointerDown = true; pause(); });
  window.addEventListener('pointerup', () => { if (pointerDown) { pointerDown = false; resume(); } });

  // Inicia
  startAutoplay();
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAutoplay(); else startAutoplay();
  });
})();
