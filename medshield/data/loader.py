"""
Data loader and synthetic data generator for MedShield.
Hospital-grade realistic synthetic medical data generation with proper epidemiology.
"""

import pandas as pd
import numpy as np
from typing import Optional
from datetime import datetime, timedelta


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
        
        self.diagnoses = [
            'Diabetes Type 2', 'Hypertension', 'Coronary Artery Disease', 
            'Chronic Kidney Disease', 'Tuberculosis', 'Dengue / Viral Fever', 
            'COVID-19', 'Malaria', 'Anaemia', 'Hypothyroidism'
        ]
        
        self.icd10_map = {
            'Diabetes Type 2': 'E11.9',
            'Hypertension': 'I10',
            'Coronary Artery Disease': 'I25.10',
            'Chronic Kidney Disease': 'N18.9',
            'Tuberculosis': 'A15.9',
            'Dengue / Viral Fever': 'A90',
            'COVID-19': 'U07.1',
            'Malaria': 'B50.9',
            'Anaemia': 'D50.9',
            'Hypothyroidism': 'E03.9'
        }
        
        self.drugs_map = {
            'Diabetes Type 2': [
                'Metformin 500mg / 1000mg twice daily',
                'Glimepiride 1mg / 2mg once daily before breakfast',
                'Sitagliptin 100mg once daily',
                'Empagliflozin 10mg once daily',
                'Insulin Glargine 10–20 units at bedtime',
                'Vildagliptin 50mg twice daily',
                'Dapagliflozin 10mg once daily'
            ],
            'Hypertension': [
                'Amlodipine 5mg / 10mg once daily',
                'Telmisartan 40mg / 80mg once daily',
                'Losartan 50mg once daily',
                'Atenolol 25mg / 50mg once daily',
                'Hydrochlorothiazide 12.5mg once daily',
                'Ramipril 2.5mg / 5mg once daily',
                'Metoprolol Succinate 25mg once daily'
            ],
            'Coronary Artery Disease': [
                'Aspirin 75mg once daily',
                'Clopidogrel 75mg once daily',
                'Atorvastatin 40mg / 80mg at night',
                'Metoprolol 25mg twice daily',
                'Isosorbide Mononitrate 30mg once daily',
                'Ramipril 5mg once daily',
                'Nitroglycerin 0.5mg sublingual PRN'
            ],
            'Chronic Kidney Disease': [
                'Ferrous Sulphate 200mg twice daily',
                'Calcium Carbonate 500mg with meals',
                'Sodium Bicarbonate 500mg thrice daily',
                'Erythropoietin injection as per Hb',
                'Furosemide 40mg once daily',
                'Sevelamer 800mg with meals',
                'Amlodipine 5mg once daily'
            ],
            'Tuberculosis': [
                'Isoniazid 300mg once daily',
                'Rifampicin 600mg once daily',
                'Pyrazinamide 1500mg once daily',
                'Ethambutol 800mg once daily',
                'Pyridoxine 10mg once daily (prevents INH neuropathy)'
            ],
            'Dengue / Viral Fever': [
                'Paracetamol 500mg / 650mg every 6 hours',
                'ORS sachets for hydration',
                'Ondansetron 4mg for nausea'
            ],
            'COVID-19': [
                'Favipiravir 1800mg twice daily day 1, then 800mg twice daily',
                'Dexamethasone 6mg once daily if SpO2 below 94%',
                'Enoxaparin 40mg subcutaneous once daily',
                'Azithromycin 500mg once daily for 5 days',
                'Zinc 50mg once daily',
                'Vitamin C 1000mg once daily',
                'Vitamin D3 60000 IU weekly'
            ],
            'Malaria': [
                'Artemether 80mg plus Lumefantrine 480mg twice daily for 3 days',
                'Primaquine 0.25mg/kg once daily for 14 days',
                'Paracetamol 500mg for fever'
            ],
            'Anaemia': [
                'Ferrous Sulphate 200mg thrice daily',
                'Folic Acid 5mg once daily',
                'Vitamin B12 1500mcg once daily',
                'Iron sucrose IV infusion if severe'
            ],
            'Hypothyroidism': [
                'Levothyroxine 25mcg / 50mcg / 100mcg once daily on empty stomach',
                'Calcium and antacids must be taken 4 hours apart'
            ]
        }

    def generate_medical_records(self, n: int = 1000) -> pd.DataFrame:
        """Generate Type A: Structured EHR Data."""
        # Age distribution rules
        n_under_30 = int(n * 0.2)
        n_31_60 = int(n * 0.4)
        n_over_60 = n - n_under_30 - n_31_60
        
        ages = np.concatenate([
            self.rng.randint(18, 30, n_under_30),
            self.rng.randint(31, 60, n_31_60),
            self.rng.randint(61, 90, n_over_60)
        ])
        self.rng.shuffle(ages)
        
        diagnoses = self.rng.choice(self.diagnoses, n)
        
        medications = [self.rng.choice(self.drugs_map[d]) for d in diagnoses]
        icd10 = [self.icd10_map[d] for d in diagnoses]
        
        blood_sugar = []
        for d in diagnoses:
            if d == 'Diabetes Type 2':
                blood_sugar.append(self.rng.randint(130, 400))
            else:
                blood_sugar.append(self.rng.randint(70, 110))
                
        data = {
            'patient_id': [f'PAT-{i:06d}' for i in range(n)],
            'name': [f'Patient_{i}' for i in range(n)],
            'age': ages,
            'gender': self.rng.choice(['M', 'F'], n),
            'blood_group': self.rng.choice(['A+', 'A-', 'B+', 'B-', 'AB+', 'O+', 'O-'], n),
            'address': [f"{self.rng.randint(1,999)} Sample St, City-{self.rng.randint(100,999)}" for _ in range(n)],
            'phone': [f'+91-{self.rng.randint(60000, 99999)}{self.rng.randint(10000, 99999)}' for _ in range(n)],
            'email': [f'patient{i}@hospital.org' for i in range(n)],
            'aadhaar_last4': [f'{self.rng.randint(1000, 9999)}' for _ in range(n)],
            'diagnosis': diagnoses,
            'icd10_code': icd10,
            'admission_date': [f'2023-{self.rng.randint(1,12):02d}-{self.rng.randint(1,28):02d}' for _ in range(n)],
            'discharge_date': [f'2023-{self.rng.randint(1,12):02d}-{self.rng.randint(1,28):02d}' for _ in range(n)],
            'doctor_name': [f'Dr. Specialist {self.rng.randint(1,50)}' for _ in range(n)],
            'doctor_id': [f'DOC-{self.rng.randint(100, 999)}' for _ in range(n)],
            'hospital_name': [f'Hospital {self.rng.randint(1,10)}' for _ in range(n)],
            'ward': self.rng.choice(['General', 'ICU', 'Private', 'Emergency'], n),
            'blood_pressure': [f"{self.rng.randint(110, 160)}/{self.rng.randint(70, 100)}" for _ in range(n)],
            'blood_sugar': blood_sugar,
            'heart_rate': self.rng.randint(60, 110, n),
            'temperature': self.rng.normal(98.6, 0.5, n).round(1),
            'creatinine': self.rng.normal(0.9, 0.2, n).round(1),
            'hemoglobin': self.rng.normal(13.0, 1.5, n).round(1),
            'medications': medications,
            'allergies': self.rng.choice(['None', 'Penicillin', 'Sulfa', 'Peanuts', 'None'], n),
            'insurance_id': [f'INS-{self.rng.randint(100000, 999999)}' for _ in range(n)]
        }
        return pd.DataFrame(data)

    def generate_text_records(self, n: int = 500) -> pd.DataFrame:
        """Generate Type B: Unstructured Prescription Text."""
        records = []
        for i in range(n):
            diagnosis = self.rng.choice(self.diagnoses)
            drug = self.rng.choice(self.drugs_map[diagnosis])
            age = self.rng.randint(18, 85)
            gender = self.rng.choice(['M', 'F'])
            
            template = f"""HOSPITAL LETTERHEAD
Date: {self.rng.randint(1, 28):02d}/{self.rng.randint(1, 12):02d}/2023
Patient Name: Patient_{i}
Age: {age} | Gender: {gender}

CHIEF COMPLAINT:
Patient presented with symptoms consistent with {diagnosis}.

EXAMINATION FINDINGS:
BP: {self.rng.randint(110, 160)}/{self.rng.randint(70, 100)} mmHg
Pulse: {self.rng.randint(60, 100)} bpm
Temp: 98.6 F

DIAGNOSIS:
{diagnosis} (ICD-10: {self.icd10_map[diagnosis]})

Rx:
- {drug}

Dr. Specialist {self.rng.randint(1,50)}
Reg No: {self.rng.randint(10000, 99999)}
City Hospital
"""
            records.append({"record_id": i, "clinical_note": template})
        return pd.DataFrame(records)

    def generate_xray_records(self, n: int = 500) -> pd.DataFrame:
        """Generate Type C: Radiology/X-Ray Report Text."""
        records = []
        findings = [
            "Normal study. No active focal infiltrates.",
            "Mild cardiomegaly noted. Lungs are clear.",
            "Opacity in the right lower lobe consistent with pneumonia.",
            "Hyperinflation of lungs, suggestive of COPD.",
            "Pleural effusion noted on the left side."
        ]
        impressions = [
            "No acute cardiopulmonary disease.",
            "Recommend clinical correlation for pneumonia.",
            "Follow-up X-ray recommended in 2 weeks.",
            "Findings consistent with chronic bronchitis."
        ]
        for i in range(n):
            age = self.rng.randint(18, 85)
            gender = self.rng.choice(['M', 'F'])
            finding = self.rng.choice(findings)
            impression = self.rng.choice(impressions)
            
            template = f"""DEPARTMENT OF RADIOLOGY
Date: {self.rng.randint(1, 28):02d}/{self.rng.randint(1, 12):02d}/2023
Patient Name: Patient_{i}
Patient ID: PAT-{i:06d}
Age: {age} | Gender: {gender}

MODALITY: Chest X-Ray PA View
CLINICAL INDICATION: Persistent cough and fever.

FINDINGS:
{finding}
Cardiac silhouette is within normal limits. 
No pneumothorax or definite pleural effusion.

IMPRESSION:
{impression}

Dr. Radiologist {self.rng.randint(1,20)}
Reg No: {self.rng.randint(10000, 99999)}
City Hospital Radiology
"""
            records.append({"record_id": i, "radiology_report": template})
        return pd.DataFrame(records)
