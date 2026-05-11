export const dynamic = "force-dynamic";

import { unstable_noStore as noStore } from "next/cache";
import { db } from "@/lib/db";
import { calcMaterialCost } from "@/lib/calculations";
import { formatCurrency } from "@/lib/formatters";
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
import { Plus, Pencil } from "lucide-react";
import { DeleteProductButton } from "@/components/products/DeleteProductButton";

export default async function ProductsPage() {
  noStore();
  const products = await db.product.findMany({
    orderBy: { name: "asc" },
    include: {
      materials: { include: { material: true } },
      _count: { select: { saleItems: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Portfólio de Produtos</h1>
          <p className="text-zinc-400 text-sm mt-1">{products.length} produtos cadastrados</p>
        </div>
        <Link href="/products/new">
          <Button className="bg-orange-500 hover:bg-orange-600 text-white">
            <Plus className="h-4 w-4 mr-2" /> Novo Produto
          </Button>
        </Link>
      </div>

      <div className="rounded-lg border border-zinc-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-zinc-900">
              <TableHead className="text-zinc-400">Nome</TableHead>
              <TableHead className="text-zinc-400">Categoria</TableHead>
              <TableHead className="text-zinc-400">Impressão</TableHead>
              <TableHead className="text-zinc-400">Custo Base</TableHead>
              <TableHead className="text-zinc-400">Vendas</TableHead>
              <TableHead className="text-zinc-400">Status</TableHead>
              <TableHead className="text-zinc-400 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-zinc-500 py-12">
                  Nenhum produto cadastrado. Clique em &quot;Novo Produto&quot; para começar.
                </TableCell>
              </TableRow>
            ) : (
              products.map((p) => {
                const baseCost =
                  calcMaterialCost(
                    p.materials.map((pm) => ({
                      costPerUnit: pm.material.costPerUnit,
                      quantity: pm.quantity,
                    }))
                  ) + p.overhead;

                return (
                  <TableRow key={p.id} className="border-zinc-800 hover:bg-zinc-900">
                    <TableCell className="text-zinc-100 font-medium">{p.name}</TableCell>
                    <TableCell className="text-zinc-400">{p.category ?? "—"}</TableCell>
                    <TableCell className="text-zinc-400">{p.printTimeHours}h</TableCell>
                    <TableCell className="text-orange-400 font-medium">
                      {formatCurrency(baseCost)}
                    </TableCell>
                    <TableCell className="text-zinc-400">{p._count.saleItems}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          p.status === "ACTIVE"
                            ? "border-emerald-700 text-emerald-400"
                            : "border-zinc-700 text-zinc-500"
                        }
                      >
                        {p.status === "ACTIVE" ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/products/${p.id}`}>
                          <Button size="sm" variant="ghost" className="text-zinc-400 hover:text-zinc-100">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <DeleteProductButton id={p.id} name={p.name} />
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
