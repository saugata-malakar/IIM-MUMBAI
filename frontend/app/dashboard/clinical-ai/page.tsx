'use client';

import { useState } from 'react';
import DiagnosticAI from '../../../components/sections/DiagnosticAI';
import {
  DrugIntel,
  ReIDSimulator,
  OCRLab,
  PopulationHealth,
  LLMExporter,
  Explainability,
  DPDPAuditor,
} from '../../../components/sections/Sections2to8';
import '../../../styles/sections.css';

const TABS = [
  { id: 'diagnostic', label: 'Diagnostic AI', icon: '🧠', component: DiagnosticAI },
  { id: 'drug-intel', label: 'Drug Intelligence', icon: '💊', component: DrugIntel },
  { id: 'reid', label: 'Re-ID Simulator', icon: '🛡', component: ReIDSimulator },
  { id: 'ocr', label: 'OCR Lab', icon: '📄', component: OCRLab },
  { id: 'population', label: 'Population Health', icon: '📊', component: PopulationHealth },
  { id: 'llm', label: 'LLM Exporter', icon: '🤖', component: LLMExporter },
  { id: 'explainability', label: 'Explainability', icon: '📚', component: Explainability },
  { id: 'dpdp', label: 'DPDP Auditor', icon: '✅', component: DPDPAuditor },
];

export default function ClinicalAIPage() {
  const [activeTab, setActiveTab] = useState('diagnostic');

  const activeTabData = TABS.find(tab => tab.id === activeTab);
  const ActiveComponent = activeTabData?.component || DiagnosticAI;

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-display font-bold text-white">
          🧠 Advanced Clinical AI Analytics
        </h2>
        <p className="text-sm text-slate-400">
          8 AI-powered sections built on your anonymized dataset · DPDP Act 2023 compliant
        </p>
      </div>

      {/* Tabs Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-2 px-3 py-3 rounded-xl transition-all text-xs font-medium whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50 shadow-lg shadow-indigo-500/20'
                : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10'
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            <span className="text-center line-clamp-2">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content Panel */}
      <div className="glass-strong p-8 rounded-2xl border border-white/10 min-h-[600px]">
        <ActiveComponent />
      </div>

      {/* Footer Info */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="glass p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-indigo-400">1000</div>
          <div className="text-xs text-slate-400 mt-1">Anonymized Records</div>
        </div>
        <div className="glass p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-cyan-400">10</div>
          <div className="text-xs text-slate-400 mt-1">Diagnoses</div>
        </div>
        <div className="glass p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-emerald-400">0</div>
          <div className="text-xs text-slate-400 mt-1">PII Exposed</div>
        </div>
        <div className="glass p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-amber-400">100%</div>
          <div className="text-xs text-slate-400 mt-1">DPDP Compliant</div>
        </div>
      </div>
    </div>
  );
}
