// Web Push VAPID Helpers & Subscription Utils

export function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeUserToPush() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;

  try {
    const registration = await navigator.serviceWorker.ready;
    const existingSubscription = await registration.pushManager.getSubscription();

    if (existingSubscription) {
      return existingSubscription;
    }

    // Default VAPID Public Key for web push registration
    const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 
      "BEl62iUYgUivxIkv69yViEuiBIa-m9GYvZksDVkU18kM5N5oGg-28lM50w47VzQ43y1xG0l3b1r0yG9v54h42V0=";

    const convertedVapidKey = urlBase64ToUint8Array(publicVapidKey);

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey,
    });

    // Save subscription to backend
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription),
    });

    return subscription;
  } catch (error) {
    console.error("Failed to subscribe to Web Push:", error);
    return null;
  }
}
