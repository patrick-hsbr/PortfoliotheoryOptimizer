import React from 'react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, Tooltip, Cell, Legend, ReferenceLine } from 'recharts';
import { PortfolioStats } from '../types';

interface Props {
  frontier: PortfolioStats[];
  current: PortfolioStats;
  minVar: PortfolioStats;
  maxSharpe: PortfolioStats;
}

export const EfficientFrontierChart: React.FC<Props> = ({ frontier, current, minVar, maxSharpe }) => {
  
  const data = frontier.map((p) => ({
    x: p.risk * 100,
    y: p.return * 100,
    type: 'Simulated'
  }));

  const highlights = [
    { x: current.risk * 100, y: current.return * 100, name: 'Dein Portfolio (Own)', color: '#8b5cf6' }, // violet-500
    { x: minVar.risk * 100, y: minVar.return * 100, name: 'Min Volatility', color: '#ef4444' }, // red-500
    { x: maxSharpe.risk * 100, y: maxSharpe.return * 100, name: 'Max Sharpe (Tangency)', color: '#10b981' }, // green-500
  ];

  return (
    <div className="bg-white p-4 rounded-lg shadow border border-slate-200 h-96">
      <h3 className="text-lg font-semibold mb-2 text-slate-800">Efficient Frontier (Rendite vs. Risiko)</h3>
      <ResponsiveContainer width="100%" height="90%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
          <XAxis type="number" dataKey="x" name="Risiko (Vol)" unit="%" label={{ value: 'Risiko (σ)', position: 'insideBottom', offset: -10 }} />
          <YAxis type="number" dataKey="y" name="Rendite" unit="%" label={{ value: 'Erwartete Rendite (μ)', angle: -90, position: 'insideLeft' }} />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
          <Legend verticalAlign="top" height={36}/>
          
          {/* Simulated Points */}
          <Scatter name="Simulierte Portfolios" data={data} fill="#cbd5e1" shape="circle" r={2} />
          
          {/* Highlights */}
          <Scatter name="Highlights" data={highlights} shape="diamond">
             {highlights.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={2} />
            ))}
          </Scatter>

          {/* Approximate CML Line from Risk Free (2%) to Max Sharpe */}
          <ReferenceLine 
            segment={[{ x: 0, y: 2 }, { x: maxSharpe.risk * 100, y: maxSharpe.return * 100 }]} 
            stroke="#06b6d4" 
            strokeDasharray="3 3" 
            label="CML"
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};