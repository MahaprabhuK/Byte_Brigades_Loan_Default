"""
Byte Brigades - Master Project Pipeline Automation Script
---------------------------------------------------------
Executes the end-to-end Data Warehousing & Data Mining pipeline sequentially:
Dataset Loader -> Preprocessing -> Data Warehouse -> OLAP -> Classification -> Clustering -> Association Rules -> Prediction.
"""

import os
import sys
import time

# Ensure project subdirectories are in PYTHONPATH
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.join(BASE_DIR, "preprocessing"))
sys.path.append(os.path.join(BASE_DIR, "data_warehouse"))
sys.path.append(os.path.join(BASE_DIR, "olap"))
sys.path.append(os.path.join(BASE_DIR, "classification"))
sys.path.append(os.path.join(BASE_DIR, "clustering"))
sys.path.append(os.path.join(BASE_DIR, "association_rules"))
sys.path.append(os.path.join(BASE_DIR, "prediction"))

from preprocess import run_preprocessing_pipeline
from create_warehouse import build_data_warehouse
from olap_queries import run_olap_operations
from train_classifiers import train_and_evaluate_classifiers
from train_clustering import run_clustering_pipeline
from mine_rules import mine_association_rules
from predictor import evaluate_probability_model

def run_master_pipeline():
    start_time = time.time()
    print("=" * 70)
    print("      BYTE BRIGADES - LOAN DEFAULT DW & DM PIPELINE EXECUTION")
    print("=" * 70)
    
    # Step 1: Preprocessing & Data Loader
    print("\n[STEP 1/7] Running Dataset Loading & Preprocessing Pipeline...")
    run_preprocessing_pipeline()
    
    # Step 2: Data Warehouse ETL
    print("\n[STEP 2/7] Building SQLite Data Warehouse (Star Schema)...")
    build_data_warehouse()
    
    # Step 3: OLAP Engine
    print("\n[STEP 3/7] Executing OLAP Operations (Roll-up, Drill-down, Slice, Dice, Pivot)...")
    run_olap_operations()
    
    # Step 4: Machine Learning Classification
    print("\n[STEP 4/7] Training & Benchmarking Classification Models...")
    train_and_evaluate_classifiers()
    
    # Step 5: Borrower Segmentation & Clustering
    print("\n[STEP 5/7] Executing K-Means Clustering & Cluster Profiling...")
    run_clustering_pipeline()
    
    # Step 6: Association Rule Mining
    print("\n[STEP 6/7] Mining Association Rules (Apriori Algorithm)...")
    mine_association_rules()
    
    # Step 7: Prediction Engine Evaluation
    print("\n[STEP 7/7] Validating Probability Prediction Engine...")
    evaluate_probability_model()
    
    elapsed = time.time() - start_time
    print("\n" + "=" * 70)
    print(f"  SUCCESS! Pipeline finished completely in {elapsed:.2f} seconds.")
    print("  All artifacts, SQLite DB, models, and plots generated in results/")
    print("=" * 70)
    print("\nTo launch the interactive Streamlit Dashboard, run:")
    print("  streamlit run dashboard/app.py\n")

if __name__ == "__main__":
    run_master_pipeline()
