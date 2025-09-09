// Mantém seu layout: basta ter um elemento com [data-visitors] para mostrar o número
(() => {
  const target = document.querySelector('[data-visitors]'); if(!target) return;
  const min = parseInt(target.getAttribute('data-min')||'28',10);
  const max = parseInt(target.getAttribute('data-max')||'167',10);
  const jitter = parseInt(target.getAttribute('data-jitter')||'9',10);
  let n = Math.floor((min+max)/2);
  const clamp = (x,mn,mx)=>Math.max(mn,Math.min(mx,x));
  const tick = () => { n = clamp(n + (Math.random()*jitter*2 - jitter), min, max); target.textContent = Math.round(n); };
  tick(); setInterval(tick, 5000 + Math.random()*4000);
})();