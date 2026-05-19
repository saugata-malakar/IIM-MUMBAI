/**
 * Drug Intelligence Panel Component
 * 
 * Searchable drug-diagnosis knowledge base from anonymized dataset.
 * Shows drug frequency, co-prescriptions, vitals distribution, 
 * and contraindication validation.
 */

'use client';

import React, { useState, useEffect } from 'react';

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

export default function DrugIntelligencePanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState([]);

  const logMsg = (msg, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { msg, type, timestamp }]);
  };

  // Search for drugs/diagnoses
  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    logMsg(`🔍 Searching: "${query}"`, 'info');

    try {
      const response = await fetch('/api/clinical/drugs/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        setSearchResults(data.results);
        logMsg(`✅ Found ${data.results.length} matches`, 'success');
      } else {
        logMsg(`❌ Search error: ${data.message}`, 'error');
      }
    } catch (err) {
      logMsg(`❌ Error: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Get analytics for selected item
  const handleSelectItem = async (item) => {
    setSelectedItem(item.name);
    setSelectedType(item.type);
    setAnalytics(null);
    setLoading(true);
    logMsg(`📊 Loading ${item.type} analytics for "${item.name}"...`, 'info');

    try {
      const endpoint =
        item.type === 'drug' ? '/api/clinical/drugs/analytics' : '/api/clinical/diagnoses/analytics';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          item.type === 'drug'
            ? { drug_name: item.name }
            : { diagnosis_name: item.name }
        ),
      });

      const data = await response.json();

      if (data.status === 'success') {
        setAnalytics(data[item.type === 'drug' ? 'drug' : 'diagnosis']);
        logMsg(`✅ Loaded analytics for ${item.name}`, 'success');
      } else {
        logMsg(`❌ Error: ${data.message}`, 'error');
      }
    } catch (err) {
      logMsg(`❌ Error: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Log entry component
  const LogLine = ({ entry }) => {
    const typeColor = { info: C.muted, success: C.green, error: C.red }[entry.type];
    return (
      <div style={{ color: typeColor, fontSize: '12px', marginBottom: '4px', fontFamily: 'Space Mono' }}>
        <span style={{ color: C.dim }}>[{entry.timestamp}]</span> {entry.msg}
      </div>
    );
  };

  // Stats card
  const StatCard = ({ label, value, color = C.cyan }) => (
    <div
      style={{
        background: `${color}15`,
        border: `1px solid ${color}30`,
        borderRadius: '8px',
        padding: '12px',
        textAlign: 'center',
      }}
    >
      <div style={{ color: C.muted, fontSize: '11px', marginBottom: '4px' }}>{label}</div>
      <div style={{ color, fontSize: '20px', fontWeight: '600' }}>{value}</div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, padding: '20px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '32px', marginBottom: '8px', color: C.cyan }}>💊 Drug Intelligence Panel</h1>
          <p style={{ color: C.muted }}>Search drugs and diagnoses to explore co-prescriptions, vitals, and clinical patterns</p>
        </div>

        {/* Search Section */}
        <div
          style={{
            background: `linear-gradient(135deg, ${C.purpleL}10, ${C.cyanL}10)`,
            border: `1px solid ${C.purple}20`,
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
          }}
        >
          <label style={{ color: C.text, fontSize: '14px', display: 'block', marginBottom: '12px', fontWeight: '600' }}>
            🔍 Search Drugs or Diagnoses
          </label>
          <input
            type="text"
            placeholder="Type a drug name or diagnosis (e.g., 'Metformin', 'Diabetes', 'Aspirin')..."
            value={searchQuery}
            onChange={handleSearch}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: C.dim,
              border: `1px solid ${C.purple}40`,
              borderRadius: '8px',
              color: C.text,
              fontSize: '14px',
              marginBottom: '12px',
            }}
          />

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '12px',
              }}
            >
              {searchResults.map((result, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectItem(result)}
                  style={{
                    background: result.type === 'drug' ? `${C.cyan}20` : `${C.green}20`,
                    border: `1px solid ${result.type === 'drug' ? C.cyan : C.green}40`,
                    borderRadius: '8px',
                    padding: '12px',
                    color: C.text,
                    cursor: 'pointer',
                    fontSize: '13px',
                    transition: 'all 0.3s',
                  }}
                  onMouseOver={(e) => (e.target.style.background = `${result.type === 'drug' ? C.cyan : C.green}40`)}
                  onMouseOut={(e) => (e.target.style.background = `${result.type === 'drug' ? C.cyan : C.green}20`)}
                >
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>{result.name}</div>
                  <div style={{ fontSize: '11px', color: C.muted }}>
                    {result.type === 'drug' ? '💊 Drug' : '🏥 Diagnosis'}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Analytics Section */}
        {analytics && (
          <>
            {/* Header */}
            <div
              style={{
                background: `linear-gradient(135deg, ${C.greenL}10, ${C.cyanL}10)`,
                border: `1px solid ${C.green}20`,
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '24px',
              }}
            >
              <h2 style={{ fontSize: '22px', color: C.green, marginBottom: '16px' }}>
                {selectedType === 'drug' ? '💊' : '🏥'} {selectedItem}
              </h2>

              {/* Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                {selectedType === 'drug' ? (
                  <>
                    <StatCard label="Records" value={analytics.total_records} color={C.cyan} />
                    <StatCard label="Prevalence" value={`${analytics.prevalence_percent}%`} color={C.amber} />
                    <StatCard label="Diagnoses" value={Object.keys(analytics.diagnoses).length} color={C.green} />
                    <StatCard label="Co-prescribed" value={analytics.co_prescribed_drugs.length} color={C.purple} />
                  </>
                ) : (
                  <>
                    <StatCard label="Records" value={analytics.total_records} color={C.cyan} />
                    <StatCard label="Unique Drugs" value={Object.keys(analytics.all_drugs).length} color={C.green} />
                    <StatCard
                      label="Avg BP"
                      value={Math.round(analytics.average_vitals.bp_systolic || 0)}
                      color={C.amber}
                    />
                    <StatCard
                      label="Avg Sugar"
                      value={Math.round(analytics.average_vitals.blood_sugar || 0)}
                      color={C.red}
                    />
                  </>
                )}
              </div>
            </div>

            {/* Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              {/* Left: Drugs or Diagnoses */}
              <div
                style={{
                  background: `${C.purpleL}10`,
                  border: `1px solid ${C.purple}20`,
                  borderRadius: '12px',
                  padding: '20px',
                }}
              >
                <h3 style={{ color: C.purple, marginBottom: '16px', fontSize: '16px' }}>
                  {selectedType === 'drug' ? '🏥 Associated Diagnoses' : '💊 Prescribed Drugs'}
                </h3>
                {(selectedType === 'drug' ? analytics.top_diagnoses : analytics.top_drugs).map((item, idx) => {
                  const [name, count] = Array.isArray(item) ? item : [item.drug || item.diagnosis, item.count];
                  const total = selectedType === 'drug' ? analytics.total_records : analytics.total_records;
                  const percent = ((count / total) * 100).toFixed(1);

                  return (
                    <div key={idx} style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '13px', color: C.text }}>{name}</span>
                        <span style={{ fontSize: '12px', color: C.cyan, fontWeight: '600' }}>
                          {count} ({percent}%)
                        </span>
                      </div>
                      <div
                        style={{
                          width: '100%',
                          height: '6px',
                          background: C.dim,
                          borderRadius: '3px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.min((count / (total * 0.5)) * 100, 100)}%`,
                            height: '100%',
                            background: C.purple,
                            transition: 'width 0.6s',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right: Vitals or Co-prescriptions */}
              <div
                style={{
                  background: `${C.cyanL}10`,
                  border: `1px solid ${C.cyan}20`,
                  borderRadius: '12px',
                  padding: '20px',
                }}
              >
                <h3 style={{ color: C.cyan, marginBottom: '16px', fontSize: '16px' }}>
                  {selectedType === 'drug'
                    ? '💊 Co-Prescribed Drugs'
                    : '📊 Vitals Distribution'}
                </h3>

                {selectedType === 'drug' ? (
                  <>
                    {analytics.co_prescribed_drugs.length > 0 ? (
                      analytics.co_prescribed_drugs.map((drug, idx) => (
                        <div
                          key={idx}
                          style={{
                            background: `${C.amber}15`,
                            border: `1px solid ${C.amber}30`,
                            borderRadius: '6px',
                            padding: '10px',
                            marginBottom: '8px',
                            fontSize: '13px',
                          }}
                        >
                          <div style={{ color: C.text, fontWeight: '600' }}>{drug[0]}</div>
                          <div style={{ color: C.muted, fontSize: '11px' }}>Co-occurred {drug[1]} times</div>
                        </div>
                      ))
                    ) : (
                      <div style={{ color: C.muted }}>No co-prescriptions found</div>
                    )}
                  </>
                ) : (
                  <>
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ color: C.muted, fontSize: '12px', marginBottom: '4px' }}>Systolic BP (avg)</div>
                      <div style={{ color: C.red, fontSize: '18px', fontWeight: '600' }}>
                        {Math.round(analytics.average_vitals.bp_systolic || 0)} mmHg
                      </div>
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ color: C.muted, fontSize: '12px', marginBottom: '4px' }}>Blood Sugar (avg)</div>
                      <div style={{ color: C.amber, fontSize: '18px', fontWeight: '600' }}>
                        {Math.round(analytics.average_vitals.blood_sugar || 0)} mg/dL
                      </div>
                    </div>
                    <div>
                      <div style={{ color: C.muted, fontSize: '12px', marginBottom: '4px' }}>Heart Rate (avg)</div>
                      <div style={{ color: C.green, fontSize: '18px', fontWeight: '600' }}>
                        {Math.round(analytics.average_vitals.heart_rate || 0)} bpm
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Additional Info */}
            <div
              style={{
                background: `${C.dim}40`,
                border: `1px solid ${C.muted}20`,
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '24px',
                fontSize: '12px',
                color: C.muted,
                fontFamily: 'Space Mono',
              }}
            >
              🔐 Data sourced from anonymized EHR records — DPDP compliant — zero PII exposure
            </div>
          </>
        )}

        {/* Empty state */}
        {!analytics && searchQuery.length < 2 && (
          <div
            style={{
              background: `${C.dim}40`,
              border: `1px solid ${C.muted}20`,
              borderRadius: '12px',
              padding: '60px 20px',
              textAlign: 'center',
              color: C.muted,
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
            <div style={{ fontSize: '18px' }}>Start by searching for a drug or diagnosis</div>
            <div style={{ fontSize: '13px', marginTop: '8px' }}>
              Try: Metformin, Diabetes, Aspirin, COVID-19...
            </div>
          </div>
        )}

        {/* Logs */}
        {logs.length > 0 && (
          <div
            style={{
              background: `${C.dim}40`,
              border: `1px solid ${C.muted}20`,
              borderRadius: '12px',
              padding: '16px',
              maxHeight: '150px',
              overflowY: 'auto',
            }}
          >
            <div style={{ color: C.muted, fontSize: '11px', marginBottom: '12px' }}>📝 Activity Log:</div>
            {logs.map((log, idx) => (
              <LogLine key={idx} entry={log} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
