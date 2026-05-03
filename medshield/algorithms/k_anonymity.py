"""
k-Anonymity Algorithm
Ensures every record is indistinguishable from at least (k-1) others
on quasi-identifier attributes via generalization and suppression.

Reference: Sweeney L. (2002) "k-anonymity: a model for protecting privacy"
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional
from medshield.algorithms.base import BaseAnonymizer


# ─── Generalization Hierarchies ──────────────────────────────────────────────

def generalize_age(age: int, level: int = 1) -> str:
    """Multi-level age generalization."""
    if level == 0:
        return str(age)
    elif level == 1:
        lower = (age // 5) * 5
        return f"{lower}-{lower + 4}"
    elif level == 2:
        lower = (age // 10) * 10
        return f"{lower}-{lower + 9}"
    elif level == 3:
        lower = (age // 20) * 20
        return f"{lower}-{lower + 19}"
    else:
        return "*"


def generalize_zip(zip_code: str, level: int = 1) -> str:
    """Multi-level ZIP code generalization."""
    zip_str = str(zip_code).strip()
    if level == 0:
        return zip_str
    mask_count = min(level, len(zip_str))
    return zip_str[:len(zip_str) - mask_count] + "*" * mask_count


def generalize_date(date_val, level: int = 1) -> str:
    """Multi-level date generalization."""
    try:
        dt = pd.to_datetime(date_val)
    except Exception:
        return str(date_val)
    if level == 0:
        return dt.strftime("%Y-%m-%d")
    elif level == 1:
        return dt.strftime("%Y-%m")
    elif level == 2:
        return dt.strftime("%Y")
    else:
        return "*"


# Default hierarchy functions by column name patterns
HIERARCHY_MAP = {
    "age": generalize_age,
    "zip": generalize_zip,
    "zipcode": generalize_zip,
    "zip_code": generalize_zip,
    "postal": generalize_zip,
    "date": generalize_date,
    "dob": generalize_date,
    "birth": generalize_date,
    "visit_date": generalize_date,
}


class KAnonymity(BaseAnonymizer):
    """
    k-Anonymity via generalization with optional suppression.
    
    Parameters:
        k (int): Minimum group size. Default 5.
        max_suppression (float): Max fraction of records to suppress. Default 0.1.
        generalization_levels (dict): Per-column generalization levels. Auto-detected if not given.
    """

    def __init__(self, quasi_identifiers: List[str] = None,
                 sensitive_attributes: List[str] = None,
                 k: int = 5,
                 max_suppression: float = 0.1,
                 generalization_levels: Dict[str, int] = None,
                 config: Dict[str, Any] = None):
        super().__init__(quasi_identifiers, sensitive_attributes, config)
        self.k = k
        self.max_suppression = max_suppression
        self.gen_levels = generalization_levels or {}
        self._applied_levels = {}

    @property
    def name(self) -> str:
        return f"k-Anonymity (k={self.k})"

    def anonymize(self, data: pd.DataFrame, **kwargs) -> pd.DataFrame:
        """Apply generalization to achieve k-anonymity."""
        df = data.copy()
        qi_cols = [c for c in self.quasi_identifiers if c in df.columns]
        if not qi_cols:
            return df

        # Try increasing generalization levels until k-anonymity is satisfied
        for level in range(1, 6):
            df_gen = self._apply_generalization(data, qi_cols, level)
            if self._check_k_anonymity(df_gen, qi_cols):
                # Optionally suppress small groups
                df_gen = self._suppress_small_groups(df_gen, qi_cols)
                return df_gen

        # If max level reached, apply suppression more aggressively
        df_gen = self._apply_generalization(data, qi_cols, 5)
        df_gen = self._suppress_small_groups(df_gen, qi_cols)
        return df_gen

    def _apply_generalization(self, data: pd.DataFrame,
                               qi_cols: List[str], default_level: int) -> pd.DataFrame:
        """Apply generalization functions to each quasi-identifier."""
        df = data.copy()
        for col in qi_cols:
            level = self.gen_levels.get(col, default_level)
            self._applied_levels[col] = level

            # Find matching hierarchy function
            gen_func = None
            col_lower = col.lower()
            for pattern, func in HIERARCHY_MAP.items():
                if pattern in col_lower:
                    gen_func = func
                    break

            if gen_func:
                df[col] = df[col].apply(lambda x: gen_func(x, level))
            else:
                # Generic: for numeric columns, bin them; for categorical, keep as-is
                if pd.api.types.is_numeric_dtype(df[col]):
                    df[col] = self._generalize_numeric(df[col], level)
                # Categorical columns at high levels get suppressed
                elif level >= 4:
                    df[col] = "*"

        return df

    def _generalize_numeric(self, series: pd.Series, level: int) -> pd.Series:
        """Generic numeric generalization via binning."""
        if level == 0:
            return series
        bin_size = 5 * (2 ** (level - 1))  # 5, 10, 20, 40, 80...
        result = series.apply(
            lambda x: f"{int((x // bin_size) * bin_size)}-{int((x // bin_size) * bin_size + bin_size - 1)}"
            if pd.notna(x) else "*"
        )
        return result

    def _check_k_anonymity(self, df: pd.DataFrame, qi_cols: List[str]) -> bool:
        """Check if k-anonymity is satisfied."""
        try:
            groups = df.groupby(qi_cols).size()
            return groups.min() >= self.k
        except Exception:
            return False

    def _suppress_small_groups(self, df: pd.DataFrame,
                                qi_cols: List[str]) -> pd.DataFrame:
        """Remove records in groups smaller than k (up to max_suppression %)."""
        try:
            group_sizes = df.groupby(qi_cols).transform('size')
            small_mask = group_sizes < self.k
            suppress_count = small_mask.sum()
            max_suppress = int(len(df) * self.max_suppression)

            if suppress_count <= max_suppress:
                return df[~small_mask].reset_index(drop=True)
            else:
                # Only suppress the smallest groups up to limit
                return df[~small_mask].head(len(df) - suppress_count + max_suppress).reset_index(drop=True)
        except Exception:
            return df

    def _compute_privacy_score(self, original, anonymized) -> float:
        """k-anonymity specific: based on achieved k value and group distribution."""
        qi_cols = [c for c in self.quasi_identifiers if c in anonymized.columns]
        if not qi_cols:
            return 0.5
        try:
            groups = anonymized.groupby(qi_cols).size()
            achieved_k = int(groups.min())
            avg_group = float(groups.mean())
            # Score: ratio of achieved to target + bonus for large average group size
            k_ratio = min(achieved_k / self.k, 1.0)
            avg_bonus = min(avg_group / (self.k * 2), 0.3)
            return min(k_ratio * 0.7 + avg_bonus, 1.0)
        except Exception:
            return 0.5

    def verify_k_anonymity(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Full verification report for k-anonymity.
        Returns achieved k, group distribution, and violation details.
        """
        qi_cols = [c for c in self.quasi_identifiers if c in df.columns]
        if not qi_cols:
            return {"verified": False, "reason": "No QI columns found"}

        groups = df.groupby(qi_cols).size()
        achieved_k = int(groups.min())
        violations = groups[groups < self.k]

        return {
            "verified": achieved_k >= self.k,
            "target_k": self.k,
            "achieved_k": achieved_k,
            "total_groups": len(groups),
            "avg_group_size": round(float(groups.mean()), 2),
            "max_group_size": int(groups.max()),
            "min_group_size": achieved_k,
            "violations": len(violations),
            "violation_records": int(violations.sum()) if len(violations) > 0 else 0,
            "group_size_distribution": {
                "1": int((groups == 1).sum()),
                "2-4": int(((groups >= 2) & (groups <= 4)).sum()),
                "5-10": int(((groups >= 5) & (groups <= 10)).sum()),
                "10+": int((groups > 10).sum()),
            }
        }

    def _get_params(self) -> Dict[str, Any]:
        return {
            "k": self.k,
            "max_suppression": self.max_suppression,
            "applied_levels": self._applied_levels,
            "quasi_identifiers": self.quasi_identifiers,
        }

