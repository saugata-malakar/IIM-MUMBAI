"""
Drug Intelligence Panel

Fully searchable drug-diagnosis knowledge base built from anonymized dataset.
Provides drug frequency, co-prescriptions, vitals distribution, and contraindication validation.
"""

import pandas as pd
import numpy as np
from collections import defaultdict, Counter
from dataclasses import dataclass
from typing import Dict, List, Tuple, Optional
from difflib import SequenceMatcher
import json


@dataclass
class DrugAnalytics:
    """Structure for drug analytics"""
    drug_name: str
    total_records: int
    diagnoses: Dict[str, int]  # {diagnosis: count}
    top_diagnoses: List[Tuple[str, int]]  # [(diagnosis, count), ...]
    average_vitals: Dict[str, float]  # {bp_systolic, heart_rate, blood_sugar}
    co_prescribed_drugs: List[Tuple[str, int]]  # [(drug, count), ...]
    prevalence: float  # percentage of dataset


@dataclass
class DiagnosisAnalytics:
    """Structure for diagnosis analytics"""
    diagnosis: str
    total_records: int
    frequency: int
    all_drugs: Dict[str, int]  # {drug: count}
    top_drugs: List[Tuple[str, int]]  # [(drug, count), ...]
    age_distribution: Dict[str, int]  # {age_range: count}
    gender_distribution: Dict[str, int]  # {M: count, F: count}
    average_vitals: Dict[str, float]  # {bp_systolic, heart_rate, blood_sugar}


