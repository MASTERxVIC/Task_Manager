import { supabase } from '../lib/supabaseClient';

// Real VAPID Public Key (Past generated key paste karein)
const VAPID_PUBLIC_KEY = 'BCdnuHtm-6G__RHN1_OKZGWYGRGVhMnnuPnIGe_r-DNsTsnw2LYvs0zdwkWEUiHBx4VtzaYUKt6At_t3pOvujkY';

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
  if (!userId) return false;

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    if (isUserClick) alert('Push notifications is browser me supported nahi hain.');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    
    if (permission === 'denied') {
      if (isUserClick) {
        alert('Notification permission blocked hai! Browser lock icon par click karke Allow karein.');
      }
      return false;
    }

    if (permission !== 'granted') return false;

    // Service worker setup
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    const convertedVapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);

    // Subscription Token generate
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey,
    });

    // Supabase DB Update
    const { error } = await supabase
      .from('profiles')
      .update({ push_subscription: JSON.stringify(subscription) })
      .eq('id', userId);

    if (error) {
      console.error('Subscription DB Update Error:', error);
      return false;
    }

    // Sirf tab alert dikhao jab user ne Button daba kar trigger kiya ho
    if (isUserClick) {
      alert('Notifications Successfully Enable Ho Gayi Hain! 🎉');
    }
    return true;

  } catch (error) {
    console.error('Permission Request or Subscription Failed:', error);
    return false;
  }
}

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