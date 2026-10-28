const LABELS = ["Fail", "Pass"];

const COLORS = {
    Fail: "#EF5B5B",
    Pass: "#22A06B"
};

let doughnutChart = null;
let barChart = null;
let analyticsDoughnut = null;
let analyticsBar = null;

let currentPage = 1;
let totalPages = 1;

let searchTimer = null;


async function api(url, options = {}) {
    const response = await fetch(url, options);

    let data;

    try {
        data = await response.json();
    } catch {
        throw new Error("The server returned an invalid response.");
    }

    if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
    }

    return data;
}


function percentage(value) {
    return `${(Number(value || 0) * 100).toFixed(1)}%`;
}


function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return entities[character];
    });
}


function showSection(sectionId) {
    document.querySelectorAll(".content-section").forEach(section => {
        section.classList.toggle(
            "hidden",
            section.id !== sectionId
        );
    });

    document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.toggle(
            "active",
            link.dataset.section === sectionId
        );
    });

    const activeLink = document.querySelector(
        `.nav-link[data-section="${sectionId}"]`
    );

    const pageTitle = document.getElementById("pageTitle");

    if (activeLink && pageTitle) {
        pageTitle.textContent = activeLink.textContent.trim();
    }

    document.getElementById("sidebar")?.classList.remove("sidebar-open");

    if (sectionId === "analytics") {
        loadAnalytics();
    }

    if (sectionId === "records") {
        loadStudents();
    }
}


function setupNavigation() {
    const sections = document.querySelectorAll(".content-section");
    const navLinks = document.querySelectorAll(".nav-link");

    const sidebar = document.getElementById("sidebar");
    const sidebarToggle = document.getElementById("sidebarToggle");
    const pageTitle = document.getElementById("pageTitle");

    const sectionNames = {
        overview: "Overview",
        analytics: "Analytics",
        prediction: "Prediction",
        evaluation: "Model Evaluation"
    };

    // Sidebar link click: smoothly scroll to the section
    navLinks.forEach(link => {
        link.addEventListener("click", event => {
            event.preventDefault();

            const sectionId = link.dataset.section;
            const targetSection = document.getElementById(sectionId);

            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

                history.replaceState(null, "", `#${sectionId}`);
            }

            // Close sidebar on mobile
            if (window.innerWidth <= 860) {
                sidebar?.classList.remove("open");
            }
        });
    });

    // Automatically highlight the active section while scrolling
    const observer = new IntersectionObserver(
        entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const sectionId = entry.target.id;

                    navLinks.forEach(link => {
                        link.classList.toggle(
                            "active",
                            link.dataset.section === sectionId
                        );
                    });

                    if (pageTitle && sectionNames[sectionId]) {
                        pageTitle.textContent = sectionNames[sectionId];
                    }

                    history.replaceState(
                        null,
                        "",
                        `#${sectionId}`
                    );
                }
            });
        },
        {
            root: null,
            rootMargin: "-20% 0px -65% 0px",
            threshold: 0
        }
    );

    sections.forEach(section => {
        observer.observe(section);
    });

    // Sidebar toggle button
    sidebarToggle?.addEventListener("click", () => {
        sidebar?.classList.toggle("open");
    });

    // Open the section from the URL hash, if valid
    const initialSection = window.location.hash.substring(1);

    const validSections = [
        "overview",
        "analytics",
        "prediction",
        "evaluation",
    ];

    const targetId = validSections.includes(initialSection)
        ? initialSection
        : "overview";

    const targetSection = document.getElementById(targetId);

    if (targetSection) {
        requestAnimationFrame(() => {
            targetSection.scrollIntoView({
                behavior: "auto",
                block: "start"
            });
        });
    }
}

