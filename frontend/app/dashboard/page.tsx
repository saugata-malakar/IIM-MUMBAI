'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const quickActions = [
  { href: '/dashboard/anonymize', icon: '🔒', title: 'New Anonymization', desc: 'Upload data and run algorithms', color: 'from-indigo-500/20 to-violet-500/10' },
  { href: '/dashboard/benchmark', icon: '📊', title: 'Run Benchmark', desc: 'Compare all 7 algorithms', color: 'from-cyan-500/20 to-blue-500/10' },
  { href: '/dashboard/datasets', icon: '📁', title: 'Generate Data', desc: 'Create synthetic medical records', color: 'from-emerald-500/20 to-green-500/10' },
  { href: '/dashboard/compliance', icon: '✅', title: 'DPDP Report', desc: 'Check compliance status', color: 'from-amber-500/20 to-orange-500/10' },
];

const algorithms = [
  { name: 'k-Anonymity', privacy: 0.85, utility: 0.72 },
  { name: 'ℓ-Diversity', privacy: 0.78, utility: 0.81 },
  { name: 't-Closeness', privacy: 0.82, utility: 0.75 },
  { name: 'Differential Privacy', privacy: 0.92, utility: 0.68 },
  { name: 'Chaos Perturbation', privacy: 0.70, utility: 0.88 },
  { name: 'Pseudonymization', privacy: 0.95, utility: 0.90 },
  { name: 'PII Redaction', privacy: 0.88, utility: 0.85 },
];

export default function DashboardPage() {
  const [userName, setUserName] = useState('Researcher');

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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Algorithms Available', value: '7', icon: '🔐', tag: 'Production-ready' },
          { label: 'Evaluation Metrics', value: '5', icon: '📐', tag: 'Standardized' },
          { label: 'Papers Studied', value: '30+', icon: '📄', tag: 'Peer-reviewed' },
          { label: 'Compliance Score', value: '100%', icon: '✅', tag: 'DPDP 2023' },
        ].map((s, i) => (
          <div key={i} className="glass p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{s.icon}</span>
              <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">{s.tag}</span>
            </div>
            <div className="text-2xl font-display font-bold text-white">{s.value}</div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
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
                <th className="text-left py-3 px-5 text-slate-400 font-medium">Algorithm</th>
                <th className="text-left py-3 px-5 text-slate-400 font-medium">Privacy Score</th>
                <th className="text-left py-3 px-5 text-slate-400 font-medium">Utility Score</th>
                <th className="text-center py-3 px-5 text-slate-400 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {algorithms.map((a, i) => (
                <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-5 text-white font-medium">{a.name}</td>
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" style={{ width: `${a.privacy * 100}%` }} />
                      </div>
                      <span className="text-xs text-slate-400">{(a.privacy * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" style={{ width: `${a.utility * 100}%` }} />
                      </div>
                      <span className="text-xs text-slate-400">{(a.utility * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-5 text-center text-emerald-400">✅</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
