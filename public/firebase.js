import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBVLbqrtf6Da52IPSZVjbPIe4wpqUucclg",
  authDomain: "er-hmh.firebaseapp.com",
  projectId: "er-hmh",
  storageBucket: "er-hmh.firebasestorage.app",
  messagingSenderId: "5229466538",
  appId: "1:5229466538:web:6d649cfc8b23d186b911d3",
  measurementId: "G-K85CWMYP1S"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
