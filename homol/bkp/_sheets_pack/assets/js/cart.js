const CART_KEY='easyreg_cart_v1';
export function loadCart(){ try { return JSON.parse(localStorage.getItem(CART_KEY))||[]; } catch { return []; } }
export function saveCart(c){ localStorage.setItem(CART_KEY, JSON.stringify(c)); }
export function countCart(){ return loadCart().reduce((n,p)=>n+(p.qty||1),0); }
export function announceCart(){ const c=countCart(); document.querySelectorAll('[data-cart-count]').forEach(el=>el.textContent=String(c)); }

export function addToCart(p){
  const cart=loadCart();
  const ix=cart.findIndex(x=>x.id===p.id);
  if(ix>=0){ cart[ix].qty=Math.min((cart[ix].qty||1)+1,5); } else { cart.push({...p, qty:1}); }
  saveCart(cart); announceCart();
}
export function removeFromCart(id){ saveCart(loadCart().filter(x=>x.id!==id)); announceCart(); if(window.renderCart) window.renderCart(); }

export function bindAddToCart(){
  document.querySelectorAll('[data-add-to-cart]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const id=btn.getAttribute('data-id')||btn.dataset.id;
      const title=btn.getAttribute('data-title')||btn.textContent.trim();
      const price=parseFloat(btn.getAttribute('data-price')||'0');
      if(!id) return;
      addToCart({id,title,price});
    });
  });
}

export function bindRemoveButtons(){
  document.querySelectorAll('[data-remove-id]').forEach(btn=>{
    btn.addEventListener('click',()=> removeFromCart(btn.getAttribute('data-remove-id')) );
  });
}

export function renderCartTable(targetSel='#cart-box'){
  const box=document.querySelector(targetSel); if(!box) return;
  const cart=loadCart();
  if(!cart.length){ box.innerHTML='<p>Seu carrinho está vazio.</p>'; return; }
  const brl=n=>Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const total=cart.reduce((s,p)=>s+(p.price*(p.qty||1)),0);
  box.innerHTML = `
    <table class="table">
      <thead><tr><th>Produto</th><th>Qtd</th><th>Preço</th><th></th></tr></thead>
      <tbody>
        ${cart.map(p=>`
          <tr>
            <td>${p.title}</td>
            <td>${p.qty||1}</td>
            <td>${brl(p.price*(p.qty||1))}</td>
            <td><button class="btn" data-remove-id="${p.id}">Remover</button></td>
          </tr>
        `).join('')}
        <tr><td colspan="2" style="text-align:right"><strong>Total</strong></td><td><strong>${brl(total)}</strong></td><td></td></tr>
      </tbody>
    </table>
  `;
  bindRemoveButtons();
}

export async function checkout(endpoint='/api/mp/create_preference'){
  const cart=loadCart();
  if(!cart.length) return alert('Seu carrinho está vazio.');
  // Enviar ID + quantity para o backend revalidar preço com base no catálogo oficial
  const payload={
    items: cart.map(p=>({
      id: p.id,
      title: p.title,
      quantity: p.qty||1
    }))
  };
  const res = await fetch(endpoint,{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)});
  const data = await res.json();
  if(data && data.init_point){ location.href=data.init_point; } else alert('Não foi possível iniciar o pagamento.');
}

export function initCartEnhancements(){
  announceCart();
  bindAddToCart();
  if(document.querySelector('#cart-box')){
    window.renderCart = ()=>renderCartTable('#cart-box');
    renderCartTable('#cart-box');
  }
  document.querySelectorAll('[data-checkout]').forEach(b=> b.addEventListener('click',()=>checkout()) );
}

document.addEventListener('DOMContentLoaded', initCartEnhancements);