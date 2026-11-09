
/* global importScripts, firebase, self */

// Firebase compatibility SDK for service workers
importScripts(
  "https://www.gstatic.com/firebasejs/12.10.0/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/12.10.0/firebase-messaging-compat.js"
);

// Firebase Web App Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDPsWa0mNJl7tEyYTuHXu8LjFcTWETsUEo",
  authDomain: "lovethyneighbor.firebaseapp.com",
  projectId: "ltn-the-world",
  storageBucket: "ltn-the-world.firebasestorage.app",
  messagingSenderId: "79168901500",
  appId: "YOUR_APP_ID1:79168901500:web:688159928c0bc7d92194f9",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging
const messaging = firebase.messaging();

// Handle background notifications
messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Background message:", payload);
});
