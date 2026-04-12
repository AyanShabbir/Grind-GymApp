// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBgiB_84XqKaD8mEz0z9QHcvxgRylc1y9s",
  authDomain: "grind-gym-1b2cc.firebaseapp.com",
  projectId: "grind-gym-1b2cc",
  storageBucket: "grind-gym-1b2cc.firebasestorage.app",
  messagingSenderId: "745835932714",
  appId: "1:745835932714:web:99f579222b1dd276426753"
};

const app = initializeApp(firebaseConfig);

// 👇 THIS is what you were missing
export const db = getFirestore(app);