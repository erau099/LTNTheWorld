
import { initializeApp } from "firebase/app";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Temporary configuration check (DT-310)
console.log("Firebase configuration check:", {
  projectId: firebaseConfig.projectId,
  appIdPresent: Boolean(firebaseConfig.appId),
  apiKeyPresent: Boolean(firebaseConfig.apiKey),
  senderIdPresent: Boolean(firebaseConfig.messagingSenderId),
});

export const firebaseApp = initializeApp(firebaseConfig);

export const messagingPromise = isSupported().then((supported) => {
  return supported ? getMessaging(firebaseApp) : null;
});
