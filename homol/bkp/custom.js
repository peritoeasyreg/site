/*
{
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Easy Reg",
    "url": "https://easyreg.example/",
    "telephone": "+55-11-99999-9999",
    "image": "/og-image.jpg",
    "description": "Assessoria e comércio eletrônico – Vistorias ágeis e atendimento humano.",
    "address": {"@type": "PostalAddress","addressCountry": "BR"}
  }
*/

// ===== Slider (banners) =====
(function(){
  const viewport = document.getElementById('viewport');
  const track = document.getElementById('track');
  const dots = document.getElementById('dots');
  if(!viewport || !track || !dots) return;
  const slides = Array.from(track.children);
  let index = 0, timer = null;
  slides.forEach((_,i)=>{
    const b=document.createElement('button');
    b.className='dot'; b.setAttribute('aria-label','Ir para slide '+(i+1));
    b.addEventListener('click',()=>go(i)); dots.appendChild(b);
  });
  function update(){ track.style.transform=`translateX(-${index*100}%)`; [...dots.children].forEach((d,i)=>d.setAttribute('aria-current',i===index)); }
  function go(i){ index=(i+slides.length)%slides.length; update(); reset(); }
  function next(){ go(index+1); } function prev(){ go(index-1); }
  document.getElementById('next')?.addEventListener('click',next);
  document.getElementById('prev')?.addEventListener('click',prev);
  let startX=0,dx=0; viewport.addEventListener('touchstart',e=>{startX=e.touches[0].clientX;dx=0;},{passive:true});
  viewport.addEventListener('touchmove',e=>{dx=e.touches[0].clientX-startX;},{passive:true});
  viewport.addEventListener('touchend',()=>{if(Math.abs(dx)>50){dx<0?next():prev();}});
  function reset(){ if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; clearInterval(timer); timer=setInterval(next,5000); }
  window.addEventListener('load',()=>{update();reset();});
})();

// ===== Cookie banner =====
(function(){
  const banner=document.getElementById('cookieBanner');
  if(!banner) return;
  const accepted=localStorage.getItem('cookie_consent')==='true';
  if(!accepted){ banner.classList.add('show'); }
  document.getElementById('cookieAccept')?.addEventListener('click',()=>{
    localStorage.setItem('cookie_consent','true'); banner.classList.remove('show');
  });
  document.getElementById('cookieDecline')?.addEventListener('click',()=>{ banner.classList.remove('show'); });
})();

// ===== Brands carousel: autoplay + A11y =====
(function(){
  const track = document.getElementById('brandTrack');
  const prev = document.getElementById('brandPrev');
  const next = document.getElementById('brandNext');
  if(!track || !prev || !next) return;
  const step = 220; // px
  let timer = null;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function scrollStep(dir=1){
    track.scrollBy({left: dir*step, behavior: prefersReduced ? 'auto' : 'smooth'});
    if(track.scrollLeft + track.clientWidth + 4 >= track.scrollWidth){ track.scrollTo({left: 0, behavior: 'auto'}); }
    if(track.scrollLeft <= 0 && dir < 0){ track.scrollTo({left: track.scrollWidth - track.clientWidth, behavior: 'auto'}); }
  }
  prev.addEventListener('click', ()=>scrollStep(-1));
  next.addEventListener('click', ()=>scrollStep(1));
  track.addEventListener('keydown', (e)=>{ if(e.key==='ArrowRight'){e.preventDefault();scrollStep(1);} if(e.key==='ArrowLeft'){e.preventDefault();scrollStep(-1);} });
  function start(){ if(prefersReduced) return; clearInterval(timer); timer=setInterval(()=>scrollStep(1), 3000); }
  function stop(){ clearInterval(timer); }
  ['mouseenter','focusin','touchstart'].forEach(ev=>track.addEventListener(ev, stop, {passive:true}));
  ['mouseleave','focusout','touchend'].forEach(ev=>track.addEventListener(ev, start, {passive:true}));
  ['mouseenter','focusin','touchstart'].forEach(ev=>prev.addEventListener(ev, stop, {passive:true}));
  ['mouseleave','focusout','touchend'].forEach(ev=>prev.addEventListener(ev, start, {passive:true}));
  ['mouseenter','focusin','touchstart'].forEach(ev=>next.addEventListener(ev, stop, {passive:true}));
  ['mouseleave','focusout','touchend'].forEach(ev=>next.addEventListener(ev, start, {passive:true}));
  start();
})();