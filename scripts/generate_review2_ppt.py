"""
Byte Brigades - Academic Review 2 PowerPoint Generator
-------------------------------------------------------
Generates a polished 16:9 presentation deck (Review2_ByteBrigades_LoanDefault.pptx)
incorporating benchmark tables, high-resolution plots, and presenter notes.
"""

import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RESULTS_DIR = os.path.join(BASE_DIR, "results")
OUTPUT_PPT_PATH = os.path.join(BASE_DIR, "Review2_ByteBrigades_LoanDefault.pptx")

# Color Palette Constants
COLOR_BG = RGBColor(248, 250, 252)        # Slate-50 (#F8FAFC)
COLOR_NAVY = RGBColor(15, 23, 42)          # Slate-900 (#0F172A)
COLOR_TITLE = RGBColor(15, 23, 42)         # Primary Title
COLOR_BLUE = RGBColor(37, 99, 235)         # Blue-600 (#2563EB)
COLOR_EMERALD = RGBColor(16, 185, 129)     # Emerald-500 (#10B981)
COLOR_CARD_BG = RGBColor(255, 255, 255)    # Pure White Card
COLOR_CARD_BORDER = RGBColor(226, 232, 240)# Slate-200
COLOR_TEXT_MAIN = RGBColor(51, 65, 85)     # Slate-700
COLOR_TEXT_MUTED = RGBColor(100, 116, 139) # Slate-500
COLOR_WHITE = RGBColor(255, 255, 255)
COLOR_ROW_ALT = RGBColor(241, 245, 249)    # Slate-100

def create_slide_header(slide, title_text, category="ACADEMIC REVIEW 2 | DWDM"):
    # Top Accent Bar
    accent_bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(0.12))
    accent_bar.fill.solid()
    accent_bar.fill.fore_color.rgb = COLOR_BLUE
    accent_bar.line.fill.background()

    # Category Sub-header
    cat_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.3), Inches(11.7), Inches(0.3))
    tf_cat = cat_box.text_frame
    tf_cat.word_wrap = True
    tf_cat.margin_left = tf_cat.margin_top = tf_cat.margin_right = tf_cat.margin_bottom = 0
    p_cat = tf_cat.paragraphs[0]
    p_cat.text = category.upper()
    p_cat.font.size = Pt(10)
    p_cat.font.bold = True
    p_cat.font.color.rgb = COLOR_BLUE

    # Main Title
    title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.58), Inches(11.7), Inches(0.6))
    tf_title = title_box.text_frame
    tf_title.word_wrap = True
    tf_title.margin_left = tf_title.margin_top = tf_title.margin_right = tf_title.margin_bottom = 0
    p_title = tf_title.paragraphs[0]
    p_title.text = title_text
    p_title.font.size = Pt(22)
    p_title.font.bold = True
    p_title.font.color.rgb = COLOR_TITLE

def add_card(slide, left, top, width, height, bg_color=COLOR_CARD_BG, border_color=COLOR_CARD_BORDER):
    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = bg_color
    if border_color:
        shape.line.color.rgb = border_color
        shape.line.width = Pt(1)
    else:
        shape.line.fill.background()
    return shape

def set_slide_background(slide, color=COLOR_BG):
    background = slide.background
    fill = background.fill
    fill.solid()
    fill.fore_color.rgb = color

