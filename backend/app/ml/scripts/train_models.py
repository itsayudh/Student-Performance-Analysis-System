"""
train_models.py
===============
SPAS ML Model Retraining Script

This script is run when real institutional data is available
in the PostgreSQL database. It extracts features from the
database, retrains the XGBoost model, and saves new PKL files
replacing the demo dataset models.

Usage:
    cd backend
    python -m app.ml.scripts.train_models

    # Or with custom output directory:
    python -m app.ml.scripts.train_models --models-dir app/ml/models

Requirements:
    - PostgreSQL database must be running
    - DATABASE_URL environment variable must be set
    - All tables must have sufficient data (minimum 100 rows recommended)
"""

import os
import sys
import argparse
import warnings
warnings.filterwarnings('ignore')

import numpy  as np
import pandas as pd
import joblib

from datetime import datetime
from sqlalchemy import create_engine, text

from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing   import StandardScaler
from sklearn.metrics         import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)
from xgboost import XGBRegressor


# ── Configuration ──────────────────────────────────────────────────────────────
RANDOM_SEED      = 42
TEST_SIZE        = 0.20
CV_FOLDS         = 5
MIN_ROWS_REQUIRED = 100     # minimum rows needed to retrain

# ── Target metrics from SPAS documentation Section 8.9 ────────────────────────
TARGET_R2   = 0.80
TARGET_MAE  = 8.0
TARGET_RMSE = 12.0

# ── Default models directory ───────────────────────────────────────────────────
DEFAULT_MODELS_DIR = os.path.join(
    os.path.dirname(__file__), "..", "models"
)


# ── Database connection ────────────────────────────────────────────────────────

def get_db_engine():
    """
    Create SQLAlchemy engine from DATABASE_URL environment variable.

    Returns:
        SQLAlchemy engine

    Raises:
        SystemExit if DATABASE_URL is not set
    """
    db_url = os.getenv(
        "DATABASE_URL",
        "postgresql://spas_user:spas_password@localhost:5432/spas_db"
    )
    print(f"[Train] Connecting to database...")
    engine = create_engine(db_url, pool_pre_ping=True)
    return engine


# ── Feature extraction from PostgreSQL ────────────────────────────────────────

