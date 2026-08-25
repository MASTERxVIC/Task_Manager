import { supabase } from '../lib/supabase';

// 1. Google Auth Login
export async function loginWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  });
  if (error) console.error("Login Error:", error.message);
}

// Helper: Invite code generator (e.g. TASK-8921)
function generateInviteCode() {
  return "TASK-" + Math.random().toString(36).substring(2, 6).toUpperCase();
}

// 2. Create Workspace
export async function createWorkspace(title, userId) {
  const inviteCode = generateInviteCode();
  
  // Insert Dashboard
  const { data: dashboard, error: dbError } = await supabase
    .from('dashboards')
    .insert([{ title, owner_id: userId, invite_code: inviteCode }])
    .select()
    .single();

  if (dbError) throw dbError;

  // Add Owner as Member
  await supabase
    .from('dashboard_members')
    .insert([{ dashboard_id: dashboard.id, user_id: userId, role: 'OWNER' }]);

  return dashboard;
}

// 3. Join Workspace via Invite Code
export async function joinWorkspaceByCode(inviteCode, userId) {
  // Find Dashboard
  const { data: dashboard, error } = await supabase
    .from('dashboards')
    .select('id')
    .eq('invite_code', inviteCode.trim().toUpperCase())
    .single();

  if (error || !dashboard) throw new Error("Invalid Invite Code");

  // Insert Member
  const { error: joinError } = await supabase
    .from('dashboard_members')
    .upsert([{ dashboard_id: dashboard.id, user_id: userId, role: 'MEMBER' }]);

  if (joinError) throw joinError;

  return dashboard.id;
}