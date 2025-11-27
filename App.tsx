import React, { useState, useEffect, useCallback } from 'react';
import { runSimulation } from './services/financeEngine';
import { OptimizationResult, AssetInput, TimeRange } from './types';
import { CorrelationMatrix } from './components/CorrelationMatrix';
import { EfficientFrontierChart } from './components/EfficientFrontierChart';
import { WeightsChart } from './components/WeightsChart';
import { InfoSection } from './components/InfoSection';
import { AssetManager } from './components/AssetManager';

const DEFAULT_ASSETS: AssetInput[] = [
  { id: '1', ticker: 'AAPL', weight: 15 },
  { id: '2', ticker: 'MSFT', weight: 15 },
  { id: '3', ticker: 'JNJ', weight: 10 },
  { id: '4', ticker: 'PG', weight: 10 },
  { id: '5', ticker: 'GOOG', weight: 10 },
  { id: '6', ticker: 'ALV.DE', weight: 10 },
  { id: '7', ticker: 'MC.PA', weight: 10 },
  { id: '8', ticker: 'NESN.SW', weight: 20 },
];

function App() {
  const [assets, setAssets] = useState<AssetInput[]>(DEFAULT_ASSETS);
  const [timeRange, setTimeRange] = useState<TimeRange>('1y');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('bz_portfolio_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Apply Dark Mode to HTML root
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('bz_portfolio_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('bz_portfolio_theme', 'light');
    }
  }, [isDarkMode]);

  // Load Assets from LocalStorage on mount
  useEffect(() => {
    const savedAssets = localStorage.getItem('bz_portfolio_assets');
    const savedRange = localStorage.getItem('bz_portfolio_range');
    if (savedAssets) {
      try {
        const parsed = JSON.parse(savedAssets);
        if (Array.isArray(parsed) && parsed.length > 0) setAssets(parsed);
      } catch (e) { console.error("Failed to load assets", e); }
    }
    if (savedRange) {
      if (['1y', '2y', '5y'].includes(savedRange)) setTimeRange(savedRange as TimeRange);
    }
  }, []);

  // Save Assets to LocalStorage on change
  useEffect(() => {
    localStorage.setItem('bz_portfolio_assets', JSON.stringify(assets));
  }, [assets]);

  useEffect(() => {
    localStorage.setItem('bz_portfolio_range', timeRange);
  }, [timeRange]);

  // Optimization Handler
  // We use useCallback to ensure the function is stable for the useEffect dependency
  const handleOptimize = useCallback(async () => {
    setLoading(true);
    setError(null);
    // Don't clear result immediately to avoid flickering during range switch if possible, 
    // but for loading state consistency we keep it or handle UI overlay.
    // setResult(null); 
    
    try {
      // 1. Validate Asset Count
      if (assets.length < 2) {
        setError("Bitte mindestens 2 Positionen hinzufügen, um eine Analyse durchzuführen.");
        setLoading(false);
        return;
      }

      // 2. Validate Empty Tickers
      const validAssets = assets.filter(a => a.ticker.trim().length > 0);
      if (validAssets.length !== assets.length) {
        setError("Bitte alle leeren Ticker-Felder ausfüllen oder entfernen.");
        setLoading(false);
        return;
      }

      // 3. Validate Duplicate Tickers (Strict Check)
      const tickerList = validAssets.map(a => a.ticker.trim().toUpperCase());
      const uniqueTickers = new Set(tickerList);
      if (uniqueTickers.size !== tickerList.length) {
        // Find the specific duplicate for the error message
        const duplicates = tickerList.filter((item, index) => tickerList.indexOf(item) !== index);
        const uniqueDuplicates = [...new Set(duplicates)];
        setError(`Doppelte Ticker gefunden: ${uniqueDuplicates.join(', ')}. Ein Asset darf nur einmal im Portfolio vorkommen.`);
        setLoading(false);
        return;
      }

      // 4. Validate Total Weight (Must be 100%)
      const totalWeight = validAssets.reduce((sum, a) => sum + a.weight, 0);
      if (Math.abs(totalWeight - 100) > 0.1) {
        setError(`Die Gesamtgewichtung beträgt aktuell ${totalWeight.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 1 })}%. Die Summe aller Positionen muss exakt 100% ergeben.`);
        setLoading(false);
        return;
      }
      
      // Execute
      const data = await runSimulation(validAssets, timeRange);
      
      if (data.assetNames) {
         const updatedAssets = validAssets.map(a => {
             if (data.assetNames && data.assetNames[a.ticker]) {
                 return a;
             }
             return a;
         });
         setAssets(updatedAssets);
      }
      
      setResult(data);
      
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.startsWith('INVALID_TICKERS_FOUND')) {
        const tickerList = err.message.replace('INVALID_TICKERS_FOUND: ', '');
        setError(`Folgende Ticker wurden nicht gefunden: ${tickerList}. Bitte überprüfe die Schreibweise auf Yahoo Finance.`);
      } else if (err.message && err.message.startsWith('INVALID_TICKER')) {
        const parts = err.message.split(':');
        const tickerName = parts[1] ? parts[1].trim() : 'Unbekannt';
        setError(`Der Ticker "${tickerName}" wurde nicht gefunden. Bitte überprüfe die Schreibweise auf Yahoo Finance.`);
      } else {
        setError("Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es später erneut.");
      }
    } finally {
      setLoading(false);
    }
  }, [assets, timeRange]);

  // Auto-Refresh when TimeRange changes AND we already have results
  // This ensures the charts update immediately when user toggles the year
  useEffect(() => {
    if (result) {
      handleOptimize();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]); // Only trigger on timeRange change, assuming assets rely on user interaction to trigger


  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white p-1.5 rounded font-bold text-lg">PO</div>
            <div className="flex flex-col leading-none">
              <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Portfoliooptimizer</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">by Patrick</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Dark Mode Toggle */}
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
              title={isDarkMode ? "Hellen Modus aktivieren" : "Dunklen Modus aktivieren"}
            >
              {isDarkMode ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 pt-16 pb-12 px-4 text-center transition-colors duration-300">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight">
            Optimiere dein Portfolio nach Rendite & Risiko
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Definiere dein Portfolio und der Portfoliooptimizer berechnet Korrelationen, Efficient Frontiers und Optimierungsvorschläge.
          </p>
        </section>

        {/* Analysis Section */}
        <div id="analyse" className="max-w-7xl mx-auto px-4 py-12 space-y-12">
          
          {/* Input Area */}
          <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 transition-colors duration-300">
            <div className="flex flex-col justify-center items-center mb-8 gap-4 text-center">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Portfolio Konfiguration</h2>
              
              {/* Time Range Selector */}
              <div className="flex flex-col items-center gap-2">
                <div className="bg-slate-100 dark:bg-slate-700 p-1 rounded-lg flex mx-auto">
                  {(['1y', '2y', '5y'] as TimeRange[]).map((range) => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                        timeRange === range 
                          ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-white shadow-sm' 
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      {range === '1y' ? '1 Jahr' : range === '2y' ? '2 Jahre' : '5 Jahre'}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-slate-400 dark:text-slate-500">Wähle den historischen Zeitraum für die Risikoanalyse.</span>
              </div>
            </div>
            
            <AssetManager assets={assets} onChange={setAssets} />
            
            {error && (
              <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 rounded-lg border border-red-100 dark:border-red-800 flex items-start gap-3">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div className="mt-8 flex justify-center">
              <button
                onClick={handleOptimize}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold py-4 px-12 rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analysiere Daten...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Portfolio Analysieren
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Dashboard */}
          {result && (
            <div className={`animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
              
              {/* Status Badge */}
              <div className="flex justify-end">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                  result.isSimulation 
                    ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-200 border-amber-200 dark:border-amber-800' 
                    : 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-200 border-green-200 dark:border-green-800'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${result.isSimulation ? 'bg-amber-500' : 'bg-green-500'}`}></span>
                  {result.isSimulation ? 'Simulation (Demo Daten)' : 'Echte Marktdaten (Yahoo)'}
                </span>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 border-l-4 border-l-purple-500">
                  <h3 className="text-slate-500 dark:text-slate-400 font-medium mb-1">Aktuelles Risiko (Volatilität)</h3>
                  <div className="text-3xl font-bold text-slate-900 dark:text-white">{(result.currentPortfolio.risk * 100).toFixed(2)}%</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                    Dein Portfolio basierend auf deiner aktuellen Gewichtung.
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 border-l-4 border-l-red-500">
                  <h3 className="text-slate-500 dark:text-slate-400 font-medium mb-1">Minimiertes Risiko</h3>
                  <div className="text-3xl font-bold text-slate-900 dark:text-white">{(result.minVarPortfolio.risk * 100).toFixed(2)}%</div>
                  <div className="text-sm text-green-600 dark:text-green-400 mt-2 font-medium flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                    {((1 - result.minVarPortfolio.risk / result.currentPortfolio.risk) * 100).toFixed(1)}% Reduktion möglich
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Das theoretisch sicherste Portfolio.</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 border-l-4 border-l-green-500">
                  <h3 className="text-slate-500 dark:text-slate-400 font-medium mb-1">Max Sharpe Ratio</h3>
                  <div className="text-3xl font-bold text-slate-900 dark:text-white">{result.maxSharpePortfolio.sharpe.toFixed(2)}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                    Bestes Verhältnis aus Rendite pro Einheit Risiko.
                  </div>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <EfficientFrontierChart 
                  frontier={result.efficientFrontier}
                  current={result.currentPortfolio}
                  minVar={result.minVarPortfolio}
                  maxSharpe={result.maxSharpePortfolio}
                  benchmark={result.benchmarkPortfolio}
                  isDarkMode={isDarkMode}
                />
                
                <WeightsChart 
                  assets={result.assets}
                  current={result.currentPortfolio}
                  minVar={result.minVarPortfolio}
                  maxSharpe={result.maxSharpePortfolio}
                  isDarkMode={isDarkMode}
                />
                
                <div className="lg:col-span-2">
                   <CorrelationMatrix assets={result.assets} matrix={result.correlationMatrix} />
                </div>
              </div>
            </div>
          )}
        </div>

        <InfoSection />
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-8 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 dark:text-slate-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Portfoliooptimizer by Patrick.</p>
          <p className="mt-2">
            Keine Anlageberatung. Alle Berechnungen basieren auf historischen Daten.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;