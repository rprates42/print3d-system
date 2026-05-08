"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

function parseBRNumber(val: string | undefined) {
  if (!val || val.trim() === "") return NaN;
  return parseFloat(val.replace(",", "."));
}

const schema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  type: z.string().min(1, "Tipo obrigatório"),
  supplier: z.string().optional(),
  costPerUnit: z
    .string()
    .min(1, "Custo obrigatório")
    .transform(parseBRNumber)
    .pipe(z.number().positive("Custo deve ser positivo")),
  unit: z.string().min(1, "Unidade obrigatória"),
  stockQuantity: z
    .string()
    .optional()
    .transform((v) => (v ? parseBRNumber(v) : 0))
    .pipe(z.number().min(0)),
  notes: z.string().optional(),
});

type FormInput = {
  name: string;
  type: string;
  supplier?: string;
  costPerUnit: string;
  unit: string;
  stockQuantity?: string;
  notes?: string;
};

interface Props {
  defaultValues?: {
    id?: string;
    name?: string;
    type?: string;
    supplier?: string | null;
    costPerUnit?: number;
    unit?: string;
    stockQuantity?: number;
    notes?: string | null;
  };
}

export function MaterialForm({ defaultValues }: Props) {
  const router = useRouter();
  const isEdit = !!defaultValues?.id;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      name: defaultValues?.name ?? "",
      type: defaultValues?.type ?? "",
      supplier: defaultValues?.supplier ?? "",
      costPerUnit: defaultValues?.costPerUnit != null
        ? String(defaultValues.costPerUnit).replace(".", ",")
        : "",
      unit: defaultValues?.unit ?? "",
      stockQuantity: defaultValues?.stockQuantity != null
        ? String(defaultValues.stockQuantity)
        : "",
      notes: defaultValues?.notes ?? "",
    },
  });

  async function onSubmit(data: FormInput) {
    const url = isEdit ? `/api/materials/${defaultValues!.id}` : "/api/materials";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      toast.success(isEdit ? "Material atualizado!" : "Material criado!");
      router.push("/materials");
      router.refresh();
    } else {
      const err = await res.json();
      toast.error(err.error?.message ?? "Erro ao salvar.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5 max-w-lg">
      <div className="space-y-1.5">
        <Label className="text-zinc-300">Nome *</Label>
        <Input
          {...register("name")}
          placeholder="Ex: PLA Branco 1kg"
          className="bg-zinc-800 border-zinc-700 text-zinc-100"
        />
        {errors.name && <p className="text-red-400 text-xs">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-zinc-300">Tipo *</Label>
          <NativeSelect
            {...register("type")}
            placeholder="Selecionar"
            className="bg-zinc-800 border-zinc-700 text-zinc-100"
          >
            <option value="PLA">PLA</option>
            <option value="PETG">PETG</option>
            <option value="TPU">TPU</option>
            <option value="RESIN">Resina</option>
            <option value="OTHER">Outro</option>
          </NativeSelect>
          {errors.type && <p className="text-red-400 text-xs">{errors.type.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label className="text-zinc-300">Unidade *</Label>
          <NativeSelect
            {...register("unit")}
            placeholder="Selecionar"
            className="bg-zinc-800 border-zinc-700 text-zinc-100"
          >
            <option value="g">g</option>
            <option value="kg">kg</option>
            <option value="ml">ml</option>
            <option value="L">L</option>
            <option value="unit">unidade</option>
          </NativeSelect>
          {errors.unit && <p className="text-red-400 text-xs">{errors.unit.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-zinc-300">Custo por unidade (R$) *</Label>
          <Input
            {...register("costPerUnit")}
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            className="bg-zinc-800 border-zinc-700 text-zinc-100"
          />
          {errors.costPerUnit && (
            <p className="text-red-400 text-xs">{errors.costPerUnit.message as string}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-zinc-300">Estoque atual</Label>
          <Input
            {...register("stockQuantity")}
            type="text"
            inputMode="decimal"
            placeholder="0"
            className="bg-zinc-800 border-zinc-700 text-zinc-100"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-zinc-300">Fornecedor</Label>
        <Input
          {...register("supplier")}
          placeholder="Ex: Bambu Lab, Amazon..."
          className="bg-zinc-800 border-zinc-700 text-zinc-100"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-zinc-300">Observações</Label>
        <Textarea
          {...register("notes")}
          placeholder="Notas adicionais..."
          className="bg-zinc-800 border-zinc-700 text-zinc-100 resize-none"
          rows={3}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/materials")}
          className="text-zinc-400"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          {isSubmitting ? "Salvando..." : isEdit ? "Salvar alterações" : "Criar material"}
        </Button>
      </div>
    </form>
  );
}
