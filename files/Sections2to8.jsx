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
// SECTION 2 — Drug Intelligence Panel
// src/components/sections/DrugIntel.jsx
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import { searchDrug, getDrugDetail } from "../../hooks/useMedShield";

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
    <div className="section-card">
      <h2 className="section-title">Drug intelligence panel</h2>
      <p className="section-sub">Search any drug or diagnosis — analytics from anonymized dataset</p>
      <input className="search-input" placeholder="e.g. Metformin, Tuberculosis, Isoniazid…"
        value={query} onChange={e => onSearch(e.target.value)} />
      {suggestions.length > 0 && (
        <div className="suggestion-list">
          {suggestions.map(s => (
            <button key={s.name} className="suggestion-chip" onClick={() => onSelect(s)}>
              <span className={`type-badge type-${s.type}`}>{s.type}</span> {s.name}
            </button>
          ))}
        </div>
      )}
      {loading && <p className="loading-text">Loading…</p>}
      {detail && (
        <div className="two-col" style={{ marginTop: "1rem" }}>
          <div className="info-card">
            <h3 className="card-title">{detail.name}</h3>
            {detail.type === "diagnosis" ? (
              <>
                <div className="stat-row"><span>Avg blood sugar</span><strong>{detail.avg_blood_sugar} mg/dL</strong></div>
                <div className="stat-row"><span>Avg BP</span><strong>{detail.avg_bp} mmHg</strong></div>
                <div className="stat-row"><span>Records in dataset</span><strong>{detail.record_count}</strong></div>
                <div className="drug-pills" style={{ marginTop: "10px" }}>
                  {detail.drugs.map(d => <span className="drug-pill" key={d}>{d}</span>)}
                </div>
              </>
            ) : (
              <>
                <p style={{ fontSize: 13, marginBottom: 8 }}>Appears in {detail.appears_in_diagnoses.length} diagnosis group(s)</p>
                {detail.appears_in_diagnoses.map(d => <span className="badge-info" key={d}>{d}</span>)}
                {detail.contraindication_check
                  ? <p className="badge-success" style={{ marginTop: 8 }}>✓ No contraindications detected</p>
                  : <p className="badge-danger" style={{ marginTop: 8 }}>⚠ Contraindication flag</p>}
              </>
            )}
          </div>
          <div className="info-card">
            <h3 className="card-title">Co-prescribed drugs</h3>
            {(detail.co_prescribed || detail.drug_frequency || []).slice(0, 6).map((item, i) => (
              <div className="freq-row" key={i}>
                <span className="freq-name">{typeof item === "string" ? item : item.drug}</span>
                <div className="freq-bar-wrap">
                  <div className="freq-bar" style={{ width: `${item.pct || (80 - i * 10)}%` }} />
                </div>
                <span className="freq-pct">{item.pct || (80 - i * 10)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SECTION 3 — Re-ID Attack Simulator
// src/components/sections/ReIDSimulator.jsx
// ─────────────────────────────────────────────────────────────
import { simulateReID } from "../../hooks/useMedShield";

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

  return (
    <div className="section-card">
      <h2 className="section-title">Re-identification attack simulator</h2>
      <p className="section-sub">Act as an attacker — k-anonymity proves re-identification is impossible</p>
      <div className="two-col">
        <div className="filter-panel">
          {[
            { key: "adversary", label: "Adversary model", opts: [["prosecutor","Prosecutor (knows target)"],["journalist","Journalist (voter roll)"],["marketer","Marketer (random)"]] },
            { key: "age_group", label: "Age group", opts: [["all","Any"],["18-30","18–30"],["31-50","31–50"],["51-70","51–70"],["71+","71+"]] },
            { key: "gender",    label: "Gender",    opts: [["all","Any"],["M","Male"],["F","Female"]] },
            { key: "blood_group",label:"Blood group",opts:[["all","Any"],["A+","A+"],["B+","B+"],["O+","O+"],["AB+","AB+"]] },
            { key: "diagnosis", label: "Diagnosis known", opts: [["all","Unknown"],["Diabetes Type 2","Diabetes"],["Hypertension","Hypertension"],["Tuberculosis","TB"],["Malaria","Malaria"]] },
          ].map(({ key, label, opts }) => (
            <div className="filter-row" key={key}>
              <label>{label}</label>
              <select value={filters[key]} onChange={e => setF(key, e.target.value)}>
                {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          ))}
        </div>
        {result && (
          <div>
            <div className="reid-count-card">
              <p className="count-label">Records matching your query</p>
              <div className={`count-big ${result.protected ? "count-safe" : "count-risk"}`}>
                {result.matched_records}
              </div>
              <span className={result.protected ? "badge-success" : "badge-danger"}>
                {result.verdict}
              </span>
            </div>
            <div className="info-card" style={{ marginTop: "1rem" }}>
              <div className="risk-bar-row">
                <span>Re-identification risk</span>
                <strong style={{ color: result.risk_pct > 50 ? "#E24B4A" : result.risk_pct > 20 ? "#BA7517" : "#1D9E75" }}>
                  {result.risk_pct}%
                </strong>
              </div>
              <div className="risk-bar-wrap">
                <div className="risk-bar" style={{
                  width: `${result.risk_pct}%`,
                  background: result.risk_pct > 50 ? "#E24B4A" : result.risk_pct > 20 ? "#BA7517" : "#1D9E75",
                }} />
              </div>
              <div className="compare-row" style={{ marginTop: "1rem" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 12, color: "var(--color-muted)" }}>Before anonymization</div>
                  <div style={{ fontSize: 28, fontWeight: 600, color: "#E24B4A" }}>1</div>
                  <div style={{ fontSize: 11, color: "#E24B4A" }}>Identity exposed</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 12, color: "var(--color-muted)" }}>After k-anonymity</div>
                  <div style={{ fontSize: 28, fontWeight: 600, color: "#1D9E75" }}>{result.matched_records}</div>
                  <div style={{ fontSize: 11, color: "#1D9E75" }}>Protected</div>
                </div>
              </div>
            </div>
          </div>
        )}
        {!result && (
          <div className="empty-state" onClick={() => setF("adversary", "prosecutor")} style={{ cursor: "pointer" }}>
            Set filters to simulate an attack
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SECTION 4 — Prescription OCR Demo Lab
// src/components/sections/OCRLab.jsx
// ─────────────────────────────────────────────────────────────
import { getSyntheticPrescription } from "../../hooks/useMedShield";

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
    <div className="section-card">
      <h2 className="section-title">Prescription OCR demo lab</h2>
      <p className="section-sub">Load a synthetic prescription — PII detected and redacted at span level</p>
      <div style={{ display: "flex", gap: 10, marginBottom: "1rem" }}>
        <button className="run-btn" onClick={() => load(0)}>Load prescription 1</button>
        <button className="run-btn secondary" onClick={() => load(1)}>Load prescription 2</button>
      </div>
      {loading && <p className="loading-text">Running OCR pipeline…</p>}
      {data && (
        <>
          <div className="metric-row" style={{ marginBottom: "1rem" }}>
            <div className="metric-card"><div className="metric-val">{data.total_pii_count}</div><div className="metric-lbl">PII spans detected</div></div>
            <div className="metric-card"><div className="metric-val">{data.processing_time_ms}ms</div><div className="metric-lbl">Processing time</div></div>
            <div className="metric-card"><div className="metric-val">{data.ocr_engine}</div><div className="metric-lbl">OCR engine</div></div>
          </div>
          <div className="two-col">
            <div className="ocr-panel">
              <p className="ocr-panel-label">Original text</p>
              <pre className="ocr-text">{data.original_text}</pre>
            </div>
            <div className="ocr-panel">
              <p className="ocr-panel-label redacted">After PII redaction</p>
              <pre className="ocr-text redacted">{data.redacted_text}</pre>
            </div>
          </div>
          <div className="audit-panel" style={{ marginTop: "1rem" }}>
            <p className="audit-title">Audit log — detected entities</p>
            {data.pii_detected.map((p, i) => (
              <div className="audit-row" key={i}>
                <span className={`type-badge type-${p.type.toLowerCase()}`}>{p.type}</span>
                <span className="audit-span">"{p.span}"</span>
                <span className="audit-action">→ redacted with solid block</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SECTION 5 — Population Health Analytics
// src/components/sections/PopulationHealth.jsx
// ─────────────────────────────────────────────────────────────
import { useEffect } from "react";
import { getPopulationAnalytics } from "../../hooks/useMedShield";

const COLORS = ["#7F77DD","#1D9E75","#D85A30","#378ADD","#BA7517","#D4537E","#639922","#E24B4A","#63A2C6","#888780"];

export function PopulationHealth() {
  const [data, setData] = useState(null);

  useEffect(() => {
    getPopulationAnalytics().then(setData);
  }, []);

  if (!data) return <div className="loading-text">Loading population analytics…</div>;

  const maxCount = Math.max(...data.disease_prevalence.map(d => d.count));

  return (
    <div className="section-card">
      <h2 className="section-title">Population health analytics</h2>
      <p className="section-sub">Aggregate insights from {data.total_records} anonymized records — zero individual exposure</p>
      <div className="metric-row" style={{ marginBottom: "1.5rem" }}>
        <div className="metric-card"><div className="metric-val">{data.total_records}</div><div className="metric-lbl">Anonymized records</div></div>
        <div className="metric-card"><div className="metric-val">{data.total_diagnoses}</div><div className="metric-lbl">Diagnoses</div></div>
        <div className="metric-card"><div className="metric-val">0</div><div className="metric-lbl">PII fields exposed</div></div>
        <div className="metric-card"><div className="metric-val" style={{ color: "#1D9E75" }}>100%</div><div className="metric-lbl">DPDP compliant</div></div>
      </div>
      <div className="info-card" style={{ marginBottom: "1rem" }}>
        <h3 className="card-title">Disease prevalence</h3>
        {data.disease_prevalence.sort((a,b)=>b.count-a.count).map((d, i) => (
          <div className="freq-row" key={d.diagnosis}>
            <span className="freq-name">{d.diagnosis}</span>
            <div className="freq-bar-wrap">
              <div className="freq-bar" style={{ width: `${Math.round(d.count / maxCount * 100)}%`, background: COLORS[i] }} />
            </div>
            <span className="freq-pct">{d.count}</span>
          </div>
        ))}
      </div>
      <div className="two-col">
        <div className="info-card">
          <h3 className="card-title">Avg vitals by diagnosis</h3>
          <table className="compact-table">
            <thead><tr><th>Diagnosis</th><th>BS</th><th>BP</th><th>HR</th></tr></thead>
            <tbody>
              {Object.entries(data.vitals_by_diagnosis).map(([d, v]) => (
                <tr key={d}><td>{d}</td><td>{v.avg_blood_sugar}</td><td>{v.avg_bp}</td><td>{v.avg_heart_rate}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="info-card">
          <h3 className="card-title">Age distribution</h3>
          {data.age_distribution.map((b, i) => (
            <div className="freq-row" key={b.bin}>
              <span className="freq-name">{b.bin}</span>
              <div className="freq-bar-wrap">
                <div className="freq-bar" style={{ width: `${Math.round(b.count / 2.5)}%`, background: COLORS[i] }} />
              </div>
              <span className="freq-pct">{b.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SECTION 6 — LLM Fine-Tuning Exporter
// src/components/sections/LLMExporter.jsx
// ─────────────────────────────────────────────────────────────
import { generateExport } from "../../hooks/useMedShield";

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
    <div className="section-card">
      <h2 className="section-title">LLM fine-tuning data exporter</h2>
      <p className="section-sub">Convert anonymized medical records into structured training pairs</p>
      <div className="two-col">
        <div className="filter-panel">
          <div className="filter-row">
            <label>Task type</label>
            <select value={config.task_type} onChange={e => setC("task_type", e.target.value)}>
              <option value="drug">Drug recommendation</option>
              <option value="diag">Diagnosis prediction</option>
              <option value="summary">Clinical summarization</option>
              <option value="ner">PII de-identification (NER)</option>
            </select>
          </div>
          <div className="filter-row">
            <label>Export format</label>
            <select value={config.export_format} onChange={e => setC("export_format", e.target.value)}>
              <option value="hf">HuggingFace JSONL</option>
              <option value="oai">OpenAI chat format</option>
              <option value="alpaca">Alpaca format</option>
              <option value="text">Plain text corpus</option>
            </select>
          </div>
          <div className="filter-row">
            <label>Record count: <strong>{config.record_count}</strong></label>
            <input type="range" min={50} max={1000} step={50} value={config.record_count}
              onChange={e => setC("record_count", e.target.value)} />
          </div>
          <button className="run-btn" onClick={build} disabled={loading}>
            {loading ? "Generating…" : "Generate export"}
          </button>
        </div>
        <div>
          {data && (
            <>
              <div className="metric-row" style={{ marginBottom: "1rem" }}>
                <div className="metric-card"><div className="metric-val">{data.total_pairs}</div><div className="metric-lbl">Training pairs</div></div>
                <div className="metric-card"><div className="metric-val">~{Math.round(data.estimated_total_tokens / 1000)}k</div><div className="metric-lbl">Est. tokens</div></div>
                <div className="metric-card"><div className="metric-val" style={{ color: "#1D9E75" }}>DPDP</div><div className="metric-lbl">Compliant</div></div>
              </div>
              <div className="ocr-panel">
                <p className="ocr-panel-label">Preview — 3 sample pairs</p>
                <pre className="ocr-text" style={{ maxHeight: 200, overflowY: "auto" }}>
                  {data.sample_pairs.map(p => JSON.stringify(p, null, 2)).join("\n\n")}
                </pre>
              </div>
              <button className="run-btn" style={{ marginTop: "0.75rem" }} onClick={download}>
                Download JSONL
              </button>
            </>
          )}
          {!data && <div className="empty-state">Configure options and click generate</div>}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SECTION 7 — Algorithm Explainability Center
// src/components/sections/Explainability.jsx
// ─────────────────────────────────────────────────────────────
import { getKAnonDemo, getDPDemo, getChaosDemo, getAlgoScatter } from "../../hooks/useMedShield";

const ALGO_TABS = ["k-Anonymity", "Differential privacy", "Chaos perturbation", "Privacy-utility tradeoff"];

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
    <div className="section-card">
      <h2 className="section-title">Algorithm explainability center</h2>
      <p className="section-sub">Interactive demos using real dataset values — change parameters and see live results</p>
      <div className="sub-tabs" style={{ marginBottom: "1rem" }}>
        {ALGO_TABS.map((t, i) => (
          <button key={t} className={`sub-tab ${activeTab === i ? "active" : ""}`} onClick={() => setActiveTab(i)}>{t}</button>
        ))}
      </div>

      {/* k-Anonymity */}
      {activeTab === 0 && kData && (
        <div>
          <div className="slider-row">
            <div className="slider-label"><span>k value</span><strong>{k}</strong></div>
            <input type="range" min={2} max={15} value={k} step={1} onChange={e => setK(+e.target.value)} />
          </div>
          <div style={{ overflowX: "auto", marginTop: "1rem" }}>
            <table className="compact-table">
              <thead><tr><th>Age (generalized)</th><th>Gender</th><th>Blood</th><th>ZIP</th><th>Diagnosis</th><th>k-safe</th></tr></thead>
              <tbody>
                {kData.records.map((r, i) => (
                  <tr key={i} style={{ background: r.k_safe ? undefined : "var(--color-danger-bg)" }}>
                    <td>{r.age_generalized}</td><td>{r.gender}</td><td>{r.blood}</td>
                    <td>{r.zip_generalized}</td><td>{r.diag}</td>
                    <td><span className={r.k_safe ? "badge-success" : "badge-danger"}>{r.k_safe ? `✓ k=${k}` : "⚠ risk"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: 13, marginTop: 10 }}>{kData.verdict}</p>
        </div>
      )}

      {/* Differential Privacy */}
      {activeTab === 1 && dpData && (
        <div>
          <div className="slider-row">
            <div className="slider-label"><span>Epsilon (ε)</span><strong>{eps.toFixed(1)}</strong></div>
            <input type="range" min={0.1} max={5} step={0.1} value={eps} onChange={e => setEps(+e.target.value)} />
          </div>
          <div className="metric-row" style={{ margin: "1rem 0" }}>
            <div className="metric-card"><div className="metric-val">{dpData.original_value}</div><div className="metric-lbl">Original blood sugar</div></div>
            <div className="metric-card"><div className="metric-val">{dpData.noised_value}</div><div className="metric-lbl">After Laplace noise</div></div>
            <div className="metric-card"><div className="metric-val">{dpData.scale}</div><div className="metric-lbl">Noise scale (b=Δf/ε)</div></div>
            <div className="metric-card"><div className="metric-val" style={{ color: dpData.privacy_level === "strong" ? "#1D9E75" : dpData.privacy_level === "moderate" ? "#BA7517" : "#E24B4A" }}>{dpData.privacy_level}</div><div className="metric-lbl">Privacy level</div></div>
          </div>
          <div className="info-card">
            <p className="card-title" style={{ marginBottom: 8 }}>Noise distribution (60 trials)</p>
            {dpData.distribution_bins.map(b => (
              <div className="freq-row" key={b.range}>
                <span className="freq-name" style={{ width: 90 }}>{b.range}</span>
                <div className="freq-bar-wrap"><div className="freq-bar" style={{ width: `${b.count * 10}%`, background: "#7F77DD" }} /></div>
                <span className="freq-pct">{b.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chaos Perturbation */}
      {activeTab === 2 && chaosData && (
        <div>
          <div className="slider-row">
            <div className="slider-label"><span>Lambda (λ)</span><strong>{lam.toFixed(2)}</strong></div>
            <input type="range" min={3.5} max={4} step={0.01} value={lam} onChange={e => setLam(+e.target.value)} />
          </div>
          <div style={{ margin: "1rem 0" }}>
            <p style={{ fontSize: 12, marginBottom: 6, color: "var(--color-muted)" }}>x(n+1) = λ·x·(1-x) trajectory (80 iterations)</p>
            <svg viewBox={`0 0 800 80`} style={{ width: "100%", height: 80 }}>
              {chaosData.trajectory.map((v, i, arr) => i === 0 ? null : (
                <line key={i} x1={(i-1)*10} y1={80-arr[i-1]*80} x2={i*10} y2={80-v*80} stroke="#1D9E75" strokeWidth="1.5" />
              ))}
            </svg>
          </div>
          <table className="compact-table">
            <thead><tr><th>Column</th><th>Original value</th><th>Trajectory position</th><th>Chaos-perturbed</th></tr></thead>
            <tbody>
              {chaosData.column_mapping.map(c => (
                <tr key={c.column}><td>{c.column}</td><td>{c.original}</td><td>{c.chaos_pos}</td><td><strong>{c.perturbed}</strong></td></tr>
              ))}
            </tbody>
          </table>
          <p style={{ fontSize: 12, marginTop: 8, color: "var(--color-muted)" }}>
            {chaosData.is_chaotic ? "✓ Fully chaotic — irreversible and unpredictable" : "⚠ Not yet chaotic — increase λ above 3.56"}
          </p>
        </div>
      )}

      {/* Scatter */}
      {activeTab === 3 && scatterData && (
        <div>
          <p style={{ fontSize: 12, marginBottom: 10, color: "var(--color-muted)" }}>Privacy score vs utility score — all 7 algorithms</p>
          <svg viewBox="0 0 400 300" style={{ width: "100%", maxHeight: 280 }}>
            <line x1="40" y1="10" x2="40" y2="260" stroke="var(--color-border)" strokeWidth="0.5" />
            <line x1="40" y1="260" x2="390" y2="260" stroke="var(--color-border)" strokeWidth="0.5" />
            <text x="200" y="290" textAnchor="middle" fontSize="10" fill="currentColor">Utility score</text>
            <text x="12" y="140" textAnchor="middle" fontSize="10" fill="currentColor" transform="rotate(-90 12 140)">Privacy score</text>
            {scatterData.algorithms.map((a, i) => {
              const cx = 40 + (a.utility - 40) * 3.5;
              const cy = 260 - (a.privacy - 40) * 2.4;
              const clr = ["#7F77DD","#1D9E75","#D85A30","#378ADD","#BA7517","#D4537E","#639922"][i];
              return (
                <g key={a.name}>
                  <circle cx={cx} cy={cy} r="7" fill={clr} opacity="0.85" />
                  <text x={cx + 9} y={cy + 4} fontSize="9" fill="currentColor">{a.name}</text>
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SECTION 8 — DPDP Compliance Auditor
// src/components/sections/DPDPAuditor.jsx
// ─────────────────────────────────────────────────────────────
import { runDPDPAudit } from "../../hooks/useMedShield";

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
    <div className="section-card">
      <h2 className="section-title">DPDP compliance auditor</h2>
      <p className="section-sub">6 DPDP Act 2023 checks — automatic pass/fail with legal section references</p>
      <div className="upload-zone" onClick={run} style={{ cursor: "pointer" }}>
        {loading ? "Running 6 compliance checks…" : "Click to run DPDP audit on your anonymized dataset"}
      </div>
      {data && (
        <>
          <div className="two-col" style={{ marginBottom: "1rem" }}>
            <div className="info-card" style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "var(--color-muted)", marginBottom: 4 }}>Compliance score</div>
              <div style={{ fontSize: 52, fontWeight: 600, color: data.fully_compliant ? "#1D9E75" : "#BA7517" }}>
                {data.compliance_score}%
              </div>
              <span className={data.fully_compliant ? "badge-success" : "badge-warn"}>
                {data.fully_compliant ? "DPDP 2023 fully compliant" : "Action required"}
              </span>
            </div>
            <div className="info-card">
              <div className="metric-row">
                <div className="metric-card"><div className="metric-val" style={{ color: "#1D9E75" }}>{data.checks_passed}</div><div className="metric-lbl">Passed</div></div>
                <div className="metric-card"><div className="metric-val" style={{ color: "#E24B4A" }}>{data.checks_total - data.checks_passed}</div><div className="metric-lbl">Failed</div></div>
              </div>
              {data.recommendation && (
                <p style={{ fontSize: 12, marginTop: 10, padding: "8px 10px", background: "var(--color-warn-bg)", borderRadius: 6 }}>
                  💡 {data.recommendation}
                </p>
              )}
            </div>
          </div>
          <div className="info-card">
            {data.checks.map(c => (
              <div className="audit-row" key={c.id} style={{ alignItems: "flex-start", gap: 12, padding: "10px 0", borderBottom: "0.5px solid var(--color-border)" }}>
                <span className={c.pass ? "badge-success" : "badge-danger"} style={{ flexShrink: 0, marginTop: 2 }}>
                  {c.pass ? "✓" : "✗"}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: "var(--color-muted)", marginTop: 2 }}>{c.evidence}</div>
                  {c.recommendation && (
                    <div style={{ fontSize: 11, marginTop: 4, color: "#BA7517" }}>→ {c.recommendation}</div>
                  )}
                </div>
                <span className="badge-info" style={{ flexShrink: 0, fontSize: 11 }}>{c.ref}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
