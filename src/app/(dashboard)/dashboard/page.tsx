import { db } from "@/lib/db";
import { calcMargin } from "@/lib/calculations";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardChart } from "@/components/dashboard/DashboardChart";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  Percent,
} from "lucide-react";
import { startOfMonth, endOfMonth, subDays, format } from "date-fns";

async function getDashboardData() {
  const now = new Date();
  const start = startOfMonth(now);
  const end = endOfMonth(now);

  const sales = await db.sale.findMany({
    where: { saleDate: { gte: start, lte: end } },
    include: { items: true, logisticsCosts: true },
  });

  let revenue = 0;
  let totalCost = 0;
  const productMap: Record<string, { name: string; revenue: number; profit: number; units: number }> = {};

  const products = await db.product.findMany({
    include: { materials: { include: { material: true } } },
  });
  const productCostMap: Record<string, number> = {};
  for (const p of products) {
    productCostMap[p.id] =
      p.materials.reduce((s: number, pm) => s + pm.material.costPerUnit * pm.quantity, 0) + p.overhead;
  }

  for (const sale of sales) {
    const saleLogistics = sale.logisticsCosts.reduce((s: number, l) => s + l.amount, 0);
    const itemCount = sale.items.reduce((s: number, i) => s + i.quantity, 0);
    const logPerItem = itemCount > 0 ? saleLogistics / itemCount : 0;

    for (const item of sale.items) {
      const itemRevenue = item.unitPrice * item.quantity;
      const costSnapshot = item.unitCostSnapshot ?? productCostMap[item.productId] ?? 0;
      const itemCost = (costSnapshot + logPerItem) * item.quantity;
      revenue += itemRevenue;
      totalCost += itemCost;

      const prod = products.find((p) => p.id === item.productId);
      if (prod) {
        if (!productMap[item.productId]) {
          productMap[item.productId] = { name: prod.name, revenue: 0, profit: 0, units: 0 };
        }
        productMap[item.productId].revenue += itemRevenue;
        productMap[item.productId].profit += itemRevenue - itemCost;
        productMap[item.productId].units += item.quantity;
      }
    }
  }

  const profit = revenue - totalCost;
  const avgMargin = revenue > 0 ? calcMargin(revenue, totalCost) : 0;
  const totalOrders = sales.length;

  const topProducts = Object.values(productMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Chart: last 30 days
  const thirtyDaysAgo = subDays(now, 29);
  const recentSales = await db.sale.findMany({
    where: { saleDate: { gte: thirtyDaysAgo } },
    include: { items: true },
  });

  const revenueByDay: Record<string, number> = {};
  for (let i = 0; i < 30; i++) {
    revenueByDay[format(subDays(now, 29 - i), "yyyy-MM-dd")] = 0;
  }
  for (const sale of recentSales) {
    const day = format(sale.saleDate, "yyyy-MM-dd");
    if (day in revenueByDay) {
      revenueByDay[day] += sale.items.reduce((s: number, i) => s + i.unitPrice * i.quantity, 0);
    }
  }

  const revenueChart = Object.entries(revenueByDay).map(([date, value]) => ({ date, value }));

  return { revenue, totalCost, profit, avgMargin, totalOrders, topProducts, revenueChart };
}

export default async function DashboardPage() {
  const { revenue, totalCost, profit, avgMargin, totalOrders, topProducts, revenueChart } =
    await getDashboardData();

  const kpis = [
    {
      title: "Receita (mês)",
      value: formatCurrency(revenue),
      icon: DollarSign,
      color: "text-green-400",
    },
    {
      title: "Lucro (mês)",
      value: formatCurrency(profit),
      icon: profit >= 0 ? TrendingUp : TrendingDown,
      color: profit >= 0 ? "text-emerald-400" : "text-red-400",
    },
    {
      title: "Margem Média",
      value: formatPercent(avgMargin),
      icon: Percent,
      color: avgMargin >= 30 ? "text-emerald-400" : "text-yellow-400",
    },
    {
      title: "Pedidos (mês)",
      value: totalOrders.toString(),
      icon: ShoppingCart,
      color: "text-blue-400",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Dashboard</h1>
        <p className="text-zinc-400 text-sm mt-1">Resumo do mês atual</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ title, value, icon: Icon, color }) => (
          <Card key={title} className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">{title}</CardTitle>
              <Icon className={`h-4 w-4 ${color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100 text-base">Receita — últimos 30 dias</CardTitle>
          </CardHeader>
          <CardContent>
            <DashboardChart data={revenueChart} />
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100 text-base flex items-center gap-2">
              <Package className="h-4 w-4" /> Top Produtos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topProducts.length === 0 ? (
              <p className="text-zinc-500 text-sm">Nenhuma venda registrada.</p>
            ) : (
              topProducts.map((p, i) => (
                <div key={i} className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-200 truncate">{p.name}</p>
                    <p className="text-xs text-zinc-500">{p.units} unid.</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-zinc-100">
                      {formatCurrency(p.revenue)}
                    </p>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        p.profit / p.revenue >= 0.3
                          ? "border-emerald-700 text-emerald-400"
                          : "border-yellow-700 text-yellow-400"
                      }`}
                    >
                      {p.revenue > 0 ? formatPercent((p.profit / p.revenue) * 100) : "0%"}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
