import pandas as pd

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

# 1. Load dataset
data = pd.read_csv("student-por.csv", sep=";")

# 2. Create Pass / Fail target
data["performance"] = data["G3"].apply(
    lambda grade: "Fail" if grade <= 10 else "Pass"
)

# 3. Select the three best-performing features
features = ["studytime", "G1", "G2"]

X = data[features]
y = data["performance"]

# 4. Preprocessing and SVM model
model = Pipeline([
    ("scaler", StandardScaler()),
    ("classifier", SVC(
        kernel="rbf",
        C=1.0,
        probability=True,
        random_state=42
    ))
])

# 5. Split dataset
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)

# 6. Train model
model.fit(X_train, y_train)

# 7. Predict test data
y_pred = model.predict(X_test)

print("\n===== MAIN.PY RESULTS =====")
print("Dataset rows:", len(data))
print("Test data rows:", len(X_test))

print("Accuracy:",
      accuracy_score(y_test, y_pred) * 100)

print("Precision:",
      precision_score(
          y_test, y_pred,
          average="macro",
          zero_division=0
      ) * 100)

print("Recall:",
      recall_score(
          y_test, y_pred,
          average="macro",
          zero_division=0
      ) * 100)

print("F1-Score:",
      f1_score(
          y_test, y_pred,
          average="macro",
          zero_division=0
      ) * 100)

# 8. Evaluate model
print("\nSTUDENT ACADEMIC PERFORMANCE")
print("SVM CLASSIFICATION")
print("-" * 40)

print("Number of features:", len(features))
print("Features:", features)

print(f"Accuracy  : {accuracy_score(y_test, y_pred) * 100:.2f}%")
print(f"Precision : {precision_score(y_test, y_pred, average='macro', zero_division=0) * 100:.2f}%")
print(f"Recall    : {recall_score(y_test, y_pred, average='macro', zero_division=0) * 100:.2f}%")
print(f"F1-Score  : {f1_score(y_test, y_pred, average='macro', zero_division=0) * 100:.2f}%")

# 9. Classification report
print("\nCLASSIFICATION REPORT")
print(classification_report(
    y_test,
    y_pred,
    labels=["Fail", "Pass"],
    zero_division=0
))

# 10. Confusion matrix
print("CONFUSION MATRIX (Fail, Pass)")
print(confusion_matrix(
    y_test,
    y_pred,
    labels=["Fail", "Pass"]
))

# 11. Predict a new student
print("\nENTER NEW STUDENT DETAILS")

student = {
    "studytime": int(input("Study time (1-4): ")),
    "G1": int(input("First period grade (0-20): ")),
    "G2": int(input("Second period grade (0-20): "))
}

new_student = pd.DataFrame([student], columns=features)

prediction = model.predict(new_student)[0]
probabilities = model.predict_proba(new_student)[0]

print("\nPREDICTED PERFORMANCE:", prediction)

print("\nPrediction probabilities:")
for label, probability in zip(model.classes_, probabilities):
    print(f"{label}: {probability * 100:.2f}%")