function createDoughnut(canvasId, counts) {
    const canvas = document.getElementById(canvasId);

    if (!canvas) {
        return null;
    }

    const context = canvas.getContext("2d");

    return new Chart(context, {
        type: "doughnut",

        data: {
            labels: LABELS,

            datasets: [{
                data: LABELS.map(label => counts[label] || 0),

                backgroundColor: LABELS.map(label => COLORS[label]),

                borderWidth: 0,

                hoverOffset: 5
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            cutout: "68%",

            plugins: {
                legend: {
                    position: "bottom"
                },

                tooltip: {
                    callbacks: {
                        label(context) {
                            const value = context.raw || 0;

                            return `${context.label}: ${value} students`;
                        }
                    }
                }
            }
        }
    });
}


function createBarChart(canvasId, labels, counts) {
    const canvas = document.getElementById(canvasId);

    if (!canvas) {
        return null;
    }

    return new Chart(canvas.getContext("2d"), {
        type: "bar",

        data: {
            labels: labels,

            datasets: [{
                label: "Number of Students",

                data: counts,

                backgroundColor: "#7467F0",

                borderRadius: 5,

                maxBarThickness: 24
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            scales: {
                x: {
                    title: {
                        display: true,
                        text: "Final Grade (G3)"
                    },

                    grid: {
                        display: false
                    }
                },

                y: {
                    beginAtZero: true,

                    ticks: {
                        precision: 0
                    },

                    title: {
                        display: true,
                        text: "Number of Students"
                    }
                }
            },

            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}


async function loadOverview() {
    try {
        const data = await api("/api/overview");

        document.getElementById("kpiStudents").textContent =
            Number(data.total_students).toLocaleString();

        document.getElementById("kpiAverage").textContent =
            Number(data.average_grade).toFixed(2);

        document.getElementById("kpiAccuracy").textContent =
            percentage(data.accuracy);

        document.getElementById("kpiPass").textContent =
            Number(data.pass_count).toLocaleString();

        const failCount = data.class_counts.Fail || 0;
        const passCount = data.class_counts.Pass || 0;

        const legend = document.getElementById("performanceLegend");

        if (legend) {
            legend.innerHTML = `
                <span>
                    <i style="background:${COLORS.Fail}"></i>
                    Fail (${failCount})
                </span>

                <span>
                    <i style="background:${COLORS.Pass}"></i>
                    Pass (${passCount})
                </span>
            `;
        }

        if (doughnutChart) {
            doughnutChart.destroy();
        }

        doughnutChart = createDoughnut(
            "doughnutChart",
            data.class_counts
        );

        document.getElementById("evalAccuracy").textContent =
            percentage(data.accuracy);

        document.getElementById("evalPrecision").textContent =
            percentage(data.precision);

        document.getElementById("evalRecall").textContent =
            percentage(data.recall);

        document.getElementById("evalF1").textContent =
            percentage(data.f1);

    } catch (error) {
        console.error("Overview loading failed:", error);
    }
}


async function loadAnalytics() {
    try {
        const [overview, analytics] = await Promise.all([
            api("/api/overview"),
            api("/api/analytics")
        ]);

        if (analyticsDoughnut) {
            analyticsDoughnut.destroy();
        }

        if (analyticsBar) {
            analyticsBar.destroy();
        }

        analyticsDoughnut = createDoughnut(
            "analyticsDoughnut",
            overview.class_counts
        );

        analyticsBar = createBarChart(
            "analyticsBar",
            analytics.labels,
            analytics.counts
        );

        // Recreate charts when the browser resizes.
        if (doughnutChart) {
            doughnutChart.resize();
        }

    } catch (error) {
        console.error("Analytics loading failed:", error);
    }
}



async function loadConfusionMatrix() {
    const container = document.getElementById("confusionMatrix");

    try {
        const data = await api("/api/confusion-matrix");

        let html = `
            <table class="matrix">
                <thead>
                    <tr>
                        <th>Actual↓ / Predicted→</th>
        `;

        data.labels.forEach(label => {
            html += `<th>${escapeHTML(label)}</th>`;
        });

        html += `
                    </tr>
                </thead>
                <tbody>
        `;

        data.matrix.forEach((row, rowIndex) => {
            html += `
                <tr>
                    <th scope="row">
                        ${escapeHTML(data.labels[rowIndex])}
                    </th>
            `;

            row.forEach((value, colIndex) => {
                const isCorrect = rowIndex === colIndex;
                const cellClass = isCorrect
                    ? "correct-cell"
                    : "incorrect-cell";

                const caption = isCorrect
                    ? "Correct"
                    : "Incorrect";

                html += `
                    <td class="${cellClass}">
                        <span class="matrix-value">
                            ${Number(value)}
                        </span>
                        <span class="matrix-caption">
                            ${caption}
                        </span>
                    </td>
                `;
            });

            html += "</tr>";
        });

        html += `
                </tbody>
            </table>
        `;

        container.innerHTML = html;

    } catch (error) {
        container.textContent =
            "Unable to load confusion matrix.";
        console.error("Confusion matrix error:", error);
    }
}



async function loadClassificationReport() {
    const tbody = document.getElementById("classificationReport");

    try {
        const data = await api("/api/classification-report");

        let html = "";

        LABELS.forEach(label => {
            const item = data[label];

            html += `
                <tr>
                    <td>
                        <span class="performance-pill ${label}">
                            ${label}
                        </span>
                    </td>

                    <td>${percentage(item.precision)}</td>
                    <td>${percentage(item.recall)}</td>
                    <td>${percentage(item["f1-score"])}</td>
                    <td>${Number(item.support)}</td>
                </tr>
            `;
        });

        tbody.innerHTML = html;

    } catch (error) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5">Unable to load classification report.</td>
            </tr>
        `;

        console.error(error);
    }
}


function displayPrediction(data) {
    const placeholder = document.getElementById("predictionPlaceholder");
    const result = document.getElementById("predictionResult");
    const badge = document.getElementById("predictionBadge");
    const message = document.getElementById("predictionMessage");
    const bars = document.getElementById("probabilityBars");

    placeholder.classList.add("hidden");
    result.classList.remove("hidden");

    const prediction = data.prediction;

    badge.textContent = prediction;
    badge.className = `prediction-badge ${prediction}`;

    if (prediction === "Pass") {
        message.textContent =
            "The model predicts that the student will pass based on the entered features.";
    } else {
        message.textContent =
            "The model predicts that the student may fail based on the entered features.";
    }

    let html = "";

    LABELS.forEach(label => {
        const value = Number(data.probabilities[label] || 0);
        const width = Math.max(0, Math.min(100, value * 100));

        html += `
            <div class="probability-item">

                <div class="probability-label">
                    <span>${label}</span>
                    <strong>${percentage(value)}</strong>
                </div>

                <div class="probability-track">
                    <div
                        class="probability-fill ${label}"
                        style="width:${width}%"
                    ></div>
                </div>

            </div>
        `;
    });

    bars.innerHTML = html;
}


function setupPredictionForm() {
    const form = document.getElementById("predictionForm");

    const errorBox = document.getElementById("formError");

    const button = document.getElementById("predictButton");

    form.addEventListener("submit", async event => {
        event.preventDefault();

        errorBox.classList.add("hidden");
        errorBox.textContent = "";

        const studytime = Number(
            document.getElementById("studytime").value
        );

        const G1 = Number(
            document.getElementById("G1").value
        );

        const G2 = Number(
            document.getElementById("G2").value
        );

        if (
            ![1, 2, 3, 4].includes(studytime) ||
            !Number.isInteger(G1) ||
            !Number.isInteger(G2) ||
            G1 < 0 ||
            G1 > 20 ||
            G2 < 0 ||
            G2 > 20
        ) {
            errorBox.textContent =
                "Please enter valid values for study time, G1 and G2.";

            errorBox.classList.remove("hidden");

            return;
        }

        button.disabled = true;
        button.textContent = "Predicting...";

        try {
            const data = await api("/api/predict", {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    studytime,
                    G1,
                    G2
                })
            });

            displayPrediction(data);

        } catch (error) {
            errorBox.textContent = error.message;
            errorBox.classList.remove("hidden");

        } finally {
            button.disabled = false;
            button.textContent = "Predict Performance";
        }
    });


    form.addEventListener("reset", () => {
        errorBox.classList.add("hidden");
        errorBox.textContent = "";

        document.getElementById("predictionResult")
            .classList.add("hidden");

        document.getElementById("predictionPlaceholder")
            .classList.remove("hidden");
    });
}


async function loadStudents() {
    const tbody = document.getElementById("studentTableBody");

    const search = document.getElementById("studentSearch").value.trim();

    tbody.innerHTML = `
        <tr>
            <td colspan="10">Loading student records...</td>
        </tr>
    `;

    try {
        const params = new URLSearchParams({
            page: String(currentPage),
            search: search
        });

        const data = await api(`/api/students?${params.toString()}`);

        totalPages = data.total_pages;
        currentPage = data.page;

        document.getElementById("recordsCount").textContent =
            `${data.total} matching student records`;

        document.getElementById("pageInfo").textContent =
            `Page ${currentPage} of ${totalPages}`;

        document.getElementById("prevPage").disabled =
            currentPage <= 1;

        document.getElementById("nextPage").disabled =
            currentPage >= totalPages;

        if (data.students.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10">No matching student records found.</td>
                </tr>
            `;

            return;
        }

        tbody.innerHTML = data.students.map(student => {
            const performance = student.performance;

            return `
                <tr>
                    <td>${escapeHTML(student.school)}</td>
                    <td>${escapeHTML(student.sex)}</td>
                    <td>${Number(student.age)}</td>
                    <td>${Number(student.studytime)}</td>
                    <td>${Number(student.failures)}</td>
                    <td>${Number(student.absences)}</td>
                    <td>${Number(student.G1)}</td>
                    <td>${Number(student.G2)}</td>
                    <td>${Number(student.G3)}</td>

                    <td>
                        <span class="performance-pill ${performance}">
                            ${escapeHTML(performance)}
                        </span>
                    </td>
                </tr>
            `;
        }).join("");

    } catch (error) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10">Unable to load student records.</td>
            </tr>
        `;

        console.error(error);
    }
}


function setupStudentSearch() {
    const searchInput = document.getElementById("studentSearch");

    document.getElementById("searchButton").addEventListener("click", () => {
        currentPage = 1;
        loadStudents();
    });

    searchInput.addEventListener("input", () => {
        clearTimeout(searchTimer);

        searchTimer = setTimeout(() => {
            currentPage = 1;
            loadStudents();
        }, 300);
    });

    searchInput.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            event.preventDefault();

            clearTimeout(searchTimer);

            currentPage = 1;
            loadStudents();
        }
    });

    document.getElementById("prevPage").addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            loadStudents();
        }
    });

    document.getElementById("nextPage").addEventListener("click", () => {
        if (currentPage < totalPages) {
            currentPage++;
            loadStudents();
        }
    });
}


async function initializeDashboard() {
    setupNavigation();
    setupPredictionForm();

    await Promise.all([
        loadOverview(),
        loadAnalytics(),
        loadConfusionMatrix(),
        loadClassificationReport()
    ]);
}


document.addEventListener("DOMContentLoaded", initializeDashboard);