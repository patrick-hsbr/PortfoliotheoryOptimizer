import { PortfolioStats, OptimizationResult, AssetInput } from '../types';

// Helper to generate random normal distribution numbers (Box-Muller transform)
function randn_bm(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// Mock Data Generator (Simulating Yahoo Finance History)
const generateMockHistory = (tickers: string[], days = 252): number[][] => {
  const returnsMatrix: number[][] = [];
  
  // Base market factor to induce correlation
  const marketTrend = Array.from({ length: days }, () => randn_bm() * 0.01 + 0.0005);

  tickers.forEach((ticker, idx) => {
    const assetReturns: number[] = [];
    // Different volatilities based on ticker string hash simulation (simple char code sum)
    const seed = ticker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const randomVolBase = (seed % 20) / 1000; // deterministic "randomness" based on ticker
    
    const volatility = 0.01 + randomVolBase + (Math.random() * 0.01); // 1% to 3% daily vol
    const beta = 0.5 + (seed % 10) / 10; // 0.5 to 1.5 beta
    const alpha = (Math.random() - 0.5) * 0.001;

    for (let i = 0; i < days; i++) {
      const idiosyncratic = randn_bm() * volatility;
      const ret = alpha + (beta * marketTrend[i]) + idiosyncratic;
      assetReturns.push(ret);
    }
    returnsMatrix.push(assetReturns);
  });

  return returnsMatrix; // Rows are assets, columns are days
};

const calculateMean = (data: number[]): number => {
  return data.reduce((a, b) => a + b, 0) / data.length;
};

const calculateCovariance = (dataA: number[], dataB: number[], meanA: number, meanB: number): number => {
  let sum = 0;
  const n = dataA.length;
  for (let i = 0; i < n; i++) {
    sum += (dataA[i] - meanA) * (dataB[i] - meanB);
  }
  return sum / (n - 1);
};

export const runSimulation = async (userAssets: AssetInput[]): Promise<OptimizationResult> => {
  const tickers = userAssets.map(a => a.ticker);
  
  // Normalize user weights to ensure they sum to 1 for calculation
  const totalUserWeight = userAssets.reduce((sum, a) => sum + a.weight, 0);
  const currentWeights = userAssets.map(a => totalUserWeight > 0 ? a.weight / totalUserWeight : 0);

  // 1. Generate Data
  const nAssets = tickers.length;
  const history = generateMockHistory(tickers);
  
  // 2. Calculate Statistics
  const dailyMeans = history.map(calculateMean);
  const annualizedReturns = dailyMeans.map(m => m * 252);
  
  const covMatrix: number[][] = Array(nAssets).fill(0).map(() => Array(nAssets).fill(0));
  const corMatrix: number[][] = Array(nAssets).fill(0).map(() => Array(nAssets).fill(0));
  
  for (let i = 0; i < nAssets; i++) {
    for (let j = 0; j < nAssets; j++) {
      const cov = calculateCovariance(history[i], history[j], dailyMeans[i], dailyMeans[j]);
      covMatrix[i][j] = cov * 252; // Annualize
    }
  }

  for (let i = 0; i < nAssets; i++) {
    for (let j = 0; j < nAssets; j++) {
      const stdDevI = Math.sqrt(covMatrix[i][i]);
      const stdDevJ = Math.sqrt(covMatrix[j][j]);
      corMatrix[i][j] = covMatrix[i][j] / (stdDevI * stdDevJ);
    }
  }

  // 3. Monte Carlo Simulation for Efficient Frontier
  const numPortfolios = 3000;
  const frontier: PortfolioStats[] = [];
  const riskFreeRate = 0.02;

  let minVarP: PortfolioStats = { return: -Infinity, risk: Infinity, sharpe: -Infinity, weights: [] };
  let maxSharpeP: PortfolioStats = { return: -Infinity, risk: Infinity, sharpe: -Infinity, weights: [] };

  for (let p = 0; p < numPortfolios; p++) {
    // Generate random weights
    let weights = Array.from({ length: nAssets }, () => Math.random());
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    weights = weights.map(w => w / totalWeight);

    // Calculate Return
    let pReturn = 0;
    for (let i = 0; i < nAssets; i++) {
      pReturn += weights[i] * annualizedReturns[i];
    }

    // Calculate Risk (Variance -> StdDev)
    let pVariance = 0;
    for (let i = 0; i < nAssets; i++) {
      for (let j = 0; j < nAssets; j++) {
        pVariance += weights[i] * weights[j] * covMatrix[i][j];
      }
    }
    const pRisk = Math.sqrt(pVariance);
    const pSharpe = (pReturn - riskFreeRate) / pRisk;

    const stats: PortfolioStats = {
      return: pReturn,
      risk: pRisk,
      sharpe: pSharpe,
      weights: weights
    };

    frontier.push(stats);

    if (pRisk < minVarP.risk) minVarP = stats;
    if (pSharpe > maxSharpeP.sharpe) maxSharpeP = stats;
  }

  // 4. Current Portfolio (User defined weights)
  let curRet = 0;
  currentWeights.forEach((w, i) => curRet += w * annualizedReturns[i]);
  
  let curVar = 0;
  for (let i = 0; i < nAssets; i++) {
    for (let j = 0; j < nAssets; j++) {
      curVar += currentWeights[i] * currentWeights[j] * covMatrix[i][j];
    }
  }
  const currentStats: PortfolioStats = {
    return: curRet,
    risk: Math.sqrt(curVar),
    sharpe: (curRet - riskFreeRate) / Math.sqrt(curVar),
    weights: currentWeights
  };

  // 5. Calculate Risk Contributions
  const riskContribution: number[] = [];
  for(let i=0; i<nAssets; i++) {
    let mrc_numerator = 0;
    for(let j=0; j<nAssets; j++) {
      mrc_numerator += currentWeights[j] * covMatrix[i][j];
    }
    // Marginal Risk Contribution * Weight = Total Risk Contribution of asset
    const rc = (currentWeights[i] * mrc_numerator) / Math.sqrt(curVar);
    
    // Store as percentage of total risk (sigma_p)
    riskContribution.push(rc / Math.sqrt(curVar));
  }

  return {
    assets: tickers,
    correlationMatrix: corMatrix,
    efficientFrontier: frontier,
    currentPortfolio: currentStats,
    minVarPortfolio: minVarP,
    maxSharpePortfolio: maxSharpeP,
    riskContribution: riskContribution
  };
};