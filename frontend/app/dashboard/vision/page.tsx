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

  // Stream state
  const [streamStatus, setStreamStatus] = useState<string>('');
  const [boxes, setBoxes] = useState<any[]>([]);
  const [scanPos, setScanPos] = useState(0); // 0 to 100%

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      setResult(null);
      setError('');
      setBoxes([]);
      setScanPos(0);
      setStreamStatus('');
    }
  };

  const handleProcess = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setBoxes([]);
    setScanPos(0);
    setStreamStatus('Uploading image...');
    
    try {
      // 1. Upload file
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadRes = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.detail || 'Upload failed');
      
      // 2. Connect WebSocket
      const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProto}//${window.location.host}/api/ws/vision`;
      const ws = new WebSocket(wsUrl);
      
      // Setup fake scanline ticker
      const scanTicker = setInterval(() => {
        setScanPos(prev => Math.min(prev + 2, 100));
      }, 50);

      ws.onopen = () => {
        ws.send(JSON.stringify({
          filename: uploadData.filename,
          algorithm: activeTab === 'face' ? 'both' : 'ocr',
          blur_mode: blurMode,
          blur_intensity: blurIntensity
        }));
      };
      
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        
        if (msg.type === 'status') {
          setStreamStatus(msg.message);
        } else if (msg.type === 'box') {
          // snap box in
          setBoxes(prev => [...prev, { ...msg.box, type: msg.box_type }]);
        } else if (msg.type === 'done') {
          clearInterval(scanTicker);
          setScanPos(100);
          setTimeout(() => {
            setResult(msg);
            setLoading(false);
          }, 500); // let scanline finish
          ws.close();
        } else if (msg.type === 'error') {
          throw new Error(msg.message);
        }
      };
      
      ws.onerror = () => {
        clearInterval(scanTicker);
        throw new Error('WebSocket connection error');
      };

    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Subheadline */}
      <div className="glass p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5">
        <p className="text-sm text-indigo-100/80 leading-relaxed">
          Two independent pipelines for de-identifying patient images and scanned medical documents. Select a mode, upload your file, and receive a redacted output with a full audit report.
        </p>
      </div>

      {/* Header Tabs */}
      <div className="flex p-1 bg-white/5 rounded-2xl w-fit border border-white/10">
        <button
          onClick={() => { setActiveTab('face'); setResult(null); setBoxes([]); setScanPos(0); }}
          className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'face' 
            ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/20' 
            : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Face Anonymization
        </button>
        <button
          onClick={() => { setActiveTab('ocr'); setResult(null); setBoxes([]); setScanPos(0); }}
          className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'ocr' 
            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20' 
            : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Document OCR Redaction
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
            <div className="glass-strong aspect-video flex flex-col items-center justify-center border-2 border-dashed border-white/10 hover:border-indigo-500/30 transition-colors p-8 text-center">
              <div className="text-4xl mb-4 text-indigo-400 opacity-50">
                {activeTab === 'face' ? '🖼️' : '📝'}
              </div>
              <h3 className="text-white font-semibold mb-2">
                {activeTab === 'face' ? 'Clinical Face De-identification' : 'Medical Document De-identification'}
              </h3>
              <p className="text-xs text-slate-400 mb-6 max-w-lg leading-relaxed">
                {activeTab === 'face' 
                  ? 'Detects and removes identity-bearing facial features from patient photographs, clinical images, and identity-linked medical visuals. Designed to eliminate biometric cues — eyes, nose, mouth geometry, and facial contours — while preserving medically relevant content such as lesion visibility, treatment evidence, and body context.' 
                  : 'Extracts text from scanned prescriptions, handwritten clinical notes, discharge summaries, and hospital forms using OCR. Identifies personally identifiable information including patient name, phone number, address, date of birth, hospital ID, and prescription number, then masks each detected span at the bounding-box level. Clinical content — diagnosis terms, medication instructions, and treatment details — is preserved in full.'}
              </p>
              <input type="file" accept=".jpg,.jpeg,.png" onChange={handleFileChange} id="img-upload" className="hidden" />
              <label htmlFor="img-upload" className="btn-primary cursor-pointer text-sm">
                {activeTab === 'face' ? 'Upload a clinical photograph or patient image containing one or more faces' : 'Upload a scanned prescription, X-ray annotation, clinical form, or any image-based medical document'}
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
                  <div className="relative inline-block max-w-full">
                    <img src={previewUrl} alt="Original" className="max-w-full max-h-[500px] object-contain rounded border border-white/10 block" />
                    
                    {/* Live WS Overlay */}
                    {loading && (
                      <div className="absolute inset-0 z-10 overflow-hidden rounded">
                        <div className="absolute left-0 right-0 h-1 bg-cyan-400 shadow-[0_0_15px_#22d3ee] z-20" 
                             style={{ top: `${scanPos}%`, transition: 'top 50ms linear' }}>
                          <div className="absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-cyan-400/30 to-transparent" />
                        </div>
                        {boxes.map((b, i) => (
                          <div key={i} className={`absolute border-2 animate-in zoom-in duration-300 ${b.type === 'face' ? 'bg-cyan-500/20 border-cyan-400' : 'bg-black border-red-500'}`}
                               style={{ left: `${b[0]}%`, top: `${b[1]}%`, width: `${b[2]}%`, height: `${b[3]}%` }}>
                             {b.type === 'ocr' && <div className="text-[8px] font-bold text-red-500 text-center uppercase tracking-widest mt-1">REDACTED</div>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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
                      <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mb-3" />
                      <span className="text-sm text-cyan-400 font-medium animate-pulse">{streamStatus || 'Running Vision AI...'}</span>
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
                  <label className="text-xs text-slate-400 block mb-2">Redaction Mode</label>
                  <select 
                    value={blurMode}
                    onChange={(e) => setBlurMode(e.target.value)}
                    className="w-full bg-[#1a1f2e] border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option value="blur">Blur</option>
                    <option value="pixelate">Pixelate</option>
                    <option value="solid">Solid Mask</option>
                    <option value="frame">Frame Overlay</option>
                  </select>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-2">
                    <span>Detection Confidence Threshold</span>
                    <span className="text-indigo-400 font-bold">0.75</span>
                  </div>
                  <input type="range" min="0" max="100" defaultValue="75" className="w-full h-1.5 rounded-full appearance-none bg-white/10 accent-indigo-500" />
                </div>
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-2">
                    <span>Expand Region Padding</span>
                    <span className="text-indigo-400 font-bold">15%</span>
                  </div>
                  <input type="range" min="0" max="50" defaultValue="15" className="w-full h-1.5 rounded-full appearance-none bg-white/10 accent-indigo-500" />
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <label className="text-xs text-slate-400 block mb-2">OCR Engine</label>
                  <select className="w-full bg-[#1a1f2e] border border-white/10 rounded-lg px-3 py-2 text-xs text-white">
                    <option>Tesseract</option>
                    <option>EasyOCR</option>
                    <option>PaddleOCR</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-2">Redaction Style</label>
                  <select className="w-full bg-[#1a1f2e] border border-white/10 rounded-lg px-3 py-2 text-xs text-white">
                    <option>Solid Box</option>
                    <option>Red Border</option>
                    <option>Stamped Label</option>
                  </select>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-2">
                    <span>Confidence Threshold</span>
                    <span className="text-emerald-400 font-bold">0.85</span>
                  </div>
                  <input type="range" min="0" max="100" defaultValue="85" className="w-full h-1.5 rounded-full appearance-none bg-white/10 accent-emerald-500" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-2">Language</label>
                  <select className="w-full bg-[#1a1f2e] border border-white/10 rounded-lg px-3 py-2 text-xs text-white">
                    <option>English</option>
                    <option>English + Regional</option>
                  </select>
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
                      <span className="text-sm font-bold text-white">{result.result.faces_detected || 0}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="text-xs text-slate-400">Faces Anonymized</span>
                      <span className="text-sm font-bold text-emerald-400">{result.result.faces_anonymized || 0}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="text-xs text-slate-400">Redaction Mode Applied</span>
                      <span className="text-sm font-bold text-white capitalize">{result.result.anonymization_mode_applied || blurMode}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="text-xs text-slate-400">Processing Time (ms)</span>
                      <span className="text-sm font-bold text-white">{Math.round(result.result.processing_time_ms)}</span>
                    </div>
                    <div className="pt-1">
                      <span className="text-xs text-slate-400 block mb-1">Privacy Guarantee</span>
                      <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded block text-center">Biometric identity removed</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="text-xs text-slate-400">Text Regions Scanned</span>
                      <span className="text-sm font-bold text-white">{result.result.total_text_regions_scanned || 0}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="text-xs text-slate-400">PII Spans Detected</span>
                      <span className="text-sm font-bold text-red-400">{result.result.pii_spans_detected || 0}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="text-xs text-slate-400">Regions Redacted</span>
                      <span className="text-sm font-bold text-emerald-400">{result.result.pii_spans_detected || 0}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="text-xs text-slate-400">PII Types Found</span>
                      <span className="text-[10px] font-bold text-white text-right max-w-[120px]">
                        {result.result.pii_types_found?.length ? result.result.pii_types_found.join(', ') : 'None'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="text-xs text-slate-400">Processing Time (ms)</span>
                      <span className="text-sm font-bold text-white">{Math.round(result.result.processing_time_ms)}</span>
                    </div>
                    <div className="pt-1">
                      <span className="text-xs text-slate-400 block mb-1">Privacy Guarantee</span>
                      <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded block text-center">Direct identifiers removed</span>
                    </div>
                  </>
                )}
                
                <a href={result.download_url} download
                  className="btn-secondary w-full text-center text-xs mt-4 flex items-center justify-center gap-2">
                  📥 Download Result
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Shared Bottom Strip */}
      <div className="glass p-5 rounded-xl border border-white/10 flex flex-col md:flex-row gap-4 items-center justify-between text-slate-400">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📋</span>
          <div>
            <p className="text-sm font-medium text-white mb-0.5">Full redaction audit exported as JSON</p>
            <p className="text-xs">Includes detected entities, bounding boxes, confidence scores, and processing metadata.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 md:border-l md:border-white/10 md:pl-6">
          <span className="text-2xl text-emerald-500">🔒</span>
          <div>
            <p className="text-sm font-medium text-white mb-0.5">Privacy First</p>
            <p className="text-xs">Original images are not stored. Only anonymized outputs and audit metadata are retained.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
