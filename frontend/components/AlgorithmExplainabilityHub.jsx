'use client';

import React, { useState, useEffect } from 'react';

export default function AlgorithmExplainabilityHub() {
  const [explainabilityTab, setExplainabilityTab] = useState(0);
  const [kAnonymityData, setKAnonymityData] = useState(null);
  const [dpData, setDpData] = useState(null);
  const [chaosData, setChaosData] = useState(null);
  const [puData, setPuData] = useState(null);
  const [loading, setLoading] = useState(false);

  // K-Anonymity state
  const [kValue, setKValue] = useState(5);
  const [kQuasiIds, setKQuasiIds] = useState(['age', 'gender', 'blood_group', 'district']);

  // DP state
  const [epsilon, setEpsilon] = useState(1.0);

  // Chaos state
  const [lambda, setLambda] = useState(3.99);

  useEffect(() => {
    if (explainabilityTab === 0) fetchKAnonymityExplanation();
    else if (explainabilityTab === 1) fetchDPExplanation();
    else if (explainabilityTab === 2) fetchChaosExplanation();
    else if (explainabilityTab === 3) fetchPrivacyUtilityData();
  }, [explainabilityTab, kValue, epsilon, lambda]);

  const fetchKAnonymityExplanation = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/clinical/explainability/k-anonymity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ k_value: kValue, quasi_identifiers: kQuasiIds }),
      });
      const data = await response.json();
      if (data.status === 'success') {
        setKAnonymityData(data.explanation);
      }
    } catch (err) {
      console.error('Error fetching k-anonymity explanation:', err);
    }
    setLoading(false);
  };

  const fetchDPExplanation = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/clinical/explainability/differential-privacy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ epsilon, value: null }),
      });
      const data = await response.json();
      if (data.status === 'success') {
        setDpData(data.explanation);
      }
    } catch (err) {
      console.error('Error fetching DP explanation:', err);
    }
    setLoading(false);
  };

  const fetchChaosExplanation = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/clinical/explainability/chaos-perturbation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lambda_val: lambda, value: null }),
      });
      const data = await response.json();
      if (data.status === 'success') {
        setChaosData(data.explanation);
      }
    } catch (err) {
      console.error('Error fetching chaos explanation:', err);
    }
    setLoading(false);
  };

  const fetchPrivacyUtilityData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/clinical/explainability/privacy-utility-landscape');
      const data = await response.json();
      if (data.status === 'success') {
        setPuData(data);
      }
    } catch (err) {
      console.error('Error fetching P-U data:', err);
    }
    setLoading(false);
  };

  const explainTabs = [
    { label: 'K-Anonymity', id: 'k-anon' },
    { label: 'Differential Privacy', id: 'dp' },
    { label: 'Chaos Perturbation', id: 'chaos' },
    { label: 'Privacy-Utility Plot', id: 'pu' },
  ];

  const styles = {
    container: { padding: '24px', height: '100%', overflowY: 'auto', backgroundColor: '#0F172A', color: '#E2E8F0' },
    tabButtons: {
      display: 'flex',
      gap: '12px',
      marginBottom: '24px',
      borderBottom: '1px solid #334155',
      paddingBottom: '12px',
    },
    tabButton: (isActive) => ({
      padding: '10px 16px',
      backgroundColor: isActive ? '#7C3AED' : '#1E293B',
      color: isActive ? '#FFF' : '#94A3B8',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: isActive ? '600' : '500',
      transition: 'all 0.2s',
    }),
    sectionTitle: { fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#E2E8F0' },
    sliderContainer: {
      marginBottom: '24px',
      padding: '16px',
      backgroundColor: '#1E293B',
      borderRadius: '8px',
      borderLeft: '3px solid #7C3AED',
    },
    sliderLabel: { fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#CBD5E1' },
    slider: {
      width: '100%',
      height: '6px',
      borderRadius: '3px',
      backgroundColor: '#334155',
      outline: 'none',
      WebkitAppearance: 'none',
      cursor: 'pointer',
    },
    valueDisplay: { fontSize: '13px', color: '#94A3B8', marginTop: '8px', fontFamily: '"Space Mono", monospace' },
    dataGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '12px',
      marginTop: '16px',
    },
    dataCard: {
      backgroundColor: '#1E293B',
      padding: '12px',
      borderRadius: '6px',
      border: '1px solid #334155',
      fontSize: '13px',
    },
    chartContainer: {
      backgroundColor: '#1E293B',
      padding: '24px',
      borderRadius: '8px',
      marginTop: '16px',
      border: '1px solid #334155',
      minHeight: '300px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingSpinner: {
      display: 'inline-block',
      width: '20px',
      height: '20px',
      border: '3px solid #334155',
      borderTop: '3px solid #7C3AED',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.tabButtons}>
        {explainTabs.map((tab, idx) => (
          <button
            key={tab.id}
            style={styles.tabButton(explainabilityTab === idx)}
            onClick={() => setExplainabilityTab(idx)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* K-Anonymity Tab */}
      {explainabilityTab === 0 && (
        <div>
          <h2 style={styles.sectionTitle}>K-Anonymity Interactive Demo</h2>
          <div style={styles.sliderContainer}>
            <div style={styles.sliderLabel}>K Value (minimum group size)</div>
            <input
              type="range"
              min="1"
              max="20"
              value={kValue}
              onChange={(e) => setKValue(parseInt(e.target.value))}
              style={styles.slider}
            />
            <div style={styles.valueDisplay}>k = {kValue}</div>
          </div>

          {kAnonymityData && (
            <div>
              <div style={{
                backgroundColor: kAnonymityData.privacy_score >= 80 ? '#10B98150' : '#EF444450',
                padding: '16px',
                borderRadius: '8px',
                marginTop: '16px',
                borderLeft: `4px solid ${kAnonymityData.privacy_score >= 80 ? '#10B981' : '#EF4444'}`,
              }}>
                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                  Privacy Score: {kAnonymityData.privacy_score.toFixed(1)}%
                </div>
                <div style={{ fontSize: '13px', color: '#CBD5E1' }}>
                  {kAnonymityData.violations_count === 0
                    ? '✅ All records are k-anonymized'
                    : `⚠️ ${kAnonymityData.violations_count} records violate k-anonymity`}
                </div>
              </div>

              <div style={{ marginTop: '24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Sample Generalized Records</h3>
                <div style={styles.dataGrid}>
                  {kAnonymityData.records.slice(0, 3).map((record, idx) => (
                    <div key={idx} style={styles.dataCard}>
                      <div style={{ marginBottom: '8px', fontWeight: '600', color: '#7C3AED' }}>Record {idx + 1}</div>
                      {Object.entries(record).slice(0, 4).map(([key, value]) => (
                        <div key={key} style={{ fontSize: '12px', margin: '4px 0' }}>
                          <span style={{ color: '#94A3B8' }}>{key}:</span> {String(value)}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {loading && <div style={styles.loadingSpinner} />}
        </div>
      )}

      {/* Differential Privacy Tab */}
      {explainabilityTab === 1 && (
        <div>
          <h2 style={styles.sectionTitle}>Differential Privacy Interactive Demo</h2>
          <div style={styles.sliderContainer}>
            <div style={styles.sliderLabel}>Privacy Budget (ε - epsilon)</div>
            <input
              type="range"
              min="0.1"
              max="5"
              step="0.1"
              value={epsilon}
              onChange={(e) => setEpsilon(parseFloat(e.target.value))}
              style={styles.slider}
            />
            <div style={styles.valueDisplay}>ε = {epsilon.toFixed(2)} (lower = more private)</div>
          </div>

          {dpData && (
            <div>
              <div style={{
                backgroundColor: '#06B6D450',
                padding: '16px',
                borderRadius: '8px',
                marginTop: '16px',
                borderLeft: '4px solid #06B6D4',
              }}>
                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Laplace Mechanism</div>
                <div style={{ fontSize: '13px', color: '#CBD5E1', fontFamily: '"Space Mono", monospace' }}>
                  Original: {dpData.original_value.toFixed(2)}<br />
                  Noise scale: {dpData.laplace_scale.toFixed(4)}<br />
                  Mean after noise: {dpData.statistics.mean.toFixed(2)}<br />
                  Std Dev: {dpData.statistics.std.toFixed(2)}
                </div>
              </div>

              <div style={{ marginTop: '24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Distribution of 100 Noised Values</h3>
                <div style={styles.chartContainer}>
                  <div style={{ fontSize: '12px', color: '#94A3B8', textAlign: 'center' }}>
                    <div>Min: {dpData.statistics.min.toFixed(2)}</div>
                    <div style={{ margin: '8px 0' }}>Median: {dpData.statistics.median.toFixed(2)}</div>
                    <div>Max: {dpData.statistics.max.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {loading && <div style={styles.loadingSpinner} />}
        </div>
      )}

      {/* Chaos Perturbation Tab */}
      {explainabilityTab === 2 && (
        <div>
          <h2 style={styles.sectionTitle}>Chaos Perturbation Interactive Demo</h2>
          <div style={styles.sliderContainer}>
            <div style={styles.sliderLabel}>Lambda (λ) - Chaotic Parameter</div>
            <input
              type="range"
              min="3"
              max="4"
              step="0.01"
              value={lambda}
              onChange={(e) => setLambda(parseFloat(e.target.value))}
              style={styles.slider}
            />
            <div style={styles.valueDisplay}>λ = {lambda.toFixed(2)}</div>
          </div>

          {chaosData && (
            <div>
              <div style={{
                backgroundColor: '#F59E0B50',
                padding: '16px',
                borderRadius: '8px',
                marginTop: '16px',
                borderLeft: '4px solid #F59E0B',
              }}>
                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Logistic Map x(n+1) = λx(1-x)</div>
                <div style={{ fontSize: '13px', color: '#CBD5E1', fontFamily: '"Space Mono", monospace' }}>
                  Original value: {chaosData.original_value.toFixed(6)}<br />
                  After iterations: {chaosData.perturbed_value.toFixed(6)}<br />
                  Trajectory length: {chaosData.trajectory.length} iterations
                </div>
              </div>

              <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#1E293B', borderRadius: '6px', borderLeft: '3px solid #10B981' }}>
                <div style={{ fontSize: '12px', color: '#CBD5E1', lineHeight: '1.5' }}>
                  <strong>Irreversibility Proof:</strong> {chaosData.irreversibility_proof}
                </div>
              </div>
            </div>
          )}

          {loading && <div style={styles.loadingSpinner} />}
        </div>
      )}

      {/* Privacy-Utility Plot Tab */}
      {explainabilityTab === 3 && (
        <div>
          <h2 style={styles.sectionTitle}>Privacy-Utility Tradeoff Landscape</h2>

          {puData && (
            <div>
              <div style={styles.chartContainer}>
                <div style={{ fontSize: '13px', color: '#94A3B8', textAlign: 'center' }}>
                  <div style={{ marginBottom: '16px' }}>
                    <strong style={{ color: '#E2E8F0' }}>Scatter Plot (X: Utility, Y: Privacy)</strong>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginTop: '12px' }}>
                    {puData.points.slice(0, 4).map((point, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '12px',
                          backgroundColor: '#334155',
                          borderRadius: '6px',
                          borderLeft: `3px solid ${['#7C3AED', '#06B6D4', '#10B981', '#F59E0B'][idx]}`,
                        }}
                      >
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>{point.algorithm}</div>
                        <div style={{ fontSize: '12px' }}>
                          Privacy: {(point.privacy_score * 100).toFixed(0)}% | Utility: {(point.utility_score * 100).toFixed(0)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Pareto Frontier (Optimal Solutions)</h3>
                <div style={styles.dataCard}>
                  {puData.pareto_frontier.join(' → ')}
                </div>
              </div>
            </div>
          )}

          {loading && <div style={styles.loadingSpinner} />}
        </div>
      )}

      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #7C3AED;
          cursor: pointer;
          box-shadow: 0 0 6px rgba(124, 58, 237, 0.4);
        }
        input[type="range"]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #7C3AED;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 6px rgba(124, 58, 237, 0.4);
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
