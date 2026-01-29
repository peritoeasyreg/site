(function(){
  function ready(fn){ if(document.readyState!='loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
  ready(function(){
    var el = document.querySelector('[data-visitors]');
    if(!el) return;
    function random(min, max){ return Math.floor(Math.random()*(max-min+1))+min; }
    function update(){
      el.textContent = random(80, 230);
    }
    update();
    setInterval(update, 7000 + Math.floor(Math.random()*5000));
  });
})();