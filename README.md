 
# 🎓 Student Academic Performance Prediction Using Machine Learning

A Machine Learning-based web application that predicts student academic performance as **Pass or Fail** using study time and previous academic grades. The project uses a Support Vector Machine (SVM) with an RBF kernel and provides an interactive Flask dashboard for predictions and model evaluation.

## 📌 Project Overview

Student academic performance is influenced by several factors, including study habits and previous examination results. Identifying students who may be at risk of failing can help teachers provide timely academic support.

This project develops a Machine Learning model to predict student performance using three selected input features:

- **Studytime** – Weekly study time.
- **G1** – First-period grade.
- **G2** – Second-period grade.

The model predicts the final result as **Pass or Fail** and displays the prediction through a web-based dashboard.

## 🎯 Objectives

- Predict student academic performance using Machine Learning.
- Classify students into Pass and Fail categories.
- Analyse the relationship between study time and previous grades.
- Evaluate the model using standard performance metrics.
- Develop a simple and interactive web dashboard for predictions.

## 📊 Dataset

**Dataset:** UCI Student Performance Dataset  
**File:** `student-por.csv`  
**Format:** CSV (Comma-Separated Values)

The dataset contains student academic and personal information.

### Selected Input Features

| Feature | Description |
|---|---|
| `studytime` | Weekly study-time category |
| `G1` | First-period grade |
| `G2` | Second-period grade |

### Target Variable

The final grade (`G3`) is used to create the target label.

| Condition | Class |
|---|---|
| G3 ≤ 10 | Fail |
| G3 > 10 | Pass |

**Note:** G3 is used only to generate the target label. It is not included as an input feature during model training.

## 🤖 Machine Learning Algorithm

### Support Vector Machine (SVM)

This project uses the **Support Vector Machine (SVM)** algorithm for binary classification.

SVM identifies an effective decision boundary to separate student records into Pass and Fail categories.

### Why SVM?

- Suitable for classification problems.
- Works effectively with small and medium-sized datasets.
- Finds an effective decision boundary between classes.
- Can handle complex patterns using kernel functions.

### RBF Kernel

The project uses the **Radial Basis Function (RBF)** kernel.

- Handles non-linear relationships between input features.
- Creates flexible decision boundaries.
- Helps identify complex patterns in student data.

### Model Configuration

- Algorithm: Support Vector Machine
- Kernel: RBF
- C: 1.0
- Feature Scaling: StandardScaler
- Probability Estimation: Enabled

## ⚙️ Methodology

The project follows these steps:

1. Load the student performance dataset.
2. Preprocess the dataset.
3. Create Pass/Fail labels using the G3 grade.
4. Select `studytime`, `G1` and `G2` as input features.
5. Split the dataset into 80% training and 20% testing data.
6. Apply StandardScaler to scale the numerical features.
7. Train the SVM model using the RBF kernel.
8. Predict student performance.
9. Evaluate the model using performance metrics.
10. Display predictions and evaluation results through the Flask dashboard.

## 🛠️ Technologies Used

| Category | Technologies |
|---|---|
| Programming Language | Python |
| Machine Learning | Scikit-learn |
| Data Handling | Pandas, NumPy |
| Backend | Flask |
| Frontend | HTML, CSS, JavaScript |
| Model | SVM with RBF Kernel |
| Development Environment | Visual Studio Code |

## 📈 Model Performance

The trained SVM model achieved the following evaluation results:

| Evaluation Metric | Score |
|---|---:|
| Accuracy | 91.54% |
| Precision | 90.16% |
| Recall | 89.56% |
| F1-Score | 89.85% |

### Confusion Matrix

The model evaluation produced the following results:

| Actual / Predicted | Fail | Pass |
|---|---:|---:|
| Fail | 33 | 6 |
| Pass | 5 | 86 |

These results show that the model correctly classified most of the student records in the test dataset.

## 🌐 Web Application Features

- Interactive student performance dashboard.
- Student input form for study time, G1 and G2 grades.
- Pass/Fail prediction.
- Prediction probability display.
- Model performance evaluation.
- Confusion matrix visualization.
- Student performance records.

## 📁 Project Structure

```text
Student-Performance-ML/
│
├── main.py
├── student-por.csv
│
├── templates/
│   └── index.html
│
├── static/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── script.js
│   └── images/
│
└── README.md
```

*Note: Adjust the structure above if your actual project contains additional or differently named files.*

## 🚀 Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/thoufeekt361/Student-Performnace-ML.git
```

### 2. Navigate to the Project Folder

```bash
cd Student-Performnace-ML
```

### 3. Create a Virtual Environment (Optional)

```bash
python -m venv venv
```

Activate it on Windows:

```bash
venv\Scripts\activate
```

### 4. Install Required Libraries

```bash
pip install flask pandas numpy scikit-learn
```

### 5. Run the Application

```bash
python main.py
```

### 6. Open in Browser

Visit:

```text
http://127.0.0.1:5000/
```

The Student Academic Performance Prediction dashboard will be displayed.

## 🔮 Future Scope

- Include additional student-related features.
- Use larger and more diverse datasets.
- Compare SVM with other classification algorithms.
- Improve prediction performance through feature selection and model tuning.
- Enhance dashboard reporting and visualization.
- Validate the model using additional student data.

## 👨‍💻 Project Information

**Project Title:** Student Academic Performance Prediction Using Machine Learning

**Domain:** Machine Learning

**Algorithm:** Support Vector Machine (SVM)

**Kernel:** Radial Basis Function (RBF)

**Application:** Flask Web Dashboard

**Dataset:** UCI Student Performance Dataset

## 📚 References

- [UCI Machine Learning Repository – Student Performance Dataset](https://archive.ics.uci.edu/dataset/320/student+performance)
- [Scikit-learn Documentation](https://scikit-learn.org/stable/)
- [Flask Documentation](https://flask.palletsprojects.com/)

## ⭐ Acknowledgement

This project was developed as an academic Machine Learning project to explore student performance prediction using classification techniques.

If you find this project useful, consider giving the repository a ⭐ on GitHub.

---

**Developed with Python, Machine Learning and Flask.**
