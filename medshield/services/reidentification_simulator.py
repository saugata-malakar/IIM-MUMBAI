"""
Re-identification Attack Simulator

Demonstrates k-anonymity effectiveness by simulating attacker scenarios.
User acts as adversary and queries anonymized dataset with attribute combinations.
Shows matching records count + risk scores using El Emam prosecutor/journalist/marketer models.
"""

import pandas as pd
import numpy as np
from dataclasses import dataclass
from typing import Dict, List, Tuple, Optional
from enum import Enum


class AdversaryMode(Enum):
    PROSECUTOR = "prosecutor"  # Attacker knows target IS in dataset
    JOURNALIST = "journalist"  # Cross-linking with public records
    MARKETER = "marketer"      # Random guessing from population stats


@dataclass
class ReidentificationResult:
    """Re-identification attack result"""
    matching_records: int
    total_records: int
    risk_score: float  # 0-1, higher = more risk
    equivalence_class_size: int  # Should be ≥ k for safety
    risk_level: str  # "safe" (green), "caution" (yellow), "exposed" (red)
    query_filters: Dict
    mode: str


class ReidentificationSimulator:
    """
    Simulates re-identification attacks on anonymized dataset.
    Proves k-anonymity protection using three attacker models.
    
    Attributes the simulator uses:
    - age_range: "20-29", "30-39", "40-49", "50-59", "60-69", "70-79"
    - gender: "M", "F"
    - blood_group: "O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"
    - district: Indian district names
    """

    def __init__(self, anonymized_data: Optional[pd.DataFrame] = None, k: int = 5):
        """
        Initialize simulator with anonymized dataset and k-anonymity parameter.
        
        Args:
            anonymized_data: DataFrame with columns [age_range, gender, blood_group, district, ...]
            k: k-anonymity threshold
        """
        self.data = anonymized_data
        self.k = k
        self.population_stats = {}
        self.indexed = False

        if anonymized_data is not None:
            self.index_dataset()

    def index_dataset(self) -> Dict:
        """Build statistics for risk computation"""
        try:
            if self.data is None or len(self.data) == 0:
                return {"status": "error", "message": "No data provided"}

            # Compute population statistics for Marketer model
            self.population_stats = {
                "age_ranges": self.data["age_range"].value_counts().to_dict(),
                "genders": self.data["gender"].value_counts().to_dict(),
                "blood_groups": self.data["blood_group"].value_counts().to_dict(),
                "districts": self.data["district"].value_counts().to_dict(),
            }

            self.indexed = True

            return {
                "status": "success",
                "records_indexed": len(self.data),
                "k_anonymity_parameter": self.k,
            }

        except Exception as e:
            return {"status": "error", "message": str(e)}

    def query_dataset(
        self,
        age_range: Optional[str] = None,
        gender: Optional[str] = None,
        blood_group: Optional[str] = None,
        district: Optional[str] = None,
    ) -> ReidentificationResult:
        """
        Execute attack query: How many records match these attributes?
        """
        if not self.indexed:
            raise RuntimeError("Dataset not indexed. Call index_dataset() first.")

        # Build filter
        mask = pd.Series([True] * len(self.data))

        query_filters = {}
        if age_range:
            mask &= self.data["age_range"] == age_range
            query_filters["age_range"] = age_range
        if gender:
            mask &= self.data["gender"] == gender
            query_filters["gender"] = gender
        if blood_group:
            mask &= self.data["blood_group"] == blood_group
            query_filters["blood_group"] = blood_group
        if district:
            mask &= self.data["district"] == district
            query_filters["district"] = district

        matching_records = mask.sum()
        total_records = len(self.data)

        # Determine safety
        equivalence_class_size = matching_records
        is_safe = equivalence_class_size >= self.k
        risk_level = "safe" if is_safe else "exposed"

        # Compute default risk (Prosecutor model)
        risk_score = 1.0 / matching_records if matching_records > 0 else 0.0

        return ReidentificationResult(
            matching_records=int(matching_records),
            total_records=total_records,
            risk_score=min(risk_score, 1.0),
            equivalence_class_size=equivalence_class_size,
            risk_level=risk_level,
            query_filters=query_filters,
            mode="prosecutor",
        )

    def compute_risk_prosecutor(
        self,
        age_range: Optional[str] = None,
        gender: Optional[str] = None,
        blood_group: Optional[str] = None,
        district: Optional[str] = None,
    ) -> float:
        """
        Prosecutor risk: Attacker knows target IS in dataset.
        Risk = 1 / matching_records
        
        Interpretation:
        - If 1000 records match → risk = 0.001 (safe)
        - If 5 records match → risk = 0.2 (caution)
        - If 1 record matches → risk = 1.0 (exposed!)
        """
        result = self.query_dataset(age_range, gender, blood_group, district)
        return result.risk_score

    def compute_risk_journalist(
        self,
        age_range: Optional[str] = None,
        gender: Optional[str] = None,
        blood_group: Optional[str] = None,
        district: Optional[str] = None,
    ) -> float:
        """
        Journalist risk: Attacker cross-links with public records (voter roll, etc).
        Risk = matching_records_in_dataset / total_records
        
        Interpretation:
        - If 1000 records match out of 5000 → risk = 0.2 (20% of dataset exposed)
        - If 5 records match → risk = 0.001 (safe)
        """
        result = self.query_dataset(age_range, gender, blood_group, district)
        journalist_risk = result.matching_records / result.total_records
        return journalist_risk

    def compute_risk_marketer(
        self,
        age_range: Optional[str] = None,
        gender: Optional[str] = None,
        blood_group: Optional[str] = None,
        district: Optional[str] = None,
    ) -> float:
        """
        Marketer risk: Attacker guesses from population statistics.
        Risk = P(attribute combination in population)
        
        Interpretation:
        - Rare combination (0.001) = safe
        - Common combination (0.1) = risky
        """
        if not self.population_stats:
            return 0.0

        prob = 1.0

        if age_range and age_range in self.population_stats["age_ranges"]:
            prob *= self.population_stats["age_ranges"][age_range] / len(self.data)

        if gender and gender in self.population_stats["genders"]:
            prob *= self.population_stats["genders"][gender] / len(self.data)

        if blood_group and blood_group in self.population_stats["blood_groups"]:
            prob *= (
                self.population_stats["blood_groups"][blood_group] / len(self.data)
            )

        if district and district in self.population_stats["districts"]:
            prob *= self.population_stats["districts"][district] / len(self.data)

        return prob

    def compute_all_risks(
        self,
        age_range: Optional[str] = None,
        gender: Optional[str] = None,
        blood_group: Optional[str] = None,
        district: Optional[str] = None,
        mode: str = "prosecutor",
    ) -> Dict:
        """
        Compute all three risk models + return single result.
        """
        result = self.query_dataset(age_range, gender, blood_group, district)

        prosecutor_risk = self.compute_risk_prosecutor(
            age_range, gender, blood_group, district
        )
        journalist_risk = self.compute_risk_journalist(
            age_range, gender, blood_group, district
        )
        marketer_risk = self.compute_risk_marketer(
            age_range, gender, blood_group, district
        )

        # Select risk based on mode
        if mode == "journalist":
            selected_risk = journalist_risk
        elif mode == "marketer":
            selected_risk = marketer_risk
        else:  # prosecutor
            selected_risk = prosecutor_risk

        risk_level = "safe" if result.equivalence_class_size >= self.k else "exposed"

        return {
            "matching_records": result.matching_records,
            "total_records": result.total_records,
            "equivalence_class_size": result.equivalence_class_size,
            "k_threshold": self.k,
            "is_safe": result.equivalence_class_size >= self.k,
            "risk_level": risk_level,
            "selected_risk_score": min(selected_risk, 1.0),
            "risks": {
                "prosecutor": min(prosecutor_risk, 1.0),
                "journalist": min(journalist_risk, 1.0),
                "marketer": min(marketer_risk, 1.0),
            },
            "query_filters": result.query_filters,
            "mode": mode,
            "proof_text": f"Query returned {result.matching_records} records (k={self.k}). "
            + ("✅ SAFE - All records anonymized together" if result.equivalence_class_size >= self.k else "❌ EXPOSED - Target may be isolated"),
        }

    def get_available_values(self) -> Dict:
        """Return all unique values for each attribute"""
        if not self.indexed:
            return {}

        return {
            "age_ranges": sorted(self.data["age_range"].unique().tolist()),
            "genders": sorted(self.data["gender"].unique().tolist()),
            "blood_groups": sorted(self.data["blood_group"].unique().tolist()),
            "districts": sorted(self.data["district"].unique().tolist()),
        }

    def get_simulator_info(self) -> Dict:
        """Get simulator information"""
        if not self.indexed:
            return {"status": "not_indexed"}

        return {
            "status": "indexed",
            "records_loaded": len(self.data),
            "k_anonymity_threshold": self.k,
            "available_attributes": self.get_available_values(),
            "modes": [m.value for m in AdversaryMode],
        }
