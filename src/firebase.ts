import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAterXfbhmPhlFK3IY1uZExZvsU5Yeu6BM",
  authDomain: "portfolio-1932f.firebaseapp.com",
  projectId: "portfolio-1932f",
  storageBucket: "portfolio-1932f.firebasestorage.app",
  messagingSenderId: "744382992248",
  appId: "1:744382992248:web:f19572fe7dcb73f5d1428d",
  measurementId: "G-7DXQBXES3P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
export const db = getFirestore(app);
