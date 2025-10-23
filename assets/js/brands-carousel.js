(function(){
  function ready(fn){ if(document.readyState!='loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
  ready(function(){
    // Find target slot for brands
    var slot = document.querySelector('[data-brands-slot]')
            || document.querySelector('section#marcas, section.marcas, .brands-section, section[id*="marca"], section[class*="marca"], section[id*="brand"], section[class*="brand"]');
    if(!slot) return;

    // If markup not present, create it
    var exist = slot.querySelector('[data-brands-carousel]');
    if(!exist){
      var wrap = document.createElement('section');
      wrap.className = 'brands';
      wrap.setAttribute('data-brands-carousel','');
      wrap.style.overflow='hidden'; wrap.style.padding='1rem 0';
      var track = document.createElement('div');
      track.className = 'brands-track';
      track.style.display = 'flex'; track.style.gap = '36px'; track.style.willChange='transform';
      var brands = ["logo_bmw_web","logo_audi_web","logo_byd_web","logo_chevrolet_web","logo_citroen_web","logo_fiat_web","logo_nissan_web","logo_vonnix_web","logo_honda_web","logo_hyundai_web","logo_jeep_web","logo_lexus_web","logo_mercedes_web","logo_peugeot_web","logo_porsche_web","logo_renault_web","logo_toyota_web","logo_volvo_web","logo_vw_volkswagen_web"];
      brands.forEach(function(name){
        var img = document.createElement('img');
        img.src = './assets/img/'+name+'.webp';
        img.alt = name.charAt(0).toUpperCase()+name.slice(1);
        img.height = 30; img.loading = 'lazy';
        track.appendChild(img);
      });
      wrap.appendChild(track);
      slot.appendChild(wrap);
    }

    var wrap = slot.querySelector('[data-brands-carousel]');
    var track = wrap.querySelector('.brands-track');
    if(!track) return;

    var speed = 0.4;
    var paused = false;
    var req;

    function duplicate(){
      var items = Array.prototype.slice.call(track.children);
      items.forEach(function(node){
        track.appendChild(node.cloneNode(true));
      });
    }
    duplicate();

    function step(){
      if(!paused){
        var x = (parseFloat(track.dataset.x||'0') - speed);
        var width = track.scrollWidth/2;
        if(Math.abs(x) >= width) x = 0;
        track.style.transform = 'translateX(' + x + 'px)';
        track.dataset.x = x;
      }
      req = requestAnimationFrame(step);
    }

    wrap.addEventListener('mouseenter', function(){ paused = true; });
    wrap.addEventListener('mouseleave', function(){ paused = false; });
    wrap.addEventListener('focusin', function(){ paused = true; });
    wrap.addEventListener('focusout', function(){ paused = false; });

    step();
  });
})();