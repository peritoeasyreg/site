(function(){
  if(window.__cookieBarInit) return; window.__cookieBarInit = true;
  var KEY='cookie_consent_v1';

  function hideLegacyBars(){
    var nodes = document.querySelectorAll('.cookiebar, #cookie-consent, [role="dialog"][aria-label*="cookie" i]');
    nodes.forEach(function(b){
      try{ b.remove(); }catch(e){
        try{ b.style.display='none'; }catch(_){}
        try{ b.classList.remove('show'); }catch(_){}
        try{ b.setAttribute('hidden',''); }catch(_){}
      }
    });
  }

  try{
    if(localStorage.getItem(KEY)){
      document.addEventListener('DOMContentLoaded', hideLegacyBars);
      return;
    }
  }catch(e){}

  // Create lightweight bar only if user has not consented
  var bar=document.createElement('div');
  bar.className='cookiebar';
  bar.innerHTML='<div>Usamos cookies para melhorar sua experiência. <a href="/politica-de-privacidade.html">Saiba mais</a></div><button class="cookiebar__btn" aria-label="Aceitar cookies">Aceitar</button>';

  document.addEventListener('DOMContentLoaded', function(){
    hideLegacyBars();
    // Avoid duplicates
    if(!document.querySelector('.cookiebar')){
      document.body.appendChild(bar);
    }
  });

  bar.addEventListener('click', function(e){
    if(e.target && e.target.matches('.cookiebar__btn')){
      try{ localStorage.setItem(KEY, '1'); }catch(e){}
      hideLegacyBars();
    }
  });
})();