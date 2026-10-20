# Loan Default Studio (Review 3 dashboard)

An interactive 3D dashboard for the full pipeline. Each section calls a small FastAPI
backend (`api/`) that computes its numbers from the project's own data, the
`loan_dw.db` warehouse and freshly trained sklearn models. Nothing on the page is hardcoded.

```
api/        FastAPI backend (data.py, prep.py, olap.py, mining.py, main.py)
studio/     React + Three.js frontend (source in src/, production build in dist/)
start_dashboard.bat   one-click launcher for Windows
```

## Run it (demo mode)

Double-click `start_dashboard.bat`, or from the project root:

```bash
pip install fastapi uvicorn mlxtend     # one time
python api/main.py
```

Then open http://localhost:8000. The API serves the dashboard from `studio/dist`, so Node
isn't needed to present.

On startup the server trains the five default classifiers in the background. Gradient
Boosting takes about 10 s, so give it ~20 s before you reach the Classification section.
After that, default results are cached and come back instantly.

## Edit the frontend

```bash
cd studio
npm install
npm run dev          # http://localhost:5173, proxies /api to :8000
npm run build        # rebuilds studio/dist
```

Keep `python api/main.py` running in a second terminal while you work.

## If the backend dies mid-demo

The page loads `studio/dist/snapshot.json` when it opens. If an API call fails, the
dashboard falls back to those precomputed default results and the pill in the top-right
turns amber ("Offline snapshot"). Sliders that need retraining won't change anything in
that mode, but every section still renders.

To present with no Python at all: `cd studio/dist && python -m http.server 8000` serves
the snapshot-only version.

After changing models or defaults, regenerate the snapshot: `python api/main.py --snapshot`.

## Public link (Hugging Face Space)

Pushes to `main` that touch the dashboard trigger `.github/workflows/deploy-space.yml`. The workflow
builds a Docker Space (`deploy/space/`) holding the API, the data, the warehouse and the built
dashboard, then uploads it to Hugging Face. The free CPU tier gives 2 cores and 16 GB of RAM,
which is plenty.

One-time setup:

1. Make a free account at huggingface.co.
2. Settings > Access Tokens > *Create new token*, type **Write**. Copy it.
3. On GitHub: repo > Settings > Secrets and variables > Actions > *New repository secret*.
   Name it `HF_TOKEN` and paste the token.
4. Actions tab > *Deploy to Hugging Face Space* > *Run workflow*.

The log prints the Space page and the app URL: `https://<hf-username>-loan-default-studio.hf.space`.
The first build takes 3–5 minutes. After that, the models train about 20 s after each cold
start. The Space sleeps after 48 h without visitors, so open it a few minutes before the review.

To test the exact bundle locally: `python deploy/build_space.py`, then
`cd space_build && python api/main.py` and open http://localhost:7860.

## Suggested 10-minute demo flow

1. **Hero** (20 s): 50k particles, red = defaulters. Read the counters.
2. **Preprocessing** (1.5 min): hit *Run preprocessing*. The tornado plays, then the four
   steps appear. Point at the split bars: 11.70% default rate in both train and test, which
   is what stratification guarantees. Switch the scaler to Min-Max and rerun.
3. **Warehouse** (1 min): scroll slowly. The building rotates, the roof lifts, and you walk
   inside the star schema. Click a shelf to show real rows. Run one preset in the SQL console.
4. **OLAP** (2 min): click the five preset chips in order (roll-up, drill-down, slice,
   dice, pivot). Hover a cell. Show the generated SQL.
5. **Classification** (2.5 min): stay on Gradient Boosting and drag the threshold from 0.5
   down to 0.3. False negatives drop and false positives rise. Switch to Decision Tree and
   push `max_depth` to 3, then retrain. Open *overlay ROC*.
6. **Clustering** (1.5 min): K-Means, set K from 3 to 5, and watch the centroids iterate.
   Toggle *Colour by: actual default*. Switch to DBSCAN to show it finds no structure.
7. **Association** (1 min): drag min_support from 3% to 2%, hover the top rule, then click
   *Race all three algorithms*.
8. **Prediction** (1 min): click *Borderline* (about 39%, Moderate), then *High risk*
   (Critical, red flash). Use the what-if curve on Credit Score.

The *Cinematic / Fast* toggle in the nav bar shortens every animation. Use it for second runs.

## Configurable parameters

| Section | What the user can change |
|---|---|
| Preprocessing | scaler (z-score / min-max / robust), test split 10–40%, feature to inspect |
| OLAP | any 3 of 16 dimensions, 9 measures, roll-up/drill-down along Age, Credit and Income hierarchies, slice value, dice selections + credit-score cut, pivot swaps |
| Classification | model (LR, DT, RF, GB, MLP); LR: C, penalty, class weight; DT: depth, min split, criterion, class weight; RF: trees, depth, max_features, class weight; GB: stages, learning rate, depth, subsample; MLP: layers, activation, alpha, learning rate; decision threshold |
| Clustering | algorithm (K-Means, Hierarchical, GMM, DBSCAN), K 2–10, n_init, linkage, covariance type, eps, min_samples, feature subset |
| Association | algorithm (Apriori, FP-Growth, ECLAT), min support, min confidence, min lift, bins 3–5, max itemset length, consequent filter |
| Prediction | all 16 applicant inputs, 3 presets, model choice, the three risk-zone cut-offs |

## Questions to be ready for

- **"Why is AUC 0.997?"** The data is a synthetic benchmark (`preprocessing/loader.py`).
  `Default` is the top 11.7% of a fixed logistic score with no noise, so a flexible model can
  learn the rule almost exactly. Published results on the original Kaggle data are around
  0.75. The dashboard says this in the classification insight panel.
- **"The MLP beats your champion."** It does (AUC 0.9995 vs 0.9973). The reasons to keep GB
  are interpretability (feature importances, staged loss) and that the gap is small. Or
  promote the MLP. Either way, decide before Friday.
- **"High Risk tier has 0% default?"** `Dim_Risk_Tier` puts every defaulter into "Critical
  Risk" (`create_warehouse.py`, `get_risk_tier`), so the other tiers contain no defaults by
  construction. Treat it as a reporting label, never a model input. The warehouse panel
  shows this caveat.
- **"Silhouette is only 0.14."** The borrower features are drawn independently, so there are
  no natural clusters. The segments still separate risk (about 4% vs 12% vs 20% default),
  and that is the business value.
- **"FP-Growth was slowest?"** At ~25 items and 40k rows every algorithm finishes in under
  0.2 s, and mlxtend's Python overhead dominates. All three return identical itemsets.

## Troubleshooting

- **Port 8000 busy:** `set PORT=8010` (Windows) then `python api/main.py`.
- **Blank 3D panels:** the browser has WebGL disabled. Use Chrome or Edge with hardware
  acceleration on.
- **First Gradient Boosting retrain feels slow:** 100 stages takes about 10 s on a laptop.
  The overlay shows elapsed time.
