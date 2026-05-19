'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

// Custom hook to animate numbers counting up
function useCountUp(endValue: number, durationMs: number = 1000) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / durationMs, 1);
      // easeOutExpo
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(easeProgress * endValue));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(endValue);
      }
    };
    window.requestAnimationFrame(step);
  }, [endValue, durationMs]);

  return count;
}

// Component for a live stat card
const LiveStatCard = ({ label, value, icon, tag, isPercentage = false, isLive = false, color = 'emerald' }: any) => {
  const [targetValue, setTargetValue] = useState(value);
  const [flash, setFlash] = useState(false);
  const numericValue = typeof targetValue === 'number' ? targetValue : parseInt(targetValue.toString().replace(/\D/g, '')) || 0;
  const animatedValue = useCountUp(numericValue, 1500);

  useEffect(() => {
    if (value !== targetValue) {
      setTargetValue(value);
      setFlash(true);
      setTimeout(() => setFlash(false), 800);
    }
  }, [value, targetValue]);

  const displayValue = isPercentage ? `${animatedValue}%` : (typeof targetValue === 'string' && targetValue.includes('+') ? `${animatedValue}+` : animatedValue.toLocaleString());

  // Determine dot color
  const dotColor = color === 'emerald' ? 'bg-emerald-500' : 'bg-amber-500';
  const pulseColor = color === 'emerald' ? 'bg-emerald-500/40' : 'bg-amber-500/40';

  return (
    <div className={`glass p-5 relative transition-all duration-300 ${flash ? 'ring-2 ring-emerald-500/50 bg-emerald-500/10' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <div className="flex items-center gap-2">
          {isLive && (
            <div className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${pulseColor} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`}></span>
            </div>
          )}
          <span className={`text-[10px] text-${color}-400 bg-${color}-400/10 px-2 py-0.5 rounded-full`}>{tag}</span>
        </div>
      </div>
      <div className="text-2xl font-display font-bold text-white tabular-nums">{displayValue}</div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </div>
  );
};

const quickActions = [
  { href: '/dashboard/anonymize', icon: '🔒', title: 'New Anonymization', desc: 'Upload data and run algorithms', color: 'from-indigo-500/20 to-violet-500/10' },
  { href: '/dashboard/benchmark', icon: '📊', title: 'Run Benchmark', desc: 'Compare all 7 algorithms', color: 'from-cyan-500/20 to-blue-500/10' },
  { href: '/dashboard/datasets', icon: '📁', title: 'Generate Data', desc: 'Create synthetic medical records', color: 'from-emerald-500/20 to-green-500/10' },
  { href: '/dashboard/compliance', icon: '✅', title: 'DPDP Report', desc: 'Check compliance status', color: 'from-amber-500/20 to-orange-500/10' },
];

const INITIAL_ALGORITHMS = [
  { name: 'k-Anonymity', privacy: 0.85, utility: 0.72, records: 5000 },
  { name: 'ℓ-Diversity', privacy: 0.78, utility: 0.81, records: 5000 },
  { name: 't-Closeness', privacy: 0.82, utility: 0.75, records: 5000 },
  { name: 'Differential Privacy', privacy: 0.92, utility: 0.68, records: 10000 },
  { name: 'Chaos Perturbation', privacy: 0.70, utility: 0.88, records: 15000 },
  { name: 'Pseudonymization', privacy: 0.95, utility: 0.90, records: 20000 },
  { name: 'PII Redaction', privacy: 0.88, utility: 0.85, records: 1200 },
];

