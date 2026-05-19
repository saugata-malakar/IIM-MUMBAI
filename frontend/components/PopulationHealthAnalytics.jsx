'use client';

import React, { useState, useEffect } from 'react';

const COLORS = {
  purple: '#7C3AED',
  cyan: '#06B6D4',
  green: '#10B981',
  amber: '#F59E0B',
  red: '#EF4444',
  gray: '#6B7280',
};

export default function PopulationHealthAnalytics() {
  const [dataset, setDataset] = useState(null);
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [ageHistogram, setAgeHistogram] = useState(null);
  const [diseasePrevalence, setDiseasePrevalence] = useState(null);
  const [genderDist, setGenderDist] = useState(null);
  const [vitals, setVitals] = useState(null);

  const computeMetrics = async () => {
    setLoading(true);
    try {
      // In real scenario, user would upload a file
      // For demo, use mock dataset
      const mockDataset = 'final_anonymized_dataset.csv';

      const response = await fetch('/api/clinical/population/compute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataset_filename: mockDataset }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        setMetrics(data.metrics);

        // Fetch individual metric types
        const [ageRes, diseaseRes, genderRes, vitalsRes] = await Promise.all([
          fetch('/api/clinical/population/age-histogram'),
          fetch('/api/clinical/population/disease-prevalence'),
          fetch('/api/clinical/population/gender-distribution'),
          fetch('/api/clinical/population/vitals-by-diagnosis'),
        ]);

        if (ageRes.ok) {
          const ageData = await ageRes.json();
          if (ageData.status === 'success') setAgeHistogram(ageData.age_distribution);
        }

        if (diseaseRes.ok) {
          const diseaseData = await diseaseRes.json();
          if (diseaseData.status === 'success') setDiseasePrevalence(diseaseData.disease_prevalence);
        }

        if (genderRes.ok) {
          const genderData = await genderRes.json();
          if (genderData.status === 'success') setGenderDist(genderData.gender_distribution);
        }

        if (vitalsRes.ok) {
          const vitalsData = await vitalsRes.json();
          if (vitalsData.status === 'success') setVitals(vitalsData.vitals_by_diagnosis);
        }
      }
    } catch (error) {
      console.error('Failed to compute metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    computeMetrics();
  }, []);

  const SimpleBarChart = ({ data, label }) => {
    if (!data || Object.keys(data).length === 0) return null;

    const maxValue = Math.max(...Object.values(data));

    return (
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: '600', margin: '0 0 12px 0', color: COLORS.purple }}>
          {label}
        </h4>
        <div>
          {Object.entries(data)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([key, value]) => (
              <div key={key} style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px' }}>
                  <span style={{ fontWeight: '500', color: COLORS.gray }}>{key}</span>
                  <span style={{ fontWeight: '600', color: COLORS.purple }}>{value}</span>
                </div>
                <div style={{
                  background: '#E5E7EB',
                  borderRadius: '4px',
                  height: '8px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    background: `linear-gradient(90deg, ${COLORS.cyan} 0%, ${COLORS.purple} 100%)`,
                    height: '100%',
                    width: `${(value / maxValue) * 100}%`,
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: COLORS.purple, margin: '0 0 10px 0' }}>
          📊 Population Health Analytics
        </h1>
        <p style={{ color: COLORS.gray, margin: '0', fontSize: '14px' }}>
          Aggregate population-level analytics from anonymized medical data. Zero individual PII exposure.
        </p>
      </div>

      {/* Privacy Statement */}
      <div style={{
        background: '#F0FDF4',
        border: `2px solid ${COLORS.green}`,
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '30px',
        fontSize: '13px',
        fontWeight: '500',
        color: COLORS.green,
      }}>
        ✓ Showing aggregate of {metrics?.total_records || 'N'} anonymized records — 0 PII fields exposed
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '20px',
        marginBottom: '30px',
      }}>
        {[
          { label: 'Total Records', value: metrics?.total_records || 0, color: COLORS.purple },
          { label: 'Unique Diagnoses', value: metrics?.unique_diagnoses || 0, color: COLORS.cyan },
          { label: 'Avg Age (years)', value: metrics?.average_age ? metrics.average_age.toFixed(1) : 0, color: COLORS.green },
          { label: 'Avg Blood Sugar', value: metrics?.average_blood_sugar ? metrics.average_blood_sugar.toFixed(1) : 0, color: COLORS.amber },
        ].map((card, idx) => (
          <div
            key={idx}
            style={{
              background: 'white',
              border: `2px solid ${card.color}`,
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '12px', color: COLORS.gray, marginBottom: '8px', fontWeight: '500' }}>
              {card.label}
            </div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: card.color }}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '30px',
      }}>
        {/* Age Distribution */}
        <div style={{
          background: 'white',
          border: `1px solid ${COLORS.gray}`,
          borderRadius: '8px',
          padding: '20px',
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 15px 0', color: COLORS.purple }}>
            👥 Age Distribution (10-year bins)
          </h2>
          <SimpleBarChart data={ageHistogram} label="Age Groups" />
          <div style={{
            background: '#F3F0FF',
            borderRadius: '6px',
            padding: '10px',
            fontSize: '12px',
            color: COLORS.gray,
          }}>
            Population spread across age groups. Peak in {Object.entries(ageHistogram || {}).length > 0 ? Object.entries(ageHistogram || {}).sort((a, b) => b[1] - a[1])[0]?.[0] : 'N/A'}.
          </div>
        </div>

        {/* Disease Prevalence */}
        <div style={{
          background: 'white',
          border: `1px solid ${COLORS.gray}`,
          borderRadius: '8px',
          padding: '20px',
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 15px 0', color: COLORS.purple }}>
            🏥 Disease Prevalence
          </h2>
          <SimpleBarChart data={diseasePrevalence} label="Diagnosis Frequency" />
          <div style={{
            background: '#F3F0FF',
            borderRadius: '6px',
            padding: '10px',
            fontSize: '12px',
            color: COLORS.gray,
          }}>
            Top diagnoses by frequency across population.
          </div>
        </div>

        {/* Gender Distribution */}
        <div style={{
          background: 'white',
          border: `1px solid ${COLORS.gray}`,
          borderRadius: '8px',
          padding: '20px',
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 15px 0', color: COLORS.purple }}>
            ♀️♂️ Gender Distribution
          </h2>
          <div style={{
            display: 'flex',
            gap: '20px',
            marginBottom: '20px',
            justifyContent: 'center',
          }}>
            {genderDist && Object.entries(genderDist).map(([gender, count]) => (
              <div key={gender} style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '32px',
                  fontWeight: '700',
                  color: gender === 'M' ? COLORS.cyan : COLORS.amber,
                  marginBottom: '4px',
                }}>
                  {count}
                </div>
                <div style={{ fontSize: '12px', color: COLORS.gray, fontWeight: '500' }}>
                  {gender === 'M' ? 'Male' : 'Female'}
                </div>
              </div>
            ))}
          </div>
          <div style={{
            background: '#F3F0FF',
            borderRadius: '6px',
            padding: '10px',
            fontSize: '12px',
            color: COLORS.gray,
          }}>
            Population gender split.
          </div>
        </div>

        {/* Vitals by Diagnosis */}
        <div style={{
          background: 'white',
          border: `1px solid ${COLORS.gray}`,
          borderRadius: '8px',
          padding: '20px',
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 15px 0', color: COLORS.purple }}>
            💓 Avg Vitals by Diagnosis
          </h2>
          {vitals && Object.entries(vitals)
            .slice(0, 4)
            .map(([diagnosis, vitalsData]) => (
              <div key={diagnosis} style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #E5E7EB' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: COLORS.purple, marginBottom: '8px' }}>
                  {diagnosis}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
                  {Object.entries(vitalsData).map(([vital, value]) => (
                    <div key={vital} style={{
                      background: '#F9FAFB',
                      borderRadius: '4px',
                      padding: '6px 8px',
                    }}>
                      <div style={{ color: COLORS.gray, fontWeight: '500' }}>{vital}</div>
                      <div style={{ color: COLORS.purple, fontWeight: '600' }}>
                        {typeof value === 'number' ? value.toFixed(1) : value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
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
        <strong>📖 How it works:</strong> This view aggregates anonymized medical data to show population-level insights
        such as age distribution, disease prevalence, gender split, and average vitals by diagnosis. All metrics are computed
        at the aggregate level—individual records are never exposed, ensuring zero PII leakage and full DPDP compliance.
      </div>
    </div>
  );
}
