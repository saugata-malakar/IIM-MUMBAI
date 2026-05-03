"""
Benchmark Runner — Runs all algorithms on same dataset and compares results.
"""

import pandas as pd
import time
from typing import List, Dict
from medshield.algorithms.base import BaseAnonymizer, AnonymizationResult


class Benchmark:
    """
    Comparative benchmarking framework.
    Runs multiple algorithms on the same dataset and produces comparison tables.
    """

    def __init__(self):
        self.results: List[AnonymizationResult] = []

    def run(self, data: pd.DataFrame,
            algorithms: List[BaseAnonymizer],
            verbose: bool = True) -> pd.DataFrame:
        """Run all algorithms and collect results."""
        self.results = []
        for algo in algorithms:
            if verbose:
                print(f"  Running {algo.name}...", end=" ")
            try:
                result = algo.run(data)
                self.results.append(result)
                if verbose:
                    print(f"✅ ({result.processing_time_ms:.0f}ms, "
                          f"P={result.privacy_score:.3f}, U={result.utility_score:.3f})")
            except Exception as e:
                if verbose:
                    print(f"❌ Error: {e}")
        return self.comparison_table()

    def comparison_table(self) -> pd.DataFrame:
        """Generate comparison DataFrame from results."""
        if not self.results:
            return pd.DataFrame()
        rows = [r.summary_dict() for r in self.results]
        df = pd.DataFrame(rows)
        return df.sort_values("Privacy", ascending=False).reset_index(drop=True)

    def best_by(self, metric: str = "Privacy") -> AnonymizationResult:
        """Get the best algorithm by a specific metric."""
        if not self.results:
            return None
        key_map = {
            "Privacy": "privacy_score",
            "Utility": "utility_score",
            "Disclosure Risk": "disclosure_risk",
            "Info Loss": "information_loss",
            "Time (ms)": "processing_time_ms",
        }
        attr = key_map.get(metric, "privacy_score")
        if attr == "disclosure_risk" or attr == "information_loss" or attr == "processing_time_ms":
            return min(self.results, key=lambda r: getattr(r, attr))
        return max(self.results, key=lambda r: getattr(r, attr))

    def tradeoff_analysis(self) -> Dict:
        """Find best privacy, best utility, and best balanced algorithm."""
        if not self.results:
            return {}
        best_priv = max(self.results, key=lambda r: r.privacy_score)
        best_util = max(self.results, key=lambda r: r.utility_score)
        # Balanced = highest (privacy + utility) / 2
        best_bal = max(self.results,
                       key=lambda r: (r.privacy_score + r.utility_score) / 2)
        return {
            "best_privacy": {"algorithm": best_priv.algorithm_name,
                             "score": best_priv.privacy_score},
            "best_utility": {"algorithm": best_util.algorithm_name,
                             "score": best_util.utility_score},
            "best_balanced": {"algorithm": best_bal.algorithm_name,
                              "privacy": best_bal.privacy_score,
                              "utility": best_bal.utility_score},
        }

    def generate_report(self) -> str:
        """Generate text report of benchmark results."""
        if not self.results:
            return "No results to report."
        lines = [
            "=" * 70,
            "  MedShield Benchmark Report",
            "=" * 70, "",
        ]
        table = self.comparison_table()
        lines.append(table.to_string(index=False))
        lines.append("")
        ta = self.tradeoff_analysis()
        if ta:
            lines.append("--- Tradeoff Analysis ---")
            lines.append(f"  Best Privacy:  {ta['best_privacy']['algorithm']} "
                         f"(score={ta['best_privacy']['score']:.3f})")
            lines.append(f"  Best Utility:  {ta['best_utility']['algorithm']} "
                         f"(score={ta['best_utility']['score']:.3f})")
            lines.append(f"  Best Balanced: {ta['best_balanced']['algorithm']} "
                         f"(P={ta['best_balanced']['privacy']:.3f}, "
                         f"U={ta['best_balanced']['utility']:.3f})")
        lines.append("=" * 70)
        return "\n".join(lines)
