
"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const API_BASE_URL = window.BIZBRIDGE_API_BASE_URL;

    if (!API_BASE_URL) {
        console.error(
            "API base URL is missing. Check that api-config.js loads before dashboard.js."
        );
        return;
    }

    const dashboardMessage = document.getElementById("dashboardMessage");
    const logoutButton = document.getElementById("logoutButton");
    const noBusinessSection = document.getElementById("noBusinessSection");
    const businessSection = document.getElementById("businessSection");
    const financialSummaryMessage =
        document.getElementById("financialSummaryMessage");
    const predictionsMessage = document.getElementById("predictionsMessage");

    let businessId = null;
    let isLoadingDashboard = false;
    let isLoadingSummary = false;
    let isLoadingPredictions = false;
    let refreshAfterPageShow = false;

    function showMessage(message, type = "danger") {
        if (!dashboardMessage) return;
        dashboardMessage.textContent = message;
        dashboardMessage.className = `alert alert-${type}`;
    }

    function hideMessage() {
        if (!dashboardMessage) return;
        dashboardMessage.textContent = "";
        dashboardMessage.className = "alert d-none";
    }

    function logout() {
        localStorage.removeItem("token");
        window.location.replace("login.html");
    }

    logoutButton?.addEventListener("click", logout);

    function getProperty(object, camelCaseName, pascalCaseName) {
        return object?.[camelCaseName] ?? object?.[pascalCaseName];
    }

    function getErrorMessage(data, status) {
        if (typeof data === "object" && data !== null) {
            return (
                data.message ||
                data.title ||
                data.detail ||
                data.error ||
                `The API request failed (${status}).`
            );
        }

        return typeof data === "string" && data.trim()
            ? data
            : `The API request failed (${status}).`;
    }

    async function apiRequest(path, method = "GET", body = null) {
        const token = localStorage.getItem("token");

        if (!token) {
            logout();
            throw new Error("Your session has expired. Please log in again.");
        }

        const response = await fetch(`${API_BASE_URL}${path}`, {
            method,
            headers: {
                Accept: "application/json",
                ...(body === null
                    ? {}
                    : { "Content-Type": "application/json" }),
                Authorization: `Bearer ${token}`
            },
            body: body === null ? undefined : JSON.stringify(body)
        });

        if (response.status === 401 || response.status === 403) {
            logout();
            throw new Error(
                "Your session is no longer valid. Please log in again."
            );
        }

        if (response.status === 204) {
            return { response, data: null };
        }

        const responseText = await response.text();
        let data = null;

        if (responseText) {
            try {
                data = JSON.parse(responseText);
            } catch {
                data = responseText;
            }
        }

        if (!response.ok) {
            const error = new Error(
                getErrorMessage(data, response.status)
            );
            error.status = response.status;
            throw error;
        }

        return { response, data };
    }

    function formatCurrency(amount) {
        const numericAmount = Number(amount);

        if (!Number.isFinite(numericAmount)) return "—";

        return new Intl.NumberFormat("en-ZA", {
            style: "currency",
            currency: "ZAR"
        }).format(numericAmount);
    }

    function setText(id, value, fallback = "—") {
        const element = document.getElementById(id);

        if (element) {
            element.textContent =
                value === null || value === undefined || value === ""
                    ? fallback
                    : String(value);
        }
    }

    function resetFinancialSummary(message) {
        const ids = [
            "currentBalance",
            "totalIncome",
            "totalExpenses",
            "netCashFlow",
            "transactionCount"
        ];

        ids.forEach(id => setText(id, "—"));

        ["currentBalance", "netCashFlow"].forEach(id => {
            document.getElementById(id)?.classList.remove(
                "text-success",
                "text-danger"
            );
        });

        if (financialSummaryMessage) {
            financialSummaryMessage.textContent = message || "";
        }
    }

    function showNoBusiness() {
        if (businessSection) {
            businessSection.classList.add("d-none");
        }

        if (noBusinessSection) {
            noBusinessSection.classList.remove("d-none");
            noBusinessSection.innerHTML = `
                <div class="alert alert-warning mb-0" role="alert">
                    <h5 class="alert-heading">Set up your business</h5>
                    <p>
                        Create your business profile to unlock financial
                        tracking and business readiness guidance.
                    </p>
                    <a href="business-profile.html" class="btn btn-warning">
                        Create Business Profile
                    </a>
                </div>
            `;
        }

        businessId = null;

        resetFinancialSummary(
            "Create a business profile to view your financial summary."
        );

        resetPredictions(
            "Create a business profile to view financial predictions."
        );

        document.getElementById("readinessSection")?.classList.add("d-none");
        document.getElementById("businessGuideEntry")?.classList.add("d-none");
    }

    function displayBusiness(business) {
        displayBusinessImage(
            getProperty(business, "imageUrl", "ImageUrl")
        );

        setText(
            "businessName",
            getProperty(business, "businessName", "BusinessName"),
            "Unnamed Business"
        );

        setText(
            "businessIndustry",
            getProperty(business, "industry", "Industry"),
            "Industry not specified"
        );

        setText(
            "businessLocation",
            getProperty(business, "location", "Location"),
            "Location not specified"
        );

        setText(
            "businessDescription",
            getProperty(business, "description", "Description"),
            "No description provided."
        );

        const established = getProperty(
            business,
            "established",
            "Established"
        );

        const establishedElement =
            document.getElementById("businessEstablished");

        if (establishedElement) {
            const date = established ? new Date(established) : null;

            establishedElement.textContent =
                date && !Number.isNaN(date.getTime())
                    ? date.toLocaleDateString("en-ZA")
                    : "Not specified";
        }

        const hasEmail = displayContactField(
            "businessEmailRow",
            "businessEmail",
            getProperty(business, "businessEmail", "BusinessEmail"),
            "email"
        );

        const hasPhone = displayContactField(
            "businessPhoneRow",
            "businessPhone",
            getProperty(business, "businessPhone", "BusinessPhone"),
            "phone"
        );

        const hasWebsite = displayContactField(
            "websiteUrlRow",
            "websiteUrl",
            getProperty(business, "websiteUrl", "WebsiteUrl"),
            "website"
        );

        document.getElementById("businessContactSection")
            ?.classList.toggle(
                "d-none",
                !hasEmail && !hasPhone && !hasWebsite
            );

        businessSection?.classList.remove("d-none");

        showBusinessGuideEntry();
    }

    function showBusinessGuideEntry() {
        const guideEntry = document.getElementById("businessGuideEntry");
        if (!guideEntry) return;

        guideEntry.innerHTML = `
            <div class="alert alert-info mb-0" role="region"
                 aria-labelledby="businessGuideTitle">
                <h5 class="alert-heading" id="businessGuideTitle">
                    <i class="bi bi-compass me-2"></i>
                    BizBridge Business Guide
                </h5>
                <p>
                    Explore practical tips and recommended next steps
                    based on your business progress.
                </p>
                <a href="business-guide.html" class="btn btn-primary">
                    Open Business Guide
                </a>
            </div>
        `;

        guideEntry.classList.remove("d-none");
    }

    async function loadAccount() {
        const { data } = await apiRequest("/auth/me");
        const user = data?.user ?? data?.data ?? data;

        if (!user || typeof user !== "object") {
            throw new Error("Could not load your account details.");
        }

        const firstName = getProperty(user, "firstName", "FirstName");
        const lastName = getProperty(user, "lastName", "LastName");

        const fullName =
            getProperty(user, "fullName", "FullName") ||
            [firstName, lastName].filter(Boolean).join(" ") ||
            getProperty(user, "userName", "UserName") ||
            getProperty(user, "username", "Username") ||
            "User";

        setText("profileName", fullName, "User");
        setText(
            "profileEmail",
            getProperty(user, "email", "Email"),
            "Not available"
        );
        setText(
            "profileRole",
            getProperty(user, "role", "Role"),
            "User"
        );
    }

    async function loadBusiness() {
        let result;

        try {
            result = await apiRequest("/businesses/mine");
        } catch (error) {
            if (error.status === 404) {
                showNoBusiness();
                return;
            }

            throw error;
        }

        const { response, data } = result;

        if (response.status === 204 || !data) {
            showNoBusiness();
            return;
        }

        const business = data?.business ?? data?.data ?? data;
        const id = getProperty(business, "businessID", "BusinessID");

        if (id === null || id === undefined || id === "") {
            throw new Error(
                "The business response did not include a business ID."
            );
        }

        businessId = id;
        displayBusiness(business);

        await Promise.all([
            loadFinancialSummary(),
            loadReadiness(),
            loadPredictions()
        ]);
    }


