/**
 * DiagnosticAI.jsx — Drop into: src/components/sections/DiagnosticAI.jsx
 * Section 1: Clinical AI Diagnostic Engine
 */
import { useState, useCallback } from "react";
import { predictDiagnosis } from "../../hooks/useMedShield";

const DIAG_COLORS = [
  "#7F77DD","#1D9E75","#D85A30","#378ADD","#BA7517",
  "#D4537E","#639922","#E24B4A","#63A2C6","#888780"
];

export default function DiagnosticAI() {
  const [inputs, setInputs] = useState({
    age: 45, blood_sugar: 140, systolic_bp: 130, heart_rate: 80, gender: 1,
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);

  const set = (k, v) => setInputs(p => ({ ...p, [k]: +v }));

  const run = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await predictDiagnosis(inputs);
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [inputs]);

  const sorted = result
    ? [...result.all_probabilities].sort((a, b) => b.probability - a.probability)
    : [];

  return (
    <div className="section-card">
      <h2 className="section-title">Clinical AI diagnostic engine</h2>
      <p className="section-sub">Enter patient vitals — model predicts diagnosis from anonymized training data</p>

      <div className="two-col">
        {/* Inputs */}
        <div className="input-panel">
          {[
            { key: "age",         label: "Age",               min: 18, max: 90,  unit: "yrs" },
            { key: "blood_sugar", label: "Blood sugar",        min: 70, max: 400, unit: "mg/dL" },
            { key: "systolic_bp", label: "Systolic BP",        min: 80, max: 200, unit: "mmHg" },
            { key: "heart_rate",  label: "Heart rate",         min: 40, max: 160, unit: "bpm" },
          ].map(({ key, label, min, max, unit }) => (
            <div className="slider-row" key={key}>
              <div className="slider-label">
                <span>{label}</span>
                <strong>{inputs[key]} <small>{unit}</small></strong>
              </div>
              <input type="range" min={min} max={max} value={inputs[key]} step={1}
                onChange={e => set(key, e.target.value)} />
            </div>
          ))}
          <div className="slider-row">
            <div className="slider-label"><span>Gender</span></div>
            <select value={inputs.gender} onChange={e => set("gender", e.target.value)}>
              <option value={1}>Male</option>
              <option value={0}>Female</option>
            </select>
          </div>
          <button className="run-btn" onClick={run} disabled={loading}>
            {loading ? "Predicting…" : "Run prediction"}
          </button>
          {error && <p className="error-msg">{error}</p>}
        </div>

        {/* Results */}
        <div>
          {result && (
            <>
              <div className="result-header">
                <span className="pred-label">{result.predicted_diagnosis}</span>
                <span className={`conf-badge ${result.confidence_pct > 65 ? "conf-high" : "conf-mid"}`}>
                  {result.confidence_pct}% confidence
                </span>
              </div>

              <div className="prob-list">
                {sorted.map((d, i) => (
                  <div className="prob-row" key={d.diagnosis}>
                    <span className="prob-name" style={{ fontWeight: i === 0 ? 600 : 400 }}>
                      {d.diagnosis}
                    </span>
                    <div className="prob-bar-wrap">
                      <div className="prob-bar"
                        style={{ width: `${Math.round(d.probability * 100)}%`, background: DIAG_COLORS[sorted.indexOf(d) % 10] }} />
                    </div>
                    <span className="prob-pct">{Math.round(d.probability * 100)}%</span>
                  </div>
                ))}
              </div>

              <div className="drug-panel">
                <p className="drug-panel-label">Recommended medications</p>
                <div className="drug-pills">
                  {result.recommended_drugs.map(d => (
                    <span className="drug-pill" key={d}>{d}</span>
                  ))}
                </div>
                <p className="privacy-note">🛡 {result.privacy_note}</p>
              </div>
            </>
          )}
          {!result && !loading && (
            <div className="empty-state">Set vitals and click run prediction</div>
          )}
        </div>
      </div>
    </div>
  );
}
