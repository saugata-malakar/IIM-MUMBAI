"""
Data Management & Loading Utilities
Handles all dataset loading, preprocessing, and synthetic data generation
"""

import pandas as pd
import numpy as np
from pathlib import Path
import json
from typing import Tuple, Dict, List, Optional
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DatasetManager:
    """
    Centralized dataset management for medical anonymization project
    Handles loading, preprocessing, and synthetic data generation
    """
    
    def __init__(self, base_path: str = "./datasets/"):
        self.base_path = Path(base_path)
        self.datasets = {}
        self.metadata = {}
        
    def load_dataset(self, 
                     dataset_name: str, 
                     file_path: str,
                     delimiter: str = ',') -> pd.DataFrame:
        """
        Load dataset from CSV or other format
        
        Args:
            dataset_name: Name for reference (e.g., 'adult', 'mimic_sample')
            file_path: Path to dataset file
            delimiter: CSV delimiter
            
        Returns:
            Loaded DataFrame
        """
        try:
            if file_path.endswith('.csv'):
                df = pd.read_csv(file_path, delimiter=delimiter)
            elif file_path.endswith('.xlsx'):
                df = pd.read_excel(file_path)
            elif file_path.endswith('.json'):
                df = pd.read_json(file_path)
            else:
                raise ValueError(f"Unsupported file format: {file_path}")
            
            self.datasets[dataset_name] = df
            logger.info(f"✅ Loaded {dataset_name}: {df.shape[0]} records, {df.shape[1]} columns")
            
            return df
            
        except Exception as e:
            logger.error(f"❌ Failed to load {dataset_name}: {str(e)}")
            return None
    
    def get_dataset(self, dataset_name: str) -> pd.DataFrame:
        """Retrieve loaded dataset"""
        return self.datasets.get(dataset_name, None)
    
    def list_datasets(self) -> List[str]:
        """List all loaded datasets"""
        return list(self.datasets.keys())
    
    def save_dataset(self, 
                     dataset_name: str, 
                     output_path: str,
                     include_audit: bool = True) -> bool:
        """
        Save anonymized dataset
        
        Args:
            dataset_name: Dataset to save
            output_path: Where to save
            include_audit: Whether to create audit trail log
            
        Returns:
            Success status
        """
        if dataset_name not in self.datasets:
            logger.error(f"Dataset {dataset_name} not found")
            return False
        
        try:
            df = self.datasets[dataset_name]
            df.to_csv(output_path, index=False)
            logger.info(f"✅ Saved {dataset_name} to {output_path}")
            
            if include_audit:
                audit_log = {
                    'timestamp': pd.Timestamp.now().isoformat(),
                    'dataset_name': dataset_name,
                    'output_path': output_path,
                    'records': len(df),
                    'columns': len(df.columns),
                    'columns_list': df.columns.tolist()
                }
                audit_path = output_path.replace('.csv', '_audit.json')
                with open(audit_path, 'w') as f:
                    json.dump(audit_log, f, indent=2)
                logger.info(f"✅ Audit log saved to {audit_path}")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to save {dataset_name}: {str(e)}")
            return False


# ============================================================================
# SYNTHETIC DATA GENERATION
# ============================================================================

