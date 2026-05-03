'use client';
import { useState } from 'react';

export default function VisionPage() {
  const [activeTab, setActiveTab] = useState<'face' | 'ocr'>('face');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Params
  const [blurMode, setBlurMode] = useState('pixelate');
  const [blurIntensity, setBlurIntensity] = useState(15);
  
  // Results
  const [result, setResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      setResult(null);
      setError('');
    }
  };

  const handleProcess = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('algorithm', activeTab === 'face' ? 'image-face' : 'ocr');
    formData.append('blur_mode', blurMode);
    formData.append('blur_intensity', blurIntensity.toString());

    try {
      const res = await fetch('/api/anonymize/image', {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Image processing failed');
      
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Tabs */}
      <div className="flex p-1 bg-white/5 rounded-2xl w-fit border border-white/10">
        <button
          onClick={() => { setActiveTab('face'); setResult(null); }}
          className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'face' 
            ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/20' 
            : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          📷 Face Anonymization
        </button>
        <button
          onClick={() => { setActiveTab('ocr'); setResult(null); }}
          className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'ocr' 
            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20' 
            : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          📄 Document OCR Redaction
        </button>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-6">
        
        {/* Main Work Area */}
        <div className="space-y-6">
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-xl text-sm">
              ⚠️ {error}
            </div>
          )}

          {/* Upload Area */}
          {!previewUrl && (
            <div className="glass-strong aspect-video flex flex-col items-center justify-center border-2 border-dashed border-white/10 hover:border-indigo-500/30 transition-colors">
              <div className="text-4xl mb-4 text-indigo-400 opacity-50">
                {activeTab === 'face' ? '🖼️' : '📝'}
              </div>
              <h3 className="text-white font-semibold mb-2">Upload {activeTab === 'face' ? 'Clinical Image' : 'Scanned Document'}</h3>
              <p className="text-xs text-slate-400 mb-6 text-center max-w-sm">
                Supports PNG and JPEG. {activeTab === 'face' 
                  ? 'Faces will be detected using MediaPipe and masked.' 
                  : 'Text will be extracted via Tesseract OCR and PII redacted.'}
              </p>
              <input type="file" accept=".jpg,.jpeg,.png" onChange={handleFileChange} id="img-upload" className="hidden" />
              <label htmlFor="img-upload" className="btn-primary cursor-pointer text-sm">
                Choose Image
              </label>
            </div>
          )}

          {/* Preview Area */}
          {previewUrl && (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="glass overflow-hidden flex flex-col">
                <div className="px-4 py-2 border-b border-white/5 text-xs text-slate-400 font-medium flex justify-between items-center bg-[#1a1f2e]">
                  <span>Original Image</span>
                  <button onClick={() => { setPreviewUrl(null); setFile(null); setResult(null); }} className="hover:text-white">✕ Clear</button>
                </div>
                <div className="bg-black/50 flex-1 relative min-h-[300px] flex items-center justify-center p-4">
                  <img src={previewUrl} alt="Original" className="max-w-full max-h-[500px] object-contain rounded border border-white/10" />
                </div>
              </div>

              <div className="glass overflow-hidden flex flex-col relative">
                <div className="px-4 py-2 border-b border-white/5 text-xs text-slate-400 font-medium flex justify-between items-center bg-[#1a1f2e]">
                  <span>Anonymized Output</span>
                  {result && <span className="text-emerald-400">Processed in {Math.round(result.result.processing_time_ms)}ms</span>}
                </div>
                <div className="bg-black/50 flex-1 relative min-h-[300px] flex items-center justify-center p-4">
                  {loading ? (
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-3" />
                      <span className="text-sm text-indigo-400 font-medium animate-pulse">Running Vision AI...</span>
                    </div>
                  ) : result ? (
                    <img src={result.download_url} alt="Anonymized" className="max-w-full max-h-[500px] object-contain rounded border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]" />
                  ) : (
                    <div className="text-slate-500 text-sm flex flex-col items-center">
                      <span className="text-2xl mb-2 opacity-50">👁️</span>
                      Waiting for processing...
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-4">
          <div className="glass-strong p-5">
            <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
              <span>⚙️</span> Algorithm Settings
            </h3>
            
            {activeTab === 'face' ? (
              <div className="space-y-5">
                <div>
                  <label className="text-xs text-slate-400 block mb-2">Masking Mode</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['pixelate', 'blur', 'solid'].map(m => (
                      <button key={m} onClick={() => setBlurMode(m)}
                        className={`py-1.5 text-xs rounded transition-all capitalize ${
                          blurMode === m ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-white/5 text-slate-400 hover:bg-white/10'
                        }`}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-2">
                    <span>Intensity</span>
                    <span className="text-indigo-400 font-bold">{blurIntensity}</span>
                  </div>
                  <input type="range" min="5" max="50" step="5" value={blurIntensity}
                    onChange={e => setBlurIntensity(+e.target.value)}
                    className="w-full h-1.5 rounded-full appearance-none bg-white/10 accent-indigo-500" />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg">
                  <p className="text-[10px] text-emerald-300 leading-relaxed">
                    Uses Tesseract OCR to extract text from the document. Any detected PII (Aadhar, PAN, SSN, Emails, Phones) will be painted over with a "REDACTED" stamp.
                  </p>
                </div>
              </div>
            )}

            <button 
              onClick={handleProcess} 
              disabled={!file || loading}
              className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
            >
              {loading ? 'Processing...' : '🚀 Run Anonymization'}
            </button>
          </div>

          {/* Results Summary Box */}
          {result && (
            <div className="glass p-5 animate-in fade-in slide-in-from-bottom-4">
              <h3 className="text-white font-semibold text-sm mb-3">Analysis Report</h3>
              <div className="space-y-3">
                {activeTab === 'face' ? (
                  <>
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="text-xs text-slate-400">Faces Detected</span>
                      <span className="text-sm font-bold text-emerald-400">{result.result.faces_detected}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="text-xs text-slate-400">Words Analyzed</span>
                      <span className="text-sm font-bold text-white">{result.result.words_analyzed}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="text-xs text-slate-400">PII Blocks Redacted</span>
                      <span className="text-sm font-bold text-red-400">{result.result.pii_blocks_redacted}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs text-slate-400">Status</span>
                  <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">Success</span>
                </div>
                
                <a href={result.download_url} download
                  className="btn-secondary w-full text-center text-xs mt-4 flex items-center justify-center gap-2">
                  📥 Download Result
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
