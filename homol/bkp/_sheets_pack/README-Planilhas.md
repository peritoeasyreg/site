# Integração Google Planilhas → Catálogo estático (JSON) + Revalidação de Preço

Este pacote entrega:
- **Modelo de Planilha** (`Produtos-modelo.csv`) para criar sua planilha no Google.
- **Script Node** (`scripts/export-products.js`) que lê a aba "Produtos" e gera `data/products.json` + `data/price-map.json`.
- **GitHub Action** (`.github/workflows/sheets-to-json.yml`) para rodar diariamente e manualmente.
- **Function Cloudflare** (`functions/api/mp/create_preference.js`) que **revalida preço no servidor** a partir do JSON estático.
- **cart.js** atualizado para enviar `id` e `quantity` no checkout.

## Passo a passo

### 1) Crie a Planilha
- Faça upload de `Produtos-modelo.csv` para o Google Sheets e renomeie a aba para **Produtos**.
- Mantenha as colunas: id, sku, title, brand, price, stock, category, images, url, search.
- Se `images` tiver múltiplas, separe por vírgula. O script usará a primeira como `image`.

### 2) Crie uma Service Account no Google Cloud
- Ative a API **Google Sheets**.
- Crie uma **Service Account** e gere uma chave **JSON**.
- Compartilhe a planilha com o e-mail da Service Account **como Leitor**.
- Copie o conteúdo do JSON (inteiro).

### 3) Configure o repositório (GitHub)
- Copie este pacote para a raiz do seu projeto (mantenha paths).
- Faça commit.
- Em **Settings → Secrets and variables → Actions → New repository secret**:
  - `GOOGLE_SERVICE_ACCOUNT_JSON` = conteúdo JSON da chave (cole o JSON completo).
  - `SHEET_ID` = ID da planilha (da URL).
  - (Opcional) `SHEET_RANGE` (padrão: `Produtos!A2:J`).
- Rode o workflow manualmente (Actions → *Exportar produtos do Google Sheets* → *Run workflow*) ou aguarde o agendamento diário.

> O workflow vai atualizar `data/products.json` e `data/price-map.json` e commitar as mudanças.

### 4) Cloudflare Pages
- Garanta que seu projeto publica a pasta com `data/` (onde está `products.json`).
- Na Function `functions/api/mp/create_preference.js`:
  - Ela fará **fetch** de `https://SEU_DOMINIO/data/price-map.json` (ou `products.json`) e **revalidará** o preço.
- Defina a env var `MP_ACCESS_TOKEN` no Cloudflare Pages.

### 5) Frontend (carrinho)
- Substitua seu `assets/js/cart.js` por este (ou adapte a parte do `checkout()` para enviar `id` e `quantity`).
- Seus botões **não precisam mudar de layout**, apenas adicione atributos:
  ```html
  <button data-add-to-cart data-id="ID-UNICO" data-title="Nome" data-price="199.90">Adicionar</button>
  ```
- Tenha um container `#cart-box` e um botão `data-checkout` na página do carrinho.

### 6) Antifraude (revalidação)
- O cliente **não** envia preço.
- O servidor busca o preço **oficial** do JSON gerado pela planilha e **ignora** qualquer manipulação no browser.

---

Dica: Se quiser evitar depender de URL exata no Cloudflare, mantenha `data/products.json` e `data/price-map.json` no mesmo projeto do Pages (o código já usa `new URL(req.url).origin`).

2025-09-09 12:32:30