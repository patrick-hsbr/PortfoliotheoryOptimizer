import React, { useState, useEffect, useRef } from 'react';
import { AssetInput } from '../types';

const AVAILABLE_TICKERS = [
  "AAPL", "MSFT", "GOOG", "AMZN", "META", "TSLA", "NVDA", "NFLX", "ADBE", "ORCL", // Tech
  "JNJ", "PG", "KO", "PEP", "MCD", "WMT", "COST", "DIS", "NKE", // Consumer/Defensive
  "JPM", "BAC", "V", "MA", "GS", // Finance
  "ALV.DE", "SIE.DE", "BMW.DE", "VOW3.DE", "DTE.DE", "SAP.DE", "BAS.DE", "BAYN.DE", // DAX
  "MC.PA", "OR.PA", "TTE.PA", "AIR.PA", "SAN.PA", // CAC
  "NESN.SW", "NOVN.SW", "ROG.SW", "UBSG.SW" // SMI
];

interface Props {
  assets: AssetInput[];
  onChange: (assets: AssetInput[]) => void;
}

export const AssetManager: React.FC<Props> = ({ assets, onChange }) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeInputId, setActiveInputId] = useState<string | null>(null);
  
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close suggestions on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setActiveInputId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const handleTickerChange = (id: string, value: string) => {
    const newAssets = assets.map(a => a.id === id ? { ...a, ticker: value.toUpperCase() } : a);
    onChange(newAssets);
    
    if (value.length > 0) {
      const filtered = AVAILABLE_TICKERS.filter(t => t.toLowerCase().includes(value.toLowerCase()));
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const handleWeightChange = (id: string, value: string) => {
    const numValue = parseFloat(value);
    // Allow empty string for typing, default to 0 for calculation
    const newAssets = assets.map(a => a.id === id ? { ...a, weight: isNaN(numValue) ? 0 : numValue } : a);
    onChange(newAssets);
  };

  const addAsset = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    onChange([...assets, { id: newId, ticker: "", weight: 0 }]);
  };

  const removeAsset = (id: string) => {
    onChange(assets.filter(a => a.id !== id));
  };

  const selectSuggestion = (id: string, ticker: string) => {
    const newAssets = assets.map(a => a.id === id ? { ...a, ticker: ticker } : a);
    onChange(newAssets);
    setActiveInputId(null);
  };

  const totalWeight = assets.reduce((sum, a) => sum + a.weight, 0);
  const isWeightValid = Math.abs(totalWeight - 100) < 0.1;

  return (
    <div className="w-full max-w-3xl mx-auto" ref={wrapperRef}>
      
      {/* Status Header */}
      <div className={`mb-6 p-4 rounded-xl flex items-center justify-between transition-colors duration-300 ${
        isWeightValid ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${isWeightValid ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
            {isWeightValid ? (
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            ) : (
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            )}
          </div>
          <div>
            <h3 className={`text-sm font-bold ${isWeightValid ? 'text-green-800' : 'text-amber-800'}`}>
              {isWeightValid ? 'Portfolio Allocation Perfekt' : 'Allocation anpassen'}
            </h3>
            <p className={`text-xs ${isWeightValid ? 'text-green-600' : 'text-amber-600'}`}>
              Gesamtgewicht: <span className="font-mono font-bold text-base">{totalWeight.toFixed(1)}%</span> / 100%
            </p>
          </div>
        </div>
        {/* Progress Bar for Total Weight */}
        <div className="hidden sm:block w-32 h-2 bg-white rounded-full overflow-hidden border border-slate-100">
          <div 
            className={`h-full transition-all duration-500 ${totalWeight > 100 ? 'bg-red-500' : 'bg-blue-500'}`} 
            style={{ width: `${Math.min(totalWeight, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Yahoo Finance Helper Link */}
      <div className="flex justify-end px-1 mb-2">
         <a 
           href="https://finance.yahoo.com/lookup" 
           target="_blank" 
           rel="noopener noreferrer" 
           className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1 transition-colors group"
         >
            <span>Ticker-Symbole auf Yahoo Finance suchen</span>
            <svg className="w-3 h-3 transform group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
         </a>
      </div>

      {/* Header Row */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-4 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
        <div className="col-span-7">Asset / Ticker</div>
        <div className="col-span-4 text-right">Gewichtung</div>
        <div className="col-span-1"></div>
      </div>

      {/* Asset List */}
      <div className="space-y-3">
        {assets.map((asset, index) => (
          <div 
            key={asset.id} 
            className="group relative grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-center bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all"
          >
            
            {/* Ticker Input */}
            <div className="col-span-12 md:col-span-7 relative">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={asset.ticker}
                  onFocus={() => {
                    setActiveInputId(asset.id);
                    setSuggestions(AVAILABLE_TICKERS);
                  }}
                  onChange={(e) => handleTickerChange(asset.id, e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border-slate-200 rounded-md text-sm font-semibold text-slate-700 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-slate-400 uppercase"
                  placeholder="TICKER SUCHEN..."
                />
              </div>

              {/* Autocomplete Dropdown */}
              {activeInputId === asset.id && suggestions.length > 0 && (
                <div className="absolute z-20 left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-slate-100 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                  {suggestions.map(s => (
                    <div 
                      key={s} 
                      onMouseDown={() => selectSuggestion(asset.id, s)} // onMouseDown fires before onBlur
                      className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm font-mono text-slate-700 border-b border-slate-50 last:border-0 flex justify-between items-center group/item"
                    >
                      <span>{s}</span>
                      <span className="text-xs text-slate-300 group-hover/item:text-blue-400 opacity-0 group-hover/item:opacity-100 transition-opacity">Auswählen</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Weight Input */}
            <div className="col-span-10 md:col-span-4 relative">
               <div className="flex items-center relative">
                  <input
                    type="number"
                    value={asset.weight}
                    onChange={(e) => handleWeightChange(asset.id, e.target.value)}
                    className="block w-full pl-3 pr-8 py-2.5 text-right border-slate-200 rounded-md text-sm font-bold text-slate-700 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                  <span className="absolute right-3 text-slate-400 text-sm font-medium">%</span>
               </div>
               {/* Visual weight bar */}
               <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 rounded-b-md overflow-hidden mx-0.5 mb-0.5">
                  <div className="h-full bg-blue-400 opacity-50" style={{ width: `${Math.min(asset.weight, 100)}%` }}></div>
               </div>
            </div>

            {/* Delete Action */}
            <div className="col-span-2 md:col-span-1 flex justify-end">
              <button 
                onClick={() => removeAsset(asset.id)}
                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                title="Entfernen"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* Add Button */}
      <button 
        onClick={addAsset}
        className="mt-6 w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-medium hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 group"
      >
        <div className="bg-slate-200 group-hover:bg-blue-200 text-slate-500 group-hover:text-blue-600 rounded-full p-1 transition-colors">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        </div>
        Weitere Position hinzufügen
      </button>
    </div>
  );
};