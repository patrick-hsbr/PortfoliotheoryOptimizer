import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { PortfolioStats } from '../types';

interface Props {
  assets: string[];
  current: PortfolioStats;
  minVar: PortfolioStats;
  maxSharpe: PortfolioStats;
}

export const WeightsChart: React.FC<Props> = ({ assets, current, minVar, maxSharpe }) => {
  const data = assets.map((asset, idx) => ({
    name: asset,
    Current: (current.weights[idx] * 100).toFixed(1),
    MinVar: (minVar.weights[idx] * 100).toFixed(1),
    MaxSharpe: (maxSharpe.weights[idx] * 100).toFixed(1),
  }));

  return (
    <div className="bg-white p-4 rounded-lg shadow border border-slate-200 h-96">
      <h3 className="text-lg font-semibold mb-2 text-slate-800">Optimale Portfolio-Gewichte (w_opt)</h3>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <XAxis dataKey="name" />
          <YAxis unit="%" />
          <Tooltip />
          <Legend />
          <Bar dataKey="Current" fill="#8b5cf6" name="Aktuell (Gleich)" />
          <Bar dataKey="MinVar" fill="#ef4444" name="Min Varianz (w_MV)" />
          <Bar dataKey="MaxSharpe" fill="#10b981" name="Max Sharpe (w_mu)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};