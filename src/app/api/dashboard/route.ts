import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calcMargin } from "@/lib/calculations";
import { startOfMonth, endOfMonth, subDays, format } from "date-fns";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const monthParam = searchParams.get("month");

  const now = new Date();
  const start = monthParam
    ? startOfMonth(new Date(monthParam + "-01"))
    : startOfMonth(now);
  const end = monthParam
    ? endOfMonth(new Date(monthParam + "-01"))
    : endOfMonth(now);

  const sales = await db.sale.findMany({
    where: { saleDate: { gte: start, lte: end } },
    include: {
      items: { include: { product: true } },
      logisticsCosts: true,
    },
  });

  let revenue = 0;
  let totalCost = 0;
  const productMap: Record<
    string,
    { name: string; revenue: number; profit: number; units: number }
  > = {};

  for (const sale of sales) {
    const saleLogistics = sale.logisticsCosts.reduce(
      (s, l) => s + l.amount,
      0
    );
    const itemCount = sale.items.reduce((s, i) => s + i.quantity, 0);
    const logisticsPerItem = itemCount > 0 ? saleLogistics / itemCount : 0;

    for (const item of sale.items) {
      const itemRevenue = item.unitPrice * item.quantity;
      const itemCost =
        ((item.unitCostSnapshot ?? 0) + logisticsPerItem) * item.quantity;
      revenue += itemRevenue;
      totalCost += itemCost;

      if (!productMap[item.productId]) {
        productMap[item.productId] = {
          name: item.product.name,
          revenue: 0,
          profit: 0,
          units: 0,
        };
      }
      productMap[item.productId].revenue += itemRevenue;
      productMap[item.productId].profit += itemRevenue - itemCost;
      productMap[item.productId].units += item.quantity;
    }
  }

  const profit = revenue - totalCost;
  const avgMargin = revenue > 0 ? calcMargin(revenue, totalCost) : 0;

  const topProducts = Object.values(productMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map((p) => ({
      ...p,
      margin: p.revenue > 0 ? ((p.profit / p.revenue) * 100).toFixed(1) : "0",
    }));

  // Revenue by day (last 30 days)
  const thirtyDaysAgo = subDays(now, 29);
  const recentSales = await db.sale.findMany({
    where: { saleDate: { gte: thirtyDaysAgo } },
    include: { items: true },
  });

  const revenueByDay: Record<string, number> = {};
  for (let i = 0; i < 30; i++) {
    const d = format(subDays(now, 29 - i), "yyyy-MM-dd");
    revenueByDay[d] = 0;
  }
  for (const sale of recentSales) {
    const day = format(sale.saleDate, "yyyy-MM-dd");
    if (day in revenueByDay) {
      revenueByDay[day] += sale.items.reduce(
        (s, i) => s + i.unitPrice * i.quantity,
        0
      );
    }
  }

  const revenueChart = Object.entries(revenueByDay).map(([date, value]) => ({
    date,
    value,
  }));

  // Total orders this month
  const totalOrders = sales.length;

  return NextResponse.json({
    revenue,
    totalCost,
    profit,
    avgMargin,
    totalOrders,
    topProducts,
    revenueChart,
  });
}
