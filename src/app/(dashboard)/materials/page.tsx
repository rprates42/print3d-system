export const dynamic = "force-dynamic";

import { unstable_noStore as noStore } from "next/cache";
import { db } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/formatters";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil } from "lucide-react";
import { DeleteMaterialButton } from "@/components/materials/DeleteMaterialButton";
import { RestockButton } from "@/components/materials/RestockButton";

const TYPE_LABELS: Record<string, string> = {
  PLA: "PLA",
  PETG: "PETG",
  TPU: "TPU",
  RESIN: "Resina",
  OTHER: "Outro",
};

export default async function MaterialsPage() {
  noStore();
  const materials = await db.rawMaterial.findMany({ orderBy: { name: "asc" } });

  const totalValue = materials.reduce((sum, m) => sum + m.costPerUnit * m.stockQuantity, 0);
  const totalStock = materials.reduce((sum, m) => sum + m.stockQuantity, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Matérias-primas</h1>
          <p className="text-zinc-400 text-sm mt-1">{materials.length} materiais cadastrados</p>
        </div>
        <Link href="/materials/new">
          <Button className="bg-orange-500 hover:bg-orange-600 text-white">
            <Plus className="h-4 w-4 mr-2" /> Novo Material
          </Button>
        </Link>
      </div>

      <div className="rounded-lg border border-zinc-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-zinc-900">
              <TableHead className="text-zinc-400">Nome</TableHead>
              <TableHead className="text-zinc-400">Tipo</TableHead>
              <TableHead className="text-zinc-400">Fornecedor</TableHead>
              <TableHead className="text-zinc-400">Custo/unidade</TableHead>
              <TableHead className="text-zinc-400">Estoque</TableHead>
              <TableHead className="text-zinc-400">Valor em estoque</TableHead>
              <TableHead className="text-zinc-400">Cadastrado em</TableHead>
              <TableHead className="text-zinc-400 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {materials.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-zinc-500 py-12">
                  Nenhum material cadastrado. Clique em &quot;Novo Material&quot; para começar.
                </TableCell>
              </TableRow>
            ) : (
              materials.map((m) => (
                <TableRow key={m.id} className="border-zinc-800 hover:bg-zinc-900">
                  <TableCell className="text-zinc-100 font-medium">{m.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-zinc-700 text-zinc-300">
                      {TYPE_LABELS[m.type] ?? m.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-zinc-400">{m.supplier || "—"}</TableCell>
                  <TableCell className="text-zinc-100">
                    {formatCurrency(m.costPerUnit)}/{m.unit}
                  </TableCell>
                  <TableCell className="text-zinc-400">
                    {m.stockQuantity} {m.unit}
                  </TableCell>
                  <TableCell className="text-zinc-100">
                    {formatCurrency(m.costPerUnit * m.stockQuantity)}
                  </TableCell>
                  <TableCell className="text-zinc-400">{formatDate(m.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <RestockButton
                        id={m.id}
                        name={m.name}
                        currentStock={m.stockQuantity}
                        currentCostPerUnit={m.costPerUnit}
                        unit={m.unit}
                      />
                      <Link href={`/materials/${m.id}`}>
                        <Button size="sm" variant="ghost" className="text-zinc-400 hover:text-zinc-100">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      <DeleteMaterialButton id={m.id} name={m.name} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          {materials.length > 0 && (
            <TableFooter className="border-t border-zinc-700 bg-zinc-900">
              <TableRow className="hover:bg-zinc-900">
                <TableCell colSpan={4} className="text-zinc-400 font-medium">
                  Total
                </TableCell>
                <TableCell className="text-zinc-200 font-medium">
                  {totalStock.toLocaleString("pt-BR")} un.
                </TableCell>
                <TableCell className="text-zinc-200 font-medium">
                  {formatCurrency(totalValue)}
                </TableCell>
                <TableCell colSpan={2} />
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    </div>
  );
}
