
import React from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { CURRENCY_SYMBOL } from '../constants';

interface MarketChartProps {
  data: { time: number; price: number }[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dark-900/90 backdrop-blur-xl border border-gold-500/30 p-3 rounded-xl shadow-2xl animate-in fade-in zoom-in duration-200">
        <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1">Registro Temporal</p>
        <p className="text-sm font-bold text-white mb-1">
          {new Date(payload[0].payload.time).toLocaleTimeString('pt-BR')}
        </p>
        <div className="h-px bg-dark-800 my-2"></div>
        <p className="text-xl font-mono font-black text-gold-500">
          {CURRENCY_SYMBOL} {payload[0].value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
      </div>
    );
  }
  return null;
};

export const MarketChart: React.FC<MarketChartProps> = ({ data }) => {
  const formattedData = data.map(d => ({
    ...d,
    formattedTime: new Date(d.time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }));

  const prices = data.map(d => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  return (
    <div className="w-full h-[350px] relative">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formattedData}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="5 5" stroke="#18181b" vertical={false} />
          <XAxis 
            dataKey="formattedTime" 
            stroke="#3f3f46" 
            fontSize={10} 
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis 
            domain={[minPrice * 0.98, maxPrice * 1.02]} 
            stroke="#3f3f46" 
            fontSize={10} 
            tickFormatter={(value) => `${CURRENCY_SYMBOL}${value.toFixed(0)}`}
            tickLine={false}
            axisLine={false}
            dx={-10}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#f59e0b', strokeWidth: 1, strokeDasharray: '4 4' }} />
          <Area 
            type="monotone" 
            dataKey="price" 
            stroke="#f59e0b" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorPrice)" 
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