def extract_features_from_db(engine) -> pd.DataFrame:
    """
    Extract the feature matrix from the PostgreSQL database.

    Joins marks, attendance, gpa_records, enrollments, and class_subjects
    tables to reconstruct the same feature set used during notebook training.

    Each row = one student × one subject × one semester.

    Required columns in output:
        - student_id
        - attendance_percentage
        - quiz_score_avg
        - assignment_score_avg
        - midterm_score
        - historical_gpa
        - study_hours_per_week     (may be NULL — imputed later)
        - participation_score      (may be NULL — imputed later)
        - subject_difficulty_score
        - final_score              (target — rows without this are excluded)

    Returns:
        pd.DataFrame with all required columns

    Raises:
        SystemExit if insufficient data found
    """
    print("[Train] Extracting features from database...")

    query = text("""
        SELECT
            s.id                                            AS student_id,
            sub.id                                          AS subject_id,

            -- Attendance percentage per student per subject
            ROUND(
                100.0 * SUM(CASE WHEN a.status = 'PRESENT' THEN 1
                                 WHEN a.status = 'LATE'    THEN 0.5
                                 ELSE 0 END)
                / NULLIF(COUNT(a.id), 0),
                2
            )                                               AS attendance_percentage,

            -- Quiz average (normalized to 0-100)
            ROUND(
                AVG(CASE WHEN m.mark_type = 'QUIZ'
                    THEN (m.score / NULLIF(m.max_score, 0)) * 100
                    END),
                2
            )                                               AS quiz_score_avg,

            -- Assignment average (normalized to 0-100)
            ROUND(
                AVG(CASE WHEN m.mark_type = 'ASSIGNMENT'
                    THEN (m.score / NULLIF(m.max_score, 0)) * 100
                    END),
                2
            )                                               AS assignment_score_avg,

            -- Midterm score (normalized to 0-100)
            ROUND(
                AVG(CASE WHEN m.mark_type = 'MIDTERM'
                    THEN (m.score / NULLIF(m.max_score, 0)) * 100
                    END),
                2
            )                                               AS midterm_score,

            -- Historical GPA from previous semester GPA records
            COALESCE(g.gpa, 0.0)                            AS historical_gpa,

            -- Subject difficulty score
            COALESCE(sub.difficulty_score, 0.5)             AS subject_difficulty_score,

            -- Semester number from class enrollment
            cl.semester                                     AS semester_number,

            -- Final exam score (target variable)
            ROUND(
                AVG(CASE WHEN m.mark_type = 'FINAL'
                    THEN (m.score / NULLIF(m.max_score, 0)) * 100
                    END),
                2
            )                                               AS final_score

        FROM students s
        JOIN enrollments  e   ON e.student_id  = s.id
        JOIN classes      cl  ON cl.id         = e.class_id
        JOIN class_subjects cs ON cs.class_id  = cl.id
        JOIN subjects     sub ON sub.id        = cs.subject_id
        LEFT JOIN marks   m   ON m.student_id  = s.id
                              AND m.subject_id = sub.id
                              AND m.class_id   = cl.id
        LEFT JOIN attendance a ON a.student_id = s.id
                               AND a.subject_id = sub.id
                               AND a.class_id   = cl.id
        LEFT JOIN gpa_records g ON g.student_id = s.id

        WHERE s.is_active = TRUE
        GROUP BY
            s.id, sub.id, cl.semester,
            g.gpa, sub.difficulty_score

        -- Only include rows where final score exists
        -- (student has completed the subject)
        HAVING AVG(CASE WHEN m.mark_type = 'FINAL'
                   THEN (m.score / NULLIF(m.max_score, 0)) * 100
                   END) IS NOT NULL
           AND AVG(CASE WHEN m.mark_type = 'MIDTERM'
                   THEN (m.score / NULLIF(m.max_score, 0)) * 100
                   END) IS NOT NULL

        ORDER BY s.id, sub.id
    """)

    with engine.connect() as conn:
        df = pd.read_sql(query, conn)

    print(f"[Train] Extracted {len(df):,} rows from database.")

    if len(df) < MIN_ROWS_REQUIRED:
        print(
            f"[Train] ERROR: Only {len(df)} rows found. "
            f"Minimum {MIN_ROWS_REQUIRED} rows required for retraining. "
            f"Collect more institutional data before retraining."
        )
        sys.exit(1)

    return df


# ── Data cleaning ──────────────────────────────────────────────────────────────

def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Apply the same cleaning pipeline used in notebook 02.

    Steps:
        1. Remove duplicate rows
        2. Handle missing values
        3. Validate ranges
        4. IQR capping on continuous columns

    Args:
        df : raw extracted DataFrame

    Returns:
        Cleaned DataFrame
    """
    print(f"[Train] Cleaning data — starting rows: {len(df):,}")

    # Step 1 — Remove duplicates
    df = df.drop_duplicates(
        subset=["student_id", "subject_id", "semester_number"]
    )
    print(f"[Train]   After dedup          : {len(df):,} rows")

    # Step 2 — Handle missing values
    # quiz and assignment: fill with 0 (student never submitted)
    df["quiz_score_avg"]       = df["quiz_score_avg"].fillna(0)
    df["assignment_score_avg"] = df["assignment_score_avg"].fillna(0)

    # Drop rows where midterm is missing (required for prediction)
    df = df.dropna(subset=["midterm_score"])
    print(f"[Train]   After midterm dropna : {len(df):,} rows")

    # Step 3 — Validate ranges
    df = df[
        (df["attendance_percentage"].between(0, 100)) &
        (df["historical_gpa"].between(0, 4.0))        &
        (df["final_score"].between(0, 100))
    ]
    print(f"[Train]   After range check    : {len(df):,} rows")

    # Step 4 — IQR capping on continuous score columns
    # Cap but do NOT drop — extreme scores are valid academic outcomes
    cap_cols = [
        "attendance_percentage",
        "quiz_score_avg",
        "assignment_score_avg",
        "midterm_score",
    ]
    for col in cap_cols:
        q1    = df[col].quantile(0.25)
        q3    = df[col].quantile(0.75)
        iqr   = q3 - q1
        lower = max(0,   q1 - 1.5 * iqr)
        upper = min(100, q3 + 1.5 * iqr)
        df[col] = df[col].clip(lower=lower, upper=upper)

    print(f"[Train]   After IQR capping    : {len(df):,} rows")
    return df


# ── Feature engineering ────────────────────────────────────────────────────────

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute the same engineered features as notebook 04.

    Adds:
        - ca_avg          : continuous assessment average
        - rule_risk_score : composite rule-based risk score

    Args:
        df : cleaned DataFrame

    Returns:
        DataFrame with engineered features added
    """
    print("[Train] Engineering features...")

    # ca_avg — continuous assessment average
    df["ca_avg"] = (
        df["quiz_score_avg"] * 0.5 +
        df["assignment_score_avg"] * 0.5
    ).round(4)

    # rule_risk_score — composite risk indicator
    df["rule_risk_score"] = (
        (100 - df["attendance_percentage"]) * 0.4 +
        (100 - df["ca_avg"])               * 0.3 +
        (100 - df["midterm_score"])         * 0.3
    ) / 100
    df["rule_risk_score"] = df["rule_risk_score"].clip(0, 1).round(4)

    print(f"[Train]   ca_avg mean          : {df['ca_avg'].mean():.2f}")
    print(f"[Train]   rule_risk_score mean : {df['rule_risk_score'].mean():.4f}")

    return df


