"""
Privacy & Utility Metrics for MedShield
Centralized metric calculations for algorithm comparison.
"""

import pandas as pd
import numpy as np
from typing import Dict, List
from scipy import stats


class PrivacyMetrics:
    """Comprehensive metrics calculator for anonymization evaluation."""

    @staticmethod
    def k_anonymity_score(df: pd.DataFrame, qi_cols: List[str]) -> Dict:
        """Compute actual k-value and distribution of equivalence class sizes."""
        cols = [c for c in qi_cols if c in df.columns]
        if not cols:
            return {"k_achieved": 0, "avg_group_size": 0, "singleton_ratio": 0}
        groups = df.groupby(cols).size()
        return {
            "k_achieved": int(groups.min()),
            "avg_group_size": round(float(groups.mean()), 2),
            "max_group_size": int(groups.max()),
            "singleton_ratio": round(float((groups == 1).sum() / len(groups)), 4),
            "num_groups": len(groups),
        }

    @staticmethod
    def l_diversity_score(df: pd.DataFrame, qi_cols: List[str],
                          sa_col: str) -> Dict:
        """Compute ℓ-diversity: min distinct sensitive values per group."""
        cols = [c for c in qi_cols if c in df.columns]
        if not cols or sa_col not in df.columns:
            return {"l_achieved": 0, "avg_diversity": 0}
        groups = df.groupby(cols)[sa_col].nunique()
        return {
            "l_achieved": int(groups.min()),
            "avg_diversity": round(float(groups.mean()), 2),
            "min_diversity": int(groups.min()),
            "max_diversity": int(groups.max()),
        }

    @staticmethod
    def t_closeness_score(df: pd.DataFrame, qi_cols: List[str],
                          sa_col: str) -> Dict:
        """Compute t-closeness: max KL divergence across groups."""
        cols = [c for c in qi_cols if c in df.columns]
        if not cols or sa_col not in df.columns:
            return {"max_distance": 0, "avg_distance": 0}
        global_dist = df[sa_col].value_counts(normalize=True)
        distances = []
        for _, group in df.groupby(cols):
            group_dist = group[sa_col].value_counts(normalize=True)
            # KL divergence
            kl = 0.0
            for val in set(list(global_dist.index) + list(group_dist.index)):
                p = group_dist.get(val, 1e-10)
                q = global_dist.get(val, 1e-10)
                kl += p * np.log(max(p, 1e-10) / max(q, 1e-10))
            distances.append(abs(kl))
        return {
            "max_distance": round(max(distances) if distances else 0, 4),
            "avg_distance": round(float(np.mean(distances)) if distances else 0, 4),
            "min_distance": round(min(distances) if distances else 0, 4),
        }

    @staticmethod
    def mean_absolute_error(original: pd.Series, anonymized: pd.Series) -> float:
        """MAE between original and anonymized numeric columns."""
        common = original.index.intersection(anonymized.index)
        if len(common) == 0:
            return 0.0
        return float(np.mean(np.abs(original.loc[common] - anonymized.loc[common])))

    @staticmethod
    def correlation_preservation(orig_df: pd.DataFrame,
                                  anon_df: pd.DataFrame) -> float:
        """How well correlations between numeric columns are preserved."""
        num_cols = orig_df.select_dtypes(include=[np.number]).columns
        common = [c for c in num_cols if c in anon_df.columns]
        if len(common) < 2:
            return 1.0
        orig_corr = orig_df[common].corr().values.flatten()
        anon_corr = anon_df[common].corr().values.flatten()
        # Remove NaNs
        mask = ~(np.isnan(orig_corr) | np.isnan(anon_corr))
        if mask.sum() == 0:
            return 1.0
        return float(np.corrcoef(orig_corr[mask], anon_corr[mask])[0, 1])

    @staticmethod
    def statistical_similarity(original: pd.DataFrame,
                                anonymized: pd.DataFrame) -> Dict:
        """Compare statistical properties: mean, std, skew, kurtosis."""
        num_cols = original.select_dtypes(include=[np.number]).columns
        common = [c for c in num_cols if c in anonymized.columns]
        results = {}
        for col in common:
            o, a = original[col].dropna(), anonymized[col].dropna()
            results[col] = {
                "mean_diff": round(abs(o.mean() - a.mean()), 4),
                "std_ratio": round(a.std() / max(o.std(), 1e-10), 4),
                "ks_statistic": round(float(stats.ks_2samp(o, a).statistic), 4),
            }
        return results

    @staticmethod
    def disclosure_risk(original: pd.DataFrame, anonymized: pd.DataFrame,
                         qi_cols: List[str]) -> float:
        """Proportion of records that can be uniquely re-identified."""
        cols = [c for c in qi_cols if c in anonymized.columns]
        if not cols:
            return 0.0
        groups = anonymized.groupby(cols).size()
        singletons = (groups == 1).sum()
        return round(float(singletons / max(len(groups), 1)), 4)

    @staticmethod
    def information_loss(original: pd.DataFrame,
                          anonymized: pd.DataFrame) -> float:
        """Combined metric: column loss + distribution shift + generalization loss."""
        # Column removal
        orig_cols = set(original.columns)
        anon_cols = set(anonymized.columns)
        col_loss = len(orig_cols - anon_cols) / max(len(orig_cols), 1)
        # Numeric distribution shift
        num_cols = [c for c in orig_cols & anon_cols
                    if original[c].dtype in ['float64', 'int64']
                    and anonymized[c].dtype in ['float64', 'int64']]
        dist_shift = 0.0
        for col in num_cols:
            o_std = original[col].std()
            a_std = anonymized[col].std()
            if o_std > 0:
                dist_shift += min(abs(o_std - a_std) / o_std, 1.0)
        avg_dist = dist_shift / max(len(num_cols), 1)
        # Categorical generalization (check for '*' characters)
        cat_cols = [c for c in orig_cols & anon_cols
                    if original[c].dtype == 'object' and anonymized[c].dtype == 'object']
        gen_loss = 0.0
        for col in cat_cols:
            star_ratio = anonymized[col].astype(str).str.contains(r'\*').mean()
            gen_loss += star_ratio
        avg_gen = gen_loss / max(len(cat_cols), 1)

        return round((col_loss + avg_dist + avg_gen) / 3, 4)
