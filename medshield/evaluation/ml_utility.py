"""
Machine Learning Utility Evaluator
Trains classification models on original vs anonymized data to measure 
predictive utility degradation (Information Loss in real-world ML tasks).

Research Benchmark: Measures F1-Score drop between original and anonymized datasets.
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, Tuple
import logging

try:
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import f1_score, accuracy_score
    from sklearn.preprocessing import LabelEncoder
    HAS_SKLEARN = True
except ImportError:
    HAS_SKLEARN = False

logger = logging.getLogger(__name__)

class MLUtilityEvaluator:
    """
    Evaluates how much machine learning utility is preserved after anonymization.
    It automatically detects a target variable (categorical sensitive attribute),
    trains a fast Random Forest, and compares the F1 scores.
    """

    def __init__(self, original_data: pd.DataFrame, anonymized_data: pd.DataFrame, target_column: str = None):
        self.original = original_data.copy()
        self.anonymized = anonymized_data.copy()
        self.target = target_column

    def evaluate(self) -> Dict[str, Any]:
        if not HAS_SKLEARN:
            return {"error": "scikit-learn is required for ML utility evaluation"}

        if len(self.original) < 50:
            return {"error": "Dataset too small for reliable ML evaluation (need >= 50 records)"}

        # 1. Auto-detect target if not provided
        if not self.target:
            self.target = self._auto_detect_target()
            if not self.target:
                return {"error": "Could not automatically identify a valid categorical target for classification."}

        # Ensure target exists in both
        if self.target not in self.original.columns or self.target not in self.anonymized.columns:
            return {"error": f"Target column '{self.target}' missing."}

        try:
            # 2. Preprocess data
            X_orig, y_orig = self._preprocess(self.original, self.target)
            X_anon, y_anon = self._preprocess(self.anonymized, self.target)

            # Ensure shapes match somewhat (might drop columns due to all-NaNs)
            common_cols = list(set(X_orig.columns) & set(X_anon.columns))
            if not common_cols:
                return {"error": "No overlapping features between original and anonymized data."}
                
            X_orig = X_orig[common_cols]
            X_anon = X_anon[common_cols]

            # 3. Train and evaluate on Original
            orig_acc, orig_f1 = self._train_and_score(X_orig, y_orig)

            # 4. Train and evaluate on Anonymized
            anon_acc, anon_f1 = self._train_and_score(X_anon, y_anon)

            # 5. Calculate Degradation
            f1_drop = max(0.0, orig_f1 - anon_f1)
            utility_retained = (anon_f1 / orig_f1) if orig_f1 > 0 else 0.0

            return {
                "target_variable": self.target,
                "original_f1": round(orig_f1, 4),
                "anonymized_f1": round(anon_f1, 4),
                "f1_drop": round(f1_drop, 4),
                "ml_utility_retained_percent": round(utility_retained * 100, 2),
                "status": "Success"
            }
        except Exception as e:
            logger.error(f"ML evaluation failed: {e}")
            return {"error": str(e)}

    def _auto_detect_target(self) -> str:
        """Finds the best categorical column to act as a classification target (e.g., Disease)."""
        cat_cols = self.original.select_dtypes(include=['object', 'category']).columns
        best_col = None
        best_unique = 0
        
        for col in cat_cols:
            n_unique = self.original[col].nunique()
            # A good target for classification has between 2 and 20 classes
            if 1 < n_unique < 20:
                # Prefer columns that sound like medical targets
                col_lower = col.lower()
                if any(kw in col_lower for kw in ['disease', 'diagnosis', 'condition', 'treatment', 'status']):
                    return col
                
                if n_unique > best_unique:
                    best_unique = n_unique
                    best_col = col
                    
        return best_col

    def _preprocess(self, df: pd.DataFrame, target: str) -> Tuple[pd.DataFrame, pd.Series]:
        """Encodes categoricals and handles NaNs for Scikit-Learn."""
        df = df.copy()
        
        # Drop rows where target is missing
        df = df.dropna(subset=[target])
        
        y = df[target]
        X = df.drop(columns=[target])
        
        # Label encode target
        y = LabelEncoder().fit_transform(y.astype(str))
        
        # One-hot encode categoricals in X
        cat_cols = X.select_dtypes(include=['object', 'category']).columns
        if len(cat_cols) > 0:
            X = pd.get_dummies(X, columns=cat_cols, dummy_na=True)
            
        # Fill numeric NaNs
        num_cols = X.select_dtypes(include=[np.number]).columns
        X[num_cols] = X[num_cols].fillna(X[num_cols].mean())
        
        return X, y

    def _train_and_score(self, X: pd.DataFrame, y: np.ndarray) -> Tuple[float, float]:
        """Trains an RF classifier and returns (Accuracy, Macro-F1)."""
        if len(X) < 10 or len(np.unique(y)) < 2:
            return 0.0, 0.0
            
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42, stratify=y if len(np.unique(y)) > 1 else None)
        
        # Fast configuration
        clf = RandomForestClassifier(n_estimators=50, max_depth=10, random_state=42, n_jobs=-1)
        clf.fit(X_train, y_train)
        y_pred = clf.predict(X_test)
        
        acc = accuracy_score(y_test, y_pred)
        # Handle cases where some classes are never predicted
        f1 = f1_score(y_test, y_pred, average='macro', zero_division=0)
        
        return acc, f1
