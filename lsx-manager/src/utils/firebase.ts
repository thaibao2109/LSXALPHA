// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCsNxP_MyTLWN632j2QDvrQpngnff9Ky5I",
    authDomain: "alpha-manager-c6f71.firebaseapp.com",
    projectId: "alpha-manager-c6f71",
    storageBucket: "alpha-manager-c6f71.firebasestorage.app",
    messagingSenderId: "657556083306",
    appId: "1:657556083306:web:6a679d14ac7a6e12f4f013",
    measurementId: "G-CDR1VF2QX8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, analytics, db, storage };
