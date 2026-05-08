import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calcMaterialCost } from "@/lib/calculations";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  printTimeHours: z.number().positive(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  overhead: z.number().min(0).default(0),
  materials: z.array(
    z.object({
      materialId: z.string(),
      quantity: z.number().positive(),
    })
  ).optional(),
});

export async function GET() {
  const products = await db.product.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      materials: { include: { material: true } },
      _count: { select: { saleItems: true } },
    },
  });

  const withCost = products.map((p) => ({
    ...p,
    baseCost:
      calcMaterialCost(
        p.materials.map((pm) => ({
          costPerUnit: pm.material.costPerUnit,
          quantity: pm.quantity,
        }))
      ) + p.overhead,
  }));

  return NextResponse.json(withCost);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { materials, ...productData } = parsed.data;

  const product = await db.$transaction(async (tx) => {
    const created = await tx.product.create({ data: productData });
    if (materials?.length) {
      await tx.productMaterial.createMany({
        data: materials.map((m) => ({ productId: created.id, ...m })),
      });
    }
    return tx.product.findUnique({
      where: { id: created.id },
      include: { materials: { include: { material: true } } },
    });
  });

  return NextResponse.json(product, { status: 201 });
}
