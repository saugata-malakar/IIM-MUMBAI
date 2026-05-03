"""
MedShield Benchmark Runner
Run all anonymization algorithms on a dataset and generate comparative report.

Usage:
    python run_benchmark.py                          # Run on synthetic data
    python run_benchmark.py --data your_data.csv     # Run on custom CSV
    python run_benchmark.py --output results/        # Save outputs to dir
"""

import argparse
import sys
import os
import time
from pathlib import Path

import pandas as pd
import numpy as np

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent))

from medshield.algorithms.k_anonymity import KAnonymity
from medshield.algorithms.l_diversity import LDiversity
from medshield.algorithms.t_closeness import TCloseness
from medshield.algorithms.differential_privacy import DifferentialPrivacy
from medshield.algorithms.chaos_perturbation import ChaosPerturbation
from medshield.algorithms.pseudonymization import Pseudonymization
from medshield.algorithms.pii_redaction import PIIRedactor
from medshield.evaluation.benchmark import Benchmark
from medshield.evaluation.metrics import PrivacyMetrics
from medshield.data.loader import SyntheticGenerator, DataLoader


BANNER = """
╔═══════════════════════════════════════════════════════════════╗
║          🛡️  MedShield — Anonymization Benchmark  🛡️          ║
║     India's First DPDP-Compliant Medical Data Toolkit        ║
║                    IIM Mumbai Research                        ║
╚═══════════════════════════════════════════════════════════════╝
"""


def create_algorithms(qi_cols, sa_cols):
    """Instantiate all 7 algorithms with default parameters."""
    return [
        KAnonymity(quasi_identifiers=qi_cols, sensitive_attributes=sa_cols,
                    k=5),
        KAnonymity(quasi_identifiers=qi_cols, sensitive_attributes=sa_cols,
                    k=10),
        LDiversity(quasi_identifiers=qi_cols, sensitive_attributes=sa_cols,
                    l=3, variant="distinct"),
        LDiversity(quasi_identifiers=qi_cols, sensitive_attributes=sa_cols,
                    l=3, variant="entropy"),
        TCloseness(quasi_identifiers=qi_cols, sensitive_attributes=sa_cols,
                    t=0.3, distance_metric="emd"),
        TCloseness(quasi_identifiers=qi_cols, sensitive_attributes=sa_cols,
                    t=0.3, distance_metric="kl"),
        DifferentialPrivacy(quasi_identifiers=qi_cols, epsilon=0.5,
                            mechanism="laplace"),
        DifferentialPrivacy(quasi_identifiers=qi_cols, epsilon=1.0,
                            mechanism="laplace"),
        DifferentialPrivacy(quasi_identifiers=qi_cols, epsilon=2.0,
                            mechanism="gaussian"),
        ChaosPerturbation(quasi_identifiers=qi_cols, lambda_val=3.99),
        Pseudonymization(quasi_identifiers=qi_cols,
                         identifier_columns=['patient_id', 'name', 'email', 'phone']),
    ]


