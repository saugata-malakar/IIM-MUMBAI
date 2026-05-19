"use client";

/**
 * NewSections.jsx — Drop into: src/pages/NewSections.jsx
 * Master page that hosts all 8 new sections as a tabbed layout.
 * Add this route to your React Router:
 *   <Route path="/sections" element={<NewSections />} />
 */

import { useState } from "react";
import DiagnosticAI from "../../components/sections/DiagnosticAI";
import { DrugIntel }       from "../../components/sections/Sections2to8";
import { ReIDSimulator }   from "../../components/sections/Sections2to8";
import { OCRLab }          from "../../components/sections/Sections2to8";
import { PopulationHealth }from "../../components/sections/Sections2to8";
import { LLMExporter }     from "../../components/sections/Sections2to8";
import { Explainability }  from "../../components/sections/Sections2to8";
import { DPDPAuditor }     from "../../components/sections/Sections2to8";
import "../../styles/sections.css";

const TABS = [
  { id: 0, label: "Diagnostic AI",        icon: "🧠", component: <DiagnosticAI /> },
  { id: 1, label: "Drug Intelligence",    icon: "💊", component: <DrugIntel /> },
  { id: 2, label: "Re-ID Simulator",      icon: "🛡",  component: <ReIDSimulator /> },
  { id: 3, label: "OCR Lab",              icon: "📄", component: <OCRLab /> },
  { id: 4, label: "Population Health",    icon: "📊", component: <PopulationHealth /> },
  { id: 5, label: "LLM Exporter",         icon: "🤖", component: <LLMExporter /> },
  { id: 6, label: "Explainability",       icon: "📚", component: <Explainability /> },
  { id: 7, label: "DPDP Auditor",         icon: "✅", component: <DPDPAuditor /> },
];

export default function NewSections() {
  const [active, setActive] = useState(0);

  return (
    <div className="new-sections-page">
      <div className="page-header">
        <h1 className="page-title">MedShield — Advanced Analytics</h1>
        <p className="page-sub">
          8 AI-powered sections built on your anonymized dataset · DPDP Act 2023 compliant
        </p>
      </div>

      <nav className="main-tab-bar" role="tablist" aria-label="Section navigation">
        {TABS.map(t => (
          <button
            key={t.id}
            role="tab"
            aria-selected={active === t.id}
            className={`main-tab ${active === t.id ? "active" : ""}`}
            onClick={() => setActive(t.id)}
          >
            <span className="tab-icon">{t.icon}</span>
            <span className="tab-label">{t.label}</span>
          </button>
        ))}
      </nav>

      <div className="tab-content" role="tabpanel">
        {TABS[active].component}
      </div>
    </div>
  );
}
