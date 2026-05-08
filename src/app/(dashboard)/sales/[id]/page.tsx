import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { calcMargin } from "@/lib/calculations";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronLeft } from "lucide-react";

const CHANNEL_LABELS: Record<string, string> = {
  SHOPEE: "Shopee",
  MERCADO_LIVRE: "Mercado Livre",
  ETSY: "Etsy",
  SITE: "Site próprio",
  OTHER: "Outro",
};

export default async function SaleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sale = await db.sale.findUnique({
    where: { id },
    include: {
      items: { include: { product: true } },
      logisticsCosts: true,
    },
  });
  if (!sale) notFound();

  const revenue = sale.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const logistics = sale.logisticsCosts.reduce((s, l) => s + l.amount, 0);
  const cost = sale.items.reduce((s, i) => s + (i.unitCostSnapshot ?? 0) * i.quantity, 0) + logistics;
  const profit = revenue - cost;
  const margin = calcMargin(revenue, cost);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/sales" className="flex items-center gap-1 text-zinc-400 hover:text-zinc-100 text-sm mb-4">
          <ChevronLeft className="h-4 w-4" /> Vendas
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-zinc-100">Detalhes da Venda</h1>
          <Badge variant="outline" className="border-zinc-700 text-zinc-300">
            {CHANNEL_LABELS[sale.channel] ?? sale.channel}
          </Badge>
        </div>
        <p className="text-zinc-400 text-sm mt-1">{formatDate(sale.saleDate)}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Receita", value: formatCurrency(revenue), color: "text-zinc-100" },
          { label: "Custo total", value: formatCurrency(cost), color: "text-zinc-400" },
          { label: "Lucro", value: formatCurrency(profit), color: profit >= 0 ? "text-emerald-400" : "text-red-400" },
          { label: "Margem", value: `${margin.toFixed(1)}%`, color: margin >= 30 ? "text-emerald-400" : "text-yellow-400" },
        ].map(({ label, value, color }) => (
          <Card key={label} className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-1">
              <CardTitle className="text-xs text-zinc-400">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100 text-base">Itens</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800">
                <TableHead className="text-zinc-400">Produto</TableHead>
                <TableHead className="text-zinc-400">Qtd</TableHead>
                <TableHead className="text-zinc-400">Preço unit.</TableHead>
                <TableHead className="text-zinc-400">Custo unit. (snapshot)</TableHead>
                <TableHead className="text-zinc-400">Lucro unit.</TableHead>
                <TableHead className="text-zinc-400">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sale.items.map((item) => (
                <TableRow key={item.id} className="border-zinc-800">
                  <TableCell className="text-zinc-100">{item.product.name}</TableCell>
                  <TableCell className="text-zinc-400">{item.quantity}</TableCell>
                  <TableCell className="text-zinc-100">{formatCurrency(item.unitPrice)}</TableCell>
                  <TableCell className="text-zinc-400">
                    {formatCurrency(item.unitCostSnapshot ?? 0)}
                  </TableCell>
                  <TableCell className={item.unitPrice - (item.unitCostSnapshot ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}>
                    {formatCurrency(item.unitPrice - (item.unitCostSnapshot ?? 0))}
                  </TableCell>
                  <TableCell className="text-zinc-100 font-medium">
                    {formatCurrency(item.unitPrice * item.quantity)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {sale.notes && (
        <p className="text-zinc-400 text-sm">
          <span className="text-zinc-500">Notas: </span>{sale.notes}
        </p>
      )}
    </div>
  );
}
