'use client';

import React, { useState, useCallback } from 'react';

const COLORS = {
  purple: '#7C3AED',
  cyan: '#06B6D4',
  green: '#10B981',
  amber: '#F59E0B',
  red: '#EF4444',
  gray: '#6B7280',
};

export default function LLMFineTuningExporter() {
  const [format, setFormat] = useState('huggingface');
  const [task, setTask] = useState('diagnosis_prediction');
  const [exportInfo, setExportInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [samplePairs, setSamplePairs] = useState([
    {
      instruction: 'Predict diagnosis from symptoms and vitals.',
      input_text: 'Patient age: 45, blood sugar: 180, BP: 140/90, heart rate: 85, gender: M',
      output_text: 'Diagnosis: Type 2 Diabetes Mellitus with Hypertension',
    },
    {
      instruction: 'Recommend medications for this diagnosis.',
      input_text: 'Diagnosis: Type 2 Diabetes. No allergies.',
      output_text: 'Recommended: Metformin 500mg, Atorvastatin 20mg, Lisinopril 10mg',
    },
    {
      instruction: 'Summarize clinical assessment.',
      input_text: 'Patient presents with elevated blood sugar, high BP, family history of diabetes.',
      output_text: 'Summary: 45-year-old male with metabolic syndrome, requiring lifestyle modification and pharmacotherapy.',
    },
  ]);

  const handleExport = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/clinical/llm/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataset_filename: 'final_anonymized_dataset.csv',
          format_type: format,
          preset_task: task,
        }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        setExportInfo(data.export_info);
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setLoading(false);
    }
  }, [format, task]);

  const FormatDescription = ({ format }) => {
    const descriptions = {
      huggingface: {
        name: 'HuggingFace JSONL',
        desc: 'Load via datasets.load_dataset("json", data_files="file.jsonl")',
        models: 'gpt2, distilbert, roberta',
      },
      openai: {
        name: 'OpenAI Chat Format',
        desc: 'Upload to OpenAI API for fine-tuning with gpt-3.5-turbo or gpt-4',
        models: 'gpt-3.5-turbo, gpt-4',
      },
      alpaca: {
        name: 'Alpaca Instruction Format',
        desc: 'Use with LLaMA, Alpaca, or any instruction-tuned model',
        models: 'LLaMA 2, Alpaca, Mistral',
      },
      plain_text: {
        name: 'Plain Text',
        desc: 'Raw text format for custom preprocessing',
        models: 'Any',
      },
    };
    const info = descriptions[format];
    return (
      <div style={{
        background: '#F9FAFB',
        border: `1px solid ${COLORS.gray}`,
        borderRadius: '6px',
        padding: '10px',
        fontSize: '12px',
      }}>
        <div style={{ fontWeight: '600', color: COLORS.purple, marginBottom: '4px' }}>
          {info.name}
        </div>
        <div style={{ color: COLORS.gray, marginBottom: '4px', fontFamily: 'Space Mono, monospace', fontSize: '11px' }}>
          {info.desc}
        </div>
        <div style={{ color: COLORS.gray }}>
          <strong>Models:</strong> {info.models}
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: COLORS.purple, margin: '0 0 10px 0' }}>
          🤖 LLM Fine-Tuning Data Exporter
        </h1>
        <p style={{ color: COLORS.gray, margin: '0', fontSize: '14px' }}>
          Export anonymized medical records as fine-tuning datasets for language models. Multiple formats supported.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {/* Configuration Panel */}
        <div style={{
          background: 'white',
          border: `2px solid ${COLORS.purple}`,
          borderRadius: '12px',
          padding: '20px',
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: COLORS.purple, margin: '0 0 20px 0' }}>
            Export Configuration
          </h2>

          {/* Format Selector */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: COLORS.gray }}>
              Export Format
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: `1px solid ${COLORS.gray}`,
                borderRadius: '6px',
                fontSize: '13px',
                fontFamily: 'inherit',
              }}
            >
              <option value="huggingface">HuggingFace JSONL</option>
              <option value="openai">OpenAI Chat Format</option>
              <option value="alpaca">Alpaca Instruction Format</option>
              <option value="plain_text">Plain Text</option>
            </select>
            <div style={{ marginTop: '10px' }}>
              <FormatDescription format={format} />
            </div>
          </div>

          {/* Task Selector */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: COLORS.gray }}>
              Preset Task
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[
                { value: 'diagnosis_prediction', label: 'Diagnosis Prediction' },
                { value: 'drug_recommendation', label: 'Drug Recommendation' },
                { value: 'summarization', label: 'Clinical Summarization' },
                { value: 'pii_deidentification', label: 'PII De-identification' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTask(option.value)}
                  style={{
                    padding: '10px',
                    border: `2px solid ${task === option.value ? COLORS.cyan : COLORS.gray}`,
                    background: task === option.value ? COLORS.cyan : 'white',
                    color: task === option.value ? 'white' : COLORS.gray,
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p style={{ fontSize: '11px', color: COLORS.gray, marginTop: '8px', margin: '8px 0 0 0' }}>
              {task === 'diagnosis_prediction' && '📋 Predict diagnosis from patient vitals'}
              {task === 'drug_recommendation' && '💊 Recommend medications for diagnosed condition'}
              {task === 'summarization' && '📄 Summarize clinical notes and assessments'}
              {task === 'pii_deidentification' && '🔒 De-identify clinical text by removing PII'}
            </p>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: COLORS.green,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '14px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? '⏳ Generating Export...' : '✓ Generate & Export'}
          </button>

          {/* Privacy Statement */}
          <div style={{
            background: '#F0FDF4',
            border: `1px solid ${COLORS.green}`,
            borderRadius: '6px',
            padding: '12px',
            marginTop: '15px',
            fontSize: '12px',
            color: COLORS.green,
            fontWeight: '500',
          }}>
            🔒 All exported data is fully anonymized. Zero PII exposure in output files.
          </div>
        </div>

        {/* Preview & Results */}
        <div>
          {/* Sample Training Pairs */}
          <div style={{
            background: 'white',
            border: `1px solid ${COLORS.gray}`,
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px',
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 15px 0', color: COLORS.purple }}>
              📋 Sample Training Pairs
            </h3>
            <div style={{
              display: 'grid',
              gap: '12px',
            }}>
              {samplePairs.map((pair, idx) => (
                <div
                  key={idx}
                  style={{
                    background: '#F9FAFB',
                    borderRadius: '6px',
                    padding: '12px',
                    fontSize: '11px',
                  }}
                >
                  <div style={{ marginBottom: '6px' }}>
                    <span style={{ fontWeight: '600', color: COLORS.purple }}>Instruction:</span>{' '}
                    <span style={{ color: COLORS.gray, fontFamily: 'Space Mono, monospace' }}>
                      {pair.instruction}
                    </span>
                  </div>
                  <div style={{ marginBottom: '6px' }}>
                    <span style={{ fontWeight: '600', color: COLORS.cyan }}>Input:</span>{' '}
                    <span style={{ color: COLORS.gray, fontFamily: 'Space Mono, monospace', wordBreak: 'break-word' }}>
                      {pair.input_text}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontWeight: '600', color: COLORS.green }}>Output:</span>{' '}
                    <span style={{ color: COLORS.gray, fontFamily: 'Space Mono, monospace', wordBreak: 'break-word' }}>
                      {pair.output_text}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{
              background: '#EFF6FF',
              borderRadius: '6px',
              padding: '10px',
              marginTop: '12px',
              fontSize: '11px',
              color: COLORS.gray,
            }}>
              Showing 3 sample pairs. Full export will contain 1000+ training examples.
            </div>
          </div>

          {/* Export Results */}
          {exportInfo && (
            <div style={{
              background: '#F0FDF4',
              border: `2px solid ${COLORS.green}`,
              borderRadius: '8px',
              padding: '20px',
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 15px 0', color: COLORS.green }}>
                ✓ Export Successful
              </h3>

              {/* Stats Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '15px',
              }}>
                <div style={{
                  background: 'white',
                  borderRadius: '6px',
                  padding: '10px',
                }}>
                  <div style={{ fontSize: '11px', color: COLORS.gray, marginBottom: '4px' }}>Total Pairs</div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: COLORS.green }}>
                    {exportInfo.total_pairs}
                  </div>
                </div>
                <div style={{
                  background: 'white',
                  borderRadius: '6px',
                  padding: '10px',
                }}>
                  <div style={{ fontSize: '11px', color: COLORS.gray, marginBottom: '4px' }}>Est. Tokens</div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: COLORS.green }}>
                    {(exportInfo.estimated_tokens / 1000).toFixed(1)}K
                  </div>
                </div>
              </div>

              {/* Metadata */}
              {exportInfo.metadata && (
                <div style={{
                  background: 'white',
                  borderRadius: '6px',
                  padding: '10px',
                  marginBottom: '15px',
                  fontSize: '11px',
                }}>
                  <div style={{ fontWeight: '600', marginBottom: '6px', color: COLORS.gray }}>Dataset Metadata</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {Object.entries(exportInfo.metadata).map(([key, value]) => (
                      <div key={key}>
                        <span style={{ color: COLORS.gray, fontWeight: '500' }}>{key}:</span>{' '}
                        <span style={{ color: COLORS.purple, fontWeight: '600' }}>
                          {typeof value === 'number' ? value.toFixed(1) : value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Download Button */}
              <a
                href={`${exportInfo.download_url}`}
                download
                style={{
                  display: 'block',
                  padding: '12px',
                  background: COLORS.green,
                  color: 'white',
                  textAlign: 'center',
                  borderRadius: '6px',
                  fontWeight: '600',
                  fontSize: '13px',
                  textDecoration: 'none',
                }}
              >
                ⬇️ Download {exportInfo.filename}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Supported Models Info */}
      <div style={{
        background: '#F9FAFB',
        border: `1px solid ${COLORS.gray}`,
        borderRadius: '8px',
        padding: '15px',
        marginTop: '30px',
      }}>
        <h3 style={{ fontSize: '13px', fontWeight: '600', margin: '0 0 12px 0', color: COLORS.purple }}>
          🤖 Recommended Models by Format
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', fontSize: '12px' }}>
          <div>
            <strong style={{ color: COLORS.purple }}>HuggingFace</strong>
            <ul style={{ margin: '6px 0 0 0', paddingLeft: '20px', color: COLORS.gray }}>
              <li>DistilBERT</li>
              <li>RoBERTa</li>
              <li>GPT-2</li>
            </ul>
          </div>
          <div>
            <strong style={{ color: COLORS.purple }}>OpenAI</strong>
            <ul style={{ margin: '6px 0 0 0', paddingLeft: '20px', color: COLORS.gray }}>
              <li>gpt-3.5-turbo</li>
              <li>gpt-4</li>
            </ul>
          </div>
          <div>
            <strong style={{ color: COLORS.purple }}>Open Source</strong>
            <ul style={{ margin: '6px 0 0 0', paddingLeft: '20px', color: COLORS.gray }}>
              <li>LLaMA 2</li>
              <li>Mistral</li>
              <li>Alpaca</li>
            </ul>
          </div>
          <div>
            <strong style={{ color: COLORS.purple }}>Custom</strong>
            <ul style={{ margin: '6px 0 0 0', paddingLeft: '20px', color: COLORS.gray }}>
              <li>Any text model</li>
              <li>Custom architectures</li>
            </ul>
          </div>
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
        <strong>📖 How it works:</strong> Select export format (HuggingFace, OpenAI, Alpaca, or plain text),
        choose a preset clinical task (diagnosis prediction, drug recommendation, summarization, PII de-identification),
        and download the training dataset. All data is fully anonymized. Estimated token count helps you budget compute costs.
      </div>
    </div>
  );
}
