import { PriceCalculator } from "@/components/calculator/PriceCalculator";

export default function CalculatorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Calculadora de Preços</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Calcule o preço ideal e a margem de lucro para seus produtos
        </p>
      </div>
      <PriceCalculator />
    </div>
  );
}
