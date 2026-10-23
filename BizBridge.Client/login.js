
const API_BASE_URL = "http://localhost:5214";

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const loginButton = document.getElementById("loginButton");
    const errorMessage = document.getElementById("loginError");

    if (!loginForm || !emailInput || !passwordInput || !loginButton) {
        console.error(
            "Login form elements are missing. Check the IDs in login.html."
        );
        return;
    }

    // Display feedback without inserting HTML.
    function showError(message) {
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.classList.remove("d-none");
        } else {
            alert(message);
        }
    }

    function clearError() {
        if (errorMessage) {
            errorMessage.textContent = "";
            errorMessage.classList.add("d-none");
        }
    }

    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        clearError();

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            showError("Please enter your email and password.");
            return;
        }

        loginButton.disabled = true;
        const originalButtonText = loginButton.textContent;
        loginButton.textContent = "Signing in...";

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/auth/login`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email,
                        password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Invalid email or password."
                );
            }

            if (!data.accessToken) {
                throw new Error(
                    "Login succeeded, but no access token was returned."
                );
            }

            // Store the JWT for authenticated API requests.
            localStorage.setItem("token", data.accessToken);

            // Optional user details for the frontend.
            if (data.user) {
                localStorage.setItem(
                    "user",
                    JSON.stringify(data.user)
                );
            }

            loginButton.textContent = "Login successful!";

            // Navigate to the Business Command Centre.
            window.location.href = "dashboard.html";
        } catch (error) {
            console.error("Login error:", error);
            showError(
                error instanceof TypeError
                    ? "Unable to connect to BizBridge. Check that the API is running."
                    : error.message || "Something went wrong. Please try again."
            );

            loginButton.disabled = false;
            loginButton.textContent = originalButtonText;
        }
    });
});
