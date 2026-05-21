'use client';
import { useState, useEffect, useRef } from 'react';

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
  status?: 'queued' | 'running' | 'complete' | 'failed';
};

type Tradeoff = {
  best_privacy: BenchResult | null;
  best_utility: BenchResult | null;
  best_balanced: BenchResult | null;
};

// CountUp Component for score counters
const ScoreCounter = ({ value, isPercentage = false }: { value: number, isPercentage?: boolean }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const durationMs = 1000;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / durationMs, 1);
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(easeProgress * value);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(value);
      }
    };
    window.requestAnimationFrame(step);
  }, [value]);

  return <span>{isPercentage ? `${(count * 100).toFixed(0)}%` : count.toFixed(2)}</span>;
};

export default function BenchmarkPage() {
  const [streamState, setStreamState] = useState<'idle' | 'running' | 'done'>('idle');
  const [error, setError] = useState('');
  const [results, setResults] = useState<BenchResult[]>([]);
  const [tradeoff, setTradeoff] = useState<Tradeoff | null>(null);
  const [filename, setFilename] = useState('');
  const [numRecords, setNumRecords] = useState(1000);
  
  // Streaming state
  const [totalAlgos, setTotalAlgos] = useState(7);
  const [completedAlgos, setCompletedAlgos] = useState(0);
  const [activeAlgo, setActiveAlgo] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const logsEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  useEffect(() => {
    let timer: any;
    if (streamState === 'running') {
      timer = setInterval(() => setElapsedSeconds(prev => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [streamState]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleGenAndBench = async () => {
    setStreamState('running');
    setError('');
    setResults([]);
    setTradeoff(null);
    setLogs(['Initializing benchmark sequence...']);
    setCompletedAlgos(0);
    setElapsedSeconds(0);
    
    try {
      // Step 1: Generate data
      setLogs(prev => [...prev, `Generating ${numRecords} synthetic medical records...`]);
      const genRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ num_records: numRecords, data_type: 'medical' }),
      });
      const genData = await genRes.json();
      if (!genRes.ok) throw new Error(genData.detail || 'Data generation failed');
      setFilename(genData.filename);
      setLogs(prev => [...prev, `Data generated: ${genData.filename}. Starting algorithms...`]);

      // Prepare query params
      const qi = (genData.suggestions?.quasi_identifiers || ['age', 'gender', 'zip_code']).join(',');
      const sa = (genData.suggestions?.sensitive_attributes || ['disease']).join(',');
      
      const query = new URLSearchParams({
        filename: genData.filename,
        quasi_identifiers: qi,
        sensitive_attributes: sa
      });

      // Step 2: Open SSE stream
      const eventSource = new EventSource(`/api/benchmark/stream?${query.toString()}`);

      eventSource.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        
        if (payload.type === 'init') {
          setTotalAlgos(payload.total);
          // Pre-populate queue
          const queue: BenchResult[] = Array(payload.total).fill(0).map((_, i) => ({
            algorithm: `Pending Algorithm ${i+1}`,
            privacy_score: 0, utility_score: 0, disclosure_risk: 1, information_loss: 1,
            processing_time_ms: 0, records_processed: 0, dpdp_compliant: false, status: 'queued'
          }));
          setResults(queue);
        }
        else if (payload.type === 'progress') {
          setActiveAlgo(payload.algorithm);
          setLogs(prev => [...prev, `[${formatTime(elapsedSeconds)}] Running ${payload.algorithm} on ${numRecords} records...`]);
          setResults(prev => {
            const next = [...prev];
            const idx = next.findIndex(r => r.status === 'queued');
            if (idx !== -1) {
              next[idx] = { ...next[idx], algorithm: payload.algorithm, status: 'running' };
            }
            return next;
          });
        }
        else if (payload.type === 'result') {
          setCompletedAlgos(prev => prev + 1);
          setLogs(prev => [...prev, `[${formatTime(elapsedSeconds)}] ✓ ${payload.data.algorithm} completed in ${payload.data.processing_time_ms}ms.`]);
          setResults(prev => {
            const next = [...prev];
            const idx = next.findIndex(r => r.algorithm === payload.data.algorithm && r.status === 'running');
            if (idx !== -1) {
              next[idx] = { ...payload.data, status: payload.data.error ? 'failed' : 'complete' };
            }
            return next;
          });
        }
        else if (payload.type === 'done') {
          setTradeoff(payload.tradeoff);
          setStreamState('done');
          setLogs(prev => [...prev, `[${formatTime(elapsedSeconds)}] All benchmarks completed successfully.`]);
          eventSource.close();
        }
        else if (payload.type === 'error') {
          setError(payload.message);
          setStreamState('idle');
          eventSource.close();
        }
      };

      eventSource.onerror = () => {
        setError("Connection to stream lost.");
        setStreamState('idle');
        eventSource.close();
      };

    } catch (e: any) {
      setError(e.message);
      setStreamState('idle');
    }
  };

  const sortedResults = [...results]
    .filter(r => r.status === 'complete' || r.status === 'failed')
    .sort((a, b) => b.privacy_score - a.privacy_score);

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
              min={100} max={10000} step={100} disabled={streamState === 'running'}
              className="w-24 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white text-center focus:outline-none focus:border-indigo-500 disabled:opacity-50" />
            <span className="text-xs text-slate-400">records</span>
          </div>
          <button onClick={handleGenAndBench} disabled={streamState === 'running'}
            className="btn-primary text-sm !py-2.5 min-w-[160px]">
            {streamState === 'running' ? 'Streaming...' : '🏃 Run Full Benchmark'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-xl text-sm">⚠️ {error}</div>
      )}

      {/* Live Progress Panel */}
      {streamState === 'running' && (
        <div className="glass-strong p-6 border border-cyan-500/30 shadow-[0_0_30px_rgba(0,212,255,0.1)] relative">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </span>
              Live Benchmark Progress
            </h3>
            <div className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
              Running for {formatTime(elapsedSeconds)}
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>{completedAlgos} of {totalAlgos} completed</span>
              <span>{Math.round((completedAlgos / totalAlgos) * 100)}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300 ease-out" 
                   style={{ width: `${(completedAlgos / totalAlgos) * 100}%` }} />
            </div>
          </div>

          <div className="space-y-2 mb-6">
            {results.map((r, i) => (
              <div key={i} className={`flex items-center justify-between p-3 rounded-lg border ${r.status === 'running' ? 'bg-cyan-500/5 border-cyan-500/20' : r.status === 'complete' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white/5 border-white/5'}`}>
                <div className="flex items-center gap-3">
                  {r.status === 'queued' && <span className="text-slate-500 text-sm">⏳</span>}
                  {r.status === 'running' && <span className="w-4 h-4 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />}
                  {r.status === 'complete' && <span className="text-emerald-400 text-sm">✅</span>}
                  {r.status === 'failed' && <span className="text-red-400 text-sm">❌</span>}
                  
                  <span className={`text-sm ${r.status === 'running' ? 'text-cyan-400' : r.status === 'complete' ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {r.algorithm}
                  </span>
                </div>
                
                {r.status === 'running' && <span className="text-xs text-cyan-500/70 animate-pulse">Processing...</span>}
                {r.status === 'complete' && (
                  <div className="flex gap-4 text-xs font-mono">
                    <span className="text-indigo-400">P: <ScoreCounter value={r.privacy_score} /></span>
                    <span className="text-cyan-400">U: <ScoreCounter value={r.utility_score} /></span>
                    <span className="text-slate-500">{r.processing_time_ms}ms</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="bg-[#0a0a0f] border border-white/5 rounded-lg p-3 h-32 overflow-y-auto font-mono text-[10px] text-slate-400">
            {logs.map((log, i) => (
              <div key={i} className={`mb-1 ${log.includes('✓') ? 'text-emerald-400' : log.includes('error') ? 'text-red-400' : ''}`}>
                {log}
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}

      {/* Tradeoff Summary Cards */}
      {streamState === 'done' && tradeoff && (
        <div className="grid grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {[
            { label: '🔒 Best Privacy', data: tradeoff.best_privacy, color: 'border-indigo-500', valueKey: 'privacy_score' as const },
            { label: '📊 Best Utility', data: tradeoff.best_utility, color: 'border-cyan-500', valueKey: 'utility_score' as const },
            { label: '⚖️ Best Balanced', data: tradeoff.best_balanced, color: 'border-emerald-500', valueKey: 'privacy_score' as const },
          ].map((card, i) => (
            <div key={i} className={`glass-strong p-5 border-l-4 ${card.color}`}>
              <div className="text-xs text-slate-400 mb-1">{card.label}</div>
              <div className="text-white font-semibold text-sm truncate">{card.data?.algorithm || '—'}</div>
              {card.data && (
                <div className="text-sm mt-1 font-mono">
                  <span className="text-indigo-400">P: <ScoreCounter value={card.data.privacy_score} /></span>
                  <span className="text-slate-500 mx-1">|</span>
                  <span className="text-cyan-400">U: <ScoreCounter value={card.data.utility_score} /></span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Results Table */}
      {streamState === 'done' && sortedResults.length > 0 && (
        <div className="glass overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
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
                  <tr key={i} className={`border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors ${row.error ? 'opacity-40' : ''}`} style={{ animationDelay: `${i * 100}ms` }}>
                    <td className="py-3 px-5 text-white font-medium text-xs">{row.algorithm}</td>
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full animate-[fillBar_1s_ease-out]" style={{ width: `${row.privacy_score * 100}%` }} />
                        </div>
                        <span className="text-xs text-slate-400 w-10 tabular-nums"><ScoreCounter value={row.privacy_score} /></span>
                      </div>
                    </td>
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-cyan-500 rounded-full animate-[fillBar_1s_ease-out_0.2s]" style={{ width: `${row.utility_score * 100}%` }} />
                        </div>
                        <span className="text-xs text-slate-400 w-10 tabular-nums"><ScoreCounter value={row.utility_score} /></span>
                      </div>
                    </td>
                    <td className="py-3 px-5">
                      <span className={`text-xs px-2 py-0.5 rounded-full tabular-nums ${
                        row.disclosure_risk < 0.05 ? 'bg-emerald-500/10 text-emerald-400'
                        : row.disclosure_risk < 0.15 ? 'bg-amber-500/10 text-amber-400'
                        : 'bg-red-500/10 text-red-400'
                      }`}><ScoreCounter value={row.disclosure_risk} /></span>
                    </td>
                    <td className="py-3 px-5 text-xs text-slate-400 tabular-nums"><ScoreCounter value={row.information_loss} /></td>
                    <td className="py-3 px-5 text-right text-xs text-slate-500 tabular-nums"><ScoreCounter value={row.processing_time_ms} />ms</td>
                    <td className="py-3 px-5 text-center text-xs">{row.dpdp_compliant ? '✅' : '❌'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Initial state */}
      {streamState === 'idle' && results.length === 0 && (
        <div className="glass-strong p-10 text-center">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-white font-semibold text-lg mb-2">No Benchmark Results Yet</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
            Click "Run Full Benchmark" to generate synthetic data and test all algorithm configurations automatically via live stream.
            Results will update in real-time.
          </p>
          <button onClick={handleGenAndBench} className="btn-primary">🏃 Run Full Benchmark</button>
        </div>
      )}

      <style jsx global>{`
        @keyframes fillBar {
          from { width: 0%; }
        }
      `}</style>
    </div>
  );
}
