import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/products/ProductForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await db.product.findUnique({
    where: { id },
    include: { materials: { include: { material: true } } },
  });
  if (!product) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/products"
          className="flex items-center gap-1 text-zinc-400 hover:text-zinc-100 text-sm mb-4"
        >
          <ChevronLeft className="h-4 w-4" /> Produtos
        </Link>
        <h1 className="text-2xl font-bold text-zinc-100">Editar Produto</h1>
      </div>
      <ProductForm
        defaultValues={{
          id: product.id,
          name: product.name,
          description: product.description ?? undefined,
          category: product.category ?? undefined,
          printTimeHours: product.printTimeHours,
          status: product.status as "ACTIVE" | "INACTIVE",
          overhead: product.overhead,
        }}
        defaultMaterials={product.materials.map((pm) => ({
          materialId: pm.materialId,
          materialName: pm.material.name,
          costPerUnit: pm.material.costPerUnit,
          unit: pm.material.unit,
          quantity: pm.quantity,
        }))}
      />
    </div>
  );
}
