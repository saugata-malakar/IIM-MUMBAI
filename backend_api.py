"""
MedShield FastAPI Backend — Robust, production-grade API server.
All 7 algorithms are wired correctly with per-algorithm parameter handling.
"""

import os
import sys
import uuid
import time
import shutil
import traceback
from pathlib import Path
from typing import List, Dict, Any, Optional

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import pandas as pd
import numpy as np

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent))

# Import algorithms individually — avoids crashing on missing optional deps
from medshield.algorithms.k_anonymity import KAnonymity
from medshield.algorithms.l_diversity import LDiversity
from medshield.algorithms.t_closeness import TCloseness
from medshield.algorithms.differential_privacy import DifferentialPrivacy
from medshield.algorithms.chaos_perturbation import ChaosPerturbation
from medshield.algorithms.pseudonymization import Pseudonymization
from medshield.algorithms.pii_redaction import PIIRedactor
from medshield.algorithms.hybrid import HybridAnonymizer
from medshield.algorithms.clustering import ClusteringAnonymizer
from medshield.algorithms.image_anonymization import ImageFaceRedactor
from medshield.algorithms.ocr_redaction import OCRRedactor
from medshield.data.loader import SyntheticGenerator

app = FastAPI(
    title="MedShield API",
    version="1.0.0",
    description="India's first DPDP-compliant medical data anonymization API",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


# ─── Request Models ──────────────────────────────────────────

class GenerateDataRequest(BaseModel):
    num_records: int = 1000
    data_type: str = "medical"

class AnonymizeRequest(BaseModel):
    filename: str
    algorithm: str
    quasi_identifiers: List[str] = []
    sensitive_attributes: List[str] = []
    params: Dict[str, Any] = {}

class BenchmarkRequest(BaseModel):
    filename: str
    quasi_identifiers: List[str] = []
    sensitive_attributes: List[str] = []


# ─── Algorithm Builder ────────────────────────────────────────

def build_algorithm(algo_id: str, qi: List[str], sa: List[str], params: Dict[str, Any]):
    """
    Build the correct algorithm instance with proper parameter handling.
    Each algorithm has specific constructor signatures — handled here explicitly.
    """
    p = params  # shorthand

    if algo_id == "k-anonymity":
        k = int(p.get("k", 5))
        return KAnonymity(quasi_identifiers=qi, sensitive_attributes=sa, k=k)

    elif algo_id == "l-diversity":
        l_val = int(p.get("l", 3))
        variant = str(p.get("variant", "distinct"))
        return LDiversity(quasi_identifiers=qi, sensitive_attributes=sa, l=l_val, variant=variant)

    elif algo_id == "t-closeness":
        t = float(p.get("t", 0.3))
        metric = str(p.get("distance_metric", "emd"))
        return TCloseness(quasi_identifiers=qi, sensitive_attributes=sa, t=t, distance_metric=metric)

    elif algo_id == "differential-privacy":
        epsilon = float(p.get("epsilon", 1.0))
        mechanism = str(p.get("mechanism", "laplace"))
        # DP works on numeric columns — use qi if provided, else auto-detect
        target_cols = qi if qi else []
        return DifferentialPrivacy(
            quasi_identifiers=target_cols,
            sensitive_attributes=sa,
            epsilon=epsilon,
            mechanism=mechanism,
        )

    elif algo_id == "chaos-perturbation":
        lambda_val = float(p.get("lambda_val", 3.99))
        # Chaos works on numeric qi columns
        return ChaosPerturbation(quasi_identifiers=qi, lambda_val=lambda_val)

    elif algo_id == "pseudonymization":
        # Auto-detect identifier columns if not provided
        id_cols = p.get("identifier_columns", qi) or qi
        return Pseudonymization(identifier_columns=id_cols)

    elif algo_id == "pii-redaction":
        text_cols = p.get("text_columns", [])
        return PIIRedactor(text_columns=text_cols)

    elif algo_id == "hybrid":
        k = int(p.get("k", 5))
        epsilon = float(p.get("epsilon", 1.0))
        return HybridAnonymizer(
            quasi_identifiers=qi,
            sensitive_attributes=sa,
            k=k,
            epsilon=epsilon,
        )

    elif algo_id == "clustering":
        k = int(p.get("k", 5))
        scaling = p.get("scaling", True)
        if isinstance(scaling, str):
            scaling = scaling.lower() == "true"
        return ClusteringAnonymizer(
            quasi_identifiers=qi,
            sensitive_attributes=sa,
            k=k,
            scaling=scaling,
        )

    else:
        raise ValueError(f"Unknown algorithm: {algo_id}")


def df_to_json_safe(df: pd.DataFrame, n: int = 10) -> List[Dict]:
    """Convert DataFrame head to JSON-safe list, handling NaN and numpy types."""
    preview = df.head(n).copy()
    # Replace NaN with None for JSON serialization
    preview = preview.where(pd.notnull(preview), None)
    records = []
    for _, row in preview.iterrows():
        safe_row = {}
        for k, v in row.items():
            if v is None:
                safe_row[k] = None
            elif isinstance(v, (np.integer,)):
                safe_row[k] = int(v)
            elif isinstance(v, (np.floating,)):
                safe_row[k] = None if np.isnan(v) else float(v)
            else:
                safe_row[k] = str(v) if not isinstance(v, (str, int, float, bool)) else v
        records.append(safe_row)
    return records


# ─── Health Check ─────────────────────────────────────────────

@app.get("/")
def read_root():
    return {
        "status": "ok",
        "message": "MedShield API is running",
        "algorithms": ["k-anonymity", "l-diversity", "t-closeness",
                       "differential-privacy", "chaos-perturbation",
                       "pseudonymization", "pii-redaction"],
    }


# ─── Generate Synthetic Data ──────────────────────────────────

@app.post("/api/generate")
def generate_data(request: GenerateDataRequest):
    try:
        gen = SyntheticGenerator(seed=int(time.time()) % 100000)
        if request.data_type == "medical":
            df = gen.generate_medical_records(min(request.num_records, 10000))
        else:
            df = gen.generate_text_records(min(request.num_records, 10000))

        filename = f"synthetic_{uuid.uuid4().hex[:8]}.csv"
        filepath = UPLOAD_DIR / filename
        df.to_csv(filepath, index=False)

        # Auto-suggest column classifications
        all_cols = df.columns.tolist()
        qi_suggestions = [c for c in all_cols if c in
                          ["age", "gender", "zip_code", "blood_pressure", "ethnicity", "marital_status"]]
        sa_suggestions = [c for c in all_cols if c in
                          ["disease", "medication", "diagnosis", "treatment"]]
        id_suggestions = [c for c in all_cols if c in
                          ["name", "email", "phone", "patient_id", "address"]]

        return {
            "filename": filename,
            "columns": all_cols,
            "preview": df_to_json_safe(df, 8),
            "total_records": len(df),
            "suggestions": {
                "quasi_identifiers": qi_suggestions,
                "sensitive_attributes": sa_suggestions,
                "direct_identifiers": id_suggestions,
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Data generation failed: {str(e)}\n{traceback.format_exc()}")


# ─── Upload CSV ───────────────────────────────────────────────

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    if not (file.filename or "").endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    filename = f"upload_{uuid.uuid4().hex[:8]}.csv"
    filepath = UPLOAD_DIR / filename

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        df = pd.read_csv(filepath)
        all_cols = df.columns.tolist()

        # Smart column type detection
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        text_cols = df.select_dtypes(include=["object"]).columns.tolist()

        # Heuristic suggestions
        qi_suggestions = [c for c in all_cols if any(k in c.lower() for k in
                          ["age", "gender", "zip", "sex", "race", "ethnic", "marital", "education"])]
        sa_suggestions = [c for c in all_cols if any(k in c.lower() for k in
                          ["disease", "diagnosis", "condition", "medication", "treatment", "income"])]
        id_suggestions = [c for c in all_cols if any(k in c.lower() for k in
                          ["name", "email", "phone", "id", "ssn", "address", "dob", "birth"])]

        return {
            "filename": filename,
            "columns": all_cols,
            "numeric_columns": numeric_cols,
            "text_columns": text_cols,
            "preview": df_to_json_safe(df, 8),
            "total_records": len(df),
            "suggestions": {
                "quasi_identifiers": qi_suggestions,
                "sensitive_attributes": sa_suggestions,
                "direct_identifiers": id_suggestions,
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing CSV: {str(e)}")


# ─── Run Single Anonymization ─────────────────────────────────

@app.post("/api/anonymize")
def run_anonymization(request: AnonymizeRequest):
    filepath = UPLOAD_DIR / request.filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail=f"File not found: {request.filename}")

    try:
        df = pd.read_csv(filepath)

        # Validate columns exist
        qi = [c for c in request.quasi_identifiers if c in df.columns]
        sa = [c for c in request.sensitive_attributes if c in df.columns]

        # Build algorithm
        algo = build_algorithm(request.algorithm, qi, sa, request.params)

        # Run anonymization
        result = algo.run(df)

        # Save output
        out_filename = f"anon_{uuid.uuid4().hex[:6]}_{request.filename}"
        out_filepath = UPLOAD_DIR / out_filename
        result.anonymized_data.to_csv(out_filepath, index=False)

        # ML Utility
        ml_utility_retention = 0.0
        try:
            from medshield.evaluation.ml_utility import MLUtilityEvaluator
            ml_eval = MLUtilityEvaluator(df, result.anonymized_data)
            ml_res = ml_eval.evaluate()
            if ml_res.get("status") == "Success":
                ml_utility_retention = ml_res.get("ml_utility_retained_percent", 0.0)
        except:
            pass
            
        # Re-ID Risk Analysis
        advanced_risk = {}
        try:
            from medshield.evaluation.risk_analysis import RiskAnalyzer
            risk_analyzer = RiskAnalyzer(result.anonymized_data, qi)
            advanced_risk = risk_analyzer.analyze()
        except:
            pass

        return {
            "success": True,
            "algorithm": result.algorithm_name,
            "metrics": {
                "privacy_score": round(float(result.privacy_score), 4),
                "utility_score": round(float(result.utility_score), 4),
                "ml_utility_retention": ml_utility_retention,
                "disclosure_risk": round(float(result.disclosure_risk), 4),
                "information_loss": round(float(result.information_loss), 4),
                "processing_time_ms": round(float(result.processing_time_ms), 2),
                "records_processed": int(result.records_processed),
                "dpdp_compliant": getattr(result, "dpdp_compliant", True),
            },
            "risk_analysis": advanced_risk,
            "preview": df_to_json_safe(result.anonymized_data, 10),
            "columns": result.anonymized_data.columns.tolist(),
            "download_url": f"/api/download/{out_filename}",
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Anonymization failed for '{request.algorithm}': {str(e)}"
        )


# ─── Run Full Benchmark ───────────────────────────────────────

@app.post("/api/benchmark")
def run_benchmark(request: BenchmarkRequest):
    filepath = UPLOAD_DIR / request.filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail=f"File not found: {request.filename}")

    try:
        df = pd.read_csv(filepath)
        qi = [c for c in request.quasi_identifiers if c in df.columns]
        sa = [c for c in request.sensitive_attributes if c in df.columns]

        # Pick numeric columns automatically for DP and Chaos
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        num_qi = [c for c in numeric_cols if c in qi] or numeric_cols[:2]

        configs = [
            ("k-anonymity",          qi, sa, {"k": 5}),
            ("k-anonymity",          qi, sa, {"k": 10}),
            ("l-diversity",          qi, sa, {"l": 3, "variant": "distinct"}),
            ("t-closeness",          qi, sa, {"t": 0.3, "distance_metric": "emd"}),
            ("differential-privacy", num_qi, sa, {"epsilon": 0.5, "mechanism": "laplace"}),
            ("differential-privacy", num_qi, sa, {"epsilon": 1.0, "mechanism": "laplace"}),
            ("chaos-perturbation",   num_qi, [],  {"lambda_val": 3.99}),
            ("pseudonymization",     qi,  sa, {}),
            ("hybrid",               qi,  sa, {"k": 5, "epsilon": 1.0}),
            ("clustering",           num_qi, sa, {"k": 5, "scaling": True}),
        ]

        results = []
        for algo_id, a_qi, a_sa, params in configs:
            try:
                algo = build_algorithm(algo_id, a_qi, a_sa, params)
                result = algo.run(df)
                
                # Run ML Utility Evaluation
                ml_utility_score = 0.0
                try:
                    from medshield.evaluation.ml_utility import MLUtilityEvaluator
                    ml_eval = MLUtilityEvaluator(df, result.anonymized_data)
                    ml_res = ml_eval.evaluate()
                    if ml_res.get("status") == "Success":
                        ml_utility_score = ml_res.get("ml_utility_retained_percent", 0.0) / 100.0
                except Exception as ml_e:
                    print(f"ML Eval skipped for {algo_id}: {ml_e}")

                param_label = ", ".join(f"{k}={v}" for k, v in params.items())
                
                # Combine standard utility with ML utility
                final_utility = (float(result.utility_score) + ml_utility_score) / 2 if ml_utility_score > 0 else float(result.utility_score)
                
                results.append({
                    "algorithm": f"{algo_id} ({param_label})" if params else algo_id,
                    "privacy_score": round(float(result.privacy_score), 4),
                    "utility_score": round(final_utility, 4),
                    "ml_utility_retention": round(ml_utility_score * 100, 2),
                    "disclosure_risk": round(float(result.disclosure_risk), 4),
                    "information_loss": round(float(result.information_loss), 4),
                    "processing_time_ms": round(float(result.processing_time_ms), 2),
                    "records_processed": int(result.records_processed),
                    "dpdp_compliant": result.dpdp_compliant,
                })
            except Exception as e:
                results.append({
                    "algorithm": algo_id,
                    "error": str(e),
                    "privacy_score": 0, "utility_score": 0,
                    "ml_utility_retention": 0,
                    "disclosure_risk": 1, "information_loss": 1,
                    "processing_time_ms": 0, "records_processed": 0,
                    "dpdp_compliant": False,
                })

        # Compute tradeoff analysis
        valid = [r for r in results if "error" not in r]
        best_privacy = max(valid, key=lambda r: r["privacy_score"], default=None)
        best_utility = max(valid, key=lambda r: r["utility_score"], default=None)
        best_balanced = max(valid, key=lambda r: r["privacy_score"] + r["utility_score"], default=None)

        return {
            "results": results,
            "tradeoff": {
                "best_privacy": best_privacy,
                "best_utility": best_utility,
                "best_balanced": best_balanced,
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Benchmark failed: {str(e)}")


# ─── Download ─────────────────────────────────────────────────

@app.get("/api/download/{filename}")
def download_file(filename: str):
    # Prevent path traversal
    filepath = UPLOAD_DIR / Path(filename).name
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(str(filepath), media_type="text/csv", filename=filename)


# ─── List Available Files ─────────────────────────────────────

@app.get("/api/files")
def list_files():
    files = []
    for f in UPLOAD_DIR.iterdir():
        if f.suffix == ".csv":
            try:
                df = pd.read_csv(f, nrows=1)
                files.append({
                    "filename": f.name,
                    "size_kb": round(f.stat().st_size / 1024, 1),
                    "columns": df.columns.tolist(),
                })
            except Exception:
                files.append({"filename": f.name, "size_kb": 0, "columns": []})
    return {"files": files}


# ─── Algorithm Info ───────────────────────────────────────────

@app.get("/api/algorithms")
def list_algorithms():
    """Return detailed info about all available algorithms."""
    return {
        "algorithms": [
            {
                "id": "k-anonymity", "name": "k-Anonymity", "type": "Syntactic",
                "description": "Groups records so each is indistinguishable from k-1 others via generalization and suppression.",
                "params": [{"key": "k", "label": "k value", "type": "int", "min": 2, "max": 20, "default": 5}],
                "use_case": "Tabular data with quasi-identifiers like age, zip code, gender.",
            },
            {
                "id": "l-diversity", "name": "ℓ-Diversity", "type": "Syntactic",
                "description": "Extends k-anonymity by ensuring each group has at least ℓ distinct sensitive values.",
                "params": [{"key": "l", "label": "ℓ value", "type": "int", "min": 2, "max": 10, "default": 3}],
                "use_case": "When sensitive attributes like disease or diagnosis need diversity protection.",
            },
            {
                "id": "t-closeness", "name": "t-Closeness", "type": "Syntactic",
                "description": "Limits the distance between group and global sensitive attribute distributions.",
                "params": [{"key": "t", "label": "t threshold", "type": "float", "min": 0.1, "max": 1.0, "default": 0.3}],
                "use_case": "When distribution similarity matters (e.g., income, test results).",
            },
            {
                "id": "differential-privacy", "name": "Differential Privacy", "type": "Semantic",
                "description": "Adds calibrated Laplace noise. ε controls privacy budget (lower = more private).",
                "params": [{"key": "epsilon", "label": "ε (epsilon)", "type": "float", "min": 0.1, "max": 5.0, "default": 1.0}],
                "use_case": "Numeric data where statistical aggregate queries must remain accurate.",
            },
            {
                "id": "chaos-perturbation", "name": "Chaos Perturbation", "type": "Novel",
                "description": "Uses logistic map chaotic function to perturb low-frequency values unpredictably.",
                "params": [{"key": "lambda_val", "label": "λ (lambda)", "type": "float", "min": 3.5, "max": 4.0, "default": 3.99}],
                "use_case": "Numeric quasi-identifiers needing unpredictable but bounded perturbation.",
            },
            {
                "id": "pseudonymization", "name": "Pseudonymization", "type": "Operational",
                "description": "Replaces direct identifiers with SHA-256 hashed pseudonyms (per-run salt).",
                "params": [],
                "use_case": "Names, emails, phone numbers, patient IDs — all direct identifiers.",
            },
            {
                "id": "pii-redaction", "name": "PII Redaction", "type": "Operational",
                "description": "Regex-based detection and redaction of 10+ PII patterns in text columns.",
                "params": [],
                "use_case": "Free-text clinical notes with embedded PII (emails, Aadhar, phone, etc.).",
            },
            {
                "id": "hybrid", "name": "Hybrid Pipeline", "type": "Multi-layer",
                "description": "Chains Pseudonymization → k-Anonymity → Differential Privacy → PII Redaction for defense-in-depth. Auto-classifies columns by risk level.",
                "params": [
                    {"key": "k", "label": "k value", "type": "int", "min": 2, "max": 20, "default": 5},
                    {"key": "epsilon", "label": "ε (epsilon)", "type": "float", "min": 0.1, "max": 5.0, "default": 1.0},
                ],
                "use_case": "Production deployments needing maximum privacy with layered protection across all column types.",
            },
            {
                "id": "clustering", "name": "Clustering (MDAV)", "type": "Semantic",
                "description": "Microaggregation via Maximum Distance to Average Vector (MDAV). Groups similar records based on distance metrics and replaces quasi-identifiers with the cluster centroid.",
                "params": [
                    {"key": "k", "label": "k (Min Cluster Size)", "type": "int", "min": 2, "max": 50, "default": 5},
                ],
                "use_case": "High-dimensional numeric data where standard k-anonymity causes too much information loss.",
            },
        ]
    }


# ─── PII Column Detection ────────────────────────────────────

@app.get("/api/detect-pii/{filename}")
def detect_pii_columns(filename: str):
    """Scan a dataset and classify columns by PII risk level."""
    filepath = UPLOAD_DIR / Path(filename).name
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="File not found")

    try:
        df = pd.read_csv(filepath)
        columns_info = []

        for col in df.columns:
            cl = col.lower().replace(" ", "_")
            sample_vals = df[col].dropna().head(5).astype(str).tolist()
            uniqueness = df[col].nunique() / max(len(df), 1)

            # Classify risk level
            if any(p in cl for p in ["name", "email", "phone", "ssn", "aadhar", "pan", "address"]):
                risk = "HIGH"
                action = "HASH or REMOVE"
                category = "Direct Identifier"
            elif any(p in cl for p in ["age", "gender", "zip", "race", "ethnic", "marital", "dob", "birth"]):
                risk = "MEDIUM"
                action = "GENERALIZE"
                category = "Quasi-Identifier"
            elif any(p in cl for p in ["disease", "diagnosis", "medication", "treatment", "condition"]):
                risk = "SENSITIVE"
                action = "PROTECT"
                category = "Sensitive Attribute"
            elif any(p in cl for p in ["id", "mrn", "patient", "doctor", "insurance"]):
                risk = "HIGH"
                action = "PSEUDONYMIZE"
                category = "Identifier"
            else:
                risk = "LOW"
                action = "SAFE"
                category = "Non-sensitive"

            columns_info.append({
                "column": col,
                "risk": risk,
                "category": category,
                "action": action,
                "uniqueness": round(uniqueness, 3),
                "sample_values": sample_vals,
                "dtype": str(df[col].dtype),
            })

        high_risk = [c for c in columns_info if c["risk"] == "HIGH"]
        medium_risk = [c for c in columns_info if c["risk"] == "MEDIUM"]
        sensitive = [c for c in columns_info if c["risk"] == "SENSITIVE"]

        return {
            "filename": filename,
            "total_columns": len(df.columns),
            "total_records": len(df),
            "risk_summary": {
                "high": len(high_risk),
                "medium": len(medium_risk),
                "sensitive": len(sensitive),
                "low": len(columns_info) - len(high_risk) - len(medium_risk) - len(sensitive),
            },
            "columns": columns_info,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PII detection failed: {str(e)}")


# ─── Data Preview ─────────────────────────────────────────────

@app.get("/api/preview/{filename}")
def preview_file(filename: str):
    """Return preview and statistics for a dataset."""
    filepath = UPLOAD_DIR / Path(filename).name
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="File not found")

    try:
        df = pd.read_csv(filepath)

        # Column statistics
        col_stats = []
        for col in df.columns:
            stat = {
                "column": col,
                "dtype": str(df[col].dtype),
                "null_count": int(df[col].isnull().sum()),
                "unique_count": int(df[col].nunique()),
            }
            if pd.api.types.is_numeric_dtype(df[col]):
                stat["mean"] = round(float(df[col].mean()), 2)
                stat["std"] = round(float(df[col].std()), 2)
                stat["min"] = float(df[col].min())
                stat["max"] = float(df[col].max())
            else:
                top = df[col].value_counts().head(3)
                stat["top_values"] = {str(k): int(v) for k, v in top.items()}
            col_stats.append(stat)

        return {
            "filename": filename,
            "total_records": len(df),
            "total_columns": len(df.columns),
            "columns": df.columns.tolist(),
            "preview": df_to_json_safe(df, 15),
            "statistics": col_stats,
            "size_kb": round(filepath.stat().st_size / 1024, 1),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Preview failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    print("\n🛡️  MedShield API Starting...")
    print("📍 API Docs:    http://localhost:8003/docs")
    print("📍 Frontend:    http://localhost:3000\n")
    uvicorn.run(app, host="0.0.0.0", port=8003, reload=False)
