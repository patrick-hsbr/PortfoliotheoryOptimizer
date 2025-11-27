import React from 'react';

interface Props {
  assets: string[];
  matrix: number[][];
}

export const CorrelationMatrix: React.FC<Props> = ({ assets, matrix }) => {
  const getColor = (val: number) => {
    // Red for +1, Green for -1/0 (Desired low correlation)
    if (val > 0) {
      // White to Red
      const intensity = Math.floor(255 * (1 - val));
      return `rgb(255, ${intensity}, ${intensity})`;
    } else {
      // White to Green
      const intensity = Math.floor(255 * (1 - Math.abs(val)));
      return `rgb(${intensity}, 255, ${intensity})`;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-slate-200 dark:border-slate-700 transition-colors h-[400px] md:h-[500px] flex flex-col justify-between">
      <h3 className="text-lg font-semibold mb-6 text-slate-800 dark:text-white flex-shrink-0">Korrelationsmatrix</h3>
      
      <div className="overflow-auto flex-grow flex items-center justify-center w-full">
        <table className="text-xs text-center border-collapse m-auto">
          <thead>
            <tr>
              <th className="p-2 sticky top-0 bg-white dark:bg-slate-800 z-10"></th>
              {assets.map((asset) => (
                <th key={asset} className="p-2 font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap sticky top-0 bg-white dark:bg-slate-800 z-10 shadow-sm">{asset}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, i) => (
              <tr key={assets[i]}>
                <td className="p-2 font-bold text-slate-600 dark:text-slate-300 text-left whitespace-nowrap sticky left-0 bg-white dark:bg-slate-800 z-10 shadow-sm">{assets[i]}</td>
                {row.map((val, j) => (
                  <td 
                    key={`${i}-${j}`} 
                    className="p-3 border border-slate-100 dark:border-slate-600 text-slate-900"
                    style={{ backgroundColor: getColor(val) }}
                    title={`Correlation ${assets[i]} vs ${assets[j]}: ${val.toFixed(2)}`}
                  >
                    {val.toFixed(2)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Gradient Legend */}
      <div className="mt-4 px-4 flex-shrink-0">
        <div className="h-4 w-full rounded-full bg-gradient-to-r from-green-500 via-white to-red-500 shadow-inner border border-slate-100 dark:border-slate-600"></div>
        <div className="flex justify-between text-xs mt-2 text-slate-500 dark:text-slate-400 font-medium">
          <span>-1 (Diversifikation)</span>
          <span>0 (Unkorreliert)</span>
          <span>+1 (Klumpenrisiko)</span>
        </div>
      </div>
    </div>
  );
};