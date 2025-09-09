
// /js/hero-slider.js
(function(){
  const root = document.querySelector('.hero-slider'); if(!root) return;
  const track = root.querySelector('.hero-track');
  const prevBtn = root.querySelector('.hero-btn--prev');
  const nextBtn = root.querySelector('.hero-btn--next');
  const dotsWrap = root.querySelector('.hero-dots');
  const AUTOPLAY_MS = 5000;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let i=0, timer=null, paused=false;
  const slides = Array.from(root.querySelectorAll('.hero-slide'));

  // dots
  dotsWrap.innerHTML='';
  slides.forEach((_,idx)=>{
    const b=document.createElement('button');
    b.className='hero-dot'; b.type='button';
    b.setAttribute('aria-label',`Ir para o slide ${idx+1}`);
    b.addEventListener('click',()=>{ pauseTemp(); go(idx); });
    dotsWrap.appendChild(b);
  });

  // lazy
  const io=new IntersectionObserver(es=>{
    es.forEach(e=>{ if(e.isIntersecting){ const img=e.target,src=img.getAttribute('data-src'); if(src&&!img.src) img.src=src; io.unobserve(img); } });
  },{root:root,rootMargin:'50%'});
  root.querySelectorAll('img[data-src]').forEach(img=>io.observe(img));

  function go(idx){ i=(idx+slides.length)%slides.length; track.style.transform=`translateX(-${i*100}%)`; updateDots(); }
  function next(){ go(i+1); } function prev(){ go(i-1); }
  function updateDots(){ dotsWrap.querySelectorAll('.hero-dot').forEach((d,idx)=>d.setAttribute('aria-current',idx===i?'true':'false')); }

  function start(){ if(reduceMotion) return; stop(); timer=setInterval(()=>{ if(!paused) next(); }, AUTOPLAY_MS); }
  function stop(){ if(timer) clearInterval(timer); timer=null; }
  function pause(){ paused=true; } function resume(){ paused=false; }
  function pauseTemp(){ pause(); setTimeout(resume,AUTOPLAY_MS*1.2); }

  nextBtn?.addEventListener('click',()=>{ pauseTemp(); next(); });
  prevBtn?.addEventListener('click',()=>{ pauseTemp(); prev(); });
  root.addEventListener('mouseenter',pause); root.addEventListener('mouseleave',resume);
  root.addEventListener('focusin',pause); root.addEventListener('focusout',resume);
  root.addEventListener('keydown',(e)=>{ if(e.key==='ArrowRight'){e.preventDefault(); pauseTemp(); next();} if(e.key==='ArrowLeft'){e.preventDefault(); pauseTemp(); prev();} });

  let startX=0, dragging=false;
  track.addEventListener('pointerdown',(e)=>{ dragging=true; startX=e.clientX; pause(); track.setPointerCapture(e.pointerId); });
  track.addEventListener('pointerup',(e)=>{ if(!dragging) return; dragging=false; const dx=e.clientX-startX; if(Math.abs(dx)>40){ dx<0?next():prev(); } resume(); });
  track.addEventListener('pointercancel',()=>{ dragging=false; resume(); });

  go(0); start();
  document.addEventListener('visibilitychange',()=>{ if(document.hidden) stop(); else start(); });
})();
