"""
Visualization module for MedShield benchmark results.
Generates interactive Plotly charts and static matplotlib plots.
"""

import pandas as pd
import numpy as np
from typing import List, Optional
from medshield.algorithms.base import AnonymizationResult

try:
    import plotly.graph_objects as go
    import plotly.express as px
    from plotly.subplots import make_subplots
    HAS_PLOTLY = True
except ImportError:
    HAS_PLOTLY = False

try:
    import matplotlib.pyplot as plt
    import matplotlib
    matplotlib.use('Agg')
    HAS_MPL = True
except ImportError:
    HAS_MPL = False


class Visualizer:
    """Generate benchmark comparison visualizations."""

    @staticmethod
    def privacy_utility_scatter(results: List[AnonymizationResult],
                                 output_path: str = None) -> Optional[object]:
        """Privacy vs Utility tradeoff scatter plot."""
        if not results:
            return None
        names = [r.algorithm_name for r in results]
        privacy = [r.privacy_score for r in results]
        utility = [r.utility_score for r in results]

        if HAS_PLOTLY:
            fig = go.Figure()
            fig.add_trace(go.Scatter(
                x=privacy, y=utility, mode='markers+text',
                text=names, textposition="top center",
                marker=dict(size=15, color=list(range(len(results))),
                            colorscale='Viridis', showscale=True),
            ))
            fig.update_layout(
                title="Privacy-Utility Tradeoff",
                xaxis_title="Privacy Score →",
                yaxis_title="Utility Score →",
                template="plotly_dark",
            )
            if output_path:
                fig.write_html(output_path)
            return fig
        elif HAS_MPL:
            fig, ax = plt.subplots(figsize=(10, 6))
            ax.scatter(privacy, utility, s=100, c=range(len(results)), cmap='viridis')
            for i, name in enumerate(names):
                ax.annotate(name, (privacy[i], utility[i]), fontsize=8,
                           ha='center', va='bottom')
            ax.set_xlabel("Privacy Score")
            ax.set_ylabel("Utility Score")
            ax.set_title("Privacy-Utility Tradeoff")
            ax.grid(True, alpha=0.3)
            if output_path:
                fig.savefig(output_path, dpi=150, bbox_inches='tight')
            return fig
        return None

    @staticmethod
    def metrics_comparison_bar(results: List[AnonymizationResult],
                                output_path: str = None) -> Optional[object]:
        """Side-by-side bar chart comparing all metrics."""
        if not results:
            return None
        names = [r.algorithm_name for r in results]
        metrics = {
            "Privacy": [r.privacy_score for r in results],
            "Utility": [r.utility_score for r in results],
            "1 - Disclosure Risk": [1 - r.disclosure_risk for r in results],
            "1 - Info Loss": [1 - r.information_loss for r in results],
        }

        if HAS_PLOTLY:
            fig = go.Figure()
            for metric_name, values in metrics.items():
                fig.add_trace(go.Bar(name=metric_name, x=names, y=values))
            fig.update_layout(
                barmode='group', title="Algorithm Comparison",
                yaxis_title="Score (higher = better)",
                template="plotly_dark",
            )
            if output_path:
                fig.write_html(output_path)
            return fig
        elif HAS_MPL:
            fig, ax = plt.subplots(figsize=(12, 6))
            x = np.arange(len(names))
            width = 0.2
            for i, (mname, vals) in enumerate(metrics.items()):
                ax.bar(x + i * width, vals, width, label=mname)
            ax.set_xticks(x + width * 1.5)
            ax.set_xticklabels(names, rotation=30, ha='right')
            ax.set_ylabel("Score")
            ax.set_title("Algorithm Comparison")
            ax.legend()
            ax.grid(axis='y', alpha=0.3)
            if output_path:
                fig.savefig(output_path, dpi=150, bbox_inches='tight')
            return fig
        return None

    @staticmethod
    def performance_chart(results: List[AnonymizationResult],
                           output_path: str = None) -> Optional[object]:
        """Horizontal bar chart of processing times."""
        if not results:
            return None
        names = [r.algorithm_name for r in results]
        times = [r.processing_time_ms for r in results]

        if HAS_MPL:
            fig, ax = plt.subplots(figsize=(10, 5))
            colors = plt.cm.RdYlGn_r(np.linspace(0.2, 0.8, len(results)))
            ax.barh(names, times, color=colors)
            ax.set_xlabel("Processing Time (ms)")
            ax.set_title("Algorithm Performance")
            if output_path:
                fig.savefig(output_path, dpi=150, bbox_inches='tight')
            return fig
        return None

    @staticmethod
    def radar_chart(results: List[AnonymizationResult],
                     output_path: str = None) -> Optional[object]:
        """Radar chart comparing algorithms across all dimensions."""
        if not HAS_PLOTLY or not results:
            return None
        categories = ['Privacy', 'Utility', '1-Disclosure', '1-InfoLoss', 'Speed']
        fig = go.Figure()
        max_time = max(r.processing_time_ms for r in results) or 1
        for r in results:
            values = [
                r.privacy_score,
                r.utility_score,
                1 - r.disclosure_risk,
                1 - r.information_loss,
                1 - (r.processing_time_ms / max_time),
            ]
            fig.add_trace(go.Scatterpolar(r=values, theta=categories,
                                          fill='toself', name=r.algorithm_name))
        fig.update_layout(
            polar=dict(radialaxis=dict(visible=True, range=[0, 1])),
            title="Algorithm Radar Comparison",
            template="plotly_dark",
        )
        if output_path:
            fig.write_html(output_path)
        return fig
