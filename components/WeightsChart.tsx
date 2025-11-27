import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LabelList } from 'recharts';
import { PortfolioStats } from '../types';

interface Props {
  assets: string[];
  current: PortfolioStats;
  minVar: PortfolioStats;
  maxSharpe: PortfolioStats;
  isDarkMode?: boolean;
}

export const WeightsChart: React.FC<Props> = ({ assets, current, minVar, maxSharpe, isDarkMode = false }) => {
  const data = assets.map((asset, idx) => ({
    name: asset,
    Current: parseFloat((current.weights[idx] * 100).toFixed(1)),
    MinVar: parseFloat((minVar.weights[idx] * 100).toFixed(1)),
    MaxSharpe: parseFloat((maxSharpe.weights[idx] * 100).toFixed(1)),
  }));

  // Theme colors
  const axisColor = isDarkMode ? '#94a3b8' : '#64748b';
  const tooltipBg = isDarkMode ? '#1e293b' : '#ffffff';
  const tooltipText = isDarkMode ? '#f8fafc' : '#1e293b';
  const gridColor = isDarkMode ? '#334155' : '#e2e8f0';

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow border border-slate-200 dark:border-slate-700 h-[400px] md:h-[500px] transition-colors flex flex-col">
      <h3 className="text-lg font-semibold mb-2 text-slate-800 dark:text-white">Optimale Portfolio-Gewichte</h3>
      <div className="flex-grow min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 25, right: 10, left: -20, bottom: 20 }}>
            <XAxis 
              dataKey="name" 
              tick={{fontSize: 10, fill: axisColor}} 
              axisLine={{ stroke: axisColor }}
              tickLine={{ stroke: axisColor }}
              interval={0} 
            />
            <YAxis 
              unit="%" 
              tick={{fontSize: 11, fill: axisColor}} 
              axisLine={{ stroke: axisColor }}
              tickLine={{ stroke: axisColor }}
            />
            <Tooltip 
              contentStyle={{ fontSize: '12px', backgroundColor: tooltipBg, borderColor: gridColor, color: tooltipText }}
              itemStyle={{ color: tooltipText }}
              cursor={{fill: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}}
            />
            <Legend 
              verticalAlign="top" 
              align="right"
              wrapperStyle={{ fontSize: '11px', color: axisColor, top: 0, right: 10 }}
            />
            <Bar dataKey="Current" fill="#8b5cf6" name="Aktuell">
               <LabelList dataKey="Current" position="top" fill={axisColor} fontSize={9} formatter={(val: number) => val > 0 ? val + '%' : ''} />
            </Bar>
            <Bar dataKey="MinVar" fill="#ef4444" name="Min Risiko">
               <LabelList dataKey="MinVar" position="top" fill={axisColor} fontSize={9} formatter={(val: number) => val > 0 ? val + '%' : ''} />
            </Bar>
            <Bar dataKey="MaxSharpe" fill="#10b981" name="Max Sharpe">
               <LabelList dataKey="MaxSharpe" position="top" fill={axisColor} fontSize={9} formatter={(val: number) => val > 0 ? val + '%' : ''} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};