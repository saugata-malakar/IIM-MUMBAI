"""
Hybrid Anonymization Pipeline — Graduate-level Implementation
Chains multiple anonymization algorithms in sequence for layered privacy.

Based on:
- "A Comparative Study of Data Anonymization Techniques" (project papers)
- "Anonymization Techniques for Privacy Preserving Data Publishing: A Comprehensive Survey"
- Brajesh's hybrid algorithm work (NIT Rourkela)

Key concept: No single algorithm provides optimal privacy-utility tradeoff
across all data types. A hybrid approach applies:
  1. Pseudonymization → Direct identifiers (names, emails)
  2. k-Anonymity → Quasi-identifiers (age, zip)
  3. Differential Privacy → Numeric sensitive columns
  4. PII Redaction → Free-text columns

This achieves defense-in-depth: even if one layer is compromised,
the remaining layers maintain privacy guarantees.
"""

import pandas as pd
import numpy as np
import time
from typing import Dict, Any, List, Optional
from medshield.algorithms.base import BaseAnonymizer


class HybridAnonymizer(BaseAnonymizer):
    """
    Multi-layer anonymization pipeline that applies different algorithms
    to different column types for optimal privacy-utility tradeoff.

    Layers (applied in order):
        1. Pseudonymization — hash direct identifiers (name, email, phone)
        2. k-Anonymity — generalize quasi-identifiers (age, zip, gender)
        3. Differential Privacy — add noise to numeric sensitive columns
        4. PII Redaction — scan free-text columns for remaining PII

    Parameters:
        k (int): k-anonymity parameter. Default 5.
        epsilon (float): DP privacy budget. Default 1.0.
        enable_layers (list): Which layers to enable. Default all.
        auto_classify (bool): Auto-detect column types. Default True.
    """

    def __init__(self, quasi_identifiers: List[str] = None,
                 sensitive_attributes: List[str] = None,
                 k: int = 5,
                 epsilon: float = 1.0,
                 enable_layers: List[str] = None,
                 auto_classify: bool = True,
                 config: Dict[str, Any] = None):
        super().__init__(quasi_identifiers, sensitive_attributes, config)
        self.k = k
        self.epsilon = epsilon
        self.enable_layers = enable_layers or [
            "pseudonymization", "k-anonymity", "differential-privacy", "pii-redaction"
        ]
        self.auto_classify = auto_classify
        self._layer_results = {}
        self._column_classification = {}

    @property
    def name(self) -> str:
        layers = "+".join(l[:3].upper() for l in self.enable_layers)
        return f"Hybrid ({layers}, k={self.k}, ε={self.epsilon})"

    def _classify_columns(self, df: pd.DataFrame) -> Dict[str, List[str]]:
        """
        Auto-classify columns into categories for layer assignment.
        Uses pattern matching + statistical analysis.
        """
        classification = {
            "direct_identifiers": [],
            "quasi_identifiers": [],
            "sensitive_numeric": [],
            "free_text": [],
            "safe": [],
        }

        for col in df.columns:
            cl = col.lower().replace(" ", "_")

            # Direct identifiers
            if any(p in cl for p in ["name", "email", "phone", "ssn", "aadhar",
                                      "pan", "address", "mrn"]):
                classification["direct_identifiers"].append(col)

            # Quasi-identifiers
            elif any(p in cl for p in ["age", "gender", "sex", "zip", "race",
                                        "ethnic", "marital", "dob", "birth",
                                        "education", "occupation"]):
                classification["quasi_identifiers"].append(col)

            # Sensitive numeric (medical values)
            elif any(p in cl for p in ["blood", "sugar", "pressure", "cholesterol",
                                        "bmi", "heart", "pulse", "temperature",
                                        "weight", "height"]):
                classification["sensitive_numeric"].append(col)

            # Free text (long string columns)
            elif pd.api.types.is_object_dtype(df[col]):
                avg_len = df[col].dropna().astype(str).str.len().mean()
                if avg_len > 30:
                    classification["free_text"].append(col)
                else:
                    classification["safe"].append(col)
            else:
                classification["safe"].append(col)

        self._column_classification = classification
        return classification

    def anonymize(self, data: pd.DataFrame, **kwargs) -> pd.DataFrame:
        """Apply all enabled layers sequentially."""
        df = data.copy()

        # Auto-classify if needed
        if self.auto_classify:
            cols = self._classify_columns(df)
        else:
            cols = {
                "direct_identifiers": [c for c in self.quasi_identifiers
                                        if any(p in c.lower() for p in ["name", "email", "phone"])],
                "quasi_identifiers": self.quasi_identifiers,
                "sensitive_numeric": self.sensitive_attributes,
                "free_text": [],
                "safe": [],
            }

        # Layer 1: Pseudonymization
        if "pseudonymization" in self.enable_layers and cols["direct_identifiers"]:
            start = time.time()
            from medshield.algorithms.pseudonymization import Pseudonymization
            pseudo = Pseudonymization(
                identifier_columns=cols["direct_identifiers"]
            )
            df = pseudo.anonymize(df)
            self._layer_results["pseudonymization"] = {
                "columns_processed": cols["direct_identifiers"],
                "time_ms": round((time.time() - start) * 1000, 2),
            }

        # Layer 2: k-Anonymity
        qi = cols.get("quasi_identifiers", []) or self.quasi_identifiers
        if "k-anonymity" in self.enable_layers and qi:
            start = time.time()
            from medshield.algorithms.k_anonymity import KAnonymity
            kanon = KAnonymity(
                quasi_identifiers=qi,
                sensitive_attributes=self.sensitive_attributes,
                k=self.k,
            )
            df = kanon.anonymize(df)
            self._layer_results["k-anonymity"] = {
                "k": self.k,
                "columns_processed": qi,
                "time_ms": round((time.time() - start) * 1000, 2),
            }

        # Layer 3: Differential Privacy on numeric sensitive columns
        num_cols = cols.get("sensitive_numeric", [])
        if "differential-privacy" in self.enable_layers and num_cols:
            start = time.time()
            from medshield.algorithms.differential_privacy import DifferentialPrivacy
            dp = DifferentialPrivacy(
                quasi_identifiers=num_cols,
                epsilon=self.epsilon,
                mechanism="laplace",
            )
            df = dp.anonymize(df)
            self._layer_results["differential-privacy"] = {
                "epsilon": self.epsilon,
                "columns_processed": num_cols,
                "time_ms": round((time.time() - start) * 1000, 2),
            }

        # Layer 4: PII Redaction on free text
        text_cols = cols.get("free_text", [])
        if "pii-redaction" in self.enable_layers and text_cols:
            start = time.time()
            from medshield.algorithms.pii_redaction import PIIRedactor
            redactor = PIIRedactor(text_columns=text_cols)
            df = redactor.anonymize(df)
            self._layer_results["pii-redaction"] = {
                "columns_processed": text_cols,
                "time_ms": round((time.time() - start) * 1000, 2),
                "detections": redactor._detections,
            }

        return df

    def _compute_privacy_score(self, original, anonymized) -> float:
        """
        Hybrid privacy = weighted average of layer contributions.
        Each layer contributes based on the sensitivity of columns it processed.
        """
        scores = []
        weights = []

        if "pseudonymization" in self._layer_results:
            # Direct ID hashing is very high privacy
            n_cols = len(self._layer_results["pseudonymization"]["columns_processed"])
            scores.append(0.95)
            weights.append(n_cols * 3)  # Higher weight for direct IDs

        if "k-anonymity" in self._layer_results:
            qi_cols = [c for c in self.quasi_identifiers if c in anonymized.columns]
            if qi_cols:
                try:
                    groups = anonymized.groupby(qi_cols).size()
                    k_score = min(int(groups.min()) / self.k, 1.0)
                except Exception:
                    k_score = 0.5
                scores.append(k_score)
                weights.append(len(qi_cols) * 2)

        if "differential-privacy" in self._layer_results:
            # ε-based score
            if self.epsilon <= 0.5:
                dp_score = 0.9
            elif self.epsilon <= 1.0:
                dp_score = 0.75
            else:
                dp_score = max(0.3, 1.0 - self.epsilon / 5.0)
            n_cols = len(self._layer_results["differential-privacy"]["columns_processed"])
            scores.append(dp_score)
            weights.append(n_cols)

        if "pii-redaction" in self._layer_results:
            scores.append(0.85)
            weights.append(1)

        if not scores:
            return 0.5

        return sum(s * w for s, w in zip(scores, weights)) / sum(weights)

    def _get_params(self) -> Dict[str, Any]:
        return {
            "k": self.k,
            "epsilon": self.epsilon,
            "layers_enabled": self.enable_layers,
            "layer_results": self._layer_results,
            "column_classification": self._column_classification,
            "quasi_identifiers": self.quasi_identifiers,
        }
