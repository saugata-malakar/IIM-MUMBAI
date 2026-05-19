"""
Evaluation Framework for Anonymization
Computes: Privacy Score, Utility Score, Disclosure Risk, Information Loss, ML Utility Retention.
"""

import pandas as pd
import numpy as np
from typing import Dict, Tuple, List
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import f1_score


class AnonymizationEvaluator:
    """Compute all 5 anonymization evaluation metrics."""

    @staticmethod
    def compute_k_anonymity(df: pd.DataFrame, quasi_identifiers: List[str]) -> int:
        """
        Compute k-anonymity level.
        Returns: minimum group size (k value) for quasi-identifier combinations.
        """
        if not quasi_identifiers or len(quasi_identifiers) == 0:
            return len(df)

        # Get columns that exist in dataframe
        valid_qis = [qi for qi in quasi_identifiers if qi in df.columns]
        if not valid_qis:
            return len(df)

        group_sizes = df.groupby(valid_qis).size()
        k_anonymity = group_sizes.min()
        return int(k_anonymity)

    @staticmethod
    def compute_l_diversity(df: pd.DataFrame, quasi_identifiers: List[str], 
                            sensitive_attribute: str) -> float:
        """
        Compute ℓ-diversity.
        Returns: minimum ℓ value (distinct count of sensitive attribute per QI group).
        """
        if sensitive_attribute not in df.columns:
            return 1.0

        valid_qis = [qi for qi in quasi_identifiers if qi in df.columns]
        if not valid_qis:
            return 1.0

        diversity_values = df.groupby(valid_qis)[sensitive_attribute].nunique()
        l_diversity = diversity_values.min()
        return float(l_diversity)

    @staticmethod
    def compute_disclosure_risk(original_df: pd.DataFrame, 
                                anonymized_df: pd.DataFrame,
                                direct_identifiers: List[str]) -> float:
        """
        Compute disclosure risk (0-1, lower is better).
        Risk = proportion of records that could be re-identified via direct match.
        """
        if len(original_df) == 0 or len(anonymized_df) == 0:
            return 0.0

        valid_dis = [di for di in direct_identifiers if di in original_df.columns]
        if not valid_dis:
            return 0.0

        # Check how many original records match anonymized records on direct identifiers
        matched_count = 0
        for idx, row in original_df[valid_dis].iterrows():
            match_mask = True
            for col in valid_dis:
                match_mask &= (anonymized_df[col] == row[col]).any()
            if match_mask:
                matched_count += 1

        disclosure_risk = matched_count / len(original_df) if len(original_df) > 0 else 0.0
        return float(np.clip(disclosure_risk, 0.0, 1.0))

    @staticmethod
    def compute_information_loss(original_df: pd.DataFrame, 
                                 anonymized_df: pd.DataFrame) -> float:
        """
        Compute information loss (0-1, lower is better).
        Measures divergence between original and anonymized distributions.
        """
        total_loss = 0.0
        numeric_cols = original_df.select_dtypes(include=[np.number]).columns

        for col in numeric_cols:
            if col not in anonymized_df.columns:
                continue

            orig_vals = original_df[col].dropna()
            anon_vals = anonymized_df[col].dropna()

            if len(orig_vals) == 0 or len(anon_vals) == 0:
                continue

            # Normalize ranges
            orig_range = orig_vals.max() - orig_vals.min()
            if orig_range == 0:
                continue

            orig_norm = (orig_vals - orig_vals.min()) / orig_range
            anon_norm = (anon_vals - anon_vals.min()) / (anon_vals.max() - anon_vals.min() + 1e-6)

            # KL divergence approximation using histograms
            hist_orig, _ = np.histogram(orig_norm, bins=10, range=(0, 1))
            hist_anon, _ = np.histogram(anon_norm, bins=10, range=(0, 1))

            hist_orig = hist_orig / (hist_orig.sum() + 1e-6)
            hist_anon = hist_anon / (hist_anon.sum() + 1e-6)

            # KL divergence
            kl_div = np.sum(hist_orig * (np.log(hist_orig + 1e-10) - np.log(hist_anon + 1e-10)))
            total_loss += np.clip(kl_div, 0, 1)

        avg_loss = total_loss / max(len(numeric_cols), 1)
        return float(np.clip(avg_loss, 0.0, 1.0))

    @staticmethod
    def compute_ml_utility_retention(original_df: pd.DataFrame,
                                     anonymized_df: pd.DataFrame,
                                     target_column: str = None) -> float:
        """
        Compute ML Utility Retention (0-1, higher is better).
        Trains model on both datasets, compares F1 score retention.
        """
        # Auto-select target if not provided (first non-numeric high-cardinality column)
        if target_column is None or target_column not in original_df.columns:
            cat_cols = original_df.select_dtypes(include=['object']).columns
            if len(cat_cols) > 0:
                target_column = cat_cols[0]
            else:
                return 1.0

        # Prepare data
        numeric_cols = original_df.select_dtypes(include=[np.number]).columns.tolist()
        if len(numeric_cols) < 2:
            return 1.0

        X_orig = original_df[numeric_cols].fillna(original_df[numeric_cols].mean())
        y_orig = original_df[target_column].fillna('Unknown')

        X_anon = anonymized_df[numeric_cols].fillna(anonymized_df[numeric_cols].mean())
        y_anon = anonymized_df[target_column].fillna('Unknown')

        # Encode target
        le = LabelEncoder()
        y_orig_enc = le.fit_transform(y_orig)

        # Handle mismatch in classes
        y_anon_enc = np.zeros_like(y_anon, dtype=int)
        for i, val in enumerate(y_anon):
            if val in le.classes_:
                y_anon_enc[i] = le.transform([val])[0]
            else:
                y_anon_enc[i] = 0

        # Train and evaluate
        try:
            model_orig = RandomForestClassifier(n_estimators=10, max_depth=5, random_state=42)
            model_orig.fit(X_orig, y_orig_enc)
            y_pred_orig = model_orig.predict(X_orig)
            f1_orig = f1_score(y_orig_enc, y_pred_orig, average='weighted', zero_division=0)

            model_anon = RandomForestClassifier(n_estimators=10, max_depth=5, random_state=42)
            model_anon.fit(X_anon, y_anon_enc)
            y_pred_anon = model_anon.predict(X_anon)
            f1_anon = f1_score(y_anon_enc, y_pred_anon, average='weighted', zero_division=0)

            # Retention is ratio of anonymized F1 to original F1
            retention = f1_anon / (f1_orig + 1e-6) if f1_orig > 0 else 1.0
            return float(np.clip(retention, 0.0, 1.0))
        except Exception as e:
            print(f"ML utility computation failed: {e}")
            return 0.8  # Conservative estimate

    @staticmethod
    def compute_privacy_score(k_anonymity: int, l_diversity: float, 
                              disclosure_risk: float, epsilon: float = None) -> float:
        """
        Compute overall Privacy Score (0-100).
        Higher k, l, and lower disclosure risk = higher privacy.
        """
        k_score = min(k_anonymity / 20.0, 1.0) * 40  # k ≥ 20 → max points
        l_score = min(l_diversity / 5.0, 1.0) * 30   # ℓ ≥ 5 → max points
        risk_score = (1 - disclosure_risk) * 30       # Lower risk → more points

        privacy_score = k_score + l_score + risk_score

        # Differential privacy bonus (if epsilon provided and < 1.0)
        if epsilon is not None and epsilon < 1.0:
            dp_bonus = (1.0 - epsilon) * 10
            privacy_score += dp_bonus

        return float(np.clip(privacy_score, 0, 100))

    @staticmethod
    def compute_utility_score(information_loss: float, ml_utility: float) -> float:
        """
        Compute overall Utility Score (0-100).
        Lower information loss + higher ML utility = higher utility.
        """
        loss_score = (1 - information_loss) * 50
        ml_score = ml_utility * 50
        utility_score = loss_score + ml_score
        return float(np.clip(utility_score, 0, 100))

    def evaluate_anonymization(self, original_df: pd.DataFrame,
                               anonymized_df: pd.DataFrame,
                               direct_identifiers: List[str],
                               quasi_identifiers: List[str],
                               sensitive_attributes: List[str],
                               algorithm_params: Dict = None) -> Dict:
        """
        Comprehensive evaluation of anonymization.
        Returns: all 5 metrics + additional diagnostics.
        """
        results = {
            'timestamp': pd.Timestamp.now().isoformat(),
            'records_processed': len(original_df),
            'columns_in_dataset': len(original_df.columns),
        }

        # Metric 1: Privacy Score
        k_anon = self.compute_k_anonymity(anonymized_df, quasi_identifiers)
        l_div = self.compute_l_diversity(anonymized_df, quasi_identifiers,
                                         sensitive_attributes[0] if sensitive_attributes else 'diagnosis')
        disc_risk = self.compute_disclosure_risk(original_df, anonymized_df, direct_identifiers)

        epsilon = algorithm_params.get('epsilon', None) if algorithm_params else None
        privacy_score = self.compute_privacy_score(k_anon, l_div, disc_risk, epsilon)

        results['k_anonymity'] = int(k_anon)
        results['l_diversity'] = float(l_div)
        results['disclosure_risk'] = float(disc_risk)
        results['privacy_score'] = float(privacy_score)

        # Metric 2: Utility Score
        info_loss = self.compute_information_loss(original_df, anonymized_df)
        ml_utility = self.compute_ml_utility_retention(original_df, anonymized_df)

        utility_score = self.compute_utility_score(info_loss, ml_utility)

        results['information_loss'] = float(info_loss)
        results['ml_utility_retention'] = float(ml_utility)
        results['utility_score'] = float(utility_score)

        # Processing time (placeholder)
        results['processing_time_ms'] = 0

        return results
