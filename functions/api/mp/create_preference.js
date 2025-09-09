// functions/api/mp/create_preference.js
// Revalida preços a partir do catálogo estático e tem fallback de "modo demo" se não houver token

let PRICE_CACHE = null;
let PRICE_CACHE_TS = 0;
const PRICE_TTL_MS = 5 * 60 * 1000; // 5 min

async function loadPriceMap(origin) {
  const now = Date.now();
  if (PRICE_CACHE && (now - PRICE_CACHE_TS) < PRICE_TTL_MS) return PRICE_CACHE;
  const urls = [`${origin}/data/price-map.json`, `${origin}/data/products.json`];
  for (const url of urls) {
    try {
      const r = await fetch(url, { cf: { cacheTtl: 60, cacheEverything: true } });
      if (r.ok) {
        const data = await r.json();
        const map = Array.isArray(data)
          ? Object.fromEntries(data.map(p => [p.id, Number(p.price || 0)]))
          : Object.fromEntries(Object.entries(data).map(([k, v]) => [k, Number(v || 0)]));
        PRICE_CACHE = map; PRICE_CACHE_TS = now; return map;
      }
    } catch {}
  }
  return {};
}

export default {
  async fetch(req, env) {
    if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
    let body = {}; try { body = await req.json(); } catch { return new Response("Bad Request", { status: 400 }); }

    const origin = new URL(req.url).origin;
    const priceMap = await loadPriceMap(origin);

    const items = Array.isArray(body.items) ? body.items.slice(0, 50) : [];
    if (!items.length) return new Response(JSON.stringify({ error: "empty_items" }), { status: 400, headers: { "Content-Type":"application/json" } });

    // Monta itens "seguros" revalidando preço pelo catálogo
    const safe = [];
    for (const i of items) {
      const id = String(i.id || "").trim();
      const qty = Math.max(1, Math.min(5, parseInt(i.quantity || 1, 10)));
      const serverPrice = priceMap[id];
      if (!id || !Number.isFinite(serverPrice)) continue; // descarta itens desconhecidos
      safe.push({ title: String(i.title || id).slice(0, 120), quantity: qty, unit_price: Number(serverPrice), currency_id: "BRL" });
    }
    if (!safe.length) return new Response(JSON.stringify({ error: "no_valid_items" }), { status: 400, headers: { "Content-Type":"application/json" } });

    const back_urls = {
      success: "https://SEU-DOMINIO/obrigado",
      pending: "https://SEU-DOMINIO/pagamento-pendente",
      failure: "https://SEU-DOMINIO/pagamento-falhou"
    };

    // --- MODO DEMO (sem token ou DEMO_MODE=1) ---
    const isDemo = !env.MP_ACCESS_TOKEN || String(env.DEMO_MODE||'').toLowerCase() === '1';
    if (isDemo) {
      const total = safe.reduce((s,i)=> s + Number(i.unit_price||0) * Number(i.quantity||1), 0);
      const orderId = (typeof crypto!=="undefined" && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).slice(2);
      const sim = new URL("/simulador-checkout/", origin);
      sim.searchParams.set("order_id", orderId);
      sim.searchParams.set("total", total.toFixed(2));
      sim.searchParams.set("success", back_urls.success);
      sim.searchParams.set("pending", back_urls.pending);
      sim.searchParams.set("failure", back_urls.failure);
      return new Response(JSON.stringify({ init_point: sim.toString(), mock:true }), { status: 200, headers: { "Content-Type":"application/json" } });
    }
    // --- FIM DEMO ---

    // Produção: cria preferência no Mercado Pago
    const payload = { items: safe, back_urls, auto_return: "approved", payment_methods: { installments: 6 } };
    const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: { "Authorization": `Bearer ${env.MP_ACCESS_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    return new Response(JSON.stringify({ init_point: data.init_point || data.sandbox_init_point, raw: data }), {
      status: res.status, headers: { "Content-Type":"application/json" }
    });
  }
}
