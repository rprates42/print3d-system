import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calcMaterialCost } from "@/lib/calculations";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  printTimeHours: z.number().positive().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  overhead: z.number().min(0).optional(),
  materials: z
    .array(
      z.object({
        materialId: z.string(),
        quantity: z.number().positive(),
      })
    )
    .optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const product = await db.product.findUnique({
    where: { id },
    include: { materials: { include: { material: true } } },
  });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const baseCost =
    calcMaterialCost(
      product.materials.map((pm) => ({
        costPerUnit: pm.material.costPerUnit,
        quantity: pm.quantity,
      }))
    ) + product.overhead;

  return NextResponse.json({ ...product, baseCost });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { materials, ...productData } = parsed.data;

  const product = await db.$transaction(async (tx) => {
    await tx.product.update({ where: { id }, data: productData });

    if (materials !== undefined) {
      await tx.productMaterial.deleteMany({ where: { productId: id } });
      if (materials.length) {
        await tx.productMaterial.createMany({
          data: materials.map((m) => ({ productId: id, ...m })),
        });
      }
    }

    return tx.product.findUnique({
      where: { id },
      include: { materials: { include: { material: true } } },
    });
  });

  return NextResponse.json(product);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.product.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
