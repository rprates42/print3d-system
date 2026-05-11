export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/formatters";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Eye } from "lucide-react";
import { DeleteSaleButton } from "@/components/sales/DeleteSaleButton";
import { calcMargin } from "@/lib/calculations";

const CHANNEL_LABELS: Record<string, string> = {
  SHOPEE: "Shopee",
  MERCADO_LIVRE: "Mercado Livre",
  ETSY: "Etsy",
  SITE: "Site próprio",
  OTHER: "Outro",
};

export default async function SalesPage() {
  const sales = await db.sale.findMany({
    orderBy: { saleDate: "desc" },
    include: {
      items: { include: { product: true } },
      logisticsCosts: true,
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Vendas</h1>
          <p className="text-zinc-400 text-sm mt-1">{sales.length} vendas registradas</p>
        </div>
        <Link href="/sales/new">
          <Button className="bg-orange-500 hover:bg-orange-600 text-white">
            <Plus className="h-4 w-4 mr-2" /> Registrar Venda
          </Button>
        </Link>
      </div>

      <div className="rounded-lg border border-zinc-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-zinc-900">
              <TableHead className="text-zinc-400">Data</TableHead>
              <TableHead className="text-zinc-400">Canal</TableHead>
              <TableHead className="text-zinc-400">Produtos</TableHead>
              <TableHead className="text-zinc-400">Receita</TableHead>
              <TableHead className="text-zinc-400">Lucro</TableHead>
              <TableHead className="text-zinc-400">Margem</TableHead>
              <TableHead className="text-zinc-400 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-zinc-500 py-12">
                  Nenhuma venda registrada.
                </TableCell>
              </TableRow>
            ) : (
              sales.map((sale) => {
                const revenue = sale.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
                const logistics = sale.logisticsCosts.reduce((s, l) => s + l.amount, 0);
                const cost =
                  sale.items.reduce(
                    (s, i) => s + (i.unitCostSnapshot ?? 0) * i.quantity,
                    0
                  ) + logistics;
                const profit = revenue - cost;
                const margin = calcMargin(revenue, cost);

                return (
                  <TableRow key={sale.id} className="border-zinc-800 hover:bg-zinc-900">
                    <TableCell className="text-zinc-400">{formatDate(sale.saleDate)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-zinc-700 text-zinc-300">
                        {CHANNEL_LABELS[sale.channel] ?? sale.channel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-zinc-400">
                      {sale.items.map((i) => `${i.product.name} (×${i.quantity})`).join(", ")}
                    </TableCell>
                    <TableCell className="text-zinc-100 font-medium">
                      {formatCurrency(revenue)}
                    </TableCell>
                    <TableCell
                      className={profit >= 0 ? "text-emerald-400" : "text-red-400"}
                    >
                      {formatCurrency(profit)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          margin >= 30
                            ? "border-emerald-700 text-emerald-400"
                            : margin >= 15
                            ? "border-yellow-700 text-yellow-400"
                            : "border-red-700 text-red-400"
                        }
                      >
                        {margin.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/sales/${sale.id}`}>
                          <Button size="sm" variant="ghost" className="text-zinc-400 hover:text-zinc-100">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <DeleteSaleButton id={sale.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
