from flask import Flask, render_template, request, jsonify
import pandas as pd
import numpy as np

from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.svm import SVC
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report
)

app = Flask(__name__)

BASE_DIR = Path(__file__).resolve().parent
DATASET_PATH = BASE_DIR / "student-por.csv"

LABELS = ["Fail", "Pass"]
FEATURES = ["studytime", "G1", "G2"]

NUMERIC_RULES = {
    "studytime": (1, 4),
    "G1": (0, 20),
    "G2": (0, 20)
}

model = None
df = None
X_test = None
y_test = None
metrics = {}
matrix = []
report = {}


def load_and_train():
    global model, df, X_test, y_test
    global metrics, matrix, report

    # Load dataset
    df = pd.read_csv(DATASET_PATH, sep=";")

    # Create Pass/Fail target
    df["performance"] = np.where(
        df["G3"] <= 10,
        "Fail",
        "Pass"
    )

    # Use only three features
    X = df[FEATURES]
    y = df["performance"]

    # Split dataset
    X_train, X_test_local, y_train, y_test_local = train_test_split(
        X,
        y,
        test_size=0.20,
        random_state=42,
        stratify=y
    )

    # SVM model with feature scaling
    model = Pipeline([
        ("scaler", StandardScaler()),
        (
            "classifier",
            SVC(
                kernel="rbf",
                C=1.0,
                probability=True,
                random_state=42
            )
        )
    ])

    # Train model
    model.fit(X_train, y_train)

    # Save test data for evaluation
    X_test = X_test_local
    y_test = y_test_local

    # Evaluate model
    predictions = model.predict(X_test)

    # Debugging output
    print("\n===== DASHBOARD MODEL RESULTS =====")
    print("Dataset path:", DATASET_PATH.resolve())
    print("Total rows:", len(df))
    print("Test data rows:", len(X_test))

    print("Accuracy:",
          accuracy_score(y_test, predictions) * 100)

    print("Precision:",
          precision_score(
              y_test, predictions,
              average="macro",
              zero_division=0
          ) * 100)

    print("Recall:",
          recall_score(
              y_test, predictions,
              average="macro",
              zero_division=0
          ) * 100)

    print("F1-Score:",
          f1_score(
              y_test, predictions,
              average="macro",
              zero_division=0
          ) * 100)

    print("==================================\n")

    # Store evaluation metrics
    metrics = {
        "accuracy": float(
            accuracy_score(y_test, predictions)
        ),
        "precision": float(
            precision_score(
                y_test, predictions,
                average="macro",
                zero_division=0
            )
        ),
        "recall": float(
            recall_score(
                y_test, predictions,
                average="macro",
                zero_division=0
            )
        ),
        "f1": float(
            f1_score(
                y_test, predictions,
                average="macro",
                zero_division=0
            )
        )
    }

    # Confusion matrix
    matrix = confusion_matrix(
        y_test,
        predictions,
        labels=LABELS
    ).tolist()

    # Classification report
    report = classification_report(
        y_test,
        predictions,
        labels=LABELS,
        output_dict=True,
        zero_division=0
    )

    return True

# Train model when the application starts
load_and_train()


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/overview")
def overview():
    class_counts = (
        df["performance"]
        .value_counts()
        .reindex(LABELS, fill_value=0)
        .to_dict()
    )

    return jsonify({
        "total_students": int(len(df)),
        "average_grade": round(float(df["G3"].mean()), 2),
        "accuracy": metrics["accuracy"],
        "precision": metrics["precision"],
        "recall": metrics["recall"],
        "f1": metrics["f1"],
        "class_counts": class_counts,
        "fail_count": int(class_counts["Fail"]),
        "pass_count": int(class_counts["Pass"])
    })


@app.route("/api/analytics")
def analytics():
    grade_counts = (
        df["G3"]
        .value_counts()
        .reindex(range(21), fill_value=0)
        .sort_index()
    )

    return jsonify({
        "labels": list(range(21)),
        "counts": grade_counts.tolist()
    })


@app.route("/api/confusion-matrix")
def get_confusion_matrix():
    return jsonify({
        "labels": LABELS,
        "matrix": matrix
    })


@app.route("/api/classification-report")
def get_classification_report():
    result = {}

    for label in LABELS:
        item = report[label]

        result[label] = {
            "precision": round(float(item["precision"]), 4),
            "recall": round(float(item["recall"]), 4),
            "f1-score": round(float(item["f1-score"]), 4),
            "support": int(item["support"])
        }

    return jsonify(result)


@app.route("/api/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json(silent=True) or {}

        # Validate required input fields
        values = {}

        for feature, (minimum, maximum) in NUMERIC_RULES.items():
            if feature not in data:
                return jsonify({
                    "error": f"Missing input: {feature}"
                }), 400

            value = float(data[feature])

            if not np.isfinite(value):
                return jsonify({
                    "error": f"{feature} must be a valid number."
                }), 400

            if not minimum <= value <= maximum:
                return jsonify({
                    "error": (
                        f"{feature} must be between "
                        f"{minimum} and {maximum}."
                    )
                }), 400

            values[feature] = value

        # Create input DataFrame in the correct feature order
        input_data = pd.DataFrame(
            [[values[feature] for feature in FEATURES]],
            columns=FEATURES
        )

        # Predict Pass or Fail
        prediction = model.predict(input_data)[0]

        # Get estimated class probabilities
        probability_values = model.predict_proba(input_data)[0]
        class_names = model.named_steps["classifier"].classes_

        probabilities = {
            str(label): round(float(probability), 4)
            for label, probability in zip(
                class_names,
                probability_values
            )
        }

        return jsonify({
            "prediction": str(prediction),
            "probabilities": probabilities
        })

    except (TypeError, ValueError):
        return jsonify({
            "error": "Please enter valid numeric values."
        }), 400

    except Exception as error:
        app.logger.exception("Prediction failed")
        return jsonify({
            "error": "Prediction failed. Please try again."
        }), 500


@app.route("/api/students")
def students():
    search = request.args.get("search", "").strip().lower()

    try:
        page = max(1, int(request.args.get("page", 1)))
    except ValueError:
        page = 1

    page_size = 10
    filtered = df.copy()

    if search:
        search_columns = [
            "school",
            "sex",
            "address",
            "performance"
        ]

        mask = pd.Series(False, index=filtered.index)

        for column in search_columns:
            mask |= (
                filtered[column]
                .astype(str)
                .str.lower()
                .str.contains(search, regex=False)
            )

        numeric_columns = [
            "age",
            "studytime",
            "G1",
            "G2",
            "G3"
        ]

        for column in numeric_columns:
            mask |= (
                filtered[column]
                .astype(str)
                .str.contains(search, regex=False)
            )

        filtered = filtered[mask]

    total = len(filtered)
    total_pages = max(1, (total + page_size - 1) // page_size)

    page = min(page, total_pages)

    start = (page - 1) * page_size
    end = start + page_size

    rows = filtered.iloc[start:end].copy()

    # Convert NumPy values into JSON-friendly Python values
    records = rows[
        [
            "school",
            "sex",
            "age",
            "studytime",
            "failures",
            "absences",
            "G1",
            "G2",
            "G3",
            "performance"
        ]
    ].to_dict(orient="records")

    return jsonify({
        "students": records,
        "total": int(total),
        "page": page,
        "total_pages": total_pages
    })


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )