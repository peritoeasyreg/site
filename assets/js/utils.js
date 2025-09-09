const CONSENT_KEY='cookie_consent_v1';
export function hasConsent(){ try{ return JSON.parse(localStorage.getItem(CONSENT_KEY)||'{}').accepted===true; }catch(e){ return false; } }
export function initCookieBanner(sel='.cookie-banner'){
  const el=document.querySelector(sel); if(!el) return;
  const saved=localStorage.getItem(CONSENT_KEY);
  if(!saved){ el.classList.add('show'); }
  el.querySelector('[data-accept]')?.addEventListener('click',()=>{ localStorage.setItem(CONSENT_KEY, JSON.stringify({accepted:true, ts:Date.now()})); el.classList.remove('show'); window.dispatchEvent(new Event('cookie:accepted')); });
  el.querySelector('[data-decline]')?.addEventListener('click',()=>{ localStorage.setItem(CONSENT_KEY, JSON.stringify({accepted:false, ts:Date.now()})); el.classList.remove('show'); });
}
export function loadPlausibleOnConsent(domain='SEU-DOMINIO'){
  function mount(){ const s=document.createElement('script'); s.defer=true; s.setAttribute('data-domain',domain); s.src='https://plausible.io/js/plausible.js'; document.head.appendChild(s); }
  if(hasConsent()) mount(); else window.addEventListener('cookie:accepted',mount,{once:true});
}