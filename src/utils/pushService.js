import { supabase } from "../lib/supabaseClient";
import { getDeviceId } from "../utils/deviceHelper";

const VAPID_PUBLIC_KEY =
  "BCdnuHtm-6G__RHN1_OKZGWYGRGVhMnnuPnIGe_r-DNsTsnw2LYvs0zdwkWEUiHBx4VtzaYUKt6At_t3pOvujkY";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Multi-Device Push Subscription Register/Update
 */
export async function enableNotifications(userId, isUserClick = false) {
  if (!userId) return false;

  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    if (isUserClick)
      alert("Push notifications are not supported in your browser.");
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      if (isUserClick && permission === "denied") {
        alert(
          "Notification Permission Blocked\nPlease enable notifications from the browser lock icon.",
        );
      }
      return false;
    }

    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    const convertedVapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey,
    });

    const subJson = subscription.toJSON();
    const deviceId = getDeviceId();

    const { error } = await supabase.from("user_push_subscriptions").upsert(
      {
        user_id: userId,
        device_id: deviceId,
        subscription: subJson,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id, device_id" },
    );

    if (error) {
      console.error("Multi-device token save error:", error.message);
      return false;
    }

    if (isUserClick) alert("Notifications Enabled Successfully");
    return true;
  } catch (error) {
    console.error("Notification Error:", error);
    return false;
  }
}

export async function registerPushNotifications(userId) {
  return await enableNotifications(userId, false);
}

/**
 * Batch Push Invoker Function (Edge Function ke through RLS bypass karega)
 */
export async function sendWebPushToUsers({
  targetUserIds,
  title,
  message,
  url = "/",
}) {
  if (!targetUserIds || targetUserIds.length === 0) return;

  try {
    const { data, error } = await supabase.functions.invoke("send-push", {
      body: {
        targetUserIds,
        payload: { title, message, url },
      },
    });

    if (error) {
      console.error("Edge Function Invoke Error:", error);
    } else {
      console.log("Push Success Response:", data);
    }
  } catch (err) {
    console.error("Push Send Exception:", err);
  }
}

/**
 * ACTION NOTIFICATION: ADD, EDIT, DELETE Data Update Trigger
 */
export async function notifyDataChange({
  action,
  itemTitle,
  targetUserIds = [],
  actorName = "A user",
  currentUserId = null,
  url = "/",
}) {
  if (!targetUserIds || targetUserIds.length === 0) return;

  const filteredUserIds = currentUserId
    ? targetUserIds.filter((id) => id !== currentUserId)
    : targetUserIds;

  if (filteredUserIds.length === 0) return;

  let title = "Data Update";
  let message = `${actorName} performed an action on "${itemTitle}"`;

  if (action === "ADD") {
    title = "New Task Added";
    message = `${actorName} created a new task: "${itemTitle}"`;
  } else if (action === "EDIT") {
    title = "Task Updated";
    message = `${actorName} updated the task: "${itemTitle}"`;
  } else if (action === "DELETE") {
    title = "Task Deleted";
    message = `${actorName} deleted the task: "${itemTitle}"`;
  }

  await sendWebPushToUsers({
    targetUserIds: filteredUserIds,
    title,
    message,
    url,
  });
}

/**
 * MENTIONS NOTIFICATION: @UserName Mention Notification Trigger
 */
export async function checkAndSendMentions({
  text,
  itemTitle,
  boardMembers = [],
  currentUserId,
  actorName = "Someone",
}) {
  if (!text || !text.includes("@")) return;

  const matches = text.match(/@(\w+)/g);
  if (!matches) return;

  const mentionedUsernames = matches.map((m) => m.substring(1).toLowerCase());
  const targetUserIds = [];

  boardMembers.forEach((member) => {
    const fullName = (member.full_name || "").toLowerCase();
    const email = (member.email || "").toLowerCase();

    const isMentioned = mentionedUsernames.some(
      (u) => fullName.includes(u) || email.includes(u),
    );

    if (isMentioned && member.id !== currentUserId) {
      targetUserIds.push(member.id);
    }
  });

  if (targetUserIds.length > 0) {
    await sendWebPushToUsers({
      targetUserIds,
      title: "New Mention",
      message: `${actorName} mentioned you in "${itemTitle}"`,
    });
  }
}
