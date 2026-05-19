/**
 * Clinical AI Diagnostic Engine Component
 * 
 * Takes 5 clinical inputs (age, blood sugar, BP, heart rate, gender)
 * Predicts diagnosis using GaussianNB trained on anonymized data
 * Shows probability scores for all 10 diagnoses + drug recommendations
 */

'use client';

import React, { useState, useRef } from 'react';

const C = {
  purple: '#7C3AED',
  purpleL: '#A78BFA',
  cyan: '#06B6D4',
  cyanL: '#67E8F9',
  green: '#10B981',
  greenL: '#34D399',
  amber: '#F59E0B',
  red: '#EF4444',
  text: '#F1F5F9',
  muted: '#64748B',
  dim: '#334155',
  bg: '#080C14',
};

const DIAGNOSES = [
  'Diabetes Type 2',
  'Hypertension',
  'Coronary Artery Disease',
  'Chronic Kidney Disease',
  'Tuberculosis',
  'Dengue Fever',
  'COVID-19',
  'Malaria',
  'Anaemia',
  'Hypothyroidism',
];

export default function ClinicalDiagnosticEngine() {
  const [trained, setTrained] = useState(false);
  const [predicting, setPredicting] = useState(false);

  // Input fields
  const [age, setAge] = useState(45);
  const [bloodSugar, setBloodSugar] = useState(140);
  const [bpSystolic, setBpSystolic] = useState(130);
  const [heartRate, setHeartRate] = useState(75);
  const [gender, setGender] = useState('M');

  // Prediction result
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState([]);

  const logMsg = (msg, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { msg, type, timestamp }]);
  };

  const handlePredictClick = async () => {
    setError('');
    setResult(null);
    setPredicting(true);
    logMsg('🔄 Making prediction...', 'info');

    try {
      const response = await fetch('/api/clinical/diagnostic/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age: parseFloat(age),
          blood_sugar: parseFloat(bloodSugar),
          bp_systolic: parseFloat(bpSystolic),
          heart_rate: parseFloat(heartRate),
          gender,
        }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        setResult(data.prediction);
        logMsg(`✅ Predicted: ${data.prediction.predicted_diagnosis}`, 'success');
        logMsg(`📊 Confidence: ${(data.prediction.confidence * 100).toFixed(1)}%`, 'success');
      } else {
        logMsg(`❌ Error: ${data.message}`, 'error');
        setError(data.message);
      }
    } catch (err) {
      logMsg(`❌ Network error: ${err.message}`, 'error');
      setError(err.message);
    } finally {
      setPredicting(false);
    }
  };

  // Probability bar component
  const ProbBar = ({ diagnosis, probability }) => {
    const isTopPrediction = result && diagnosis === result.predicted_diagnosis;
    const color = isTopPrediction ? C.green : C.purple;

    return (
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '13px', color: C.text }}>{diagnosis}</span>
          <span style={{ fontSize: '13px', color: C.cyan, fontWeight: '600' }}>
            {(probability * 100).toFixed(1)}%
          </span>
        </div>
        <div
          style={{
            width: '100%',
            height: '8px',
            background: C.dim,
            borderRadius: '4px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${probability * 100}%`,
              height: '100%',
              background: color,
              transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: `0 0 12px ${color}40`,
            }}
          />
        </div>
      </div>
    );
  };

  // Drug recommendation card
  const DrugCard = ({ drug }) => (
    <div
      style={{
        background: `linear-gradient(135deg, ${C.purpleL}15, ${C.cyanL}15)`,
        border: `1px solid ${C.purpleL}40`,
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '8px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ color: C.text, fontWeight: '600', fontSize: '13px' }}>{drug.name}</span>
        <span style={{ color: C.cyan, fontSize: '12px' }}>{drug.dose}</span>
      </div>
      <span style={{ color: C.muted, fontSize: '12px' }}>{drug.frequency}</span>
    </div>
  );

  // Log entry component
  const LogLine = ({ entry }) => {
    const typeColor = { info: C.muted, success: C.green, error: C.red }[entry.type];
    return (
      <div style={{ color: typeColor, fontSize: '12px', marginBottom: '4px', fontFamily: 'Space Mono' }}>
        <span style={{ color: C.dim }}>[{entry.timestamp}]</span> {entry.msg}
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '32px', marginBottom: '8px', color: C.cyan }}>🏥 Clinical AI Diagnostic Engine</h1>
          <p style={{ color: C.muted }}>Predict diagnosis from 5 clinical inputs using anonymized training data</p>
        </div>

        {/* Main Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          {/* Input Panel */}
          <div
            style={{
              background: `linear-gradient(135deg, ${C.purpleL}10, ${C.cyanL}10)`,
              border: `1px solid ${C.purple}20`,
              borderRadius: '12px',
              padding: '24px',
            }}
          >
            <h2 style={{ fontSize: '18px', marginBottom: '20px', color: C.cyan }}>📋 Clinical Inputs</h2>

            {/* Age */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: C.text, fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                Age: <span style={{ color: C.cyan, fontWeight: '600' }}>{age}</span>
              </label>
              <input
                type="range"
                min="18"
                max="80"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                style={{
                  width: '100%',
                  accentColor: C.cyan,
                  cursor: 'pointer',
                }}
              />
              <div style={{ fontSize: '11px', color: C.muted, marginTop: '4px' }}>18–80 years</div>
            </div>

            {/* Blood Sugar */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: C.text, fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                Blood Sugar: <span style={{ color: C.cyan, fontWeight: '600' }}>{bloodSugar}</span> mg/dL
              </label>
              <input
                type="range"
                min="50"
                max="500"
                value={bloodSugar}
                onChange={(e) => setBloodSugar(e.target.value)}
                style={{
                  width: '100%',
                  accentColor: C.purple,
                  cursor: 'pointer',
                }}
              />
              <div style={{ fontSize: '11px', color: C.muted, marginTop: '4px' }}>50–500 mg/dL</div>
            </div>

            {/* BP Systolic */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: C.text, fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                BP Systolic: <span style={{ color: C.cyan, fontWeight: '600' }}>{bpSystolic}</span> mmHg
              </label>
              <input
                type="range"
                min="100"
                max="200"
                value={bpSystolic}
                onChange={(e) => setBpSystolic(e.target.value)}
                style={{
                  width: '100%',
                  accentColor: C.amber,
                  cursor: 'pointer',
                }}
              />
              <div style={{ fontSize: '11px', color: C.muted, marginTop: '4px' }}>100–200 mmHg</div>
            </div>

            {/* Heart Rate */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: C.text, fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                Heart Rate: <span style={{ color: C.cyan, fontWeight: '600' }}>{heartRate}</span> bpm
              </label>
              <input
                type="range"
                min="40"
                max="150"
                value={heartRate}
                onChange={(e) => setHeartRate(e.target.value)}
                style={{
                  width: '100%',
                  accentColor: C.red,
                  cursor: 'pointer',
                }}
              />
              <div style={{ fontSize: '11px', color: C.muted, marginTop: '4px' }}>40–150 bpm</div>
            </div>

            {/* Gender */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: C.text, fontSize: '13px', display: 'block', marginBottom: '8px' }}>Gender</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                {['M', 'F'].map((g) => (
                  <button
                    key={g}
                    onClick={() => setGender(g)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: gender === g ? C.cyan : C.dim,
                      color: gender === g ? C.bg : C.text,
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '13px',
                      transition: 'all 0.3s',
                    }}
                  >
                    {g === 'M' ? '♂ Male' : '♀ Female'}
                  </button>
                ))}
              </div>
            </div>

            {/* Predict Button */}
            <button
              onClick={handlePredictClick}
              disabled={predicting}
              style={{
                width: '100%',
                padding: '12px',
                background: predicting ? C.muted : C.green,
                color: C.bg,
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '14px',
                cursor: predicting ? 'not-allowed' : 'pointer',
                opacity: predicting ? 0.6 : 1,
              }}
            >
              {predicting ? '🔄 Predicting...' : '🚀 Predict Diagnosis'}
            </button>
          </div>

          {/* Result Panel */}
          <div
            style={{
              background: `linear-gradient(135deg, ${C.greenL}10, ${C.cyanL}10)`,
              border: `1px solid ${C.green}20`,
              borderRadius: '12px',
              padding: '24px',
            }}
          >
            <h2 style={{ fontSize: '18px', marginBottom: '20px', color: C.green }}>📊 Prediction Results</h2>

            {result ? (
              <>
                {/* Predicted Diagnosis */}
                <div
                  style={{
                    background: `${C.green}20`,
                    border: `2px solid ${C.green}`,
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '20px',
                  }}
                >
                  <div style={{ color: C.muted, fontSize: '12px', marginBottom: '4px' }}>PREDICTED DIAGNOSIS</div>
                  <div style={{ color: C.green, fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
                    {result.predicted_diagnosis}
                  </div>
                  <div style={{ color: C.cyan, fontSize: '14px', fontWeight: '600' }}>
                    Confidence: {(result.confidence * 100).toFixed(1)}%
                  </div>
                </div>

                {/* Disclaimer if low confidence */}
                {result.disclaimer && (
                  <div
                    style={{
                      background: `${C.amber}20`,
                      border: `1px solid ${C.amber}`,
                      borderRadius: '6px',
                      padding: '12px',
                      marginBottom: '16px',
                      color: C.amber,
                      fontSize: '12px',
                    }}
                  >
                    ⚠️ {result.disclaimer}
                  </div>
                )}

                {/* All Probabilities */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ color: C.muted, fontSize: '12px', marginBottom: '12px' }}>All Diagnosis Probabilities:</div>
                  {Object.entries(result.all_probabilities)
                    .sort(([, a], [, b]) => b - a)
                    .map(([diag, prob]) => (
                      <ProbBar key={diag} diagnosis={diag} probability={prob} />
                    ))}
                </div>

                {/* Drug Recommendations */}
                <div>
                  <div style={{ color: C.muted, fontSize: '12px', marginBottom: '12px' }}>💊 Recommended Drugs:</div>
                  {result.drug_details.map((drug, idx) => (
                    <DrugCard key={idx} drug={drug} />
                  ))}
                </div>
              </>
            ) : (
              <div style={{ color: C.muted, textAlign: 'center', paddingTop: '40px' }}>
                Enter clinical inputs and click "Predict Diagnosis" to see results
              </div>
            )}

            {/* Audit Info */}
            <div
              style={{
                background: C.dim,
                borderRadius: '6px',
                padding: '12px',
                marginTop: '20px',
                fontSize: '11px',
                color: C.muted,
                fontFamily: 'Space Mono',
              }}
            >
              🔐 {result?.audit_info || 'Ready for diagnosis prediction'}
            </div>
          </div>
        </div>

        {/* Logs */}
        <div
          style={{
            background: `${C.dim}40`,
            border: `1px solid ${C.muted}20`,
            borderRadius: '12px',
            padding: '16px',
            maxHeight: '200px',
            overflowY: 'auto',
          }}
        >
          <div style={{ color: C.muted, fontSize: '11px', marginBottom: '12px' }}>📝 Activity Log:</div>
          {logs.map((log, idx) => (
            <LogLine key={idx} entry={log} />
          ))}
        </div>
      </div>
    </div>
  );
}
