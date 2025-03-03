import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue } from "firebase/database";

const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

// initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

function sanitizeEmail(email) {
    return email.replace(/[.#$\[\]]/g, "_");
}

window.checkEmail = async function () {
    const emailInput = document.getElementById("emailInput").value.trim();
    const result = document.getElementById("result");

    if (!emailInput) {
        result.textContent = "⚠️ Please enter your email";
        result.style.color = "orange";
        return;
    }

    try {
        const sanitizedEmail = sanitizeEmail(emailInput.toLowerCase());

        // check if email registered for workshop2
        const registeredEmailsRef = ref(database, "registeredEmails/workshop2");
        onValue(registeredEmailsRef, (snapshot) => {
            const registeredEmails = snapshot.val() || [];

            if (!registeredEmails.includes(sanitizedEmail)) {
                result.textContent = "❌ Not Registered";
                result.style.color = "red";
                return;
            }

            // check if email already checked in
            const checkedInEmailsRef = ref(database, "checkedInEmails/workshop2");
            onValue(checkedInEmailsRef, (snapshot) => {
                const checkedInEmails = snapshot.val() || [];

                if (checkedInEmails.includes(sanitizedEmail)) {
                    result.textContent = "⚠️ You have already checked in.";
                    result.style.color = "orange";
                } else {
                    // add email to workshop2 checked-in
                    const updatedCheckedInEmails = [...checkedInEmails, sanitizedEmail];
                    set(ref(database, "checkedInEmails/workshop2"), updatedCheckedInEmails);
                    result.textContent = "✅ Check-in successful!";
                    result.style.color = "green";
                    confetti({
                        particleCount: 100,
                        spread: 70,
                        origin: { y: 0.6 }
                    });
                }
            });
        });
    } catch (error) {
        console.error("Error checking email:", error);
        result.textContent = "⚠️ An error occurred. Please try again.";
        result.style.color = "orange";
    }
};