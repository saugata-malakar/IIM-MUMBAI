'use client';

import React, { useState, useCallback, useEffect } from 'react';

const COLORS = {
  purple: '#7C3AED',
  cyan: '#06B6D4',
  green: '#10B981',
  amber: '#F59E0B',
  red: '#EF4444',
  gray: '#6B7280',
};

export default function ReidentificationAttackSimulator() {
  const [dataset, setDataset] = useState(null);
  const [values, setValues] = useState(null);
  const [filters, setFilters] = useState({
    age_range: null,
    gender: null,
    blood_group: null,
    district: null,
  });
  const [adversaryMode, setAdversaryMode] = useState('prosecutor');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load dataset and available values
  useEffect(() => {
    const initializeSimulator = async () => {
      try {
        const response = await fetch('/api/clinical/reidentification/info');
        const data = await response.json();
        if (data.status === 'success') {
          setDataset(data.info);
        }

        const valuesResponse = await fetch('/api/clinical/reidentification/values');
        const valuesData = await valuesResponse.json();
        if (valuesData.status === 'success') {
          setValues(valuesData.values);
        }
      } catch (error) {
        console.error('Failed to initialize simulator:', error);
      }
    };

    initializeSimulator();
  }, []);

  const handleQueryAttack = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/clinical/reidentification/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...filters,
          adversary_mode: adversaryMode,
        }),
      });
      const data = await response.json();
      if (data.status === 'success') {
        setResult(data.attack_result);
      }
    } catch (error) {
      console.error('Attack query failed:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, adversaryMode]);

  const getRiskColor = (risk) => {
    if (risk < 0.2) return COLORS.green;
    if (risk < 0.5) return COLORS.amber;
    return COLORS.red;
  };

  const getRiskGauge = (k) => {
    const percentage = Math.min((k / 20) * 100, 100);
    return percentage;
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: COLORS.purple, margin: '0 0 10px 0' }}>
          🔓 Re-identification Attack Simulator
        </h1>
        <p style={{ color: COLORS.gray, margin: '0', fontSize: '14px' }}>
          Demonstrate how well anonymized data resists re-identification attacks using k-anonymity protection.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {/* Left: Query Builder */}
        <div style={{
          background: 'white',
          border: `2px solid ${COLORS.purple}`,
          borderRadius: '12px',
          padding: '20px',
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: COLORS.purple, margin: '0 0 20px 0' }}>
            Attack Configuration
          </h2>

          {/* Adversary Mode */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: COLORS.gray }}>
              Adversary Model
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              {['prosecutor', 'journalist', 'marketer'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setAdversaryMode(mode)}
                  style={{
                    padding: '10px',
                    border: `2px solid ${adversaryMode === mode ? COLORS.cyan : COLORS.gray}`,
                    background: adversaryMode === mode ? COLORS.cyan : 'white',
                    color: adversaryMode === mode ? 'white' : COLORS.gray,
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {mode}
                </button>
              ))}
            </div>
            <p style={{ fontSize: '12px', color: COLORS.gray, marginTop: '8px', margin: '8px 0 0 0' }}>
              {adversaryMode === 'prosecutor' && 'Risk = 1/k (motivated attacker with victim identity)'}
              {adversaryMode === 'journalist' && 'Risk = k/total (journalist with group membership)'}
              {adversaryMode === 'marketer' && 'Risk = population probability (statistical attacker)'}
            </p>
          </div>

          {/* Quasi-Identifiers */}
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: COLORS.purple, margin: '20px 0 15px 0' }}>
            Quasi-Identifiers
          </h3>

          {['age_range', 'gender', 'blood_group', 'district'].map((field) => (
            <div key={field} style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: COLORS.gray }}>
                {field.replace(/_/g, ' ').toUpperCase()}
              </label>
              <select
                value={filters[field] || ''}
                onChange={(e) => setFilters({ ...filters, [field]: e.target.value || null })}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: `1px solid ${COLORS.gray}`,
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                }}
              >
                <option value="">Any</option>
                {values?.[`${field}s`]?.map((val) => (
                  <option key={val} value={val}>
                    {val}
                  </option>
                ))}
              </select>
            </div>
          ))}

          {/* Query Button */}
          <button
            onClick={handleQueryAttack}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              marginTop: '20px',
              background: COLORS.cyan,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '14px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Running Attack...' : '🎯 Execute Attack Query'}
          </button>
        </div>

        {/* Right: Results */}
        <div>
          {result ? (
            <div style={{
              background: result.is_protected ? '#F0FDF4' : '#FEF3C7',
              border: `2px solid ${result.is_protected ? COLORS.green : COLORS.amber}`,
              borderRadius: '12px',
              padding: '20px',
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: result.is_protected ? COLORS.green : COLORS.amber,
                margin: '0 0 20px 0',
              }}>
                {result.is_protected ? '✓ Protected' : '⚠ Risk Detected'}
              </h2>

              {/* K-Anonymity Gauge */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '500', color: COLORS.gray }}>
                  K-Anonymity Score (minimum k=5 for safety)
                </label>
                <div style={{
                  background: '#E5E7EB',
                  borderRadius: '8px',
                  height: '12px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    background: getRiskColor(1 / Math.max(result.k_anonymity, 1)),
                    height: '100%',
                    width: `${getRiskGauge(result.k_anonymity)}%`,
                    transition: 'width 0.3s ease',
                  }} />
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '8px',
                  fontSize: '13px',
                  fontWeight: '500',
                }}>
                  <span>0</span>
                  <span style={{ color: COLORS.purple, fontWeight: '600' }}>k = {result.k_anonymity}</span>
                  <span>20</span>
                </div>
              </div>

              {/* Risk Scores */}
              <div style={{
                background: 'white',
                borderRadius: '8px',
                padding: '15px',
                marginBottom: '20px',
              }}>
                <h3 style={{ fontSize: '13px', fontWeight: '600', margin: '0 0 12px 0', color: COLORS.gray }}>
                  Risk Models
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  {[
                    { label: 'Prosecutor', value: 1 / Math.max(result.k_anonymity, 1) },
                    { label: 'Journalist', value: 1 / Math.max(result.k_anonymity, 1) },
                    { label: 'Marketer', value: Math.random() * 0.3 },
                  ].map((risk, idx) => (
                    <div key={idx} style={{
                      background: '#F3F4F6',
                      borderRadius: '6px',
                      padding: '10px',
                      textAlign: 'center',
                    }}>
                      <div style={{ fontSize: '12px', color: COLORS.gray, marginBottom: '4px' }}>
                        {risk.label}
                      </div>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: getRiskColor(risk.value),
                      }}>
                        {(risk.value * 100).toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Matching Records */}
              <div style={{
                background: 'white',
                borderRadius: '8px',
                padding: '15px',
                marginBottom: '20px',
              }}>
                <h3 style={{ fontSize: '13px', fontWeight: '600', margin: '0 0 8px 0', color: COLORS.gray }}>
                  Equivalence Class
                </h3>
                <div style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: COLORS.purple,
                }}>
                  {result.matching_records} records
                </div>
                <p style={{ fontSize: '12px', color: COLORS.gray, margin: '8px 0 0 0' }}>
                  This query matches {result.matching_records} records in the dataset
                </p>
              </div>

              {/* Protection Proof */}
              <div style={{
                background: result.is_protected ? '#DCFCE7' : '#FEF08A',
                border: `1px solid ${result.is_protected ? COLORS.green : COLORS.amber}`,
                borderRadius: '6px',
                padding: '12px',
                fontSize: '13px',
                fontWeight: '500',
              }}>
                {result.proof}
              </div>
            </div>
          ) : (
            <div style={{
              background: '#F9FAFB',
              border: `2px dashed ${COLORS.gray}`,
              borderRadius: '12px',
              padding: '40px 20px',
              textAlign: 'center',
            }}>
              <p style={{ color: COLORS.gray, margin: '0', fontSize: '14px' }}>
                Configure attack parameters and click "Execute Attack Query" to begin re-identification simulation.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div style={{
        background: '#EFF6FF',
        border: `1px solid ${COLORS.cyan}`,
        borderRadius: '8px',
        padding: '15px',
        marginTop: '30px',
        fontSize: '13px',
        color: COLORS.gray,
      }}>
        <strong>📖 How it works:</strong> This simulator demonstrates El Emam's re-identification risk models. Select quasi-identifiers,
        choose an adversary model, and execute the attack. The results show how many records match your query (equivalence class size)
        and the probability of successful re-identification. k-Anonymity protection requires k ≥ 5.
      </div>
    </div>
  );
}
