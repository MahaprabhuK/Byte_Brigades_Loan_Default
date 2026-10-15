"""
Byte Brigades - Academic Review 2 PowerPoint Generator (Comprehensive & Concise)
---------------------------------------------------------------------------------
Generates a structured 16:9 presentation deck (Review2_ByteBrigades_LoanDefault.pptx)
incorporating:
- Teammate details, course code (CSI3010), date (16/10/26)
- Pre-topic "Why, How, What It Does, Practical Use" introductory slides for:
    1. Classification
    2. Clustering
    3. Association Rules
    4. Prediction Engine
- Code snippets used for each module
- Pictorial visual charts (ROC, Confusion Matrix, Elbow, 2D PCA, Rules Lift Chart)
- Compact, punchy numerical benchmark results
"""

import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RESULTS_DIR = os.path.join(BASE_DIR, "results")
OUTPUT_PPT_PATH = os.path.join(BASE_DIR, "Review2_ByteBrigades_LoanDefault.pptx")

# Color Palette Constants
COLOR_BG = RGBColor(248, 250, 252)          # Slate-50 (#F8FAFC)
COLOR_NAVY = RGBColor(15, 23, 42)            # Slate-900 (#0F172A)
COLOR_TITLE = RGBColor(15, 23, 42)           # Primary Title
COLOR_BLUE = RGBColor(37, 99, 235)           # Blue-600 (#2563EB)
COLOR_EMERALD = RGBColor(16, 185, 129)       # Emerald-500 (#10B981)
COLOR_CARD_BG = RGBColor(255, 255, 255)      # Pure White Card
COLOR_CARD_BORDER = RGBColor(226, 232, 240)  # Slate-200
COLOR_TEXT_MAIN = RGBColor(51, 65, 85)       # Slate-700
COLOR_TEXT_MUTED = RGBColor(100, 116, 139)   # Slate-500
COLOR_WHITE = RGBColor(255, 255, 255)
COLOR_ROW_ALT = RGBColor(241, 245, 249)      # Slate-100
COLOR_CODE_BG = RGBColor(15, 23, 42)         # Deep Code Box
COLOR_CODE_BORDER = RGBColor(51, 65, 85)

def create_slide_header(slide, title_text, category="CSI3010: DATA WAREHOUSING & DATA MINING | REVIEW 2"):
    accent_bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(0.12))
    accent_bar.fill.solid()
    accent_bar.fill.fore_color.rgb = COLOR_BLUE
    accent_bar.line.fill.background()

    cat_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.28), Inches(11.7), Inches(0.28))
    tf_cat = cat_box.text_frame
    tf_cat.word_wrap = True
    tf_cat.margin_left = tf_cat.margin_top = tf_cat.margin_right = tf_cat.margin_bottom = 0
    p_cat = tf_cat.paragraphs[0]
    p_cat.text = category.upper()
    p_cat.font.size = Pt(10)
    p_cat.font.bold = True
    p_cat.font.color.rgb = COLOR_BLUE

    title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.55), Inches(11.7), Inches(0.6))
    tf_title = title_box.text_frame
    tf_title.word_wrap = True
    tf_title.margin_left = tf_title.margin_top = tf_title.margin_right = tf_title.margin_bottom = 0
    p_title = tf_title.paragraphs[0]
    p_title.text = title_text
    p_title.font.size = Pt(21)
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

def add_code_card(slide, left, top, width, height, filename, code_lines):
    card = add_card(slide, left, top, width, height, bg_color=COLOR_CODE_BG, border_color=COLOR_CODE_BORDER)
    
    hdr = slide.shapes.add_textbox(left + Inches(0.2), top + Inches(0.12), width - Inches(0.4), Inches(0.3))
    thdr = hdr.text_frame
    thdr.word_wrap = True
    thdr.margin_left = thdr.margin_top = thdr.margin_right = thdr.margin_bottom = 0
    p = thdr.paragraphs[0]
    p.text = f"⚙  {filename}"
    p.font.size = Pt(9.5)
    p.font.bold = True
    p.font.color.rgb = COLOR_EMERALD

    cbox = slide.shapes.add_textbox(left + Inches(0.2), top + Inches(0.45), width - Inches(0.4), height - Inches(0.55))
    tc = cbox.text_frame
    tc.word_wrap = True
    tc.margin_left = tc.margin_top = tc.margin_right = tc.margin_bottom = 0

    for i, line in enumerate(code_lines):
        p = tc.paragraphs[0] if i == 0 else tc.add_paragraph()
        p.text = line
        p.font.size = Pt(8.5)
        p.font.name = "Consolas"
        if line.strip().startswith("#"):
            p.font.color.rgb = RGBColor(148, 163, 184)
        elif any(k in line for k in ["import ", "from ", "def ", "class ", "return ", "for ", "in ", "if ", "elif ", "else:"]):
            p.font.color.rgb = RGBColor(147, 197, 253)
        elif any(k in line for k in ["Classifier", "KMeans", "apriori", "StandardScaler", "PCA", "association_rules"]):
            p.font.color.rgb = RGBColor(110, 231, 183)
        else:
            p.font.color.rgb = RGBColor(241, 245, 249)

def add_topic_intro_slide(prs, blank_layout, topic_num, topic_name, why_points, how_points, what_points, use_points, accent_color=COLOR_BLUE):
    """Creates a structured 4-quadrant introductory slide explaining Why, How, What It Does, and Practical Use."""
    slide = prs.slides.add_slide(blank_layout)
    set_slide_background(slide)
    create_slide_header(slide, f"Topic {topic_num}: {topic_name} — Concept & Institutional Role", category=f"CSI3010 | MODULE {topic_num}: {topic_name.upper()}")

    cards_meta = [
        ("1. WHY We Used It (The Problem / Need)", why_points, Inches(0.8), Inches(1.35), Inches(5.7), Inches(2.7), RGBColor(238, 242, 255), COLOR_BLUE),
        ("2. HOW We Used It (Methodology & Pipeline)", how_points, Inches(6.8), Inches(1.35), Inches(5.733), Inches(2.7), RGBColor(236, 253, 245), COLOR_EMERALD),
        ("3. WHAT It Does in Our Project (System Role)", what_points, Inches(0.8), Inches(4.25), Inches(5.7), Inches(2.8), RGBColor(254, 249, 195), RGBColor(202, 138, 4)),
        ("4. PRACTICAL USE (Underwriting & Business Value)", use_points, Inches(6.8), Inches(4.25), Inches(5.733), Inches(2.8), RGBColor(245, 243, 255), RGBColor(147, 51, 234))
    ]

    for title, points, l, t, w, h, bg_c, border_c in cards_meta:
        add_card(slide, l, t, w, h, bg_color=bg_c, border_color=border_c)
        bx = slide.shapes.add_textbox(l + Inches(0.2), t + Inches(0.15), w - Inches(0.4), h - Inches(0.3))
        tb = bx.text_frame
        tb.word_wrap = True
        p = tb.paragraphs[0]
        p.text = title
        p.font.size = Pt(12)
        p.font.bold = True
        p.font.color.rgb = border_c
        p.space_after = Pt(6)

        for pt in points:
            pi = tb.add_paragraph()
            pi.text = f"• {pt}"
            pi.font.size = Pt(10)
            pi.font.color.rgb = COLOR_TEXT_MAIN
            pi.space_after = Pt(4)

    return slide

