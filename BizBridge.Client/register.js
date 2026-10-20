"use strict";

// Your running ASP.NET Core API
const API_BASE_URL = "http://localhost:5214/api";

document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.getElementById("registerForm");
    const registerMessage = document.getElementById("registerMessage");
    const registerButton = document.getElementById("registerButton");

    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const fullName = document.getElementById("fullName").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword =
            document.getElementById("confirmPassword").value;

        // Clear the previous message.
        registerMessage.textContent = "";
        registerMessage.className = "alert d-none";

        // Check that both passwords match.
        if (password !== confirmPassword) {
            showMessage("Passwords do not match.", "danger");
            return;
        }

        // Match the backend's minimum password length.
        if (password.length < 12) {
            showMessage(
                "Your password must contain at least 12 characters.",
                "danger"
            );
            return;
        }

        const registrationData = {
            fullName: fullName,
            email: email,
            password: password
        };

        registerButton.disabled = true;
        registerButton.textContent = "Creating account...";

        try {
            const response = await fetch(
                `${API_BASE_URL}/auth/register`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(registrationData)
                }
            );

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                const errorMessage =
                    result.message ||
                    result.title ||
                    "Registration failed. Please check your details.";

                showMessage(errorMessage, "danger");
                return;
            }

           showMessage(
                "Account created successfully! Redirecting to login...",
                "success"
            );

            registerForm.reset();

            setTimeout(() => {
                window.location.href = "login.html";
            }, 1500);

        } catch (error) {
            console.error("Registration request failed:", error);

            showMessage(
                "Could not connect to BizBridge. Check that the API is running and try again.",
                "danger"
            );
        } finally {
            registerButton.disabled = false;
            registerButton.textContent = "Create Account";
        }
    });

    function showMessage(message, type) {
        registerMessage.textContent = message;
        registerMessage.className = `alert alert-${type}`;
    }
});
