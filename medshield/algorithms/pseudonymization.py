"""
Pseudonymization Algorithm
Replaces direct identifiers with irreversible pseudonyms using SHA-256.
"""

import pandas as pd
import hashlib
import uuid
from typing import Dict, Any, List
from medshield.algorithms.base import BaseAnonymizer


class Pseudonymization(BaseAnonymizer):
    """
    Hash-based pseudonymization for direct identifiers.
    Uses SHA-256 with per-run salt for DPDP compliance.
    """

    def __init__(self, quasi_identifiers=None, sensitive_attributes=None,
                 salt=None, prefix="PSE", hash_length=12,
                 identifier_columns=None, config=None):
        super().__init__(quasi_identifiers, sensitive_attributes, config)
        self.salt = salt or uuid.uuid4().hex
        self.prefix = prefix
        self.hash_length = hash_length
        self.identifier_columns = identifier_columns
        self._count = 0

    @property
    def name(self):
        return "Pseudonymization (SHA-256)"

    def _hash_value(self, value):
        raw = f"{self.salt}:{str(value)}"
        h = hashlib.sha256(raw.encode("utf-8")).hexdigest()
        return f"{self.prefix}-{h[:self.hash_length].upper()}"

    def anonymize(self, data, **kwargs):
        df = data.copy()
        targets = self._get_id_cols(df)
        for col in targets:
            uniq = df[col].dropna().unique()
            mapping = {v: self._hash_value(v) for v in uniq}
            df[col] = df[col].map(mapping).fillna(df[col])
            self._count += len(mapping)
        return df

    def _get_id_cols(self, df):
        if self.identifier_columns:
            return [c for c in self.identifier_columns if c in df.columns]
        pats = ['name','email','phone','ssn','aadhar','mrn','patient_id','doctor_id','insurance','address','pan']
        found = []
        for col in df.columns:
            cl = col.lower().replace(" ", "_")
            if any(p in cl for p in pats):
                found.append(col)
        return found if found else list(self.quasi_identifiers or [])

    def _compute_privacy_score(self, original, anonymized):
        targets = self._get_id_cols(original)
        if not targets: return 0.5
        changed = sum(1 for c in targets if c in anonymized.columns and not original[c].equals(anonymized[c]))
        return changed / len(targets)

    def _get_params(self):
        return {"hash_length": self.hash_length, "prefix": self.prefix, "pseudonyms": self._count}
