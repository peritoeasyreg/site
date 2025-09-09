
// /js/visitors-counter.js
(function(){
  const el = document.querySelector('[data-visitors]');
  if(!el) return;
  const MIN = 83, MAX = 217;
  const jitter = () => Math.floor(Math.random()*(MAX-MIN+1))+MIN;
  const render = (n) => el.textContent = n.toString();
  let current = jitter();
  render(current);

  // muda de 10 a 20s, com pequenos passos
  const tick = () => {
    const delta = Math.random()<0.5 ? -1 : 1;
    current = Math.min(MAX, Math.max(MIN, current + delta));
    render(current);
    const next = Math.floor(10000 + Math.random()*10000);
    setTimeout(tick, next);
  };
  setTimeout(tick, 12000);

  // atualiza quando a aba volta a ficar ativa
  document.addEventListener('visibilitychange', () => {
    if(!document.hidden){ current = jitter(); render(current); }
  });
})();
