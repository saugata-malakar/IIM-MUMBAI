"""
Automatic Column Classification Engine
Detects PII types: Direct Identifier, Quasi-Identifier, Sensitive Attribute, Non-Sensitive.
"""

import re
import pandas as pd
import numpy as np
from typing import Dict, List, Tuple


class ColumnClassifier:
    """Auto-classify dataset columns by PII sensitivity level."""

    # Direct Identifiers — always PII
    DIRECT_IDENTIFIER_KEYWORDS = {
        'patient_id', 'person_id', 'id', 'name', 'email', 'phone', 'telephone', 
        'mobile', 'ssn', 'social_security', 'aadhaar', 'aadhaar_number', 'pan', 
        'passport', 'license', 'driver_license', 'address', 'postal_code', 
        'zip_code', 'dob', 'date_of_birth', 'birth_date', 'hospital_id',
        'mrn', 'medical_record_number', 'account_number', 'credit_card',
        'insurance_id', 'policy_number', 'doctor_id', 'provider_id'
    }

    # Quasi-Identifiers — combination can re-identify
    QUASI_IDENTIFIER_KEYWORDS = {
        'age', 'gender', 'sex', 'blood_group', 'blood_type', 'race', 'ethnicity',
        'occupation', 'district', 'city', 'state', 'country', 'ward', 'latitude',
        'longitude', 'zip', 'postcode', 'religion', 'income', 'education',
        'marital_status', 'admission_date', 'discharge_date', 'visit_date'
    }

    # Sensitive Attributes — requires special protection
    SENSITIVE_ATTRIBUTE_KEYWORDS = {
        'diagnosis', 'disease', 'condition', 'icd10_code', 'icd_code', 'procedure',
        'medication', 'drug', 'treatment', 'therapy', 'test_result', 'lab_value',
        'blood_pressure', 'heart_rate', 'temperature', 'glucose', 'blood_sugar',
        'hemoglobin', 'creatinine', 'cholesterol', 'triglyceride', 'hiv_status',
        'hepatitis', 'mental_health', 'psychiatric', 'allergy', 'allergies',
        'vaccine', 'immunization', 'clinical_note', 'note', 'symptom', 'finding'
    }

    # Non-Sensitive — can be left as-is
    NON_SENSITIVE_KEYWORDS = {
        'record_id', 'row_number', 'index', 'synthetic', 'generated', 'flag',
        'timestamp', 'created_at', 'updated_at', 'modified_at', 'version'
    }

    def __init__(self):
        self.patterns = {
            'email': r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
            'phone': r'^(\+91[-\s]?)?[6-9]\d{9}$|^\d{10}$',  # Indian format
            'aadhaar': r'^\d{12}$|^\d{4}\s\d{4}\s\d{4}$',
            'date': r'^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$',
            'id_pattern': r'^[A-Z]{2,5}-\d{4,8}$',
        }

    def _match_keyword(self, col_name: str, keyword_set: set) -> bool:
        """Check if column name matches keywords (case-insensitive)."""
        col_lower = col_name.lower()
        for keyword in keyword_set:
            if keyword in col_lower or col_lower in keyword:
                return True
        return False

    def _detect_pattern_in_values(self, values: pd.Series, pattern_name: str) -> float:
        """
        Detect regex pattern in column values.
        Returns: proportion of values matching pattern (0-1)
        """
        if len(values) == 0:
            return 0.0
        
        pattern = self.patterns.get(pattern_name)
        if not pattern:
            return 0.0
        
        # Sample first 100 non-null values
        sample = values.dropna().head(100).astype(str)
        if len(sample) == 0:
            return 0.0
        
        matches = sample.apply(lambda x: bool(re.match(pattern, x.strip())))
        return matches.sum() / len(sample)

    def _estimate_cardinality(self, col_data: pd.Series) -> float:
        """
        Cardinality ratio: unique values / total values.
        High cardinality (>0.95) often indicates ID field.
        """
        total = len(col_data)
        if total == 0:
            return 0.0
        unique = col_data.nunique()
        return unique / total

    def classify_column(self, col_name: str, col_data: pd.Series) -> Tuple[str, str, float]:
        """
        Classify a single column.
        Returns: (type, confidence_level, confidence_score)
        Types: Direct Identifier, Quasi-Identifier, Sensitive Attribute, Non-Sensitive, Unknown
        Confidence: High (>0.8), Medium (0.5-0.8), Low (<0.5)
        """
        scores = {
            'direct_identifier': 0.0,
            'quasi_identifier': 0.0,
            'sensitive_attribute': 0.0,
            'non_sensitive': 0.0
        }

        # Rule 1: Keyword matching
        if self._match_keyword(col_name, self.DIRECT_IDENTIFIER_KEYWORDS):
            scores['direct_identifier'] += 0.8

        if self._match_keyword(col_name, self.QUASI_IDENTIFIER_KEYWORDS):
            scores['quasi_identifier'] += 0.7

        if self._match_keyword(col_name, self.SENSITIVE_ATTRIBUTE_KEYWORDS):
            scores['sensitive_attribute'] += 0.8

        if self._match_keyword(col_name, self.NON_SENSITIVE_KEYWORDS):
            scores['non_sensitive'] += 0.9

        # Rule 2: Pattern detection in values
        email_match = self._detect_pattern_in_values(col_data, 'email')
        if email_match > 0.5:
            scores['direct_identifier'] += email_match * 0.3

        phone_match = self._detect_pattern_in_values(col_data, 'phone')
        if phone_match > 0.5:
            scores['direct_identifier'] += phone_match * 0.3

        aadhaar_match = self._detect_pattern_in_values(col_data, 'aadhaar')
        if aadhaar_match > 0.5:
            scores['direct_identifier'] += aadhaar_match * 0.4

        date_match = self._detect_pattern_in_values(col_data, 'date')
        if date_match > 0.7:
            scores['quasi_identifier'] += date_match * 0.2

        # Rule 3: Cardinality check (high cardinality = likely ID)
        cardinality = self._estimate_cardinality(col_data)
        if cardinality > 0.95:
            scores['direct_identifier'] += 0.4
        elif cardinality < 0.1:
            scores['non_sensitive'] += 0.2

        # Rule 4: Numeric range check for vitals/lab values
        try:
            numeric_vals = pd.to_numeric(col_data, errors='coerce').dropna()
            if len(numeric_vals) > 0:
                mean_val = numeric_vals.mean()
                # Typical vital sign ranges
                if 20 < mean_val < 200:  # Could be age, BP, HR, temp, glucose
                    if any(kw in col_name.lower() for kw in ['blood_pressure', 'heart_rate', 'temperature', 
                                                                'glucose', 'blood_sugar', 'hemoglobin']):
                        scores['sensitive_attribute'] += 0.6
        except:
            pass

        # Normalize scores
        total = sum(scores.values())
        if total > 0:
            scores = {k: v/total for k, v in scores.items()}

        # Determine final classification
        max_score = max(scores.values())
        max_type = max(scores, key=scores.get)

        # Confidence level
        if max_score >= 0.8:
            confidence = 'High'
        elif max_score >= 0.5:
            confidence = 'Medium'
        else:
            confidence = 'Low'

        type_mapping = {
            'direct_identifier': 'Direct Identifier',
            'quasi_identifier': 'Quasi-Identifier',
            'sensitive_attribute': 'Sensitive Attribute',
            'non_sensitive': 'Non-Sensitive'
        }

        return type_mapping[max_type], confidence, float(max_score)

    def classify_dataset(self, df: pd.DataFrame) -> Dict[str, Dict]:
        """
        Classify all columns in a dataset.
        Returns: {column_name: {type, confidence, samples}}
        """
        results = {}

        for col in df.columns:
            col_type, confidence, score = self.classify_column(col, df[col])

            # Get sample values
            sample_vals = df[col].dropna().head(3).tolist()
            if not sample_vals:
                sample_vals = []

            results[col] = {
                'type': col_type,
                'confidence': confidence,
                'score': float(score),
                'samples': [str(v) for v in sample_vals],
                'null_count': int(df[col].isnull().sum()),
                'unique_count': int(df[col].nunique())
            }

        return results

    def to_dataframe(self, classification_dict: Dict) -> pd.DataFrame:
        """Convert classification results to displayable DataFrame."""
        rows = []
        for col_name, info in classification_dict.items():
            rows.append({
                'Column Name': col_name,
                'Type': info['type'],
                'Confidence': info['confidence'],
                'Score': f"{info['score']:.2f}",
                'Sample Values': ', '.join(info['samples'][:2]) if info['samples'] else 'N/A',
                'Null Count': info['null_count'],
                'Unique Values': info['unique_count']
            })
        return pd.DataFrame(rows)
