/**
 * scripts/export-products.js
 * Lê a planilha "Produtos" do Google Sheets e gera data/products.json
 * Requer as variáveis de ambiente:
 *   - GOOGLE_SERVICE_ACCOUNT_JSON (conteúdo JSON da Service Account)
 *   - SHEET_ID (ID da planilha)
 * Opcional:
 *   - SHEET_RANGE (padrão: 'Produtos!A2:J')
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { google } from "googleapis";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function coerceNumber(x) {
  const n = Number(String(x).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function normalizeRow(headers, r) {
  const o = Object.fromEntries(headers.map((h, i) => [h, (r[i] ?? "").toString().trim()]));
  // Ajeitar tipos
  if (o.price !== undefined) o.price = coerceNumber(o.price);
  if (o.stock !== undefined) o.stock = Number.parseInt(o.stock || "0", 10);
  if (o.images) {
    o.images = o.images.split(",").map(s => s.trim()).filter(Boolean);
    // imagem principal (compat com temas existentes)
    o.image = o.images[0] || "";
  } else {
    o.images = [];
  }
  if (o.search) {
    o.search = o.search.split(",").map(s => s.trim()).filter(Boolean);
  } else {
    o.search = [];
  }
  return o;
}

async function main() {
  const serviceJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const sheetId = process.env.SHEET_ID;
  const range = process.env.SHEET_RANGE || "Produtos!A2:J";

  if (!serviceJson || !sheetId) {
    console.error("Faltam variáveis de ambiente: GOOGLE_SERVICE_ACCOUNT_JSON e/ou SHEET_ID.");
    process.exit(1);
  }

  let credentials;
  try {
    credentials = JSON.parse(serviceJson);
  } catch (e) {
    console.error("GOOGLE_SERVICE_ACCOUNT_JSON inválido:", e.message);
    process.exit(1);
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  const sheets = google.sheets({ version: "v4", auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range,
  });

  const rows = res.data.values || [];
  const headers = ["id","sku","title","brand","price","stock","category","images","url","search"];

  const products = rows
    .filter(r => r.length && r[0]) // requer id
    .map(r => normalizeRow(headers, r));

  const outDir = path.join(__dirname, "..", "data");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, "products.json");
  fs.writeFileSync(outFile, JSON.stringify(products, null, 2), "utf-8");

  // Também gerar um mapa id->preço para o backend revalidar
  const priceMap = Object.fromEntries(products.map(p => [p.id, Number(p.price || 0)]));
  fs.writeFileSync(path.join(outDir, "price-map.json"), JSON.stringify(priceMap, null, 2), "utf-8");

  console.log(`Exportados ${products.length} produtos para data/products.json e data/price-map.json`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});