let predictionsChartInstance = null;

const predictionCurrencyFormatter = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  maximumFractionDigits: 0
});

function renderPredictionsChart(chartPoints) {
  const canvas = document.getElementById("predictionsChart");
  const message = document.getElementById("predictionsChartMessage");

  if (!canvas || !message) return;

  // Destroy the previous chart before drawing another one.
  if (predictionsChartInstance) {
    predictionsChartInstance.destroy();
    predictionsChartInstance = null;
  }

  if (!Array.isArray(chartPoints) || chartPoints.length === 0) {
    message.textContent = "There is not enough forecast data to display the chart yet.";
    return;
  }

  const labels = chartPoints.map(point => point.month);

  const actualValues = chartPoints.map(point =>
    point.actualNetCashFlow == null
      ? null
      : Number(point.actualNetCashFlow)
  );

  // Start the forecast line at the last actual value so the
  // transition from historical results to the prediction is visible.
  const lastActualIndex = actualValues.reduce(
    (lastIndex, value, index) => value !== null ? index : lastIndex,
    -1
  );

  const predictedValues = chartPoints.map(() => null);

  if (lastActualIndex >= 0) {
    predictedValues[lastActualIndex] = actualValues[lastActualIndex];
  }

  chartPoints.forEach((point, index) => {
    if (point.predictedNetCashFlow != null) {
      predictedValues[index] = Number(point.predictedNetCashFlow);
    }
  });

  predictionsChartInstance = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Actual net cash flow",
          data: actualValues,
          borderColor: "#198754",
          backgroundColor: "rgba(25, 135, 84, 0.12)",
          pointBackgroundColor: "#198754",
          pointRadius: 5,
          pointHoverRadius: 7,
          borderWidth: 3,
          tension: 0.25,
          spanGaps: false
        },
        {
          label: "Predicted net cash flow",
          data: predictedValues,
          borderColor: "#fd7e14",
          backgroundColor: "rgba(253, 126, 20, 0.10)",
          pointBackgroundColor: "#fd7e14",
          pointRadius: 5,
          pointHoverRadius: 7,
          borderWidth: 3,
          borderDash: [7, 5],
          tension: 0.25,
          spanGaps: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: "index"
      },
      plugins: {
        legend: {
          position: "bottom"
        },
        tooltip: {
          callbacks: {
            label(context) {
              return `${context.dataset.label}: ${
                predictionCurrencyFormatter.format(context.parsed.y)
              }`;
            }
          }
        }
      },
      scales: {
        y: {
          title: {
            display: true,
            text: "Net cash flow (ZAR)"
          },
          ticks: {
            callback(value) {
              return predictionCurrencyFormatter.format(value);
            }
          }
        },
        x: {
          title: {
            display: true,
            text: "Month"
          }
        }
      }
    }
  });

  message.textContent =
    "Actual values come from recorded transactions. The dashed line represents the forecast, not a guaranteed result.";
}


    async function loadFinancialSummary() {
        if (!businessId || isLoadingSummary) return;

        isLoadingSummary = true;

        if (financialSummaryMessage) {
            financialSummaryMessage.textContent =
                "Loading financial summary...";
        }

        try {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, "0");
            const day = String(now.getDate()).padStart(2, "0");

            const startDate = `${year}-${month}-01`;
            const endDate = `${year}-${month}-${day}`;

            const query = new URLSearchParams({
                startDate,
                endDate
            });

            const { data } = await apiRequest(
                `/businesses/${businessId}/financial-summary?${query}`
            );

            if (!data || typeof data !== "object") {
                throw new Error(
                    "The API returned no financial summary."
                );
            }

            const currentBalance = Number(
                getProperty(data, "currentBalance", "CurrentBalance")
            );

            const totalIncome = Number(
                getProperty(data, "totalIncome", "TotalIncome") ?? 0
            );

            const totalExpenses = Number(
                getProperty(data, "totalExpenses", "TotalExpenses") ?? 0
            );

            const netCashFlow = Number(
                getProperty(data, "netCashFlow", "NetCashFlow") ??
                (totalIncome - totalExpenses)
            );

            const transactionCount = Number(
                getProperty(data, "transactionCount", "TransactionCount") ?? 0
            );

            if (
                !Number.isFinite(currentBalance) ||
                !Number.isFinite(totalIncome) ||
                !Number.isFinite(totalExpenses) ||
                !Number.isFinite(netCashFlow) ||
                !Number.isFinite(transactionCount) ||
                transactionCount < 0
            ) {
                throw new Error(
                    "The financial summary contains invalid values. " +
                    "Check the API response and CurrentBalance property."
                );
            }

            const balanceElement =
                document.getElementById("currentBalance");

            if (balanceElement) {
                balanceElement.textContent = formatCurrency(currentBalance);
                balanceElement.classList.remove(
                    "text-success",
                    "text-danger"
                );
                balanceElement.classList.add(
                    currentBalance >= 0 ? "text-success" : "text-danger"
                );
            }

            setText("totalIncome", formatCurrency(totalIncome));
            setText("totalExpenses", formatCurrency(totalExpenses));

            const netElement = document.getElementById("netCashFlow");

            if (netElement) {
                netElement.textContent = formatCurrency(netCashFlow);
                netElement.classList.remove(
                    "text-success",
                    "text-danger"
                );
                netElement.classList.add(
                    netCashFlow >= 0 ? "text-success" : "text-danger"
                );
            }

            setText("transactionCount", transactionCount);

            if (financialSummaryMessage) {
                financialSummaryMessage.textContent =
                    `Summary for ${startDate} to ${endDate}. ` +
                    "Current balance includes the opening balance and all recorded transactions.";
            }
        } catch (error) {
            console.error("Financial summary error:", error);

            resetFinancialSummary(
                `Unable to load financial summary: ${error.message}`
            );
        } finally {
            isLoadingSummary = false;
        }
    }

    // ---------------- FINANCIAL PREDICTIONS ----------------

    function resetPredictions(message) {
        [
            "forecastIncome",
            "forecastExpenses",
            "forecastNetCashFlow",
            "projectedClosingBalance"
        ].forEach(id => {
            setText(id, "—");
            document.getElementById(id)?.classList.remove(
                "text-success",
                "text-danger"
            );
        });

        setText(
            "forecastPeriod",
            "Forecast for next month",
            "Forecast for next month"
        );

        setText("forecastBasis", "", "");

        const warningContainer =
            document.getElementById("predictionWarnings");

        if (warningContainer) {
            warningContainer.replaceChildren();
        }

        if (predictionsMessage) {
            predictionsMessage.textContent = message || "";
        }

        document.getElementById("predictionsSection")
            ?.classList.remove("d-none");
    }

    
