// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore'
const firebaseConfig = {
  apiKey: "AIzaSyAzKTBjsGTB_FmwVAgZCYdy31jdBgTzxmI",
  authDomain: "boom-4a9a8.firebaseapp.com",
  projectId: "boom-4a9a8",
  storageBucket: "boom-4a9a8.appspot.com",
  messagingSenderId: "492787635250",
  appId: "1:492787635250:web:db367bbb13fd529bf1982b",
  measurementId: "G-N67BG34CH2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
