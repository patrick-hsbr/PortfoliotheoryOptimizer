
import React, { useMemo } from 'react';
import { ResponsiveContainer, ComposedChart, Scatter, Line, XAxis, YAxis, Tooltip, Legend, ReferenceLine, ReferenceDot } from 'recharts';
import { PortfolioStats } from '../types';

interface Props {
  frontier: PortfolioStats[];
  current: PortfolioStats;
  minVar: PortfolioStats;
  maxSharpe: PortfolioStats;
  benchmark?: PortfolioStats;
  isDarkMode?: boolean;
}

export const EfficientFrontierChart: React.FC<Props> = ({ frontier, current, minVar, maxSharpe, benchmark, isDarkMode = false }) => {
  
  // 1. Prepare Scatter Data (Cloud)
  const simulatedData = useMemo(() => frontier.map((p) => ({
    x: p.risk * 100,
    y: p.return * 100,
  })), [frontier]);

  // 2. Calculate Efficient Frontier Curve (Upper Hull)
  const frontierCurve = useMemo(() => {
    const sorted = [...simulatedData].sort((a, b) => a.x - b.x);
    const upperHull: {x: number, y: number}[] = [];
    let currentMaxReturn = -Infinity;
    
    sorted.forEach(p => {
      if (p.y > currentMaxReturn) {
        upperHull.push(p);
        currentMaxReturn = p.y;
      }
    });
    return upperHull;
  }, [simulatedData]);

  // Helper to format data for Recharts
  const createPoint = (p: PortfolioStats) => [{ x: p.risk * 100, y: p.return * 100 }];

  // Theme colors
  const axisColor = isDarkMode ? '#94a3b8' : '#64748b';
  const gridColor = isDarkMode ? '#334155' : '#e2e8f0';
  const tooltipBg = isDarkMode ? '#1e293b' : '#ffffff';
  const tooltipText = isDarkMode ? '#f8fafc' : '#1e293b';
  const scatterFill = isDarkMode ? '#475569' : '#cbd5e1';
  const curveColor = isDarkMode ? '#e2e8f0' : '#334155';
  const labelColor = isDarkMode ? '#cbd5e1' : '#475569';

  // Calculate label positions
  const maxRiskPoint = frontierCurve.length > 0 ? frontierCurve[frontierCurve.length - 1] : { x: 0, y: 0 };
  
  // Calculate a point for the CML label further up (e.g., 1.3x past MaxSharpe to be top-right)
  const cmlLabelX = maxSharpe.risk * 100 * 1.3;
  
  // CML Equation: y = riskFree + slope * x
  // Slope = (MaxSharpeReturn - RiskFree) / MaxSharpeRisk
  const riskFreePercent = 2;
  const cmlSlope = ((maxSharpe.return * 100) - riskFreePercent) / (maxSharpe.risk * 100);
  const cmlLabelY = riskFreePercent + (cmlSlope * cmlLabelX);

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow border border-slate-200 dark:border-slate-700 h-[400px] md:h-[500px] transition-colors">
      <h3 className="text-lg font-semibold mb-2 text-slate-800 dark:text-white">Efficient Frontier</h3>
      <ResponsiveContainer width="100%" height="90%">
        <ComposedChart margin={{ top: 20, right: 20, bottom: 80, left: 0 }}>
          <XAxis 
            type="number" 
            dataKey="x" 
            name="Risiko (Vol)" 
            unit="%" 
            tick={{ fontSize: 12, fill: axisColor }}
            axisLine={{ stroke: axisColor }}
            tickLine={{ stroke: axisColor }}
            label={{ value: 'Risiko (σ)', position: 'insideBottom', offset: -20, fontSize: 12, fill: axisColor }}
            domain={['auto', 'auto']}
          />
          <YAxis 
            type="number" 
            dataKey="y" 
            name="Rendite" 
            unit="%" 
            tick={{ fontSize: 12, fill: axisColor }}
            axisLine={{ stroke: axisColor }}
            tickLine={{ stroke: axisColor }}
            label={{ 
              value: 'Erwartete Rendite (μ)', 
              angle: -90, 
              position: 'insideLeft',
              style: { textAnchor: 'middle' },
              fontSize: 12,
              fill: axisColor,
              offset: 10
            }}
            domain={['auto', 'auto']}
          />
          <Tooltip 
            cursor={{ strokeDasharray: '3 3' }} 
            contentStyle={{ fontSize: '12px', backgroundColor: tooltipBg, borderColor: gridColor, color: tooltipText }}
            itemStyle={{ color: tooltipText }}
            formatter={(value: number) => [value.toFixed(2) + '%', '']}
            labelFormatter={() => ''}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            iconSize={10} 
            wrapperStyle={{ fontSize: '12px', color: axisColor, paddingTop: '40px' }}
          />
          
          {/* 1. The Cloud (Background) */}
          <Scatter name="Mögliche Portfolios" data={simulatedData} fill={scatterFill} shape="circle" r={2} />
          
          {/* 2. The Efficient Frontier Line */}
          <Scatter 
            name="Efficient Frontier" 
            data={frontierCurve} 
            line={{ stroke: curveColor, strokeWidth: 2 }} 
            shape={() => <></>} 
            legendType="none" // Hides from legend
          />
          
          {/* Label for Efficient Frontier (at the top right end of the curve) */}
          <ReferenceDot 
            x={maxRiskPoint.x} 
            y={maxRiskPoint.y} 
            r={0}
            label={{ 
              value: "Efficient Frontier", 
              position: "top", 
              fill: labelColor, 
              fontSize: 11, 
              fontWeight: 'bold' 
            }} 
          />

          {/* 3. Highlights */}
          <Scatter 
            name="Dein Portfolio" 
            data={createPoint(current)} 
            fill="#8b5cf6" 
            shape="diamond" 
            r={6} 
          />
          <Scatter 
            name="Minimiertes Risiko" 
            data={createPoint(minVar)} 
            fill="#ef4444" 
            shape="diamond" 
            r={6} 
          />
          <Scatter 
            name="Max Sharpe (Optimal)" 
            data={createPoint(maxSharpe)} 
            fill="#10b981" 
            shape="diamond" 
            r={6} 
          />
          
          {/* 4. Benchmark */}
           {benchmark && (
            <Scatter 
              name="S&P 500 (Benchmark)" 
              data={createPoint(benchmark)} 
              fill="#eab308" 
              shape="circle" 
              r={7} 
            />
          )}

          {/* 5. CML Line */}
          <ReferenceLine 
            segment={[
              { x: 0, y: 2 }, 
              { x: maxSharpe.risk * 100 * 1.5, y: (2 + (maxSharpe.return * 100 - 2) * 1.5) }
            ]} 
            stroke="#06b6d4" 
            strokeDasharray="3 3" 
            ifOverflow="extendDomain"
          />
          
          {/* Label for CML (placed explicitly near the line) */}
          <ReferenceDot 
            x={cmlLabelX} 
            y={cmlLabelY} 
            r={0} 
            label={{ 
              value: "Capital Market Line", 
              position: "top", 
              fill: "#06b6d4", 
              fontSize: 11, 
              fontWeight: 'bold',
              offset: 10
            }} 
          />
          
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
