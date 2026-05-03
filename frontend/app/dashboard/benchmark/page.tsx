'use client';
import { useState } from 'react';

type BenchResult = {
  algorithm: string;
  privacy_score: number;
  utility_score: number;
  disclosure_risk: number;
  information_loss: number;
  processing_time_ms: number;
  records_processed: number;
  dpdp_compliant: boolean;
  error?: string;
};

type Tradeoff = {
  best_privacy: BenchResult | null;
  best_utility: BenchResult | null;
  best_balanced: BenchResult | null;
};

export default function BenchmarkPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<BenchResult[]>([]);
  const [tradeoff, setTradeoff] = useState<Tradeoff | null>(null);
  const [filename, setFilename] = useState('');
  const [numRecords, setNumRecords] = useState(1000);

  const handleGenAndBench = async () => {
    setLoading(true); setError(''); setResults([]); setTradeoff(null);
    try {
      // Step 1: Generate data
      const genRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ num_records: numRecords, data_type: 'medical' }),
      });
      const genData = await genRes.json();
      if (!genRes.ok) throw new Error(genData.detail || 'Data generation failed');
      setFilename(genData.filename);

      // Step 2: Run benchmark
      const benchRes = await fetch('/api/benchmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: genData.filename,
          quasi_identifiers: genData.suggestions?.quasi_identifiers || ['age', 'gender', 'zip_code'],
          sensitive_attributes: genData.suggestions?.sensitive_attributes || ['disease'],
        }),
      });
      const benchData = await benchRes.json();
      if (!benchRes.ok) throw new Error(benchData.detail || 'Benchmark failed');

      setResults(benchData.results || []);
      setTradeoff(benchData.tradeoff || null);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  const sortedResults = [...results].sort((a, b) => b.privacy_score - a.privacy_score);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold text-white">Comparative Benchmark</h2>
          <p className="text-sm text-slate-400">Run all 7 algorithms on the same dataset and compare results</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <input type="number" value={numRecords} onChange={e => setNumRecords(+e.target.value)}
              min={100} max={10000} step={100}
              className="w-24 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white text-center focus:outline-none focus:border-indigo-500" />
            <span className="text-xs text-slate-400">records</span>
          </div>
          <button onClick={handleGenAndBench} disabled={loading}
            className="btn-primary text-sm !py-2.5 min-w-[160px]">
            {loading ? (
              <span className="flex items-center gap-2 justify-center">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Running...
              </span>
            ) : '🏃 Run Full Benchmark'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-xl text-sm">⚠️ {error}</div>
      )}

      {loading && (
        <div className="glass-strong p-8 text-center">
          <div className="text-3xl mb-3 animate-pulse">⚙️</div>
          <h3 className="text-white font-semibold mb-2">Running All Algorithms...</h3>
          <p className="text-sm text-slate-400">Testing 8 configurations on {numRecords.toLocaleString()} records. This may take a moment.</p>
        </div>
      )}

      {/* Tradeoff Summary Cards */}
      {tradeoff && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: '🔒 Best Privacy', data: tradeoff.best_privacy, color: 'border-indigo-500', valueKey: 'privacy_score' as const },
            { label: '📊 Best Utility', data: tradeoff.best_utility, color: 'border-cyan-500', valueKey: 'utility_score' as const },
            { label: '⚖️ Best Balanced', data: tradeoff.best_balanced, color: 'border-emerald-500', valueKey: 'privacy_score' as const },
          ].map((card, i) => (
            <div key={i} className={`glass-strong p-5 border-l-4 ${card.color}`}>
              <div className="text-xs text-slate-400 mb-1">{card.label}</div>
              <div className="text-white font-semibold text-sm truncate">{card.data?.algorithm || '—'}</div>
              {card.data && (
                <div className="text-sm mt-1">
                  <span className="text-indigo-400">P: {card.data.privacy_score.toFixed(3)}</span>
                  <span className="text-slate-500 mx-1">|</span>
                  <span className="text-cyan-400">U: {card.data.utility_score.toFixed(3)}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Results Table */}
      {sortedResults.length > 0 && (
        <div className="glass overflow-hidden">
          <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
            <span className="text-sm font-semibold text-white">Comparison Table ({sortedResults.length} configurations)</span>
            <span className="text-[10px] text-slate-500">{filename} • {numRecords.toLocaleString()} records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-3 px-5 text-slate-400 font-medium">Algorithm</th>
                  <th className="text-left py-3 px-5 text-slate-400 font-medium">Privacy ↑</th>
                  <th className="text-left py-3 px-5 text-slate-400 font-medium">Utility ↑</th>
                  <th className="text-left py-3 px-5 text-slate-400 font-medium">Risk ↓</th>
                  <th className="text-left py-3 px-5 text-slate-400 font-medium">Info Loss ↓</th>
                  <th className="text-right py-3 px-5 text-slate-400 font-medium">Time</th>
                  <th className="text-center py-3 px-5 text-slate-400 font-medium">DPDP</th>
                </tr>
              </thead>
              <tbody>
                {sortedResults.map((row, i) => (
                  <tr key={i} className={`border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors ${row.error ? 'opacity-40' : ''}`}>
                    <td className="py-3 px-5 text-white font-medium text-xs">{row.algorithm}</td>
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${row.privacy_score * 100}%` }} />
                        </div>
                        <span className="text-xs text-slate-400 w-10">{row.privacy_score.toFixed(2)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${row.utility_score * 100}%` }} />
                        </div>
                        <span className="text-xs text-slate-400 w-10">{row.utility_score.toFixed(2)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-5">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        row.disclosure_risk < 0.05 ? 'bg-emerald-500/10 text-emerald-400'
                        : row.disclosure_risk < 0.15 ? 'bg-amber-500/10 text-amber-400'
                        : 'bg-red-500/10 text-red-400'
                      }`}>{row.disclosure_risk.toFixed(3)}</span>
                    </td>
                    <td className="py-3 px-5 text-xs text-slate-400">{row.information_loss.toFixed(3)}</td>
                    <td className="py-3 px-5 text-right text-xs text-slate-500">{row.processing_time_ms.toFixed(0)}ms</td>
                    <td className="py-3 px-5 text-center text-xs">{row.dpdp_compliant ? '✅' : '❌'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Charts */}
      {sortedResults.length > 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Privacy vs Utility scatter */}
          <div className="glass-strong p-6">
            <h4 className="text-sm font-semibold text-white mb-4">📈 Privacy vs Utility Tradeoff</h4>
            <div className="relative h-52 border-l border-b border-white/10 ml-6 mb-6">
              {sortedResults.filter(r => !r.error).map((d, i) => (
                <div key={i} className="absolute group" style={{
                  left: `${Math.min(d.privacy_score * 90, 90)}%`,
                  bottom: `${Math.min(d.utility_score * 85, 85)}%`,
                }}>
                  <div className="w-3 h-3 rounded-full bg-indigo-500 cursor-pointer hover:scale-[2] transition-transform ring-2 ring-indigo-500/20" />
                  <div className="hidden group-hover:block absolute bottom-5 left-1/2 -translate-x-1/2 bg-bg border border-white/10 px-2 py-1 rounded text-[9px] text-white whitespace-nowrap z-10 shadow-xl">
                    {d.algorithm}<br />P={d.privacy_score.toFixed(2)} U={d.utility_score.toFixed(2)}
                  </div>
                </div>
              ))}
              <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-slate-500">Privacy →</div>
              <div className="absolute top-1/2 -left-6 -translate-y-1/2 text-[9px] text-slate-500" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg) translateY(50%)' }}>Utility →</div>
            </div>
          </div>

          {/* Processing time bars */}
          <div className="glass-strong p-6">
            <h4 className="text-sm font-semibold text-white mb-4">⏱️ Processing Time</h4>
            <div className="space-y-2.5">
              {[...sortedResults].filter(r => !r.error).sort((a, b) => b.processing_time_ms - a.processing_time_ms).map((d, i) => {
                const maxTime = Math.max(...sortedResults.map(r => r.processing_time_ms));
                return (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-28 text-[10px] text-slate-400 truncate text-right">{d.algorithm.split('(')[0]}</div>
                    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" style={{ width: `${(d.processing_time_ms / Math.max(maxTime, 1)) * 100}%` }} />
                    </div>
                    <div className="w-14 text-right text-[10px] text-slate-500">{d.processing_time_ms.toFixed(0)}ms</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Initial state */}
      {results.length === 0 && !loading && (
        <div className="glass-strong p-10 text-center">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-white font-semibold text-lg mb-2">No Benchmark Results Yet</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
            Click "Run Full Benchmark" to generate synthetic data and test all 8 algorithm configurations automatically.
            Results will include privacy scores, utility scores, disclosure risk, and processing times.
          </p>
          <button onClick={handleGenAndBench} className="btn-primary">🏃 Run Full Benchmark</button>
        </div>
      )}
    </div>
  );
}
