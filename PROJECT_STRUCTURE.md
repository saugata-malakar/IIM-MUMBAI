# Medical Data Anonymization Project - Comprehensive File Structure

## Project Organization

```
IIM_MUMBAI_PROJECT/
│
├── 📋 DOCUMENTATION/
│   ├── PROJECT_OVERVIEW.md              [Main project description]
│   ├── PAPER_SUMMARIES/                 [Organized research paper analysis]
│   │   ├── Text_Anonymization_Papers/
│   │   ├── Image_Anonymization_Papers/
│   │   ├── Structured_Data_Papers/
│   │   └── Privacy_Models_Papers/
│   ├── TEAM_ROLES.md                    [Team member responsibilities]
│   ├── IMPLEMENTATION_ROADMAP.md        [Timeline and milestones]
│   └── MEETING_NOTES.md                 [Weekly progress tracking]
│
├── 🔬 RESEARCH_PAPERS/                  [All collected papers organized by domain]
│   ├── Healthcare_Domain/
│   ├── Privacy_Preservation_Techniques/
│   ├── Data_Anonymization_Algorithms/
│   ├── Image_Processing/
│   ├── NLP_PII_Detection/
│   └── Evaluation_Metrics_Papers/
│
├── 💻 IMPLEMENTATION/
│   ├── algorithms/
│   │   ├── text_anonymization/
│   │   │   ├── generalization_kanonymity.py
│   │   │   ├── differential_privacy.py
│   │   │   ├── pseudonymization.py
│   │   │   └── perturbation.py
│   │   ├── image_anonymization/
│   │   │   ├── face_detection_masking.py
│   │   │   ├── text_redaction.py
│   │   │   └── skull_stripping.py
│   │   ├── structured_data/
│   │   │   ├── demographic_generalization.py
│   │   │   ├── diagnosis_anonymization.py
│   │   │   └── genomic_data_anonymization.py
│   │   └── base_algorithms.py
│   ├── evaluation/
│   │   ├── evaluation_framework.py
│   │   ├── metrics.py
│   │   └── comparison_tools.py
│   ├── utils/
│   │   ├── data_loader.py
│   │   ├── preprocessing.py
│   │   └── data_generator.py
│   └── main_application.py
│
├── 📊 DATASETS/
│   ├── Synthetic_Data/
│   │   ├── adult_dataset.csv
│   │   ├── medical_records_synthetic.csv
│   │   └── healthcare_benchmark.csv
│   ├── Real_Anonymized_Data/
│   │   ├── prescription_data/
│   │   ├── clinical_images/
│   │   └── xray_images/
│   └── Data_Manifests/
│       ├── dataset_info.json
│       └── data_sources.md
│
├── 📈 RESULTS/
│   ├── Benchmarking_Results/
│   │   ├── comparison_metrics.csv
│   │   ├── privacy_utility_tradeoff.png
│   │   └── performance_analysis.html
│   ├── Anonymized_Outputs/
│   │   ├── text_anonymized/
│   │   ├── images_anonymized/
│   │   └── audit_logs/
│   └── Reports/
│       ├── comparative_study.pdf
│       ├── algorithm_evaluation.md
│       └── recommendations.md
│
├── 📝 CONFIGURATION/
│   ├── config.yaml                      [Global settings]
│   ├── algorithm_configs/               [Algorithm-specific parameters]
│   └── dataset_configs/                 [Dataset specifications]
│
├── ✅ TESTING/
│   ├── unit_tests/
│   ├── integration_tests/
│   ├── security_tests/
│   └── benchmarks/
│
├── 📝 NOTES/
│   ├── Literature_Review.md
│   ├── Technical_Concepts.md
│   ├── Challenges_Encountered.md
│   └── Future_Improvements.md
│
├── 👥 TEAM_WORK/
│   ├── Person_1_Tasks/                  [Nischal - Healthcare focus]
│   ├── Person_2_Tasks/                  [Soham - Architecture & coordination]
│   ├── Person_3_Tasks/                  [Brajesh - Algorithm optimization]
│   └── Person_4_Tasks/                  [Shaugat - Image anonymization]
│
└── 🚀 DEPLOYMENT/
    ├── Docker/
    ├── Requirements.txt
    └── Setup_Guide.md

```

---

## File Generation Checklist

