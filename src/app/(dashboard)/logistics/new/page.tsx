import { LogisticsForm } from "@/components/logistics/LogisticsForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function NewLogisticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/logistics"
          className="flex items-center gap-1 text-zinc-400 hover:text-zinc-100 text-sm mb-4"
        >
          <ChevronLeft className="h-4 w-4" /> Logística
        </Link>
        <h1 className="text-2xl font-bold text-zinc-100">Registrar Custo Logístico</h1>
      </div>
      <LogisticsForm />
    </div>
  );
}
