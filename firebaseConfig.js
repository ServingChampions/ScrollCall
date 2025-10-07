// Import the functions you need from the SDKs
import { initializeApp } from "https://esm.run/firebase/app";
import { getAI, GoogleAIBackend } from "https://esm.run/firebase/ai";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA-XzZtvpg8R_FsrEDWSJrmJnbro49ErPQ",
    authDomain: "scroll-call-ai-feature.firebaseapp.com",
    projectId: "scroll-call-ai-feature",
    storageBucket: "scroll-call-ai-feature.firebasestorage.app",
    messagingSenderId: "43984757181",
    appId: "1:43984757181:web:0c95ff90b9d37653db32d4"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);

// Initialize the AI service
const ai = getAI(firebaseApp, { backend: new GoogleAIBackend() });

// Export the things we need in other files
export { firebaseApp, ai };