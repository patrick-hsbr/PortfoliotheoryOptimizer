
import { PortfolioStats, OptimizationResult, AssetInput, TimeRange } from '../types';

// --- HELPER FUNCTIONS ---

// Helper to generate random normal distribution numbers (Box-Muller transform)
function randn_bm(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

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

// --- DATA FETCHING (REAL & MOCK) ---

// Map ranges to approximate trading days
const RANGE_DAYS_MAP: Record<TimeRange, number> = {
  '1y': 252,
  '2y': 504,
  '5y': 1260
};

// Mock Data Generator (Fallback)
const generateMockHistory = (tickers: string[], range: TimeRange): number[][] => {
  const days = RANGE_DAYS_MAP[range];
  const returnsMatrix: number[][] = [];
  // Base market factor to induce correlation
  const marketTrend = Array.from({ length: days }, () => randn_bm() * 0.01 + 0.0005);

  tickers.forEach((ticker) => {
    const assetReturns: number[] = [];
    // Different volatilities based on ticker string hash
    const seed = ticker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const randomVolBase = (seed % 20) / 1000;
    
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

  return returnsMatrix;
};

// Real Data Fetcher using CORS Proxy
async function fetchTickerData(ticker: string, range: TimeRange): Promise<{dates: string[], prices: number[], meta?: {shortName?: string, longName?: string}} | null> {
  try {
    // We use a CORS proxy to bypass browser restrictions for Yahoo Finance
    const encodedUrl = encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=${range}`);
    const proxyUrl = `https://corsproxy.io/?${encodedUrl}`;
    
    const res = await fetch(proxyUrl);
    
    // Try to parse JSON regardless of status, as Yahoo returns 404 with error JSON for invalid tickers
    const data = await res.json().catch(() => null);

    // CHECK FOR INVALID TICKER (Yahoo API Logic)
    // If chart.error exists OR chart.result is null, the ticker is likely invalid.
    if (data?.chart?.error || (data?.chart?.result === null) || (Array.isArray(data?.chart?.result) && data.chart.result.length === 0)) {
      const errorMsg = data?.chart?.error?.description || "Symbol not found";
      throw new Error(`INVALID_TICKER: ${ticker} (${errorMsg})`);
    }

    // If fetch failed but not due to invalid ticker (e.g. proxy error 500), throw generic to trigger fallback
    if (!res.ok && !data) {
      throw new Error('NETWORK_ERROR');
    }
    
    const result = data.chart.result?.[0];
    
    if (!result) return null;

    const timestamps = result.timestamp;
    const closes = result.indicators.quote[0].close;
    const meta = result.meta; // Contains shortName, longName, currency, etc.

    if (!timestamps || !closes || timestamps.length < 10) return null;

    const cleanDates: string[] = [];
    const cleanPrices: number[] = [];

    for(let i=0; i<timestamps.length; i++) {
       // Filter out null values (trading halts etc)
       if(closes[i] !== null && closes[i] !== undefined) {
          const d = new Date(timestamps[i] * 1000);
          const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
          cleanDates.push(dateStr);
          cleanPrices.push(closes[i]);
       }
    }
    return { dates: cleanDates, prices: cleanPrices, meta };
  } catch (e: any) {
    // Re-throw strict validation errors so they bubble up to the UI
    if (e.message && e.message.startsWith('INVALID_TICKER')) {
      throw e;
    }
    // Log other errors (Network/Proxy) and return null to signal fallback need
    console.warn(`Failed to fetch real data for ${ticker}.`, e);
    return null;
  }
}

// New Function: Search Symbols via API
export async function searchSymbol(query: string): Promise<{symbol: string, name: string, type: string, exchange: string}[]> {
  if (!query || query.length < 1) return [];
  
  try {
    const encodedUrl = encodeURIComponent(`https://query1.finance.yahoo.com/v1/finance/search?q=${query}&quotesCount=10&newsCount=0`);
    const proxyUrl = `https://corsproxy.io/?${encodedUrl}`;
    
    const res = await fetch(proxyUrl);
    const data = await res.json();
    
    if (data && data.quotes && Array.isArray(data.quotes)) {
      return data.quotes.map((q: any) => ({
        symbol: q.symbol,
        name: q.longname || q.shortname || q.symbol,
        type: q.quoteType, // EQUITY, ETF, INDEX, etc.
        exchange: q.exchDisp || q.exchange
      }));
    }
    return [];
  } catch (e) {
    console.warn("Search API failed", e);
    return [];
  }
}

async function getHistory(tickers: string[], range: TimeRange): Promise<{ history: number[][], isSimulation: boolean, names: Record<string, string> }> {
  
  // Map fetch calls to handle errors individually so Promise.all doesn't fail fast
  const results = await Promise.all(tickers.map(async (t) => {
    try {
      return await fetchTickerData(t, range);
    } catch (e) {
      return e; // Return error object
    }
  }));
  
  // 1. Check for STRICT Validation Errors (User entered garbage)
  const errors = results.filter(r => r instanceof Error);
  const invalidTickerErrors = errors.filter((e: any) => e.message && e.message.startsWith('INVALID_TICKER'));

  if (invalidTickerErrors.length > 0) {
    // Aggregate all invalid tickers
    const badTickers = invalidTickerErrors.map((e: any) => {
      // Parse "INVALID_TICKER: TICKER (Reason)"
      const parts = e.message.split(':');
      const tickerName = parts[1] ? parts[1].split('(')[0].trim() : 'Unknown';
      return tickerName;
    });

    // Remove duplicates
    const uniqueBadTickers = [...new Set(badTickers)];
    
    throw new Error(`INVALID_TICKERS_FOUND: ${uniqueBadTickers.join(', ')}`);
  }

  // If any result is null (Network Error) or generic Error, fall back to simulation for ALL assets
  if (results.some(r => r === null || r instanceof Error)) {
    console.log("Network/Proxy issues detected. Falling back to Simulation Mode.");
    return { history: generateMockHistory(tickers, range), isSimulation: true, names: {} };
  }

  // Data Alignment: Find intersection of dates across all assets
  const validResults = results as {dates: string[], prices: number[], meta?: any}[];
  
  // Initialize common dates with the first asset's dates
  let commonDates = new Set(validResults[0].dates);
  
  // Intersect with all other assets
  for (let i = 1; i < validResults.length; i++) {
    const assetDates = new Set(validResults[i].dates);
    commonDates = new Set([...commonDates].filter(d => assetDates.has(d)));
  }
  
  const sortedCommonDates = Array.from(commonDates).sort();

  // If intersection is too small (e.g. mismatched holidays leave too few days), fallback
  if (sortedCommonDates.length < 50) {
      console.warn("Too few overlapping trading days found. Falling back to simulation.");
      return { history: generateMockHistory(tickers, range), isSimulation: true, names: {} };
  }

  // Build Returns Matrix and Name Map
  const returnsMatrix: number[][] = [];
  const nameMap: Record<string, string> = {};
  
  for (let i = 0; i < tickers.length; i++) {
    const assetData = validResults[i];
    
    // Extract Name
    if (assetData.meta) {
      nameMap[tickers[i]] = assetData.meta.longName || assetData.meta.shortName || tickers[i];
    }

    // Create a map for quick lookup
    const priceMap = new Map<string, number>();
    assetData.dates.forEach((d, idx) => priceMap.set(d, assetData.prices[idx]));
    
    const assetReturns: number[] = [];
    let prevPrice = -1;

    // Calculate returns only on common dates
    for (const date of sortedCommonDates) {
      const price = priceMap.get(date)!;
      if (prevPrice > 0) {
          const ret = (price - prevPrice) / prevPrice;
          assetReturns.push(ret);
      }
      prevPrice = price;
    }
    returnsMatrix.push(assetReturns);
  }

  return { history: returnsMatrix, isSimulation: false, names: nameMap };
}


// --- MAIN SIMULATION LOGIC ---

export const runSimulation = async (userAssets: AssetInput[], range: TimeRange): Promise<OptimizationResult> => {
  const tickers = userAssets.map(a => a.ticker);
  
  // Normalize user weights
  const totalUserWeight = userAssets.reduce((sum, a) => sum + a.weight, 0);
  const currentWeights = userAssets.map(a => totalUserWeight > 0 ? a.weight / totalUserWeight : 0);

  // 1. Get Data (Real or Mock)
  const nAssets = tickers.length;
  
  let historyData;
  try {
    historyData = await getHistory(tickers, range);
  } catch (error: any) {
    // Propagate "Invalid Ticker" errors to the UI
    if (error.message && (error.message.startsWith('INVALID_TICKER') || error.message.startsWith('INVALID_TICKERS_FOUND'))) {
      throw error;
    }
    // For other unknown errors in getHistory setup, fallback to mock safely
    console.error("Unexpected error in history fetching, using mock fallback", error);
    historyData = { history: generateMockHistory(tickers, range), isSimulation: true, names: {} };
  }

  const { history, isSimulation, names } = historyData;

  // Fetch Benchmark Data (SPY/GSPC) independently
  let benchmarkStats: PortfolioStats | undefined = undefined;
  try {
      const benchData = await fetchTickerData('^GSPC', range);
      if (benchData) {
         const prices = benchData.prices;
         if (prices.length > 10) {
             let benchRets = [];
             for(let i=1; i<prices.length; i++) {
                 benchRets.push((prices[i] - prices[i-1])/prices[i-1]);
             }
             const benchMean = calculateMean(benchRets) * 252;
             const benchVar = benchRets.reduce((sum, r) => sum + Math.pow(r - (benchMean/252), 2), 0) / (benchRets.length -1) * 252;
             const benchRisk = Math.sqrt(benchVar);
             benchmarkStats = {
                 return: benchMean,
                 risk: benchRisk,
                 sharpe: (benchMean - 0.02) / benchRisk,
                 weights: [],
                 var95: 1.645 * benchRisk
             };
         }
      }
  } catch(e) {
      console.log("Benchmark fetch failed, ignoring.");
  }
  
  // 2. Calculate Statistics
  const dailyMeans = history.map(calculateMean);
  // Annualize: 252 trading days
  const annualizedReturns = dailyMeans.map(m => m * 252);
  
  const covMatrix: number[][] = Array(nAssets).fill(0).map(() => Array(nAssets).fill(0));
  const corMatrix: number[][] = Array(nAssets).fill(0).map(() => Array(nAssets).fill(0));
  
  // Calculate Covariance & Correlation
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
      // Protect against division by zero
      if (stdDevI === 0 || stdDevJ === 0) {
        corMatrix[i][j] = 0;
      } else {
        corMatrix[i][j] = covMatrix[i][j] / (stdDevI * stdDevJ);
      }
    }
  }

  // 3. Monte Carlo Simulation for Efficient Frontier
  const numPortfolios = 15000; // Increased from 3000 to 15000 for higher precision
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
      weights: weights,
      var95: 1.645 * pRisk // Simple parametric VaR (95%)
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
  const curRisk = Math.sqrt(curVar);
  const currentStats: PortfolioStats = {
    return: curRet,
    risk: curRisk,
    sharpe: (curRet - riskFreeRate) / curRisk,
    weights: currentWeights,
    var95: 1.645 * curRisk
  };

  // 5. Calculate Risk Contributions
  const riskContribution: number[] = [];
  for(let i=0; i<nAssets; i++) {
    let mrc_numerator = 0;
    for(let j=0; j<nAssets; j++) {
      mrc_numerator += currentWeights[j] * covMatrix[i][j];
    }
    
    const totalVol = Math.sqrt(curVar);
    // Handle zero-volatility edge case
    const rc = totalVol > 0 ? (currentWeights[i] * mrc_numerator) / totalVol : 0;
    
    // Store as percentage of total risk
    riskContribution.push(totalVol > 0 ? rc / totalVol : 0);
  }

  // If we have fetched real names during data gathering, try to update them
  // In a real Redux app we would dispatch updates, here we just return names map 
  // and let the UI handle it via the result object, or the App logic can use it.

  // We can attach the found names to the assets array in the result if we modify the interface,
  // or simpler: let the App update its own state if needed. 
  // For now, we'll return names in a side channel property if needed, 
  // but based on current Types, we don't have a dedicated field. 
  // However, the user requested names to be selectable via API, which is handled in AssetManager.
  
  return {
    assets: tickers, // The caller (App) still holds the Tickers
    correlationMatrix: corMatrix,
    efficientFrontier: frontier,
    currentPortfolio: currentStats,
    minVarPortfolio: minVarP,
    maxSharpePortfolio: maxSharpeP,
    riskContribution: riskContribution,
    isSimulation: isSimulation,
    benchmarkPortfolio: benchmarkStats,
    assetNames: names // New property added to types previously? Yes.
  };
};