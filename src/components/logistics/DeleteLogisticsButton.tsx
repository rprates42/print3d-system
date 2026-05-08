"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export function DeleteLogisticsButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    const res = await fetch(`/api/logistics/${id}`, { method: "DELETE" });
    setLoading(false);
    if (res.ok) {
      toast.success("Custo excluído.");
      router.refresh();
    } else {
      toast.error("Erro ao excluir.");
    }
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={handleDelete}
      disabled={loading}
      className="text-zinc-400 hover:text-red-400"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );
}
