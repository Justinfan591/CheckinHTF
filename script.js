import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, get } from "firebase/database";

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

function getDeviceId() {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
        if (typeof crypto !== "undefined" && crypto.randomUUID) {
            deviceId = crypto.randomUUID();
        } else {
            // fallback to uuid library if crypto.randomUUID() not available
            deviceId = uuid.v4(); // random
        }
        localStorage.setItem('deviceId', deviceId); 
    }
    return deviceId;
}

function hideCheckinForm(message, color) {
    const submitContainer = document.getElementById("submit");
    const resultContainer = document.getElementById("result");
    submitContainer.style.display = "none";
    resultContainer.textContent = message;
    result.style.color = color;
}

function checkDeviceStatus() {
    const deviceId = getDeviceId();
    const checkedInDevicesRef = ref(database, "checkedInDevices/workshop2");
    
    onValue(checkedInDevicesRef, (snapshot) => {
        const checkedInDevices = snapshot.val() || [];

        if (checkedInDevices.includes(deviceId)) {
            hideCheckinForm("✅ Already checked in", "green");
        }
    });
}

function getTorontoTime() {
    const now = new Date();
    const torontoTime = now.toLocaleString("en-CA", {
        timeZone: "America/Toronto",
        hour12: false,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });
    console.log("Toronto time:", torontoTime);
    return torontoTime;
}

window.onload = checkDeviceStatus;

window.checkEmail = async function () {
    const emailInput = document.getElementById("emailInput").value.trim();
    const result = document.getElementById("result");

    if (!emailInput) {
        result.textContent = "⚠️ Please enter your email";
        result.style.color = "orange";
        return;
    }

    try {
        const checkedInEmailsRef = ref(database, "checkedInEmails/workshop2");
        const checkedInEmailsSnapshot = await get(checkedInEmailsRef);
        const checkedInEmails = checkedInEmailsSnapshot.val() || [];

        const checkedInDevicesRef = ref(database, "checkedInDevices/workshop2");
        const checkedInDevicesSnapshot = await get(checkedInDevicesRef);
        const checkedInDevices = checkedInDevicesSnapshot.val() || [];

        const registeredEmailsRef = ref(database, "registeredEmails/workshop2");
        const registeredEmailsSnapshot = await get(registeredEmailsRef);
        const registeredEmails = registeredEmailsSnapshot.val() || [];

        const sanitizedEmail = sanitizeEmail(emailInput.toLowerCase());

        
        if (!registeredEmails.includes(sanitizedEmail)) {
            result.textContent = "❌ Invalid / Not Registered";
            result.style.color = "red";
            return;
        }

        const isEmailCheckedIn = checkedInEmails.some(entry => entry.email === sanitizedEmail);
        if (isEmailCheckedIn) {
            result.textContent = "⚠️ Email already checked in";
            result.style.color = "orange";
            return;
        }

        // add device ID to workshop2 checked-in devices
        const deviceId = getDeviceId();
        const updatedCheckedInDevices = [...checkedInDevices, deviceId];
        await set(ref(database, "checkedInDevices/workshop2"), updatedCheckedInDevices);

        // add email + timestamp to workshop2 checked-in emails
        const timestamp = getTorontoTime();
        const updatedCheckedInEmails = [...checkedInEmails, { email: sanitizedEmail, timestamp }];
        await set(ref(database, "checkedInEmails/workshop2"), updatedCheckedInEmails);

        hideCheckinForm("✅ Check-in successful!", "green");
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
    } catch (error) {
        console.error("Error checking email:", error);
        result.textContent = "⚠️ An error occurred. Please try again.";
        result.style.color = "orange";
    }
};