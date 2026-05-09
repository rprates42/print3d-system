import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Rota de setup único — cria as tabelas no banco de produção.
// Acesse /api/setup?token=SEU_SETUP_TOKEN após o deploy.
// Após usar, adicione SETUP_DONE=true nas env vars da Vercel para desativar.

export async function GET(req: NextRequest) {
  if (process.env.SETUP_DONE === "true") {
    return NextResponse.json({ message: "Setup já foi executado." }, { status: 403 });
  }

  const token = req.nextUrl.searchParams.get("token");
  if (!token || token !== process.env.SETUP_TOKEN) {
    return NextResponse.json({ error: "Token inválido." }, { status: 401 });
  }

  try {
    await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "RawMaterial" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "supplier" TEXT,
      "costPerUnit" REAL NOT NULL,
      "unit" TEXT NOT NULL,
      "stockQuantity" REAL NOT NULL DEFAULT 0,
      "notes" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    )`);

    await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "Product" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "description" TEXT,
      "category" TEXT,
      "printTimeHours" REAL NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'ACTIVE',
      "overhead" REAL NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    )`);

    await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "ProductMaterial" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "productId" TEXT NOT NULL,
      "materialId" TEXT NOT NULL,
      "quantity" REAL NOT NULL,
      CONSTRAINT "ProductMaterial_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "ProductMaterial_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "RawMaterial" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    )`);

    await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "Sale" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "channel" TEXT NOT NULL,
      "saleDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "notes" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    )`);

    await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "LogisticsCost" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "description" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "amount" REAL NOT NULL,
      "referenceMonth" TEXT,
      "saleId" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      CONSTRAINT "LogisticsCost_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale" ("id") ON DELETE SET NULL ON UPDATE CASCADE
    )`);

    await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "SaleItem" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "saleId" TEXT NOT NULL,
      "productId" TEXT NOT NULL,
      "quantity" INTEGER NOT NULL,
      "unitPrice" REAL NOT NULL,
      "unitCostSnapshot" REAL,
      CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "SaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    )`);

    await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "ProductListing" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "productId" TEXT NOT NULL,
      "channel" TEXT NOT NULL,
      "views" INTEGER NOT NULL DEFAULT 0,
      "clicks" INTEGER NOT NULL DEFAULT 0,
      "periodStart" DATETIME NOT NULL,
      "periodEnd" DATETIME NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      CONSTRAINT "ProductListing_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`);

    await db.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "ProductMaterial_productId_materialId_key" ON "ProductMaterial"("productId", "materialId")`);
    await db.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "ProductListing_productId_channel_periodStart_key" ON "ProductListing"("productId", "channel", "periodStart")`);

    return NextResponse.json({ ok: true, message: "Tabelas criadas com sucesso! Adicione SETUP_DONE=true nas variáveis da Vercel." });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
