import { supabase } from '../lib/supabaseClient';
import { getDeviceId } from '../utils/deviceHelper';

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
 * Multi-Device Push Subscription Register/Update
 */
export async function enableNotifications(userId, isUserClick = false) {
  if (!userId) return false;

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    if (isUserClick) alert('Push notifications aapke browser me supported nahi hain.');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      if (isUserClick && permission === 'denied') {
        alert('Notification permission blocked hai! Browser lock icon se allow karein.');
      }
      return false;
    }

    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    const convertedVapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey,
    });

    const subJson = subscription.toJSON();
    const deviceId = getDeviceId();

    // Multi-device Table me Save/Upsert karein
    const { error } = await supabase
      .from('user_push_subscriptions')
      .upsert(
        {
          user_id: userId,
          device_id: deviceId,
          subscription: subJson,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id, device_id' }
      );

    if (error) {
      console.error('Multi-device token save error:', error.message);
      return false;
    }

    if (isUserClick) alert('Notifications Successfully Enabled on this Device! 🎉');
    return true;

  } catch (error) {
    console.error('Notification Error:', error);
    return false;
  }
}

export async function registerPushNotifications(userId) {
  return await enableNotifications(userId, false);
}

/**
 * Direct User / Multi-Device Push Invoker Function
 */
export async function sendWebPushToUser({ targetUserId, title, message, url = '/' }) {
  try {
    // User ke saare registered devices/tokens fetch karein
    const { data: subs, error } = await supabase
      .from('user_push_subscriptions')
      .select('subscription')
      .eq('user_id', targetUserId);

    if (error || !subs || subs.length === 0) return;

    // Har device par Push Notification Send karein
    for (const row of subs) {
      await supabase.functions.invoke('send-push', {
        body: {
          userSubscription: row.subscription,
          payload: { title, message, url },
        },
      });
    }
  } catch (err) {
    console.error('Push Send Error:', err);
  }
}

/**
 * ACTION NOTIFICATION: ADD, EDIT, DELETE Data Update Trigger
 * @param {Object} params
 * @param {'ADD'|'EDIT'|'DELETE'} params.action - Operation performed
 * @param {string} params.itemTitle - Item/Data Name
 * @param {Array} params.targetUserIds - List of User IDs who should receive notification
 * @param {string} params.actorName - Performing User ka Name (e.g., "Atul Kumar")
 * @param {string} [params.currentUserId] - Action perform karne wale user ki ID (taki use khud notification na jaye)
 */
export async function notifyDataChange({ action, itemTitle, targetUserIds = [], actorName = 'A user', currentUserId = null, url = '/' }) {
  if (!targetUserIds || targetUserIds.length === 0) return;

  // Sender/Actor ko target list se filter out kar dete hain taaki use apni notification khud na aaye
  const filteredUserIds = currentUserId 
    ? targetUserIds.filter(id => id !== currentUserId) 
    : targetUserIds;

  if (filteredUserIds.length === 0) return;

  let title = '📢 Data Update';
  let message = `${actorName} performed an action on "${itemTitle}"`;

  if (action === 'ADD') {
    title = '➕ New Item Created';
    message = `${actorName} ne naya item create kiya: "${itemTitle}"`;
  } else if (action === 'EDIT') {
    title = '✏️ Item Updated';
    message = `${actorName} ne item update kiya: "${itemTitle}"`;
  } else if (action === 'DELETE') {
    title = '🗑️ Item Deleted';
    message = `${actorName} ne item delete kar diya: "${itemTitle}"`;
  }

  // Sirf baaki ke filtered users ko Multi-Device Push Bhejein
  filteredUserIds.forEach((targetUserId) => {
    sendWebPushToUser({
      targetUserId,
      title,
      message,
      url,
    });
  });
}

/**
 * MENTIONS NOTIFICATION: @UserName Mention Notification Trigger
 */
export async function checkAndSendMentions({ text, itemTitle, boardMembers = [], currentUserId, actorName = 'Someone' }) {
  if (!text || !text.includes('@')) return;

  const matches = text.match(/@(\w+)/g);
  if (!matches) return;

  const mentionedUsernames = matches.map((m) => m.substring(1).toLowerCase());

  boardMembers.forEach((member) => {
    const fullName = (member.full_name || '').toLowerCase();
    const email = (member.email || '').toLowerCase();

    // Check karein ki Mentioned Name se Match hota h ya nahi
    const isMentioned = mentionedUsernames.some(
      (u) => fullName.includes(u) || email.includes(u)
    );

    // Sender ko mention karne par bhi notification nahi jayegi (member.id !== currentUserId)
    if (isMentioned && member.id !== currentUserId) {
      sendWebPushToUser({
        targetUserId: member.id,
        title: '🚨 Mentioned You!',
        message: `${actorName} ne aapko "${itemTitle}" me mention kiya.`,
      });
    }
  });
}