def create_deck():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # =========================================================================
    # SLIDE 1: Title Slide
    # =========================================================================
    s1 = prs.slides.add_slide(blank_layout)
    set_slide_background(s1, COLOR_NAVY)

    # Accent glow banner
    top_bar = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(0.18))
    top_bar.fill.solid()
    top_bar.fill.fore_color.rgb = COLOR_EMERALD
    top_bar.line.fill.background()

    # Title Card Text
    tbox = s1.shapes.add_textbox(Inches(1.0), Inches(1.8), Inches(11.333), Inches(4.5))
    tf = tbox.text_frame
    tf.word_wrap = True

    p0 = tf.paragraphs[0]
    p0.text = "DATA WAREHOUSING & DATA MINING  |  ACADEMIC REVIEW 2"
    p0.font.size = Pt(12)
    p0.font.bold = True
    p0.font.color.rgb = COLOR_EMERALD
    p0.space_after = Pt(12)

    p1 = tf.add_paragraph()
    p1.text = "Loan Default Risk Prediction &\nBorrower Profiling System"
    p1.font.size = Pt(36)
    p1.font.bold = True
    p1.font.color.rgb = COLOR_WHITE
    p1.space_after = Pt(16)

    p2 = tf.add_paragraph()
    p2.text = "Deliverables: Supervised Classification  •  K-Means Clustering  •  Apriori Association Rules  •  Prediction Engine"
    p2.font.size = Pt(14)
    p2.font.color.rgb = RGBColor(148, 163, 184)
    p2.space_after = Pt(32)

    p3 = tf.add_paragraph()
    p3.text = "Team: Byte Brigades  |  Dataset: 50,000 Records, 18 Features  |  Target: Default (Binary 0/1)"
    p3.font.size = Pt(12)
    p3.font.bold = True
    p3.font.color.rgb = COLOR_WHITE

    s1.notes_slide.notes_text_frame.text = (
        "Good morning faculty. Today we present Review 2 of our project: Loan Default Prediction and Risk Profiling System. "
        "In Review 1 we completed the Star Schema Data Warehouse and OLAP operations. "
        "In Review 2 we cover the core data mining deliverables: Classification, Clustering, Association Rule Mining, and Default Prediction."
    )

    # =========================================================================
    # SLIDE 2: Problem Statement & Class Imbalance Challenge
    # =========================================================================
    s2 = prs.slides.add_slide(blank_layout)
    set_slide_background(s2)
    create_slide_header(s2, "Problem Definition & The Class Imbalance Challenge")

    # Card 1: Dataset Scope
    add_card(s2, Inches(0.8), Inches(1.4), Inches(3.6), Inches(5.4))
    b1 = s2.shapes.add_textbox(Inches(1.0), Inches(1.6), Inches(3.2), Inches(5.0))
    tb1 = b1.text_frame
    tb1.word_wrap = True
    p = tb1.paragraphs[0]
    p.text = "Dataset & Preprocessing"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = COLOR_NAVY
    p.space_after = Pt(14)

    items1 = [
        ("Total Records:", " 50,000 loans"),
        ("Feature Space:", " 18 financial & demographic columns"),
        ("Train/Test Split:", " 80% Train (40,000) / 20% Test (10,000)"),
        ("Partitioning:", " Stratified sampling to preserve default ratios"),
        ("Data Leakage:", " Zero leakage. StandardScaler & OneHotEncoder fit strictly on training set.")
    ]
    for label, val in items1:
        pi = tb1.add_paragraph()
        pi.text = f"• {label}{val}"
        pi.font.size = Pt(12)
        pi.font.color.rgb = COLOR_TEXT_MAIN
        pi.space_after = Pt(10)

    # Card 2: Class Imbalance
    add_card(s2, Inches(4.7), Inches(1.4), Inches(3.8), Inches(5.4))
    b2 = s2.shapes.add_textbox(Inches(4.9), Inches(1.6), Inches(3.4), Inches(5.0))
    tb2 = b2.text_frame
    tb2.word_wrap = True
    p = tb2.paragraphs[0]
    p.text = "The Class Imbalance Problem"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = COLOR_NAVY
    p.space_after = Pt(14)

    items2 = [
        ("Non-Defaulters (Class 0):", " 88.3% (~44,150)"),
        ("Defaulters (Class 1):", " 11.7% (~5,850)"),
        ("The 'Accuracy Trap':", " A naive baseline predicting 'No Default' for all applicants achieves 88.3% accuracy while catching 0% of actual defaulters."),
        ("Financial Impact:", " Defaulters cause severe institutional lending losses; false negatives are far more costly than false positives.")
    ]
    for label, val in items2:
        pi = tb2.add_paragraph()
        pi.text = f"• {label}{val}"
        pi.font.size = Pt(12)
        pi.font.color.rgb = COLOR_TEXT_MAIN
        pi.space_after = Pt(10)

    # Card 3: Metric Strategy
    add_card(s2, Inches(8.8), Inches(1.4), Inches(3.7), Inches(5.4))
    b3 = s2.shapes.add_textbox(Inches(9.0), Inches(1.6), Inches(3.3), Inches(5.0))
    tb3 = b3.text_frame
    tb3.word_wrap = True
    p = tb3.paragraphs[0]
    p.text = "Evaluation Priority Metrics"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = COLOR_NAVY
    p.space_after = Pt(14)

    items3 = [
        ("Recall (Sensitivity):", " Maximizes detection of true defaulters, preventing toxic loan write-offs."),
        ("Precision:", " Prevents false rejections of creditworthy borrowers."),
        ("F1-Score:", " Harmonic mean balancing precision and recall under imbalance."),
        ("ROC-AUC:", " Threshold-independent discriminatory power across all probability cutoffs.")
    ]
    for label, val in items3:
        pi = tb3.add_paragraph()
        pi.text = f"• {label}{val}"
        pi.font.size = Pt(12)
        pi.font.color.rgb = COLOR_TEXT_MAIN
        pi.space_after = Pt(10)

    s2.notes_slide.notes_text_frame.text = (
        "In credit risk, class distribution is naturally skewed. Here only 11.7% of loans default. "
        "If a model blindly predicts 0 for all loans, it gets 88.3% accuracy yet is completely useless. "
        "Therefore, our model benchmarking strictly prioritizes Recall, F1-Score, and ROC-AUC."
    )

    # =========================================================================
    # SLIDE 3: Classification Benchmark Results
    # =========================================================================
    s3 = prs.slides.add_slide(blank_layout)
    set_slide_background(s3)
    create_slide_header(s3, "Classification: Multi-Model Benchmark Comparison")

    # Table Card
    add_card(s3, Inches(0.8), Inches(1.4), Inches(11.733), Inches(4.3))
    
    # Add Table
    rows, cols = 5, 7
    left, top, width, height = Inches(1.1), Inches(1.7), Inches(11.133), Inches(3.6)
    table_shape = s3.shapes.add_table(rows, cols, left, top, width, height)
    tbl = table_shape.table

    headers = ["Model Architecture", "Accuracy", "Precision", "Recall", "F1-Score", "ROC-AUC", "Log Loss"]
    for j, h in enumerate(headers):
        cell = tbl.cell(0, j)
        cell.text = h
        cell.fill.solid()
        cell.fill.fore_color.rgb = COLOR_NAVY
        for p in cell.text_frame.paragraphs:
            p.alignment = PP_ALIGN.CENTER
            p.font.size = Pt(12)
            p.font.bold = True
            p.font.color.rgb = COLOR_WHITE

    data = [
        ["Logistic Regression (Balanced)", "91.07%", "57.19%", "94.10%", "0.7115", "0.9816", "0.1885"],
        ["Decision Tree (max_depth=8)", "89.26%", "52.40%", "89.49%", "0.6610", "0.9342", "0.4943"],
        ["Random Forest (100 Trees)", "95.79%", "76.13%", "93.25%", "0.8383", "0.9910", "0.1832"],
        ["Gradient Boosting (Champion)", "97.75%", "97.11%", "83.25%", "0.8965", "0.9973", "0.0622"]
    ]

    for i, row in enumerate(data):
        is_champ = (i == 3)
        for j, val in enumerate(row):
            cell = tbl.cell(i + 1, j)
            cell.text = val
            cell.fill.solid()
            if is_champ:
                cell.fill.fore_color.rgb = RGBColor(236, 253, 245) # Light Emerald
            elif i % 2 == 1:
                cell.fill.fore_color.rgb = COLOR_ROW_ALT
            else:
                cell.fill.fore_color.rgb = COLOR_WHITE
                
            for p in cell.text_frame.paragraphs:
                p.alignment = PP_ALIGN.LEFT if j == 0 else PP_ALIGN.CENTER
                p.font.size = Pt(11)
                p.font.bold = is_champ or (j == 0)
                p.font.color.rgb = COLOR_EMERALD if (is_champ and j in [1,2,4,5]) else COLOR_TEXT_MAIN

    # Bottom Highlight Card
    add_card(s3, Inches(0.8), Inches(5.9), Inches(11.733), Inches(1.1), bg_color=RGBColor(238, 242, 255), border_color=COLOR_BLUE)
    hl_box = s3.shapes.add_textbox(Inches(1.0), Inches(5.95), Inches(11.333), Inches(0.9))
    thl = hl_box.text_frame
    thl.word_wrap = True
    p = thl.paragraphs[0]
    p.text = "Key Finding & Champion Selection:"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = COLOR_BLUE
    p2 = thl.add_paragraph()
    p2.text = "Gradient Boosting outperforms all models with 97.75% Accuracy, 97.11% Precision, 0.8965 F1-Score, and 0.9973 ROC-AUC. It achieves minimal false alarms while retaining strong default detection, drastically minimizing institutional Log Loss (0.0622)."
    p2.font.size = Pt(11)
    p2.font.color.rgb = COLOR_TEXT_MAIN

    s3.notes_slide.notes_text_frame.text = (
        "Here is our comparative benchmark table evaluated on the 10,000 holdout test set. "
        "While Logistic Regression had high recall, its precision was only 57%, rejecting too many good customers. "
        "Gradient Boosting achieved 97.11% precision with 83.25% recall, giving the top F1-Score of 0.8965 and an exceptional ROC-AUC of 0.9973."
    )

    # =========================================================================
    # SLIDE 4: Champion Diagnostics (Confusion Matrix & ROC Curves)
    # =========================================================================
    s4 = prs.slides.add_slide(blank_layout)
    set_slide_background(s4)
    create_slide_header(s4, "Classification: Confusion Matrices & ROC Curves")

    # Image 1: Confusion Matrices
    cm_path = os.path.join(RESULTS_DIR, "classification", "confusion_matrices.png")
    if os.path.exists(cm_path):
        add_card(s4, Inches(0.8), Inches(1.4), Inches(5.7), Inches(5.5))
        s4.shapes.add_picture(cm_path, Inches(0.9), Inches(1.5), width=Inches(5.5))
        
    # Image 2: ROC Curves
    roc_path = os.path.join(RESULTS_DIR, "classification", "roc_curves.png")
    if os.path.exists(roc_path):
        add_card(s4, Inches(6.8), Inches(1.4), Inches(5.7), Inches(5.5))
        s4.shapes.add_picture(roc_path, Inches(6.9), Inches(1.5), width=Inches(5.5))

    s4.notes_slide.notes_text_frame.text = (
        "On the left, the confusion matrices demonstrate how Gradient Boosting dramatically reduces False Positives compared to baseline models. "
        "On the right, the ROC curves illustrate that Gradient Boosting pushes closest to the top-left corner, achieving an Area Under Curve of 0.9973."
    )

    # =========================================================================
    # SLIDE 5: Clustering — Optimal K Selection (Elbow & Silhouette)
    # =========================================================================
    s5 = prs.slides.add_slide(blank_layout)
    set_slide_background(s5)
    create_slide_header(s5, "Borrower Segmentation: Optimal K Determination (Elbow & Silhouette)")

    # Left: Image
    elbow_path = os.path.join(RESULTS_DIR, "clustering", "elbow_silhouette.png")
    if os.path.exists(elbow_path):
        add_card(s5, Inches(0.8), Inches(1.4), Inches(6.8), Inches(5.5))
        s5.shapes.add_picture(elbow_path, Inches(0.9), Inches(1.8), width=Inches(6.6))

    # Right: Methodology & Criteria
    add_card(s5, Inches(7.9), Inches(1.4), Inches(4.6), Inches(5.5))
    rb = s5.shapes.add_textbox(Inches(8.1), Inches(1.6), Inches(4.2), Inches(5.0))
    trb = rb.text_frame
    trb.word_wrap = True

    p = trb.paragraphs[0]
    p.text = "Unsupervised Methodology"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = COLOR_NAVY
    p.space_after = Pt(14)

    items_k = [
        ("Clustering Algorithm:", " K-Means clustering (Euclidean distance on scaled features)."),
        ("Features Clustered:", " Income, CreditScore, LoanAmount, DTIRatio, MonthsEmployed."),
        ("Elbow Curve Inflection:", " Inertia drops sharply from K=2 (212,115) to K=3 (189,245), flattens thereafter."),
        ("Silhouette Analysis:", " Evaluated cluster cohesion across K=2 to 6; K=3 provides optimal cohesion and distinctness."),
        ("Commercial Rationale:", " K=3 naturally segments borrowers into Prime (Low Risk), Standard (Moderate Risk), and Subprime (High Risk).")
    ]
    for label, val in items_k:
        pi = trb.add_paragraph()
        pi.text = f"• {label}{val}"
        pi.font.size = Pt(11)
        pi.font.color.rgb = COLOR_TEXT_MAIN
        pi.space_after = Pt(10)

    s5.notes_slide.notes_text_frame.text = (
        "For unsupervised segmentation, we used K-Means on normalized financial features. "
        "Evaluating K from 2 to 6, both the Elbow curve inertia drop and Silhouette scores indicate K=3 is the optimal inflection point, "
        "creating three commercially practical risk tiers."
    )

    # =========================================================================
    # SLIDE 6: Borrower Risk Profiles ($K=3$) & 2D PCA Space
    # =========================================================================
    s6 = prs.slides.add_slide(blank_layout)
    set_slide_background(s6)
    create_slide_header(s6, "Borrower Risk Profiles ($K=3$) & 2D PCA Risk Space")

    # Top Table
    add_card(s6, Inches(0.8), Inches(1.4), Inches(11.733), Inches(2.6))
    tbl_shape6 = s6.shapes.add_table(4, 8, Inches(1.0), Inches(1.6), Inches(11.333), Inches(2.1))
    tbl6 = tbl_shape6.table

    h6 = ["Cluster ID", "Risk Tier", "Borrower Count", "Portfolio %", "Avg Credit", "Avg Income", "Avg Employment", "Default Rate"]
    for j, h in enumerate(h6):
        c = tbl6.cell(0, j)
        c.text = h
        c.fill.solid()
        c.fill.fore_color.rgb = COLOR_NAVY
        for p in c.text_frame.paragraphs:
            p.alignment = PP_ALIGN.CENTER
            p.font.size = Pt(11)
            p.font.bold = True
            p.font.color.rgb = COLOR_WHITE

    d6 = [
        ["Cluster 2", "Low Risk (Prime)", "18,800", "37.6%", "741.8", "$83,521", "60.7 mos", "3.93%"],
        ["Cluster 1", "Moderate Risk (Standard)", "15,550", "31.1%", "470.8", "$81,775", "91.5 mos", "12.38%"],
        ["Cluster 0", "High Risk (Subprime)", "15,650", "31.3%", "475.2", "$81,224", "27.0 mos", "20.36%"]
    ]
    for i, row in enumerate(d6):
        for j, val in enumerate(row):
            c = tbl6.cell(i + 1, j)
            c.text = val
            c.fill.solid()
            c.fill.fore_color.rgb = RGBColor(236, 253, 245) if i == 0 else (COLOR_ROW_ALT if i == 1 else RGBColor(254, 242, 242))
            for p in c.text_frame.paragraphs:
                p.alignment = PP_ALIGN.CENTER
                p.font.size = Pt(10)
                p.font.bold = (j in [1, 7])
                if j == 7:
                    p.font.color.rgb = COLOR_EMERALD if i == 0 else (COLOR_BLUE if i == 1 else RGBColor(225, 29, 72))

    # Bottom Left: 2D PCA Image
    pca_path = os.path.join(RESULTS_DIR, "clustering", "cluster_scatter.png")
    if os.path.exists(pca_path):
        add_card(s6, Inches(0.8), Inches(4.2), Inches(6.5), Inches(2.8))
        s6.shapes.add_picture(pca_path, Inches(0.9), Inches(4.3), width=Inches(6.3))

    # Bottom Right: Interpretation Box
    add_card(s6, Inches(7.5), Inches(4.2), Inches(5.033), Inches(2.8))
    ibox = s6.shapes.add_textbox(Inches(7.7), Inches(4.35), Inches(4.6), Inches(2.5))
    tib = ibox.text_frame
    tib.word_wrap = True
    p = tib.paragraphs[0]
    p.text = "Profile Risk Insights:"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = COLOR_NAVY
    p.space_after = Pt(8)

    insights = [
        "Cluster 2 (Prime): High credit score (741.8) results in only a 3.93% default rate.",
        "Cluster 1 (Standard): Mid-tier stability with long employment tenure (91.5 mos) and 12.38% default.",
        "Cluster 0 (Subprime): Short employment (27.0 mos) drives default to 20.36% (over 5x higher than Prime).",
        "PCA Projection confirms distinct spatial separation across financial leverage components."
    ]
    for ins in insights:
        pi = tib.add_paragraph()
        pi.text = f"• {ins}"
        pi.font.size = Pt(10)
        pi.font.color.rgb = COLOR_TEXT_MAIN
        pi.space_after = Pt(4)

    s6.notes_slide.notes_text_frame.text = (
        "Here are the mined borrower profiles. Cluster 2 represents our Prime borrowers with average credit of 741.8 and a low 3.93% default rate. "
        "Cluster 0 captures High-Risk borrowers who have brief employment history (27 months), exhibiting a 20.36% default rate. "
        "The 2D PCA projection clearly shows the geometric separation among these three segments."
    )

    # =========================================================================
    # SLIDE 7: Association Rule Mining (Apriori Methodology)
    # =========================================================================
    s7 = prs.slides.add_slide(blank_layout)
    set_slide_background(s7)
    create_slide_header(s7, "Association Rule Mining: Methodology & Metric Formulas")

    # Card 1: Discretization
    add_card(s7, Inches(0.8), Inches(1.4), Inches(5.6), Inches(5.5))
    b7a = s7.shapes.add_textbox(Inches(1.0), Inches(1.6), Inches(5.2), Inches(5.0))
    t7a = b7a.text_frame
    t7a.word_wrap = True
    p = t7a.paragraphs[0]
    p.text = "Continuous Feature Discretization"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = COLOR_NAVY
    p.space_after = Pt(12)

    disc_items = [
        ("Income:", " Tertiles (Income=Low, Medium, High)"),
        ("Credit Score:", " Domain bands: Poor (<580), Fair (580-670), Good (670-740), Excellent (>740)"),
        ("Debt-to-Income (DTI):", " Low (<0.30), Medium (0.30-0.50), High (>0.50)"),
        ("Loan Amount:", " Tertiles (Small, Medium, Large)"),
        ("Co-Signer Status:", " CoSigner=Yes / CoSigner=No"),
        ("Employment Type:", " Full-time, Part-time, Self-employed, Unemployed"),
        ("Target Consequent:", " Explicitly filtered for Default=Yes")
    ]
    for l, v in disc_items:
        pi = t7a.add_paragraph()
        pi.text = f"• {l}{v}"
        pi.font.size = Pt(11)
        pi.font.color.rgb = COLOR_TEXT_MAIN
        pi.space_after = Pt(8)

    # Card 2: Formulas & Definitions
    add_card(s7, Inches(6.8), Inches(1.4), Inches(5.733), Inches(5.5))
    b7b = s7.shapes.add_textbox(Inches(7.0), Inches(1.6), Inches(5.3), Inches(5.0))
    t7b = b7b.text_frame
    t7b.word_wrap = True
    p = t7b.paragraphs[0]
    p.text = "Association Rule Formulas & Meaning"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = COLOR_NAVY
    p.space_after = Pt(12)

    formulas = [
        ("Support(A -> B):", " P(A and B)\nFrequency of co-occurrence in the portfolio.\n(Min threshold set to 0.03 = 3%)"),
        ("Confidence(A -> B):", " P(B | A) = Support(A and B) / Support(A)\nConditional probability of Default given the borrower conditions.\n(Min threshold set to 0.30 = 30%)"),
        ("Lift(A -> B):", " Confidence / P(B)\nMeasures how many times more likely Default is compared to random chance.\n• Lift = 1: Independent\n• Lift > 1: Strong positive co-occurrence risk indicator"),
        ("Institutional Impact:", " Uncovers multi-condition risk combinations for credit rule engines and underwriting checklists.")
    ]
    for l, v in formulas:
        pi = t7b.add_paragraph()
        pi.text = f"• {l}\n  {v}"
        pi.font.size = Pt(11)
        pi.font.color.rgb = COLOR_TEXT_MAIN
        pi.space_after = Pt(10)

    s7.notes_slide.notes_text_frame.text = (
        "To apply the Apriori algorithm, continuous numerical features were discretized into quantiles and credit bureau bands. "
        "We evaluated rules based on Support, Confidence, and Lift. "
        "Lift is particularly crucial because it measures the multiplicative increase in default risk over baseline."
    )

    # =========================================================================
    # SLIDE 8: Top Association Rules Ranked by Lift
    # =========================================================================
    s8 = prs.slides.add_slide(blank_layout)
    set_slide_background(s8)
    create_slide_header(s8, "Association Rules: Top Risk Patterns (Consequent: Default=Yes)")

    # Top Table
    add_card(s8, Inches(0.8), Inches(1.4), Inches(11.733), Inches(4.2))
    tbl_shape8 = s8.shapes.add_table(6, 6, Inches(1.0), Inches(1.6), Inches(11.333), Inches(3.7))
    tbl8 = tbl_shape8.table

    h8 = ["Rank", "Antecedent Condition (IF...)", "Consequent", "Support", "Confidence", "Lift Ratio"]
    for j, h in enumerate(h8):
        c = tbl8.cell(0, j)
        c.text = h
        c.fill.solid()
        c.fill.fore_color.rgb = COLOR_NAVY
        for p in c.text_frame.paragraphs:
            p.alignment = PP_ALIGN.CENTER
            p.font.size = Pt(11)
            p.font.bold = True
            p.font.color.rgb = COLOR_WHITE

    d8 = [
        ["1", "Income=Low, CreditScore=Poor, LoanAmount=Large", "Default=Yes", "3.94%", "66.93%", "5.69x"],
        ["2", "Income=Low, DTIRatio=High, LoanAmount=Large", "Default=Yes", "3.42%", "60.64%", "5.16x"],
        ["3", "CreditScore=Poor, Income=Low, CoSigner=No, DTIRatio=High", "Default=Yes", "3.36%", "54.49%", "4.64x"],
        ["4", "Income=Low, CoSigner=No, LoanAmount=Large", "Default=Yes", "4.19%", "52.46%", "4.46x"],
        ["5", "Income=Low, CreditScore=Poor, DTIRatio=High", "Default=Yes", "4.43%", "50.15%", "4.27x"]
    ]

    for i, row in enumerate(d8):
        for j, val in enumerate(row):
            c = tbl8.cell(i + 1, j)
            c.text = val
            c.fill.solid()
            c.fill.fore_color.rgb = RGBColor(238, 242, 255) if i == 0 else (COLOR_ROW_ALT if i % 2 == 1 else COLOR_WHITE)
            for p in c.text_frame.paragraphs:
                p.alignment = PP_ALIGN.CENTER if j != 1 else PP_ALIGN.LEFT
                p.font.size = Pt(10)
                p.font.bold = (j in [0, 4, 5])
                if j == 5:
                    p.font.color.rgb = COLOR_BLUE

    # Bottom Insights Card
    add_card(s8, Inches(0.8), Inches(5.8), Inches(11.733), Inches(1.2), bg_color=RGBColor(254, 242, 242), border_color=RGBColor(244, 63, 94))
    bx8 = s8.shapes.add_textbox(Inches(1.0), Inches(5.85), Inches(11.333), Inches(1.1))
    tbx8 = bx8.text_frame
    tbx8.word_wrap = True
    p = tbx8.paragraphs[0]
    p.text = "Key Underwriting Insights:"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = RGBColor(190, 18, 60)
    
    ins_text = [
        "• Toxic Combination: Low Income + Poor Credit + Large Loan Amount increases default rate to 66.93% (5.69x baseline risk).",
        "• Co-Signer Impact: Absence of a co-signer under high DTI drives default confidence to 54.49% (Lift = 4.64x).",
        "• Policy Action: Loans matching Top 3 rules should be automatically flagged for mandatory collateral or outright decline."
    ]
    for it in ins_text:
        pi = tbx8.add_paragraph()
        pi.text = it
        pi.font.size = Pt(10)
        pi.font.color.rgb = COLOR_TEXT_MAIN

    s8.notes_slide.notes_text_frame.text = (
        "Here are our top-ranked association rules. Rule 1 shows that an applicant with Low Income, Poor Credit, and a Large Loan Amount "
        "has a 66.93% default confidence, which is 5.69 times higher than random chance. "
        "Rule 3 highlights that the lack of a co-signer combined with high DTI increases default probability to over 54%."
    )

    # =========================================================================
    # SLIDE 9: Prediction Engine (Default Probability & Risk Tiers)
    # =========================================================================
    s9 = prs.slides.add_slide(blank_layout)
    set_slide_background(s9)
    create_slide_header(s9, "Prediction Engine: Continuous Default Probability Scoring")

    # Left Card: Policy Tiers
    add_card(s9, Inches(0.8), Inches(1.4), Inches(6.0), Inches(5.5))
    b9a = s9.shapes.add_textbox(Inches(1.0), Inches(1.6), Inches(5.6), Inches(5.0))
    t9a = b9a.text_frame
    t9a.word_wrap = True
    p = t9a.paragraphs[0]
    p.text = "4-Tier Credit Risk Policy Matrix"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = COLOR_NAVY
    p.space_after = Pt(12)

    tiers = [
        ("Low Risk (P < 20%):", " Fast-track approval; Prime interest rate (4.5% - 7.5% APR).", COLOR_EMERALD),
        ("Moderate Risk (20% <= P < 45%):", " Standard review; income verification required (8.0% - 13.5% APR).", COLOR_BLUE),
        ("High Risk (45% <= P < 70%):", " Conditional approval; mandatory co-signer and collateral required.", RGBColor(217, 119, 6)),
        ("Critical Risk (P >= 70%):", " Automated decline; risk exceeds institutional lending appetite.", RGBColor(225, 29, 72))
    ]
    for title, desc, col in tiers:
        pi = t9a.add_paragraph()
        pi.text = f"• {title}"
        pi.font.size = Pt(11)
        pi.font.bold = True
        pi.font.color.rgb = col
        p_desc = t9a.add_paragraph()
        p_desc.text = f"   {desc}"
        p_desc.font.size = Pt(10)
        p_desc.font.color.rgb = COLOR_TEXT_MAIN
        p_desc.space_after = Pt(8)

    # Right Card: Calibration & Engine Verification
    add_card(s9, Inches(7.1), Inches(1.4), Inches(5.433), Inches(5.5))
    b9b = s9.shapes.add_textbox(Inches(7.3), Inches(1.6), Inches(5.0), Inches(5.0))
    t9b = b9b.text_frame
    t9b.word_wrap = True
    p = t9b.paragraphs[0]
    p.text = "Engine Calibration & Real-Time Output"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = COLOR_NAVY
    p.space_after = Pt(12)

    calib_items = [
        ("Brier Score Loss:", " 0.0168 (near 0.0 indicates exceptional probability calibration quality)."),
        ("Model Log Loss:", " 0.0622 | Test ROC-AUC: 0.9973"),
        ("Sample Scoring 1 (Prime):", " Credit 810, DTI 0.15\n-> P(Default=1) = 0.02% (Low Risk Badge)"),
        ("Sample Scoring 2 (Subprime):", " Credit 420, DTI 0.82\n-> P(Default=1) = 99.99% (Critical Risk Badge)"),
        ("Automated Explanations:", " Engine isolates explicit risk factors (DTI > 45%, Credit < 600, Unemployed, No Co-Signer).")
    ]
    for l, v in calib_items:
        pi = t9b.add_paragraph()
        pi.text = f"• {l} {v}"
        pi.font.size = Pt(10)
        pi.font.color.rgb = COLOR_TEXT_MAIN
        pi.space_after = Pt(8)

    s9.notes_slide.notes_text_frame.text = (
        "Unlike binary classification, modern fintech uses continuous probability scoring. "
        "Our engine achieves a Brier score of 0.0168, proving high probability reliability. "
        "We map probabilities into 4 risk tiers and dynamically generate explainable risk factors."
    )

    # =========================================================================
    # SLIDE 10: Summary & Review 3 Transition
    # =========================================================================
    s10 = prs.slides.add_slide(blank_layout)
    set_slide_background(s10)
    create_slide_header(s10, "Summary of Review 2 & Roadmap to Final Review 3")

    # Card 1: Review 2 Summary
    add_card(s10, Inches(0.8), Inches(1.4), Inches(5.7), Inches(5.5))
    b10a = s10.shapes.add_textbox(Inches(1.0), Inches(1.6), Inches(5.3), Inches(5.0))
    t10a = b10a.text_frame
    t10a.word_wrap = True
    p = t10a.paragraphs[0]
    p.text = "Review 2 Deliverables Accomplished"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = COLOR_NAVY
    p.space_after = Pt(14)

    r2_items = [
        "Classification: Benchmarked 4 models; Gradient Boosting achieved champion status (F1 = 0.8965, ROC-AUC = 0.9973).",
        "Clustering: K-Means identified 3 borrower profiles (Prime: 3.93% default vs Subprime: 20.36% default).",
        "Association Rules: Apriori algorithm extracted high-conviction risk rules with Lift up to 5.69x.",
        "Prediction Engine: Operational continuous risk scorer with 0.0168 Brier score calibration.",
        "Codebase & Git: Fully verified, UTF-8 compliant, and pushed to GitHub main branch."
    ]
    for it in r2_items:
        pi = t10a.add_paragraph()
        pi.text = f"✓ {it}"
        pi.font.size = Pt(11)
        pi.font.color.rgb = COLOR_TEXT_MAIN
        pi.space_after = Pt(10)

    # Card 2: Review 3 Roadmap
    add_card(s10, Inches(6.8), Inches(1.4), Inches(5.733), Inches(5.5))
    b10b = s10.shapes.add_textbox(Inches(7.0), Inches(1.6), Inches(5.3), Inches(5.0))
    t10b = b10b.text_frame
    t10b.word_wrap = True
    p = t10b.paragraphs[0]
    p.text = "Roadmap to Final Review 3"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = COLOR_NAVY
    p.space_after = Pt(14)

    r3_items = [
        "Interactive Web Application: Full React 19 + Vite dashboard featuring 7 visual analytical modules.",
        "Real-Time Loan Simulator: Interactive form for underwriters to test any applicant profile live.",
        "Streamlit Python Dashboard: Complete secondary dashboard runner with live parameter tuning.",
        "End-to-End Pipeline Demo: Complete walkthrough from Star Schema Data Warehouse to real-time ML risk scoring.",
        "Production Deployment: Final build passed and ready for institutional hosting."
    ]
    for it in r3_items:
        pi = t10b.add_paragraph()
        pi.text = f"➔ {it}"
        pi.font.size = Pt(11)
        pi.font.color.rgb = COLOR_TEXT_MAIN
        pi.space_after = Pt(10)

    s10.notes_slide.notes_text_frame.text = (
        "In summary, all four required components of Review 2 are completely built, benchmarked, and verified. "
        "For Review 3, we will demonstrate the fully integrated interactive web dashboard and real-time loan underwriting simulator. "
        "Thank you faculty, we are now ready for your questions."
    )

    prs.save(OUTPUT_PPT_PATH)
    print(f"[PPT GENERATOR] Successfully created presentation deck: {OUTPUT_PPT_PATH}")

if __name__ == "__main__":
    create_deck()