def run_structured_benchmark(data, qi_cols, sa_cols, output_dir):
    """Run benchmark on structured data."""
    print("\n📊 Structured Data Benchmark")
    print(f"   Dataset: {len(data)} records × {len(data.columns)} columns")
    print(f"   Quasi-identifiers: {qi_cols}")
    print(f"   Sensitive attributes: {sa_cols}")
    print("-" * 60)

    algorithms = create_algorithms(qi_cols, sa_cols)
    bench = Benchmark()
    table = bench.run(data, algorithms)

    print("\n" + bench.generate_report())

    # Save results
    if output_dir:
        out = Path(output_dir)
        out.mkdir(parents=True, exist_ok=True)
        table.to_csv(out / "benchmark_comparison.csv", index=False)
        print(f"\n💾 Results saved to {out / 'benchmark_comparison.csv'}")

        # Save anonymized outputs
        for result in bench.results:
            safe_name = result.algorithm_name.replace(" ", "_").replace("(", "").replace(")", "")
            result.anonymized_data.to_csv(
                out / f"anonymized_{safe_name}.csv", index=False)

        # Generate audit log
        audit_lines = []
        for r in bench.results:
            audit_lines.append(
                f"{r.algorithm_name}: Privacy={r.privacy_score:.3f}, "
                f"Utility={r.utility_score:.3f}, "
                f"DisclosureRisk={r.disclosure_risk:.3f}, "
                f"InfoLoss={r.information_loss:.3f}, "
                f"Time={r.processing_time_ms:.0f}ms, "
                f"DPDP={'Compliant' if r.dpdp_compliant else 'Non-compliant'}"
            )
        with open(out / "benchmark_audit_log.txt", "w") as f:
            f.write("\n".join(audit_lines))
        print(f"📋 Audit log saved to {out / 'benchmark_audit_log.txt'}")

        # Additional metrics
        print("\n📐 Additional Metrics:")
        for r in bench.results:
            qi_check = [c for c in qi_cols if c in r.anonymized_data.columns]
            if qi_check:
                k_score = PrivacyMetrics.k_anonymity_score(r.anonymized_data, qi_check)
                print(f"   {r.algorithm_name}: k={k_score['k_achieved']}, "
                      f"avg_group={k_score['avg_group_size']}")

    return bench


def run_text_benchmark(output_dir):
    """Run PII redaction benchmark on synthetic text data."""
    print("\n📝 Text Data PII Redaction Benchmark")
    gen = SyntheticGenerator(seed=42)
    text_data = gen.generate_text_records(500)
    print(f"   Generated {len(text_data)} clinical notes")

    redactor = PIIRedactor(text_columns=["clinical_note"])
    result = redactor.run(text_data)

    report = redactor.get_detection_report()
    if not report.empty:
        print("\n   PII Detection Summary:")
        for _, row in report.iterrows():
            print(f"   • {row['PII_Type']}: {row['Count']} instances")

    print(f"\n   Privacy: {result.privacy_score:.3f}, "
          f"Utility: {result.utility_score:.3f}")

    if output_dir:
        out = Path(output_dir)
        out.mkdir(parents=True, exist_ok=True)
        result.anonymized_data.to_csv(out / "anonymized_text.csv", index=False)
        report.to_csv(out / "pii_detection_report.csv", index=False)
        print(f"   💾 Saved to {out}")


def main():
    parser = argparse.ArgumentParser(description="MedShield Benchmark Runner")
    parser.add_argument("--data", type=str, default=None,
                        help="Path to CSV dataset")
    parser.add_argument("--output", type=str, default="benchmark_results",
                        help="Output directory")
    parser.add_argument("--qi", type=str, nargs="+",
                        default=["age", "gender", "zip_code"],
                        help="Quasi-identifier columns")
    parser.add_argument("--sa", type=str, nargs="+",
                        default=["disease"],
                        help="Sensitive attribute columns")
    parser.add_argument("--records", type=int, default=1000,
                        help="Number of synthetic records")
    parser.add_argument("--skip-text", action="store_true",
                        help="Skip text PII benchmark")
    args = parser.parse_args()

    print(BANNER)
    start_time = time.time()

    # Load or generate data
    if args.data:
        print(f"📂 Loading dataset: {args.data}")
        data = DataLoader.load_csv(args.data)
    else:
        print(f"🧪 Generating {args.records} synthetic medical records...")
        gen = SyntheticGenerator(seed=42)
        data = gen.generate_medical_records(args.records)

    # Run structured benchmark
    bench = run_structured_benchmark(data, args.qi, args.sa, args.output)

    # Run text benchmark
    if not args.skip_text:
        run_text_benchmark(args.output)

    elapsed = time.time() - start_time
    print(f"\n✅ Complete! Total time: {elapsed:.1f}s")
    print(f"   Results in: {args.output}/")


if __name__ == "__main__":
    main()