class SyntheticMedicalDataGenerator:
    """
    Generate synthetic medical datasets for testing anonymization algorithms
    Mimics realistic medical data distributions
    """
    
    def __init__(self, seed: int = 42):
        np.random.seed(seed)
        
    def generate_medical_records(self, 
                                n_records: int = 1000,
                                include_diagnosis: bool = True,
                                include_medication: bool = True) -> pd.DataFrame:
        """
        Generate synthetic medical records dataset
        
        Args:
            n_records: Number of records to generate
            include_diagnosis: Include diagnosis codes
            include_medication: Include medication information
            
        Returns:
            DataFrame with synthetic medical records
        """
        
        data = {
            'patient_id': [f'PAT{i:06d}' for i in range(n_records)],
            'age': np.random.randint(18, 85, n_records),
            'gender': np.random.choice(['M', 'F'], n_records),
            'location': np.random.choice(
                ['NYC', 'LA', 'Chicago', 'Houston', 'Phoenix', 'Boston'], 
                n_records
            ),
            'visit_date': pd.date_range('2024-01-01', periods=n_records, freq='H'),
            'height_cm': np.random.normal(170, 10, n_records),
            'weight_kg': np.random.normal(75, 15, n_records),
            'systolic_bp': np.random.normal(120, 15, n_records),
            'diastolic_bp': np.random.normal(80, 10, n_records),
            'heart_rate': np.random.normal(72, 12, n_records),
            'temperature': np.random.normal(37.0, 0.5, n_records),
        }
        
        if include_diagnosis:
            data['diagnosis_code'] = np.random.choice(
                ['A001', 'A002', 'B001', 'B002', 'C001', 'C002', 'D001'],
                n_records
            )
            data['diagnosis_severity'] = np.random.choice(
                ['Low', 'Medium', 'High'],
                n_records
            )
        
        if include_medication:
            data['medication'] = np.random.choice(
                ['Drug_A', 'Drug_B', 'Drug_C', 'Drug_D', 'None'],
                n_records
            )
            data['dosage_mg'] = np.random.choice([0, 100, 250, 500], n_records)
            data['duration_days'] = np.random.randint(1, 90, n_records)
        
        df = pd.DataFrame(data)
        logger.info(f"✅ Generated synthetic medical records: {len(df)} records")
        
        return df
    
    def generate_prescription_data(self, n_records: int = 500) -> pd.DataFrame:
        """Generate synthetic e-prescription data"""
        
        data = {
            'prescription_id': [f'RX{i:06d}' for i in range(n_records)],
            'patient_age_group': np.random.choice(['18-30', '31-45', '46-60', '60+'], n_records),
            'doctor_id': [f'DOC{i%100:04d}' for i in range(n_records)],
            'clinic_location': np.random.choice(['Clinic_A', 'Clinic_B', 'Clinic_C'], n_records),
            'prescription_date': pd.date_range('2024-01-01', periods=n_records, freq='D'),
            'medication_name': np.random.choice(
                ['Aspirin', 'Ibuprofen', 'Lisinopril', 'Metformin', 'Atorvastatin'],
                n_records
            ),
            'dosage': np.random.choice(['100mg', '200mg', '500mg', '1000mg'], n_records),
            'frequency': np.random.choice(['Once daily', 'Twice daily', 'Three times daily'], n_records),
            'duration': np.random.randint(10, 90, n_records),
            'diagnosis_code': np.random.choice(['ICD10_001', 'ICD10_002', 'ICD10_003'], n_records),
            'notes': ['Patient has allergies to XYZ' if np.random.rand() > 0.7 else '' 
                     for _ in range(n_records)],
        }
        
        df = pd.DataFrame(data)
        logger.info(f"✅ Generated synthetic prescription data: {len(df)} records")
        
        return df
    
    def generate_adult_dataset_sample(self, n_records: int = 1000) -> pd.DataFrame:
        """
        Generate dataset similar to Adult Census Income dataset
        Common benchmark for anonymization algorithms
        """
        
        data = {
            'age': np.random.randint(17, 91, n_records),
            'workclass': np.random.choice(
                ['Private', 'Self-emp-not-inc', 'Self-emp-inc', 'Federal-gov', 
                 'Local-gov', 'State-gov', 'Without-pay', 'Never-worked'],
                n_records
            ),
            'fnlwgt': np.random.randint(12000, 1500000, n_records),
            'education': np.random.choice(
                ['Preschool', '1st-4th', '5th-6th', '7th-8th', '9th', '10th', 
                 '11th', '12th', 'HS-grad', 'Some-college', 'Assoc-acdm',
                 'Assoc-voc', 'Bachelors', 'Masters', 'Prof-school', 'Doctorate'],
                n_records
            ),
            'education-num': np.random.randint(0, 17, n_records),
            'marital-status': np.random.choice(
                ['Married-civ-spouse', 'Married-spouse-absent', 'Married-AF-spouse',
                 'Never-married', 'Separated', 'Divorced', 'Widowed'],
                n_records
            ),
            'occupation': np.random.choice(
                ['Tech-support', 'Craft-repair', 'Other-service', 'Sales',
                 'Exec-managerial', 'Prof-specialty', 'Protective-serv',
                 'Armed-Forces', 'Priv-house-serv'],
                n_records
            ),
            'relationship': np.random.choice(
                ['Wife', 'Own-child', 'Husband', 'Not-in-family', 'Other-relative', 'Unmarried'],
                n_records
            ),
            'race': np.random.choice(
                ['White', 'Black', 'Asian-Pac-Islander', 'Amer-Indian-Eskimo', 'Other'],
                n_records
            ),
            'sex': np.random.choice(['Male', 'Female'], n_records),
            'capital-gain': np.random.randint(0, 100000, n_records),
            'capital-loss': np.random.randint(0, 5000, n_records),
            'hours-per-week': np.random.randint(1, 100, n_records),
            'native-country': np.random.choice(
                ['United-States', 'Mexico', 'Philippines', 'India', 'Puerto-Rico',
                 'Canada', 'Taiwan', 'China', 'Japan', 'Other'],
                n_records
            ),
            'income': np.random.choice(['<=50K', '>50K'], n_records)
        }
        
        df = pd.DataFrame(data)
        logger.info(f"✅ Generated Adult dataset sample: {len(df)} records")
        
        return df


