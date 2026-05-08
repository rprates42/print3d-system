"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { calcSuggestedPrice, calcMargin, calcBreakEven } from "@/lib/calculations";

interface Product {
  id: string;
  name: string;
  baseCost: number;
}

export function PriceCalculator() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [baseCost, setBaseCost] = useState(0);
  const [avgLogistics, setAvgLogistics] = useState(0);
  const [targetMargin, setTargetMargin] = useState(40);
  const [salePrice, setSalePrice] = useState(0);
  const [fixedCosts, setFixedCosts] = useState(0);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => {
        setProducts(data.map((p: { id: string; name: string; baseCost: number }) => p));
      });
  }, []);

  useEffect(() => {
    if (selectedProductId) {
      const p = products.find((p) => p.id === selectedProductId);
      if (p) setBaseCost(p.baseCost);
    }
  }, [selectedProductId, products]);

  const totalCost = baseCost + avgLogistics;
  const suggestedPrice = totalCost > 0 ? calcSuggestedPrice(totalCost, targetMargin) : 0;
  const effectiveMargin = salePrice > 0 ? calcMargin(salePrice, totalCost) : 0;
  const breakEven = fixedCosts > 0 && salePrice > totalCost
    ? calcBreakEven(fixedCosts, salePrice, totalCost)
    : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input panel */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Parâmetros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <Label className="text-zinc-300">Produto (opcional)</Label>
            <Select value={selectedProductId} onValueChange={(v) => v && setSelectedProductId(v)}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                <SelectValue placeholder="Selecionar ou preencher manualmente" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-zinc-100">
                    {p.name} ({formatCurrency(p.baseCost)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-zinc-300">Custo base (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={baseCost || ""}
                onChange={(e) => setBaseCost(parseFloat(e.target.value) || 0)}
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-zinc-300">Custo logística (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={avgLogistics || ""}
                onChange={(e) => setAvgLogistics(parseFloat(e.target.value) || 0)}
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
                placeholder="0.00"
              />
            </div>
          </div>

          <Separator className="bg-zinc-800" />

          <div className="space-y-1.5">
            <Label className="text-zinc-300">
              Margem desejada: <span className="text-orange-400">{targetMargin}%</span>
            </Label>
            <input
              type="range"
              min={1}
              max={95}
              step={1}
              value={targetMargin}
              onChange={(e) => setTargetMargin(parseInt(e.target.value))}
              className="w-full accent-orange-500"
            />
          </div>

          <Separator className="bg-zinc-800" />

          <div className="space-y-1.5">
            <Label className="text-zinc-300">Verificar preço real (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={salePrice || ""}
              onChange={(e) => setSalePrice(parseFloat(e.target.value) || 0)}
              className="bg-zinc-800 border-zinc-700 text-zinc-100"
              placeholder="Preço que você cobra"
            />
          </div>

          <Separator className="bg-zinc-800" />

          <div className="space-y-1.5">
            <Label className="text-zinc-300">Custos fixos mensais (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={fixedCosts || ""}
              onChange={(e) => setFixedCosts(parseFloat(e.target.value) || 0)}
              className="bg-zinc-800 border-zinc-700 text-zinc-100"
              placeholder="Para calcular ponto de equilíbrio"
            />
          </div>
        </CardContent>
      </Card>

      {/* Results panel */}
      <div className="space-y-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100 text-base">Custo Total por Unidade</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-zinc-100">{formatCurrency(totalCost)}</p>
            <p className="text-zinc-500 text-xs mt-1">
              Base: {formatCurrency(baseCost)} + Logística: {formatCurrency(avgLogistics)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 border-orange-900/40">
          <CardHeader>
            <CardTitle className="text-orange-400 text-base">
              Preço Sugerido ({targetMargin}% de margem)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-400">{formatCurrency(suggestedPrice)}</p>
            <p className="text-zinc-500 text-xs mt-1">
              Lucro: {formatCurrency(suggestedPrice - totalCost)} por unidade
            </p>
          </CardContent>
        </Card>

        {salePrice > 0 && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-100 text-base">Margem com preço atual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <p className={`text-3xl font-bold ${effectiveMargin >= 30 ? "text-emerald-400" : effectiveMargin >= 15 ? "text-yellow-400" : "text-red-400"}`}>
                  {formatPercent(effectiveMargin)}
                </p>
                <Badge
                  variant="outline"
                  className={
                    effectiveMargin >= 30
                      ? "border-emerald-700 text-emerald-400"
                      : effectiveMargin >= 15
                      ? "border-yellow-700 text-yellow-400"
                      : "border-red-700 text-red-400"
                  }
                >
                  {effectiveMargin >= 30 ? "Boa margem" : effectiveMargin >= 15 ? "Margem baixa" : "Prejuízo!"}
                </Badge>
              </div>
              <p className="text-zinc-500 text-xs mt-1">
                Lucro: {formatCurrency(salePrice - totalCost)} por unidade
              </p>
            </CardContent>
          </Card>
        )}

        {breakEven !== null && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-100 text-base">Ponto de Equilíbrio</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-400">
                {breakEven === Infinity ? "∞" : `${breakEven} unidades/mês`}
              </p>
              <p className="text-zinc-500 text-xs mt-1">
                Para cobrir {formatCurrency(fixedCosts)} de custos fixos mensais
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
