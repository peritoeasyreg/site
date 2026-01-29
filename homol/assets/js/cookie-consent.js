(function(){
  const KEY = 'cookie_consent_v1';
  function ready(fn){ if(document.readyState!='loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
  ready(function(){
    if(localStorage.getItem(KEY)) return;
    let b = document.getElementById('cookie-consent');
    if(!b){
      b = document.createElement('div'); b.id='cookie-consent';
      b.innerHTML = '<p>Usamos cookies essenciais para melhorar sua experiência. Ao continuar, você concorda com nossa <a href="./politica-de-privacidade.html" target="_blank" rel="noopener">política de privacidade</a>.</p><div class="actions"><button id="cookie-accept">Aceitar</button><button id="cookie-decline">Recusar</button></div>';
      document.body.appendChild(b);
    }
    b.classList.add('show');
    document.getElementById('cookie-accept').onclick = function(){
      localStorage.setItem(KEY, JSON.stringify({accepted:true, ts: Date.now()}));
      b.remove();
    };
    document.getElementById('cookie-decline').onclick = function(){
      localStorage.setItem(KEY, JSON.stringify({accepted:false, ts: Date.now()}));
      b.remove();
    };
  });
})();