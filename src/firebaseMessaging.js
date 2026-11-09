
import { getToken } from "firebase/messaging";
import { messagingPromise } from "./firebase";

export async function requestFCMToken() {
  try {
    const messaging = await messagingPromise;

    if (!messaging) {
      console.warn("Firebase Messaging is not supported.");
      return null;
    }

    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.warn("Notification permission not granted.");
      return null;
    }

    const registration = await navigator.serviceWorker.ready;

    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      console.log("FCM token generated successfully.");
      return token;
    }

    console.warn("No FCM token available.");
    return null;
  } catch (error) {
    console.error("FCM token generation failed:", error);
    return null;
  }
}
