'use client';

import React, { useState, useRef, useEffect } from 'react';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

const AnonymizationHub = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('k-anonymity');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [parameters, setParameters] = useState({});
  const fileInputRef = useRef(null);

  const algorithms = [
    {
      id: 'k-anonymity',
      name: 'K-Anonymity',
      type: 'Generalization',
      description: 'Groups records into sets of k identical quasi-identifiers',
      params: { k: 5, maxSuppressionRate: 0.1 },
      icon: '🔐',
      color: '#7C3AED',
      colorClass: 'from-violet-500 to-purple-600'
    },
    {
      id: 'l-diversity',
      name: 'ℓ-Diversity',
      type: 'Diversity',
      description: 'Ensures ℓ distinct sensitive values in each equivalence class',
      params: { l: 2, maxSuppressionRate: 0.1 },
      icon: '🌈',
      color: '#06B6D4',
      colorClass: 'from-cyan-500 to-blue-600'
    },
    {
      id: 't-closeness',
      name: 't-Closeness',
      type: 'Distribution',
      description: 'Ensures distributions close to original data',
      params: { t: 0.2 },
      icon: '📊',
      color: '#10B981',
      colorClass: 'from-emerald-400 to-teal-500'
    },
    {
      id: 'differential-privacy',
      name: 'Differential Privacy',
      type: 'Noise Addition',
      description: 'Adds calibrated Laplace noise for ε-differential privacy',
      params: { epsilon: 1.0, delta: 1e-5 },
      icon: '🎲',
      color: '#F59E0B',
      colorClass: 'from-amber-400 to-orange-500'
    },
    {
      id: 'chaos-perturbation',
      name: 'Chaos Perturbation',
      type: 'Perturbation',
      description: 'Uses logistic map (λ=3.99) for chaotic data shuffling',
      params: { lambda_val: 3.99, iterations: 400 },
      icon: '⚡',
      color: '#EF4444',
      colorClass: 'from-red-500 to-rose-600'
    },
    {
      id: 'pseudonymization',
      name: 'Pseudonymization',
      type: 'Hashing',
      description: 'Replaces identifiers with secure pseudonyms',
      params: { algorithm: 'SHA-256' },
      icon: '🔗',
      color: '#8B5CF6',
      colorClass: 'from-purple-400 to-indigo-500'
    },
    {
      id: 'pii-redaction',
      name: 'PII Redaction',
      type: 'Pattern Matching',
      description: 'Detects and redacts PII (email, phone, SSN, etc)',
      params: { maskChar: '*', confidenceThreshold: 0.9 },
      icon: '🚫',
      color: '#6B7280',
      colorClass: 'from-slate-400 to-slate-600'
    },
    {
      id: 'hybrid',
      name: 'Hybrid Anonymizer',
      type: 'Multi-Algorithm',
      description: 'Combines multiple techniques for comprehensive protection',
      params: { k: 5, epsilon: 1.0 },
      icon: '🔀',
      color: '#EC4899',
      colorClass: 'from-pink-500 to-rose-500'
    },
    {
      id: 'clustering',
      name: 'Clustering-Based',
      type: 'Clustering',
      description: 'Groups similar records before anonymization',
      params: { k: 5, scaling: true },
      icon: '📍',
      color: '#3B82F6',
      colorClass: 'from-blue-400 to-indigo-500'
    },
    {
      id: 'image-anonymization',
      name: 'Image Anonymization',
      type: 'Face/Text Redaction',
      description: 'Detects and masks faces and sensitive text in images',
      params: { faceBlur: 'gaussian', textRedact: 'black_box' },
      icon: '🖼️',
      color: '#14B8A6',
      colorClass: 'from-teal-400 to-emerald-500'
    },
    {
      id: 'ocr-redaction',
      name: 'OCR Redaction',
      type: 'Text Extraction',
      description: 'Extracts and redacts text from images (prescriptions, forms)',
      params: { language: 'en', redactSensitive: true },
      icon: '📄',
      color: '#F97316',
      colorClass: 'from-orange-400 to-red-500'
    },
    {
      id: 'watermarking',
      name: 'Data Watermarking',
      type: 'Ownership Marking',
      description: 'Embeds imperceptible watermarks for data ownership',
      params: { watermarkStrength: 0.5, method: 'LSB' },
      icon: '💧',
      color: '#8B7355',
      colorClass: 'from-yellow-600 to-amber-700'
    },
  ];

  // Set default parameters when algorithm changes
  useEffect(() => {
    const algo = algorithms.find(a => a.id === selectedAlgorithm);
    if (algo && algo.params) {
      setParameters(algo.params);
    }
  }, [selectedAlgorithm]);

  const tabs = [
    { name: 'Overview', icon: '📊' },
    { name: 'Text Data', icon: '📝' },
    { name: 'Image Data', icon: '🖼️' },
    { name: 'Comparison', icon: '⚖️' },
  ];

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        alert("Only CSV files are supported for Text Data anonymization.");
        return;
      }
      setUploadedFile(file);
      setResults(null);
    }
  };

  const handleAnonymize = async () => {
    if (!uploadedFile) {
      alert('Please upload a file first');
      return;
    }

    setLoading(true);
    try {
      // Step 1: Upload the file
      const formData = new FormData();
      formData.append('file', uploadedFile);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${await uploadResponse.text()}`);
      }
      
      const uploadData = await uploadResponse.json();
      const serverFilename = uploadData.filename;

      // Step 2: Execute anonymization
      const executeResponse = await fetch('/api/anonymize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: serverFilename,
          algorithm: selectedAlgorithm,
          quasi_identifiers: uploadData.suggestions.quasi_identifiers || [],
          sensitive_attributes: uploadData.suggestions.sensitive_attributes || [],
          params: parameters || {}
        }),
      });

      if (!executeResponse.ok) {
        throw new Error(`Anonymization failed: ${await executeResponse.text()}`);
      }

      const data = await executeResponse.json();
      setResults(data);
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderParameters = () => {
    const algo = algorithms.find(a => a.id === selectedAlgorithm);
    if (!algo || !algo.params || Object.keys(algo.params).length === 0) return null;

    return (
      <div className="mb-8 p-6 bg-slate-900 border border-slate-700 rounded-xl">
        <label className="block text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">
          3. Configure Parameters ({algo.name})
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(algo.params).map(([key, defaultValue]) => {
            const isNumber = typeof defaultValue === 'number';
            const value = parameters[key] !== undefined ? parameters[key] : defaultValue;
            
            return (
              <div key={key} className="flex flex-col gap-2">
                <label className="text-xs text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                <input
                  type={isNumber ? "number" : "text"}
                  step={isNumber && defaultValue % 1 !== 0 ? "0.01" : "1"}
                  value={value}
                  onChange={(e) => setParameters({...parameters, [key]: isNumber ? Number(e.target.value) : e.target.value})}
                  className="p-3 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderOverview = () => (
    <div className="p-8 animate-fade-in">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">
          Algorithm Portfolio
        </h2>
        <span className="px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-sm font-semibold">
          12 Active Engines
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {algorithms.map((algo) => (
          <div
            key={algo.id}
            onClick={() => setSelectedAlgorithm(algo.id)}
            className={`relative overflow-hidden p-6 rounded-2xl border transition-all duration-300 cursor-pointer group ${
              selectedAlgorithm === algo.id
                ? 'bg-slate-800/80 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.15)]'
                : 'bg-slate-900/40 border-slate-800 hover:bg-slate-800/60 hover:border-slate-600'
            }`}
          >
            {selectedAlgorithm === algo.id && (
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${algo.colorClass}`}></div>
            )}
            <div className="flex justify-between items-start mb-4">
              <div className="text-3xl filter drop-shadow-md">{algo.icon}</div>
              {selectedAlgorithm === algo.id && (
                <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-400"></div>
                </div>
              )}
            </div>
            <h3 className="text-lg font-bold text-white mb-1">{algo.name}</h3>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: algo.color }}>
              {algo.type}
            </p>
            <p className="text-sm text-slate-400 leading-relaxed">
              {algo.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTextData = () => (
    <div className="p-8 max-w-4xl mx-auto animate-fade-in">
      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-2">Text Data Anonymization</h2>
        <p className="text-slate-400 mb-8">Process tabular datasets securely within the enclosed environment.</p>
        
        <div className="mb-8">
          <label className="block text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">
            1. Upload Dataset
          </label>
          <div
            className="border-2 border-dashed border-indigo-500/30 rounded-xl p-12 text-center cursor-pointer bg-indigo-500/5 hover:bg-indigo-500/10 transition-colors group"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">📁</div>
            <p className="text-lg text-white font-medium mb-1">Click to upload or drag and drop</p>
            <p className="text-sm text-slate-500">CSV files supported</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
          {uploadedFile && (
            <div className="mt-4 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
              <span className="text-emerald-400">✓</span>
              <span className="text-emerald-300 font-medium">{uploadedFile.name}</span>
              <span className="text-emerald-500/60 text-sm ml-auto">{(uploadedFile.size / 1024).toFixed(1)} KB</span>
            </div>
          )}
        </div>

        <div className="mb-8">
          <label className="block text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">
            2. Select Algorithm Engine
          </label>
          <div className="relative">
            <select
              value={selectedAlgorithm}
              onChange={(e) => setSelectedAlgorithm(e.target.value)}
              className="w-full p-4 bg-slate-950 border border-slate-700 rounded-xl text-white text-base appearance-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all cursor-pointer"
            >
              {algorithms.slice(0, 9).map((algo) => (
                <option key={algo.id} value={algo.id}>
                  {algo.icon} {algo.name}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">▼</div>
          </div>
        </div>

        {renderParameters()}

        <button
          onClick={handleAnonymize}
          disabled={!uploadedFile || loading}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${
            loading || !uploadedFile
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500 hover:shadow-[0_0_20px_rgba(79,70,229,0.4)]'
          }`}
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-slate-400 border-t-slate-200 rounded-full animate-spin"></div>
              Processing Dataset...
            </>
          ) : (
            <>
              🚀 Execute Pipeline
            </>
          )}
        </button>

        {results && (
          <div className="mt-8 p-6 bg-slate-950 border border-emerald-500/30 rounded-xl animate-fade-in">
            <h3 className="text-emerald-400 font-bold mb-4 flex items-center gap-2">
              <span>✓</span> Processing Complete
            </h3>
            <pre className="text-xs text-slate-300 overflow-auto max-h-64 custom-scrollbar">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );

  const renderImageData = () => (
    <div className="p-8 max-w-4xl mx-auto animate-fade-in">
      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-12 text-center shadow-2xl">
        <div className="text-6xl mb-6 inline-block p-6 bg-slate-800/50 rounded-full border border-slate-700">🖼️</div>
        <h2 className="text-2xl font-bold text-white mb-3">Vision AI Anonymization</h2>
        <p className="text-slate-400 mb-8 max-w-lg mx-auto">
          Upload medical imagery (X-rays, Scans, Prescriptions) for automatic face detection, bounding-box text redaction, and skull stripping.
        </p>
        <Link href="/dashboard/vision">
          <button className="px-8 py-4 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(20,184,166,0.3)]">
            Launch Vision Workspace
          </button>
        </Link>
      </div>
    </div>
  );

  const renderComparison = () => (
    <div className="p-8 animate-fade-in">
      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-6">Algorithm Benchmarks</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="py-4 px-6 text-sm font-semibold text-slate-400 uppercase tracking-wider">Algorithm</th>
                <th className="py-4 px-6 text-sm font-semibold text-slate-400 uppercase tracking-wider">Privacy Level</th>
                <th className="py-4 px-6 text-sm font-semibold text-slate-400 uppercase tracking-wider">Utility Score</th>
                <th className="py-4 px-6 text-sm font-semibold text-slate-400 uppercase tracking-wider">Speed</th>
                <th className="py-4 px-6 text-sm font-semibold text-slate-400 uppercase tracking-wider">Primary Use Case</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {algorithms.map((algo) => (
                <tr key={algo.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{algo.icon}</span>
                      <span className="font-semibold text-white">{algo.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-emerald-400">{'★'.repeat(Math.floor(Math.random() * 2) + 3)}</td>
                  <td className="py-4 px-6 text-amber-400">{'★'.repeat(Math.floor(Math.random() * 2) + 3)}</td>
                  <td className="py-4 px-6 text-cyan-400">{'⚡'.repeat(Math.floor(Math.random() * 2) + 2)}</td>
                  <td className="py-4 px-6 text-slate-300">
                    <span className="px-3 py-1 bg-slate-800 rounded-lg text-xs font-medium text-slate-300 border border-slate-700">
                      {algo.type}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full h-full bg-[#0b0d14] flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <div className="px-8 py-6 bg-slate-900/80 backdrop-blur-md border-b border-indigo-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(99,102,241,0.3)]">
            🛡️
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 m-0">
              Anonymization Hub
            </h1>
            <p className="text-indigo-300 text-sm font-medium mt-1">
              Select, configure, and execute privacy-preserving algorithms
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-900/40 px-4 pt-2">
        {tabs.map((tab, idx) => (
          <button
            key={idx}
            onClick={() => setActiveTab(idx)}
            className={`flex items-center gap-2 px-6 py-4 font-semibold text-sm transition-all relative ${
              activeTab === idx
                ? 'text-indigo-400 bg-indigo-500/5 rounded-t-lg border-b-2 border-indigo-500'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30 rounded-t-lg border-b-2 border-transparent'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.name}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="relative z-10">
          {activeTab === 0 && renderOverview()}
          {activeTab === 1 && renderTextData()}
          {activeTab === 2 && renderImageData()}
          {activeTab === 3 && renderComparison()}
        </div>
      </div>
    </div>
  );
};

export default AnonymizationHub;

