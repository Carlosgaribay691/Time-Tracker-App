
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB7rXwwFDFw7A1JxfL7YIhLC96pwJJ7Cb8",
  authDomain: "timetracker-c9074.firebaseapp.com",
  projectId: "timetracker-c9074",
  storageBucket: "timetracker-c9074.firebasestorage.app",
  messagingSenderId: "1091093086679",
  appId: "1:1091093086679:web:643c9181499ab6e0ae8b92",
  measurementId: "G-NJ0LZEQTGW"
};

const app = initializeApp(firebaseConfig);

// 👇 ESTO ES LO IMPORTANTE
export const auth = getAuth(app);
export const db = getFirestore(app); // 👈 asegúrate que esta línea exista
