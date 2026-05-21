/**
 * useMedShield.js — Central API client for all 8 Clinical AI sections.
 * Uses RELATIVE URLs so requests go through the Next.js proxy on both
 * localhost AND production (Render).
 */

async function apiFetch(path, opts = {}) {
  // ALWAYS use relative URL — the Next.js proxy at /api/[...slug]/route.js
  // will forward to the Python backend at 127.0.0.1:8003 inside the container.
  const url = `/api/sections${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `API error ${res.status}`);
  }
  return res.json();
}

// ── Section 1: Diagnostic AI ─────────────────────────────
export async function predictDiagnosis({ age, blood_sugar, systolic_bp, heart_rate, gender }) {
  return apiFetch("/diagnostic/predict", {
    method: "POST",
    body: JSON.stringify({ age, blood_sugar, systolic_bp, heart_rate, gender }),
  });
}

// ── Section 2: Drug Intelligence ─────────────────────────
export async function searchDrug(q) {
  return apiFetch(`/drug-intel/search?q=${encodeURIComponent(q)}`);
}
export async function getDrugDetail(term, kind = "diagnosis") {
  return apiFetch(`/drug-intel/detail?term=${encodeURIComponent(term)}&kind=${kind}`);
}

// ── Section 3: Re-ID Simulator ───────────────────────────
export async function simulateReID({ adversary, age_group, gender, blood_group, diagnosis }) {
  return apiFetch("/reid/simulate", {
    method: "POST",
    body: JSON.stringify({ adversary, age_group, gender, blood_group, diagnosis }),
  });
}

// ── Section 4: OCR Lab ───────────────────────────────────
export async function getSyntheticPrescription(idx = 0) {
  return apiFetch(`/ocr/synthetic?idx=${idx}`);
}

// ── Section 5: Population Health ─────────────────────────
export async function getPopulationAnalytics() {
  return apiFetch("/population/analytics");
}

// ── Section 6: LLM Exporter ──────────────────────────────
export async function generateExport({ task_type, export_format, record_count }) {
  return apiFetch("/llm-export/generate", {
    method: "POST",
    body: JSON.stringify({ task_type, export_format, record_count }),
  });
}

// ── Section 7: Explainability ─────────────────────────────
export async function getKAnonDemo(k = 5) {
  return apiFetch(`/explainability/kanon?k=${k}`);
}
export async function getDPDemo(epsilon = 1.0) {
  return apiFetch(`/explainability/dp?epsilon=${epsilon}`);
}
export async function getChaosDemo(lam = 3.99) {
  return apiFetch(`/explainability/chaos?lam=${lam}`);
}
export async function getAlgoScatter() {
  return apiFetch("/explainability/scatter");
}

// ── Section 8: DPDP Auditor ───────────────────────────────
export async function runDPDPAudit(filename = null) {
  return apiFetch("/dpdp/audit", {
    method: "POST",
    body: JSON.stringify({ filename }),
  });
}
