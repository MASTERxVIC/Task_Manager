import { supabase } from '../lib/supabaseClient';

// Real VAPID Public Key
const VAPID_PUBLIC_KEY = 'BCdnuHtm-6G__RHN1_OKZGWYGRGVhMnnuPnIGe_r-DNsTsnw2LYvs0zdwkWEUiHBx4VtzaYUKt6At_t3pOvujkY';

/**
 * Base64 VAPID Key Helper Function
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Push Notification Enable Function
 * @param {string} userId - Current logged in user ID
 * @param {boolean} isUserClick - Manual button click check (Alerts control ke liye)
 */
export async function enableNotifications(userId, isUserClick = false) {
  console.log("👉 Step 1: Triggered for User ID:", userId);

  if (!userId) {
    console.error("❌ User ID missing hai!");
    if (isUserClick) alert("User ID missing hai. Kripya reload karke try karein.");
    return false;
  }

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    if (isUserClick) alert('Push notifications aapke browser me supported nahi hain.');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    console.log("👉 Step 2: Permission Status:", permission);

    if (permission === 'denied') {
      if (isUserClick) {
        alert('Notification permission blocked hai! Browser lock icon par click karke Allow karein.');
      }
      return false;
    }

    if (permission !== 'granted') return false;

    // Service Worker Registration
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
    console.log("👉 Step 3: Service Worker Ready!");

    const convertedVapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);

    // Push Subscription Generation
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey,
    });

    // Native PushSubscription ko plain JSON object me map karna
    const subJson = subscription.toJSON();
    console.log("👉 Step 4: Generated Push Subscription Object:", subJson);

    // Supabase DB Update
    const { data, error } = await supabase
      .from('profiles')
      .update({ push_subscription: subJson })
      .eq('id', userId)
      .select();

    if (error) {
      console.error("❌ Step 5: Supabase DB Update Failed:", error.message);
      if (isUserClick) alert('Database update error: ' + error.message);
      return false;
    }

    console.log("✅ Step 6: DB update success:", data);
    if (isUserClick) {
      alert('Notifications Successfully Enable Ho Gayi Hain! 🎉');
    }
    return true;

  } catch (error) {
    console.error('❌ Notification Enabling Error:', error);
    if (isUserClick) alert('Error: ' + error.message);
    return false;
  }
}

/**
 * Auto-Register Function
 */
export async function registerPushNotifications(userId) {
  return await enableNotifications(userId, false);
}

/**
 * Single User ko Push Bhejna
 */
export async function sendWebPush({ targetUserId, title, message, url = '/' }) {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('push_subscription')
      .eq('id', targetUserId)
      .maybeSingle();

    if (error || !profile || !profile.push_subscription) return;

    const subscriptionObj = typeof profile.push_subscription === 'string' 
      ? JSON.parse(profile.push_subscription) 
      : profile.push_subscription;

    await supabase.functions.invoke('send-push', {
      body: {
        userSubscription: subscriptionObj,
        payload: { title, message, url },
      },
    });
  } catch (err) {
    console.error('Push Invoke Error:', err);
  }
}

/**
 * BROADCAST: Board Members ko Push Bhejna
 */
export async function broadcastToBoard({ boardMembers = [], currentUserId, title, message }) {
  if (!boardMembers || boardMembers.length === 0) return;

  const otherMembers = boardMembers.filter((m) => m.id !== currentUserId);

  otherMembers.forEach((member) => {
    sendWebPush({
      targetUserId: member.id,
      title: title || '📢 Board Activity',
      message: message,
    });
  });
}

/**
 * MENTIONS: Text me @User parse karke push bhejna
 */
export async function checkAndSendMentions({ text, taskTitle, boardMembers = [], currentUserId }) {
  if (!text || !text.includes('@')) return;

  const matches = text.match(/@(\w+)/g);
  if (!matches) return;

  const usernames = matches.map((m) => m.substring(1).toLowerCase());

  boardMembers.forEach((member) => {
    const name = (member.full_name || member.email || '').toLowerCase();
    const isMentioned = usernames.some((u) => name.includes(u));

    if (isMentioned && member.id !== currentUserId) {
      sendWebPush({
        targetUserId: member.id,
        title: '🚨 Mentioned You!',
        message: `Aapko task "${taskTitle}" me mention kiya gaya hai.`,
      });
    }
  });
}