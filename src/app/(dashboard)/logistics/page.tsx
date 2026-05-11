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
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, TrendingDown } from "lucide-react";
import { DeleteLogisticsButton } from "@/components/logistics/DeleteLogisticsButton";

export default async function LogisticsPage() {
  noStore();
  const costs = await db.logisticsCost.findMany({ orderBy: { createdAt: "desc" } });
  const fixed = costs.filter((c) => c.type === "FIXED");
  const variable = costs.filter((c) => c.type === "VARIABLE");
  const totalFixed = fixed.reduce((s, c) => s + c.amount, 0);
  const totalVariable = variable.reduce((s, c) => s + c.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Logística</h1>
          <p className="text-zinc-400 text-sm mt-1">Custos de envio e embalagem</p>
        </div>
        <Link href="/logistics/new">
          <Button className="bg-orange-500 hover:bg-orange-600 text-white">
            <Plus className="h-4 w-4 mr-2" /> Registrar Custo
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">Total Custos Fixos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-zinc-100">{formatCurrency(totalFixed)}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">Total Custos Variáveis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-zinc-100">{formatCurrency(totalVariable)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-lg border border-zinc-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-zinc-900">
              <TableHead className="text-zinc-400">Descrição</TableHead>
              <TableHead className="text-zinc-400">Tipo</TableHead>
              <TableHead className="text-zinc-400">Mês ref.</TableHead>
              <TableHead className="text-zinc-400">Valor</TableHead>
              <TableHead className="text-zinc-400">Data</TableHead>
              <TableHead className="text-zinc-400 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {costs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-zinc-500 py-12">
                  Nenhum custo registrado.
                </TableCell>
              </TableRow>
            ) : (
              costs.map((c) => (
                <TableRow key={c.id} className="border-zinc-800 hover:bg-zinc-900">
                  <TableCell className="text-zinc-100">{c.description}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        c.type === "FIXED"
                          ? "border-blue-700 text-blue-400"
                          : "border-purple-700 text-purple-400"
                      }
                    >
                      {c.type === "FIXED" ? "Fixo" : "Variável"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-zinc-400">{c.referenceMonth ?? "—"}</TableCell>
                  <TableCell className="text-zinc-100 font-medium">
                    {formatCurrency(c.amount)}
                  </TableCell>
                  <TableCell className="text-zinc-400">{formatDate(c.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <DeleteLogisticsButton id={c.id} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
