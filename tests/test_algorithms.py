"""
MedShield Test Suite — Tests all algorithms and evaluation framework.
Run with: pytest tests/ -v
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
import pandas as pd
import numpy as np
from medshield.algorithms.k_anonymity import KAnonymity
from medshield.algorithms.l_diversity import LDiversity
from medshield.algorithms.t_closeness import TCloseness
from medshield.algorithms.differential_privacy import DifferentialPrivacy
from medshield.algorithms.chaos_perturbation import ChaosPerturbation
from medshield.algorithms.pseudonymization import Pseudonymization
from medshield.algorithms.pii_redaction import PIIRedactor
from medshield.evaluation.benchmark import Benchmark
from medshield.evaluation.metrics import PrivacyMetrics
from medshield.data.loader import SyntheticGenerator


@pytest.fixture
def sample_data():
    """Generate small synthetic dataset for testing."""
    gen = SyntheticGenerator(seed=42)
    return gen.generate_medical_records(100)


@pytest.fixture
def qi_cols():
    return ["age", "gender", "zip_code"]


@pytest.fixture
def sa_cols():
    return ["disease"]


class TestKAnonymity:
    def test_basic(self, sample_data, qi_cols, sa_cols):
        algo = KAnonymity(quasi_identifiers=qi_cols, sensitive_attributes=sa_cols, k=5)
        result = algo.run(sample_data)
        assert result.records_processed > 0
        assert result.privacy_score >= 0

    def test_k_value(self, sample_data, qi_cols, sa_cols):
        algo = KAnonymity(quasi_identifiers=qi_cols, k=3)
        anonymized = algo.anonymize(sample_data)
        assert len(anonymized) > 0


class TestDifferentialPrivacy:
    def test_laplace(self, sample_data, qi_cols):
        algo = DifferentialPrivacy(quasi_identifiers=["blood_sugar"], epsilon=1.0, mechanism="laplace")
        result = algo.run(sample_data)
        assert result.privacy_score > 0
        assert not sample_data["blood_sugar"].equals(result.anonymized_data["blood_sugar"])

    def test_gaussian(self, sample_data, qi_cols):
        algo = DifferentialPrivacy(quasi_identifiers=["blood_sugar"], epsilon=1.0, mechanism="gaussian")
        result = algo.run(sample_data)
        assert result.records_processed == len(sample_data)


class TestLDiversity:
    def test_distinct(self, sample_data, qi_cols, sa_cols):
        algo = LDiversity(quasi_identifiers=qi_cols, sensitive_attributes=sa_cols, l=2, variant="distinct")
        result = algo.run(sample_data)
        assert result.records_processed > 0

    def test_entropy(self, sample_data, qi_cols, sa_cols):
        algo = LDiversity(quasi_identifiers=qi_cols, sensitive_attributes=sa_cols, l=2, variant="entropy")
        result = algo.run(sample_data)
        assert result.privacy_score >= 0


class TestTCloseness:
    def test_emd(self, sample_data, qi_cols, sa_cols):
        algo = TCloseness(quasi_identifiers=qi_cols, sensitive_attributes=sa_cols, t=0.5, distance_metric="emd")
        result = algo.run(sample_data)
        assert result.records_processed > 0

    def test_kl(self, sample_data, qi_cols, sa_cols):
        algo = TCloseness(quasi_identifiers=qi_cols, sensitive_attributes=sa_cols, t=0.5, distance_metric="kl")
        result = algo.run(sample_data)
        assert result.privacy_score >= 0


class TestChaosPerturbation:
    def test_basic(self, sample_data, qi_cols):
        algo = ChaosPerturbation(quasi_identifiers=["age"], lambda_val=3.99)
        result = algo.run(sample_data)
        assert result.records_processed == len(sample_data)


class TestPseudonymization:
    def test_basic(self, sample_data):
        algo = Pseudonymization(identifier_columns=["name", "email", "phone"])
        result = algo.run(sample_data)
        # Names should be hashed
        assert not sample_data["name"].equals(result.anonymized_data["name"])
        assert result.anonymized_data["name"].str.startswith("PSE-").all()


class TestPIIRedactor:
    def test_basic(self):
        gen = SyntheticGenerator(seed=42)
        text_data = gen.generate_text_records(50)
        algo = PIIRedactor(text_columns=["clinical_note"])
        result = algo.run(text_data)
        assert result.records_processed == 50


class TestBenchmark:
    def test_full_run(self, sample_data, qi_cols, sa_cols):
        algos = [
            KAnonymity(quasi_identifiers=qi_cols, sensitive_attributes=sa_cols, k=3),
            DifferentialPrivacy(quasi_identifiers=["blood_sugar"], epsilon=1.0),
            ChaosPerturbation(quasi_identifiers=["age"]),
        ]
        bench = Benchmark()
        table = bench.run(sample_data, algos, verbose=False)
        assert len(table) == 3
        assert "Privacy" in table.columns
        assert "Utility" in table.columns


class TestMetrics:
    def test_k_anonymity_score(self, sample_data, qi_cols):
        score = PrivacyMetrics.k_anonymity_score(sample_data, qi_cols)
        assert "k_achieved" in score

    def test_disclosure_risk(self, sample_data, qi_cols):
        risk = PrivacyMetrics.disclosure_risk(sample_data, sample_data, qi_cols)
        assert 0 <= risk <= 1


class TestSyntheticGenerator:
    def test_medical_records(self):
        gen = SyntheticGenerator(seed=42)
        data = gen.generate_medical_records(500)
        assert len(data) == 500
        assert "patient_id" in data.columns
        assert "disease" in data.columns

    def test_text_records(self):
        gen = SyntheticGenerator(seed=42)
        data = gen.generate_text_records(100)
        assert len(data) == 100
        assert "clinical_note" in data.columns


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
