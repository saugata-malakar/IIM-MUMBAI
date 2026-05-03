"""
Chaos Perturbation Algorithm — Graduate-level Implementation
Uses logistic map chaotic function with Lyapunov exponent validation.

Based on:
- Original Privacy_algorithm.py (team implementation)
- "Implementing Privacy Mechanisms for Data Using Anonymization Algorithms" (drive papers)
- Devaney's definition of chaos: sensitivity to initial conditions + transitivity + dense periodic orbits

Key improvements over basic version:
1. Lyapunov exponent calculation to PROVE chaotic regime
2. Multi-seed perturbation for stronger privacy
3. Bifurcation parameter validation
4. Frequency-weighted replacement (low-frequency values first)
5. Domain-preserving scaling for numeric columns
"""

import pandas as pd
import numpy as np
import math
from typing import Dict, Any, List
from medshield.algorithms.base import BaseAnonymizer


class ChaosPerturbation(BaseAnonymizer):
    """
    Chaos-based perturbation using the logistic map: x(n+1) = λ·x(n)·(1 - x(n))

    The logistic map exhibits chaotic behavior for λ ∈ (3.57, 4.0).
    We use this to generate unpredictable but deterministic replacement values
    for low-frequency quasi-identifier values, making re-identification attacks
    computationally infeasible.

    Parameters:
        lambda_val (float): Logistic map parameter. Default 3.99 (deep chaos).
            Must be in [3.57, 4.0] for chaotic behavior.
        x0 (float): Initial condition. Default 0.1. Must be in (0, 1).
        iterations (int): Transient iterations to skip. Default 400.
        replacement_strategy (str): 'frequency' or 'all'. Default 'frequency'.
            - 'frequency': Only replace low-frequency values (log2 selection)
            - 'all': Perturb all values

    Reference: Li, T.Y. & Yorke, J.A. (1975) "Period Three Implies Chaos"
    """

    def __init__(self, quasi_identifiers: List[str] = None,
                 sensitive_attributes: List[str] = None,
                 lambda_val: float = 3.99,
                 x0: float = 0.1,
                 iterations: int = 400,
                 replacement_strategy: str = "frequency",
                 config: Dict[str, Any] = None):
        super().__init__(quasi_identifiers, sensitive_attributes, config)
        self.lambda_val = lambda_val
        self.x0 = x0
        self.iterations = iterations
        self.replacement_strategy = replacement_strategy
        self._perturbation_log = {}
        self._lyapunov_exponent = None

        # Validate chaotic regime
        if not 3.57 <= lambda_val <= 4.0:
            import warnings
            warnings.warn(
                f"λ={lambda_val} is outside chaotic regime [3.57, 4.0]. "
                "Perturbation may be periodic and predictable."
            )

    @property
    def name(self) -> str:
        return f"Chaos Perturbation (λ={self.lambda_val})"

    def _logistic_map(self, x: float) -> float:
        """One iteration of the logistic map: x(n+1) = λ·x(n)·(1 - x(n))"""
        return self.lambda_val * x * (1 - x)

    def _generate_chaotic_sequence(self, length: int, seed: float = None) -> List[float]:
        """
        Generate a chaotic sequence after skipping transient behavior.
        The first `iterations` values are discarded to ensure the orbit
        has settled onto the attractor.
        """
        x = seed if seed is not None else self.x0
        # Skip transient (burn-in period)
        for _ in range(self.iterations):
            x = self._logistic_map(x)
        # Generate sequence
        seq = []
        for _ in range(length):
            x = self._logistic_map(x)
            seq.append(x)
        return seq

    def compute_lyapunov_exponent(self, n_iterations: int = 10000) -> float:
        """
        Compute the Lyapunov exponent for the current λ value.

        λ_L = lim (1/N) Σ ln|f'(x_n)|

        For the logistic map: f'(x) = λ(1 - 2x)

        A positive Lyapunov exponent confirms chaotic behavior.
        Returns the computed exponent (should be > 0 for chaos).
        """
        x = self.x0
        lyap_sum = 0.0

        # Skip transient
        for _ in range(500):
            x = self._logistic_map(x)

        # Compute
        for _ in range(n_iterations):
            x = self._logistic_map(x)
            derivative = abs(self.lambda_val * (1 - 2 * x))
            if derivative > 0:
                lyap_sum += math.log(derivative)

        self._lyapunov_exponent = lyap_sum / n_iterations
        return self._lyapunov_exponent

    def get_bifurcation_data(self, lambda_range: tuple = (3.4, 4.0),
                              n_points: int = 200, n_last: int = 50) -> Dict:
        """
        Generate bifurcation diagram data.
        Shows how the system transitions from periodic to chaotic behavior.

        Returns dict with 'lambda_values' and 'x_values' for plotting.
        """
        lambdas = []
        x_vals = []

        for lam in np.linspace(lambda_range[0], lambda_range[1], n_points):
            x = 0.1
            # Skip transient
            for _ in range(300):
                x = lam * x * (1 - x)
            # Collect last n_last values
            for _ in range(n_last):
                x = lam * x * (1 - x)
                lambdas.append(float(lam))
                x_vals.append(float(x))

        return {
            "lambda_values": lambdas,
            "x_values": x_vals,
            "current_lambda": self.lambda_val,
            "lyapunov": self._lyapunov_exponent,
        }

    def anonymize(self, data: pd.DataFrame, **kwargs) -> pd.DataFrame:
        """Apply chaos perturbation to quasi-identifier columns."""
        df = data.copy()
        qi_cols = [c for c in self.quasi_identifiers if c in df.columns]

        # Compute Lyapunov exponent for audit
        self.compute_lyapunov_exponent()

        for col in qi_cols:
            df = self._perturb_column(df, col)

        return df

    def _perturb_column(self, df: pd.DataFrame, col: str) -> pd.DataFrame:
        """
        Perturb a single column using chaos theory.

        Strategy (from Privacy_algorithm.py):
        1. Sort unique values by frequency (ascending)
        2. Select r = ⌊log₂(|unique|)⌋ lowest-frequency values
        3. Generate chaotic replacement values
        4. Map chaotic values to the column's domain
        5. Replace selected values
        """
        value_counts = df[col].value_counts().sort_values(ascending=True)
        unique_vals = value_counts.index.tolist()
        num_unique = len(unique_vals)

        if num_unique <= 1:
            return df

        # Number of values to replace (logarithmic selection — from paper)
        if self.replacement_strategy == "frequency":
            r = max(1, round(math.log2(num_unique)))
        else:
            r = num_unique  # Replace all

        values_to_replace = unique_vals[:r]

        # Generate chaotic replacement values with unique seed per column
        col_seed = (hash(col) % 900 + 100) / 1000.0  # Deterministic seed ∈ (0.1, 1.0)
        chaotic_seq = self._generate_chaotic_sequence(r, seed=col_seed)

        is_numeric = pd.api.types.is_numeric_dtype(df[col])

        replacement_map = {}
        if is_numeric:
            col_min = df[col].min()
            col_max = df[col].max()
            col_range = col_max - col_min if col_max != col_min else 1

            for i, val in enumerate(values_to_replace):
                new_val = col_min + chaotic_seq[i] * col_range
                if pd.api.types.is_integer_dtype(df[col]):
                    new_val = int(round(new_val))
                else:
                    new_val = round(new_val, 2)
                replacement_map[val] = new_val
        else:
            # Categorical: map to existing values using chaotic index
            all_vals = unique_vals
            for i, val in enumerate(values_to_replace):
                idx = int(chaotic_seq[i] * (len(all_vals) - 1))
                replacement_map[val] = all_vals[idx]

        # Apply replacements
        df[col] = df[col].replace(replacement_map)

        # Log perturbation details
        affected_records = sum(
            value_counts[val] for val in values_to_replace if val in value_counts
        )
        self._perturbation_log[col] = {
            "values_replaced": r,
            "total_unique": num_unique,
            "affected_records": int(affected_records),
            "replacement_fraction": round(r / num_unique, 4),
            "chaotic_seed": round(col_seed, 4),
        }

        return df

    def _compute_privacy_score(self, original, anonymized) -> float:
        """
        Chaos-specific privacy score:
        1. Fraction of values actually changed (50%)
        2. Lyapunov exponent strength (25%) — higher = more chaotic = harder to predict
        3. Replacement coverage across columns (25%)
        """
        qi_cols = [c for c in self.quasi_identifiers if c in anonymized.columns]
        if not qi_cols:
            return 0.5

        # Component 1: Value change fraction
        change_score = 0.0
        for col in qi_cols:
            if col in original.columns:
                changed = (original[col] != anonymized[col]).mean()
                change_score += changed
        change_score /= len(qi_cols)

        # Component 2: Lyapunov exponent strength
        lyap = self._lyapunov_exponent or 0
        lyap_score = min(max(lyap / 0.7, 0), 1.0)  # λ_L ≈ 0.7 at λ=4.0

        # Component 3: Column coverage
        cols_perturbed = sum(1 for col in qi_cols if col in self._perturbation_log)
        coverage = cols_perturbed / len(qi_cols)

        return 0.5 * change_score + 0.25 * lyap_score + 0.25 * coverage

    def _get_params(self) -> Dict[str, Any]:
        return {
            "lambda": self.lambda_val,
            "x0": self.x0,
            "iterations": self.iterations,
            "replacement_strategy": self.replacement_strategy,
            "lyapunov_exponent": self._lyapunov_exponent,
            "is_chaotic": (self._lyapunov_exponent or 0) > 0,
            "perturbation_log": self._perturbation_log,
            "quasi_identifiers": self.quasi_identifiers,
        }
