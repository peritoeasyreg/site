(function(){
  function ready(fn){ if(document.readyState!='loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
  ready(function(){
    // Prefer explicit slot
    var slot = document.querySelector('[data-hero-slot]') 
            || document.querySelector('section.hero, .hero-banner, section[id*="hero"], section[class*="hero"], section[id*="slide"], section[class*="slide"]');
    if(!slot) return;

    // If a slider already exists, just wire behavior
    var container = slot.querySelector('[data-hero-slider]');
    if(!container){
      // wipe current child (e.g., single image) and insert our slider
      slot.innerHTML = '';
      container = document.createElement('section');
      container.setAttribute('data-hero-slider','');
      container.className = 'hero';
      container.style.position='relative'; container.style.overflow='hidden';
      var track = document.createElement('div');
      track.className = 'hero-track';
      track.style.display='flex'; track.style.transition='transform .6s ease';
      for(var i=1;i<=3;i++){
        var slide = document.createElement('div');
        slide.className='hero-slide'; slide.style.minWidth='100%';
        var img = document.createElement('img');
        img.src = './assets/img/slide-'+i+'.jpg';
        img.alt = 'Destaque '+i; img.style.width='100%'; img.style.display='block';
        slide.appendChild(img);
        track.appendChild(slide);
      }
      container.appendChild(track);
      var prev = document.createElement('a'); prev.href='#'; prev.setAttribute('aria-label','Anterior'); prev.setAttribute('data-hero-prev','');
      prev.style.cssText='position:absolute;left:8px;top:50%;transform:translateY(-50%);background:rgba(0,0,0,.5);color:#fff;padding:.5rem .7rem;border-radius:.5rem;';
      prev.textContent = '‹';
      var next = document.createElement('a'); next.href='#'; next.setAttribute('aria-label','Próximo'); next.setAttribute('data-hero-next','');
      next.style.cssText='position:absolute;right:8px;top:50%;transform:translateY(-50%);background:rgba(0,0,0,.5);color:#fff;padding:.5rem .7rem;border-radius:.5rem;';
      next.textContent = '›';
      container.appendChild(prev); container.appendChild(next);
      slot.appendChild(container);
    }

    var track = container.querySelector('.hero-track');
    var slides = Array.prototype.slice.call(container.querySelectorAll('.hero-slide'));
    if(!track || slides.length===0) return;

    var index = 0, interval = 3000, timer=null, isPaused=false, startX=null, deltaX=0;

    function update(){ var w = container.clientWidth; track.style.transform = 'translateX(' + (-index * w) + 'px)'; }
    function next(){ index = (index + 1) % slides.length; update(); }
    function prev(){ index = (index - 1 + slides.length) % slides.length; update(); }
    function play(){ if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; if(timer) clearInterval(timer); timer=setInterval(function(){ if(!isPaused) next(); }, interval); }
    function pause(){ isPaused = true; }
    function resume(){ isPaused = false; }

    window.addEventListener('resize', update);
    ['mouseenter','focusin','touchstart','pointerdown'].forEach(function(evt){ container.addEventListener(evt, pause); });
    ['mouseleave','focusout','touchend','pointerup','pointercancel'].forEach(function(evt){ container.addEventListener(evt, resume); });

    container.addEventListener('touchstart', function(e){ startX = e.touches[0].clientX; deltaX=0; }, {passive:true});
    container.addEventListener('touchmove', function(e){ if(startX!==null){ deltaX = e.touches[0].clientX - startX; } }, {passive:true});
    container.addEventListener('touchend', function(){ if(Math.abs(deltaX)>40){ if(deltaX<0) next(); else prev(); } startX=null; deltaX=0; }, {passive:true});

    var btnPrev = container.querySelector('[data-hero-prev]');
    var btnNext = container.querySelector('[data-hero-next]');
    if(btnPrev) btnPrev.addEventListener('click', function(e){ e.preventDefault(); pause(); prev(); });
    if(btnNext) btnNext.addEventListener('click', function(e){ e.preventDefault(); pause(); next(); });

    update(); play();
  });
})();