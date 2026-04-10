"""
Unified Evaluation Framework for Anonymization Algorithms
Runs all algorithms on same data and produces comparative analysis
"""

import pandas as pd
import numpy as np
from typing import List, Dict, Any
import time
import json
from datetime import datetime
import matplotlib.pyplot as plt
import seaborn as sns


class AnonymizationBenchmark:
    """
    Benchmarking framework for comparing multiple anonymization algorithms
    on the same dataset
    """
    
    def __init__(self, dataset: pd.DataFrame, config: Dict[str, Any] = None):
        self.original_data = dataset.copy()
        self.config = config or {}
        self.results = []
        self.comparison_df = None
        
    def run_algorithms(self,
                      algorithms: List) -> pd.DataFrame:
        """
        Run all provided algorithms on the dataset
        
        Args:
            algorithms: List of BaseAnonymizationAlgorithm instances
            
        Returns:
            DataFrame with metrics for each algorithm
        """
        results = []
        
        for algo in algorithms:
            print(f"\n🔄 Running {algo.algorithm_name}...")
            
            start_time = time.time()
            try:
                # Anonymize
                anonymized_data = algo.anonymize(self.original_data)
                
                # Evaluate
                metrics = algo.evaluate(self.original_data, anonymized_data)
                
                elapsed_ms = (time.time() - start_time) * 1000
                metrics.processing_time_ms = elapsed_ms
                
                results.append(metrics)
                print(f"✅ {algo.algorithm_name} completed in {elapsed_ms:.2f}ms")
                
            except Exception as e:
                print(f"❌ {algo.algorithm_name} failed: {str(e)}")
                continue
        
        self.results = results
        return self._create_comparison_table()
    
    def _create_comparison_table(self) -> pd.DataFrame:
        """Convert metrics to comparison DataFrame"""
        
        data = []
        for metric in self.results:
            data.append({
                'Algorithm': metric.algorithm_name,
                'Privacy Score': round(metric.privacy_score, 4),
                'Utility Score': round(metric.utility_score, 4),
                'Disclosure Risk': round(metric.disclosure_risk, 4),
                'Information Loss': round(metric.information_loss, 4),
                'Time (ms)': round(metric.processing_time_ms, 2),
                'Records': metric.records_processed,
                'Timestamp': metric.timestamp
            })
        
        self.comparison_df = pd.DataFrame(data)
        return self.comparison_df
    
    def get_comparison_table(self, sort_by='Privacy Score') -> pd.DataFrame:
        """Get sorted comparison table"""
        if self.comparison_df is None:
            return pd.DataFrame()
        
        df = self.comparison_df.copy()
        if sort_by in df.columns:
            df = df.sort_values(by=sort_by, ascending=False)
        
        return df
    
    def get_tradeoff_analysis(self) -> Dict[str, Any]:
        """
        Analyze privacy-utility tradeoffs
        
        Returns:
            Dictionary with analysis:
            - best_privacy: Algorithm with highest privacy
            - best_utility: Algorithm with highest utility
            - balanced: Algorithm with best privacy-utility ratio
            - rankings: Full rankings by various criteria
        """
        
        if self.comparison_df is None or len(self.comparison_df) == 0:
            return {}
        
        df = self.comparison_df
        
        analysis = {
            'best_privacy': df.loc[df['Privacy Score'].idxmax(), 'Algorithm'],
            'best_utility': df.loc[df['Utility Score'].idxmax(), 'Algorithm'],
            'fastest': df.loc[df['Time (ms)'].idxmin(), 'Algorithm'],
            'lowest_disclosure_risk': df.loc[df['Disclosure Risk'].idxmin(), 'Algorithm'],
            
            # Privacy-Utility Ratio (higher is better for both)
            'most_balanced': self._calculate_balanced_score(df),
            
            'full_rankings': {
                'by_privacy': df.nlargest(5, 'Privacy Score')[['Algorithm', 'Privacy Score']].to_dict('records'),
                'by_utility': df.nlargest(5, 'Utility Score')[['Algorithm', 'Utility Score']].to_dict('records'),
                'by_speed': df.nsmallest(5, 'Time (ms)')[['Algorithm', 'Time (ms)']].to_dict('records'),
                'by_disclosure_risk': df.nsmallest(5, 'Disclosure Risk')[['Algorithm', 'Disclosure Risk']].to_dict('records'),
            }
        }
        
        return analysis
    
    @staticmethod
    def _calculate_balanced_score(df: pd.DataFrame) -> str:
        """Calculate which algorithm balances privacy and utility best"""
        df['Balance Score'] = (df['Privacy Score'] + df['Utility Score']) / 2 - df['Disclosure Risk']
        return df.loc[df['Balance Score'].idxmax(), 'Algorithm']
    
    def generate_report(self, output_file: str = None) -> str:
        """
        Generate comprehensive comparison report
        
        Args:
            output_file: Path to save report (optional)
            
        Returns:
            Report string
        """
        
        if self.comparison_df is None or len(self.comparison_df) == 0:
            return "No results to report. Run algorithms first."
        
        analysis = self.get_tradeoff_analysis()
        
        report = f"""
{'='*80}
ANONYMIZATION ALGORITHM COMPARISON REPORT
Generated: {datetime.now().isoformat()}
{'='*80}

DATASET SUMMARY
{'-'*80}
Records: {len(self.original_data)}
Columns: {len(self.original_data.columns)}
Columns: {', '.join(self.original_data.columns.tolist())}

ALGORITHMS TESTED: {len(self.results)}

COMPARISON TABLE
{'-'*80}
{self.comparison_df.to_string(index=False)}

KEY FINDINGS
{'-'*80}
🏆 BEST PRIVACY SCORE:       {analysis.get('best_privacy', 'N/A')}
📊 BEST UTILITY SCORE:       {analysis.get('best_utility', 'N/A')}
⚡ FASTEST EXECUTION:        {analysis.get('fastest', 'N/A')}
🔒 LOWEST DISCLOSURE RISK:   {analysis.get('lowest_disclosure_risk', 'N/A')}
⚖️  MOST BALANCED:            {analysis.get('most_balanced', 'N/A')}

PRIVACY-UTILITY ANALYSIS
{'-'*80}
The privacy-utility tradeoff shows:
- Algorithms with higher privacy sacrifice utility and vice versa
- Check the comparison table for specific tradeoffs
- Consider use case when selecting algorithm

RECOMMENDATIONS
{'-'*80}

1. FOR MAXIMUM PRIVACY:
   Use: {analysis.get('best_privacy', 'N/A')}
   
2. FOR DATA UTILITY:
   Use: {analysis.get('best_utility', 'N/A')}
   
3. BALANCED APPROACH:
   Use: {analysis.get('most_balanced', 'N/A')}
   (Recommended for most medical use cases)
   
4. FOR SPEED-CRITICAL APPLICATIONS:
   Use: {analysis.get('fastest', 'N/A')}

DETAILED RANKINGS
{'-'*80}

Top Algorithms by Privacy Score:
{json.dumps(analysis.get('full_rankings', {}).get('by_privacy', []), indent=2)}

Top Algorithms by Utility Score:
{json.dumps(analysis.get('full_rankings', {}).get('by_utility', []), indent=2)}

Top Algorithms by Speed:
{json.dumps(analysis.get('full_rankings', {}).get('by_speed', []), indent=2)}

Top Algorithms by Low Disclosure Risk:
{json.dumps(analysis.get('full_rankings', {}).get('by_disclosure_risk', []), indent=2)}

{'='*80}
END OF REPORT
{'='*80}
"""
        
        if output_file:
            with open(output_file, 'w') as f:
                f.write(report)
            print(f"✅ Report saved to {output_file}")
        
        return report
    
    def generate_visualizations(self, output_dir: str = None) -> Dict[str, str]:
        """Generate comparison charts"""
        
        if self.comparison_df is None or len(self.comparison_df) == 0:
            return {}
        
        df = self.comparison_df
        outputs = {}
        
        # 1. Privacy vs Utility Scatter
        fig, ax = plt.subplots(figsize=(10, 6))
        scatter = ax.scatter(df['Utility Score'], df['Privacy Score'], 
                            s=200, alpha=0.6, c=df['Disclosure Risk'], 
                            cmap='RdYlGn_r')
        
        for idx, row in df.iterrows():
            ax.annotate(row['Algorithm'], 
                       (row['Utility Score'], row['Privacy Score']),
                       xytext=(5, 5), textcoords='offset points', fontsize=9)
        
        ax.set_xlabel('Utility Score →', fontsize=12)
        ax.set_ylabel('Privacy Score →', fontsize=12)
        ax.set_title('Privacy-Utility Tradeoff Analysis', fontsize=14, fontweight='bold')
        cbar = plt.colorbar(scatter, ax=ax)
        cbar.set_label('Disclosure Risk', fontsize=10)
        ax.grid(True, alpha=0.3)
        
        if output_dir:
            path = f"{output_dir}/privacy_utility_tradeoff.png"
            fig.savefig(path, dpi=300, bbox_inches='tight')
            outputs['tradeoff'] = path
        plt.close()
        
        # 2. Metrics Comparison Bar Chart
        fig, ax = plt.subplots(figsize=(12, 6))
        x = np.arange(len(df))
        width = 0.2
        
        ax.bar(x - 1.5*width, df['Privacy Score'], width, label='Privacy', alpha=0.8)
        ax.bar(x - 0.5*width, df['Utility Score'], width, label='Utility', alpha=0.8)
        ax.bar(x + 0.5*width, 1 - df['Disclosure Risk'], width, label='Low Risk', alpha=0.8)
        ax.bar(x + 1.5*width, 1 - df['Information Loss'], width, label='Low Loss', alpha=0.8)
        
        ax.set_xlabel('Algorithm', fontsize=12)
        ax.set_ylabel('Score', fontsize=12)
        ax.set_title('Algorithm Metrics Comparison', fontsize=14, fontweight='bold')
        ax.set_xticks(x)
        ax.set_xticklabels(df['Algorithm'], rotation=45, ha='right')
        ax.legend()
        ax.grid(True, alpha=0.3, axis='y')
        ax.set_ylim([0, 1.1])
        
        if output_dir:
            path = f"{output_dir}/metrics_comparison.png"
            fig.savefig(path, dpi=300, bbox_inches='tight')
            outputs['metrics'] = path
        plt.close()
        
        # 3. Performance (Time)
        fig, ax = plt.subplots(figsize=(10, 6))
        colors = plt.cm.viridis(np.linspace(0, 1, len(df)))
        bars = ax.barh(df['Algorithm'], df['Time (ms)'], color=colors)
        
        ax.set_xlabel('Processing Time (milliseconds)', fontsize=12)
        ax.set_title('Algorithm Performance (Lower is Better)', fontsize=14, fontweight='bold')
        ax.grid(True, alpha=0.3, axis='x')
        
        # Add value labels
        for i, (idx, row) in enumerate(df.iterrows()):
            ax.text(row['Time (ms)'], i, f" {row['Time (ms)']:.2f}ms", 
                   va='center', fontsize=9)
        
        if output_dir:
            path = f"{output_dir}/performance_comparison.png"
            fig.savefig(path, dpi=300, bbox_inches='tight')
            outputs['performance'] = path
        plt.close()
        
        return outputs


# ============= Usage Example =============

"""
# Example usage:
from base_algorithm import ChaosPerturbationAnonymization
from generalization import GeneralizationAlgorithm  # To be implemented
from perturbation import PerturbationAlgorithm      # To be implemented

# Prepare test data
test_data = pd.read_csv('your_dataset.csv')

# Define algorithms to compare
algos = [
    ChaosPerturbationAnonymization({
        'quasi_identifiers': ['age', 'gender', 'location'],
        'lambda_val': 3.99
    }),
    GeneralizationAlgorithm({
        'quasi_identifiers': ['age', 'gender', 'location'],
        'k_value': 5
    }),
    PerturbationAlgorithm({...})
]

# Run benchmark
benchmark = AnonymizationBenchmark(test_data)
comparison_table = benchmark.run_algorithms(algos)

print(benchmark.get_comparison_table())
print(benchmark.get_tradeoff_analysis())
print(benchmark.generate_report())
benchmark.generate_visualizations('./output/')
"""