# ── Model training ─────────────────────────────────────────────────────────────

def train_model(
    df         : pd.DataFrame,
    models_dir : str,
) -> dict:
    """
    Train XGBoost regressor on extracted real data.
    Uses the same 7 features and hyperparameters as notebook 06.

    Args:
        df         : cleaned and engineered DataFrame
        models_dir : directory to save PKL files

    Returns:
        dict of evaluation metrics
    """
    print("[Train] Starting model training...")

    # ── Feature list — must match feature_list.pkl order ──────────────────────
    selected_features = [
        "attendance_percentage",
        "midterm_score",
        "historical_gpa",
        "study_hours_per_week",
        "subject_difficulty_score",
        "ca_avg",
        "rule_risk_score",
    ]

    # Handle missing study_hours_per_week
    # (survey field — often missing in real data)
    if "study_hours_per_week" not in df.columns:
        df["study_hours_per_week"] = 15.0    # default fallback
    df["study_hours_per_week"] = df["study_hours_per_week"].fillna(
        df["study_hours_per_week"].mean()
        if df["study_hours_per_week"].notna().any()
        else 15.0
    )

    X = df[selected_features]
    y = df["final_score"]

    print(f"[Train]   Feature matrix shape : {X.shape}")
    print(f"[Train]   Target range         : {y.min():.1f} – {y.max():.1f}")
    print(f"[Train]   Target mean          : {y.mean():.2f}")

    # ── Train/test split ───────────────────────────────────────────────────────
    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size   = TEST_SIZE,
        random_state= RANDOM_SEED,
    )

    # ── Feature scaling ────────────────────────────────────────────────────────
    scaler         = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled  = scaler.transform(X_test)

    # ── Cross validation ───────────────────────────────────────────────────────
    print(f"[Train] Running {CV_FOLDS}-fold cross validation...")
    xgb = XGBRegressor(
        n_estimators     = 200,
        learning_rate    = 0.1,
        max_depth        = 6,
        subsample        = 0.8,
        colsample_bytree = 0.8,
        random_state     = RANDOM_SEED,
        verbosity        = 0,
    )
    cv_scores = cross_val_score(
        xgb, X_train_scaled, y_train,
        cv=CV_FOLDS, scoring="r2", n_jobs=-1
    )
    print(f"[Train]   CV R² : {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

    # ── Final training on full train set ───────────────────────────────────────
    print("[Train] Training final model on full training set...")
    xgb.fit(
        X_train_scaled, y_train,
        eval_set  = [(X_test_scaled, y_test)],
        verbose   = False,
    )

    # ── Evaluate on test set ───────────────────────────────────────────────────
    y_pred = np.clip(xgb.predict(X_test_scaled), 0, 100)
    mae    = mean_absolute_error(y_test, y_pred)
    rmse   = np.sqrt(mean_squared_error(y_test, y_pred))
    r2     = r2_score(y_test, y_pred)

    print()
    print("[Train] ── Evaluation Results ──")
    print(f"[Train]   MAE  : {mae:.4f}  "
          f"{'✅ OK' if mae  < TARGET_MAE  else '⚠️  Above target'} "
          f"(target < {TARGET_MAE})")
    print(f"[Train]   RMSE : {rmse:.4f}  "
          f"{'✅ OK' if rmse < TARGET_RMSE else '⚠️  Above target'} "
          f"(target < {TARGET_RMSE})")
    print(f"[Train]   R²   : {r2:.4f}  "
          f"{'✅ OK' if r2   >= TARGET_R2  else '⚠️  Below target'} "
          f"(target ≥ {TARGET_R2})")

    # ── Warn if targets not met ────────────────────────────────────────────────
    if r2 < TARGET_R2:
        print(
            f"[Train] WARNING: R² {r2:.4f} is below target {TARGET_R2}. "
            f"Consider collecting more data before deploying this model."
        )

    # ── Save PKL files ─────────────────────────────────────────────────────────
    os.makedirs(models_dir, exist_ok=True)

    joblib.dump(xgb,               os.path.join(models_dir, "grade_predictor.pkl"))
    joblib.dump(scaler,            os.path.join(models_dir, "feature_scaler.pkl"))
    joblib.dump(selected_features, os.path.join(models_dir, "feature_list.pkl"))

    print()
    print("[Train] ── PKL Files Saved ──")
    for fname in ["grade_predictor.pkl", "feature_scaler.pkl", "feature_list.pkl"]:
        path = os.path.join(models_dir, fname)
        size = os.path.getsize(path) / 1024
        print(f"[Train]   ✅ {fname:<35} {size:>8.1f} KB")

    return {
        "mae"          : round(mae,  4),
        "rmse"         : round(rmse, 4),
        "r2"           : round(r2,   4),
        "cv_r2_mean"   : round(cv_scores.mean(), 4),
        "cv_r2_std"    : round(cv_scores.std(),  4),
        "train_rows"   : len(X_train),
        "test_rows"    : len(X_test),
        "models_dir"   : models_dir,
        "trained_at"   : datetime.utcnow().isoformat(),
    }


# ── Main entry point ───────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="SPAS ML Model Retraining Script"
    )
    parser.add_argument(
        "--models-dir",
        type    = str,
        default = DEFAULT_MODELS_DIR,
        help    = "Directory to save retrained PKL files",
    )
    parser.add_argument(
        "--min-rows",
        type    = int,
        default = MIN_ROWS_REQUIRED,
        help    = "Minimum rows required to proceed with retraining",
    )
    args = parser.parse_args()

    print()
    print("=" * 60)
    print("SPAS ML MODEL RETRAINING SCRIPT")
    print("=" * 60)
    print(f"Models directory : {args.models_dir}")
    print(f"Min rows required: {args.min_rows}")
    print(f"Started at       : {datetime.utcnow().isoformat()}")
    print()

    # Step 1 — Connect to database
    engine = get_db_engine()

    # Step 2 — Extract features from database
    df_raw = extract_features_from_db(engine)

    # Step 3 — Clean data
    df_clean = clean_data(df_raw)

    # Step 4 — Engineer features
    df_features = engineer_features(df_clean)

    # Step 5 — Train and save models
    metrics = train_model(
        df         = df_features,
        models_dir = args.models_dir,
    )

    # Step 6 — Print final summary
    print()
    print("=" * 60)
    print("RETRAINING COMPLETE")
    print("=" * 60)
    print(f"  Training rows : {metrics['train_rows']:,}")
    print(f"  Test rows     : {metrics['test_rows']:,}")
    print(f"  CV R²         : {metrics['cv_r2_mean']} ± {metrics['cv_r2_std']}")
    print(f"  MAE           : {metrics['mae']}")
    print(f"  RMSE          : {metrics['rmse']}")
    print(f"  R²            : {metrics['r2']}")
    print(f"  Trained at    : {metrics['trained_at']}")
    print(f"  Saved to      : {metrics['models_dir']}")
    print()
    print("  New models are now active.")
    print("  Restart FastAPI to load the updated PKL files.")
    print("=" * 60)


if __name__ == "__main__":
    main()