export default function DashboardPage() {
  const [userName, setUserName] = useState('Researcher');
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState({
    algorithms: 7,
    metrics: 5,
    papers: 34,
    compliance: 100,
    records_processed: 15000
  });

  const [algorithms, setAlgorithms] = useState<any[]>(INITIAL_ALGORITHMS);

  // Polling for live dashboard summary every 5 seconds
  useEffect(() => {
    setMounted(true);
    const fetchStats = async () => {
      try {
        const res = await fetch('http://localhost:8003/api/dashboard/summary');
        if (res.ok) {
          const data = await res.json();
          if (data.stats) {
            setStats(prev => ({
              ...prev,
              ...data.stats,
            }));
          }
          if (data.algorithms) {
            setAlgorithms(data.algorithms);
          }
        }
      } catch (err) {
        // Silently fail if backend is down
      }
    };
    
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const cookies = document.cookie.split(';');
    const authCookie = cookies.find(c => c.trim().startsWith('medshield_auth='));
    if (authCookie) {
      try {
        const encoded = authCookie.split('=')[1];
        const decoded = JSON.parse(atob(decodeURIComponent(encoded)));
        setUserName(decoded.name || decoded.email?.split('@')[0] || 'Researcher');
      } catch {}
    }
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="glass-strong p-8 relative overflow-hidden">
        <div className="glow-orb glow-indigo w-[300px] h-[300px] -top-40 -right-20 !opacity-10" />
        <h2 className="text-2xl font-display font-bold text-white mb-2">
          Welcome back, <span className="gradient-text">{userName}</span> 👋
        </h2>
        <p className="text-slate-400 text-sm max-w-xl">
          Your medical data anonymization toolkit is ready. Upload data, run algorithms, and generate DPDP-compliant reports.
        </p>
      </div>

      {/* Stats - Live Polling */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <LiveStatCard label="Algorithms Active" value={stats.algorithms} icon="🔐" tag="Live Monitoring" isLive={true} />
        <LiveStatCard label="Records Processed" value={stats.records_processed} icon="🗂️" tag="Real-time" isLive={true} color="cyan" />
        <LiveStatCard label="Papers Backed" value={stats.papers} icon="📄" tag="Peer-reviewed" />
        <LiveStatCard 
          label="DPDP Compliance" 
          value={stats.compliance} 
          icon="✅" 
          tag={stats.compliance === 100 ? 'Compliant' : 'Warning'} 
          isPercentage={true} 
          isLive={true}
          color={stats.compliance === 100 ? 'emerald' : 'amber'}
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-display font-semibold text-white mb-4">🚀 Quick Actions</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((a, i) => (
            <Link key={i} href={a.href} className="feature-card group !p-5">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${a.color} flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform`}>{a.icon}</div>
              <h4 className="text-white font-semibold text-sm">{a.title}</h4>
              <p className="text-xs text-slate-500 mt-1">{a.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Algorithm Table */}
      <div>
        <h3 className="text-lg font-display font-semibold text-white mb-4">📋 Algorithm Overview</h3>
        <div className="glass overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left py-3 px-6 text-slate-400 font-medium w-1/4">Algorithm</th>
                <th className="text-left py-3 px-5 text-slate-400 font-medium w-1/4">Privacy Score</th>
                <th className="text-left py-3 px-5 text-slate-400 font-medium w-1/4">Utility Score</th>
                <th className="text-center py-3 px-5 text-slate-400 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {algorithms.map((a, i) => {
                // Determine left border color based on score balance
                let borderClass = "border-l-4 border-transparent";
                if (a.privacy > 0.9) borderClass = "border-l-4 border-purple-500";
                else if (a.utility > 0.85) borderClass = "border-l-4 border-cyan-500";
                else borderClass = "border-l-4 border-amber-500";

                return (
                  <tr 
                    key={i} 
                    className={`border-b border-white/[0.03] hover:bg-white/[0.03] transition-all duration-300 group ${borderClass}`}
                    style={{ 
                      opacity: mounted ? 1 : 0, 
                      transform: mounted ? 'translateY(0)' : 'translateY(10px)',
                      transitionDelay: `${i * 80}ms` 
                    }}
                  >
                    <td className="py-4 px-5 text-white font-medium relative">
                      {a.name}
                      {/* Tooltip on hover */}
                      <div className="absolute left-5 top-full mt-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-[10px] text-slate-300 px-2 py-1 rounded shadow-lg pointer-events-none whitespace-nowrap">
                        Last Run: {a.last_run || 'Just now'} • Records: {a.records?.toLocaleString() || 0}
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-1000 ease-out" 
                            style={{ width: mounted ? `${a.privacy * 100}%` : '0%' }} 
                          />
                        </div>
                        <span className="text-xs text-slate-400 tabular-nums">{(a.privacy * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 rounded-full transition-all duration-1000 ease-out delay-150" 
                            style={{ width: mounted ? `${a.utility * 100}%` : '0%' }} 
                          />
                        </div>
                        <span className="text-xs text-slate-400 tabular-nums">{(a.utility * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
