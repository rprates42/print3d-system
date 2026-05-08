import { MaterialForm } from "@/components/materials/MaterialForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function NewMaterialPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/materials"
          className="flex items-center gap-1 text-zinc-400 hover:text-zinc-100 text-sm mb-4"
        >
          <ChevronLeft className="h-4 w-4" /> Matérias-primas
        </Link>
        <h1 className="text-2xl font-bold text-zinc-100">Novo Material</h1>
      </div>
      <MaterialForm />
    </div>
  );
}
