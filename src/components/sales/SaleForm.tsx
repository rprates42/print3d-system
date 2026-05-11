"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

const schema = z.object({
  channel: z.enum(["SHOPEE", "MERCADO_LIVRE", "ETSY", "SITE", "OTHER"]),
  saleDate: z.string().optional(),
  notes: z.string().optional(),
  logisticsCost: z.coerce.number().min(0).default(0),
});

type FormData = z.infer<typeof schema>;

interface SaleItemEntry {
  productId: string;
  productName: string;
  baseCost: number;
  quantity: number;
  unitPrice: number;
}

interface ProductOption {
  id: string;
  name: string;
  baseCost: number;
}

export function SaleForm() {
  const router = useRouter();
  const [items, setItems] = useState<SaleItemEntry[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedQty, setSelectedQty] = useState("1");
  const [selectedPrice, setSelectedPrice] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = useForm<FormData, unknown, FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: { logisticsCost: 0, channel: "SHOPEE" },
  });

  const logisticsCost = watch("logisticsCost") || 0;

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) =>
        setProducts(
          data.map((p: { id: string; name: string; baseCost: number }) => ({
            id: p.id,
            name: p.name,
            baseCost: p.baseCost,
          }))
        )
      );
  }, []);

  function addItem() {
    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;
    const qty = parseInt(selectedQty);
    const price = parseFloat(selectedPrice);
    if (!qty || qty <= 0 || !price || price <= 0) {
      toast.error("Informe quantidade e preço válidos.");
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        productId: product.id,
        productName: product.name,
        baseCost: product.baseCost,
        quantity: qty,
        unitPrice: price,
      },
    ]);
    setSelectedProductId("");
    setSelectedQty("1");
    setSelectedPrice("");
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  const totalRevenue = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const totalCost =
    items.reduce((s, i) => s + i.baseCost * i.quantity, 0) + Number(logisticsCost);
  const totalProfit = totalRevenue - totalCost;
  const margin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  async function onSubmit(data: FormData) {
    if (items.length === 0) {
      toast.error("Adicione pelo menos um produto.");
      return;
    }

    const res = await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        items: items.map(({ productId, quantity, unitPrice }) => ({
          productId,
          quantity,
          unitPrice,
        })),
      }),
    });

    if (res.ok) {
      toast.success("Venda registrada!");
      router.refresh();
      router.push("/sales");
    } else {
      toast.error("Erro ao registrar venda.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-zinc-300">Canal de venda *</Label>
          <NativeSelect
            {...register("channel")}
            className="bg-zinc-800 border-zinc-700 text-zinc-100"
          >
            <option value="SHOPEE">Shopee</option>
            <option value="MERCADO_LIVRE">Mercado Livre</option>
            <option value="ETSY">Etsy</option>
            <option value="SITE">Site próprio</option>
            <option value="OTHER">Outro</option>
          </NativeSelect>
        </div>

        <div className="space-y-1.5">
          <Label className="text-zinc-300">Data da venda</Label>
          <Input
            {...register("saleDate")}
            type="date"
            className="bg-zinc-800 border-zinc-700 text-zinc-100"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-zinc-300">Custo de frete (R$)</Label>
          <Input
            {...register("logisticsCost")}
            type="number"
            step="0.01"
            placeholder="0.00"
            className="bg-zinc-800 border-zinc-700 text-zinc-100"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-zinc-300">Observações</Label>
          <Textarea
            {...register("notes")}
            placeholder="Notas..."
            className="bg-zinc-800 border-zinc-700 text-zinc-100 resize-none"
            rows={1}
          />
        </div>
      </div>

      {/* Items */}
      <div className="space-y-3 border border-zinc-800 rounded-lg p-4">
        <h3 className="text-zinc-100 font-medium">Produtos vendidos</h3>

        <div className="flex gap-2">
          <NativeSelect
            value={selectedProductId}
            onChange={(e) => {
              const v = e.target.value;
              setSelectedProductId(v);
              const p = products.find((p) => p.id === v);
              if (p) setSelectedPrice(p.baseCost.toFixed(2));
            }}
            placeholder="Selecionar produto"
            className="bg-zinc-800 border-zinc-700 text-zinc-100 flex-1"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </NativeSelect>
          <Input
            type="number"
            min="1"
            step="1"
            value={selectedQty}
            onChange={(e) => setSelectedQty(e.target.value)}
            className="bg-zinc-800 border-zinc-700 text-zinc-100 w-20"
            placeholder="Qtd"
          />
          <Input
            type="number"
            step="0.01"
            value={selectedPrice}
            onChange={(e) => setSelectedPrice(e.target.value)}
            className="bg-zinc-800 border-zinc-700 text-zinc-100 w-28"
            placeholder="R$ venda"
          />
          <Button
            type="button"
            onClick={addItem}
            disabled={!selectedProductId}
            className="bg-zinc-700 hover:bg-zinc-600 text-zinc-100"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {items.length > 0 && (
          <div className="space-y-2 mt-2">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between bg-zinc-800 rounded px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-zinc-200 text-sm">{item.productName}</span>
                  <Badge variant="outline" className="border-zinc-600 text-zinc-400 text-xs">
                    ×{item.quantity}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-zinc-400 text-xs">
                    custo: {formatCurrency(item.baseCost * item.quantity)}
                  </span>
                  <span className="text-zinc-100 text-sm font-medium">
                    {formatCurrency(item.unitPrice * item.quantity)}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeItem(idx)}
                    className="text-zinc-500 hover:text-red-400 h-6 w-6 p-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {items.length > 0 && (
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-zinc-800">
            <div className="text-center">
              <p className="text-xs text-zinc-400">Receita</p>
              <p className="text-sm font-semibold text-zinc-100">{formatCurrency(totalRevenue)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-zinc-400">Lucro</p>
              <p className={`text-sm font-semibold ${totalProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {formatCurrency(totalProfit)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-zinc-400">Margem</p>
              <p className={`text-sm font-semibold ${margin >= 30 ? "text-emerald-400" : "text-yellow-400"}`}>
                {margin.toFixed(1)}%
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/sales")}
          className="text-zinc-400"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          {isSubmitting ? "Registrando..." : "Registrar venda"}
        </Button>
      </div>
    </form>
  );
}
