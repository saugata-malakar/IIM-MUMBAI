'use client';

import React, { useState, useRef } from 'react';

export default function DPDPComplianceAuditor() {
  const [datasetFile, setDatasetFile] = useState(null);
  const [auditReport, setAuditReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setDatasetFile(file);
      setError(null);
    }
  };

  const runAudit = async () => {
    if (!datasetFile) {
      setError('Please select a dataset file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', datasetFile);

      // Upload file
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      const uploadData = await uploadResponse.json();
      const filename = uploadData.filename || datasetFile.name;

      // Run audit
      const auditResponse = await fetch('/api/clinical/dpdp/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataset_filename: filename }),
      });

      const auditData = await auditResponse.json();
      if (auditData.status === 'success') {
        setAuditReport(auditData.report);
      } else {
        setError(auditData.message || 'Audit failed');
      }
    } catch (err) {
      setError(err.message || 'Error running audit');
      console.error('Audit error:', err);
    }

    setLoading(false);
  };

  const styles = {
    container: {
      padding: '24px',
      height: '100%',
      overflowY: 'auto',
      backgroundColor: '#0F172A',
      color: '#E2E8F0',
    },
    uploadSection: {
      backgroundColor: '#1E293B',
      border: '2px dashed #334155',
      borderRadius: '8px',
      padding: '24px',
      textAlign: 'center',
      cursor: 'pointer',
      transition: 'all 0.2s',
      marginBottom: '24px',
    },
    uploadText: {
      fontSize: '14px',
      color: '#94A3B8',
      marginBottom: '12px',
    },
    uploadButton: {
      padding: '10px 16px',
      backgroundColor: '#7C3AED',
      color: '#FFF',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      transition: 'all 0.2s',
    },
    fileNameDisplay: {
      marginTop: '12px',
      fontSize: '13px',
      color: '#06B6D4',
      fontFamily: '"Space Mono", monospace',
    },
    complianceRing: {
      width: '120px',
      height: '120px',
      borderRadius: '50%',
      backgroundColor: '#1E293B',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '24px auto',
      border: '4px solid #334155',
      position: 'relative',
    },
    compliancePercentage: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#E2E8F0',
    },
    complianceLabel: {
      fontSize: '11px',
      color: '#94A3B8',
      marginTop: '4px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    overallStatus: {
      fontSize: '16px',
      fontWeight: '600',
      marginTop: '16px',
      padding: '12px',
      backgroundColor: '#1E293B',
      borderRadius: '6px',
      textAlign: 'center',
    },
    checksContainer: {
      marginTop: '24px',
    },
    checkItem: (passed) => ({
      backgroundColor: '#1E293B',
      border: `1px solid ${passed ? '#10B981' : '#EF4444'}`,
      borderLeft: `4px solid ${passed ? '#10B981' : '#EF4444'}`,
      borderRadius: '6px',
      padding: '16px',
      marginBottom: '12px',
    }),
    checkHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '8px',
    },
    checkNumber: {
      backgroundColor: '#334155',
      borderRadius: '50%',
      width: '28px',
      height: '28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      fontWeight: '600',
    },
    checkName: {
      fontSize: '14px',
      fontWeight: '600',
      flex: 1,
    },
    checkBadge: (passed) => ({
      padding: '4px 12px',
      borderRadius: '4px',
      fontSize: '11px',
      fontWeight: '600',
      backgroundColor: passed ? '#10B98120' : '#EF444420',
      color: passed ? '#10B981' : '#EF4444',
    }),
    checkSection: {
      fontSize: '12px',
      color: '#94A3B8',
      marginTop: '8px',
      fontFamily: '"Space Mono", monospace',
    },
    checkEvidence: {
      fontSize: '13px',
      color: '#CBD5E1',
      marginTop: '8px',
      lineHeight: '1.5',
    },
    checkRecommendation: {
      fontSize: '12px',
      color: '#06B6D4',
      marginTop: '8px',
      padding: '8px 12px',
      backgroundColor: '#06B6D420',
      borderRadius: '4px',
      borderLeft: '2px solid #06B6D4',
    },
    downloadButton: {
      padding: '12px 24px',
      backgroundColor: '#10B981',
      color: '#FFF',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      marginTop: '24px',
      width: '100%',
      transition: 'all 0.2s',
    },
    errorBox: {
      backgroundColor: '#EF444420',
      border: '1px solid #EF4444',
      borderRadius: '6px',
      padding: '12px',
      color: '#EF4444',
      marginTop: '12px',
      fontSize: '13px',
    },
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: '#EF4444',
      high: '#F59E0B',
      medium: '#06B6D4',
      low: '#10B981',
    };
    return colors[severity] || '#06B6D4';
  };

  return (
    <div style={styles.container}>
      <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px' }}>DPDP Act 2023 Compliance Auditor</h2>

      {/* Upload Section */}
      <div
        style={styles.uploadSection}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          e.currentTarget.style.backgroundColor = '#334155';
        }}
        onDragLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#1E293B';
        }}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) setDatasetFile(file);
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <div style={styles.uploadText}>📁 Drag & drop your CSV file or click to browse</div>
        <button
          style={styles.uploadButton}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#6D28D9')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#7C3AED')}
        >
          Select CSV File
        </button>
        {datasetFile && (
          <div style={styles.fileNameDisplay}>Selected: {datasetFile.name}</div>
        )}
      </div>

      {/* Run Audit Button */}
      <button
        style={{
          ...styles.uploadButton,
          backgroundColor: '#06B6D4',
          marginBottom: '24px',
        }}
        onClick={runAudit}
        disabled={!datasetFile || loading}
        onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#0891B2')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#06B6D4')}
      >
        {loading ? '🔄 Running Audit...' : '▶️ Run Compliance Audit'}
      </button>

      {error && <div style={styles.errorBox}>{error}</div>}

      {/* Audit Report */}
      {auditReport && (
        <div>
          {/* Compliance Ring */}
          <div style={styles.complianceRing}>
            <div style={styles.compliancePercentage}>{auditReport.compliance_percentage.toFixed(0)}%</div>
            <div style={styles.complianceLabel}>Compliant</div>
          </div>

          {/* Overall Status */}
          <div
            style={{
              ...styles.overallStatus,
              backgroundColor:
                auditReport.overall_status === 'COMPLIANT'
                  ? '#10B98120'
                  : auditReport.overall_status === 'PARTIAL'
                  ? '#F59E0B20'
                  : '#EF444420',
              color:
                auditReport.overall_status === 'COMPLIANT'
                  ? '#10B981'
                  : auditReport.overall_status === 'PARTIAL'
                  ? '#F59E0B'
                  : '#EF4444',
            }}
          >
            {auditReport.overall_status === 'COMPLIANT'
              ? '✅ FULLY COMPLIANT'
              : auditReport.overall_status === 'PARTIAL'
              ? '⚠️ PARTIALLY COMPLIANT'
              : '❌ NON-COMPLIANT'}
          </div>

          {/* Dataset Info */}
          <div
            style={{
              backgroundColor: '#1E293B',
              padding: '12px',
              borderRadius: '6px',
              marginTop: '16px',
              fontSize: '12px',
              color: '#94A3B8',
            }}
          >
            <div>Dataset: <span style={{ color: '#E2E8F0' }}>{auditReport.dataset_name}</span></div>
            <div>Total Records: <span style={{ color: '#E2E8F0' }}>{auditReport.total_records.toLocaleString()}</span></div>
            <div>Total Columns: <span style={{ color: '#E2E8F0' }}>{auditReport.total_columns}</span></div>
            <div style={{ marginTop: '8px', fontSize: '11px', color: '#64748B' }}>
              Audit Date: {new Date(auditReport.generated_timestamp).toLocaleString()}
            </div>
          </div>

          {/* Checks */}
          <div style={styles.checksContainer}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
              Compliance Checks ({auditReport.checks.length})
            </h3>

            {auditReport.checks.map((check, idx) => (
              <div key={idx} style={styles.checkItem(check.passed)}>
                <div style={styles.checkHeader}>
                  <div style={styles.checkNumber}>{check.check_number}</div>
                  <div style={styles.checkName}>{check.check_name}</div>
                  <div style={styles.checkBadge(check.passed)}>
                    {check.passed ? '✅ PASS' : '❌ FAIL'}
                  </div>
                </div>

                <div style={styles.checkSection}>
                  {check.dpdp_section}: Section {check.dpdp_section.split('Section ')[1]}
                </div>

                <div style={styles.checkEvidence}>{check.evidence}</div>

                {check.recommendation && (
                  <div style={styles.checkRecommendation}>{check.recommendation}</div>
                )}
              </div>
            ))}
          </div>

          {/* Download Report */}
          <button
            style={styles.downloadButton}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#059669')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#10B981')}
          >
            📥 Download PDF Report
          </button>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <div
            style={{
              display: 'inline-block',
              width: '30px',
              height: '30px',
              border: '3px solid #334155',
              borderTop: '3px solid #7C3AED',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
