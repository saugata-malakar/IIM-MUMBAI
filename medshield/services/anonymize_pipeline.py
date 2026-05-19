"""
Complete 5-Step Anonymization Pipeline API Endpoints
Step 1: Generate/Upload Data
Step 2: Classify Columns  
Step 3: Select Algorithm
Step 4: Execute Anonymization
Step 5: View Results & Download
"""

import json
import uuid
import time
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, List, Any
from fastapi import HTTPException, File, UploadFile, Query
from pydantic import BaseModel

from medshield.data.loader import SyntheticGenerator
from medshield.services.column_classifier import ColumnClassifier
from medshield.services.algorithm_executor import AlgorithmExecutor
from medshield.evaluation.anonymization_evaluator import AnonymizationEvaluator


UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


# ─── Pydantic Models ─────────────────────────────────────────

class GenerateSyntheticRequest(BaseModel):
    """STEP 1: Generate synthetic medical data."""
    num_records: int = 1000
    data_type: str = "medical"  # medical, prescription, xray
    seed: int = None


class ClassifyColumnsRequest(BaseModel):
    """STEP 2: Auto-classify dataset columns."""
    filename: str
    allow_override: bool = True


class AnonymizeExecuteRequest(BaseModel):
    """STEP 3-4: Execute anonymization on dataset."""
    filename: str
    algorithm: str
    direct_identifiers: List[str] = []
    quasi_identifiers: List[str] = []
    sensitive_attributes: List[str] = []
    algorithm_params: Dict[str, Any] = {}


# ─── Pipeline Service Class ─────────────────────────────────

