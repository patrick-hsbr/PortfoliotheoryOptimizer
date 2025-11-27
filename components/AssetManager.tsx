
import React, { useState, useEffect, useRef } from 'react';
import { AssetInput } from '../types';
import { searchSymbol } from '../services/financeEngine';

// Popular Defaults (Shown when input is focused but empty)
const POPULAR_TICKERS = [
  { symbol: "AAPL", name: "Apple Inc.", exchange: "NMS" },
  { symbol: "MSFT", name: "Microsoft Corp", exchange: "NMS" },
  { symbol: "NVDA", name: "NVIDIA Corp", exchange: "NMS" },
  { symbol: "AMZN", name: "Amazon.com Inc.", exchange: "NMS" },
  { symbol: "GOOG", name: "Alphabet Inc.", exchange: "NMS" },
  { symbol: "TSLA", name: "Tesla Inc.", exchange: "NMS" },
  { symbol: "META", name: "Meta Platforms", exchange: "NMS" },
  { symbol: "^GSPC", name: "S&P 500", exchange: "SNP" },
  { symbol: "ALV.DE", name: "Allianz SE", exchange: "GER" },
  { symbol: "SAP.DE", name: "SAP SE", exchange: "GER" },
  { symbol: "NESN.SW", name: "Nestlé SA", exchange: "SWI" },
  { symbol: "MC.PA", name: "LVMH", exchange: "PAR" },
];

interface Props {
  assets: AssetInput[];
  onChange: (assets: AssetInput[]) => void;
}

