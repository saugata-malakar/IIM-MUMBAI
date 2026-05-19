'use client';

import React, { useState, useRef } from 'react';

// Import all section components
import ClinicalDiagnosticEngine from './ClinicalDiagnosticEngine';
import DrugIntelligencePanel from './DrugIntelligencePanel';
import ReidentificationAttackSimulator from './ReidentificationAttackSimulator';
import PrescriptionOCRLab from './PrescriptionOCRLab';
import PopulationHealthAnalytics from './PopulationHealthAnalytics';
import LLMFineTuningExporter from './LLMFineTuningExporter';
import AlgorithmExplainabilityHub from './AlgorithmExplainabilityHub';
import DPDPComplianceAuditor from './DPDPComplianceAuditor';
import AnonymizationHub from './AnonymizationHub';

export default function ClinicalAIHub() {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { id: 'diagnostic', label: '🩺 Diagnostic AI', color: '#7C3AED' },
    { id: 'drugs', label: '💊 Drug Intelligence', color: '#06B6D4' },
    { id: 'reid', label: '🔐 Re-ID Simulator', color: '#10B981' },
    { id: 'ocr', label: '📄 OCR Lab', color: '#F59E0B' },
    { id: 'population', label: '📊 Population Health', color: '#EF4444' },
    { id: 'llm', label: '🤖 LLM Exporter', color: '#8B5CF6' },
    { id: 'explainability', label: '🎓 Explainability', color: '#06B6D4' },
    { id: 'dpdp', label: '⚖️ DPDP Auditor', color: '#10B981' },
    { id: 'anonymization', label: '🛡️ Anonymization', color: '#EC4899' },
  ];

  const tabStyle = {
    container: {
      display: 'flex',
      height: '100vh',
      backgroundColor: '#0F172A',
      color: '#E2E8F0',
      fontFamily: '"DM Sans", sans-serif',
      overflow: 'hidden',
    },
    sidebar: {
      width: '200px',
      backgroundColor: '#1E293B',
      borderRight: '1px solid #334155',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      paddingTop: '20px',
    },
    tabButton: (isActive, color) => ({
      padding: '15px 16px',
      border: 'none',
      backgroundColor: isActive ? `${color}20` : 'transparent',
      color: isActive ? color : '#94A3B8',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: isActive ? '600' : '500',
      textAlign: 'left',
      transition: 'all 0.3s ease',
      borderLeft: isActive ? `4px solid ${color}` : '4px solid transparent',
      paddingLeft: isActive ? '14px' : '16px',
      fontFamily: '"DM Sans", sans-serif',
    }),
    contentArea: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      backgroundColor: '#0F172A',
    },
    header: {
      padding: '20px 24px',
      borderBottom: '1px solid #334155',
      backgroundColor: '#1E293B',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    headerTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: tabs[activeTab].color,
      margin: 0,
    },
    contentBody: {
      flex: 1,
      overflow: 'auto',
      padding: '0',
    },
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return <ClinicalDiagnosticEngine />;
      case 1:
        return <DrugIntelligencePanel />;
      case 2:
        return <ReidentificationAttackSimulator />;
      case 3:
        return <PrescriptionOCRLab />;
      case 4:
        return <PopulationHealthAnalytics />;
      case 5:
        return <LLMFineTuningExporter />;
      case 6:
        return <AlgorithmExplainabilityHub />;
      case 7:
        return <DPDPComplianceAuditor />;
      case 8:
        return <AnonymizationHub />;
      default:
        return <ClinicalDiagnosticEngine />;
    }
  };

  return (
    <div style={tabStyle.container}>
      {/* Sidebar */}
      <div style={tabStyle.sidebar}>
        <div style={{ padding: '12px 16px', marginBottom: '8px' }}>
          <h3 style={{ margin: '0', fontSize: '12px', textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.5px' }}>
            9 Modules (13+ Algorithms)
          </h3>
        </div>
        {tabs.map((tab, idx) => (
          <button
            key={tab.id}
            style={tabStyle.tabButton(activeTab === idx, tab.color)}
            onClick={() => setActiveTab(idx)}
          >
            {tab.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ padding: '12px 16px', fontSize: '11px', color: '#64748B', borderTop: '1px solid #334155' }}>
          <p style={{ margin: '8px 0' }}>✅ DPDP Compliant</p>
          <p style={{ margin: '4px 0', fontSize: '10px' }}>Zero PII Exposure</p>
        </div>
      </div>

      {/* Content Area */}
      <div style={tabStyle.contentArea}>
        {/* Header */}
        <div style={tabStyle.header}>
          <div style={{ fontSize: '24px' }}>{tabs[activeTab].label.split(' ')[0]}</div>
          <h1 style={tabStyle.headerTitle}>{tabs[activeTab].label.split(' ').slice(1).join(' ')}</h1>
        </div>

        {/* Body */}
        <div style={tabStyle.contentBody}>
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
