'use client';
import { useState } from 'react';

const ALGO_CONFIG = [
  {
    id: 'k-anonymity', name: 'k-Anonymity', icon: '🟢', type: 'Syntactic',
    desc: 'Groups records so each is indistinguishable from k-1 others.',
    params: [{ key: 'k', label: 'k value', min: 2, max: 20, step: 1, default: 5 }],
  },
  {
    id: 'l-diversity', name: 'ℓ-Diversity', icon: '🔵', type: 'Syntactic',
    desc: 'Ensures each equivalence class has ≥ ℓ distinct sensitive values.',
    params: [{ key: 'l', label: 'ℓ value', min: 2, max: 10, step: 1, default: 3 }],
  },
  {
    id: 't-closeness', name: 't-Closeness', icon: '🟣', type: 'Syntactic',
    desc: 'Limits distribution distance between group and overall sensitive data.',
    params: [{ key: 't', label: 't threshold', min: 0.1, max: 1.0, step: 0.05, default: 0.3 }],
  },
  {
    id: 'differential-privacy', name: 'Differential Privacy', icon: '🟠', type: 'Semantic',
    desc: 'Adds calibrated Laplace noise. ε = privacy budget (lower = more private).',
    params: [{ key: 'epsilon', label: 'ε (epsilon)', min: 0.1, max: 5.0, step: 0.1, default: 1.0 }],
  },
  {
    id: 'chaos-perturbation', name: 'Chaos Perturbation', icon: '🔴', type: 'Novel',
    desc: 'Uses logistic map chaotic function to perturb numeric values unpredictably.',
    params: [{ key: 'lambda_val', label: 'λ (lambda)', min: 3.5, max: 4.0, step: 0.01, default: 3.99 }],
  },
  {
    id: 'pseudonymization', name: 'Pseudonymization', icon: '🟡', type: 'Operational',
    desc: 'Replaces identifiers with SHA-256 hashed pseudonyms (salted per-run).',
    params: [],
  },
  {
    id: 'pii-redaction', name: 'PII Redaction', icon: '⚪', type: 'Operational',
    desc: 'Regex-based detection and redaction of 10+ PII patterns in text columns.',
    params: [],
  },
  {
    id: 'hybrid', name: 'Hybrid Pipeline', icon: '🔷', type: 'Multi-layer',
    desc: 'Chains Pseudonymization → k-Anonymity → DP → PII Redaction. Auto-classifies columns.',
    params: [
      { key: 'k', label: 'k value', min: 2, max: 20, step: 1, default: 5 },
      { key: 'epsilon', label: 'ε (epsilon)', min: 0.1, max: 5.0, step: 0.1, default: 1.0 },
    ],
  },
  {
    id: 'clustering', name: 'Clustering (MDAV)', icon: '🧩', type: 'Semantic',
    desc: 'Microaggregation via distance metrics. Groups similar records and replaces with centroid.',
    params: [
      { key: 'k', label: 'k (Min Cluster Size)', min: 2, max: 50, step: 1, default: 5 },
    ],
  },
];

const BADGE: Record<string, string> = { Syntactic: 'bg-blue-500/10 text-blue-400', Semantic: 'bg-orange-500/10 text-orange-400', Novel: 'bg-red-500/10 text-red-400', Operational: 'bg-emerald-500/10 text-emerald-400', 'Multi-layer': 'bg-purple-500/10 text-purple-400' };

type Suggestions = { quasi_identifiers: string[]; sensitive_attributes: string[]; direct_identifiers: string[] };

