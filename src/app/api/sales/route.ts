import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calcMaterialCost } from "@/lib/calculations";
import { z } from "zod";

const saleSchema = z.object({
  channel: z.enum(["SHOPEE", "MERCADO_LIVRE", "ETSY", "SITE", "OTHER"]),
  saleDate: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().int().positive(),
      unitPrice: z.number().positive(),
    })
  ).min(1),
  logisticsCost: z.number().min(0).optional(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const channel = searchParams.get("channel");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const sales = await db.sale.findMany({
    where: {
      ...(channel && { channel }),
      ...(from || to
        ? {
            saleDate: {
              ...(from && { gte: new Date(from) }),
              ...(to && { lte: new Date(to) }),
            },
          }
        : {}),
    },
    include: {
      items: { include: { product: true } },
      logisticsCosts: true,
    },
    orderBy: { saleDate: "desc" },
  });
  return NextResponse.json(sales);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = saleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { items, logisticsCost, saleDate, ...saleData } = parsed.data;

  const sale = await db.$transaction(async (tx) => {
    const created = await tx.sale.create({
      data: {
        ...saleData,
        ...(saleDate && { saleDate: new Date(saleDate) }),
      },
    });

    for (const item of items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
        include: { materials: { include: { material: true } } },
      });

      const costSnapshot = product
        ? calcMaterialCost(
            product.materials.map((pm) => ({
              costPerUnit: pm.material.costPerUnit,
              quantity: pm.quantity,
            }))
          ) + product.overhead
        : 0;

      await tx.saleItem.create({
        data: {
          saleId: created.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unitCostSnapshot: costSnapshot,
        },
      });
    }

    if (logisticsCost && logisticsCost > 0) {
      await tx.logisticsCost.create({
        data: {
          saleId: created.id,
          description: "Frete da venda",
          type: "VARIABLE",
          amount: logisticsCost,
        },
      });
    }

    return tx.sale.findUnique({
      where: { id: created.id },
      include: { items: { include: { product: true } }, logisticsCosts: true },
    });
  });

  return NextResponse.json(sale, { status: 201 });
}
