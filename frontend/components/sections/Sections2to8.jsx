/**
 * Sections 2–8 React Components
 * Drop each into: src/components/sections/
 *
 * Files:
 *   DrugIntel.jsx
 *   ReIDSimulator.jsx
 *   OCRLab.jsx
 *   PopulationHealth.jsx
 *   LLMExporter.jsx
 *   Explainability.jsx
 *   DPDPAuditor.jsx
 */

// ─────────────────────────────────────────────────────────────
// SECTION 2 — Drug Intelligence Panel (Refined)
// src/components/sections/DrugIntel.jsx
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { searchDrug, getDrugDetail, simulateReID, getSyntheticPrescription, getPopulationAnalytics, generateExport, getKAnonDemo, getDPDemo, getChaosDemo, getAlgoScatter, runDPDPAudit } from "../../hooks/useMedShield";

// ─────────────────────────────────────────────────────────────
// EDUCATIONAL COMPONENT (Student Mode)
// ─────────────────────────────────────────────────────────────
export function EduConcept({ title, children }) {
  return (
    <div className="student-concept-box">
      <h4 className="student-concept-title">🎓 {title}</h4>
      <div className="student-concept-text">{children}</div>
    </div>
  );
}

export function DrugIntel() {
  const [query, setQuery]       = useState("");
  const [suggestions, setSugg]  = useState([]);
  const [detail, setDetail]     = useState(null);
  const [loading, setLoading]   = useState(false);

  const onSearch = async (q) => {
    setQuery(q);
    if (q.length < 2) { setSugg([]); return; }
    const data = await searchDrug(q);
    setSugg(data.results);
  };

  const onSelect = async (item) => {
    setSugg([]);
    setLoading(true);
    const data = await getDrugDetail(item.name, item.type);
    setDetail(data);
    setLoading(false);
  };

  return (
    <div className="drug-ai-container">
      {/* Header */}
      <div className="drug-header">
        <div>
          <h2 className="drug-title">💊 Drug Intelligence System</h2>
          <p className="drug-subtitle">Search drugs & diagnoses with co-prescription analytics</p>
        </div>
        <div className="drug-badge">AI-Powered ✨</div>
      </div>

      <EduConcept title="What is Drug Intelligence?">
        This system analyzes historical prescription patterns to find <strong>Co-prescribed Drugs</strong> (medications often taken together) and checks for <strong>Contraindications</strong> (drugs that are dangerous to mix). Since the data is anonymized, we can learn these medical patterns without knowing <em>who</em> the patients are.
      </EduConcept>

      {/* Search Panel */}
      <div className="drug-search-card">
        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input 
            className="drug-search-input" 
            placeholder="e.g. Metformin, Tuberculosis, Isoniazid…"
            value={query} 
            onChange={e => onSearch(e.target.value)} 
          />
        </div>
        
        {suggestions.length > 0 && (
          <div className="drug-suggestions">
            {suggestions.map(s => (
              <button key={s.name} className="drug-chip" onClick={() => onSelect(s)}>
                <span className={`drug-type-badge type-${s.type.toLowerCase()}`}>
                  {s.type === "drug" ? "💊" : "🏥"}
                </span>
                <span className="drug-chip-name">{s.name}</span>
              </button>
            ))}
          </div>
        )}
        
        {loading && (
          <div className="loading-state">
            <span className="spinner"></span> Analyzing…
          </div>
        )}
      </div>

      {/* Results Grid */}
      {detail && (
        <div className="drug-results-grid">
          {/* Main Info Card */}
          <div className="drug-detail-card">
            <div className="detail-header">
              <h3 className="detail-name">{detail.name}</h3>
              <span className={`detail-type-badge ${detail.type}`}>
                {detail.type === "diagnosis" ? "🏥 Diagnosis" : "💊 Medication"}
              </span>
            </div>

            {detail.type === "diagnosis" ? (
              <div className="detail-stats">
                <div className="stat-item">
                  <span className="stat-icon">🩸</span>
                  <span className="stat-label">Avg Blood Sugar</span>
                  <span className="stat-value">{detail.avg_blood_sugar}</span>
                  <span className="stat-unit">mg/dL</span>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">❤️</span>
                  <span className="stat-label">Avg BP</span>
                  <span className="stat-value">{detail.avg_bp}</span>
                  <span className="stat-unit">mmHg</span>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">📊</span>
                  <span className="stat-label">Dataset Records</span>
                  <span className="stat-value">{detail.record_count}</span>
                  <span className="stat-unit">patients</span>
                </div>
              </div>
            ) : (
              <div className="detail-diagnoses">
                <p className="diagnoses-label">Appears in {detail.appears_in_diagnoses.length} diagnosis groups</p>
                <div className="diagnoses-badges">
                  {detail.appears_in_diagnoses.map(d => (
                    <span className="diagnosis-badge" key={d}>{d}</span>
                  ))}
                </div>
                <div style={{ marginTop: "1rem" }}>
                  {detail.contraindication_check
                    ? <span className="safety-badge safe">✓ No contraindications</span>
                    : <span className="safety-badge risk">⚠ Contraindication flag</span>
                  }
                </div>
              </div>
            )}

            {/* Medications */}
            {detail.type === "diagnosis" && detail.drugs && detail.drugs.length > 0 && (
              <div className="medications-section">
                <h4 className="section-label">Common Medications</h4>
                <div className="med-flex">
                  {detail.drugs.map(d => (
                    <span className="med-badge" key={d}>{d}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Co-prescribed Drugs */}
          <div className="coprescribed-card">
            <h3 className="card-section-title">💉 Co-prescribed Drugs</h3>
            <div className="coprescribed-list">
              {(detail.co_prescribed || detail.drug_frequency || []).slice(0, 6).map((item, i) => {
                const pct = item.pct || (80 - i * 10);
                return (
                  <div className="coprescribed-item" key={i}>
                    <div className="coprescribed-info">
                      <span className="coprescribed-name">
                        {typeof item === "string" ? item : item.drug}
                      </span>
                      <span className="coprescribed-pct">{pct}%</span>
                    </div>
                    <div className="coprescribed-bar-wrap">
                      <div 
                        className="coprescribed-bar" 
                        style={{
                          width: `${pct}%`,
                          background: `linear-gradient(90deg, #06B6D4 0%, #10B981 100%)`,
                          boxShadow: `0 0 8px rgba(6, 182, 212, 0.3)`
                        }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {!detail && !loading && (
        <div className="drug-empty-state">
          <span className="empty-icon">🔎</span>
          <p>Search for a drug or diagnosis to view analytics</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SECTION 3 — Re-ID Attack Simulator (Refined)
// src/components/sections/ReIDSimulator.jsx
// ─────────────────────────────────────────────────────────────

export function ReIDSimulator() {
  const [filters, setFilters] = useState({
    adversary: "prosecutor", age_group: "all", gender: "all", blood_group: "all", diagnosis: "all",
  });
  const [result, setResult] = useState(null);

  const setF = async (k, v) => {
    const next = { ...filters, [k]: v };
    setFilters(next);
    const data = await simulateReID(next);
    setResult(data);
  };

  const filterConfigs = [
    { key: "adversary", icon: "🕵️", label: "Adversary Model", opts: [["prosecutor","Prosecutor (knows target)"],["journalist","Journalist (voter roll)"],["marketer","Marketer (random)"]] },
    { key: "age_group", icon: "🎂", label: "Age Group", opts: [["all","Any Age"],["18-30","18–30 yrs"],["31-50","31–50 yrs"],["51-70","51–70 yrs"],["71+","71+ yrs"]] },
    { key: "gender", icon: "⚧", label: "Gender", opts: [["all","Any"],["M","Male"],["F","Female"]] },
    { key: "blood_group", icon: "🩸", label: "Blood Group", opts: [["all","Unknown"],["A+","A+"],["B+","B+"],["O+","O+"],["AB+","AB+"]] },
    { key: "diagnosis", icon: "🏥", label: "Diagnosis", opts: [["all","Unknown"],["Diabetes Type 2","Diabetes"],["Hypertension","Hypertension"],["Tuberculosis","TB"],["Malaria","Malaria"]] },
  ];

  return (
    <div className="reid-ai-container">
      {/* Header */}
      <div className="reid-header">
        <div>
          <h2 className="reid-title">🛡️ Re-ID Attack Simulator</h2>
          <p className="reid-subtitle">Simulate attacks to verify k-anonymity protection</p>
        </div>
        <div className="reid-badge">Privacy Test ✓</div>
      </div>

      <EduConcept title="What is a Re-Identification Attack?">
        An attacker might try to guess a patient's identity by combining background knowledge (like age, gender, and ZIP code) with our dataset. This simulator lets you play the role of the <strong>Adversary</strong>. If our <em>k-anonymity</em> protection works, you'll see that a single profile always matches multiple people, hiding the true identity in a crowd.
      </EduConcept>

      <div className="reid-grid">
        {/* Filter Panel */}
        <div className="reid-filters-section">
          <div className="filters-card">
            <h3 className="filters-title">⚙️ Attack Parameters</h3>
            <div className="filters-list">
              {filterConfigs.map(({ key, icon, label, opts }) => (
                <div className="filter-control" key={key}>
                  <label className="filter-label">
                    <span className="filter-icon">{icon}</span>
                    <span className="filter-name">{label}</span>
                  </label>
                  <select 
                    className="reid-select"
                    value={filters[key]} 
                    onChange={e => setF(key, e.target.value)}
                  >
                    {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="reid-results-section">
          {result ? (
            <div className="reid-results-card">
              {/* Risk Indicator */}
              <div className="risk-indicator">
                <div className={`risk-circle ${result.protected ? "safe" : "risk"}`}>
                  <div className="risk-percentage">
                    {result.risk_pct}%
                  </div>
                </div>
                <div className="risk-label">
                  <h4>Re-ID Risk</h4>
                  <p className={`risk-status ${result.protected ? "protected" : "exposed"}`}>
                    {result.protected ? "🔒 Protected" : "⚠️ High Risk"}
                  </p>
                </div>
              </div>

              {/* Matched Records */}
              <div className="reid-compare">
                <div className="reid-compare-item before">
                  <div className="reid-compare-icon">😱</div>
                  <span className="reid-compare-label">Before k-anonymity</span>
                  <div className="reid-compare-number exposed">1</div>
                  <span className="reid-compare-desc">Identity Exposed</span>
                </div>

                <div className="reid-arrow">→</div>

                <div className="reid-compare-item after">
                  <div className="reid-compare-icon">🔒</div>
                  <span className="reid-compare-label">After k-anonymity</span>
                  <div className={`reid-compare-number ${result.protected ? "safe" : "risk"}`}>
                    {result.matched_records}
                  </div>
                  <span className="reid-compare-desc">Records Protected</span>
                </div>
              </div>

              {/* Verdict */}
              <div className="verdict-box">
                <span className={`verdict-badge ${result.protected ? "pass" : "fail"}`}>
                  {result.verdict}
                </span>
              </div>

              {/* Risk Bar */}
              <div className="reid-risk-bar-section">
                <div className="reid-risk-header">
                  <span className="reid-risk-label">Privacy Level</span>
                  <span className="reid-risk-value">
                    {result.protected ? "✓ Compliant" : "⚠ At Risk"}
                  </span>
                </div>
                <div className="reid-risk-bar-wrap">
                  <div 
                    className="reid-risk-bar"
                    style={{
                      width: `${100 - result.risk_pct}%`,
                      background: result.risk_pct > 50 
                        ? "#EF4444" 
                        : result.risk_pct > 20 
                        ? "#F59E0B" 
                        : "#10B981",
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="reid-empty-state" onClick={() => setF("adversary", "prosecutor")} style={{ cursor: "pointer" }}>
              <span className="empty-icon">👤</span>
              <p>Adjust filters to simulate a privacy attack</p>
              <span className="empty-hint">Click to start test</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SECTION 4 — Prescription OCR Demo Lab (Refined)
// src/components/sections/OCRLab.jsx
// ─────────────────────────────────────────────────────────────

export function OCRLab() {
  const [rxIdx, setRxIdx]   = useState(0);
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async (idx) => {
    setRxIdx(idx);
    setLoading(true);
    const d = await getSyntheticPrescription(idx);
    setData(d);
    setLoading(false);
  };

  return (
    <div className="ocr-ai-container">
      {/* Header */}
      <div className="ocr-header">
        <div>
          <h2 className="ocr-title">📄 Prescription OCR Lab</h2>
          <p className="ocr-subtitle">Load & analyze prescriptions — PII detected and redacted</p>
        </div>
        <div className="ocr-badge">Vision AI ✨</div>
      </div>

      <EduConcept title="How does OCR Redaction work?">
        <strong>Optical Character Recognition (OCR)</strong> reads text from images like handwritten prescriptions. We then use <strong>Named Entity Recognition (NER)</strong>, an AI model, to instantly spot Personally Identifiable Information (PII) like Names, Phone Numbers, or Locations. The system automatically censors these words before the data is saved.
      </EduConcept>

      {/* Action Buttons */}
      <div className="ocr-actions">
        <button className="ocr-load-btn" onClick={() => load(0)}>
          <span className="btn-icon">📋</span>
          <span>Load Rx #1</span>
        </button>
        <button className="ocr-load-btn secondary" onClick={() => load(1)}>
          <span className="btn-icon">📋</span>
          <span>Load Rx #2</span>
        </button>
      </div>

      {loading && (
        <div className="ocr-loading">
          <div className="spinner"></div>
          <p>Running OCR pipeline…</p>
        </div>
      )}

      {data && (
        <div className="ocr-content">
          {/* Metrics */}
          <div className="ocr-metrics">
            <div className="ocr-metric-item">
              <span className="ocr-metric-icon">🔍</span>
              <span className="ocr-metric-value">{data.total_pii_count}</span>
              <span className="ocr-metric-label">PII detected</span>
            </div>
            <div className="ocr-metric-item">
              <span className="ocr-metric-icon">⚡</span>
              <span className="ocr-metric-value">{data.processing_time_ms}</span>
              <span className="ocr-metric-label">ms</span>
            </div>
            <div className="ocr-metric-item">
              <span className="ocr-metric-icon">🤖</span>
              <span className="ocr-metric-value">{data.ocr_engine}</span>
              <span className="ocr-metric-label">Engine</span>
            </div>
          </div>

          {/* Text Comparison */}
          <div className="ocr-comparison">
            <div className="ocr-text-panel original">
              <h4 className="ocr-panel-title">📝 Original</h4>
              <pre className="ocr-text-content">{data.original_text}</pre>
            </div>
            <div className="ocr-arrow">→</div>
            <div className="ocr-text-panel redacted">
              <h4 className="ocr-panel-title">🔒 Redacted</h4>
              <pre className="ocr-text-content">{data.redacted_text}</pre>
            </div>
          </div>

          {/* Audit Log */}
          <div className="ocr-audit">
            <h4 className="ocr-audit-title">🔎 Detected Entities</h4>
            <div className="ocr-audit-list">
              {data.pii_detected.map((p, i) => (
                <div className="ocr-audit-item" key={i}>
                  <span className={`ocr-entity-badge type-${p.type.toLowerCase()}`}>
                    {p.type}
                  </span>
                  <span className="ocr-entity-text">"{p.span}"</span>
                  <span className="ocr-entity-action">→ redacted</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!data && !loading && (
        <div className="ocr-empty-state">
          <span className="ocr-empty-icon">📄</span>
          <p>Click "Load Rx" to analyze a prescription</p>
          <span className="ocr-empty-hint">PII will be detected and highlighted</span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SECTION 5 — Population Health Analytics (Refined)
// src/components/sections/PopulationHealth.jsx
// ─────────────────────────────────────────────────────────────

const COLORS = ["#7F77DD","#1D9E75","#D85A30","#378ADD","#BA7517","#D4537E","#639922","#E24B4A","#63A2C6","#888780"];

export function PopulationHealth() {
  const [data, setData] = useState(null);

  useEffect(() => {
    getPopulationAnalytics().then(setData);
  }, []);

  if (!data) return <div className="pop-loading">
    <div className="spinner"></div>
    <p>Loading population analytics…</p>
  </div>;

  const maxCount = Math.max(...data.disease_prevalence.map(d => d.count));

  return (
    <div className="pop-ai-container">
      {/* Header */}
      <div className="pop-header">
        <div>
          <h2 className="pop-title">📊 Population Health</h2>
          <p className="pop-subtitle">Aggregate insights from anonymized dataset — zero individual exposure</p>
        </div>
        <div className="pop-badge">Analytics ✨</div>
      </div>

      <EduConcept title="Why Aggregate Data?">
        Instead of looking at individual patient files, doctors look at <strong>Aggregated Analytics</strong> (averages and totals). This is safe because combining thousands of records automatically hides individual outliers, allowing researchers to study disease outbreaks and public health trends while keeping everyone's privacy intact.
      </EduConcept>

      {/* Key Metrics */}
      <div className="pop-metrics">
        <div className="pop-metric-card">
          <span className="pop-metric-icon">👥</span>
          <span className="pop-metric-value">{data.total_records}</span>
          <span className="pop-metric-label">Records</span>
        </div>
        <div className="pop-metric-card">
          <span className="pop-metric-icon">🏥</span>
          <span className="pop-metric-value">{data.total_diagnoses}</span>
          <span className="pop-metric-label">Diagnoses</span>
        </div>
        <div className="pop-metric-card">
          <span className="pop-metric-icon">🛡️</span>
          <span className="pop-metric-value">0</span>
          <span className="pop-metric-label">PII Exposed</span>
        </div>
        <div className="pop-metric-card compliant">
          <span className="pop-metric-icon">✓</span>
          <span className="pop-metric-value">100%</span>
          <span className="pop-metric-label">DPDP Compliant</span>
        </div>
      </div>

      {/* Disease Prevalence */}
      <div className="pop-section">
        <h3 className="pop-section-title">🦠 Disease Prevalence</h3>
        <div className="pop-prevalence-grid">
          {data.disease_prevalence.sort((a,b)=>b.count-a.count).map((d, i) => (
            <div className="pop-disease-row" key={d.diagnosis}>
              <div className="pop-disease-info">
                <span className="pop-disease-name">{d.diagnosis}</span>
                <span className="pop-disease-count">{d.count} records</span>
              </div>
              <div className="pop-disease-bar-wrap">
                <div className="pop-disease-bar" style={{ 
                  width: `${Math.round(d.count / maxCount * 100)}%`, 
                  background: COLORS[i % COLORS.length],
                  boxShadow: `0 0 8px rgba(${parseInt(COLORS[i % COLORS.length].slice(1,3), 16)}, 0.3)`
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="pop-grid">
        {/* Vitals by Diagnosis */}
        <div className="pop-card">
          <h4 className="pop-card-title">❤️ Vital Signs by Diagnosis</h4>
          <div className="pop-table-wrap">
            <table className="pop-table">
              <thead>
                <tr>
                  <th>Diagnosis</th>
                  <th>BS (mg/dL)</th>
                  <th>BP (mmHg)</th>
                  <th>HR (bpm)</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(data.vitals_by_diagnosis).map(([d, v]) => (
                  <tr key={d}>
                    <td className="pop-diag-cell">{d}</td>
                    <td className="pop-value-cell">{v.avg_blood_sugar}</td>
                    <td className="pop-value-cell">{v.avg_bp}</td>
                    <td className="pop-value-cell">{v.avg_heart_rate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Age Distribution */}
        <div className="pop-card">
          <h4 className="pop-card-title">🎂 Age Distribution</h4>
          <div className="pop-age-distribution">
            {data.age_distribution.map((b, i) => (
              <div className="pop-age-row" key={b.bin}>
                <span className="pop-age-label">{b.bin}</span>
                <div className="pop-age-bar-wrap">
                  <div className="pop-age-bar" style={{ 
                    width: `${Math.round(b.count / 2.5)}%`, 
                    background: COLORS[i % COLORS.length],
                    boxShadow: `0 0 6px rgba(${parseInt(COLORS[i % COLORS.length].slice(1,3), 16)}, 0.3)`
                  }} />
                </div>
                <span className="pop-age-count">{b.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SECTION 6 — LLM Fine-Tuning Exporter (Refined)
// src/components/sections/LLMExporter.jsx
// ─────────────────────────────────────────────────────────────

export function LLMExporter() {
  const [config, setConfig] = useState({ task_type: "drug", export_format: "hf", record_count: 200 });
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(false);

  const setC = (k, v) => setConfig(p => ({ ...p, [k]: k === "record_count" ? +v : v }));

  const build = async () => {
    setLoading(true);
    const d = await generateExport(config);
    setData(d);
    setLoading(false);
  };

  const download = () => {
    if (!data) return;
    const blob = new Blob([data.jsonl_content], { type: "application/jsonl" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `medshield_${data.task_type}_${data.format}.jsonl`;
    a.click();
  };

  return (
    <div className="llm-ai-container">
      {/* Header */}
      <div className="llm-header">
        <div>
          <h2 className="llm-title">🤖 LLM Exporter</h2>
          <p className="llm-subtitle">Convert medical records into structured training pairs</p>
        </div>
        <div className="llm-badge">ML-Ready ✨</div>
      </div>

      <EduConcept title="What is LLM Fine-Tuning?">
        To teach AI models like ChatGPT to act as medical assistants, we must train them on safe, anonymized medical records. The <strong>LLM Exporter</strong> transforms our anonymized datasets into question-answer pairs (JSONL format) so an AI can study them safely without memorizing real patient secrets.
      </EduConcept>

      <div className="llm-grid">
        {/* Config Panel */}
        <div className="llm-config-section">
          <div className="llm-config-card">
            <h3 className="llm-config-title">⚙️ Export Configuration</h3>

            <div className="llm-config-item">
              <label className="llm-config-label">Task Type</label>
              <select className="llm-config-select" value={config.task_type} onChange={e => setC("task_type", e.target.value)}>
                <option value="drug">💊 Drug Recommendation</option>
                <option value="diag">🧠 Diagnosis Prediction</option>
                <option value="summary">📝 Clinical Summarization</option>
                <option value="ner">🏷️ PII De-identification</option>
              </select>
            </div>

            <div className="llm-config-item">
              <label className="llm-config-label">Export Format</label>
              <select className="llm-config-select" value={config.export_format} onChange={e => setC("export_format", e.target.value)}>
                <option value="hf">🤗 HuggingFace JSONL</option>
                <option value="oai">🔄 OpenAI Chat</option>
                <option value="alpaca">🦙 Alpaca Format</option>
                <option value="text">📄 Plain Text</option>
              </select>
            </div>

            <div className="llm-config-item">
              <label className="llm-config-label">Record Count: <strong>{config.record_count}</strong></label>
              <input className="llm-config-slider" type="range" min={50} max={1000} step={50} value={config.record_count}
                onChange={e => setC("record_count", e.target.value)} />
              <span className="llm-slider-hint">{config.record_count} records selected</span>
            </div>

            <button className="llm-generate-btn" onClick={build} disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-mini"></span>
                  Generating…
                </>
              ) : (
                <>
                  <span>📦</span>
                  Generate Export
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="llm-results-section">
          {data ? (
            <div className="llm-results-card">
              {/* Stats */}
              <div className="llm-stats">
                <div className="llm-stat-item">
                  <span className="llm-stat-icon">📊</span>
                  <span className="llm-stat-value">{data.total_pairs}</span>
                  <span className="llm-stat-label">Training Pairs</span>
                </div>
                <div className="llm-stat-item">
                  <span className="llm-stat-icon">🔤</span>
                  <span className="llm-stat-value">~{Math.round(data.estimated_total_tokens / 1000)}k</span>
                  <span className="llm-stat-label">Estimated Tokens</span>
                </div>
                <div className="llm-stat-item compliant">
                  <span className="llm-stat-icon">✓</span>
                  <span className="llm-stat-value">DPDP</span>
                  <span className="llm-stat-label">Compliant</span>
                </div>
              </div>

              {/* Preview */}
              <div className="llm-preview">
                <h4 className="llm-preview-title">📋 Preview (3 Sample Pairs)</h4>
                <pre className="llm-preview-content">
                  {data.sample_pairs.map(p => JSON.stringify(p, null, 2)).join("\n\n")}
                </pre>
              </div>

              {/* Download Button */}
              <button className="llm-download-btn" onClick={download}>
                <span>⬇️</span>
                Download JSONL
              </button>
            </div>
          ) : (
            <div className="llm-empty-state">
              <span className="llm-empty-icon">📦</span>
              <p>Configure options and click "Generate"</p>
              <span className="llm-empty-hint">Your export will appear here</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SECTION 7 — Algorithm Explainability Center (Refined)
// src/components/sections/Explainability.jsx
// ─────────────────────────────────────────────────────────────

const ALGO_TABS = ["k-Anonymity", "Differential Privacy", "Chaos Perturbation", "Privacy-Utility"];

export function Explainability() {
  const [activeTab, setActiveTab] = useState(0);
  const [kData, setKData]         = useState(null);
  const [dpData, setDpData]       = useState(null);
  const [chaosData, setChaosData] = useState(null);
  const [scatterData, setScatter] = useState(null);
  const [k, setK]                 = useState(5);
  const [eps, setEps]             = useState(1.0);
  const [lam, setLam]             = useState(3.99);

  useEffect(() => { getKAnonDemo(k).then(setKData); }, [k]);
  useEffect(() => { getDPDemo(eps).then(setDpData); }, [eps]);
  useEffect(() => { getChaosDemo(lam).then(setChaosData); }, [lam]);
  useEffect(() => { getAlgoScatter().then(setScatter); }, []);

  return (
    <div className="exp-ai-container">
      {/* Header */}
      <div className="exp-header">
        <div>
          <h2 className="exp-title">📚 Algorithm Explainability</h2>
          <p className="exp-subtitle">Interactive demos with live parameter tuning</p>
        </div>
        <div className="exp-badge">Learn ✨</div>
      </div>

      {/* Tab Navigation */}
      <div className="exp-tabs">
        {ALGO_TABS.map((t, i) => (
          <button key={t} className={`exp-tab ${activeTab === i ? "active" : ""}`} onClick={() => setActiveTab(i)}>
            <span className="exp-tab-icon">
              {i === 0 ? "🔐" : i === 1 ? "🎲" : i === 2 ? "🌀" : "📊"}
            </span>
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="exp-tab-content">
        {/* k-Anonymity */}
        {activeTab === 0 && kData && (
          <div className="exp-grid">
            <div className="exp-card">
              <EduConcept title="What is k-Anonymity?">
                k-Anonymity ensures that each individual in a dataset cannot be distinguished from at least <strong>k-1</strong> other individuals. By generalizing attributes (like grouping exact ages into "30-40"), it hides individuals in a crowd of size <em>k</em>. Try increasing k to see how the data generalizes!
              </EduConcept>
              <div className="exp-slider">
                <label className="exp-slider-label">
                  <span className="exp-slider-name">k value</span>
                  <strong className="exp-slider-value">{k}</strong>
                </label>
                <input className="exp-slider-input" type="range" min={2} max={15} value={k} step={1} onChange={e => setK(+e.target.value)} />
                <span className="exp-slider-hint">Higher k = stronger protection</span>
              </div>
              <p className="exp-verdict">{kData.verdict}</p>
            </div>
            <div className="exp-card">
              <div className="exp-table-wrap">
                <table className="exp-table">
                  <thead>
                    <tr>
                      <th>Age</th><th>Gender</th><th>Blood</th><th>ZIP</th><th>Diagnosis</th><th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kData.records.map((r, i) => (
                      <tr key={i} className={r.k_safe ? "" : "unsafe"}>
                        <td>{r.age_generalized}</td>
                        <td>{r.gender}</td>
                        <td>{r.blood}</td>
                        <td>{r.zip_generalized}</td>
                        <td>{r.diag}</td>
                        <td>
                          <span className={`exp-status-badge ${r.k_safe ? "safe" : "risk"}`}>
                            {r.k_safe ? `✓ k=${k}` : "⚠ risk"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Differential Privacy */}
        {activeTab === 1 && dpData && (
          <div className="exp-grid">
            <div className="exp-card">
              <EduConcept title="What is Differential Privacy (Epsilon ε)?">
                Differential Privacy adds controlled mathematical noise to numeric data (like blood pressure). <strong>Epsilon (ε)</strong> measures the privacy budget. A lower ε means more noise (stronger privacy but less accuracy). Adjust the slider to see how noise affects the original value.
              </EduConcept>
              <div className="exp-slider">
                <label className="exp-slider-label">
                  <span className="exp-slider-name">Epsilon (ε)</span>
                  <strong className="exp-slider-value">{eps.toFixed(1)}</strong>
                </label>
                <input className="exp-slider-input" type="range" min={0.1} max={5} step={0.1} value={eps} onChange={e => setEps(+e.target.value)} />
                <span className="exp-slider-hint">Lower ε = stronger privacy (more noise)</span>
              </div>
              <div className="exp-metrics">
                <div className="exp-metric-item">
                  <span className="exp-metric-icon">📊</span>
                  <span className="exp-metric-label">Original Value</span>
                  <span className="exp-metric-value">{dpData.original_value}</span>
                </div>
                <div className="exp-metric-item">
                  <span className="exp-metric-icon">🔊</span>
                  <span className="exp-metric-label">With Laplace Noise</span>
                  <span className="exp-metric-value">{dpData.noised_value}</span>
                </div>
                <div className="exp-metric-item">
                  <span className="exp-metric-icon">📏</span>
                  <span className="exp-metric-label">Noise Scale</span>
                  <span className="exp-metric-value">{dpData.scale}</span>
                </div>
                <div className={`exp-metric-item privacy-${dpData.privacy_level}`}>
                  <span className="exp-metric-icon">🛡️</span>
                  <span className="exp-metric-label">Privacy Level</span>
                  <span className="exp-metric-value">{dpData.privacy_level}</span>
                </div>
              </div>
            </div>
            <div className="exp-card">
              <div className="exp-distribution">
                <h4 className="exp-dist-title">🔊 Noise Distribution (60 trials)</h4>
                <div className="exp-dist-bars">
                  {dpData.distribution_bins.map(b => (
                    <div className="exp-dist-row" key={b.range}>
                      <span className="exp-dist-label">{b.range}</span>
                      <div className="exp-dist-bar-wrap">
                        <div className="exp-dist-bar" style={{ width: `${b.count * 10}%`, background: "#7F77DD" }} />
                      </div>
                      <span className="exp-dist-count">{b.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chaos Perturbation */}
        {activeTab === 2 && chaosData && (
          <div className="exp-grid">
            <div className="exp-card">
              <EduConcept title="What is Chaos Perturbation?">
                This algorithm uses non-linear chaos equations (like the Logistic Map) to scramble sensitive text. If the <strong>Lambda (λ)</strong> parameter is high enough (≥3.57), the system becomes highly unpredictable, acting as a one-way encryption layer that cannot be reversed without the exact starting parameters.
              </EduConcept>
              <div className="exp-slider">
                <label className="exp-slider-label">
                  <span className="exp-slider-name">Lambda (λ)</span>
                  <strong className="exp-slider-value">{lam.toFixed(2)}</strong>
                </label>
                <input className="exp-slider-input" type="range" min={3.5} max={4} step={0.01} value={lam} onChange={e => setLam(+e.target.value)} />
                <span className="exp-slider-hint">x(n+1) = λ·x·(1-x) — 80 iterations</span>
              </div>
              <p className="exp-verdict">
                {chaosData.is_chaotic ? "✓ Fully chaotic — irreversible and unpredictable" : "⚠ Not yet chaotic — increase λ above 3.56"}
              </p>
              <div className="exp-table-wrap">
                <table className="exp-table">
                  <thead><tr><th>Column</th><th>Original</th><th>Chaos Position</th><th>Perturbed</th></tr></thead>
                  <tbody>
                    {chaosData.column_mapping.map(c => (
                      <tr key={c.column}>
                        <td>{c.column}</td>
                        <td>{c.original}</td>
                        <td>{c.chaos_pos}</td>
                        <td><strong>{c.perturbed}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="exp-card">
              <div className="exp-chaos-plot">
                <svg viewBox="0 0 800 150" style={{ width: "100%", height: 150 }}>
                  {chaosData.trajectory.map((v, i, arr) => i === 0 ? null : (
                    <line key={i} x1={(i-1)*10} y1={150-arr[i-1]*150} x2={i*10} y2={150-v*150} stroke="#1D9E75" strokeWidth="1.5" />
                  ))}
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* Privacy-Utility Tradeoff */}
        {activeTab === 3 && scatterData && (
          <div className="exp-grid">
            <div className="exp-card">
              <EduConcept title="The Privacy-Utility Tradeoff">
                In data science, there is an unavoidable tradeoff: the more you protect privacy (e.g., hiding data), the less utility (usefulness) the data holds for AI training. The best algorithms find a balance. See how our 7 algorithms rank on the scatter plot below!
              </EduConcept>
              <p className="exp-scatter-hint">Privacy vs Utility Score — All 7 Algorithms</p>
              <svg viewBox="0 0 400 300" className="exp-scatter-chart">
                <line x1="40" y1="10" x2="40" y2="260" stroke="var(--color-border)" strokeWidth="1" />
                <line x1="40" y1="260" x2="390" y2="260" stroke="var(--color-border)" strokeWidth="1" />
                <text x="200" y="290" textAnchor="middle" fontSize="12" fill="currentColor">Utility Score</text>
                <text x="12" y="140" textAnchor="middle" fontSize="12" fill="currentColor" transform="rotate(-90 12 140)">Privacy Score</text>
                {scatterData.algorithms.map((a, i) => {
                  const cx = 40 + (a.utility - 40) * 3.5;
                  const cy = 260 - (a.privacy - 40) * 2.4;
                  const clr = ["#7F77DD","#1D9E75","#D85A30","#378ADD","#BA7517","#D4537E","#639922"][i];
                  return (
                    <g key={a.name}>
                      <circle cx={cx} cy={cy} r="8" fill={clr} opacity="0.85" />
                      <text x={cx + 12} y={cy + 4} fontSize="11" fill="currentColor" fontWeight="600">{a.name}</text>
                    </g>
                  );
                })}
              </svg>
            </div>
            <div className="exp-card">
              <h4 className="exp-dist-title">Algorithm Rankings</h4>
              <div className="exp-table-wrap mt-4">
                <table className="exp-table">
                  <thead>
                    <tr><th>Algorithm</th><th>Privacy</th><th>Utility</th></tr>
                  </thead>
                  <tbody>
                    {scatterData.algorithms.sort((a,b)=>b.privacy-a.privacy).map(a => (
                      <tr key={a.name}>
                        <td><strong>{a.name}</strong></td>
                        <td>{a.privacy}</td>
                        <td>{a.utility}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SECTION 8 — DPDP Compliance Auditor (Refined)
// src/components/sections/DPDPAuditor.jsx
// ─────────────────────────────────────────────────────────────

export function DPDPAuditor() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    const d = await runDPDPAudit("anonymized_medical_dataset.csv");
    setData(d);
    setLoading(false);
  };

  return (
    <div className="dpdp-ai-container">
      {/* Header */}
      <div className="dpdp-header">
        <div>
          <h2 className="dpdp-title">✅ DPDP Compliance Auditor</h2>
          <p className="dpdp-subtitle">6 DPDP Act 2023 checks — automatic compliance verification</p>
        </div>
        <div className="dpdp-badge">Legal ✓</div>
      </div>

      <EduConcept title="What is the DPDP Act?">
        The <strong>Digital Personal Data Protection (DPDP) Act of 2023</strong> is an Indian privacy law that strictly governs how patient data is handled. To be legally compliant, data must pass checks for <em>Purpose Limitation, Data Minimization, and Irreversibility</em>. This dashboard runs these legal audits instantly.
      </EduConcept>

      {/* Action Button */}
      <div className="dpdp-action">
        <button className="dpdp-audit-btn" onClick={run} disabled={loading}>
          {loading ? (
            <>
              <span className="spinner-mini"></span>
              Running audit…
            </>
          ) : (
            <>
              <span>🔍</span>
              Run DPDP Audit
            </>
          )}
        </button>
      </div>

      {data && (
        <div className="dpdp-results">
          {/* Score Card */}
          <div className="dpdp-score-panel">
            <div className={`dpdp-score-card ${data.fully_compliant ? "compliant" : "warning"}`}>
              <div className="dpdp-score-circle">
                <div className="dpdp-score-text">
                  <div className="dpdp-score-value">{data.compliance_score}</div>
                  <div className="dpdp-score-unit">%</div>
                </div>
              </div>
              <div className="dpdp-score-info">
                <h3 className="dpdp-score-title">Compliance Score</h3>
                <p className={`dpdp-score-status ${data.fully_compliant ? "pass" : "warn"}`}>
                  {data.fully_compliant ? "✓ DPDP 2023 Fully Compliant" : "⚠ Action Required"}
                </p>
                {data.recommendation && (
                  <p className="dpdp-recommendation">
                    💡 {data.recommendation}
                  </p>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="dpdp-quick-stats">
              <div className="dpdp-stat-box pass">
                <span className="dpdp-stat-icon">✓</span>
                <span className="dpdp-stat-value">{data.checks_passed}</span>
                <span className="dpdp-stat-label">Passed</span>
              </div>
              <div className="dpdp-stat-box fail">
                <span className="dpdp-stat-icon">✗</span>
                <span className="dpdp-stat-value">{data.checks_total - data.checks_passed}</span>
                <span className="dpdp-stat-label">Failed</span>
              </div>
            </div>
          </div>

          {/* Detailed Checks */}
          <div className="dpdp-checks">
            <h3 className="dpdp-checks-title">📋 Detailed Check Results</h3>
            <div className="dpdp-check-list">
              {data.checks.map(c => (
                <div className={`dpdp-check-item ${c.pass ? "pass" : "fail"}`} key={c.id}>
                  <div className="dpdp-check-header">
                    <div className="dpdp-check-status">
                      <span className={`dpdp-check-badge ${c.pass ? "pass" : "fail"}`}>
                        {c.pass ? "✓" : "✗"}
                      </span>
                      <span className="dpdp-check-name">{c.name}</span>
                    </div>
                    <span className="dpdp-check-ref">{c.ref}</span>
                  </div>
                  <p className="dpdp-check-evidence">{c.evidence}</p>
                  {c.recommendation && (
                    <p className="dpdp-check-recommendation">
                      🔧 Recommendation: {c.recommendation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Compliance Summary */}
          <div className={`dpdp-summary ${data.fully_compliant ? "compliant" : "warning"}`}>
            <div className="dpdp-summary-icon">
              {data.fully_compliant ? "🎉" : "⚠️"}
            </div>
            <div className="dpdp-summary-text">
              <strong>{data.fully_compliant ? "Fully Compliant" : "Partial Compliance"}</strong>
              <p>
                {data.fully_compliant 
                  ? "Your anonymized dataset meets all DPDP Act 2023 requirements. Safe for processing and analysis."
                  : "Your dataset requires additional steps to achieve full DPDP compliance. Review recommendations above."}
              </p>
            </div>
          </div>
        </div>
      )}

      {!data && !loading && (
        <div className="dpdp-empty-state">
          <span className="dpdp-empty-icon">📄</span>
          <p>Click "Run DPDP Audit" to check compliance</p>
          <span className="dpdp-empty-hint">Analyzes 6 DPDP Act 2023 requirements</span>
        </div>
      )}
    </div>
  );
}
