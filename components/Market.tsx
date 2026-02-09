
import React from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { CURRENCY_SYMBOL } from '../constants';

interface MarketChartProps {
  data: { time: number; price: number }[];
  onHoverPrice?: (price: number | null) => void;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dark-950/90 backdrop-blur-2xl border border-gold-500/20 p-4 rounded-2xl shadow-2xl animate-in zoom-in duration-150">
        <p className="text-[10px] text-zinc-500 uppercase font-black tracking-[0.2em] mb-2">Ponto de Auditoria</p>
        <div className="flex flex-col gap-1">
          <span className="text-2xl font-mono font-black text-white">
            {CURRENCY_SYMBOL} {payload[0].value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-zinc-400 font-mono">
            {new Date(payload[0].payload.time).toLocaleTimeString('pt-BR')}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export const MarketChart: React.FC<MarketChartProps> = ({ data, onHoverPrice }) => {
  const formattedData = data.map(d => ({
    ...d,
    formattedTime: new Date(d.time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }));

  const prices = data.map(d => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  const handleMouseMove = (state: any) => {
    if (state.activePayload && onHoverPrice) {
      onHoverPrice(state.activePayload[0].payload.price);
    }
  };

  const handleMouseLeave = () => {
    if (onHoverPrice) onHoverPrice(null);
  };

  return (
    <div className="w-full h-[400px] relative group">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart 
          data={formattedData} 
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3}/>
              <stop offset="100%" stopColor="#f59e0b" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="10 10" stroke="#18181b" vertical={false} />
          <XAxis 
            dataKey="formattedTime" 
            stroke="#3f3f46" 
            fontSize={9} 
            tickLine={false}
            axisLine={false}
            dy={15}
          />
          <YAxis 
            domain={[minPrice * 0.95, maxPrice * 1.05]} 
            stroke="#3f3f46" 
            fontSize={9} 
            tickFormatter={(value) => `${CURRENCY_SYMBOL}${value.toFixed(0)}`}
            tickLine={false}
            axisLine={false}
            dx={-10}
          />
          <Tooltip 
            content={<CustomTooltip />} 
            cursor={{ stroke: '#f59e0b', strokeWidth: 1.5, strokeDasharray: '4 4' }} 
            isAnimationActive={false}
          />
          <Area 
            type="monotone" 
            dataKey="price" 
            stroke="#f59e0b" 
            strokeWidth={4}
            fillOpacity={1} 
            fill="url(#colorPrice)" 
            animationDuration={800}
            activeDot={{ r: 6, fill: '#f59e0b', stroke: '#000', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
