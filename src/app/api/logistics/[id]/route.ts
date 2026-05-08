import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  description: z.string().min(1).optional(),
  type: z.enum(["FIXED", "VARIABLE"]).optional(),
  amount: z.number().positive().optional(),
  referenceMonth: z.string().optional().nullable(),
});

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
  const cost = await db.logisticsCost.update({ where: { id }, data: parsed.data });
  return NextResponse.json(cost);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.logisticsCost.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
