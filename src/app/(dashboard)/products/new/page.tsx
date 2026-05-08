import { ProductForm } from "@/components/products/ProductForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/products"
          className="flex items-center gap-1 text-zinc-400 hover:text-zinc-100 text-sm mb-4"
        >
          <ChevronLeft className="h-4 w-4" /> Produtos
        </Link>
        <h1 className="text-2xl font-bold text-zinc-100">Novo Produto</h1>
      </div>
      <ProductForm />
    </div>
  );
}
