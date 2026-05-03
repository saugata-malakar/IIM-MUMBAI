"""
Data loader and synthetic data generator for MedShield.
"""

import pandas as pd
import numpy as np
from typing import Optional


class DataLoader:
    """Load datasets from various sources."""

    @staticmethod
    def load_csv(path: str, **kwargs) -> pd.DataFrame:
        return pd.read_csv(path, **kwargs)

    @staticmethod
    def load_adult_dataset() -> pd.DataFrame:
        """Load UCI Adult Census dataset from URL."""
        url = "https://archive.ics.uci.edu/ml/machine-learning-databases/adult/adult.data"
        cols = ['age', 'workclass', 'fnlwgt', 'education', 'education-num',
                'marital-status', 'occupation', 'relationship', 'race',
                'sex', 'capital-gain', 'capital-loss', 'hours-per-week',
                'native-country', 'income']
        return pd.read_csv(url, names=cols, skipinitialspace=True)

    @staticmethod
    def load_project_dataset(name: str = "medical") -> pd.DataFrame:
        """Load one of the project's existing datasets."""
        paths = {
            "medical": "final_context_anonymized_dataset.csv",
            "anonymized": "final_anonymized_dataset.csv",
            "pii": "anonymized_text_pii_entities.csv",
        }
        path = paths.get(name, name)
        return pd.read_csv(path)


class SyntheticGenerator:
    """Generate synthetic medical datasets for testing."""

    def __init__(self, seed: int = 42):
        self.rng = np.random.RandomState(seed)

    def generate_medical_records(self, n: int = 1000) -> pd.DataFrame:
        """Generate realistic synthetic medical records."""
        data = {
            'patient_id': [f'PAT-{i:06d}' for i in range(n)],
            'name': [f'Patient_{i}' for i in range(n)],
            'age': self.rng.randint(18, 90, n),
            'gender': self.rng.choice(['M', 'F'], n),
            'zip_code': [f'{self.rng.randint(10000, 99999):05d}' for _ in range(n)],
            'disease': self.rng.choice(
                ['Diabetes', 'Hypertension', 'Cancer', 'Flu', 'COVID-19',
                 'Asthma', 'Heart Disease', 'Arthritis'], n),
            'blood_sugar': self.rng.normal(100, 20, n).round(2),
            'blood_pressure_sys': self.rng.normal(120, 15, n).round(0).astype(int),
            'cholesterol': self.rng.normal(200, 40, n).round(1),
            'medication': self.rng.choice(
                ['Metformin', 'Lisinopril', 'Aspirin', 'Ibuprofen',
                 'Amoxicillin', 'Atorvastatin', 'Omeprazole', 'Paracetamol'], n),
            'email': [f'patient{i}@hospital.org' for i in range(n)],
            'phone': [f'+91-{self.rng.randint(60000, 99999)}{self.rng.randint(10000, 99999)}' for _ in range(n)],
        }
        return pd.DataFrame(data)

    def generate_text_records(self, n: int = 500) -> pd.DataFrame:
        """Generate synthetic free-text medical notes with embedded PII."""
        templates = [
            "Patient {name}, age {age}, diagnosed with {disease}. Contact: {email}. BP: {bp}.",
            "{name} ({age}y, {gender}) presents with {disease}. Phone: {phone}. Sugar: {sugar}.",
            "Clinical note: {name} DOB {dob} has {disease}. Address: {addr}. Rx: {med}.",
            "Dr. referred {name} (ID: {pid}) for {disease} treatment on {date}.",
        ]
        records = []
        for i in range(n):
            name = f"Patient_{i}"
            template = templates[i % len(templates)]
            text = template.format(
                name=name, age=self.rng.randint(18, 85),
                disease=self.rng.choice(['Diabetes', 'Cancer', 'Flu', 'COVID-19']),
                email=f"p{i}@test.com",
                phone=f"+91-{self.rng.randint(60000, 99999)}{self.rng.randint(10000, 99999)}",
                bp=f"{self.rng.randint(100, 160)}/{self.rng.randint(60, 100)}",
                sugar=self.rng.randint(70, 200),
                gender=self.rng.choice(['M', 'F']),
                dob=f"{self.rng.randint(1, 28):02d}/{self.rng.randint(1, 12):02d}/19{self.rng.randint(40, 99)}",
                addr=f"{self.rng.randint(1, 999)} Street, City-{self.rng.randint(100000, 999999)}",
                med=self.rng.choice(['Metformin', 'Aspirin', 'Paracetamol']),
                pid=f"PAT-{i:06d}",
                date=f"{self.rng.randint(1, 28):02d}/{self.rng.randint(1, 12):02d}/2024",
            )
            records.append({"record_id": i, "clinical_note": text})
        return pd.DataFrame(records)