# ============================================================================
# QUALITY METRICS & ANALYSIS
# ============================================================================

class DataQualityAnalyzer:
    """Analyze dataset quality and characteristics"""
    
    @staticmethod
    def analyze_dataset(df: pd.DataFrame) -> Dict[str, any]:
        """
        Perform comprehensive dataset analysis
        
        Returns:
            Dictionary with quality metrics
        """
        
        analysis = {
            'shape': {
                'records': len(df),
                'columns': len(df.columns)
            },
            'columns': {
                'names': df.columns.tolist(),
                'dtypes': df.dtypes.to_dict(),
                'numeric': df.select_dtypes(include=[np.number]).columns.tolist(),
                'categorical': df.select_dtypes(include=['object']).columns.tolist(),
            },
            'missing_values': {
                'count': df.isnull().sum().to_dict(),
                'percentage': (df.isnull().sum() / len(df) * 100).to_dict()
            },
            'duplicates': {
                'total': df.duplicated().sum(),
                'percentage': df.duplicated().sum() / len(df) * 100
            },
            'numeric_stats': {
                col: {
                    'mean': float(df[col].mean()),
                    'std': float(df[col].std()),
                    'min': float(df[col].min()),
                    'max': float(df[col].max()),
                    'median': float(df[col].median())
                }
                for col in df.select_dtypes(include=[np.number]).columns
            },
            'categorical_stats': {
                col: {
                    'unique': df[col].nunique(),
                    'top': str(df[col].value_counts().index[0]) if len(df[col].value_counts()) > 0 else None,
                    'frequency': int(df[col].value_counts().iloc[0]) if len(df[col].value_counts()) > 0 else 0
                }
                for col in df.select_dtypes(include=['object']).columns
            }
        }
        
        return analysis
    
    @staticmethod
    def print_analysis(analysis: Dict[str, any]):
        """Pretty print dataset analysis"""
        
        print("\n" + "="*80)
        print("DATASET QUALITY ANALYSIS")
        print("="*80)
        
        print(f"\n📊 SHAPE: {analysis['shape']['records']} records × {analysis['shape']['columns']} columns")
        
        print(f"\n📋 COLUMNS: {', '.join(analysis['columns']['names'][:5])}" + 
              ("..." if len(analysis['columns']['names']) > 5 else ""))
        
        print(f"\n🔢 NUMERIC COLUMNS: {len(analysis['columns']['numeric'])}")
        print(f"📝 CATEGORICAL COLUMNS: {len(analysis['columns']['categorical'])}")
        
        print(f"\n⚠️  MISSING VALUES:")
        for col, missing in analysis['missing_values']['count'].items():
            if missing > 0:
                print(f"   - {col}: {missing} ({analysis['missing_values']['percentage'][col]:.2f}%)")
        
        print(f"\n🔄 DUPLICATES: {analysis['duplicates']['total']} ({analysis['duplicates']['percentage']:.2f}%)")
        
        print("\n" + "="*80)


# ============================================================================
# USAGE EXAMPLE
# ============================================================================

if __name__ == "__main__":
    
    # Initialize managers
    manager = DatasetManager()
    generator = SyntheticMedicalDataGenerator()
    
    # Generate sample datasets
    print("📁 GENERATING SYNTHETIC DATASETS...\n")
    
    medical_df = generator.generate_medical_records(n_records=500)
    manager.datasets['medical_records'] = medical_df
    
    prescription_df = generator.generate_prescription_data(n_records=300)
    manager.datasets['prescriptions'] = prescription_df
    
    adult_df = generator.generate_adult_dataset_sample(n_records=1000)
    manager.datasets['adult_benchmark'] = adult_df
    
    # Analyze datasets
    print("\n📈 ANALYZING DATASETS...\n")
    
    for dataset_name in manager.list_datasets():
        df = manager.get_dataset(dataset_name)
        analyzer = DataQualityAnalyzer()
        analysis = analyzer.analyze_dataset(df)
        analyzer.print_analysis(analysis)
    
    # Save datasets
    print("\n💾 SAVING DATASETS...\n")
    
    manager.save_dataset('medical_records', './medical_records.csv', include_audit=True)
    manager.save_dataset('prescriptions', './prescriptions.csv', include_audit=True)
    manager.save_dataset('adult_benchmark', './adult_benchmark.csv', include_audit=True)
    
    print("\n✅ Setup complete! Ready for anonymization testing.")
