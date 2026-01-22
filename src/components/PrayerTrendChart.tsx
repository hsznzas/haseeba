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
import { usePrayerTrends, PrayerTrendDataPoint, PrayerFilter, PRAYER_IDS } from '../hooks/usePrayerTrends';
import { HabitLog } from '../../types';

interface PrayerTrendChartProps {
  logs: HabitLog[];
  language: 'en' | 'ar';
}

interface LineConfig {
  key: keyof Pick<PrayerTrendDataPoint, 'takbirah' | 'jamaa' | 'onTime' | 'missed'>;
  rawKey: keyof Pick<PrayerTrendDataPoint, 'rawTakbirah' | 'rawJamaa' | 'rawOnTime' | 'rawMissed'>;
  label: string;
  labelAr: string;
  color: string;
}

interface FilterOption {
  id: PrayerFilter;
  label: string;
  labelAr: string;
}

const FILTER_OPTIONS: FilterOption[] = [
  { id: 'all', label: 'All', labelAr: 'الكل' },
  { id: 'fajr', label: 'Fajr', labelAr: 'الفجر' },
  { id: 'dhuhr', label: 'Dhuhr', labelAr: 'الظهر' },
  { id: 'asr', label: 'Asr', labelAr: 'العصر' },
  { id: 'maghrib', label: 'Maghrib', labelAr: 'المغرب' },
  { id: 'isha', label: 'Isha', labelAr: 'العشاء' },
];

// Colors matching the quality breakdown in AllPrayersInsightCard
const LINE_CONFIGS: LineConfig[] = [
  { key: 'takbirah', rawKey: 'rawTakbirah', label: 'Takbirah', labelAr: 'تكبيرة الإحرام', color: '#3b82f6' },
  { key: 'jamaa', rawKey: 'rawJamaa', label: 'In Group', labelAr: 'جماعة', color: '#eab308' },
  { key: 'onTime', rawKey: 'rawOnTime', label: 'On Time', labelAr: 'في الوقت', color: '#f97316' },
  { key: 'missed', rawKey: 'rawMissed', label: 'Missed', labelAr: 'فائتة', color: '#ef4444' },
];

const CustomTooltip = ({ active, payload, label, language, isSpecificPrayer }: any) => {
  if (!active || !payload || !payload.length) return null;

  const dataPoint = payload[0]?.payload as PrayerTrendDataPoint | undefined;

  return (
    <div className="bg-slate-900/95 backdrop-blur-sm rounded-lg p-3 shadow-xl border border-slate-700/50">
      <p className="text-xs text-gray-400 mb-2 font-medium">{label}</p>
      <p className="text-[10px] text-gray-500 mb-2 uppercase tracking-wider">
        {language === 'ar' ? 'متوسط 7 أيام' : '7-Day Average'}
      </p>
      <div className="space-y-1.5">
        {payload.map((entry: any) => {
          const config = LINE_CONFIGS.find(c => c.key === entry.dataKey);
          if (!config) return null;
          const rawValue = dataPoint ? dataPoint[config.rawKey] : 0;
          // For specific prayer, show as percentage
          const displayValue = isSpecificPrayer 
            ? `${Math.round(entry.value * 100)}%`
            : entry.value;
          return (
            <div key={entry.dataKey} className="flex items-center gap-2 text-xs">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-300 flex-1">
                {language === 'ar' ? config.labelAr : config.label}
              </span>
              <span className="font-bold tabular-nums" style={{ color: entry.color }}>
                {displayValue}
              </span>
              <span className="text-gray-500 text-[10px] tabular-nums">
                ({rawValue})
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const PrayerTrendChart: React.FC<PrayerTrendChartProps> = ({ logs, language }) => {
  const [selectedPrayer, setSelectedPrayer] = useState<PrayerFilter>('all');
  const [visibleLines, setVisibleLines] = useState<Set<string>>(new Set(['takbirah']));

  // Get trend data based on selected prayer filter
  const data = usePrayerTrends(logs, selectedPrayer, 90);

  const isSpecificPrayer = selectedPrayer !== 'all';
  const yAxisDomain: [number, number] = isSpecificPrayer ? [0, 1] : [0, 5];
  const yAxisTicks = isSpecificPrayer ? [0, 0.5, 1] : [0, 5];

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

  const tickInterval = Math.floor(data.length / 12);

  return (
    <div className="w-full">
      {/* Prayer Filter */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {FILTER_OPTIONS.map(option => {
          const isActive = selectedPrayer === option.id;
          return (
            <button
              key={option.id}
              onClick={() => setSelectedPrayer(option.id)}
              className={clsx(
                'px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all border',
                isActive
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                  : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/50'
              )}
            >
              {language === 'ar' ? option.labelAr : option.label}
            </button>
          );
        })}
      </div>

      {/* Quality Toggle Controls */}
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
              domain={yAxisDomain}
              tick={{ fontSize: 9, fill: '#6b7280' }}
              tickLine={false}
              axisLine={false}
              width={25}
              ticks={yAxisTicks}
              tickFormatter={isSpecificPrayer ? (v) => `${Math.round(v * 100)}%` : undefined}
            />
            <Tooltip content={<CustomTooltip language={language} isSpecificPrayer={isSpecificPrayer} />} />
            
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
