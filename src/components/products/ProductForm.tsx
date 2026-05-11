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
  name: z.string().min(1, "Nome obrigatório"),
  description: z.string().optional(),
  category: z.string().optional(),
  printHours: z.coerce.number().min(0).default(0),
  printMinutes: z.coerce.number().min(0).max(59, "Máximo 59 min").default(0),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  overhead: z.coerce.number().min(0).default(0),
});

type FormData = z.infer<typeof schema>;

interface MaterialItem {
  materialId: string;
  materialName: string;
  costPerUnit: number;
  unit: string;
  quantity: number;
}

interface RawMaterial {
  id: string;
  name: string;
  costPerUnit: number;
  unit: string;
  type: string;
}

interface Props {
  defaultValues?: Partial<FormData> & { id?: string; printTimeHours?: number };
  defaultMaterials?: MaterialItem[];
}

export function ProductForm({ defaultValues, defaultMaterials = [] }: Props) {
  const router = useRouter();
  const isEdit = !!defaultValues?.id;
  const [materials, setMaterials] = useState<MaterialItem[]>(defaultMaterials);
  const [availableMaterials, setAvailableMaterials] = useState<RawMaterial[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [selectedQty, setSelectedQty] = useState(""); // quantidade em unidade de exibição

  // Para materiais em kg/L, exibe em g/ml e converte na hora de salvar
  function getDisplayUnit(unit: string): { displayUnit: string; factor: number } {
    if (unit === "kg") return { displayUnit: "g", factor: 0.001 };
    if (unit === "L") return { displayUnit: "ml", factor: 0.001 };
    return { displayUnit: unit, factor: 1 };
  }

  const selectedMaterial = availableMaterials.find((m) => m.id === selectedMaterialId);
  const { displayUnit, factor } = getDisplayUnit(selectedMaterial?.unit ?? "");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData, unknown, FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      status: "ACTIVE",
      overhead: 0,
      printHours: defaultValues?.printTimeHours != null ? Math.floor(defaultValues.printTimeHours) : 0,
      printMinutes: defaultValues?.printTimeHours != null ? Math.round((defaultValues.printTimeHours % 1) * 60) : 0,
      ...defaultValues,
    },
  });

  const overhead = watch("overhead") || 0;

  useEffect(() => {
    fetch("/api/materials")
      .then((r) => r.json())
      .then(setAvailableMaterials);
  }, []);

  const baseCost =
    materials.reduce((s, m) => s + m.costPerUnit * m.quantity, 0) + Number(overhead);

  function addMaterial() {
    const mat = availableMaterials.find((m) => m.id === selectedMaterialId);
    if (!mat) return;
    const displayQty = parseFloat(selectedQty);
    if (!displayQty || displayQty <= 0) return;
    const { factor } = getDisplayUnit(mat.unit);
    const qty = displayQty * factor; // converte para a unidade base do material
    setMaterials((prev) => {
      const existing = prev.find((m) => m.materialId === mat.id);
      if (existing) {
        return prev.map((m) =>
          m.materialId === mat.id ? { ...m, quantity: m.quantity + qty } : m
        );
      }
      return [
        ...prev,
        {
          materialId: mat.id,
          materialName: mat.name,
          costPerUnit: mat.costPerUnit,
          unit: mat.unit,
          quantity: qty,
        },
      ];
    });
    setSelectedMaterialId("");
    setSelectedQty("");
  }

  function removeMaterial(materialId: string) {
    setMaterials((prev) => prev.filter((m) => m.materialId !== materialId));
  }

  async function onSubmit(data: FormData) {
    const url = isEdit ? `/api/products/${defaultValues!.id}` : "/api/products";
    const method = isEdit ? "PUT" : "POST";

    const printTimeHours = (data.printHours || 0) + (data.printMinutes || 0) / 60;
    if (printTimeHours <= 0) {
      toast.error("Informe o tempo de impressão.");
      return;
    }

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        description: data.description,
        category: data.category,
        printTimeHours,
        status: data.status,
        overhead: data.overhead,
        materials: materials.map(({ materialId, quantity }) => ({ materialId, quantity })),
      }),
    });

    if (res.ok) {
      toast.success(isEdit ? "Produto atualizado!" : "Produto criado!");
      router.refresh();
      router.push("/products");
    } else {
      const err = await res.json();
      toast.error(err.error?.message ?? "Erro ao salvar.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1.5">
          <Label className="text-zinc-300">Nome *</Label>
          <Input
            {...register("name")}
            placeholder="Ex: Miniatura Dragão"
            className="bg-zinc-800 border-zinc-700 text-zinc-100"
          />
          {errors.name && <p className="text-red-400 text-xs">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label className="text-zinc-300">Categoria</Label>
          <Input
            {...register("category")}
            placeholder="Ex: Miniaturas, Decoração..."
            className="bg-zinc-800 border-zinc-700 text-zinc-100"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-zinc-300">Status</Label>
          <NativeSelect
            {...register("status")}
            className="bg-zinc-800 border-zinc-700 text-zinc-100"
          >
            <option value="ACTIVE">Ativo</option>
            <option value="INACTIVE">Inativo</option>
          </NativeSelect>
        </div>

        <div className="space-y-1.5">
          <Label className="text-zinc-300">Tempo de impressão *</Label>
          <div className="flex gap-2 items-center">
            <div className="flex items-center gap-1.5 flex-1">
              <Input
                {...register("printHours")}
                type="number"
                min="0"
                step="1"
                placeholder="0"
                className="bg-zinc-800 border-zinc-700 text-zinc-100 w-20 text-center"
              />
              <span className="text-zinc-400 text-sm shrink-0">h</span>
            </div>
            <div className="flex items-center gap-1.5 flex-1">
              <Input
                {...register("printMinutes")}
                type="number"
                min="0"
                max="59"
                step="1"
                placeholder="0"
                className="bg-zinc-800 border-zinc-700 text-zinc-100 w-20 text-center"
              />
              <span className="text-zinc-400 text-sm shrink-0">min</span>
            </div>
          </div>
          {errors.printMinutes && (
            <p className="text-red-400 text-xs">{errors.printMinutes.message as string}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-zinc-300">Overhead por unidade (R$)</Label>
          <Input
            {...register("overhead")}
            type="number"
            step="0.01"
            placeholder="Ex: energia, desgaste"
            className="bg-zinc-800 border-zinc-700 text-zinc-100"
          />
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label className="text-zinc-300">Descrição</Label>
          <Textarea
            {...register("description")}
            placeholder="Descrição do produto..."
            className="bg-zinc-800 border-zinc-700 text-zinc-100 resize-none"
            rows={3}
          />
        </div>
      </div>

      {/* Composition */}
      <div className="space-y-3 border border-zinc-800 rounded-lg p-4">
        <h3 className="text-zinc-100 font-medium">Composição de materiais</h3>

        <div className="flex gap-2">
          <NativeSelect
            value={selectedMaterialId}
            onChange={(e) => { setSelectedMaterialId(e.target.value); setSelectedQty(""); }}
            className="bg-zinc-800 border-zinc-700 text-zinc-100 flex-1"
            placeholder="Selecionar material"
          >
            {availableMaterials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({formatCurrency(m.costPerUnit)}/{m.unit})
              </option>
            ))}
          </NativeSelect>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              step="any"
              min="0"
              value={selectedQty}
              onChange={(e) => setSelectedQty(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-zinc-100 w-24"
              placeholder="Qtd"
            />
            {selectedMaterial && (
              <span className="text-zinc-400 text-xs shrink-0 w-6">{displayUnit}</span>
            )}
          </div>
          <Button
            type="button"
            onClick={addMaterial}
            disabled={!selectedMaterialId || !selectedQty}
            className="bg-zinc-700 hover:bg-zinc-600 text-zinc-100"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {materials.length > 0 && (
          <div className="space-y-2 mt-2">
            {materials.map((m) => (
              <div
                key={m.materialId}
                className="flex items-center justify-between bg-zinc-800 rounded px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-zinc-200 text-sm">{m.materialName}</span>
                  <Badge variant="outline" className="border-zinc-600 text-zinc-400 text-xs">
                    {(() => {
                      const { displayUnit, factor } = getDisplayUnit(m.unit);
                      const displayQty = m.quantity / factor;
                      return `${Number.isInteger(displayQty) ? displayQty : displayQty.toFixed(1)} ${displayUnit}`;
                    })()}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-zinc-400 text-sm">
                    {formatCurrency(m.costPerUnit * m.quantity)}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeMaterial(m.materialId)}
                    className="text-zinc-500 hover:text-red-400 h-6 w-6 p-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
          <span className="text-zinc-400 text-sm">Custo base estimado:</span>
          <span className="text-orange-400 font-semibold">{formatCurrency(baseCost)}</span>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/products")}
          className="text-zinc-400"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          {isSubmitting ? "Salvando..." : isEdit ? "Salvar alterações" : "Criar produto"}
        </Button>
      </div>
    </form>
  );
}
