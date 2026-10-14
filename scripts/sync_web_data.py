"""
Byte Brigades - Web Pipeline Data Synchronizer
----------------------------------------------
Updates web/src/data/pipelineData.ts with the latest outputs from:
- results/classification/classification_metrics.json
- results/clustering/cluster_profiles.json
- results/association_rules/association_rules.json
"""

import os
import json

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RESULTS_DIR = os.path.join(BASE_DIR, "results")
WEB_DATA_PATH = os.path.join(BASE_DIR, "web", "src", "data", "pipelineData.ts")

def sync_data():
    class_path = os.path.join(RESULTS_DIR, "classification", "classification_metrics.json")
    clust_path = os.path.join(RESULTS_DIR, "clustering", "cluster_profiles.json")
    assoc_path = os.path.join(RESULTS_DIR, "association_rules", "association_rules.json")

    with open(class_path, "r", encoding="utf-8") as f:
        class_data = json.load(f)

    with open(clust_path, "r", encoding="utf-8") as f:
        clust_data = json.load(f)

    with open(assoc_path, "r", encoding="utf-8") as f:
        assoc_data = json.load(f)

    # Read current pipelineData.ts to preserve OLAP_DATA
    with open(WEB_DATA_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    # Find where OLAP_DATA ends or where CLASSIFICATION_DATA begins
    split_marker = "export const CLASSIFICATION_DATA ="
    if split_marker in content:
        olap_part = content.split(split_marker)[0]
    else:
        print("[ERROR] Could not find split marker in pipelineData.ts")
        return

    new_content = olap_part + f"""export const CLASSIFICATION_DATA = {json.dumps(class_data, indent=2)};

export const CLUSTERING_DATA = {json.dumps(clust_data, indent=2)};

export const ASSOCIATION_RULES_DATA = {json.dumps(assoc_data, indent=2)};
"""

    with open(WEB_DATA_PATH, "w", encoding="utf-8") as f:
        f.write(new_content)

    print(f"[SYNC] Successfully updated {WEB_DATA_PATH} with latest pipeline data.")

if __name__ == "__main__":
    sync_data()