class DrugIntelligencePanel:
    """
    Searchable drug-diagnosis knowledge base from anonymized dataset.
    Indexes: Drug→Diagnoses, Diagnosis→Drugs, Drug→Drug co-occurrence.
    """

    def __init__(self, anonymized_data: Optional[pd.DataFrame] = None):
        """
        Initialize Drug Intelligence Panel.
        
        Args:
            anonymized_data: DataFrame with columns [medications, diagnosis, age, gender, blood_sugar, bp_systolic, heart_rate]
        """
        self.data = anonymized_data
        self.indexed = False

        # Index structures
        self.drug_to_diagnoses = defaultdict(Counter)  # drug → {diagnosis: count}
        self.diagnosis_to_drugs = defaultdict(Counter)  # diagnosis → {drug: count}
        self.drug_co_occurrence = defaultdict(Counter)  # drug → {co_drug: count}
        self.drug_vitals = defaultdict(lambda: {"bp": [], "hr": [], "sugar": []})
        self.all_drugs = set()
        self.all_diagnoses = set()

        if anonymized_data is not None:
            self.index_dataset()

    def index_dataset(self) -> Dict:
        """
        Parse anonymized dataset and build all indexes.
        Called once on initialization, cached in memory.
        """
        try:
            if self.data is None or len(self.data) == 0:
                return {"status": "error", "message": "No data provided"}

            records_processed = 0

            for _, row in self.data.iterrows():
                diagnosis = row.get("diagnosis", "")
                medications_str = row.get("medications", "")

                if not diagnosis or pd.isna(diagnosis):
                    continue

                self.all_diagnoses.add(diagnosis)
                records_processed += 1

                # Parse medications (assuming semicolon or comma separated)
                if isinstance(medications_str, str) and medications_str.strip():
                    drugs = [
                        d.strip()
                        for d in medications_str.replace(";", ",").split(",")
                        if d.strip()
                    ]
                else:
                    drugs = []

                # Build drug→diagnosis index
                for drug in drugs:
                    self.drug_to_diagnoses[drug][diagnosis] += 1
                    self.all_drugs.add(drug)

                    # Collect vitals for this drug
                    if "bp_systolic" in row:
                        self.drug_vitals[drug]["bp"].append(row["bp_systolic"])
                    if "heart_rate" in row:
                        self.drug_vitals[drug]["hr"].append(row["heart_rate"])
                    if "blood_sugar" in row:
                        self.drug_vitals[drug]["sugar"].append(row["blood_sugar"])

                # Build diagnosis→drug index
                for drug in drugs:
                    self.diagnosis_to_drugs[diagnosis][drug] += 1

                # Build drug co-occurrence
                for i, drug1 in enumerate(drugs):
                    for drug2 in drugs[i + 1 :]:
                        self.drug_co_occurrence[drug1][drug2] += 1
                        self.drug_co_occurrence[drug2][drug1] += 1

            self.indexed = True

            return {
                "status": "success",
                "records_indexed": records_processed,
                "unique_drugs": len(self.all_drugs),
                "unique_diagnoses": len(self.all_diagnoses),
            }

        except Exception as e:
            return {"status": "error", "message": str(e)}

    @staticmethod
    def _fuzzy_match(query: str, candidates: List[str], threshold: float = 0.6) -> List[str]:
        """
        Fuzzy string matching using Levenshtein distance.
        Returns top 5 matches above threshold.
        """
        query_lower = query.lower()
        matches = []

        for candidate in candidates:
            candidate_lower = candidate.lower()
            # Simple similarity score
            similarity = SequenceMatcher(None, query_lower, candidate_lower).ratio()
            if similarity >= threshold:
                matches.append((candidate, similarity))

        # Sort by similarity descending, return top 5
        matches.sort(key=lambda x: x[1], reverse=True)
        return [m[0] for m in matches[:5]]

    def search(self, query: str) -> List[Tuple[str, str]]:
        """
        Search for drugs or diagnoses by name (fuzzy match).
        
        Returns list of (item_name, item_type) tuples.
        item_type is either 'drug' or 'diagnosis'.
        """
        if not self.indexed:
            return []

        # Fuzzy match against both drugs and diagnoses
        drug_matches = self._fuzzy_match(query, list(self.all_drugs))
        diagnosis_matches = self._fuzzy_match(query, list(self.all_diagnoses))

        results = []
        for drug in drug_matches[:3]:  # Top 3 drugs
            results.append((drug, "drug"))
        for diag in diagnosis_matches[:3]:  # Top 3 diagnoses
            results.append((diag, "diagnosis"))

        return results

    def get_drug_analytics(self, drug_name: str) -> Optional[DrugAnalytics]:
        """
        Get full analytics for a drug:
        - Count records containing it
        - Which diagnoses (with frequencies)
        - Average vitals of patients on it
        - Top 3 co-prescribed drugs
        """
        if drug_name not in self.all_drugs:
            return None

        total_records = sum(self.drug_to_diagnoses[drug_name].values())
        diagnoses = dict(self.drug_to_diagnoses[drug_name])
        top_diagnoses = sorted(diagnoses.items(), key=lambda x: x[1], reverse=True)

        # Average vitals
        avg_vitals = {}
        if self.drug_vitals[drug_name]["bp"]:
            avg_vitals["bp_systolic"] = float(
                np.mean(self.drug_vitals[drug_name]["bp"])
            )
        if self.drug_vitals[drug_name]["hr"]:
            avg_vitals["heart_rate"] = float(np.mean(self.drug_vitals[drug_name]["hr"]))
        if self.drug_vitals[drug_name]["sugar"]:
            avg_vitals["blood_sugar"] = float(
                np.mean(self.drug_vitals[drug_name]["sugar"])
            )

        # Co-prescribed drugs
        co_drugs = dict(self.drug_co_occurrence[drug_name])
        top_co_drugs = sorted(co_drugs.items(), key=lambda x: x[1], reverse=True)[:3]

        # Prevalence percentage
        total_dataset_records = len(self.data) if self.data is not None else 1
        prevalence = (total_records / total_dataset_records) * 100

        return DrugAnalytics(
            drug_name=drug_name,
            total_records=total_records,
            diagnoses=diagnoses,
            top_diagnoses=top_diagnoses,
            average_vitals=avg_vitals,
            co_prescribed_drugs=top_co_drugs,
            prevalence=prevalence,
        )

    def get_diagnosis_analytics(self, diagnosis_name: str) -> Optional[DiagnosisAnalytics]:
        """
        Get full analytics for a diagnosis:
        - All drugs used (ranked by frequency)
        - Age distribution
        - Gender split
        - Average vitals
        """
        if diagnosis_name not in self.all_diagnoses:
            return None

        # Filter data for this diagnosis
        diag_data = self.data[self.data["diagnosis"] == diagnosis_name]
        total_records = len(diag_data)

        # Drugs used for this diagnosis
        drugs = dict(self.diagnosis_to_drugs[diagnosis_name])
        top_drugs = sorted(drugs.items(), key=lambda x: x[1], reverse=True)

        # Age distribution (group into ranges)
        age_distribution = {}
        if "age" in diag_data.columns:
            age_bins = [0, 20, 30, 40, 50, 60, 70, 80, 150]
            age_labels = [
                "0-20",
                "20-30",
                "30-40",
                "40-50",
                "50-60",
                "60-70",
                "70-80",
                "80+",
            ]
            age_dist = pd.cut(diag_data["age"], bins=age_bins, labels=age_labels)
            age_distribution = age_dist.value_counts().to_dict()

        # Gender distribution
        gender_distribution = {}
        if "gender" in diag_data.columns:
            gender_distribution = diag_data["gender"].value_counts().to_dict()

        # Average vitals
        avg_vitals = {}
        if "bp_systolic" in diag_data.columns:
            avg_vitals["bp_systolic"] = float(diag_data["bp_systolic"].mean())
        if "heart_rate" in diag_data.columns:
            avg_vitals["heart_rate"] = float(diag_data["heart_rate"].mean())
        if "blood_sugar" in diag_data.columns:
            avg_vitals["blood_sugar"] = float(diag_data["blood_sugar"].mean())

        return DiagnosisAnalytics(
            diagnosis=diagnosis_name,
            total_records=total_records,
            frequency=total_records,
            all_drugs=drugs,
            top_drugs=top_drugs,
            age_distribution=age_distribution,
            gender_distribution=gender_distribution,
            average_vitals=avg_vitals,
        )

    def validate_contraindications(
        self, diagnosis: str, medications: List[str]
    ) -> Dict:
        """
        Validate contraindications for specific diagnosis-drug combinations.
        
        Returns dict with validation results and warnings.
        """
        warnings = []

        # Dengue: Aspirin and Ibuprofen contraindicated
        if diagnosis.lower() == "dengue fever":
            aspirin_present = any(m.lower() == "aspirin" for m in medications)
            ibuprofen_present = any(
                m.lower() == "ibuprofen" for m in medications
            )
            if aspirin_present:
                warnings.append(
                    "⚠️ Aspirin contraindicated in Dengue (increases bleeding risk)"
                )
            if ibuprofen_present:
                warnings.append(
                    "⚠️ Ibuprofen contraindicated in Dengue (increases bleeding risk)"
                )

        # TB: RIPE regimen validation
        if diagnosis.lower() == "tuberculosis":
            ripe_drugs = {"isoniazid", "rifampicin", "pyrazinamide", "ethambutol"}
            medications_lower = {m.lower() for m in medications}
            missing = ripe_drugs - medications_lower
            if missing:
                warnings.append(
                    f"⚠️ TB: Missing drugs from RIPE regimen: {', '.join(missing)}"
                )

        return {
            "diagnosis": diagnosis,
            "medications": medications,
            "warnings": warnings,
            "is_valid": len(warnings) == 0,
        }

    def get_panel_summary(self) -> Dict:
        """Get summary statistics of indexed dataset"""
        if not self.indexed:
            return {"status": "not_indexed"}

        return {
            "status": "indexed",
            "total_drugs": len(self.all_drugs),
            "total_diagnoses": len(self.all_diagnoses),
            "total_records": len(self.data) if self.data is not None else 0,
            "top_drugs": [
                drug
                for drug in sorted(
                    self.all_drugs,
                    key=lambda d: sum(self.drug_to_diagnoses[d].values()),
                    reverse=True,
                )[:5]
            ],
            "top_diagnoses": list(self.all_diagnoses)[:10],
        }
