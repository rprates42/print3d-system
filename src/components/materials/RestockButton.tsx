"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PackagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  id: string;
  name: string;
  currentStock: number;
  currentCostPerUnit: number;
  unit: string;
}

function parseBR(val: string) {
  return parseFloat(val.replace(",", "."));
}

export function RestockButton({ id, name, currentStock, currentCostPerUnit, unit }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState(String(currentCostPerUnit).replace(".", ","));
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const quantityAdded = parseBR(quantity);
    const newCostPerUnit = parseBR(price);
    if (isNaN(quantityAdded) || quantityAdded <= 0) {
      toast.error("Informe uma quantidade válida.");
      return;
    }
    if (isNaN(newCostPerUnit) || newCostPerUnit <= 0) {
      toast.error("Informe um preço válido.");
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/materials/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantityAdded, newCostPerUnit }),
    });
    setLoading(false);
    if (res.ok) {
      toast.success("Estoque reposto!");
      setOpen(false);
      router.refresh();
    } else {
      toast.error("Erro ao repor estoque.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" variant="ghost" className="text-zinc-400 hover:text-emerald-400" />
        }
      >
        <PackagePlus className="h-3.5 w-3.5" />
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle>Repor estoque</DialogTitle>
        </DialogHeader>
        <p className="text-zinc-400 text-sm -mt-2">
          {name} — estoque atual: <span className="text-zinc-200">{currentStock} {unit}</span>
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-zinc-300">Quantidade recebida ({unit}) *</Label>
            <Input
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              type="text"
              inputMode="decimal"
              placeholder="0"
              className="bg-zinc-800 border-zinc-700 text-zinc-100"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-zinc-300">Novo custo por {unit} (R$) *</Label>
            <Input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              className="bg-zinc-800 border-zinc-700 text-zinc-100"
            />
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={loading}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {loading ? "Salvando..." : "Confirmar reposição"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