export default function AnonymizePage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Data state
  const [filename, setFilename] = useState('');
  const [columns, setColumns] = useState<string[]>([]);
  const [preview, setPreview] = useState<Record<string, any>[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [suggestions, setSuggestions] = useState<Suggestions>({ quasi_identifiers: [], sensitive_attributes: [], direct_identifiers: [] });

  // Classification state
  const [qi, setQi] = useState<string[]>([]);
  const [sa, setSa] = useState<string[]>([]);
  const [numRecords, setNumRecords] = useState(1000);

  // Algorithm state
  const [algoId, setAlgoId] = useState('k-anonymity');
  const [paramVals, setParamVals] = useState<Record<string, number>>({});

  // Results state
  const [results, setResults] = useState<any>(null);

  const handleGenerate = async (type: string) => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ num_records: numRecords, data_type: type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed');
      setFilename(data.filename); setColumns(data.columns);
      setPreview(data.preview); setTotalRecords(data.total_records);
      setSuggestions(data.suggestions || { quasi_identifiers: [], sensitive_attributes: [], direct_identifiers: [] });
      setQi(data.suggestions?.quasi_identifiers || []);
      setSa(data.suggestions?.sensitive_attributes || []);
      setStep(2);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setLoading(true); setError('');
    const fd = new FormData();
    fd.append('file', e.target.files[0]);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Upload failed');
      setFilename(data.filename); setColumns(data.columns);
      setPreview(data.preview); setTotalRecords(data.total_records);
      setSuggestions(data.suggestions || { quasi_identifiers: [], sensitive_attributes: [], direct_identifiers: [] });
      setQi(data.suggestions?.quasi_identifiers || []);
      setSa(data.suggestions?.sensitive_attributes || []);
      setStep(2);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const handleRun = async () => {
    setLoading(true); setError('');
    const algo = ALGO_CONFIG.find(a => a.id === algoId)!;
    const params: Record<string, any> = {};
    algo.params.forEach(p => { params[p.key] = paramVals[p.key] ?? p.default; });
    try {
      const res = await fetch('/api/anonymize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, algorithm: algoId, quasi_identifiers: qi, sensitive_attributes: sa, params }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Anonymization failed');
      setResults(data);
      setStep(4);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const toggleCol = (col: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(col) ? list.filter(c => c !== col) : [...list, col]);
  };

  const algoObj = ALGO_CONFIG.find(a => a.id === algoId)!;

  return (
    <div className="space-y-6">
      {/* Steps */}
      <div className="flex items-center gap-1 flex-wrap">
        {['Upload Data', 'Classify Columns', 'Select Algorithm', 'Results'].map((s, i) => (
          <div key={i} className="flex items-center gap-1">
            <button onClick={() => { if (i + 1 < step) setStep(i + 1); }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                step === i + 1 ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/20'
                : step > i + 1 ? 'bg-emerald-500/10 text-emerald-400 cursor-pointer'
                : 'bg-white/5 text-slate-500'}`}>
              <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[9px]">
                {step > i + 1 ? '✓' : i + 1}
              </span>
              {s}
            </button>
            {i < 3 && <div className="w-5 h-px bg-white/10" />}
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-xl text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* ── STEP 1: Upload ── */}
      {step === 1 && (
        <div className="space-y-5">
          <div className="glass-strong p-6 border-2 border-dashed border-white/10 hover:border-indigo-500/30 transition-colors text-center">
            <div className="text-3xl mb-3">📤</div>
            <h3 className="text-white font-semibold mb-1">Upload Your CSV Dataset</h3>
            <p className="text-xs text-slate-400 mb-4">Any CSV file up to 50MB. Columns are auto-classified.</p>
            <input type="file" accept=".csv" onChange={handleUpload} id="fu" className="hidden" />
            <label htmlFor="fu" className="btn-primary cursor-pointer text-sm">
              {loading ? 'Uploading...' : 'Choose CSV File'}
            </label>
          </div>

          <div className="text-center text-slate-500 text-xs">— or generate synthetic data —</div>

          <div className="flex items-center gap-3 justify-center">
            <input type="number" value={numRecords} onChange={e => setNumRecords(+e.target.value)}
              min={100} max={10000} step={100}
              className="w-28 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white text-center focus:outline-none focus:border-indigo-500" />
            <span className="text-xs text-slate-400">records</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: '🏥 Medical Records', desc: '12 clinical columns — age, disease, vitals, medications', type: 'medical' },
              { label: '📝 Clinical Text Notes', desc: 'Free-text notes with embedded PII for redaction testing', type: 'text' },
            ].map((d, i) => (
              <button key={i} onClick={() => handleGenerate(d.type)} disabled={loading}
                className="glass p-5 text-left hover:bg-white/[0.06] transition-all disabled:opacity-50">
                <div className="text-lg mb-2">{d.label.split(' ')[0]}</div>
                <div className="text-sm text-white font-medium">{d.label.slice(2)}</div>
                <div className="text-xs text-slate-500 mt-1">{d.desc}</div>
              </button>
            ))}
          </div>
          {loading && <p className="text-center text-indigo-400 text-sm animate-pulse">Generating data...</p>}
        </div>
      )}

      {/* ── STEP 2: Classify ── */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="glass p-4 flex items-center justify-between">
            <div>
              <span className="text-white font-medium text-sm">📄 {filename}</span>
              <span className="text-xs text-slate-400 ml-3">{totalRecords.toLocaleString()} records × {columns.length} columns</span>
            </div>
          </div>

          {/* Data preview table */}
          <div className="glass overflow-hidden">
            <div className="px-4 py-2 border-b border-white/5 text-xs text-slate-400 font-medium">Data Preview (8 rows)</div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-white/5">
                  {columns.slice(0, 8).map(c => <th key={c} className="text-left py-2 px-3 text-slate-400 whitespace-nowrap">{c}</th>)}
                </tr></thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className="border-b border-white/[0.03]">
                      {columns.slice(0, 8).map(c => (
                        <td key={c} className="py-1.5 px-3 text-slate-300 whitespace-nowrap max-w-[120px] truncate">
                          {String(row[c] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Quasi-identifiers */}
            <div className="glass p-4">
              <div className="text-xs font-semibold text-amber-400 mb-2">🔶 Quasi-Identifiers (click to toggle)</div>
              <div className="text-[10px] text-slate-500 mb-3">Indirectly identify a person. Used for k-anon, l-div, t-close.</div>
              <div className="flex flex-wrap gap-1.5">
                {columns.map(c => (
                  <button key={c} onClick={() => toggleCol(c, qi, setQi)}
                    className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                      qi.includes(c) ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Sensitive attributes */}
            <div className="glass p-4">
              <div className="text-xs font-semibold text-violet-400 mb-2">🟣 Sensitive Attributes (click to toggle)</div>
              <div className="text-[10px] text-slate-500 mb-3">Private information to protect. Used for diversity & closeness metrics.</div>
              <div className="flex flex-wrap gap-1.5">
                {columns.map(c => (
                  <button key={c} onClick={() => toggleCol(c, sa, setSa)}
                    className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                      sa.includes(c) ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400 glass p-3">
            <span>✅ Selected: <strong className="text-white">{qi.length}</strong> quasi-identifiers, <strong className="text-white">{sa.length}</strong> sensitive attributes</span>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="btn-secondary text-sm">← Back</button>
            <button onClick={() => setStep(3)} className="btn-primary text-sm">Next: Select Algorithm →</button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Algorithm ── */}
      {step === 3 && (
        <div className="space-y-5">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {ALGO_CONFIG.map((a) => (
              <button key={a.id} onClick={() => setAlgoId(a.id)}
                className={`glass p-4 text-left transition-all ${
                  algoId === a.id ? 'border-indigo-500/40 bg-indigo-500/10 ring-1 ring-indigo-500/20' : 'hover:bg-white/[0.04]'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg">{a.icon}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${BADGE[a.type as keyof typeof BADGE]}`}>{a.type}</span>
                </div>
                <div className="text-white font-semibold text-sm mb-1">{a.name}</div>
                <p className="text-[10px] text-slate-500 leading-relaxed">{a.desc}</p>
              </button>
            ))}
          </div>

          {/* Params for selected algo */}
          {algoObj.params.length > 0 && (
            <div className="glass-strong p-5">
              <h4 className="text-white font-semibold text-sm mb-4">⚙️ Parameters for {algoObj.name}</h4>
              {algoObj.params.map(p => {
                const val = paramVals[p.key] ?? p.default;
                return (
                  <div key={p.key} className="mb-4">
                    <div className="flex justify-between text-xs text-slate-300 mb-2">
                      <span className="font-medium">{p.label}</span>
                      <span className="text-indigo-400 font-bold text-sm">{val}</span>
                    </div>
                    <input type="range" min={p.min} max={p.max} step={p.step} value={val}
                      onChange={e => setParamVals({ ...paramVals, [p.key]: +e.target.value })}
                      className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-white/10 accent-indigo-500" />
                    <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                      <span>{p.min}</span><span>{p.max}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="glass p-3 text-xs text-slate-400">
            Running <strong className="text-indigo-300">{algoObj.name}</strong> on <strong className="text-white">{totalRecords.toLocaleString()}</strong> records 
            with <strong className="text-amber-300">{qi.length}</strong> quasi-identifiers, <strong className="text-violet-300">{sa.length}</strong> sensitive attributes
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(2)} className="btn-secondary text-sm">← Back</button>
            <button onClick={handleRun} disabled={loading}
              className="btn-primary text-sm min-w-[180px]">
              {loading ? (
                <span className="flex items-center gap-2 justify-center"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Running...</span>
              ) : '🚀 Run Anonymization'}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 4: Results ── */}
      {step === 4 && results && (
        <div className="space-y-5">
          <div className="glass-strong p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-2xl">✅</div>
            <div>
              <h3 className="text-white font-semibold">{results.algorithm}</h3>
              <p className="text-sm text-slate-400">
                {results.metrics.records_processed.toLocaleString()} records in {results.metrics.processing_time_ms}ms
                {results.metrics.dpdp_compliant && <span className="ml-3 text-emerald-400 text-xs">● DPDP Compliant</span>}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Privacy Score', value: results.metrics.privacy_score, color: 'text-indigo-400', hint: 'Higher = more private' },
              { label: 'Utility Score', value: results.metrics.utility_score, color: 'text-cyan-400', hint: 'Higher = more useful' },
              { label: 'Disclosure Risk', value: results.metrics.disclosure_risk, color: 'text-emerald-400', hint: 'Lower = safer' },
              { label: 'Information Loss', value: results.metrics.information_loss, color: 'text-amber-400', hint: 'Lower = better' },
            ].map((m, i) => (
              <div key={i} className="glass p-4 text-center">
                <div className={`text-2xl font-display font-bold ${m.color}`}>{m.value.toFixed(3)}</div>
                <div className="text-xs text-white font-medium mt-1">{m.label}</div>
                <div className="text-[9px] text-slate-500 mt-0.5">{m.hint}</div>
              </div>
            ))}
          </div>

          <div className="glass overflow-hidden">
            <div className="px-4 py-2 border-b border-white/5 text-xs text-slate-400 font-medium">
              Anonymized Output Preview (10 rows)
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-white/5">
                  {(results.columns || []).slice(0, 8).map((c: string) => (
                    <th key={c} className="text-left py-2 px-3 text-slate-400 whitespace-nowrap">{c}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {results.preview.map((row: Record<string, any>, i: number) => (
                    <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                      {(results.columns || []).slice(0, 8).map((c: string) => (
                        <td key={c} className="py-1.5 px-3 text-slate-300 whitespace-nowrap max-w-[140px] truncate">
                          {String(row[c] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-3">
            <a href={results.download_url} download
              className="btn-primary flex-1 text-center text-sm !py-3 flex items-center justify-center gap-2">
              📥 Download Anonymized CSV
            </a>
            <button onClick={() => { setStep(3); setResults(null); }} className="btn-secondary text-sm !py-3">
              🔄 Try Another Algorithm
            </button>
            <button onClick={() => { setStep(1); setFilename(''); setResults(null); }} className="btn-secondary text-sm !py-3">
              ➕ New Dataset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
