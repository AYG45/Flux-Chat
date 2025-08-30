import { initializeApp } from "firebase/app";
import {getAuth} from "firebase/auth";
import {getFirestore} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: "chat-app-login-60517.firebaseapp.com",
  projectId: "chat-app-login-60517",
  storageBucket: "chat-app-login-60517.firebasestorage.app",
  messagingSenderId: "978459410901",
  appId: "1:978459410901:web:5fdfa62cb8224f92b8bd5c",
  measurementId: "G-JRH9Q4QYWK"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app)
export const db = getFirestore(app)