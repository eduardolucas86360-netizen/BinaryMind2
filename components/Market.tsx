
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
      <div className="bg-[#1c1c1c] border border-nuPurple/30 p-3 rounded-2xl shadow-xl">
        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Cotação</p>
        <p className="text-sm font-black text-white">
          {CURRENCY_SYMBOL} {payload[0].value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
        <p className="text-[9px] text-gray-500 font-mono">
          {new Date(payload[0].payload.time).toLocaleTimeString('pt-BR')}
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
    <div className="w-full h-[220px] mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formattedData}>
          <defs>
            <linearGradient id="colorNu" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#820ad1" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#820ad1" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#820ad1', strokeWidth: 1, strokeDasharray: '4 4' }} />
          <Area 
            type="monotone" 
            dataKey="price" 
            stroke="#820ad1" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorNu)" 
            animationDuration={1000}
            activeDot={{ r: 6, fill: '#820ad1', stroke: '#000', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
