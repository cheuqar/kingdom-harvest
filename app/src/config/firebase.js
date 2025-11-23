// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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