def set_slide_background(slide, color=COLOR_BG):
    slide.background.fill.solid()
    slide.background.fill.fore_color.rgb = color

def create_deck():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # =========================================================================
    # SLIDE 1: Title Slide (with required student, course & date details)
    # =========================================================================
    s1 = prs.slides.add_slide(blank_layout)
    set_slide_background(s1, COLOR_NAVY)

    top_bar = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(0.18))
    top_bar.fill.solid()
    top_bar.fill.fore_color.rgb = COLOR_EMERALD
    top_bar.line.fill.background()

    tbox = s1.shapes.add_textbox(Inches(1.0), Inches(1.2), Inches(11.333), Inches(2.6))
    tf = tbox.text_frame
    tf.word_wrap = True

    p0 = tf.paragraphs[0]
    p0.text = "COURSE: DATA WAREHOUSING AND DATA MINING  |  COURSE CODE: CSI3010"
    p0.font.size = Pt(11)
    p0.font.bold = True
    p0.font.color.rgb = COLOR_EMERALD
    p0.space_after = Pt(10)

    p1 = tf.add_paragraph()
    p1.text = "Loan Default Risk Prediction &\nBorrower Profiling System"
    p1.font.size = Pt(34)
    p1.font.bold = True
    p1.font.color.rgb = COLOR_WHITE
    p1.space_after = Pt(12)

    p2 = tf.add_paragraph()
    p2.text = "Academic Review - 2: Classification  •  Clustering  •  Association Rules  •  Prediction Engine"
    p2.font.size = Pt(13)
    p2.font.color.rgb = RGBColor(148, 163, 184)

    # Card 1: Team Members
    add_card(s1, Inches(1.0), Inches(4.3), Inches(5.4), Inches(2.4), bg_color=RGBColor(30, 41, 59), border_color=RGBColor(51, 65, 85))
    tm_box = s1.shapes.add_textbox(Inches(1.2), Inches(4.45), Inches(5.0), Inches(2.1))
    ttm = tm_box.text_frame
    ttm.word_wrap = True
    p = ttm.paragraphs[0]
    p.text = "TEAM: BYTE BRIGADES"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = COLOR_EMERALD
    p.space_after = Pt(8)

    members = [
        ("Mahaprabhu K", "24MID0109"),
        ("Pavithran O", "24MID0144")
    ]
    for name, regno in members:
        pi = ttm.add_paragraph()
        pi.text = f"• {name}  ({regno})"
        pi.font.size = Pt(13)
        pi.font.bold = True
        pi.font.color.rgb = COLOR_WHITE
        pi.space_after = Pt(4)

    # Card 2: Date & Project Details
    add_card(s1, Inches(6.8), Inches(4.3), Inches(5.5), Inches(2.4), bg_color=RGBColor(30, 41, 59), border_color=RGBColor(51, 65, 85))
    dt_box = s1.shapes.add_textbox(Inches(7.0), Inches(4.45), Inches(5.1), Inches(2.1))
    tdt = dt_box.text_frame
    tdt.word_wrap = True
    p = tdt.paragraphs[0]
    p.text = "PROJECT METADATA"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = COLOR_EMERALD
    p.space_after = Pt(8)

    meta_items = [
        ("Review Phase:", "Review - 2 (Data Mining & Predictive Modeling)"),
        ("Date of Presentation:", "16/10/26"),
        ("Dataset Parameters:", "50,000 Records, 18 Features"),
        ("Target Variable:", "Default (Binary 0 = No Default, 1 = Default)")
    ]
    for k, v in meta_items:
        pi = tdt.add_paragraph()
        pi.text = f"• {k} {v}"
        pi.font.size = Pt(11)
        pi.font.color.rgb = RGBColor(226, 232, 240)
        pi.space_after = Pt(3)

    s1.notes_slide.notes_text_frame.text = (
        "Good morning faculty. We are team Byte Brigades presenting Review 2 for CSI3010 Data Warehousing & Data Mining. "
        "Our team members are Mahaprabhu K (24MID0109) and Pavithran O (24MID0144). "
        "Today we present the four core data mining components: Classification, Clustering, Association Rules, and Default Prediction."
    )

    # =========================================================================
    # SLIDE 2: Dataset Profile & Review-2 Scope Overview
    # =========================================================================
    s2 = prs.slides.add_slide(blank_layout)
    set_slide_background(s2)
    create_slide_header(s2, "Dataset Characteristics & Review-2 Pipeline Scope")

    modules = [
        ("1. Classification", "Default vs. No-Default\n4 ML models benchmarked", COLOR_BLUE),
        ("2. Clustering", "Borrower Segmentation\nOptimal K=3 risk archetypes", COLOR_EMERALD),
        ("3. Association Rules", "Apriori Co-occurrence\nMulti-feature risk rules (Lift > 5x)", RGBColor(217, 119, 6)),
        ("4. Prediction Engine", "Continuous P(Default=1)\nCalibrated scoring & risk tiers", RGBColor(147, 51, 234))
    ]
    for i, (m_title, m_desc, m_color) in enumerate(modules):
        left_pos = Inches(0.8 + i * 2.98)
        add_card(s2, left_pos, Inches(1.3), Inches(2.8), Inches(1.3), border_color=m_color)
        bx = s2.shapes.add_textbox(left_pos + Inches(0.15), Inches(1.4), Inches(2.5), Inches(1.1))
        tbx = bx.text_frame
        tbx.word_wrap = True
        p = tbx.paragraphs[0]
        p.text = m_title
        p.font.size = Pt(11.5)
        p.font.bold = True
        p.font.color.rgb = m_color
        p.space_after = Pt(2)
        p2 = tbx.add_paragraph()
        p2.text = m_desc
        p2.font.size = Pt(9.5)
        p2.font.color.rgb = COLOR_TEXT_MAIN

    add_card(s2, Inches(0.8), Inches(2.8), Inches(5.7), Inches(4.2))
    b2a = s2.shapes.add_textbox(Inches(1.0), Inches(2.95), Inches(5.3), Inches(3.9))
    t2a = b2a.text_frame
    t2a.word_wrap = True
    p = t2a.paragraphs[0]
    p.text = "Dataset Profile & Stratification"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = COLOR_NAVY
    p.space_after = Pt(8)

    ds_points = [
        ("Total Records:", "50,000 credit records"),
        ("Feature Space:", "18 attributes (Income, Credit Score, DTI, Loan Amount, etc.)"),
        ("Train / Test Partition:", "80% Train (40,000) / 20% Holdout Test (10,000)"),
        ("Stratification:", "Maintains exact class proportions across splits"),
        ("Leakage Prevention:", "StandardScaler & OneHotEncoder fit strictly on training set")
    ]
    for k, v in ds_points:
        pi = t2a.add_paragraph()
        pi.text = f"• {k} {v}"
        pi.font.size = Pt(11)
        pi.font.color.rgb = COLOR_TEXT_MAIN
        pi.space_after = Pt(6)

    add_card(s2, Inches(6.8), Inches(2.8), Inches(5.733), Inches(4.2), bg_color=RGBColor(254, 242, 242), border_color=RGBColor(244, 63, 94))
    b2b = s2.shapes.add_textbox(Inches(7.0), Inches(2.95), Inches(5.3), Inches(3.9))
    t2b = b2b.text_frame
    t2b.word_wrap = True
    p = t2b.paragraphs[0]
    p.text = "Class Imbalance: The 'Accuracy Trap'"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = RGBColor(190, 18, 60)
    p.space_after = Pt(8)

    imb_points = [
        ("Non-Defaulters (Class 0):", "88.3% (~44,150 applicants)"),
        ("Defaulters (Class 1):", "11.7% (~5,850 applicants)"),
        ("The 'Accuracy Paradox':", "A naive zero-default prediction yields 88.3% accuracy but detects 0% of risky loans, causing extreme financial write-offs."),
        ("Evaluation Focus:", "Benchmarking prioritizes Recall (detecting defaulters), F1-Score (balanced harmonic mean), and ROC-AUC (threshold-independent).")
    ]
    for k, v in imb_points:
        pi = t2b.add_paragraph()
        pi.text = f"• {k} {v}"
        pi.font.size = Pt(11)
        pi.font.color.rgb = COLOR_TEXT_MAIN
        pi.space_after = Pt(6)

    s2.notes_slide.notes_text_frame.text = (
        "Here is the dataset profile. With 50,000 records, defaults represent only 11.7%. "
        "A naive model predicting zero defaults achieves 88% accuracy while failing completely. "
        "Hence our evaluation strictly prioritizes Recall, F1-Score, and ROC-AUC."
    )

    # =========================================================================
    # SLIDE 3: Topic 1 INTRO — Classification: Why, How, What It Does & Use
    # =========================================================================
    add_topic_intro_slide(
        prs, blank_layout,
        topic_num="1",
        topic_name="Classification",
        why_points=[
            "Lending institutions suffer major capital write-offs when borrowers default on unpaid principal.",
            "Lenders need an automated, objective mechanism to accurately classify applicants as creditworthy vs. default-prone.",
            "Manual review is slow, subjective, and unable to scale across thousands of credit applications."
        ],
        how_points=[
            "Benchmarked 4 supervised algorithms: Logistic Regression, Decision Tree, Random Forest, Gradient Boosting.",
            "Handled class imbalance (11.7% default) via class-weighting and optimized for Recall, F1-Score, and ROC-AUC.",
            "Trained strictly on 80% split (40,000) and evaluated on 20% holdout test set (10,000) with zero data leakage."
        ],
        what_points=[
            "Learns non-linear financial patterns separating non-defaulters from defaulters.",
            "Identifies the champion model (Gradient Boosting) achieving 97.75% accuracy and 0.8965 F1-Score.",
            "Exports the champion model into prediction/saved_models/best_classifier.joblib for production scoring."
        ],
        use_points=[
            "Automated Underwriting: Instantly approves prime applicants and screens out high-risk applicants.",
            "Loss Prevention: Drastically slashes Non-Performing Assets (NPAs) while preserving 97.11% precision.",
            "Regulatory Compliance: Provides objective, auditable classification standards for credit assessment."
        ],
        accent_color=COLOR_BLUE
    )

    # =========================================================================
    # SLIDE 4: Classification — Code & Multi-Model Benchmark Table
    # =========================================================================
    s4 = prs.slides.add_slide(blank_layout)
    set_slide_background(s4)
    create_slide_header(s4, "Classification: Algorithm Implementation & Benchmark Results")

    code_class = [
        "# classification/train_classifiers.py",
        "from sklearn.ensemble import GradientBoostingClassifier",
        "from sklearn.metrics import f1_score, roc_auc_score",
        "",
        "models = {",
        "  'Logistic Regression': LogisticRegression(class_weight='balanced'),",
        "  'Decision Tree': DecisionTreeClassifier(max_depth=8),",
        "  'Random Forest': RandomForestClassifier(n_estimators=100),",
        "  'Gradient Boosting': GradientBoostingClassifier(max_depth=5, lr=0.1)",
        "}",
        "for name, model in models.items():",
        "    model.fit(X_train, y_train)",
        "    y_prob = model.predict_proba(X_test)[:, 1]",
        "    f1 = f1_score(y_test, model.predict(X_test))",
        "    auc = roc_auc_score(y_test, y_prob)",
        "joblib.dump(best_model, 'best_classifier.joblib')"
    ]
    add_code_card(s4, Inches(0.8), Inches(1.35), Inches(4.8), Inches(5.6), "train_classifiers.py", code_class)

    add_card(s4, Inches(5.8), Inches(1.35), Inches(6.733), Inches(4.3))
    tbl_shape3 = s4.shapes.add_table(5, 7, Inches(5.95), Inches(1.5), Inches(6.433), Inches(3.9))
    tbl3 = tbl_shape3.table

    h3 = ["Model", "Accuracy", "Precision", "Recall", "F1", "AUC", "Log Loss"]
    for j, h in enumerate(h3):
        c = tbl3.cell(0, j)
        c.text = h
        c.fill.solid()
        c.fill.fore_color.rgb = COLOR_NAVY
        for p in c.text_frame.paragraphs:
            p.alignment = PP_ALIGN.CENTER
            p.font.size = Pt(10.5)
            p.font.bold = True
            p.font.color.rgb = COLOR_WHITE

    d3 = [
        ["Logistic Regression", "91.07%", "57.19%", "94.10%", "0.7115", "0.9816", "0.1885"],
        ["Decision Tree", "89.26%", "52.40%", "89.49%", "0.6610", "0.9342", "0.4943"],
        ["Random Forest", "95.79%", "76.13%", "93.25%", "0.8383", "0.9910", "0.1832"],
        ["Gradient Boosting", "97.75%", "97.11%", "83.25%", "0.8965", "0.9973", "0.0622"]
    ]
    for i, row in enumerate(d3):
        is_champ = (i == 3)
        for j, val in enumerate(row):
            c = tbl3.cell(i + 1, j)
            c.text = val
            c.fill.solid()
            c.fill.fore_color.rgb = RGBColor(236, 253, 245) if is_champ else (COLOR_ROW_ALT if i % 2 == 1 else COLOR_WHITE)
            for p in c.text_frame.paragraphs:
                p.alignment = PP_ALIGN.LEFT if j == 0 else PP_ALIGN.CENTER
                p.font.size = Pt(10)
                p.font.bold = is_champ or (j == 0)
                if is_champ and j in [1, 2, 4, 5]:
                    p.font.color.rgb = COLOR_EMERALD

    add_card(s4, Inches(5.8), Inches(5.8), Inches(6.733), Inches(1.15), bg_color=RGBColor(238, 242, 255), border_color=COLOR_BLUE)
    hl_b = s4.shapes.add_textbox(Inches(5.95), Inches(5.85), Inches(6.433), Inches(1.05))
    thl = hl_b.text_frame
    thl.word_wrap = True
    p = thl.paragraphs[0]
    p.text = "★ Champion Architecture: Gradient Boosting"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = COLOR_BLUE
    p.space_after = Pt(2)
    p2 = thl.add_paragraph()
    p2.text = "• Accuracy: 97.75%  |  Precision: 97.11%  |  F1-Score: 0.8965  |  ROC-AUC: 0.9973\n• Lowest Log Loss (0.0622) minimizes severe financial misclassification penalties."
    p2.font.size = Pt(10)
    p2.font.color.rgb = COLOR_TEXT_MAIN

    s4.notes_slide.notes_text_frame.text = (
        "Here is the training code and test set benchmark. "
        "Logistic regression provides high recall but generates too many false alarms (57% precision). "
        "Gradient Boosting achieved 97.11% precision and 83.25% recall, with a champion F1-score of 0.8965 and 0.9973 ROC-AUC."
    )

    # =========================================================================
    # SLIDE 5: Classification — Pictorial Diagnostics (ROC & Confusion Matrix)
    # =========================================================================
    s5 = prs.slides.add_slide(blank_layout)
    set_slide_background(s5)
    create_slide_header(s5, "Classification: Pictorial Diagnostics (Confusion Matrices & ROC)")

    cm_path = os.path.join(RESULTS_DIR, "classification", "confusion_matrices.png")
    if os.path.exists(cm_path):
        add_card(s5, Inches(0.8), Inches(1.35), Inches(5.7), Inches(4.5))
        s5.shapes.add_picture(cm_path, Inches(0.9), Inches(1.45), width=Inches(5.5))

    roc_path = os.path.join(RESULTS_DIR, "classification", "roc_curves.png")
    if os.path.exists(roc_path):
        add_card(s5, Inches(6.8), Inches(1.35), Inches(5.733), Inches(4.5))
        s5.shapes.add_picture(roc_path, Inches(6.9), Inches(1.45), width=Inches(5.5))

    add_card(s5, Inches(0.8), Inches(6.0), Inches(11.733), Inches(1.0))
    b4 = s5.shapes.add_textbox(Inches(1.0), Inches(6.05), Inches(11.333), Inches(0.9))
    tb4 = b4.text_frame
    tb4.word_wrap = True
    p = tb4.paragraphs[0]
    p.text = "Key Diagnostic Observations:"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = COLOR_NAVY
    p.space_after = Pt(2)
    p2 = tb4.add_paragraph()
    p2.text = "• Confusion Matrix: Gradient Boosting eliminates false alarms (only 2.89% false positive rate), preventing healthy customer turnaways.\n• ROC Curves: Gradient Boosting hugs the upper-left boundary (AUC = 0.9973), outperforming Decision Tree (0.934) and Logistic Reg (0.982)."
    p2.font.size = Pt(10)
    p2.font.color.rgb = COLOR_TEXT_MAIN

    s5.notes_slide.notes_text_frame.text = (
        "The pictorial diagnostics show our four models. "
        "The confusion matrix heatmaps show Gradient Boosting maintains minimal false positives. "
        "The ROC curves confirm near-optimal probability separation across all decision thresholds."
    )

    # =========================================================================
    # SLIDE 6: Topic 2 INTRO — Clustering: Why, How, What It Does & Use
    # =========================================================================
    add_topic_intro_slide(
        prs, blank_layout,
        topic_num="2",
        topic_name="Clustering",
        why_points=[
            "Credit risk is not a flat binary outcome; borrowers have diverse financial archetypes.",
            "Lenders need to discover natural customer segments without relying on past default labels.",
            "Helps underwriters identify subtle risk buildup before defaults formally occur."
        ],
        how_points=[
            "Standardized 5 core numerical features: Income, CreditScore, LoanAmount, DTIRatio, MonthsEmployed.",
            "Trained K-Means clustering across K=2 to 6, evaluating within-cluster inertia and Silhouette scores.",
            "Identified optimal K=3 at the Elbow curve inflection point and validated cluster cohesion."
        ],
        what_points=[
            "Groups 50,000 borrowers into 3 natural, interpretable risk profiles (Prime, Standard, Vulnerable).",
            "Discovers that default rates differ by over 5x between clusters (3.93% vs. 20.36%) without using default labels during training.",
            "Projects the 5D feature space into 2D PCA components for geometric risk space visualization."
        ],
        use_points=[
            "Risk-Based Portfolio Pricing: Sets tailored interest rates and borrowing limits per tier.",
            "Proactive Portfolio Monitoring: Targets vulnerable cohorts with financial counseling before defaults trigger.",
            "Capital Allocation: Banks allocate capital reserves based on cluster risk concentrations."
        ],
        accent_color=COLOR_EMERALD
    )

    # =========================================================================
    # SLIDE 7: Clustering — Code & Optimal K Selection
    # =========================================================================
    s7 = prs.slides.add_slide(blank_layout)
    set_slide_background(s7)
    create_slide_header(s7, "Borrower Clustering: K-Means Code & Optimal K Determination")

    code_clust = [
        "# clustering/train_clustering.py",
        "from sklearn.cluster import KMeans",
        "from sklearn.metrics import silhouette_score",
        "",
        "features = ['Income', 'CreditScore', 'LoanAmount',",
        "            'DTIRatio', 'MonthsEmployed']",
        "X_scaled = StandardScaler().fit_transform(df[features])",
        "",
        "# Evaluate K from 2 to 6",
        "for k in range(2, 7):",
        "    kmeans = KMeans(n_clusters=k, random_state=42)",
        "    labels = kmeans.fit_predict(X_scaled)",
        "    inertia = kmeans.inertia_",
        "    sil = silhouette_score(X_scaled, labels)",
        "",
        "# Selected optimal K=3 (Elbow Inflection)",
        "final_kmeans = KMeans(n_clusters=3, random_state=42)"
    ]
    add_code_card(s7, Inches(0.8), Inches(1.35), Inches(4.8), Inches(5.6), "train_clustering.py", code_clust)

    elbow_path = os.path.join(RESULTS_DIR, "clustering", "elbow_silhouette.png")
    if os.path.exists(elbow_path):
        add_card(s7, Inches(5.8), Inches(1.35), Inches(6.733), Inches(4.3))
        s7.shapes.add_picture(elbow_path, Inches(5.9), Inches(1.45), width=Inches(6.5))

    add_card(s7, Inches(5.8), Inches(5.8), Inches(6.733), Inches(1.15), bg_color=RGBColor(236, 253, 245), border_color=COLOR_EMERALD)
    b5b = s7.shapes.add_textbox(Inches(5.95), Inches(5.85), Inches(6.433), Inches(1.05))
    tb5b = b5b.text_frame
    tb5b.word_wrap = True
    p = tb5b.paragraphs[0]
    p.text = "Optimal K=3 Selection Criteria:"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = COLOR_EMERALD
    p.space_after = Pt(2)
    p2 = tb5b.add_paragraph()
    p2.text = "• Elbow Method: Inertia drops steeply from K=2 (212,115) to K=3 (189,245), flattens thereafter.\n• Silhouette Cohesion: Confirms K=3 naturally segments borrowers into Prime, Standard, and Subprime tiers."
    p2.font.size = Pt(10)
    p2.font.color.rgb = COLOR_TEXT_MAIN

    s7.notes_slide.notes_text_frame.text = (
        "Here is our clustering implementation. We standardized 5 core financial features and ran K-Means across K=2 to 6. "
        "The Elbow plot exhibits an inflection point at K=3, creating three distinct risk archetypes."
    )

    # =========================================================================
    # SLIDE 8: Clustering — Risk Profiles ($K=3$) & 2D PCA Space
    # =========================================================================
    s8 = prs.slides.add_slide(blank_layout)
    set_slide_background(s8)
    create_slide_header(s8, "Borrower Risk Profiles ($K=3$) & 2D PCA Dimensionality Reduction")

    add_card(s8, Inches(0.8), Inches(1.35), Inches(6.2), Inches(5.5))
    tbl_shape6 = s8.shapes.add_table(4, 6, Inches(0.95), Inches(1.5), Inches(5.9), Inches(2.7))
    tbl6 = tbl_shape6.table

    h6 = ["Cluster", "Risk Tier", "Share", "Avg Credit", "Avg Emp", "Default Rate"]
    for j, h in enumerate(h6):
        c = tbl6.cell(0, j)
        c.text = h
        c.fill.solid()
        c.fill.fore_color.rgb = COLOR_NAVY
        for p in c.text_frame.paragraphs:
            p.alignment = PP_ALIGN.CENTER
            p.font.size = Pt(9.5)
            p.font.bold = True
            p.font.color.rgb = COLOR_WHITE

    d6 = [
        ["Cluster 2", "Low Risk (Prime)", "37.6%", "741.8", "60.7 mos", "3.93%"],
        ["Cluster 1", "Moderate (Standard)", "31.1%", "470.8", "91.5 mos", "12.38%"],
        ["Cluster 0", "High Risk (Subprime)", "31.3%", "475.2", "27.0 mos", "20.36%"]
    ]
    for i, row in enumerate(d6):
        for j, val in enumerate(row):
            c = tbl6.cell(i + 1, j)
            c.text = val
            c.fill.solid()
            c.fill.fore_color.rgb = RGBColor(236, 253, 245) if i == 0 else (COLOR_ROW_ALT if i == 1 else RGBColor(254, 242, 242))
            for p in c.text_frame.paragraphs:
                p.alignment = PP_ALIGN.CENTER
                p.font.size = Pt(9)
                p.font.bold = (j in [1, 5])
                if j == 5:
                    p.font.color.rgb = COLOR_EMERALD if i == 0 else (COLOR_BLUE if i == 1 else RGBColor(225, 29, 72))

    b6_sub = s8.shapes.add_textbox(Inches(0.95), Inches(4.35), Inches(5.9), Inches(2.4))
    t6_sub = b6_sub.text_frame
    t6_sub.word_wrap = True
    p = t6_sub.paragraphs[0]
    p.text = "Commercial Risk Segmentation:"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = COLOR_NAVY
    p.space_after = Pt(2)

    c_notes = [
        "• Prime Tier (Cluster 2): High credit (741.8) -> lowest default rate (3.93%).",
        "• Standard Tier (Cluster 1): Long employment tenure (91.5 mos) -> moderate default (12.38%).",
        "• Subprime Tier (Cluster 0): Short employment (27.0 mos) -> default rate surges to 20.36% (5x higher than Prime).",
        "• Unsupervised validation: Segments default risk without using Default labels."
    ]
    for cn in c_notes:
        pi = t6_sub.add_paragraph()
        pi.text = cn
        pi.font.size = Pt(9.5)
        pi.font.color.rgb = COLOR_TEXT_MAIN
        pi.space_after = Pt(3)

    pca_path = os.path.join(RESULTS_DIR, "clustering", "cluster_scatter.png")
    if os.path.exists(pca_path):
        add_card(s8, Inches(7.2), Inches(1.35), Inches(5.333), Inches(5.5))
        s8.shapes.add_picture(pca_path, Inches(7.3), Inches(1.5), width=Inches(5.133))

    s8.notes_slide.notes_text_frame.text = (
        "Here are the mined borrower profiles alongside the 2D PCA projection. "
        "Cluster 2 represents Prime borrowers with a default rate of only 3.93%. "
        "Cluster 0 isolates vulnerable borrowers where default reaches 20.36%."
    )

    # =========================================================================
    # SLIDE 9: Topic 3 INTRO — Association Rules: Why, How, What It Does & Use
    # =========================================================================
    add_topic_intro_slide(
        prs, blank_layout,
        topic_num="3",
        topic_name="Association Rules",
        why_points=[
            "Loan defaults are rarely triggered by a single parameter in isolation.",
            "Defaults happen when multiple adverse financial traits combine (e.g. low income + high DTI + poor credit).",
            "Traditional linear scorecards fail to capture non-linear, multi-condition risk interactions."
        ],
        how_points=[
            "Discretized continuous metrics into domain bins (Income tertiles, Credit tiers, DTI brackets).",
            "Applied the Apriori Algorithm (mlxtend) to mine frequent itemsets across 15,000 transactions.",
            "Evaluated Support, Confidence, and Lift, filtering specifically for consequent Default=Yes."
        ],
        what_points=[
            "Discovers non-trivial IF-THEN borrower risk patterns with statistical conviction.",
            "Reveals that specific feature combinations increase default risk by over 5.69 times compared to random applicants.",
            "Quantifies the protective impact of loan co-signers in mitigating default risk."
        ],
        use_points=[
            "Underwriting Rule Engine: Automates policy rules (e.g. require collateral if Rule #1 triggers).",
            "Underwriting Red Flags: Equips credit officers with an actionable risk checklist.",
            "Policy Tuning: Informs credit committee policies on maximum loan sizes for low-income brackets."
        ],
        accent_color=RGBColor(217, 119, 6)
    )

    # =========================================================================
    # SLIDE 10: Association Rules — Code & Discretization Methodology
    # =========================================================================
    s10 = prs.slides.add_slide(blank_layout)
    set_slide_background(s10)
    create_slide_header(s10, "Association Rules: Discretization & Apriori Algorithm Code")

    code_assoc = [
        "# association_rules/mine_rules.py",
        "from mlxtend.frequent_patterns import apriori, association_rules",
        "",
        "# Continuous Discretization",
        "df_disc['Income'] = pd.qcut(df['Income'], q=3, labels=['Low','Med','High'])",
        "df_disc['CreditScore'] = pd.cut(df['CreditScore'], bins=[0,580,670,740,850])",
        "df_disc['DTIRatio'] = pd.cut(df['DTIRatio'], bins=[0.0, 0.30, 0.50, 1.0])",
        "df_encoded = pd.get_dummies(df_disc, prefix='', prefix_sep='')",
        "",
        "# Apriori Frequent Itemset Mining",
        "itemsets = apriori(df_encoded, min_support=0.03, use_colnames=True)",
        "rules = association_rules(itemsets, metric='confidence', min_threshold=0.30)",
        "",
        "# Filter for Default=Yes sorted by Lift",
        "default_rules = rules[rules['consequents_str'].str.contains('Default=Yes')]",
        "top_rules = default_rules.sort_values(by='lift', ascending=False)"
    ]
    add_code_card(s10, Inches(0.8), Inches(1.35), Inches(5.8), Inches(5.6), "mine_rules.py", code_assoc)

    add_card(s10, Inches(6.8), Inches(1.35), Inches(5.733), Inches(5.6))
    b7 = s10.shapes.add_textbox(Inches(7.0), Inches(1.5), Inches(5.3), Inches(5.2))
    tb7 = b7.text_frame
    tb7.word_wrap = True
    p = tb7.paragraphs[0]
    p.text = "Mathematical Metrics & Mining Rules"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = COLOR_NAVY
    p.space_after = Pt(10)

    assoc_metrics = [
        ("Support(A -> B):", "P(A and B)\nFrequency of co-occurrence in dataset (threshold = 3%)."),
        ("Confidence(A -> B):", "P(B | A) = Support(A and B) / Support(A)\nProbability of Default given borrower conditions (threshold = 30%)."),
        ("Lift(A -> B):", "Confidence / P(B)\nMultiplier over baseline default rate (11.7%).\n• Lift > 1: Strong positive risk indicator\n• Lift = 5.69: 5.7x more likely to default than random."),
        ("Consequent:", "Explicitly targeted for Default=Yes to isolate toxic risk rules.")
    ]
    for l, v in assoc_metrics:
        pi = tb7.add_paragraph()
        pi.text = f"• {l}\n  {v}"
        pi.font.size = Pt(10)
        pi.font.color.rgb = COLOR_TEXT_MAIN
        pi.space_after = Pt(8)

    s10.notes_slide.notes_text_frame.text = (
        "To apply the Apriori algorithm, continuous numerical features were converted to categorical bins. "
        "We set a minimum support of 3% and confidence of 30%, filtering specifically for rules leading to Default=Yes. "
        "Lift indicates the multiplicative default risk increase above baseline."
    )

    # =========================================================================
    # SLIDE 11: Association Rules — Pictorial Representation & Top Rules Table
    # =========================================================================
    s11 = prs.slides.add_slide(blank_layout)
    set_slide_background(s11)
    create_slide_header(s11, "Association Rules: Pictorial Lift Chart & Top Risk Patterns")

    chart_path = os.path.join(RESULTS_DIR, "association_rules", "rules_lift_chart.png")
    if os.path.exists(chart_path):
        add_card(s11, Inches(0.8), Inches(1.35), Inches(6.5), Inches(5.6))
        s11.shapes.add_picture(chart_path, Inches(0.9), Inches(1.45), width=Inches(6.3))

    add_card(s11, Inches(7.5), Inches(1.35), Inches(5.033), Inches(5.6))
    b8r = s11.shapes.add_textbox(Inches(7.65), Inches(1.5), Inches(4.7), Inches(5.2))
    tb8r = b8r.text_frame
    tb8r.word_wrap = True
    p = tb8r.paragraphs[0]
    p.text = "Top Mined Rules (Ranked by Lift)"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = COLOR_NAVY
    p.space_after = Pt(8)

    rules_summary = [
        ("Rule 1 (Lift = 5.69x | Conf = 66.93%):", "Income=Low, CreditScore=Poor, LoanAmount=Large -> Default=Yes"),
        ("Rule 2 (Lift = 5.16x | Conf = 60.64%):", "Income=Low, DTIRatio=High, LoanAmount=Large -> Default=Yes"),
        ("Rule 3 (Lift = 4.64x | Conf = 54.49%):", "CreditScore=Poor, Income=Low, CoSigner=No, DTIRatio=High -> Default=Yes"),
        ("Rule 4 (Lift = 4.46x | Conf = 52.46%):", "Income=Low, CoSigner=No, LoanAmount=Large -> Default=Yes"),
        ("Key Finding:", "Subprime credit combined with large loan size and absence of a co-signer multiplies default risk by 4.6x to 5.7x over baseline.")
    ]
    for r_title, r_desc in rules_summary:
        pi = tb8r.add_paragraph()
        pi.text = f"• {r_title}"
        pi.font.size = Pt(9.5)
        pi.font.bold = True
        pi.font.color.rgb = COLOR_BLUE if "Rule" in r_title else RGBColor(190, 18, 60)
        p_desc = tb8r.add_paragraph()
        p_desc.text = f"  {r_desc}"
        p_desc.font.size = Pt(9)
        p_desc.font.color.rgb = COLOR_TEXT_MAIN
        p_desc.space_after = Pt(5)

    s11.notes_slide.notes_text_frame.text = (
        "Here is the pictorial representation of our mined association rules. "
        "Rule 1 exhibits a Lift of 5.69x with 66.93% confidence when low income, poor credit, and large loan amount co-occur. "
        "Rule 3 shows that lacking a co-signer under high DTI drives default risk over 54%."
    )

    # =========================================================================
    # SLIDE 12: Topic 4 INTRO — Prediction Engine: Why, How, What It Does & Use
    # =========================================================================
    add_topic_intro_slide(
        prs, blank_layout,
        topic_num="4",
        topic_name="Prediction",
        why_points=[
            "Real-world fintech does not use binary 0/1 hard decisions; credit risk is a continuous probability.",
            "Loan pricing, interest rates, and regulatory capital reserves require an exact probability: P(Default=1).",
            "Borrowers with 21% risk require very different underwriting actions than those with 95% risk."
        ],
        how_points=[
            "Built LoanDefaultPredictor wrapping the preprocessor and champion Gradient Boosting model.",
            "Computes continuous probability P(Default=1) in [0.0, 1.0] for any raw borrower dictionary payload.",
            "Evaluated probability calibration quality on test data using Brier Score Loss (0.0168) and Log Loss (0.0622)."
        ],
        what_points=[
            "Transforms raw applicant data in real time and predicts continuous default probability.",
            "Maps probabilities into 4 clear risk tier badges: Low (<20%), Moderate (20-45%), High (45-70%), Critical (>=70%).",
            "Automatically extracts specific contributing risk factors (e.g. DTI > 45%, Credit < 600, No Co-Signer)."
        ],
        use_points=[
            "Risk-Based Loan Pricing: Low risk applicants get prime APR (4.5%); higher risk gets compensatory pricing.",
            "Automated Adverse Action Notices: Explains to applicants exactly why their loan terms were adjusted.",
            "Live Web Integration: Powers the interactive real-time loan underwriting simulator in Review 3."
        ],
        accent_color=RGBColor(147, 51, 234)
    )

    # =========================================================================
    # SLIDE 13: Prediction Engine — Code & 4-Tier Policy Matrix
    # =========================================================================
    s13 = prs.slides.add_slide(blank_layout)
    set_slide_background(s13)
    create_slide_header(s13, "Prediction Engine: Continuous Scoring Code & Policy Tiers")

    code_pred = [
        "# prediction/predictor.py",
        "class LoanDefaultPredictor:",
        "    def predict_borrower_risk(self, borrower_data):",
        "        # Preprocessing transform",
        "        df_input = pd.DataFrame([borrower_data])",
        "        X_trans = self.preprocessor.transform(df_input)",
        "        ",
        "        # Continuous probability P(Default=1)",
        "        prob = float(self.model.predict_proba(X_trans)[0, 1])",
        "        ",
        "        # 4-Tier Risk Categorization",
        "        if prob < 0.20:   tier = 'Low Risk'",
        "        elif prob < 0.45: tier = 'Moderate Risk'",
        "        elif prob < 0.70: tier = 'High Risk'",
        "        else:             tier = 'Critical Risk'",
        "        ",
        "        return {'prob': prob, 'tier': tier, 'factors': warnings}"
    ]
    add_code_card(s13, Inches(0.8), Inches(1.35), Inches(5.2), Inches(5.6), "predictor.py", code_pred)

    add_card(s13, Inches(6.2), Inches(1.35), Inches(6.333), Inches(1.7), bg_color=RGBColor(238, 242, 255), border_color=COLOR_BLUE)
    b9_top = s13.shapes.add_textbox(Inches(6.35), Inches(1.45), Inches(6.0), Inches(1.5))
    tb9_top = b9_top.text_frame
    tb9_top.word_wrap = True
    p = tb9_top.paragraphs[0]
    p.text = "Probability Calibration Metrics"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = COLOR_BLUE
    p.space_after = Pt(4)

    calib_str = [
        "• Brier Score: 0.0168 (near zero indicates exceptional probability calibration quality)",
        "• Test Set ROC-AUC: 0.9973  |  Model Log Loss: 0.0622",
        "• Sample Prime Scoring: Credit 810, DTI 0.15 -> P(Default) = 0.02% (Low Risk Badge)",
        "• Sample Subprime Scoring: Credit 420, DTI 0.82 -> P(Default) = 99.99% (Critical Risk Badge)"
    ]
    for cs in calib_str:
        pi = tb9_top.add_paragraph()
        pi.text = cs
        pi.font.size = Pt(9.5)
        pi.font.color.rgb = COLOR_TEXT_MAIN

    add_card(s13, Inches(6.2), Inches(3.2), Inches(6.333), Inches(3.75))
    b9_bot = s13.shapes.add_textbox(Inches(6.35), Inches(3.3), Inches(6.0), Inches(3.5))
    tb9_bot = b9_bot.text_frame
    tb9_bot.word_wrap = True
    p = tb9_bot.paragraphs[0]
    p.text = "4-Tier Underwriting Decision Matrix"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = COLOR_NAVY
    p.space_after = Pt(6)

    tiers_data = [
        ("Low Risk (P < 20%):", "Fast-track instant approval; Prime interest rate (4.5% - 7.5% APR).", COLOR_EMERALD),
        ("Moderate Risk (20% <= P < 45%):", "Standard underwriting review; income verification required.", COLOR_BLUE),
        ("High Risk (45% <= P < 70%):", "Conditional approval; mandatory co-signer and collateral required.", RGBColor(217, 119, 6)),
        ("Critical Risk (P >= 70%):", "Automated decline; risk exceeds institutional lending tolerance.", RGBColor(225, 29, 72))
    ]
    for t_name, t_desc, t_col in tiers_data:
        pi = tb9_bot.add_paragraph()
        pi.text = t_name
        pi.font.size = Pt(10)
        pi.font.bold = True
        pi.font.color.rgb = t_col
        pd = tb9_bot.add_paragraph()
        pd.text = f"  {t_desc}"
        pd.font.size = Pt(9.5)
        pd.font.color.rgb = COLOR_TEXT_MAIN
        pd.space_after = Pt(4)

    s13.notes_slide.notes_text_frame.text = (
        "Here is our prediction engine implementation. "
        "We transform borrower payloads and compute continuous probabilities P(Default=1). "
        "Our Brier score of 0.0168 confirms the probabilities are highly calibrated, enabling a clear 4-tier risk policy."
    )

    # =========================================================================
    # SLIDE 14: Summary & Review 3 Transition
    # =========================================================================
    s14 = prs.slides.add_slide(blank_layout)
    set_slide_background(s14)
    create_slide_header(s14, "Summary of Review 2 & Roadmap to Final Review 3")

    add_card(s14, Inches(0.8), Inches(1.35), Inches(5.7), Inches(5.6))
    b10a = s14.shapes.add_textbox(Inches(1.0), Inches(1.5), Inches(5.3), Inches(5.2))
    t10a = b10a.text_frame
    t10a.word_wrap = True
    p = t10a.paragraphs[0]
    p.text = "Review 2 Deliverables Accomplished"
    p.font.size = Pt(15)
    p.font.bold = True
    p.font.color.rgb = COLOR_NAVY
    p.space_after = Pt(10)

    r2_ach = [
        ("Classification:", "Benchmarked 4 classifiers; Gradient Boosting selected as champion (F1 = 0.8965, ROC-AUC = 0.9973)."),
        ("Clustering:", "K-Means segmented borrowers into 3 profiles (Prime: 3.93% default vs Subprime: 20.36% default)."),
        ("Association Rules:", "Apriori mined high-conviction risk rules with Lift up to 5.69x over baseline."),
        ("Prediction Engine:", "Operational continuous probability scoring with 0.0168 Brier score calibration."),
        ("Git Repository:", "All code, models, and artifacts version-controlled on GitHub main.")
    ]
    for k, v in r2_ach:
        pi = t10a.add_paragraph()
        pi.text = f"✓ {k} {v}"
        pi.font.size = Pt(10)
        pi.font.color.rgb = COLOR_TEXT_MAIN
        pi.space_after = Pt(8)

    add_card(s14, Inches(6.8), Inches(1.35), Inches(5.733), Inches(5.6))
    b10b = s14.shapes.add_textbox(Inches(7.0), Inches(1.5), Inches(5.3), Inches(5.2))
    t10b = b10b.text_frame
    t10b.word_wrap = True
    p = t10b.paragraphs[0]
    p.text = "Roadmap to Final Review 3"
    p.font.size = Pt(15)
    p.font.bold = True
    p.font.color.rgb = COLOR_NAVY
    p.space_after = Pt(10)

    r3_pts = [
        ("Interactive Web Application:", "Full React 19 + Vite dashboard featuring 7 visual analytical tabs."),
        ("Real-Time Loan Simulator:", "Live applicant scoring form with dynamic probability and risk factor alerts."),
        ("Secondary Python Dashboard:", "Interactive Streamlit platform for parameter exploration."),
        ("End-to-End Demonstration:", "Integration from Star Schema Data Warehouse (Review 1) through ML Underwriting (Review 2)."),
        ("Institutional Deployment:", "Production build compiled with zero errors, ready for cloud hosting.")
    ]
    for k, v in r3_pts:
        pi = t10b.add_paragraph()
        pi.text = f"➔ {k} {v}"
        pi.font.size = Pt(10)
        pi.font.color.rgb = COLOR_TEXT_MAIN
        pi.space_after = Pt(8)

    s14.notes_slide.notes_text_frame.text = (
        "In summary, all four required components of Review 2 are fully completed and verified. "
        "In Review 3 we will demonstrate the live interactive dashboard and real-time simulator. "
        "Thank you faculty, we are ready for your questions."
    )

    prs.save(OUTPUT_PPT_PATH)
    print(f"[PPT GENERATOR] Successfully created comprehensive presentation deck with topic intro slides: {OUTPUT_PPT_PATH}")

if __name__ == "__main__":
    create_deck()
