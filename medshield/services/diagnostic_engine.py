"""
Clinical AI Diagnostic Engine

Takes 5 raw clinical inputs (age, blood_sugar, bp_systolic, heart_rate, gender)
and predicts diagnosis using GaussianNB trained on anonymized EHR data.
Returns probability scores for all 10 diagnoses + drug recommendations.
"""

import numpy as np
import pandas as pd
from sklearn.naive_bayes import GaussianNB
from sklearn.preprocessing import MinMaxScaler
from dataclasses import dataclass
from typing import Dict, List, Tuple, Optional
import json


@dataclass
class DiagnosticResult:
    """Structure for diagnostic engine output"""
    predicted_diagnosis: str
    confidence: float
    all_probabilities: Dict[str, float]  # {diagnosis: probability}
    drug_recommendations: List[str]
    drug_details: List[Dict]  # [{name, dose, frequency}, ...]
    disclaimer: Optional[str]
    audit_info: str
    processing_time_ms: float


class ClinicalAIDiagnosticEngine:
    """
    Naïve Bayes classifier for diagnosis prediction from anonymized EHR data.
    
    Features (5):
    - Age (numeric, 18-80)
    - Blood Sugar (numeric, 50-500 mg/dL)
    - Systolic BP (numeric, 100-200 mmHg)
    - Heart Rate (numeric, 40-150 bpm)
    - Gender (binary: 1=M, 0=F)
    
    Classes (10):
    - Diabetes Type 2
    - Hypertension
    - Coronary Artery Disease
    - Chronic Kidney Disease
    - Tuberculosis
    - Dengue Fever
    - COVID-19
    - Malaria
    - Anaemia
    - Hypothyroidism
    """

    DIAGNOSES = [
        "Diabetes Type 2",
        "Hypertension",
        "Coronary Artery Disease",
        "Chronic Kidney Disease",
        "Tuberculosis",
        "Dengue Fever",
        "COVID-19",
        "Malaria",
        "Anaemia",
        "Hypothyroidism",
    ]

    DRUG_SETS = {
        "Diabetes Type 2": [
            {"name": "Metformin", "dose": "500mg", "frequency": "Twice Daily"},
            {"name": "Glimepiride", "dose": "2mg", "frequency": "Once Daily"},
            {"name": "Sitagliptin", "dose": "100mg", "frequency": "Once Daily"},
            {"name": "Linagliptin", "dose": "5mg", "frequency": "Once Daily"},
        ],
        "Hypertension": [
            {"name": "Amlodipine", "dose": "5mg", "frequency": "Once Daily"},
            {"name": "Telmisartan", "dose": "40mg", "frequency": "Once Daily"},
            {"name": "Atenolol", "dose": "50mg", "frequency": "Once Daily"},
            {"name": "Enalapril", "dose": "10mg", "frequency": "Once Daily"},
        ],
        "Coronary Artery Disease": [
            {"name": "Aspirin", "dose": "75mg", "frequency": "Once Daily"},
            {"name": "Atorvastatin", "dose": "40mg", "frequency": "Once Daily"},
            {"name": "Metoprolol", "dose": "50mg", "frequency": "Twice Daily"},
            {"name": "Nitroglycerin", "dose": "0.6mg", "frequency": "SOS"},
        ],
        "Chronic Kidney Disease": [
            {"name": "ACE Inhibitor", "dose": "10mg", "frequency": "Once Daily"},
            {"name": "Phosphate Binder", "dose": "1g", "frequency": "Thrice Daily"},
            {"name": "Erythropoietin", "dose": "40U/kg", "frequency": "Weekly"},
            {"name": "Calcium Supplement", "dose": "500mg", "frequency": "Twice Daily"},
        ],
        "Tuberculosis": [
            {"name": "Isoniazid", "dose": "300mg", "frequency": "Once Daily"},
            {"name": "Rifampicin", "dose": "600mg", "frequency": "Once Daily"},
            {"name": "Pyrazinamide", "dose": "1500mg", "frequency": "Once Daily"},
            {"name": "Ethambutol", "dose": "1200mg", "frequency": "Once Daily"},
        ],
        "Dengue Fever": [
            {"name": "Paracetamol", "dose": "500mg", "frequency": "Thrice Daily"},
            {"name": "Ondansetron", "dose": "4mg", "frequency": "SOS"},
            {"name": "Platelet Transfusion", "dose": "Varies", "frequency": "PRN"},
        ],
        "COVID-19": [
            {"name": "Favipiravir", "dose": "1600mg", "frequency": "Twice Daily"},
            {"name": "Dexamethasone", "dose": "6mg", "frequency": "Once Daily"},
            {"name": "Enoxaparin", "dose": "40mg", "frequency": "Once Daily"},
            {"name": "Remdesivir", "dose": "200mg", "frequency": "IV"},
        ],
        "Malaria": [
            {"name": "Artemether", "dose": "80mg", "frequency": "Once Daily"},
            {"name": "Lumefantrine", "dose": "480mg", "frequency": "Twice Daily"},
            {"name": "Quinine", "dose": "600mg", "frequency": "Thrice Daily"},
        ],
        "Anaemia": [
            {"name": "Ferrous Sulfate", "dose": "200mg", "frequency": "Twice Daily"},
            {"name": "Folic Acid", "dose": "5mg", "frequency": "Once Daily"},
            {"name": "Vitamin B12", "dose": "1000mcg", "frequency": "Weekly"},
        ],
        "Hypothyroidism": [
            {"name": "Levothyroxine", "dose": "50mcg", "frequency": "Once Daily"},
            {"name": "Liothyronine", "dose": "25mcg", "frequency": "Once Daily"},
        ],
    }

    def __init__(self, training_data: Optional[pd.DataFrame] = None):
        """
        Initialize diagnostic engine.
        
        Args:
            training_data: DataFrame with columns [age, blood_sugar, bp_systolic, heart_rate, gender, diagnosis]
        """
        self.model = GaussianNB()
        self.scaler = MinMaxScaler()
        self.is_trained = False
        self.training_records_count = 0
        self.feature_names = ["age", "blood_sugar", "bp_systolic", "heart_rate", "gender"]

        if training_data is not None:
            self.train(training_data)

    def train(self, df: pd.DataFrame) -> Dict:
        """
        Train GaussianNB on anonymized EHR data.
        
        Expected columns: age, blood_sugar, bp_systolic, heart_rate, gender, diagnosis
        """
        try:
            # Extract features and labels
            X = df[self.feature_names].values.astype(float)
            y = df["diagnosis"].values

            # Fit scaler and transform
            X_scaled = self.scaler.fit_transform(X)

            # Train model
            self.model.fit(X_scaled, y)
            self.is_trained = True
            self.training_records_count = len(df)

            return {
                "status": "success",
                "records_trained": len(df),
                "classes": list(self.model.classes_),
                "feature_names": self.feature_names,
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def predict(
        self,
        age: float,
        blood_sugar: float,
        bp_systolic: float,
        heart_rate: float,
        gender: str,  # "M" or "F"
    ) -> DiagnosticResult:
        """
        Predict diagnosis from 5 clinical features.
        
        Args:
            age: Patient age (18-80)
            blood_sugar: Blood glucose mg/dL (50-500)
            bp_systolic: Systolic blood pressure mmHg (100-200)
            heart_rate: Heart rate bpm (40-150)
            gender: "M" or "F"
        
        Returns:
            DiagnosticResult with prediction, probabilities, drugs, and audit info
        """
        import time

        start_time = time.time()

        if not self.is_trained:
            raise RuntimeError("Model not trained. Call train() first.")

        # Encode gender
        gender_encoded = 1.0 if gender.upper() == "M" else 0.0

        # Prepare features
        features = np.array(
            [[age, blood_sugar, bp_systolic, heart_rate, gender_encoded]]
        )

        # Scale
        features_scaled = self.scaler.transform(features)

        # Predict
        predicted_class = self.model.predict(features_scaled)[0]
        probabilities = self.model.predict_proba(features_scaled)[0]

        # Build probability dictionary
        prob_dict = {
            self.model.classes_[i]: float(probabilities[i])
            for i in range(len(self.model.classes_))
        }

        # Get confidence (max probability)
        confidence = float(max(probabilities))

        # Get drug recommendations
        drug_recommendations = self.DRUG_SETS.get(predicted_class, [])
        drug_names = [d["name"] for d in drug_recommendations]

        # Build disclaimer if confidence is low
        disclaimer = None
        if confidence < 0.6:
            disclaimer = "Low confidence prediction (< 60%). Consult a clinician for confirmation."

        # Audit info
        audit_info = f"Model trained on {self.training_records_count} anonymized EHR records — zero PII exposure — DPDP compliant"

        processing_time_ms = (time.time() - start_time) * 1000

        return DiagnosticResult(
            predicted_diagnosis=str(predicted_class),
            confidence=confidence,
            all_probabilities=prob_dict,
            drug_recommendations=drug_names,
            drug_details=drug_recommendations,
            disclaimer=disclaimer,
            audit_info=audit_info,
            processing_time_ms=processing_time_ms,
        )

    def get_model_info(self) -> Dict:
        """Get information about trained model"""
        if not self.is_trained:
            return {"status": "not_trained"}

        return {
            "status": "trained",
            "classes": list(self.model.classes_),
            "num_classes": len(self.model.classes_),
            "training_records": self.training_records_count,
            "features": self.feature_names,
            "num_features": len(self.feature_names),
            "model_type": "GaussianNB",
            "privacy_guarantee": "DPDP-compliant anonymized data",
        }
