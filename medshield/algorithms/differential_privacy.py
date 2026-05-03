"""
Differential Privacy Algorithm
Adds calibrated Laplace or Gaussian noise to achieve (ε, δ)-differential privacy.

Reference: Dwork C. (2006) "Differential Privacy"
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, List
from medshield.algorithms.base import BaseAnonymizer


class DifferentialPrivacy(BaseAnonymizer):
    """
    Differential Privacy via Laplace or Gaussian mechanism.
    
    Parameters:
        epsilon (float): Privacy budget. Lower = more private. Default 1.0.
        delta (float): Failure probability for Gaussian mechanism. Default 1e-5.
        mechanism (str): 'laplace' or 'gaussian'. Default 'laplace'.
        sensitivity (float): Global sensitivity. Auto-calculated if None.
        numeric_only (bool): If True, only add noise to numeric columns. Default True.
    """

    def __init__(self, quasi_identifiers: List[str] = None,
                 sensitive_attributes: List[str] = None,
                 epsilon: float = 1.0,
                 delta: float = 1e-5,
                 mechanism: str = "laplace",
                 sensitivity: float = None,
                 numeric_only: bool = True,
                 config: Dict[str, Any] = None):
        super().__init__(quasi_identifiers, sensitive_attributes, config)
        self.epsilon = epsilon
        self.delta = delta
        self.mechanism = mechanism.lower()
        self.sensitivity = sensitivity
        self.numeric_only = numeric_only
        self._noise_stats = {}

    @property
    def name(self) -> str:
        return f"Differential Privacy (ε={self.epsilon}, {self.mechanism})"

    def anonymize(self, data: pd.DataFrame, **kwargs) -> pd.DataFrame:
        """Add DP noise to specified columns."""
        df = data.copy()
        target_cols = self._get_target_columns(df)

        for col in target_cols:
            if pd.api.types.is_numeric_dtype(df[col]):
                df[col] = self._add_noise_numeric(df[col])
            else:
                # For categorical: use exponential mechanism (randomized response)
                if not self.numeric_only:
                    df[col] = self._randomized_response(df[col])
        return df

    def _get_target_columns(self, df: pd.DataFrame) -> List[str]:
        """Determine which columns to apply noise to."""
        if self.quasi_identifiers:
            return [c for c in self.quasi_identifiers if c in df.columns]
        if self.numeric_only:
            return df.select_dtypes(include=[np.number]).columns.tolist()
        return df.columns.tolist()

    def _add_noise_numeric(self, series: pd.Series) -> pd.Series:
        """Add Laplace or Gaussian noise to a numeric column."""
        sens = self.sensitivity or self._calculate_sensitivity(series)
        n = len(series)

        if self.mechanism == "laplace":
            scale = sens / self.epsilon
            noise = np.random.laplace(0, scale, n)
        elif self.mechanism == "gaussian":
            sigma = (sens * np.sqrt(2 * np.log(1.25 / self.delta))) / self.epsilon
            noise = np.random.normal(0, sigma, n)
        else:
            raise ValueError(f"Unknown mechanism: {self.mechanism}")

        self._noise_stats[series.name] = {
            "sensitivity": sens,
            "noise_mean": float(np.mean(noise)),
            "noise_std": float(np.std(noise)),
        }

        result = series + noise
        # Preserve integer type if original was integer
        if pd.api.types.is_integer_dtype(series):
            result = result.round().astype(int)
        return result

    def _randomized_response(self, series: pd.Series) -> pd.Series:
        """
        Exponential mechanism for categorical data.
        With probability p = e^ε / (e^ε + |domain| - 1), keep true value.
        Otherwise, pick uniformly from domain.
        """
        domain = series.unique()
        domain_size = len(domain)
        p_true = np.exp(self.epsilon) / (np.exp(self.epsilon) + domain_size - 1)

        def randomize(val):
            if np.random.random() < p_true:
                return val
            return np.random.choice(domain)

        return series.apply(randomize)

    def _calculate_sensitivity(self, series: pd.Series) -> float:
        """Auto-calculate global sensitivity as range of values.
        Uses robust estimation: IQR-based range to reduce outlier impact."""
        if len(series) == 0:
            return 1.0
        # Use IQR-based range for robustness against outliers
        q1 = series.quantile(0.01)
        q99 = series.quantile(0.99)
        iqr_range = float(q99 - q1)
        full_range = float(series.max() - series.min())
        # Take the smaller of IQR-based and full range
        return max(min(iqr_range, full_range), 1.0)

    def _compute_privacy_score(self, original, anonymized) -> float:
        """DP-specific privacy score based on epsilon."""
        # Lower epsilon = higher privacy
        if self.epsilon <= 0.1:
            return 1.0
        elif self.epsilon <= 0.5:
            return 0.9
        elif self.epsilon <= 1.0:
            return 0.75
        elif self.epsilon <= 2.0:
            return 0.5
        else:
            return max(0.1, 1.0 - self.epsilon / 10.0)

    def _compute_utility_score(self, original, anonymized) -> float:
        """Measure mean preservation after noise addition."""
        target_cols = self._get_target_columns(original)
        num_cols = [c for c in target_cols
                    if c in original.columns and c in anonymized.columns
                    and pd.api.types.is_numeric_dtype(original[c])]
        if not num_cols:
            return 0.5

        total = 0.0
        for col in num_cols:
            orig_mean = original[col].mean()
            anon_mean = anonymized[col].mean()
            if orig_mean != 0:
                total += max(0, 1 - abs(orig_mean - anon_mean) / abs(orig_mean))
            else:
                total += 1.0 if abs(anon_mean) < 1e-6 else 0.5
        return total / len(num_cols)

    def _get_params(self) -> Dict[str, Any]:
        return {
            "epsilon": self.epsilon,
            "delta": self.delta,
            "mechanism": self.mechanism,
            "sensitivity": self.sensitivity,
            "noise_stats": self._noise_stats,
            "quasi_identifiers": self.quasi_identifiers,
        }