class AnonymizationPipelineService:
    """Unified service for the complete anonymization pipeline."""

    def __init__(self):
        self.classifier = ColumnClassifier()
        self.executor = AlgorithmExecutor()
        self.evaluator = AnonymizationEvaluator()
        self.gen = SyntheticGenerator(seed=42)

    def step1_generate_synthetic(self, num_records: int, data_type: str, seed: int = None) -> Dict:
        """
        STEP 1: Generate synthetic medical data.
        Returns filename and preview with auto-detected column classifications.
        """
        if seed is None:
            seed = int(time.time()) % 100000

        gen = SyntheticGenerator(seed=seed)
        num_records = min(num_records, 100000)  # Limit for safety

        try:
            if data_type == "prescription":
                df = gen.generate_text_records(num_records)
            elif data_type == "xray":
                df = gen.generate_xray_records(num_records)
            else:  # medical (default)
                df = gen.generate_medical_records(num_records)

            # Save to file
            filename = f"synthetic_{data_type}_{uuid.uuid4().hex[:8]}.csv"
            filepath = UPLOAD_DIR / filename
            df.to_csv(filepath, index=False)

            # Auto-classify columns
            classification = self.classifier.classify_dataset(df)

            # Prepare response
            return {
                'status': 'success',
                'filename': filename,
                'data_type': data_type,
                'total_records': len(df),
                'columns': list(df.columns),
                'preview': self._df_to_json_safe(df, 8),
                'column_classification': classification,
                'file_size_kb': filepath.stat().st_size / 1024,
            }

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Synthetic data generation failed: {str(e)}")

    def step2_classify_columns(self, filename: str) -> Dict:
        """
        STEP 2: Auto-classify all columns in dataset.
        Returns detailed classification with confidence scores and sample values.
        """
        filepath = UPLOAD_DIR / filename
        if not filepath.exists():
            raise HTTPException(status_code=404, detail=f"File not found: {filename}")

        try:
            df = pd.read_csv(filepath)
            classification = self.classifier.classify_dataset(df)
            
            # Convert to displayable format
            classification_df = self.classifier.to_dataframe(classification)

            return {
                'status': 'success',
                'filename': filename,
                'total_columns': len(df.columns),
                'column_classifications': classification,
                'classification_table': json.loads(classification_df.to_json(orient='records')),
                'summary': {
                    'direct_identifiers': [c for c, info in classification.items() if info['type'] == 'Direct Identifier'],
                    'quasi_identifiers': [c for c, info in classification.items() if info['type'] == 'Quasi-Identifier'],
                    'sensitive_attributes': [c for c, info in classification.items() if info['type'] == 'Sensitive Attribute'],
                    'non_sensitive': [c for c, info in classification.items() if info['type'] == 'Non-Sensitive'],
                }
            }

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Column classification failed: {str(e)}")

    def step3_get_algorithm_options(self) -> Dict:
        """
        STEP 3: Return all available algorithms with parameters.
        User selects algorithm and configures parameters.
        """
        algorithms = self.executor.list_algorithms()
        return {
            'status': 'success',
            'total_algorithms': len(algorithms),
            'algorithms': algorithms,
        }

    def step4_execute_anonymization(self, request: AnonymizeExecuteRequest) -> Dict:
        """
        STEP 4: Execute the selected anonymization algorithm.
        Returns anonymized data, metrics, and evaluation results.
        """
        filepath = UPLOAD_DIR / request.filename
        if not filepath.exists():
            raise HTTPException(status_code=404, detail=f"File not found: {request.filename}")

        try:
            # Load original data
            original_df = pd.read_csv(filepath)
            
            # Filter columns to exist in dataframe
            direct_ids = [c for c in request.direct_identifiers if c in original_df.columns]
            quasi_ids = [c for c in request.quasi_identifiers if c in original_df.columns]
            sensitive_attrs = [c for c in request.sensitive_attributes if c in original_df.columns]

            # Execute algorithm
            anonymized_df, algo_metadata = self.executor.execute(
                request.algorithm,
                original_df,
                {
                    **request.algorithm_params,
                    'quasi_identifiers': quasi_ids,
                    'sensitive_attributes': sensitive_attrs,
                }
            )

            # Evaluate anonymization
            eval_results = self.evaluator.evaluate_anonymization(
                original_df,
                anonymized_df,
                direct_ids,
                quasi_ids,
                sensitive_attrs,
                request.algorithm_params
            )

            # Save anonymized data
            anon_filename = f"anon_{request.algorithm}_{uuid.uuid4().hex[:8]}.csv"
            anon_filepath = UPLOAD_DIR / anon_filename
            anonymized_df.to_csv(anon_filepath, index=False)

            # Prepare detailed results
            return {
                'status': 'success',
                'algorithm': request.algorithm,
                'original_filename': request.filename,
                'anonymized_filename': anon_filename,
                'records_processed': len(original_df),
                'columns_in_dataset': len(original_df.columns),
                'execution_metadata': algo_metadata,
                'evaluation_metrics': {
                    'privacy_score': eval_results.get('privacy_score', 0),
                    'utility_score': eval_results.get('utility_score', 0),
                    'k_anonymity': eval_results.get('k_anonymity', 1),
                    'l_diversity': eval_results.get('l_diversity', 1),
                    'disclosure_risk': eval_results.get('disclosure_risk', 1),
                    'information_loss': eval_results.get('information_loss', 0),
                    'ml_utility_retention': eval_results.get('ml_utility_retention', 0),
                },
                'preview': {
                    'original': self._df_to_json_safe(original_df, 5),
                    'anonymized': self._df_to_json_safe(anonymized_df, 5),
                },
                'download_url': f"/api/download/{anon_filename}",
            }

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Anonymization execution failed: {str(e)}")

    def step5_get_results(self, anonymized_filename: str, original_filename: str = None) -> Dict:
        """
        STEP 5: Get complete results including metrics, charts, and export options.
        """
        anon_filepath = UPLOAD_DIR / anonymized_filename
        if not anon_filepath.exists():
            raise HTTPException(status_code=404, detail=f"Anonymized file not found")

        try:
            anonymized_df = pd.read_csv(anon_filepath)
            
            # Load original if provided
            original_df = None
            if original_filename:
                orig_filepath = UPLOAD_DIR / original_filename
                if orig_filepath.exists():
                    original_df = pd.read_csv(orig_filepath)

            return {
                'status': 'success',
                'anonymized_filename': anonymized_filename,
                'total_records': len(anonymized_df),
                'total_columns': len(anonymized_df.columns),
                'columns': list(anonymized_df.columns),
                'preview': {
                    'anonymized': self._df_to_json_safe(anonymized_df, 10),
                    'original': self._df_to_json_safe(original_df, 10) if original_df is not None else None,
                },
                'column_stats': {
                    col: {
                        'type': str(anonymized_df[col].dtype),
                        'null_count': int(anonymized_df[col].isnull().sum()),
                        'unique_count': int(anonymized_df[col].nunique()),
                    }
                    for col in anonymized_df.columns
                },
                'export_formats': [
                    'csv',
                    'json',
                    'jsonl',
                    'parquet',
                    'pdf_report',
                ],
            }

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Results retrieval failed: {str(e)}")

    @staticmethod
    def _df_to_json_safe(df, n=10):
        """Convert DataFrame head to JSON-safe list."""
        if df is None:
            return None

        preview = df.head(n).copy()
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


# ─── Export Helper ──────────────────────────────────────────

def export_anonymized_data(filename: str, format_type: str = 'csv') -> str:
    """Export anonymized data in various formats."""
    filepath = UPLOAD_DIR / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="File not found")

    df = pd.read_csv(filepath)

    if format_type == 'json':
        export_file = filepath.with_suffix('.json')
        df.to_json(export_file, orient='records', indent=2)
    elif format_type == 'jsonl':
        export_file = filepath.with_suffix('.jsonl')
        df.to_json(export_file, orient='records', lines=True)
    elif format_type == 'parquet':
        export_file = filepath.with_suffix('.parquet')
        df.to_parquet(export_file, index=False)
    else:  # csv
        export_file = filepath

    return str(export_file.name)
