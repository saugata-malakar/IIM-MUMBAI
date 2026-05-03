"""
Advanced Re-identification Risk Analysis
Computes Prosecutor Risk, Journalist Risk, and Marketer Risk models.

Reference: El Emam et al., "A Globally Optimal k-Anonymity Method for the De-Identification of Health Data"
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Any

class RiskAnalyzer:
    """
    Evaluates specific privacy attack models on a dataset.
    - Prosecutor Risk: Attacker knows the target is in the dataset.
    - Journalist Risk: Attacker doesn't know if target is in the dataset but has background info.
    - Marketer Risk: Expected number of successful re-identifications.
    """
    
    def __init__(self, data: pd.DataFrame, quasi_identifiers: List[str]):
        self.data = data
        self.qi_cols = [c for c in quasi_identifiers if c in data.columns]
        self.N = len(data)
        self.equivalence_classes = None
        if self.qi_cols and self.N > 0:
            self.equivalence_classes = self.data.groupby(self.qi_cols).size()

    def analyze(self) -> Dict[str, Any]:
        if not self.qi_cols or self.N == 0 or self.equivalence_classes is None:
            return {
                "prosecutor_risk": 1.0,
                "journalist_risk": 1.0,
                "marketer_risk": 1.0,
                "highest_risk_records": 0
            }

        # Size of each equivalence class
        f_j = self.equivalence_classes
        
        # 1. Prosecutor Risk (Worst-case risk)
        # Probability of identifying an individual given they ARE in the dataset
        # Max(1 / f_j)
        prosecutor_risk = float(1.0 / f_j.min())

        # 2. Journalist Risk
        # Risk when an attacker knows some background attributes
        # Can be approximated similar to prosecutor risk if population data is unknown,
        # but technically relies on population frequencies. 
        # Here we use the 95th percentile risk as a robust estimate.
        journalist_risk = float(1.0 / np.percentile(f_j, 5))

        # 3. Marketer Risk (Average Risk)
        # Expected proportion of correctly re-identified records if attacker guesses randomly
        # within each group. Expected matches = sum(1 / f_j * f_j) = number of classes!
        # Marketer Risk = Number of classes / Total records
        marketer_risk = float(len(f_j) / self.N)
        
        # Number of highly vulnerable records (e.g., risk > 0.33 meaning group size < 3)
        vulnerable_count = int(f_j[f_j < 3].sum())

        return {
            "prosecutor_risk": round(prosecutor_risk, 4),
            "journalist_risk": round(journalist_risk, 4),
            "marketer_risk": round(marketer_risk, 4),
            "highest_risk_records": vulnerable_count,
            "total_equivalence_classes": len(f_j),
            "safe": prosecutor_risk <= 0.2  # k >= 5
        }

    def generate_risk_profile(self) -> pd.DataFrame:
        """Generates a detailed risk profile per record."""
        if self.equivalence_classes is None:
            return pd.DataFrame()
            
        # Map group sizes back to original data
        group_sizes = self.data[self.qi_cols].apply(tuple, axis=1).map(self.equivalence_classes)
        
        profile = pd.DataFrame({
            'Record_ID': range(self.N),
            'Group_Size': group_sizes,
            'Re_identification_Risk': 1.0 / group_sizes
        })
        return profile.sort_values('Re_identification_Risk', ascending=False)