export const AssetManager: React.FC<Props> = ({ assets, onChange }) => {
  const [suggestions, setSuggestions] = useState<{symbol: string, name: string, exchange?: string}[]>([]);
  const [activeInputId, setActiveInputId] = useState<string | null>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Trigger Search
  const performSearch = async (query: string) => {
    if (!query || query.trim().length === 0) {
        setSuggestions(POPULAR_TICKERS);
        setLoadingSuggestions(false);
        return;
    }

    setLoadingSuggestions(true);
    const results = await searchSymbol(query);
    setLoadingSuggestions(false);
    
    // Filter out duplicates within the result set itself
    const unique = results.filter((v,i,a)=>a.findIndex(t=>(t.symbol === v.symbol))===i);
    
    if (unique.length > 0) {
        setSuggestions(unique);
    } else {
        setSuggestions([]); 
    }
  };

  const handleTickerChange = (id: string, value: string) => {
    const upperValue = value.toUpperCase();
    // Update UI immediately
    const newAssets = assets.map(a => a.id === id ? { ...a, ticker: upperValue } : a);
    onChange(newAssets);
    
    // Debounce Search
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    
    if (value.length === 0) {
        setSuggestions(POPULAR_TICKERS);
    } else {
        debounceTimeout.current = setTimeout(() => {
            performSearch(value);
        }, 300);
    }
  };

  const handleInputFocus = (id: string, currentVal: string) => {
      setActiveInputId(id);
      if (!currentVal) {
          setSuggestions(POPULAR_TICKERS);
      } else {
          performSearch(currentVal);
      }
  };

  const handleWeightChange = (id: string, value: string) => {
    const numValue = parseFloat(value);
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

  const selectSuggestion = (id: string, item: {symbol: string, name: string}) => {
    const newAssets = assets.map(a => a.id === id ? { ...a, ticker: item.symbol } : a);
    onChange(newAssets);
    setActiveInputId(null);
  };

  const totalWeight = assets.reduce((sum, a) => sum + a.weight, 0);
  const isWeightValid = Math.abs(totalWeight - 100) < 0.1;

  return (
    <div className="w-full max-w-3xl mx-auto" ref={wrapperRef}>
      
      {/* Status Header */}
      <div className={`mb-6 p-3 md:p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors duration-300 ${
        isWeightValid 
          ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
          : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
      }`}>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className={`p-2 rounded-full flex-shrink-0 ${isWeightValid ? 'bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-200' : 'bg-amber-100 dark:bg-amber-800 text-amber-600 dark:text-amber-200'}`}>
            {isWeightValid ? (
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            ) : (
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            )}
          </div>
          <div className="text-left">
            <h3 className={`text-sm font-bold ${isWeightValid ? 'text-green-800 dark:text-green-300' : 'text-amber-800 dark:text-amber-300'}`}>
              {isWeightValid ? 'Portfolio Allocation Perfekt' : 'Allocation anpassen'}
            </h3>
            <p className={`text-xs ${isWeightValid ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
              Gesamtgewicht: <span className="font-mono font-bold text-base">{totalWeight.toFixed(2)}%</span> / 100%
            </p>
          </div>
        </div>
        {/* Progress Bar for Total Weight */}
        <div className="w-full sm:w-32 h-2 bg-white dark:bg-slate-700 rounded-full overflow-hidden border border-slate-100 dark:border-slate-600">
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
           className="text-xs text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 transition-colors group"
         >
            <span>Ticker auf Yahoo Finance suchen</span>
            <svg className="w-3 h-3 transform group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
         </a>
      </div>

      {/* Header Row (Desktop) */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-4 mb-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
        <div className="col-span-6">Asset / Ticker</div>
        <div className="col-span-5 text-center">Gewichtung (%)</div>
        <div className="col-span-1"></div>
      </div>

      {/* Asset List */}
      <div className="space-y-3">
        {assets.map((asset, index) => {
          const suggestionMatch = suggestions.find(s => s.symbol === asset.ticker);
          const popularMatch = POPULAR_TICKERS.find(p => p.symbol === asset.ticker);
          const displayName = suggestionMatch?.name || popularMatch?.name;

          // Filter Logic: Exclude tickers already selected in OTHER rows
          const otherAssetTickers = assets
             .filter(a => a.id !== asset.id)
             .map(a => a.ticker);
             
          const filteredSuggestions = suggestions.filter(s => !otherAssetTickers.includes(s.symbol));

          return (
          <div 
            key={asset.id} 
            className="group relative grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-center bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500 transition-all"
          >
            
            {/* Ticker Input Wrapper */}
            <div className="col-span-1 md:col-span-6 relative">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={asset.ticker}
                  onFocus={() => handleInputFocus(asset.id, asset.ticker)}
                  onChange={(e) => handleTickerChange(asset.id, e.target.value)}
                  className="block w-full pl-10 pr-20 md:pr-3 py-2.5 border-slate-200 dark:border-slate-600 rounded-md text-sm font-semibold text-slate-700 dark:text-white bg-slate-50 dark:bg-slate-700 focus:bg-white dark:focus:bg-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-slate-400 uppercase"
                  placeholder="SUCHE..."
                />
                
                {/* Asset Name Integrated inside Input */}
                {displayName && (
                  <div className="absolute inset-y-0 right-12 md:right-3 flex items-center pointer-events-none">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-600 px-2 py-0.5 rounded max-w-[90px] md:max-w-[150px] truncate">
                      {displayName}
                    </span>
                  </div>
                )}

                {/* Mobile Delete Button - Inside Input Wrapper for correct vertical centering relative to input */}
                <button 
                    onClick={() => removeAsset(asset.id)}
                    className="md:hidden absolute top-1/2 -translate-y-1/2 right-2 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors z-10"
                >
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                   </svg>
                </button>
              </div>

              {/* Autocomplete Dropdown */}
              {activeInputId === asset.id && (
                <div className="absolute z-20 left-0 right-0 mt-1 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-100 dark:border-slate-700 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                  {loadingSuggestions ? (
                      <div className="p-4 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Suche...
                      </div>
                  ) : filteredSuggestions.length > 0 ? (
                      filteredSuggestions.map(s => (
                        <div 
                          key={s.symbol} 
                          onMouseDown={() => selectSuggestion(asset.id, s)}
                          className="px-4 py-2 hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer text-sm text-slate-700 dark:text-slate-300 border-b border-slate-50 dark:border-slate-700 last:border-0 flex flex-col group/item"
                        >
                          <div className="flex justify-between items-center">
                              <span className="font-bold font-mono">{s.symbol}</span>
                              {s.exchange && <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-900 px-1 rounded">{s.exchange}</span>}
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400 group-hover/item:text-blue-500 dark:group-hover/item:text-blue-300 truncate">{s.name}</span>
                        </div>
                      ))
                  ) : (
                      <div className="p-3 text-xs text-slate-400 text-center">Keine Ergebnisse gefunden.</div>
                  )}
                </div>
              )}
            </div>

            {/* Weight Input & Slider */}
            <div className="col-span-1 md:col-span-5 flex flex-col gap-2">
               <div className="relative flex items-center">
                  <input
                    type="number"
                    value={asset.weight}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => handleWeightChange(asset.id, e.target.value)}
                    className="block w-full pl-3 pr-8 py-2 text-right border-slate-200 dark:border-slate-600 rounded-md text-sm font-bold text-slate-700 dark:text-white bg-slate-50 dark:bg-slate-700 focus:bg-white dark:focus:bg-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-2 text-slate-400 text-sm font-medium">%</span>
               </div>
               {/* Smart Slider */}
               <input 
                 type="range" 
                 min="0" 
                 max="100" 
                 step="1" 
                 value={asset.weight || 0} 
                 onChange={(e) => handleWeightChange(asset.id, e.target.value)}
                 className="w-full h-1.5 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-500"
               />
            </div>

            {/* Desktop Delete Action (Centered) */}
            <div className="hidden md:flex col-span-1 justify-center">
              <button 
                onClick={() => removeAsset(asset.id)}
                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                title="Entfernen"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

          </div>
          );
        })}
      </div>

      {/* Add Button */}
      <button 
        onClick={addAsset}
        className="mt-6 w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-slate-500 dark:text-slate-400 font-medium hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group"
      >
        <div className="bg-slate-200 dark:bg-slate-700 group-hover:bg-blue-200 dark:group-hover:bg-blue-900 text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-300 rounded-full p-1 transition-colors">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        </div>
        Weitere Position hinzufügen
      </button>
    </div>
  );
};
