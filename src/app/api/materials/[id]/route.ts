import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.string().min(1).optional(),
  supplier: z.string().optional().nullable(),
  costPerUnit: z.number().positive().optional(),
  unit: z.string().min(1).optional(),
  stockQuantity: z.number().min(0).optional(),
  notes: z.string().optional().nullable(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const material = await db.rawMaterial.findUnique({ where: { id } });
  if (!material) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(material);
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
  const material = await db.rawMaterial.update({ where: { id }, data: parsed.data });
  return NextResponse.json(material);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = z
    .object({
      quantityAdded: z.number().positive(),
      newCostPerUnit: z.number().positive().optional(),
    })
    .safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const material = await db.rawMaterial.findUnique({ where: { id } });
  if (!material) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const updated = await db.rawMaterial.update({
    where: { id },
    data: {
      stockQuantity: material.stockQuantity + parsed.data.quantityAdded,
      ...(parsed.data.newCostPerUnit !== undefined && {
        costPerUnit: parsed.data.newCostPerUnit,
      }),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const usedBy = await db.productMaterial.findFirst({ where: { materialId: id } });
  if (usedBy) {
    return NextResponse.json(
      { error: "Material está em uso por um produto e não pode ser excluído." },
      { status: 409 }
    );
  }
  await db.rawMaterial.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
