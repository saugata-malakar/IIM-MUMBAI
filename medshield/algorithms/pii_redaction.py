"""
PII Redaction Algorithm
Advanced Hybrid approach using both regex patterns and Named Entity Recognition (NER).
Detects and redacts Personally Identifiable Information from clinical free-text.

Reference:
- Standard clinical NLP de-identification techniques
"""

import pandas as pd
import re
import logging
from typing import Dict, Any, List, Tuple
from medshield.algorithms.base import BaseAnonymizer

try:
    import spacy
    # Try to load the English model. If not found, will fail gracefully later.
    HAS_SPACY = True
except ImportError:
    HAS_SPACY = False

logger = logging.getLogger(__name__)

# Standard PII regex patterns
PII_PATTERNS = {
    "EMAIL": r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
    "PHONE_IN": r'\b(?:\+91[\-\s]?)?[6-9]\d{9}\b',
    "PHONE_US": r'\b(?:\+1[\-\s]?)?\(?\d{3}\)?[\-\s]?\d{3}[\-\s]?\d{4}\b',
    "AADHAR": r'\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b',
    "PAN": r'\b[A-Z]{5}\d{4}[A-Z]\b',
    "SSN": r'\b\d{3}-\d{2}-\d{4}\b',
    "DATE": r'\b\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4}\b',
    "IP_ADDRESS": r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b',
    "CREDIT_CARD": r'\b(?:\d{4}[\s-]?){3}\d{4}\b',
    "ZIPCODE": r'\b\d{5,6}\b',
}

# Mapping spaCy entity labels to our redaction tags
SPACY_ENTITY_MAP = {
    "PERSON": "NAME",
    "ORG": "ORGANIZATION",
    "GPE": "LOCATION",
    "LOC": "LOCATION",
    "FAC": "FACILITY",
}


class PIIRedactor(BaseAnonymizer):
    """
    Advanced PII detection and redaction for text columns.
    Uses regex for structured patterns (Aadhar, PAN, SSN) and spaCy NER
    for unstructured entities (Names, Organizations, Locations).

    Parameters:
        text_columns (list): Columns containing free text. Auto-detected if None.
        patterns (dict): Custom PII regex patterns. Merges with defaults.
        use_ner (bool): Whether to use spaCy Named Entity Recognition. Default True.
        replacement_format (str): Format for replacements. Default '[{type}]'.
    """

    def __init__(self, quasi_identifiers=None, sensitive_attributes=None,
                 text_columns=None, patterns=None, use_ner=True,
                 replacement_format="[{type}]", config=None):
        super().__init__(quasi_identifiers, sensitive_attributes, config)
        self.text_columns = text_columns
        self.patterns = {**PII_PATTERNS, **(patterns or {})}
        self.use_ner = use_ner and HAS_SPACY
        self.replacement_format = replacement_format
        self._detections = {}
        
        self.nlp = None
        if self.use_ner:
            try:
                # Load small English model. Discard unnecessary pipelines for speed.
                self.nlp = spacy.load("en_core_web_sm", disable=["parser", "tagger", "lemmatizer"])
            except Exception as e:
                logger.warning(f"spaCy model 'en_core_web_sm' not found. Run 'python -m spacy download en_core_web_sm'. Falling back to regex only. Error: {e}")
                self.use_ner = False

    @property
    def name(self):
        return f"PII Redaction ({'NER + Regex' if self.use_ner else 'Regex'})"

    def anonymize(self, data, **kwargs):
        df = data.copy()
        text_cols = self._get_text_columns(df)
        for col in text_cols:
            df[col], detections = self._redact_column(df[col])
            self._detections[col] = detections
        return df

    def _redact_column(self, series: pd.Series) -> Tuple[pd.Series, Dict[str, int]]:
        total_detections = {}
        
        def redact_text(text):
            if not isinstance(text, str) or not text.strip():
                return text
                
            # 1. Regex Redaction (Highest Priority for structured data)
            for pii_type, pattern in self.patterns.items():
                matches = re.findall(pattern, text)
                if matches:
                    total_detections[pii_type] = total_detections.get(pii_type, 0) + len(matches)
                    replacement = self.replacement_format.format(type=pii_type)
                    text = re.sub(pattern, replacement, text)
                    
            # 2. NER Redaction (For unstructured names, places)
            if self.use_ner and self.nlp:
                doc = self.nlp(text)
                # Process in reverse to avoid index shifting when replacing
                for ent in reversed(doc.ents):
                    if ent.label_ in SPACY_ENTITY_MAP:
                        mapped_type = SPACY_ENTITY_MAP[ent.label_]
                        total_detections[mapped_type] = total_detections.get(mapped_type, 0) + 1
                        
                        replacement = self.replacement_format.format(type=mapped_type)
                        # Replace exact span
                        text = text[:ent.start_char] + replacement + text[ent.end_char:]
                        
            return text
            
        redacted_series = series.apply(redact_text)
        return redacted_series, total_detections

    def _get_text_columns(self, df):
        if self.text_columns:
            return [c for c in self.text_columns if c in df.columns]
            
        # Auto-detect: object columns with avg length > 30 characters
        text_cols = []
        for col in df.select_dtypes(include=['object', 'string']).columns:
            # Sample non-null values
            sample = df[col].dropna().head(100)
            if not sample.empty:
                avg_len = sample.astype(str).str.len().mean()
                if avg_len > 30:
                    text_cols.append(col)
                    
        return text_cols if text_cols else df.select_dtypes(include=['object']).columns.tolist()

    def get_detection_report(self):
        """Return summary of all PII detections."""
        rows = []
        for col, dets in self._detections.items():
            for pii_type, count in dets.items():
                rows.append({"Column": col, "PII_Type": pii_type, "Count": count})
        return pd.DataFrame(rows) if rows else pd.DataFrame(columns=["Column", "PII_Type", "Count"])

    def _compute_privacy_score(self, original, anonymized):
        text_cols = self._get_text_columns(original)
        if not text_cols: return 0.5
        
        # High privacy score if we successfully changed data, especially if we used NER
        changed_fraction = sum(1 for c in text_cols if c in anonymized.columns and not original[c].equals(anonymized[c])) / len(text_cols)
        
        base_score = changed_fraction * 0.8
        ner_bonus = 0.15 if self.use_ner else 0.0
        return min(base_score + ner_bonus + 0.05, 1.0)

    def _get_params(self):
        return {
            "patterns_count": len(self.patterns), 
            "use_ner": self.use_ner,
            "detections": self._detections
        }
