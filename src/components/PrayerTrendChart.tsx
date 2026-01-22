import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { clsx } from 'clsx';
import { PrayerTrendDataPoint } from '../hooks/usePrayerTrends';

interface PrayerTrendChartProps {
  data: PrayerTrendDataPoint[];
  language: 'en' | 'ar';
}

interface LineConfig {
  key: keyof Pick<PrayerTrendDataPoint, 'takbirah' | 'jamaa' | 'onTime' | 'missed'>;
  label: string;
  labelAr: string;
  color: string;
}

const LINE_CONFIGS: LineConfig[] = [
  { key: 'takbirah', label: 'Takbirah', labelAr: 'تكبيرة الإحرام', color: '#f59e0b' },
  { key: 'jamaa', label: 'In Group', labelAr: 'جماعة', color: '#10b981' },
  { key: 'onTime', label: 'On Time', labelAr: 'في الوقت', color: '#3b82f6' },
  { key: 'missed', label: 'Missed', labelAr: 'فائتة', color: '#ef4444' },
];

const CustomTooltip = ({ active, payload, label, language }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-slate-900/95 backdrop-blur-sm rounded-lg p-3 shadow-xl border border-slate-700/50">
      <p className="text-xs text-gray-400 mb-2 font-medium">{label}</p>
      <div className="space-y-1">
        {payload.map((entry: any) => {
          const config = LINE_CONFIGS.find(c => c.key === entry.dataKey);
          if (!config) return null;
          return (
            <div key={entry.dataKey} className="flex items-center gap-2 text-xs">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-300">
                {language === 'ar' ? config.labelAr : config.label}
              </span>
              <span className="font-bold ml-auto" style={{ color: entry.color }}>
                {entry.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const PrayerTrendChart: React.FC<PrayerTrendChartProps> = ({ data, language }) => {
  // Only Takbirah visible by default
  const [visibleLines, setVisibleLines] = useState<Set<string>>(new Set(['takbirah']));

  const toggleLine = (key: string) => {
    setVisibleLines(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  // Sample data to show every ~7th point on x-axis for cleaner look
  const tickInterval = Math.floor(data.length / 12);

  return (
    <div className="w-full">
      {/* Legend / Toggle Controls */}
      <div className="flex flex-wrap gap-2 mb-3 px-1">
        {LINE_CONFIGS.map(config => {
          const isActive = visibleLines.has(config.key);
          return (
            <button
              key={config.key}
              onClick={() => toggleLine(config.key)}
              className={clsx(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
                isActive
                  ? 'bg-slate-800'
                  : 'bg-slate-900/50 opacity-40 hover:opacity-60'
              )}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: config.color }}
              />
              <span className={isActive ? 'text-white' : 'text-gray-500'}>
                {language === 'ar' ? config.labelAr : config.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Chart */}
      <div className="w-full h-40 -mx-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
          >
            <XAxis
              dataKey="displayDate"
              tick={{ fontSize: 9, fill: '#6b7280' }}
              tickLine={false}
              axisLine={false}
              interval={tickInterval}
            />
            <YAxis
              domain={[0, 5]}
              tick={{ fontSize: 9, fill: '#6b7280' }}
              tickLine={false}
              axisLine={false}
              width={20}
              ticks={[0, 5]}
            />
            <Tooltip content={<CustomTooltip language={language} />} />
            
            {LINE_CONFIGS.map(config => (
              <Line
                key={config.key}
                type="monotone"
                dataKey={config.key}
                stroke={config.color}
                strokeWidth={visibleLines.has(config.key) ? 2 : 0}
                dot={false}
                activeDot={visibleLines.has(config.key) ? { r: 4, strokeWidth: 0 } : false}
                hide={!visibleLines.has(config.key)}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PrayerTrendChart;
