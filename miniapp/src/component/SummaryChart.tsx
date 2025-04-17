import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '../lib/utils';

interface SummaryChartProps {
  data: Array<{
    name: string;
    value: number;
    [key: string]: any;
  }>;
  className?: string;
  areaColor?: string;
  height?: number;
}

const SummaryChart = ({ 
  data, 
  className,
  areaColor = "#0ea5e9",
  height = 200
}: SummaryChartProps) => {
  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={data}
          margin={{
            top: 10,
            right: 0,
            left: 0,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={areaColor} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={areaColor} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
          <XAxis 
            dataKey="name" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
          />
          <YAxis 
            hide={true}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(15, 23, 42, 0.8)', 
              borderColor: 'rgba(255,255,255,0.1)',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
            }}
            labelStyle={{ color: 'white' }}
            itemStyle={{ color: 'white' }}
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke={areaColor} 
            strokeWidth={2}
            fill="url(#colorGradient)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SummaryChart;
