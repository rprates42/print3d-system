import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { MaterialForm } from "@/components/materials/MaterialForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function EditMaterialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const material = await db.rawMaterial.findUnique({ where: { id } });
  if (!material) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/materials"
          className="flex items-center gap-1 text-zinc-400 hover:text-zinc-100 text-sm mb-4"
        >
          <ChevronLeft className="h-4 w-4" /> Matérias-primas
        </Link>
        <h1 className="text-2xl font-bold text-zinc-100">Editar Material</h1>
      </div>
      <MaterialForm
        defaultValues={{
          id: material.id,
          name: material.name,
          type: material.type,
          supplier: material.supplier ?? undefined,
          costPerUnit: material.costPerUnit,
          unit: material.unit,
          stockQuantity: material.stockQuantity,
          notes: material.notes ?? undefined,
        }}
      />
    </div>
  );
}
