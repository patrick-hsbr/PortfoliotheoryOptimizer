export interface AssetInput {
  id: string;
  ticker: string;
  weight: number;
}

export interface Asset {
  ticker: string;
  name: string;
  currentWeight: number; // 0 to 1
  sector: string;
}

export interface PortfolioStats {
  return: number;
  risk: number;
  sharpe: number;
  weights: number[];
}

export interface OptimizationResult {
  assets: string[];
  correlationMatrix: number[][];
  efficientFrontier: PortfolioStats[];
  currentPortfolio: PortfolioStats;
  minVarPortfolio: PortfolioStats;
  maxSharpePortfolio: PortfolioStats;
  riskContribution: number[];
}

export enum OptimizerModel {
  EQUAL_WEIGHT = 'EQUAL_WEIGHT',
  MIN_VAR = 'MIN_VAR',
  MAX_SHARPE = 'MAX_SHARPE',
}