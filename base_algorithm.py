"""
Base Algorithm Interface
All anonymization algorithms inherit from this abstract class
to ensure consistent behavior and evaluation
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Tuple, List
import pandas as pd
import numpy as np
from dataclasses import dataclass
from datetime import datetime


@dataclass
class AnonymizationMetrics:
    """Standardized output for all algorithm evaluations"""
    algorithm_name: str
    privacy_score: float  # 0-1, higher is more private
    utility_score: float  # 0-1, higher is more useful
    disclosure_risk: float  # 0-1, lower is better
    information_loss: float  # 0-1, lower is better
    processing_time_ms: float
    records_processed: int
    timestamp: str
    notes: Dict[str, Any] = None


class BaseAnonymizationAlgorithm(ABC):
    """
    Abstract base class for all anonymization algorithms.
    All concrete implementations must override anonymize() and evaluate()
    """
    
    def __init__(self, algorithm_name: str, config: Dict[str, Any] = None):
        self.algorithm_name = algorithm_name
        self.config = config or {}
        self.quasi_identifiers = self.config.get('quasi_identifiers', [])
        self.sensitive_attributes = self.config.get('sensitive_attributes', [])
        
    @abstractmethod
    def anonymize(self, 
                  data: pd.DataFrame, 
                  **kwargs) -> pd.DataFrame:
        """
        Main anonymization method
        
        Args:
            data: Input DataFrame with sensitive information
            **kwargs: Algorithm-specific parameters
            
        Returns:
            Anonymized DataFrame
        """
        pass
    
    @abstractmethod
    def evaluate(self,
                 original: pd.DataFrame,
                 anonymized: pd.DataFrame) -> AnonymizationMetrics:
        """
        Evaluate the effectiveness of anonymization
        
        Args:
            original: Original dataset
            anonymized: Anonymized dataset
            
        Returns:
            AnonymizationMetrics with privacy, utility, and disclosure metrics
        """
        pass
    
    def calculate_privacy_score(self, 
                               original: pd.DataFrame,
                               anonymized: pd.DataFrame) -> float:
        """
        Base privacy calculation - override for algorithm-specific logic
        0 = not private, 1 = fully private
        """
        # Simple approach: how many quasi-identifiers changed
        if not self.quasi_identifiers:
            return 0.5
        
        changed_cols = 0
        for col in self.quasi_identifiers:
            if col in original.columns and col in anonymized.columns:
                if not original[col].equals(anonymized[col]):
                    changed_cols += 1
        
        return min(changed_cols / len(self.quasi_identifiers), 1.0)
    
    def calculate_utility_score(self,
                               original: pd.DataFrame,
                               anonymized: pd.DataFrame) -> float:
        """
        Calculate data utility - how much information is preserved
        1 = identical data, 0 = complete loss of utility
        """
        # Simple approach: similarity across all numeric columns
        total_similarity = 0
        numeric_cols = anonymized.select_dtypes(include=[np.number]).columns
        
        if len(numeric_cols) == 0:
            return 0.5  # Can't calculate for non-numeric
        
        for col in numeric_cols:
            if col in original.columns:
                orig_mean = original[col].mean()
                anon_mean = anonymized[col].mean()
                
                if orig_mean != 0:
                    similarity = 1 - abs(orig_mean - anon_mean) / abs(orig_mean)
                else:
                    similarity = 1 if anon_mean == 0 else 0
                    
                total_similarity += max(0, similarity)
        
        return total_similarity / len(numeric_cols)
    
    def calculate_disclosure_risk(self,
                                 original: pd.DataFrame,
                                 anonymized: pd.DataFrame) -> float:
        """
        Estimate re-identification/disclosure risk
        0 = no risk, 1 = high risk of disclosure
        """
        # Check for direct identifiers still present
        direct_identifiers = ['name', 'email', 'phone', 'ssn', 'id', 'mrn']
        
        risk_score = 0
        for col in anonymized.columns:
            col_lower = col.lower()
            # Check if column looks like identifier
            for identifier in direct_identifiers:
                if identifier in col_lower:
                    # Check if it contains unique values (PII indicators)
                    if anonymized[col].nunique() / len(anonymized) > 0.8:
                        risk_score += 0.1
        
        return min(risk_score, 1.0)
    
    def calculate_information_loss(self,
                                  original: pd.DataFrame,
                                  anonymized: pd.DataFrame) -> float:
        """
        Calculate information loss due to anonymization
        0 = no loss, 1 = complete loss
        """
        # Based on changes in distribution and dimensionality
        original_cols = set(original.columns)
        anonymized_cols = set(anonymized.columns)
        
        # Removed columns = information loss
        removed_cols = original_cols - anonymized_cols
        col_loss = len(removed_cols) / len(original_cols) if len(original_cols) > 0 else 0
        
        # Distribution shift for remaining columns
        dist_loss = 0
        common_cols = original_cols & anonymized_cols
        
        for col in common_cols:
            if anonymized[col].dtype in ['float64', 'int64']:
                orig_std = original[col].std()
                anon_std = anonymized[col].std()
                
                if orig_std > 0:
                    dist_loss += abs(orig_std - anon_std) / orig_std
        
        avg_dist_loss = dist_loss / len(common_cols) if len(common_cols) > 0 else 0
        
        return (col_loss + avg_dist_loss) / 2


class ImageAnonymizationBase(ABC):
    """Base class for image-based anonymization algorithms"""
    
    def __init__(self, algorithm_name: str, config: Dict[str, Any] = None):
        self.algorithm_name = algorithm_name
        self.config = config or {}
    
    @abstractmethod
    def anonymize_image(self, image_path: str, output_path: str, **kwargs) -> Dict[str, Any]:
        """
        Anonymize a single medical image
        
        Returns:
            {
                'success': bool,
                'anonymization_type': str (e.g., 'blur', 'masking', 'redaction'),
                'areas_anonymized': List[bbox],
                'processing_time_ms': float,
                'notes': str
            }
        """
        pass


# ============= Example: Refactored Chaos Perturbation Algorithm =============

from math import log2
import time


class ChaosPerturbationAnonymization(BaseAnonymizationAlgorithm):
    """
    Chaos and Perturbation based anonymization algorithm.
    Reference: Your existing Privacy_algorithm.py implementation.
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        super().__init__("Chaos-Perturbation", config)
        self.lambda_val = config.get('lambda_val', 3.99) if config else 3.99
        self.iterations = config.get('iterations', 400) if config else 400
    
    def logistic_map(self, x: float) -> float:
        """Implements the logistic map chaotic function."""
        for _ in range(self.iterations):
            x = self.lambda_val * x * (1 - x)
        return x
    
    def anonymize(self, data: pd.DataFrame, **kwargs) -> pd.DataFrame:
        """Apply chaos perturbation to quasi-identifiers"""
        start_time = time.time()
        
        D_p = data.copy()
        d = len(D_p)
        qi_attributes = self.quasi_identifiers or data.columns.tolist()
        
        # Find unique values and frequencies
        for qi in qi_attributes:
            if qi not in data.columns:
                continue
                
            unique_vals = data[qi].unique()
            value_frequencies = data[qi].value_counts().to_dict()
            
            # Sort by frequency
            sorted_unique = sorted(
                unique_vals,
                key=lambda x: value_frequencies.get(x, 0)
            )
            
            # Calculate crucial values to replace
            r = round(log2(len(unique_vals)))
            
            # Generate chaotic values
            new_values = []
            x = 0.1
            for _ in range(self.iterations):
                x = self.logistic_map(x)
                new_values.append(x)
            
            # Replace crucial values
            attr_type = D_p[qi].dtype
            domain_min = D_p[qi].min() if np.issubdtype(attr_type, np.number) else 0
            domain_max = D_p[qi].max() if np.issubdtype(attr_type, np.number) else 1
            
            for j in range(min(r, len(sorted_unique))):
                old_val = sorted_unique[j]
                
                if np.issubdtype(attr_type, np.number):
                    new_val = domain_min + (domain_max - domain_min) * new_values[j]
                    if np.issubdtype(attr_type, np.integer):
                        new_val = int(round(new_val))
                else:
                    idx = int(new_values[j] * (len(unique_vals) - 1))
                    new_val = unique_vals[idx]
                
                mask = data[qi] == old_val
                D_p.loc[mask, qi] = new_val
        
        return D_p
    
    def evaluate(self,
                 original: pd.DataFrame,
                 anonymized: pd.DataFrame) -> AnonymizationMetrics:
        """Evaluate chaos perturbation results"""
        
        privacy = self.calculate_privacy_score(original, anonymized)
        utility = self.calculate_utility_score(original, anonymized)
        disclosure = self.calculate_disclosure_risk(original, anonymized)
        info_loss = self.calculate_information_loss(original, anonymized)
        
        return AnonymizationMetrics(
            algorithm_name=self.algorithm_name,
            privacy_score=privacy,
            utility_score=utility,
            disclosure_risk=disclosure,
            information_loss=info_loss,
            processing_time_ms=0,  # Should be tracked in anonymize()
            records_processed=len(anonymized),
            timestamp=datetime.now().isoformat(),
            notes={
                'quasi_identifiers': self.quasi_identifiers,
                'parameters': {
                    'lambda': self.lambda_val,
                    'iterations': self.iterations
                }
            }
        )