function renderPredictions(data) {
    const forecast =
        getProperty(data, "forecast", "Forecast") ?? data;

    const chartPoints =
        getProperty(data, "cashFlowChart", "CashFlowChart") || [];

    const available = getProperty(
        forecast, "isForecastAvailable", "IsForecastAvailable"
    );

    const periodStart = getProperty(
        forecast, "forecastPeriodStart", "ForecastPeriodStart"
    );

    const periodEnd = getProperty(
        forecast, "forecastPeriodEnd", "ForecastPeriodEnd"
    );

    function formatDate(value) {
        if (!value) return null;

        const date = new Date(value);

        return Number.isNaN(date.getTime())
            ? null
            : date.toLocaleDateString("en-ZA");
    }

    const start = formatDate(periodStart);
    const end = formatDate(periodEnd);

    setText(
        "forecastPeriod",
        start && end ? `${start} – ${end}` : "Next-month estimate"
    );

    if (available === false) {
        resetPredictions(
            "Not enough recorded financial history is available to produce a forecast yet."
        );

        setText(
            "forecastPeriod",
            start && end
                ? `${start} – ${end}`
                : "Forecast unavailable"
        );

        setText(
            "forecastBasis",
            getProperty(forecast, "basis", "Basis"),
            "Add and maintain transactions to build a useful forecast."
        );

        // Show historical chart data even without a forecast.
        document.getElementById("predictionsSection")
            ?.classList.remove("d-none");

        renderPredictionsChart(chartPoints);
        return;
    }

    const metrics = [
        ["forecastIncome", "forecastIncome", "ForecastIncome"],
        ["forecastExpenses", "forecastExpenses", "ForecastExpenses"],
        ["forecastNetCashFlow", "forecastNetCashFlow", "ForecastNetCashFlow"],
        ["projectedClosingBalance", "projectedClosingBalance", "ProjectedClosingBalance"]
    ];

    for (const [elementId, camel, pascal] of metrics) {
        const value = getProperty(forecast, camel, pascal);

        setText(
            elementId,
            value === null || value === undefined
                ? "—"
                : formatCurrency(value)
        );
    }

    const net = Number(
        getProperty(
            forecast,
            "forecastNetCashFlow",
            "ForecastNetCashFlow"
        )
    );

    const netElement =
        document.getElementById("forecastNetCashFlow");

    if (netElement && Number.isFinite(net)) {
        netElement.classList.remove("text-success", "text-danger");
        netElement.classList.add(
            net >= 0 ? "text-success" : "text-danger"
        );
    }

    const closing = Number(
        getProperty(
            forecast,
            "projectedClosingBalance",
            "ProjectedClosingBalance"
        )
    );

    const closingElement =
        document.getElementById("projectedClosingBalance");

    if (closingElement && Number.isFinite(closing)) {
        closingElement.classList.remove("text-success", "text-danger");
        closingElement.classList.add(
            closing >= 0 ? "text-success" : "text-danger"
        );
    }

    const historicalMonths = getProperty(
        forecast, "historicalMonthsUsed", "HistoricalMonthsUsed"
    );

    const basis = getProperty(forecast, "basis", "Basis");

    const historyNote =
        historicalMonths !== null &&
        historicalMonths !== undefined &&
        Number.isFinite(Number(historicalMonths))
            ? `Based on ${historicalMonths} month(s) of recorded history.`
            : null;

    setText(
        "forecastBasis",
        [basis, historyNote].filter(Boolean).join(" "),
        "Estimates use recorded business transactions and are not guarantees."
    );

    const warningContainer =
        document.getElementById("predictionWarnings");

    if (warningContainer) {
        warningContainer.replaceChildren();
    }

    const predictionWarnings =
        getProperty(data, "predictionWarnings", "PredictionWarnings") || [];

    const forecastWarnings =
        getProperty(forecast, "warnings", "Warnings") || [];

    const warnings = [
        ...(Array.isArray(predictionWarnings) ? predictionWarnings : []),
        ...(Array.isArray(forecastWarnings) ? forecastWarnings : [])
    ];

    const uniqueWarnings = [
        ...new Set(
            warnings.map(item => {
                if (typeof item === "string") return item;

                return (
                    getProperty(item, "message", "Message") ||
                    getProperty(item, "description", "Description") ||
                    getProperty(item, "warning", "Warning") ||
                    "Review your financial forecast."
                );
            })
        )
    ];

    for (const warning of uniqueWarnings) {
        const item = document.createElement("li");
        item.textContent = warning;
        warningContainer?.append(item);
    }

    if (uniqueWarnings.length === 0 && warningContainer) {
        const item = document.createElement("li");

        item.textContent =
            "No forecast warnings were returned. Continue recording transactions regularly.";

        warningContainer.append(item);
    }

    if (predictionsMessage) {
        predictionsMessage.textContent =
            "Forecasts are estimates based on available records; actual results may differ.";
    }

    // Make the section visible before Chart.js measures its canvas.
    document.getElementById("predictionsSection")
        ?.classList.remove("d-none");

    renderPredictionsChart(chartPoints);
}


    async function loadPredictions() {
        if (!businessId || isLoadingPredictions) return;

        isLoadingPredictions = true;

        if (predictionsMessage) {
            predictionsMessage.textContent =
                "Loading next-month predictions...";
        }

        try {
            const { data } = await apiRequest(
                `/businesses/${businessId}/predictions`
            );

            if (!data || typeof data !== "object") {
                throw new Error(
                    "The API returned no prediction data."
                );
            }

            renderPredictions(data);
        } catch (error) {
            console.error("Financial predictions error:", error);

            resetPredictions(
                `Unable to load predictions: ${error.message}`
            );
        } finally {
            isLoadingPredictions = false;
        }
    }

    // ---------------- BUSINESS READINESS ----------------

    function renderReadiness(data) {
        const checks = getProperty(data, "checks", "Checks");

        const completedCount = Number(
            getProperty(data, "completedCount", "CompletedCount")
        );

        const totalCount = Number(
            getProperty(data, "totalCount", "TotalCount")
        );

        const progressPercent = Number(
            getProperty(data, "progressPercent", "ProgressPercent")
        );

        if (
            !Array.isArray(checks) ||
            !Number.isFinite(completedCount) ||
            !Number.isFinite(totalCount) ||
            !Number.isFinite(progressPercent)
        ) {
            throw new Error(
                "The readiness response is incomplete."
            );
        }

        const safePercent = Math.max(
            0,
            Math.min(100, progressPercent)
        );

        setText("readinessPercent", `${safePercent}%`);

        setText(
            "readinessSummary",
            `${completedCount} of ${totalCount} readiness steps complete.`
        );

        const progress = document.getElementById("readinessProgress");

        if (progress) {
            progress.setAttribute(
                "aria-valuenow",
                String(safePercent)
            );
        }

        const progressBar =
            document.getElementById("readinessProgressBar");

        if (progressBar) {
            progressBar.style.width = `${safePercent}%`;
        }

        setText(
            "readinessBasis",
            getProperty(data, "basis", "Basis"),
            ""
        );

        const checksElement =
            document.getElementById("readinessChecks");

        if (checksElement) {
            checksElement.replaceChildren();
        }

        for (const check of checks) {
            const wrapper = document.createElement("div");
            wrapper.className = "form-check readiness-check";

            const checkbox = document.createElement("input");
            const checkId = getProperty(check, "checkId", "CheckID");
            const canEdit = Boolean(
                getProperty(check, "canEdit", "CanEdit")
            );

            const key = getProperty(check, "id", "Id") ?? checkId;

            checkbox.type = "checkbox";
            checkbox.className = "form-check-input";
            checkbox.id = `readiness-${key}`;

            checkbox.checked = Boolean(
                getProperty(check, "isCompleted", "IsCompleted")
            );

            checkbox.disabled = !canEdit || checkId == null;

            const label = document.createElement("label");
            label.className = "form-check-label fw-semibold";
            label.htmlFor = checkbox.id;

            label.textContent =
                getProperty(check, "title", "Title") ||
                "Readiness item";

            const description = document.createElement("p");
            description.className = "text-secondary small mb-0";

            description.textContent = [
                getProperty(check, "description", "Description"),
                canEdit
                    ? "Self-reported"
                    : "Based on BizBridge records"
            ].filter(Boolean).join(" · ");

            checkbox.addEventListener("change", async () => {
                const newValue = checkbox.checked;
                checkbox.disabled = true;

                setText(
                    "readinessMessage",
                    "Saving checklist progress...",
                    ""
                );

                try {
                    const { data: updated } = await apiRequest(
                        `/readiness/mine/${checkId}`,
                        "PUT",
                        { isCompleted: newValue }
                    );

                    renderReadiness(updated);

                    setText(
                        "readinessMessage",
                        "Checklist progress saved.",
                        ""
                    );
                } catch (error) {
                    console.error(
                        "Readiness update error:",
                        error
                    );

                    checkbox.checked = !newValue;
                    checkbox.disabled = false;

                    setText(
                        "readinessMessage",
                        `Unable to save checklist progress: ${error.message}`,
                        ""
                    );
                }
            });

            wrapper.append(checkbox, label, description);
            checksElement?.append(wrapper);
        }

        const nextStepsElement =
            document.getElementById("readinessNextSteps");

        if (nextStepsElement) {
            nextStepsElement.replaceChildren();
        }

        const nextSteps = getProperty(
            data,
            "recommendedNextSteps",
            "RecommendedNextSteps"
        ) || [];

        if (nextStepsElement && nextSteps.length === 0) {
            const item = document.createElement("li");

            item.textContent =
                "All listed readiness steps are complete. Keep your records up to date.";

            nextStepsElement.append(item);
        } else if (nextStepsElement) {
            for (const step of nextSteps) {
                const item = document.createElement("li");
                item.className = "mb-1";

                item.append(
                    document.createTextNode(
                        getProperty(step, "nextStep", "NextStep") ||
                        getProperty(step, "title", "Title") ||
                        "Review this readiness item."
                    )
                );

                const actionUrl = getProperty(
                    step,
                    "actionUrl",
                    "ActionUrl"
                );

                if (actionUrl) {
                    const link = document.createElement("a");
                    link.href = actionUrl;
                    link.className = "ms-2";
                    link.textContent = "Open";
                    item.append(link);
                }

                nextStepsElement.append(item);
            }
        }

        document.getElementById("readinessSection")
            ?.classList.remove("d-none");
    }

    async function loadReadiness() {
        try {
            const { data } = await apiRequest("/readiness/mine");

            renderReadiness(data);
            setText("readinessMessage", "", "");
        } catch (error) {
            console.error("Readiness loading error:", error);

            setText(
                "readinessMessage",
                `Unable to load readiness checklist: ${error.message}`,
                ""
            );

            document.getElementById("readinessSection")
                ?.classList.remove("d-none");
        }
    }

    // ---------------- DASHBOARD INITIALISATION ----------------

    async function loadDashboard() {
        if (isLoadingDashboard) {
            refreshAfterPageShow = true;
            return;
        }

        if (!localStorage.getItem("token")) {
            logout();
            return;
        }

        isLoadingDashboard = true;
        hideMessage();

        setText("profileName", "Loading...");
        setText("profileEmail", "Loading...");
        setText("profileRole", "Loading...");

        try {
            try {
                await loadAccount();
            } catch (error) {
                console.error("Account loading error:", error);

                if (localStorage.getItem("token")) {
                    showMessage(
                        `Could not load account details: ${error.message}`
                    );
                }
            }

            if (!localStorage.getItem("token")) return;

            try {
                await loadBusiness();
            } catch (error) {
                console.error("Business loading error:", error);

                if (localStorage.getItem("token")) {
                    showMessage(
                        `Could not load your business: ${error.message}`
                    );
                }
            }
        } finally {
            isLoadingDashboard = false;

            if (refreshAfterPageShow) {
                refreshAfterPageShow = false;
                refreshDashboardData();
            }
        }
    }

    function refreshDashboardData() {
        if (!businessId || !localStorage.getItem("token")) return;

        loadFinancialSummary();
        loadReadiness();
        loadPredictions();
    }

    window.addEventListener("pageshow", event => {
        if (event.persisted) {
            refreshDashboardData();
        }
    });

    function displayBusinessImage(imageUrl) {
        const image = document.getElementById("businessImage");

        const placeholder = document.getElementById(
            "businessImagePlaceholder"
        );

        if (!image || !placeholder) return;

        if (!imageUrl) {
            image.removeAttribute("src");
            image.classList.add("d-none");
            placeholder.classList.remove("d-none");
            return;
        }

        image.onerror = () => {
            image.classList.add("d-none");
            placeholder.classList.remove("d-none");
        };

        image.onload = () => {
            image.classList.remove("d-none");
            placeholder.classList.add("d-none");
        };

        image.src = imageUrl;
    }

    function displayContactField(rowId, linkId, value, type) {
        const row = document.getElementById(rowId);
        const link = document.getElementById(linkId);

        if (!row || !link) {
            console.warn(
                `Missing contact field elements: ${rowId}, ${linkId}`
            );
            return false;
        }

        const cleanValue =
            typeof value === "string" ? value.trim() : "";

        if (!cleanValue) {
            row.classList.add("d-none");
            link.removeAttribute("href");
            link.textContent = "";
            return false;
        }

        link.textContent = cleanValue;

        if (type === "email") {
            link.href = `mailto:${cleanValue}`;
        } else if (type === "phone") {
            link.href = `tel:${cleanValue}`;
        } else if (type === "website") {
            link.href = /^https?:\/\//i.test(cleanValue)
                ? cleanValue
                : `https://${cleanValue}`;
        }

        row.classList.remove("d-none");
        return true;
    }

    loadDashboard();
});
