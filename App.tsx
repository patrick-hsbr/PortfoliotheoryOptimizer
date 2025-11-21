import React, { useState } from 'react';
import { runSimulation } from './services/financeEngine';
import { OptimizationResult, AssetInput } from './types';
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
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);

  const handleOptimize = async () => {
    setLoading(true);
    try {
      // Basic validation
      if (assets.length < 2) {
        alert("Bitte mindestens 2 Positionen hinzufügen.");
        setLoading(false);
        return;
      }

      const validAssets = assets.filter(a => a.ticker.trim().length > 0);
      if (validAssets.length !== assets.length) {
        alert("Bitte leere Ticker-Felder ausfüllen oder entfernen.");
        setLoading(false);
        return;
      }
      
      // Simulate delay for realistic feel and run simulation
      await new Promise(resolve => setTimeout(resolve, 800)); 
      const data = await runSimulation(validAssets);
      setResult(data);
    } catch (error) {
      console.error(error);
      alert("Fehler bei der Berechnung. Bitte überprüfe deine Eingaben.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white p-1.5 rounded font-bold text-lg">BZ</div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Banksterz Portfoliotheorie</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow bg-slate-50">
        
        {/* Hero / Input Section */}
        <section className="bg-white border-b border-slate-200 pb-12 pt-8">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Wie lege ich mein Geld optimal an?
            </h2>
            <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
              Optimiere dein Depot nach Rendite und Risiko. Definiere deine Portfoliostruktur und die Banksterz Simulation berechnet Korrelationen, Efficient Frontiers und Optimierungsvorschläge.
            </p>

            <AssetManager assets={assets} onChange={setAssets} />

            <div className="mt-8">
              <button 
                onClick={handleOptimize}
                disabled={loading}
                className={`px-8 py-3 rounded-lg font-bold text-white shadow-md transition-all ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5'}`}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analysiere Portfolio...
                  </span>
                ) : "Jetzt Optimieren"}
              </button>
            </div>
          </div>
        </section>

        {/* Results Dashboard */}
        {result && (
          <div id="analyse" className="max-w-7xl mx-auto px-4 py-12 animate-fade-in">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Aktuelles Risiko (σ)</h3>
                <div className="text-3xl font-bold text-slate-800">{(result.currentPortfolio.risk * 100).toFixed(2)}%</div>
                <div className="text-sm text-slate-500 mt-2">Basierend auf deiner Gewichtung</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-xs font-bold uppercase tracking-wider text-red-500 mb-1">Minimiertes Risiko (MinVar)</h3>
                <div className="text-3xl font-bold text-red-600">{(result.minVarPortfolio.risk * 100).toFixed(2)}%</div>
                <div className="text-sm text-green-600 mt-2 font-medium">
                  - {((result.currentPortfolio.risk - result.minVarPortfolio.risk) * 100).toFixed(2)}% Reduktion
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-xs font-bold uppercase tracking-wider text-green-600 mb-1">Max Sharpe Ratio</h3>
                <div className="text-3xl font-bold text-green-700">{result.maxSharpePortfolio.sharpe.toFixed(2)}</div>
                <div className="text-sm text-slate-500 mt-2">Bestes Rendite/Risiko Verhältnis</div>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <EfficientFrontierChart 
                frontier={result.efficientFrontier} 
                current={result.currentPortfolio}
                minVar={result.minVarPortfolio}
                maxSharpe={result.maxSharpePortfolio}
              />
              <WeightsChart 
                assets={result.assets}
                current={result.currentPortfolio}
                minVar={result.minVarPortfolio}
                maxSharpe={result.maxSharpePortfolio}
              />
            </div>

            <div className="mb-8">
              <CorrelationMatrix assets={result.assets} matrix={result.correlationMatrix} />
            </div>
          </div>
        )}

        {/* Educational Content */}
        <div id="learn">
          <InfoSection />
        </div>

      </main>

      <footer className="bg-slate-900 text-slate-400 py-8 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} Banksterz Portfoliotheorie.</p>
      </footer>
    </div>
  );
}

export default App;