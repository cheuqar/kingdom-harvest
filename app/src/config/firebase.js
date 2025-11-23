import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAaWx7nrOtWxgNvoyKxaKw5LAuTaUtCqIA",
    authDomain: "kingdom-harvest-monopoly.firebaseapp.com",
    databaseURL: "https://kingdom-harvest-monopoly-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "kingdom-harvest-monopoly",
    storageBucket: "kingdom-harvest-monopoly.firebasestorage.app",
    messagingSenderId: "1070490193144",
    appId: "1:1070490193144:web:e4aed01abeb385684a7f0d",
    measurementId: "G-S863305K10"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Realtime Database and export it
export const db = getDatabase(app);