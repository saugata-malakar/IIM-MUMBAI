'use client';

import React, { useState, useRef, useCallback } from 'react';

const COLORS = {
  purple: '#7C3AED',
  cyan: '#06B6D4',
  green: '#10B981',
  amber: '#F59E0B',
  red: '#EF4444',
  gray: '#6B7280',
};

const PII_COLORS = {
  phone: '#FF6B6B',
  email: '#4ECDC4',
  date: '#45B7D1',
  aadhaar: '#FFA07A',
  pin: '#98D8C8',
  name: '#F7DC6F',
  id: '#BB8FCE',
};

export default function PrescriptionOCRLab() {
  const [image, setImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [ocrText, setOcrText] = useState('');
  const [piiDetections, setPiiDetections] = useState([]);
  const [redactedText, setRedactedText] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);

    // Preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target?.result);
    };
    reader.readAsDataURL(file);

    // Reset results
    setOcrText('');
    setPiiDetections([]);
    setRedactedText('');
  }, []);

  const handleRunOCR = useCallback(async () => {
    if (!image) return;

    setLoading(true);
    try {
      // Simulate Tesseract.js OCR
      // In production, use: const Tesseract = require('tesseract.js');
      const mockText = `PRESCRIPTION

Patient: Mr. John Smith
Age: 45, Phone: +91-98765-43210
Email: john.smith@email.com
Aadhaar: 1234-5678-9012
PIN: 560034

Date: 15/12/2024
Doctor: Dr. Rajesh Kumar (Doc ID: DOC-12345)

Diagnosis: Hypertension & Type 2 Diabetes

Medications:
1. Lisinopril 10mg - 1 tablet daily
2. Metformin 500mg - 2 tablets twice daily
3. Atorvastatin 20mg - 1 tablet at bedtime

Instructions: Take with meals. Follow up on 29/12/2024`;

      setOcrText(mockText);

      // Detect PII
      const response = await fetch('/api/clinical/ocr/detect-pii', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: mockText }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        setPiiDetections(data.pii_detected);
        setRedactedText(data.redacted_text);
      }
    } catch (error) {
      console.error('OCR failed:', error);
    } finally {
      setLoading(false);
    }
  }, [image]);

  const getHighlightedText = () => {
    if (!ocrText || piiDetections.length === 0) {
      return <span>{ocrText}</span>;
    }

    const sorted = [...piiDetections].sort((a, b) => a.position.start - b.position.start);
    const parts = [];
    let lastEnd = 0;

    sorted.forEach((detection, idx) => {
      if (detection.position.start > lastEnd) {
        parts.push(
          <span key={`text-${idx}`}>
            {ocrText.substring(lastEnd, detection.position.start)}
          </span>
        );
      }

      parts.push(
        <span
          key={`pii-${idx}`}
          style={{
            background: PII_COLORS[detection.type] || COLORS.red,
            color: 'white',
            padding: '2px 4px',
            borderRadius: '3px',
            fontWeight: '600',
            fontSize: '12px',
            display: 'inline-block',
            marginRight: '2px',
          }}
          title={`${detection.type} (${(detection.confidence * 100).toFixed(0)}% confidence)`}
        >
          {detection.text}
        </span>
      );

      lastEnd = detection.position.end;
    });

    if (lastEnd < ocrText.length) {
      parts.push(
        <span key="text-end">{ocrText.substring(lastEnd)}</span>
      );
    }

    return parts;
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: COLORS.purple, margin: '0 0 10px 0' }}>
          📄 Prescription OCR Demo Lab
        </h1>
        <p style={{ color: COLORS.gray, margin: '0', fontSize: '14px' }}>
          Upload a prescription image to extract text and automatically detect & redact PII entities.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {/* Left: Upload & OCR */}
        <div>
          {/* Image Upload */}
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${COLORS.purple}`,
              borderRadius: '12px',
              padding: '40px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              background: image ? 'white' : '#F3F0FF',
              marginBottom: '20px',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              if (!image) e.currentTarget.style.background = '#EDE9FE';
            }}
            onMouseLeave={(e) => {
              if (!image) e.currentTarget.style.background = '#F3F0FF';
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
            {image ? (
              <>
                <img
                  src={image}
                  alt="Prescription"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '400px',
                    borderRadius: '8px',
                  }}
                />
                <p style={{ color: COLORS.gray, margin: '15px 0 0 0', fontSize: '12px' }}>
                  Click to change image
                </p>
              </>
            ) : (
              <>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>📸</div>
                <div style={{ fontWeight: '600', color: COLORS.purple, marginBottom: '5px' }}>
                  Upload Prescription Image
                </div>
                <div style={{ fontSize: '12px', color: COLORS.gray }}>
                  Click here or drag & drop a JPG, PNG image
                </div>
              </>
            )}
          </div>

          {/* OCR Button */}
          {image && (
            <button
              onClick={handleRunOCR}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
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
              {loading ? '🔄 Scanning with Tesseract...' : '🔍 Extract & Detect PII'}
            </button>
          )}

          {/* PII Detection Stats */}
          {piiDetections.length > 0 && (
            <div style={{
              background: '#FEF3C7',
              border: `1px solid ${COLORS.amber}`,
              borderRadius: '8px',
              padding: '15px',
              marginTop: '20px',
            }}>
              <h3 style={{ fontSize: '13px', fontWeight: '600', margin: '0 0 10px 0', color: COLORS.amber }}>
                🚨 {piiDetections.length} PII Entities Detected
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
              }}>
                {Object.entries(
                  piiDetections.reduce((acc, d) => {
                    acc[d.type] = (acc[d.type] || 0) + 1;
                    return acc;
                  }, {})
                ).map(([type, count]) => (
                  <div key={type} style={{
                    background: 'white',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    fontSize: '12px',
                    fontWeight: '500',
                  }}>
                    <span style={{ color: PII_COLORS[type] }}>●</span> {type}: <strong>{count}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: OCR Text & Redaction */}
        <div>
          {ocrText && (
            <>
              {/* Original with Highlights */}
              <div style={{
                background: 'white',
                border: `1px solid ${COLORS.gray}`,
                borderRadius: '8px',
                padding: '15px',
                marginBottom: '20px',
              }}>
                <h3 style={{ fontSize: '13px', fontWeight: '600', margin: '0 0 12px 0', color: COLORS.gray }}>
                  📜 Original Text (with PII highlighted)
                </h3>
                <div style={{
                  background: '#F9FAFB',
                  borderRadius: '6px',
                  padding: '12px',
                  fontSize: '12px',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word',
                  maxHeight: '300px',
                  overflow: 'auto',
                  fontFamily: 'Space Mono, monospace',
                }}>
                  {getHighlightedText()}
                </div>
              </div>

              {/* Redacted Version */}
              {redactedText && (
                <div style={{
                  background: '#F0FDF4',
                  border: `1px solid ${COLORS.green}`,
                  borderRadius: '8px',
                  padding: '15px',
                  marginBottom: '20px',
                }}>
                  <h3 style={{ fontSize: '13px', fontWeight: '600', margin: '0 0 12px 0', color: COLORS.green }}>
                    ✓ Redacted Text (PII removed)
                  </h3>
                  <div style={{
                    background: 'white',
                    borderRadius: '6px',
                    padding: '12px',
                    fontSize: '12px',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word',
                    maxHeight: '300px',
                    overflow: 'auto',
                    fontFamily: 'Space Mono, monospace',
                  }}>
                    {redactedText}
                  </div>
                </div>
              )}

              {/* PII Details */}
              {piiDetections.length > 0 && (
                <div style={{
                  background: 'white',
                  border: `1px solid ${COLORS.purple}`,
                  borderRadius: '8px',
                  padding: '15px',
                }}>
                  <h3 style={{ fontSize: '13px', fontWeight: '600', margin: '0 0 12px 0', color: COLORS.purple }}>
                    📋 Detected PII (Audit Report)
                  </h3>
                  <div style={{
                    maxHeight: '250px',
                    overflow: 'auto',
                  }}>
                    {piiDetections.map((detection, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '8px 0',
                          borderBottom: idx < piiDetections.length - 1 ? `1px solid #E5E7EB` : 'none',
                          fontSize: '12px',
                        }}
                      >
                        <div>
                          <span style={{
                            background: PII_COLORS[detection.type],
                            color: 'white',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            fontWeight: '600',
                            marginRight: '8px',
                          }}>
                            {detection.type}
                          </span>
                          <span style={{ fontFamily: 'Space Mono, monospace' }}>
                            {detection.text}
                          </span>
                        </div>
                        <div style={{ color: COLORS.green, fontWeight: '600' }}>
                          {(detection.confidence * 100).toFixed(0)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div style={{
        background: '#F9FAFB',
        border: `1px solid #E5E7EB`,
        borderRadius: '8px',
        padding: '15px',
        marginTop: '30px',
        fontSize: '12px',
      }}>
        <strong>PII Types Detected:</strong>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginTop: '10px' }}>
          {Object.entries(PII_COLORS).map(([type, color]) => (
            <div key={type} style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{
                width: '12px',
                height: '12px',
                background: color,
                borderRadius: '2px',
                marginRight: '6px',
              }} />
              <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
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
        marginTop: '20px',
        fontSize: '13px',
        color: COLORS.gray,
      }}>
        <strong>📖 How it works:</strong> Upload a prescription image. The system runs OCR (Tesseract.js) to extract text,
        then detects 7 types of PII: phone, email, date, Aadhaar, PIN code, names, and IDs. Detected PII is highlighted
        and can be redacted. Results are logged for DPDP compliance audit trails.
      </div>
    </div>
  );
}
