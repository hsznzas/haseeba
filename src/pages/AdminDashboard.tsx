import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Activity, Database, Sparkles, RefreshCw, Lock, Home
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  AdminStats,
  AIAdoptionData,
  VolumeHistoryData,
  SimpleLog,
  DailyActivityData,
  getAdminStats,
  getAIAdoption,
  getVolumeHistory,
  getSimplifiedLogs,
  getTotalVolumeTrend
} from '../services/api';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, formatDistanceToNow } from 'date-fns';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [aiAdoption, setAIAdoption] = useState<AIAdoptionData | null>(null);
  const [volumeHistory, setVolumeHistory] = useState<VolumeHistoryData | null>(null);
  const [volumeTrend, setVolumeTrend] = useState<DailyActivityData[]>([]);
  const [simplifiedLogs, setSimplifiedLogs] = useState<SimpleLog[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === '5756') {
      setIsUnlocked(true);
      setError('');
      fetchData();
    } else {
      setError('Invalid passcode');
      setPasscode('');
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [baseStats, adoption, history, trend, logs] = await Promise.all([
        getAdminStats(),
        getAIAdoption(),
        getVolumeHistory(),
        getTotalVolumeTrend(30),
        getSimplifiedLogs(5),
      ]);
      
      setStats(baseStats);
      setAIAdoption(adoption);
      setVolumeHistory(history);
      setVolumeTrend(trend);
      setSimplifiedLogs(logs);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchData();
  };

  useEffect(() => {
    if (isUnlocked) {
      fetchData();
    }
  }, [isUnlocked]);

  // Passcode Modal
  if (!isUnlocked) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950">
        <div className="absolute inset-0 bg-slate-950 backdrop-blur-xl" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-md mx-4"
        >
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                <Lock size={32} className="text-primary" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-white text-center mb-2">
              Super Admin
            </h1>
            <p className="text-sm text-gray-400 text-center mb-6">
              Enter passcode to access system dashboard
            </p>

            <form onSubmit={handleUnlock} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter passcode"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white text-center text-lg tracking-widest focus:border-primary focus:outline-none transition-all font-mono"
                  autoFocus
                />
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-sm text-center"
                >
                  {error}
                </motion.p>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
              >
                Unlock Dashboard
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  // Main Dashboard
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-4 max-w-[1800px] mx-auto space-y-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">System Overview</h1>
            {lastUpdated && (
              <p className="text-xs text-gray-500 font-mono">
                {format(lastUpdated, 'MMM d, yyyy HH:mm:ss')}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-800/50 hover:bg-slate-800/50 transition-colors text-sm"
            >
              <Home size={14} />
              <span className="hidden sm:inline">Home</span>
            </button>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-800/50 hover:bg-slate-800/50 transition-colors disabled:opacity-50 text-sm"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Mobile-First Grid: 1 col mobile, 4 col desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          
          {/* Section 1: Top Row - 4 KPI Cards */}
          {stats && aiAdoption && (
            <>
              {/* Total Logs Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900/30 backdrop-blur-md border border-slate-800/50 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <Database size={18} className="text-blue-400" />
                </div>
                <div className="text-3xl font-black text-white mb-1 font-mono">
                  {stats.logs.last24h}
                </div>
                <div className="text-xs text-gray-400">Total Logs Today</div>
              </motion.div>

              {/* Active Users Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="bg-slate-900/30 backdrop-blur-md border border-slate-800/50 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <Users size={18} className="text-emerald-400" />
                </div>
                <div className="text-3xl font-black text-white mb-1 font-mono">
                  {stats.users.activeToday}
                </div>
                <div className="text-xs text-gray-400">Active Users Today</div>
              </motion.div>

              {/* AI Active Users Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-slate-900/30 backdrop-blur-md border border-slate-800/50 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <Sparkles size={18} className="text-purple-400" />
                </div>
                <div className="text-3xl font-black text-white mb-1 font-mono">
                  {aiAdoption.usersWithApiKey}/{aiAdoption.totalUsers}
                </div>
                <div className="text-xs text-gray-400 mb-2">AI Active Users</div>
                {/* Progress Bar */}
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-500 transition-all duration-500"
                    style={{ width: `${aiAdoption.adoptionRate}%` }}
                  />
                </div>
                <div className="text-xs text-purple-400 mt-1 font-mono text-right">
                  {aiAdoption.adoptionRate}%
                </div>
              </motion.div>

              {/* AI Insights Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-slate-900/30 backdrop-blur-md border border-slate-800/50 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <Activity size={18} className="text-purple-400" />
                </div>
                <div className="text-3xl font-black text-white mb-1 font-mono">
                  {stats.content.totalAiInsights}
                </div>
                <div className="text-xs text-gray-400">AI Insights Generated</div>
              </motion.div>
            </>
          )}

          {/* Section 2: Volume Trends - Line Chart (Spans all 4 columns) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-4 bg-slate-900/30 backdrop-blur-md border border-slate-800/50 rounded-xl p-4"
          >
            <h2 className="text-sm font-bold text-white mb-3 font-mono">TOTAL HABIT VOLUME (30 Days)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={volumeTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b"
                  tick={{ fontSize: 11, fontFamily: 'monospace' }}
                  tickFormatter={(value) => format(new Date(value), 'MM/dd')}
                />
                <YAxis 
                  stroke="#64748b" 
                  tick={{ fontSize: 11, fontFamily: 'monospace' }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontFamily: 'monospace'
                  }}
                  labelFormatter={(value) => format(new Date(value), 'MMM d, yyyy')}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Section 3: Lookback Console */}
          {/* Part A: Historic Snapshot (2 columns on desktop) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="lg:col-span-2 bg-slate-900/30 backdrop-blur-md border border-slate-800/50 rounded-xl p-4"
          >
            <h2 className="text-sm font-bold text-white mb-3 font-mono">VOLUME VELOCITY</h2>
            {volumeHistory && (
              <div className="grid grid-cols-2 gap-2">
                {/* Today */}
                <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-800/50">
                  <div className="text-xs text-gray-500 mb-1 font-mono">Today</div>
                  <div className="text-2xl font-black text-white font-mono">{volumeHistory.today}</div>
                </div>
                {/* Yesterday */}
                <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-800/50">
                  <div className="text-xs text-gray-500 mb-1 font-mono">Yesterday</div>
                  <div className="text-2xl font-black text-white font-mono">{volumeHistory.yesterday}</div>
                </div>
                {/* 3 Days Ago */}
                <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-800/50">
                  <div className="text-xs text-gray-500 mb-1 font-mono">3 Days Ago</div>
                  <div className="text-2xl font-black text-white font-mono">{volumeHistory.threeDaysAgo}</div>
                </div>
                {/* 7 Days Ago */}
                <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-800/50">
                  <div className="text-xs text-gray-500 mb-1 font-mono">7 Days Ago</div>
                  <div className="text-2xl font-black text-white font-mono">{volumeHistory.sevenDaysAgo}</div>
                </div>
                {/* 2 Weeks Ago */}
                <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-800/50">
                  <div className="text-xs text-gray-500 mb-1 font-mono">2 Weeks Ago</div>
                  <div className="text-2xl font-black text-white font-mono">{volumeHistory.twoWeeksAgo}</div>
                </div>
                {/* 1 Month Ago */}
                <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-800/50">
                  <div className="text-xs text-gray-500 mb-1 font-mono">1 Month Ago</div>
                  <div className="text-2xl font-black text-white font-mono">{volumeHistory.oneMonthAgo}</div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Part B: Live Stream (2 columns on desktop) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 bg-slate-900/30 backdrop-blur-md border border-slate-800/50 rounded-xl p-4"
          >
            <h2 className="text-sm font-bold text-white mb-3 font-mono">LIVE STREAM</h2>
            <div className="space-y-2">
              {simplifiedLogs.map((log) => (
                <div 
                  key={log.id}
                  className="flex items-center gap-2 p-3 bg-slate-800/30 rounded-lg border border-slate-800/50"
                >
                  <div className="flex-1 text-sm text-white font-mono">
                    {log.habit_id}
                  </div>
                  <div className="text-xs text-gray-500 font-mono">
                    • {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                  </div>
                </div>
              ))}
              {simplifiedLogs.length === 0 && (
                <div className="text-center text-gray-500 text-xs font-mono py-8">No recent logs</div>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;
