import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const materialSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  supplier: z.string().optional(),
  costPerUnit: z.number().positive(),
  unit: z.string().min(1),
  stockQuantity: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export async function GET() {
  const materials = await db.rawMaterial.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(materials);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = materialSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const material = await db.rawMaterial.create({ data: parsed.data });
  return NextResponse.json(material, { status: 201 });
}
