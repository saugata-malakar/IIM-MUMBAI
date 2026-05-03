"""
t-Closeness Algorithm
Ensures the distribution of sensitive attributes in each equivalence class
is within distance t of the global distribution.

Reference: Li N. et al. (2007) "t-Closeness: Privacy Beyond k-Anonymity and l-Diversity"
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, List
from medshield.algorithms.base import BaseAnonymizer
from medshield.algorithms.k_anonymity import KAnonymity


class TCloseness(BaseAnonymizer):
    """
    t-Closeness via Earth Mover's Distance (EMD) enforcement.
    
    First achieves k-anonymity, then verifies that the distribution 
    of sensitive attributes in each equivalence class is close to 
    the global distribution.
    
    Parameters:
        t (float): Maximum allowed distance. Default 0.3.
        distance_metric (str): 'emd' or 'kl'. Default 'emd'.
        k (int): k-anonymity parameter. Default 5.
    """

    def __init__(self, quasi_identifiers: List[str] = None,
                 sensitive_attributes: List[str] = None,
                 t: float = 0.3,
                 distance_metric: str = "emd",
                 k: int = 5,
                 config: Dict[str, Any] = None):
        super().__init__(quasi_identifiers, sensitive_attributes, config)
        self.t = t
        self.distance_metric = distance_metric.lower()
        self.k = k
        self._group_distances = {}
        self._k_anon = KAnonymity(
            quasi_identifiers=quasi_identifiers,
            sensitive_attributes=sensitive_attributes,
            k=k,
        )

    @property
    def name(self) -> str:
        return f"t-Closeness (t={self.t}, {self.distance_metric})"

    def anonymize(self, data: pd.DataFrame, **kwargs) -> pd.DataFrame:
        """Apply k-anonymity, then suppress groups violating t-closeness."""
        df = self._k_anon.anonymize(data.copy())
        qi_cols = [c for c in self.quasi_identifiers if c in df.columns]
        sa_cols = [c for c in self.sensitive_attributes if c in df.columns]

        if not qi_cols or not sa_cols:
            return df

        # Suppress groups that violate t-closeness
        df = self._enforce_t_closeness(df, qi_cols, sa_cols, data)
        return df

    def _enforce_t_closeness(self, df: pd.DataFrame,
                              qi_cols: List[str],
                              sa_cols: List[str],
                              original: pd.DataFrame) -> pd.DataFrame:
        """Remove groups where distance > t."""
        keep_mask = pd.Series(True, index=df.index)

        for sa in sa_cols:
            global_dist = self._get_distribution(original[sa])
            groups = df.groupby(qi_cols)

            for key, group_df in groups:
                group_dist = self._get_distribution(group_df[sa])
                distance = self._compute_distance(group_dist, global_dist, sa, original)
                
                key_str = str(key) if not isinstance(key, tuple) else str(key)
                self._group_distances[f"{key_str}_{sa}"] = distance

                if distance > self.t:
                    keep_mask[group_df.index] = False

        result = df[keep_mask].reset_index(drop=True)
        # If too many suppressed, return original k-anonymized version
        if len(result) < len(df) * 0.5:
            return df
        return result

    def _get_distribution(self, series: pd.Series) -> Dict:
        """Get value distribution as probability dict."""
        counts = series.value_counts(normalize=True)
        return counts.to_dict()

    def _compute_distance(self, group_dist: Dict, global_dist: Dict,
                           sa_col: str, original: pd.DataFrame) -> float:
        """Compute distance between group and global distribution."""
        if self.distance_metric == "emd":
            return self._earth_movers_distance(group_dist, global_dist,
                                                sa_col, original)
        elif self.distance_metric == "kl":
            return self._kl_divergence(group_dist, global_dist)
        else:
            return self._kl_divergence(group_dist, global_dist)

    def _earth_movers_distance(self, dist1: Dict, dist2: Dict,
                                sa_col: str, original: pd.DataFrame) -> float:
        """
        Earth Mover's Distance for numerical or categorical data.
        For numerical: uses ordered values.
        For categorical: uses equal ground distance (1/m for m categories).
        """
        all_vals = sorted(set(list(dist1.keys()) + list(dist2.keys())))
        if not all_vals:
            return 0.0

        m = len(all_vals)
        emd = 0.0
        cumulative = 0.0

        # Check if numerical
        is_numeric = pd.api.types.is_numeric_dtype(original[sa_col])

        for val in all_vals:
            p1 = dist1.get(val, 0.0)
            p2 = dist2.get(val, 0.0)
            cumulative += p1 - p2

            if is_numeric:
                emd += abs(cumulative)
            else:
                emd += abs(cumulative) / max(m, 1)

        return emd

    def _kl_divergence(self, dist1: Dict, dist2: Dict) -> float:
        """KL Divergence: KL(dist1 || dist2)."""
        all_vals = set(list(dist1.keys()) + list(dist2.keys()))
        epsilon = 1e-10  # Smoothing to avoid log(0)
        kl = 0.0
        for val in all_vals:
            p = dist1.get(val, epsilon)
            q = dist2.get(val, epsilon)
            if p > 0:
                kl += p * np.log(p / q)
        return abs(kl)

    def compute_closeness_report(self, df: pd.DataFrame,
                                  original: pd.DataFrame) -> pd.DataFrame:
        """Generate a report of t-closeness for all groups."""
        qi_cols = [c for c in self.quasi_identifiers if c in df.columns]
        sa_cols = [c for c in self.sensitive_attributes if c in df.columns]

        rows = []
        for sa in sa_cols:
            global_dist = self._get_distribution(original[sa])
            groups = df.groupby(qi_cols)

            for key, group_df in groups:
                group_dist = self._get_distribution(group_df[sa])
                dist = self._compute_distance(group_dist, global_dist, sa, original)
                rows.append({
                    "Group": str(key),
                    "Sensitive Attr": sa,
                    "Distance": round(dist, 4),
                    "Satisfies t": dist <= self.t,
                    "Group Size": len(group_df),
                })

        return pd.DataFrame(rows)

    def get_average_distance(self) -> float:
        """Average distance across all computed groups."""
        if not self._group_distances:
            return 0.0
        return sum(self._group_distances.values()) / len(self._group_distances)

    def _compute_privacy_score(self, original, anonymized) -> float:
        """t-closeness privacy: lower average distance = higher privacy."""
        avg_dist = self.get_average_distance()
        if avg_dist == 0:
            return 0.5
        return max(0.0, 1.0 - avg_dist / (self.t * 2))

    def _get_params(self) -> Dict[str, Any]:
        return {
            "t": self.t,
            "distance_metric": self.distance_metric,
            "k": self.k,
            "avg_distance": self.get_average_distance(),
            "groups_measured": len(self._group_distances),
            "quasi_identifiers": self.quasi_identifiers,
        }
