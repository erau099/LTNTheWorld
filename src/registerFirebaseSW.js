export async function registerFirebaseSW() {
  if (!("serviceWorker" in navigator)) {
    console.warn("Service workers are not supported.");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js",
      { scope: "/" }
    );

    console.log("Firebase service worker registered:", registration.scope);

    return registration;
  } catch (error) {
    console.error("Firebase service worker registration failed:", error);
    return null;
  }
}
