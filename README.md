# 🛡️ MedShield — Medical Data Anonymization Toolkit

> **IIM Mumbai Research Project** — DPDP Act 2023 Compliant  
> Comparative Study of Anonymization Algorithms for Multi-Modal Medical Health Data

![Python](https://img.shields.io/badge/Python-3.12-blue)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100-green)
![License](https://img.shields.io/badge/License-Research-orange)

### 🌐 [Live Production Deployment: MedShield Platform](https://iim-mumbai-1.onrender.com/)

---

## 🚀 Quick Start

```bash
# 1. Install Python dependencies
pip install -r requirements.txt

# 2. Install frontend dependencies
cd frontend && npm install && cd ..

# 3. Start the platform (two terminals)
python backend_api.py          # Terminal 1: API on http://localhost:8001
cd frontend && npm run dev     # Terminal 2: UI on http://localhost:3000
```

**Or simply double-click `start_medshield.bat`**

🌐 Open **http://localhost:3000** — everything is merged under one URL.

---

## 📁 Project Structure

```
IIM MUMBAI/
├── medshield/                    # Core Python package
│   ├── algorithms/               # 7 anonymization algorithms + 2 image algorithms
│   │   ├── base.py               # BaseAnonymizer abstract class + AnonymizationResult
│   │   ├── k_anonymity.py        # k-Anonymity (generalization & suppression)
│   │   ├── l_diversity.py        # ℓ-Diversity (distinct, entropy, recursive variants)
│   │   ├── t_closeness.py        # t-Closeness (EMD + KL divergence)
│   │   ├── differential_privacy.py # Differential Privacy (Laplace + Gaussian)
│   │   ├── chaos_perturbation.py # Chaos Perturbation (logistic map)
│   │   ├── pseudonymization.py   # Pseudonymization (SHA-256, salted)
│   │   ├── pii_redaction.py      # PII Redaction (10+ regex patterns)
│   │   ├── image_anonymization.py # Face detection & redaction (MediaPipe)
│   │   └── ocr_redaction.py      # X-ray text redaction (Tesseract OCR)
│   ├── data/
│   │   └── loader.py             # SyntheticGenerator + CSV loader
│   └── evaluation/
│       ├── metrics.py            # PrivacyMetrics (5 standardized scores)
│       ├── benchmark.py          # Comparative benchmarking engine
│       └── visualizer.py         # Plotly charts for tradeoff analysis
├── frontend/                     # Next.js 14 web application
│   ├── app/
│   │   ├── page.tsx              # Landing page (hero, features, team)
│   │   ├── layout.tsx            # Root layout
│   │   ├── sign-in/              # Email/password login
│   │   ├── sign-up/              # Registration with institution selector
│   │   ├── auth/                 # Login/logout API routes (cookie-based)
│   │   └── dashboard/
│   │       ├── page.tsx          # Dashboard home (stats, quick actions)
│   │       ├── layout.tsx        # Sidebar + header layout
│   │       ├── anonymize/        # 4-step anonymization wizard
│   │       ├── benchmark/        # Full comparative benchmark (live API)
│   │       ├── datasets/         # Generate, upload, manage datasets
│   │       ├── compliance/       # DPDP compliance scanner
│   │       └── settings/         # User preferences
│   ├── middleware.ts             # Route protection (cookie-based auth)
│   ├── globals.css               # Dark glassmorphism design system
│   ├── tailwind.config.js        # Custom theme (Inter + Outfit fonts)
│   └── next.config.js            # API proxy to FastAPI backend
├── backend_api.py                # FastAPI server (bridges Python → frontend)
├── app.py                        # Streamlit dashboard (standalone)
├── run_benchmark.py              # CLI benchmark runner
├── tests/test_algorithms.py      # Pytest suite
├── requirements.txt              # Python dependencies
└── start_medshield.bat           # One-click launcher (Windows)
```

---

## 🔐 Algorithms

| # | Algorithm | Type | Key Parameter | Description |
|---|-----------|------|---------------|-------------|
| 1 | **k-Anonymity** | Syntactic | k = 2–20 | Generalization & suppression |
| 2 | **ℓ-Diversity** | Syntactic | ℓ = 2–10 | 3 variants: distinct, entropy, recursive |
| 3 | **t-Closeness** | Syntactic | t = 0.1–1.0 | EMD + KL divergence enforcement |
| 4 | **Differential Privacy** | Semantic | ε = 0.1–5.0 | Laplace + Gaussian noise mechanisms |
| 5 | **Chaos Perturbation** | Novel | λ = 3.5–4.0 | Logistic map chaotic function |
| 6 | **Pseudonymization** | Operational | SHA-256 | Salted hash-based replacement |
| 7 | **PII Redaction** | Operational | 10+ patterns | Regex-based text anonymization |

---

## 📊 Evaluation Metrics

| Metric | Range | Meaning |
|--------|-------|---------|
| **Privacy Score** | 0–1 | Higher = more private |
| **Utility Score** | 0–1 | Higher = more useful for analysis |
| **Disclosure Risk** | 0–1 | Lower = safer against re-identification |
| **Information Loss** | 0–1 | Lower = better data preservation |
| **Processing Time** | ms | Wall-clock execution time |

---

## 🌐 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Health check |
| POST | `/api/generate` | Generate synthetic medical/text data |
| POST | `/api/upload` | Upload CSV dataset |
| POST | `/api/anonymize` | Run single algorithm |
| POST | `/api/benchmark` | Run all 8 configurations |
| GET | `/api/files` | List saved datasets |
| GET | `/api/download/{filename}` | Download CSV result |

---

## 🇮🇳 DPDP Act 2023 Compliance

- ✅ No direct identifiers in output
- ✅ Data minimization (only necessary columns processed)
- ✅ Purpose limitation (research/clinical only)
- ✅ Irreversibility (SHA-256, Laplace noise, chaos)
- ✅ Audit trail (timestamps, parameters logged)
- ✅ Re-identification resistance (layered k + ℓ + t)

---

## 👥 Research Team

| Name | Institution | Focus |
|------|-------------|-------|
| Nischal | IIT Bombay | Healthcare & k-Anonymity |
| Soham | IIT Delhi | Architecture & Framework |
| Brajesh | NIT Rourkela | Hybrid Algorithms |
| Saugata | IIT Kharagpur | Image & Datasets |

**Supervised by IIM Mumbai**

---

## 📚 References

- Sweeney L. (2002) "k-Anonymity: A Model for Protecting Privacy"
- Machanavajjhala A. et al. (2007) "ℓ-Diversity"
- Li N. et al. (2007) "t-Closeness: Privacy Beyond k-Anonymity and ℓ-Diversity"
- Dwork C. (2006) "Differential Privacy"
- Digital Personal Data Protection Act, 2023 (India)
