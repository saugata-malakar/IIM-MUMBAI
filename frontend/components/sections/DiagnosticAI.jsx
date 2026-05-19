/**
 * DiagnosticAI.jsx — Refined Clinical AI Diagnostic Engine
 * Premium UI with MedShield design system
 */
import { useState, useCallback } from "react";
import { predictDiagnosis } from "../../hooks/useMedShield";

const DIAGNOSIS_COLORS = {
  0: { bg: "rgba(124, 58, 237, 0.1)", bar: "#7C3AED", name: "Purple" },
  1: { bg: "rgba(6, 182, 212, 0.1)", bar: "#06B6D4", name: "Cyan" },
  2: { bg: "rgba(16, 185, 129, 0.1)", bar: "#10B981", name: "Green" },
  3: { bg: "rgba(245, 158, 11, 0.1)", bar: "#F59E0B", name: "Amber" },
  4: { bg: "rgba(239, 68, 68, 0.1)", bar: "#EF4444", name: "Red" },
};

export default function DiagnosticAI() {
  const [inputs, setInputs] = useState({
    age: 45, blood_sugar: 140, systolic_bp: 130, heart_rate: 80, gender: 1,
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const set = (k, v) => setInputs(p => ({ ...p, [k]: +v }));

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await predictDiagnosis(inputs);
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [inputs]);

  const vitals = [
    { key: "age", label: "Age", min: 18, max: 90, unit: "yrs", icon: "👤" },
    { key: "blood_sugar", label: "Blood Sugar", min: 70, max: 400, unit: "mg/dL", icon: "🩸" },
    { key: "systolic_bp", label: "Systolic BP", min: 80, max: 200, unit: "mmHg", icon: "❤️" },
    { key: "heart_rate", label: "Heart Rate", min: 40, max: 160, unit: "bpm", icon: "⚡" },
  ];

  const sorted = result
    ? [...result.all_probabilities].sort((a, b) => b.probability - a.probability)
    : [];

  return (
    <div className="diag-ai-container">
      {/* Header */}
      <div className="diag-header">
        <div>
          <h2 className="diag-title">🧠 Clinical Diagnostic Engine</h2>
          <p className="diag-subtitle">AI-powered diagnosis from anonymized patient vitals</p>
        </div>
        <div className="diag-badge">DPDP Compliant ✓</div>
      </div>

      {/* Main Grid */}
      <div className="diag-grid">
        {/* LEFT: Input Panel */}
        <div className="diag-input-section">
          <div className="input-card">
            <h3 className="input-card-title">📋 Patient Vitals</h3>

            {/* Vital Sliders */}
            {vitals.map(({ key, label, min, max, unit, icon }) => (
              <div className="vital-control" key={key}>
                <div className="vital-header">
                  <label className="vital-label">
                    <span className="vital-icon">{icon}</span>
                    <span className="vital-name">{label}</span>
                  </label>
                  <span className="vital-value">
                    {inputs[key]} <small>{unit}</small>
                  </span>
                </div>
                <input
                  type="range"
                  min={min}
                  max={max}
                  value={inputs[key]}
                  step={1}
                  onChange={(e) => set(key, e.target.value)}
                  className="vital-slider"
                />
                <div className="slider-track" style={{
                  background: `linear-gradient(to right, #7C3AED 0%, #7C3AED ${((inputs[key] - min) / (max - min)) * 100}%, #e5e7eb ${((inputs[key] - min) / (max - min)) * 100}%, #e5e7eb 100%)`
                }} />
              </div>
            ))}

            {/* Gender Selector */}
            <div className="gender-control">
              <label className="vital-label">
                <span className="vital-icon">⚧</span>
                <span className="vital-name">Gender</span>
              </label>
              <div className="gender-options">
                {[
                  { val: 1, label: "Male", icon: "♂️" },
                  { val: 0, label: "Female", icon: "♀️" },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    className={`gender-btn ${inputs.gender === opt.val ? "active" : ""}`}
                    onClick={() => set("gender", opt.val)}
                  >
                    <span>{opt.icon}</span> {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Predict Button */}
            <button
              className={`predict-btn ${loading ? "loading" : ""}`}
              onClick={run}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span> Analyzing...
                </>
              ) : (
                <>⚙️ Run Prediction</>
              )}
            </button>

            {error && (
              <div className="error-banner">
                <span>❌ {error}</span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Results Panel */}
        <div className="diag-result-section">
          {result ? (
            <div className="result-card">
              {/* Prediction Result */}
              <div className="prediction-box">
                <div className="pred-confidence">
                  <span className="conf-pct">{result.confidence_pct}%</span>
                  <span className="conf-label">Confidence</span>
                </div>
                <div className="pred-diagnosis">
                  <h4 className="pred-title">Predicted Diagnosis</h4>
                  <p className="pred-name">{result.predicted_diagnosis}</p>
                </div>
                <div className={`pred-status ${result.confidence_pct > 65 ? "high" : "medium"}`}>
                  {result.confidence_pct > 65 ? "✓ High Confidence" : "⚠ Medium Confidence"}
                </div>
              </div>

              {/* All Probabilities */}
              <div className="probabilities-box">
                <h4 className="prob-title">All Diagnoses</h4>
                <div className="prob-bars">
                  {sorted.map((d, i) => {
                    const colorSet = DIAGNOSIS_COLORS[i % 5];
                    const pct = Math.round(d.probability * 100);
                    return (
                      <div className="prob-item" key={d.diagnosis}>
                        <div className="prob-info">
                          <span className="prob-name">{d.diagnosis}</span>
                          <span className="prob-pct">{pct}%</span>
                        </div>
                        <div className="prob-bar-container">
                          <div
                            className="prob-bar"
                            style={{
                              width: `${pct}%`,
                              background: colorSet.bar,
                              boxShadow: `0 0 12px ${colorSet.bar}40`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recommended Medications */}
              <div className="medications-box">
                <h4 className="med-title">💊 Recommended Medications</h4>
                <div className="med-pills">
                  {result.recommended_drugs.map((drug) => (
                    <span className="med-pill" key={drug}>
                      {drug}
                    </span>
                  ))}
                </div>
                <p className="privacy-badge">🛡️ {result.privacy_note}</p>
              </div>
            </div>
          ) : (
            <div className="result-card empty-result">
              <div className="empty-icon">🔍</div>
              <p className="empty-text">Set patient vitals and click "Run Prediction" to begin analysis</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
