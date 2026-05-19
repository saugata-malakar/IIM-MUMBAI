"""
Unified Algorithm Executor
Wraps all 7 anonymization algorithms with parameter handling.
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Any, Tuple
import time


class AlgorithmExecutor:
    """Execute any of the 7 algorithms with proper parameter routing."""

    def __init__(self):
        # Import algorithms dynamically to handle missing dependencies
        try:
            from medshield.algorithms.k_anonymity import KAnonymity
            self.KAnonymity = KAnonymity
        except:
            self.KAnonymity = None

        try:
            from medshield.algorithms.l_diversity import LDiversity
            self.LDiversity = LDiversity
        except:
            self.LDiversity = None

        try:
            from medshield.algorithms.t_closeness import TCloseness
            self.TCloseness = TCloseness
        except:
            self.TCloseness = None

        try:
            from medshield.algorithms.differential_privacy import DifferentialPrivacy
            self.DifferentialPrivacy = DifferentialPrivacy
        except:
            self.DifferentialPrivacy = None

        try:
            from medshield.algorithms.chaos_perturbation import ChaosPerturbation
            self.ChaosPerturbation = ChaosPerturbation
        except:
            self.ChaosPerturbation = None

        try:
            from medshield.algorithms.pseudonymization import Pseudonymization
            self.Pseudonymization = Pseudonymization
        except:
            self.Pseudonymization = None

        try:
            from medshield.algorithms.pii_redaction import PIIRedactor
            self.PIIRedactor = PIIRedactor
        except:
            self.PIIRedactor = None

    def execute(self, algorithm_id: str, df: pd.DataFrame, params: Dict[str, Any]) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Execute algorithm and return anonymized dataframe + metadata.
        Returns: (anonymized_df, execution_metadata)
        """
        start_time = time.time()
        metadata = {
            'algorithm': algorithm_id,
            'execution_time_ms': 0,
            'status': 'success',
            'error': None,
            'parameters_used': params
        }

        try:
            if algorithm_id == 'k-anonymity':
                result, meta = self._execute_k_anonymity(df, params)
            elif algorithm_id == 'l-diversity':
                result, meta = self._execute_l_diversity(df, params)
            elif algorithm_id == 't-closeness':
                result, meta = self._execute_t_closeness(df, params)
            elif algorithm_id == 'differential-privacy':
                result, meta = self._execute_differential_privacy(df, params)
            elif algorithm_id == 'chaos-perturbation':
                result, meta = self._execute_chaos_perturbation(df, params)
            elif algorithm_id == 'pseudonymization':
                result, meta = self._execute_pseudonymization(df, params)
            elif algorithm_id == 'pii-redaction':
                result, meta = self._execute_pii_redaction(df, params)
            else:
                raise ValueError(f"Unknown algorithm: {algorithm_id}")

            metadata.update(meta)
            metadata['execution_time_ms'] = int((time.time() - start_time) * 1000)
            return result, metadata

        except Exception as e:
            metadata['status'] = 'failed'
            metadata['error'] = str(e)
            metadata['execution_time_ms'] = int((time.time() - start_time) * 1000)
            return df.copy(), metadata

    def _execute_k_anonymity(self, df: pd.DataFrame, params: Dict) -> Tuple[pd.DataFrame, Dict]:
        """k-Anonymity: group-based generalization."""
        if not self.KAnonymity:
            raise RuntimeError("k-Anonymity not available")

        k = int(params.get('k', 5))
        quasi_ids = params.get('quasi_identifiers', [])
        quasi_ids = [qi for qi in quasi_ids if qi in df.columns]

        if not quasi_ids:
            return df.copy(), {'warning': 'No quasi-identifiers provided'}

        algo = self.KAnonymity(quasi_identifiers=quasi_ids, k=k)
        result = algo.anonymize(df)

        return result, {'k_value': k, 'quasi_identifiers': quasi_ids}

    def _execute_l_diversity(self, df: pd.DataFrame, params: Dict) -> Tuple[pd.DataFrame, Dict]:
        """ℓ-Diversity: ensure diversity in sensitive attributes."""
        if not self.LDiversity:
            raise RuntimeError("L-Diversity not available")

        l_val = int(params.get('l', 3))
        quasi_ids = params.get('quasi_identifiers', [])
        quasi_ids = [qi for qi in quasi_ids if qi in df.columns]
        sensitive_attr = params.get('sensitive_attribute')

        if not sensitive_attr or sensitive_attr not in df.columns:
            # Use first non-numeric column as default
            cat_cols = df.select_dtypes(include=['object']).columns.tolist()
            sensitive_attr = cat_cols[0] if cat_cols else 'diagnosis'

        variant = params.get('variant', 'distinct')
        algo = self.LDiversity(quasi_identifiers=quasi_ids, sensitive_attributes=[sensitive_attr],
                               l=l_val, variant=variant)
        result = algo.anonymize(df)

        return result, {'l_value': l_val, 'sensitive_attribute': sensitive_attr, 'variant': variant}

    def _execute_t_closeness(self, df: pd.DataFrame, params: Dict) -> Tuple[pd.DataFrame, Dict]:
        """t-Closeness: balance privacy and utility."""
        if not self.TCloseness:
            raise RuntimeError("t-Closeness not available")

        t = float(params.get('t', 0.3))
        quasi_ids = params.get('quasi_identifiers', [])
        quasi_ids = [qi for qi in quasi_ids if qi in df.columns]
        sensitive_attr = params.get('sensitive_attribute')

        if not sensitive_attr or sensitive_attr not in df.columns:
            cat_cols = df.select_dtypes(include=['object']).columns.tolist()
            sensitive_attr = cat_cols[0] if cat_cols else 'diagnosis'

        distance_metric = params.get('distance_metric', 'emd')
        algo = self.TCloseness(quasi_identifiers=quasi_ids, sensitive_attributes=[sensitive_attr],
                               t=t, distance_metric=distance_metric)
        result = algo.anonymize(df)

        return result, {'t_value': t, 'distance_metric': distance_metric}

    def _execute_differential_privacy(self, df: pd.DataFrame, params: Dict) -> Tuple[pd.DataFrame, Dict]:
        """Differential Privacy: mathematical privacy guarantee."""
        if not self.DifferentialPrivacy:
            raise RuntimeError("Differential Privacy not available")

        epsilon = float(params.get('epsilon', 1.0))
        delta = float(params.get('delta', 1e-5))
        mechanism = params.get('mechanism', 'laplace')
        columns_to_noise = params.get('columns_to_noise', [])
        columns_to_noise = [col for col in columns_to_noise if col in df.columns]

        # Use numeric columns if not specified
        if not columns_to_noise:
            columns_to_noise = df.select_dtypes(include=[np.number]).columns.tolist()

        algo = self.DifferentialPrivacy(epsilon=epsilon, delta=delta, mechanism=mechanism,
                                       columns=columns_to_noise)
        result = algo.anonymize(df)

        return result, {'epsilon': epsilon, 'delta': delta, 'mechanism': mechanism,
                       'columns_noised': columns_to_noise}

    def _execute_chaos_perturbation(self, df: pd.DataFrame, params: Dict) -> Tuple[pd.DataFrame, Dict]:
        """Chaos Perturbation: chaotic mapping for quasi-identifiers."""
        if not self.ChaosPerturbation:
            raise RuntimeError("Chaos Perturbation not available")

        lambda_val = float(params.get('lambda', 3.99))
        iterations = int(params.get('iterations', 400))
        quasi_ids = params.get('quasi_identifiers', [])
        quasi_ids = [qi for qi in quasi_ids if qi in df.columns]

        if not quasi_ids:
            return df.copy(), {'warning': 'No quasi-identifiers provided'}

        algo = self.ChaosPerturbation(quasi_identifiers=quasi_ids, lambda_val=lambda_val,
                                      iterations=iterations)
        result = algo.anonymize(df)

        return result, {'lambda': lambda_val, 'iterations': iterations}

    def _execute_pseudonymization(self, df: pd.DataFrame, params: Dict) -> Tuple[pd.DataFrame, Dict]:
        """Pseudonymization: hash-based ID replacement."""
        if not self.Pseudonymization:
            raise RuntimeError("Pseudonymization not available")

        hash_algo = params.get('hash_algorithm', 'SHA-256')
        salt = params.get('salt', '')
        columns_to_pseudonymize = params.get('columns_to_pseudonymize', [])
        columns_to_pseudonymize = [col for col in columns_to_pseudonymize if col in df.columns]

        if not columns_to_pseudonymize:
            return df.copy(), {'warning': 'No columns to pseudonymize'}

        algo = self.Pseudonymization(columns=columns_to_pseudonymize, hash_algorithm=hash_algo,
                                    salt=salt)
        result = algo.anonymize(df)

        return result, {'hash_algorithm': hash_algo, 'columns_pseudonymized': columns_to_pseudonymize}

    def _execute_pii_redaction(self, df: pd.DataFrame, params: Dict) -> Tuple[pd.DataFrame, Dict]:
        """PII Redaction: detect and mask personal information."""
        if not self.PIIRedactor:
            # Fallback: simple masking
            result = df.copy()
            for col in df.columns:
                if any(kw in col.lower() for kw in ['name', 'email', 'phone', 'address']):
                    result[col] = result[col].astype(str).apply(lambda x: '[REDACTED]')
            return result, {'method': 'redaction', 'fallback': True}

        redaction_method = params.get('redaction_method', 'mask')
        ner_model = params.get('ner_model', 'en_core_web_sm')
        custom_patterns = params.get('custom_patterns', [])

        algo = self.PIIRedactor(redaction_method=redaction_method, ner_model=ner_model,
                               custom_patterns=custom_patterns)
        result = algo.redact(df)

        return result, {'redaction_method': redaction_method, 'ner_model': ner_model}

    def get_algorithm_info(self, algorithm_id: str) -> Dict[str, Any]:
        """Return detailed algorithm information and default parameters."""
        info_map = {
            'k-anonymity': {
                'name': 'k-Anonymity',
                'description': 'Group-based generalization ensuring k individuals are indistinguishable',
                'use_case': 'Quasi-identifier protection, demographic data',
                'privacy_level': 'Medium-High',
                'utility_level': 'High',
                'dpdp_suitable': True,
                'default_params': {
                    'k': 5,
                    'quasi_identifiers': [],
                    'generalization_method': 'range'
                },
                'param_ranges': {
                    'k': [2, 20],
                    'generalization_method': ['range', 'hierarchy']
                }
            },
            'l-diversity': {
                'name': 'ℓ-Diversity',
                'description': 'Ensures sensitive attribute diversity within anonymity groups',
                'use_case': 'Diagnosis, disease status, test results',
                'privacy_level': 'High',
                'utility_level': 'Medium',
                'dpdp_suitable': True,
                'default_params': {
                    'l': 3,
                    'variant': 'distinct',
                    'sensitive_attribute': 'diagnosis'
                },
                'param_ranges': {
                    'l': [2, 10],
                    'variant': ['distinct', 'entropy', 'recursive']
                }
            },
            't-closeness': {
                'name': 't-Closeness',
                'description': 'Balances k-anonymity with sensitive attribute protection',
                'use_case': 'Clinical notes, medical history, lab values',
                'privacy_level': 'High',
                'utility_level': 'High',
                'dpdp_suitable': True,
                'default_params': {
                    't': 0.3,
                    'distance_metric': 'emd',
                    'sensitive_attribute': 'diagnosis'
                },
                'param_ranges': {
                    't': [0.05, 0.5],
                    'distance_metric': ['emd', 'kl_divergence']
                }
            },
            'differential-privacy': {
                'name': 'Differential Privacy',
                'description': 'Mathematical privacy guarantee with formal epsilon bounds',
                'use_case': 'Sensitive numeric data (glucose, BP), aggregate queries',
                'privacy_level': 'Very High',
                'utility_level': 'Medium',
                'dpdp_suitable': True,
                'default_params': {
                    'epsilon': 1.0,
                    'delta': 1e-5,
                    'mechanism': 'laplace',
                    'columns_to_noise': []
                },
                'param_ranges': {
                    'epsilon': [0.1, 10.0],
                    'mechanism': ['laplace', 'gaussian', 'randomized_response']
                }
            },
            'chaos-perturbation': {
                'name': 'Chaos Perturbation',
                'description': 'Uses chaotic mapping for quasi-identifier perturbation',
                'use_case': 'Age, location, demographic combinations',
                'privacy_level': 'Medium',
                'utility_level': 'Very High',
                'dpdp_suitable': False,
                'default_params': {
                    'lambda': 3.99,
                    'iterations': 400,
                    'quasi_identifiers': []
                },
                'param_ranges': {
                    'lambda': [3.5, 4.0],
                    'iterations': [100, 500]
                }
            },
            'pseudonymization': {
                'name': 'Pseudonymization',
                'description': 'Hash-based replacement of identifiers with random codes',
                'use_case': 'Patient ID, email, phone, account number',
                'privacy_level': 'High',
                'utility_level': 'Low',
                'dpdp_suitable': True,
                'default_params': {
                    'hash_algorithm': 'SHA-256',
                    'salt': '',
                    'columns_to_pseudonymize': []
                },
                'param_ranges': {
                    'hash_algorithm': ['SHA-256', 'SHA-3', 'BLAKE2']
                }
            },
            'pii-redaction': {
                'name': 'PII Redaction',
                'description': 'NER-based detection and masking of personal information',
                'use_case': 'Clinical notes, prescription text, unstructured data',
                'privacy_level': 'High',
                'utility_level': 'Very High',
                'dpdp_suitable': True,
                'default_params': {
                    'redaction_method': 'mask',
                    'ner_model': 'en_core_web_sm',
                    'custom_patterns': []
                },
                'param_ranges': {
                    'redaction_method': ['mask', 'replace_tag', 'delete'],
                    'ner_model': ['en_core_web_sm', 'en_core_web_trf']
                }
            }
        }
        return info_map.get(algorithm_id, {})

    def list_algorithms(self) -> List[Dict]:
        """Return list of all available algorithms with brief info."""
        algos = ['k-anonymity', 'l-diversity', 't-closeness', 'differential-privacy',
                 'chaos-perturbation', 'pseudonymization', 'pii-redaction']
        return [self.get_algorithm_info(algo) for algo in algos]