### Phase 1: Documentation (Week 1-2)
- [ ] PROJECT_OVERVIEW.md - Complete project description
- [ ] TEAM_ROLES.md - Clear role division
- [ ] Paper_Summary_Template.md - Standardized format for all papers
- [ ] IMPLEMENTATION_ROADMAP.md - Timeline and dependencies
- [ ] RESEARCH_PAPER_INDEX.xlsx - Catalog of all papers

### Phase 2: Research Organization (Week 2-3)
- [ ] Paper summaries for all collected papers
- [ ] Consolidated findings document
- [ ] Algorithm selection justification
- [ ] Dataset analysis report
- [ ] Evaluation metrics definition

### Phase 3: Implementation Framework (Week 3-4)
- [ ] base_algorithms.py - Abstract base classes
- [ ] individual algorithm implementations
- [ ] evaluation_framework.py - Benchmarking
- [ ] configuration files
- [ ] data loading utilities

### Phase 4: Dataset & Testing (Week 4-5)
- [ ] Synthetic dataset generation
- [ ] Unit tests for each algorithm
- [ ] Integration test suite
- [ ] Security validation tests
- [ ] Performance benchmarks

### Phase 5: Results & Reporting (Week 5-6)
- [ ] Comparison metrics
- [ ] Visualization scripts
- [ ] Comparative study report
- [ ] Recommendations document
- [ ] Publication-ready paper

---

## Key Metrics & Evaluation Framework

### Privacy Metrics
1. **K-anonymity**: Minimum group size
2. **Differential Privacy (ε, δ)**: Privacy budget
3. **Disclosure Risk**: Re-identification probability
4. **β-likeness**: Similarity between distributions

### Utility Metrics
1. **Information Loss**: Data quality degradation
2. **Statistical Similarity**: Distribution preservation
3. **Classification Accuracy**: Utility for ML tasks
4. **Domain-Specific Metrics**: Prescription interpretability

### Performance Metrics
1. **Processing Time**: Per record anonymization time
2. **Memory Usage**: Peak and average consumption
3. **Scalability**: Performance with dataset size
4. **Resource Efficiency**: CPU/GPU utilization

---

## Team Assignment (Based on WhatsApp Chat)

### Person 1 - Nischal IIT Bombay
- Focus: Healthcare domain, demographic data anonymization
- Algorithms: K-anonymity, clustering-based approaches
- Tasks: Algorithm implementation, framework design
- Status: Leading paper analysis

### Person 2 - Soham IIT Delhi
- Focus: Architecture, coordination, text algorithms
- Algorithms: Selection and distribution of tasks
- Tasks: Project management, benchmarking framework
- Status: Orchestration and integration

### Person 3 - Brajesh Nit Rourkella
- Focus: Hybrid algorithms, optimization
- Algorithms: Dissimilarity tree, CBA improvements
- Tasks: Complex algorithm implementation
- Status: Advanced techniques research

### Person 4 - Shaugat (malakarg95)
- Focus: Image anonymization, OCR-based redaction
- Algorithms: Face detection, text removal, skull stripping
- Tasks: Image processing pipeline
- Status: Image modality development

---

## Data Modalities Covered

1. **Text Data**
   - Medical records
   - E-prescriptions
   - Clinical notes
   - Diagnosis codes

2. **Image Data**
   - Handwritten prescriptions
   - Clinical photos
   - X-rays
   - MRI scans

3. **Structured Data**
   - Demographics (age, gender, location)
   - Diagnosis codes
   - Genomic data
   - Medication information

4. **Special Focus Areas**
   - Skull stripping for brain imaging
   - OCR-based annotation removal
   - Face detection and masking
   - Hierarchical clustering for efficiency

---

## Deliverables Timeline

**Week 1-2**: Research & Planning
- All paper summaries completed
- Problem statement finalized
- Algorithm selection documented

**Week 3-4**: Core Implementation
- 5+ algorithms implemented
- Benchmark framework ready
- Unit tests passing

**Week 5-6**: Evaluation & Reporting
- Comparative metrics generated
- Privacy-utility tradeoff analysis
- Recommendations publication-ready

**Week 7-8**: Final Submission
- Complete codebase with documentation
- Research paper draft
- Deployment guide

---

## Success Metrics

✅ All papers reviewed and summarized
✅ At least 7 anonymization algorithms implemented
✅ Comparative evaluation framework functional
✅ Benchmarking on Adult dataset completed
✅ Privacy-utility tradeoff analysis documented
✅ DPDP compliance verified
✅ Code coverage > 80%
✅ Research paper draft complete
✅ Multi-modal support (text, images, structured data)
✅ Production-ready anonymization application

