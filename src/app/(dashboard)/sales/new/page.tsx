import { SaleForm } from "@/components/sales/SaleForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function NewSalePage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/sales"
          className="flex items-center gap-1 text-zinc-400 hover:text-zinc-100 text-sm mb-4"
        >
          <ChevronLeft className="h-4 w-4" /> Vendas
        </Link>
        <h1 className="text-2xl font-bold text-zinc-100">Registrar Venda</h1>
      </div>
      <SaleForm />
    </div>
  );
}
