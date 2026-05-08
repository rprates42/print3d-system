import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const logisticsSchema = z.object({
  description: z.string().min(1),
  type: z.enum(["FIXED", "VARIABLE"]),
  amount: z.number().positive(),
  referenceMonth: z.string().optional(),
  saleId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const month = searchParams.get("month");

  const costs = await db.logisticsCost.findMany({
    where: {
      ...(type && { type }),
      ...(month && { referenceMonth: month }),
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(costs);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = logisticsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const cost = await db.logisticsCost.create({ data: parsed.data });
  return NextResponse.json(cost, { status: 201 });
}
