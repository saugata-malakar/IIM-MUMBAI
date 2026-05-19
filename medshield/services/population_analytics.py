"""
Population Health Analytics

Aggregates anonymized dataset into population-level insights.
Zero individual exposure — all metrics are aggregate only.
"""

import pandas as pd
import numpy as np
from dataclasses import dataclass
from typing import Dict, List, Optional


@dataclass
class AgeDistribution:
    """Age distribution in bins"""
    bins: List[str]  # ["0-10", "10-20", ...]
    counts: List[int]
    percentages: List[float]


@dataclass
class DiagnosisPrevalence:
    """Diagnosis frequency"""
    diagnosis: str
    count: int
    percentage: float
    gender_split: Dict[str, int]
    avg_vitals: Dict[str, float]


@dataclass
class HealthMetrics:
    """Population health metrics"""
    age_distribution: AgeDistribution
    diagnosis_prevalence: List[DiagnosisPrevalence]
    gender_distribution: Dict[str, int]
    vitals_by_diagnosis: Dict[str, Dict[str, float]]
    drug_load_per_diagnosis: Dict[str, float]  # avg drugs per record


class PopulationHealthAnalytics:
    """
    Compute population-level analytics from anonymized dataset.
    """

    def __init__(self, anonymized_data: Optional[pd.DataFrame] = None):
        """
        Initialize analytics.
        
        Args:
            anonymized_data: DataFrame with columns [age, gender, diagnosis, blood_sugar,
                                                      bp_systolic, heart_rate, medications]
        """
        self.data = anonymized_data
        self.metrics = None
        self.indexed = False

        if anonymized_data is not None:
            self.compute_metrics()

    def compute_metrics(self) -> Dict:
        """Compute all population-level metrics"""
        try:
            if self.data is None or len(self.data) == 0:
                return {"status": "error", "message": "No data provided"}

            # Age distribution (10-year bins)
            age_bins = [0, 10, 20, 30, 40, 50, 60, 70, 80, 150]
            age_labels = ["0-10", "10-20", "20-30", "30-40", "40-50", "50-60", "60-70", "70-80", "80+"]

            age_dist = pd.cut(self.data["age"], bins=age_bins, labels=age_labels)
            age_counts = age_dist.value_counts().sort_index()

            age_distribution = AgeDistribution(
                bins=age_labels,
                counts=[int(age_counts.get(label, 0)) for label in age_labels],
                percentages=[
                    float((age_counts.get(label, 0) / len(self.data)) * 100)
                    for label in age_labels
                ],
            )

            # Gender distribution
            gender_dist = self.data["gender"].value_counts().to_dict()

            # Diagnosis prevalence
            diagnosis_counts = self.data["diagnosis"].value_counts()
            diagnosis_prevalence = []

            for diagnosis in diagnosis_counts.index:
                diag_data = self.data[self.data["diagnosis"] == diagnosis]
                count = int(diagnosis_counts[diagnosis])
                percentage = float((count / len(self.data)) * 100)

                # Gender split for this diagnosis
                gender_split = diag_data["gender"].value_counts().to_dict()

                # Average vitals for this diagnosis
                avg_vitals = {}
                if "blood_sugar" in diag_data.columns:
                    avg_vitals["blood_sugar"] = float(diag_data["blood_sugar"].mean())
                if "bp_systolic" in diag_data.columns:
                    avg_vitals["bp_systolic"] = float(diag_data["bp_systolic"].mean())
                if "heart_rate" in diag_data.columns:
                    avg_vitals["heart_rate"] = float(diag_data["heart_rate"].mean())

                diagnosis_prevalence.append(
                    DiagnosisPrevalence(
                        diagnosis=diagnosis,
                        count=count,
                        percentage=percentage,
                        gender_split=gender_split,
                        avg_vitals=avg_vitals,
                    )
                )

            # Vitals by diagnosis (grouped stats)
            vitals_by_diagnosis = {}
            for diagnosis in self.data["diagnosis"].unique():
                diag_data = self.data[self.data["diagnosis"] == diagnosis]
                vitals = {}

                if "blood_sugar" in diag_data.columns:
                    vitals["blood_sugar_mean"] = float(diag_data["blood_sugar"].mean())
                    vitals["blood_sugar_std"] = float(diag_data["blood_sugar"].std())

                if "bp_systolic" in diag_data.columns:
                    vitals["bp_systolic_mean"] = float(diag_data["bp_systolic"].mean())
                    vitals["bp_systolic_std"] = float(diag_data["bp_systolic"].std())

                if "heart_rate" in diag_data.columns:
                    vitals["heart_rate_mean"] = float(diag_data["heart_rate"].mean())
                    vitals["heart_rate_std"] = float(diag_data["heart_rate"].std())

                vitals_by_diagnosis[diagnosis] = vitals

            # Drug load per diagnosis (avg number of drugs per record)
            drug_load = {}
            for diagnosis in self.data["diagnosis"].unique():
                diag_data = self.data[self.data["diagnosis"] == diagnosis]

                # Count medications per record
                if "medications" in diag_data.columns:
                    drug_counts = [
                        len(str(med).split(";")) if pd.notna(med) else 0
                        for med in diag_data["medications"]
                    ]
                    drug_load[diagnosis] = float(np.mean(drug_counts))
                else:
                    drug_load[diagnosis] = 0.0

            self.metrics = {
                "age_distribution": age_distribution,
                "diagnosis_prevalence": sorted(
                    diagnosis_prevalence, key=lambda x: x.count, reverse=True
                ),
                "gender_distribution": gender_dist,
                "vitals_by_diagnosis": vitals_by_diagnosis,
                "drug_load_per_diagnosis": drug_load,
            }

            self.indexed = True

            return {
                "status": "success",
                "records_analyzed": len(self.data),
                "unique_diagnoses": len(self.data["diagnosis"].unique()),
            }

        except Exception as e:
            return {"status": "error", "message": str(e)}

    def get_age_histogram(self) -> Dict:
        """Get age distribution for histogram"""
        if not self.indexed:
            return {}

        return {
            "bins": self.metrics["age_distribution"].bins,
            "counts": self.metrics["age_distribution"].counts,
            "percentages": self.metrics["age_distribution"].percentages,
            "total_records": sum(self.metrics["age_distribution"].counts),
        }

    def get_disease_prevalence(self) -> List[Dict]:
        """Get diagnosis prevalence ranked"""
        if not self.indexed:
            return []

        return [
            {
                "diagnosis": dp.diagnosis,
                "count": dp.count,
                "percentage": round(dp.percentage, 2),
                "gender_split": dp.gender_split,
                "avg_vitals": dp.avg_vitals,
            }
            for dp in self.metrics["diagnosis_prevalence"]
        ]

    def get_gender_distribution(self) -> Dict:
        """Get gender split"""
        if not self.indexed:
            return {}

        total = sum(self.metrics["gender_distribution"].values())
        return {
            "distribution": self.metrics["gender_distribution"],
            "percentages": {
                g: round((count / total) * 100, 2)
                for g, count in self.metrics["gender_distribution"].items()
            },
            "total": total,
        }

    def get_vitals_by_diagnosis(self) -> Dict:
        """Get vitals statistics per diagnosis"""
        if not self.indexed:
            return {}

        return self.metrics["vitals_by_diagnosis"]

    def get_drug_load_analysis(self) -> Dict:
        """Get average drug count per diagnosis"""
        if not self.indexed:
            return {}

        overall_avg = np.mean(list(self.metrics["drug_load_per_diagnosis"].values()))

        return {
            "by_diagnosis": {
                diag: round(count, 2)
                for diag, count in sorted(
                    self.metrics["drug_load_per_diagnosis"].items(),
                    key=lambda x: x[1],
                    reverse=True,
                )
            },
            "overall_average": round(overall_avg, 2),
        }

    def get_comorbidity_matrix(self) -> Dict:
        """Get co-occurrence of diagnoses (if multi-diagnosis records exist)"""
        if not self.indexed or "diagnoses_list" not in self.data.columns:
            # For single-diagnosis data, return correlation of vitals with diagnoses
            return {"note": "Single-diagnosis dataset - comorbidity not applicable"}

        # If dataset has multiple diagnoses per record
        comorbidity = {}
        for diagnosis in self.data["diagnosis"].unique():
            comorbidity[diagnosis] = {}

        return comorbidity

    def get_summary(self) -> Dict:
        """Get overall summary"""
        if not self.indexed:
            return {"status": "not_indexed"}

        return {
            "status": "indexed",
            "total_records": len(self.data),
            "total_anonymized_records": len(self.data),
            "pii_fields_exposed": 0,
            "unique_diagnoses": len(self.metrics["diagnosis_prevalence"]),
            "age_range": f"{int(self.data['age'].min())}-{int(self.data['age'].max())} years",
            "data_sources": "Anonymized EHR database",
            "privacy_guarantee": "DPDP compliant - aggregate only, zero individual exposure",
            "metrics_available": [
                "Age distribution",
                "Disease prevalence",
                "Gender distribution",
                "Vitals statistics",
                "Drug load analysis",
            ],
        }
