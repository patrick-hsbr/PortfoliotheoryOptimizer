import React from 'react';

interface Props {
  assets: string[];
  matrix: number[][];
}

export const CorrelationMatrix: React.FC<Props> = ({ assets, matrix }) => {
  const getColor = (val: number) => {
    // Red for +1, Green for -1/0 (Desired low correlation)
    // +1 -> rgb(239, 68, 68) (red-500)
    // 0 -> rgb(255, 255, 255)
    // -1 -> rgb(34, 197, 94) (green-500)
    
    // Simple logic: High correlation is "Bad" for diversification (Red)
    // Low/Negative is "Good" (Green/Blue)
    
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
    <div className="overflow-x-auto p-4 bg-white rounded-lg shadow border border-slate-200">
      <h3 className="text-lg font-semibold mb-4 text-slate-800">Korrelationsmatrix (Correlation)</h3>
      <table className="min-w-full text-xs text-center">
        <thead>
          <tr>
            <th className="p-2"></th>
            {assets.map((asset) => (
              <th key={asset} className="p-2 font-bold text-slate-600">{asset}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={assets[i]}>
              <td className="p-2 font-bold text-slate-600 text-left">{assets[i]}</td>
              {row.map((val, j) => (
                <td 
                  key={`${i}-${j}`} 
                  className="p-2 border border-slate-100"
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
      <p className="text-xs text-slate-500 mt-2">
        <span className="inline-block w-3 h-3 bg-red-500 mr-1"></span> Hohe Korrelation (Klumpenrisiko)
        <span className="inline-block w-3 h-3 bg-green-500 ml-3 mr-1"></span> Niedrige/Negative Korrelation (Diversifikation)
      </p>
    </div>
  );
};