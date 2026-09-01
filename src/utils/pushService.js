import { supabase } from '../lib/supabaseClient';

// A. App initial setup: User ko push notification ke liye subscribe karana
export async function registerPushNotifications(userId) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') return;

    // Browser Push Token generate karein
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: 'YOUR_PUBLIC_VAPID_KEY' // Step 1 me mili Public VAPID Key
    });

    // Token profiles table me save karein
    await supabase.from('profiles').update({
      push_subscription: JSON.stringify(subscription)
    }).eq('id', userId);

  } catch (error) {
    console.error('Push Registration Error:', error);
  }
}

// B. Single User ko Edge Function se push bhejna
export async function sendWebPush({ targetUserId, title, message, url = '/' }) {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('push_subscription')
      .eq('id', targetUserId)
      .maybeSingle();

    if (!profile || !profile.push_subscription) return;

    const subscriptionObj = JSON.parse(profile.push_subscription);

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

// C. BROADCAST: Board Members ko Push Bhejna
export async function broadcastToBoard({ boardMembers = [], currentUserId, title, message }) {
  const otherMembers = boardMembers.filter((m) => m.id !== currentUserId);

  otherMembers.forEach((member) => {
    sendWebPush({
      targetUserId: member.id,
      title: title || '📢 Board Activity',
      message: message,
    });
  });
}

// D. MENTIONS: Text me @User parse karke push bhejna
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