"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { toast } from "sonner";

const schema = z.object({
  description: z.string().min(1, "Descrição obrigatória"),
  type: z.enum(["FIXED", "VARIABLE"]),
  amount: z.coerce.number().positive("Valor deve ser positivo"),
  referenceMonth: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function LogisticsForm() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData, unknown, FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: { type: "VARIABLE" },
  });

  async function onSubmit(data: FormData) {
    const res = await fetch("/api/logistics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      toast.success("Custo registrado!");
      router.push("/logistics");
      router.refresh();
    } else {
      toast.error("Erro ao registrar custo.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5 max-w-lg">
      <div className="space-y-1.5">
        <Label className="text-zinc-300">Descrição *</Label>
        <Input
          {...register("description")}
          placeholder="Ex: Embalagem padrão, Correios..."
          className="bg-zinc-800 border-zinc-700 text-zinc-100"
        />
        {errors.description && <p className="text-red-400 text-xs">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-zinc-300">Tipo *</Label>
          <NativeSelect
            {...register("type")}
            className="bg-zinc-800 border-zinc-700 text-zinc-100"
          >
            <option value="VARIABLE">Variável (por pedido)</option>
            <option value="FIXED">Fixo (mensal)</option>
          </NativeSelect>
        </div>

        <div className="space-y-1.5">
          <Label className="text-zinc-300">Valor (R$) *</Label>
          <Input
            {...register("amount")}
            type="number"
            step="0.01"
            placeholder="0.00"
            className="bg-zinc-800 border-zinc-700 text-zinc-100"
          />
          {errors.amount && <p className="text-red-400 text-xs">{errors.amount.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-zinc-300">Mês de referência (para custos fixos)</Label>
        <Input
          {...register("referenceMonth")}
          type="month"
          className="bg-zinc-800 border-zinc-700 text-zinc-100"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/logistics")}
          className="text-zinc-400"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          {isSubmitting ? "Salvando..." : "Registrar custo"}
        </Button>
      </div>
    </form>
  );
}
