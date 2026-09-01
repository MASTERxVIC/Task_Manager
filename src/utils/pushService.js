import { supabase } from '../lib/supabaseClient';

// Public VAPID Key ko yahan set karein (ya env file se import karein)
const VAPID_PUBLIC_KEY = 'BCdnuHtm-6G__RHN1_OKZGWYGRGVhMnnuPnIGe_r-DNsTsnw2LYvs0zdwkWEUiHBx4VtzaYUKt6At_t3pOvujkY';

/**
 * Helper function to convert base64url string to Uint8Array required by PushManager
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
 * A. User Gesture / Click se invoke hone wala Push Notification Setup Function
 */
export async function enableNotifications(userId) {
  if (!userId) {
    console.warn('User ID missing for enabling push notifications.');
    return false;
  }

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    alert('Push notifications is browser me supported nahi hain.');
    return false;
  }

  try {
    // 1. Explicit User Interaction par permission demand
    const permission = await Notification.requestPermission();
    
    if (permission === 'denied') {
      alert('Notification permission blocked hai! URL bar ke lock icon par click karke Allow karein.');
      return false;
    }

    if (permission !== 'granted') {
      console.warn('Notification permission not granted.');
      return false;
    }

    // 2. Service Worker Ready / Register
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    // 3. Converting VAPID key to Uint8Array buffer to prevent InvalidCharacterError
    const convertedVapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);

    // 4. Subscription Generate
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey,
    });

    // 5. Supabase Profiles table Update
    const { error } = await supabase
      .from('profiles')
      .update({ push_subscription: JSON.stringify(subscription) })
      .eq('id', userId);

    if (error) {
      console.error('Subscription DB Update Error:', error);
      return false;
    }

    alert('Notifications Successfully Enable Ho Gayi Hain! 🎉');
    console.log('Push Notifications Enabled Successfully!');
    return true;

  } catch (error) {
    console.error('Permission Request or Subscription Failed:', error);
    return false;
  }
}

/**
 * Backward Compatibility Wrapper
 */
export async function registerPushNotifications(userId) {
  return await enableNotifications(userId);
}

/**
 * B. Single User ko Edge Function se push bhejna
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
 * C. BROADCAST: Board Members ko Push Bhejna
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
 * D. MENTIONS: Text me @User parse karke push bhejna
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