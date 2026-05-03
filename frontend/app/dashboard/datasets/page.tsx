'use client';
import { useState, useEffect } from 'react';

type FileInfo = { filename: string; size_kb: number; columns: string[] };

export default function DatasetsPage() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [numRecords, setNumRecords] = useState(1000);
  const [previewData, setPreviewData] = useState<{ name: string; rows: Record<string, any>[]; cols: string[] } | null>(null);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/files');
      const data = await res.json();
      setFiles(data.files || []);
    } catch {} 
    setLoading(false);
  };

  useEffect(() => { fetchFiles(); }, []);

  const handleGenerate = async (type: string) => {
    setGenerating(true); setError('');
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ num_records: numRecords, data_type: type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed');
      setPreviewData({ name: data.filename, rows: data.preview, cols: data.columns });
      fetchFiles(); // refresh list
    } catch (e: any) { setError(e.message); }
    setGenerating(false);
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
      setPreviewData({ name: data.filename, rows: data.preview, cols: data.columns });
      fetchFiles();
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold text-white">Dataset Management</h2>
          <p className="text-sm text-slate-400">Upload, generate, and manage your medical datasets</p>
        </div>
        <div>
          <input type="file" accept=".csv" onChange={handleUpload} id="ds-upload" className="hidden" />
          <label htmlFor="ds-upload" className="btn-secondary text-sm cursor-pointer">📤 Upload CSV</label>
        </div>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-xl text-sm">⚠️ {error}</div>}

      {/* Generate */}
      <div className="glass-strong p-6">
        <h3 className="text-white font-semibold mb-4">🧪 Generate Synthetic Data</h3>
        <div className="flex items-center gap-3 mb-4">
          <input type="number" value={numRecords} onChange={e => setNumRecords(+e.target.value)}
            min={100} max={10000} step={100}
            className="w-28 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white text-center focus:outline-none focus:border-indigo-500" />
          <span className="text-xs text-slate-400">records</span>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <button onClick={() => handleGenerate('medical')} disabled={generating}
            className="glass p-5 hover:bg-white/[0.06] transition-all text-left disabled:opacity-50">
            <div className="text-2xl mb-2">🏥</div>
            <h4 className="text-white font-medium text-sm">Medical Records</h4>
            <p className="text-xs text-slate-500 mt-1">12 columns: patient_id, age, gender, disease, blood_sugar, cholesterol, etc.</p>
          </button>
          <button onClick={() => handleGenerate('text')} disabled={generating}
            className="glass p-5 hover:bg-white/[0.06] transition-all text-left disabled:opacity-50">
            <div className="text-2xl mb-2">📝</div>
            <h4 className="text-white font-medium text-sm">Clinical Text Notes</h4>
            <p className="text-xs text-slate-500 mt-1">Free-text notes with embedded PII (names, phones, emails) for redaction testing.</p>
          </button>
        </div>
        {generating && <p className="text-center text-indigo-400 text-sm animate-pulse mt-3">Generating {numRecords} records...</p>}
      </div>

      {/* Preview */}
      {previewData && (
        <div className="glass overflow-hidden">
          <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between">
            <span className="text-xs text-white font-medium">📄 {previewData.name} — {previewData.cols.length} columns</span>
            <button onClick={() => setPreviewData(null)} className="text-xs text-slate-500 hover:text-white">✕ Close</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-white/5">
                {previewData.cols.slice(0, 8).map(c => <th key={c} className="text-left py-2 px-3 text-slate-400 whitespace-nowrap">{c}</th>)}
              </tr></thead>
              <tbody>
                {previewData.rows.map((row, i) => (
                  <tr key={i} className="border-b border-white/[0.03]">
                    {previewData.cols.slice(0, 8).map(c => (
                      <td key={c} className="py-1.5 px-3 text-slate-300 whitespace-nowrap max-w-[120px] truncate">{String(row[c] ?? '')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Existing Files */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold">📂 Saved Datasets ({files.length})</h3>
          <button onClick={fetchFiles} className="text-xs text-slate-400 hover:text-white transition-colors">↻ Refresh</button>
        </div>
        {files.length === 0 && !loading && (
          <div className="glass p-6 text-center text-slate-400 text-sm">No datasets yet. Generate or upload one above.</div>
        )}
        <div className="space-y-2">
          {files.map((f, i) => (
            <div key={i} className="glass p-4 flex items-center gap-4 hover:bg-white/[0.04] transition-all">
              <div className="text-lg">📄</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white font-medium truncate">{f.filename}</div>
                <div className="text-xs text-slate-500">{f.columns.length} columns • {f.size_kb} KB</div>
              </div>
              <a href={`/api/download/${f.filename}`} download className="text-xs text-indigo-400 hover:text-indigo-300">📥 Download</a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
