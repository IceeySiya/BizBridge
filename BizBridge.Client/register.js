
const API_BASE_URL = "http://localhost:5214";

document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.getElementById("registerForm");
    const fullNameInput = document.getElementById("fullName");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput =
        document.getElementById("confirmPassword");
    const registerButton = document.getElementById("registerButton");
    const errorMessage = document.getElementById("registerError");
    const successMessage = document.getElementById("registerSuccess");

    if (
        !registerForm ||
        !fullNameInput ||
        !emailInput ||
        !passwordInput ||
        !registerButton
    ) {
        console.error(
            "Registration form elements are missing. Check register.html."
        );
        return;
    }

    function showMessage(element, message) {
        if (element) {
            element.textContent = message;
            element.classList.remove("d-none");
        }
    }

    function clearMessages() {
        if (errorMessage) {
            errorMessage.textContent = "";
            errorMessage.classList.add("d-none");
        }

        if (successMessage) {
            successMessage.textContent = "";
            successMessage.classList.add("d-none");
        }
    }

    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        clearMessages();

        const fullName = fullNameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput
            ? confirmPasswordInput.value
            : password;

        if (!fullName || !email || !password) {
            showMessage(
                errorMessage,
                "Please complete all required fields."
            );
            return;
        }

        if (confirmPassword !== password) {
            showMessage(
                errorMessage,
                "Your passwords do not match."
            );
            return;
        }

        registerButton.disabled = true;
        const originalButtonText = registerButton.textContent;
        registerButton.textContent = "Creating account...";

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/auth/register`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        fullName,
                        email,
                        password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Registration failed. Please check your details."
                );
            }

            showMessage(
                successMessage,
                "Your BizBridge account has been created. Redirecting to login..."
            );

            registerForm.reset();

            // Do not automatically log the user in here.
            // They can sign in through the normal login flow.
            setTimeout(() => {
                window.location.href = "login.html";
            }, 1200);
        } catch (error) {
            console.error("Registration error:", error);

            showMessage(
                errorMessage,
                error instanceof TypeError
                    ? "Unable to connect to BizBridge. Check that the API is running."
                    : error.message ||
                      "Something went wrong. Please try again."
            );
        } finally {
            registerButton.disabled = false;
            registerButton.textContent = "Create Account";
        }
    });
});
