import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { CURRENCY_SYMBOL } from '../constants';

interface MarketChartProps {
  data: { time: number; price: number }[];
}

export const MarketChart: React.FC<MarketChartProps> = ({ data }) => {
  const formattedData = data.map(d => ({
    ...d,
    formattedTime: new Date(d.time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }));

  const minPrice = Math.min(...data.map(d => d.price));
  const maxPrice = Math.max(...data.map(d => d.price));

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formattedData}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis 
            dataKey="formattedTime" 
            stroke="#52525b" 
            fontSize={12} 
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            domain={[minPrice * 0.95, maxPrice * 1.05]} 
            stroke="#52525b" 
            fontSize={12} 
            tickFormatter={(value) => `${CURRENCY_SYMBOL}${value.toFixed(0)}`}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
            itemStyle={{ color: '#f59e0b' }}
            formatter={(value: number) => [`${CURRENCY_SYMBOL} ${value.toFixed(2)}`, 'Preço']}
            labelStyle={{ color: '#a1a1aa' }}
          />
          <Area 
            type="monotone" 
            dataKey="price" 
            stroke="#f59e0b" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorPrice)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};