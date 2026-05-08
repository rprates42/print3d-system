export interface MaterialUsage {
  costPerUnit: number;
  quantity: number;
}

export function calcMaterialCost(materials: MaterialUsage[]): number {
  return materials.reduce((sum, m) => sum + m.costPerUnit * m.quantity, 0);
}

export function calcBaseCost(
  materialCost: number,
  overheadPerUnit: number,
  avgLogisticsCost: number
): number {
  return materialCost + overheadPerUnit + avgLogisticsCost;
}

export function calcSuggestedPrice(
  baseCost: number,
  targetMarginPct: number
): number {
  if (targetMarginPct >= 100 || targetMarginPct < 0)
    throw new Error("Margem inválida");
  return baseCost / (1 - targetMarginPct / 100);
}

export function calcMargin(salePrice: number, baseCost: number): number {
  if (salePrice <= 0) return 0;
  return ((salePrice - baseCost) / salePrice) * 100;
}

export function calcProfit(
  salePrice: number,
  baseCost: number,
  quantity: number
): number {
  return (salePrice - baseCost) * quantity;
}

export function calcBreakEven(
  monthlyFixedCosts: number,
  salePrice: number,
  variableCostPerUnit: number
): number {
  const contribution = salePrice - variableCostPerUnit;
  if (contribution <= 0) return Infinity;
  return Math.ceil(monthlyFixedCosts / contribution);
}

export function calcConversionRate(
  salesCount: number,
  views: number
): number {
  if (views === 0) return 0;
  return (salesCount / views) * 100;
}

export function calcAvgLogisticsCost(
  totalVariableLogistics: number,
  totalOrders: number
): number {
  if (totalOrders === 0) return 0;
  return totalVariableLogistics / totalOrders;
}
