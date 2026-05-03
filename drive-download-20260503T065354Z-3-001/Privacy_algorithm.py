import pandas as pd
import numpy as np
from math import log2

def logistic_map(x, lambda_val=3.99, iterations=400):
    """Implements the logistic map chaotic function."""
    for _ in range(iterations):
        x = lambda_val * x * (1 - x)
    return x

def chaos_perturbation_algorithm(data, qi_attributes, sensitive_attribute):
    """
    Implements the chaos and perturbation based anonymization algorithm.
    
    Parameters:
    - data: pandas DataFrame containing the dataset
    - qi_attributes: list of quasi-identifier attribute names
    - sensitive_attribute: name of the sensitive attribute
    
    Returns:
    - Privacy preserved DataFrame
    """
    # Step 1: Initialize
    D = data.copy()
    D_p = D.copy()
    d = len(D)
    q = len(qi_attributes)
    
    # Initialize parameters
    c = 0
    lambda_val = 3.99
    iteration = 400
    
    # Step 2-3: Find unique values and their frequencies for each QI
    unique_values = {}
    value_frequencies = {}
    for qi in qi_attributes:
        unique_values[qi] = D[qi].unique()
        value_frequencies[qi] = D[qi].value_counts().to_dict()
    
    # Step 4: Sort unique values by frequency
    sorted_unique_values = {}
    for qi in qi_attributes:
        sorted_unique_values[qi] = sorted(
            unique_values[qi],
            key=lambda x: value_frequencies[qi].get(x, 0)
        )
    
    # Step 5: Find record places for unique values
    record_places = {qi: np.zeros((d, len(unique_values[qi])), dtype=int) for qi in qi_attributes}
    for i, qi in enumerate(qi_attributes):
        c = 0
        for j, val in enumerate(sorted_unique_values[qi]):
            for k in range(d):
                if D[qi].iloc[k] == val:
                    c += 1
                    record_places[qi][k, j] = j
    
    # Step 6: Calculate number of crucial values
    r_values = {}
    for qi in qi_attributes:
        r_values[qi] = round(log2(len(unique_values[qi])))
    
    # Step 7: Generate new values using logistic map
    new_values = {}
    for qi in qi_attributes:
        x = 0.1
        new_values[qi] = []
        for _ in range(iteration):
            x = logistic_map(x, lambda_val)
            new_values[qi].append(x)
    
    # Step 8: Replace crucial values
    for qi in qi_attributes:
        attr_type = D[qi].dtype
        domain_min = D[qi].min() if np.issubdtype(attr_type, np.number) else 0
        domain_max = D[qi].max() if np.issubdtype(attr_type, np.number) else 1
        
        for j in range(min(r_values[qi], len(sorted_unique_values[qi]))):
            old_val = sorted_unique_values[qi][j]
            # Scale chaotic value to attribute domain
            if np.issubdtype(attr_type, np.number):
                new_val = domain_min + (domain_max - domain_min) * new_values[qi][j]
                if np.issubdtype(attr_type, np.integer):
                    new_val = round(new_val)
            else:
                # For categorical attributes, map to existing values
                idx = int(new_values[qi][j] * (len(unique_values[qi]) - 1))
                new_val = unique_values[qi][idx]
            
            # Replace values where this unique value appears
            mask = D[qi] == old_val
            D_p.loc[mask, qi] = new_val
    
    return D_p

# Example usage with Adult dataset
def main():
    # Load Adult dataset (adjust path as needed)
    url = "https://archive.ics.uci.edu/ml/machine-learning-databases/adult/adult.data"
    columns = [
        'age', 'workclass', 'fnlwgt', 'education', 'education-num',
        'marital-status', 'occupation', 'relationship', 'race', 'sex',
        'capital-gain', 'capital-loss', 'hours-per-week', 'native-country',
        'income'
    ]
    data = pd.read_csv(url, names=columns, skipinitialspace=True)
    
    # Save the original (unanonymized) data
    data.to_csv('unanonymized_adult_data.csv', index=False)
    print("Original data saved to 'unanonymized_adult_data.csv'")
    
    # Define quasi-identifiers and sensitive attribute
    qi_attributes = ['age', 'sex', 'education', 'occupation']
    sensitive_attribute = 'income'
    
    # Apply anonymization
    anonymized_data = chaos_perturbation_algorithm(data, qi_attributes, sensitive_attribute)
    
    # Save the anonymized data
    anonymized_data.to_csv('anonymized_adult_data.csv', index=False)
    print("Anonymization complete. Data saved to 'anonymized_adult_data.csv'")

if __name__ == "__main__":
    main()
    