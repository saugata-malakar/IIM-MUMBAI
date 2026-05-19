'use client';
import { useState, useEffect } from 'react';

// Circular Progress Ring Component
const CircularProgress = ({ value }: { value: number }) => {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="relative w-40 h-40 flex items-center justify-center">
      <svg className="transform -rotate-90 w-40 h-40">
        <circle
          className="text-white/10"
          strokeWidth="12"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="80"
          cy="80"
        />
        <circle
          className={`transition-all duration-1000 ease-out ${value >= 100 ? 'text-emerald-500' : 'text-amber-500'}`}
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="80"
          cy="80"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-display font-bold text-white tabular-nums">{value}%</span>
        <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase mt-1">Score</span>
      </div>
    </div>
  );
};

export default function CompliancePage() {
  const [data, setData] = useState({
    score: 0,
    passed: 0,
    total: 6,
    checks: [
      { name: 'No direct identifiers in output', status: true, detail: 'PII detection pipeline flags all direct identifiers', last_verified: 'Loading...' },
      { name: 'Data minimization', status: true, detail: 'Only necessary columns are processed; raw data never leaves the server', last_verified: 'Loading...' },
      { name: 'Purpose limitation', status: true, detail: 'Anonymization strictly for research and clinical analytics purposes', last_verified: 'Loading...' },
      { name: 'Irreversibility', status: true, detail: 'SHA-256 hashing, Laplace noise, and chaos perturbation are computationally irreversible', last_verified: 'Loading...' },
      { name: 'Audit trail', status: true, detail: 'All operations are logged with timestamps, parameters, and user identity', last_verified: 'Loading...' },
      { name: 'Re-identification resistance', status: true, detail: 'Layered protection: k-Anonymity + ℓ-Diversity + t-Closeness combined', last_verified: 'Loading...' },
    ]
  });

  const [loading, setLoading] = useState(true);

  const fetchChecks = async () => {
    try {
      const res = await fetch('http://localhost:8003/api/compliance/checks');
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setLoading(false);
      }
    } catch (e) {
      // Handle error gracefully
    }
  };

  useEffect(() => {
    fetchChecks();
    const interval = setInterval(fetchChecks, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold text-white">✅ DPDP Act Live Compliance</h2>
          <p className="text-sm text-slate-400">Digital Personal Data Protection Act, 2023 — Real-Time Verification</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex h-2.5 w-2.5">
             <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${data.score === 100 ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
             <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${data.score === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
          </div>
          <span className="text-xs text-slate-400 font-medium">Monitoring Active</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-[300px_1fr] gap-6">
        
        {/* Overall Score Card */}
        <div className="glass-strong p-8 flex flex-col items-center justify-center text-center">
          <CircularProgress value={data.score} />
          
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-white mb-2">
              {data.score === 100 ? 'Fully Compliant' : 'Partial Compliance'}
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              The system currently passes {data.passed} out of {data.total} automated DPDP requirements.
            </p>
            <button 
              onClick={() => { setLoading(true); fetchChecks(); }} 
              className="btn-secondary w-full text-xs flex items-center justify-center gap-2"
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Force Re-evaluation
            </button>
          </div>
        </div>

        {/* Compliance Checks Feed */}
        <div className="glass overflow-hidden flex flex-col">
          <div className="p-4 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
            <h3 className="font-semibold text-white text-sm">Automated Compliance Feed</h3>
            <span className="text-xs text-slate-500">Updates live after every run</span>
          </div>
          
          <div className="divide-y divide-white/5">
            {data.checks.map((check, i) => (
              <div 
                key={i} 
                className={`p-5 transition-colors duration-500 flex items-start gap-4 ${check.status ? 'hover:bg-emerald-500/5' : 'bg-red-500/5 hover:bg-red-500/10'}`}
              >
                {/* Status Badge */}
                <div className="shrink-0 mt-0.5">
                  {check.status ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      Pass
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(239,68,68,0.3)]">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                      Fail
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-sm font-medium text-white">{check.name}</h4>
                    <span className="text-[10px] text-slate-500 bg-white/5 px-2 py-0.5 rounded whitespace-nowrap">
                      {check.last_verified}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {check.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
      </div>
    </div>
  );
}
