"use strict";

const API_BASE_URL = "https://localhost:7142/api";

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const loginMessage = document.getElementById("loginMessage");
    const loginButton = document.getElementById("loginButton");

    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        showMessage("", "");
        loginButton.disabled = true;
        loginButton.textContent = "Logging in...";

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: document.getElementById("email").value.trim(),
                    password: document.getElementById("password").value
                })
            });

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                showMessage(
                    result.message ||
                        result.title ||
                        "Login failed. Check your email and password.",
                    "danger"
                );
                return;
            }

            if (!result.accessToken) {
                throw new Error("The API did not return an access token.");
            }

            sessionStorage.setItem("bizBridgeAccessToken", result.accessToken);
            showMessage(
                `Welcome back, ${result.user.fullName}. Redirecting to your dashboard...`,
                "success"
            );
            loginForm.reset();
            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 750);
        } catch (error) {
            console.error("Login request failed:", error);
            showMessage(
                "Could not connect securely to BizBridge. Check that the HTTPS API is running and its development certificate is trusted.",
                "danger"
            );
        } finally {
            loginButton.disabled = false;
            loginButton.textContent = "Log In";
        }
    });

    function showMessage(message, type) {
        loginMessage.textContent = message;
        loginMessage.className = type
            ? `alert alert-${type}`
            : "alert d-none";
    }
});
