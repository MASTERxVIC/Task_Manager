import { supabase } from '../lib/supabaseClient';

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

// 2. Fetch Workspaces/Boards for User
export async function getWorkspaces() {
  const { data, error } = await supabase
    .from('boards')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error("Fetch Workspaces Error:", error.message);
    throw error;
  }
  return data || [];
}

// 3. Create Workspace
export async function createWorkspace(name, userId) {
  const inviteCode = generateInviteCode();
  
  // Insert Board (Custom dynamic workspace is_default = false by default)
  const { data: board, error: dbError } = await supabase
    .from('boards')
    .insert([{ name, created_by: userId, invite_code: inviteCode, is_default: false }])
    .select()
    .single();

  if (dbError) throw dbError;

  // Add Owner as Member
  const { error: memberError } = await supabase
    .from('board_members')
    .insert([{ board_id: board.id, user_id: userId, role: 'owner' }]);

  if (memberError) console.error("Error adding owner to members:", memberError.message);

  return board;
}

// 4. Join Workspace via Invite Code
export async function joinWorkspaceByCode(inviteCode, userId) {
  // Find Board
  const { data: board, error } = await supabase
    .from('boards')
    .select('id')
    .eq('invite_code', inviteCode.trim().toUpperCase())
    .single();

  if (error || !board) throw new Error("Invalid Invite Code");

  // Insert Member
  const { error: joinError } = await supabase
    .from('board_members')
    .upsert([{ board_id: board.id, user_id: userId, role: 'member' }]);

  if (joinError) throw joinError;

  return board.id;
}

// 5. Delete Workspace with Default Guard
export async function deleteWorkspace(boardId, isDefault) {
  // Strict Safety Guard: Default workspace delete request block karein
  if (isDefault) {
    throw new Error("Default workspace delete nahi kiya ja sakta!");
  }

  const { error } = await supabase
    .from('boards')
    .delete()
    .eq('id', boardId);

  if (error) {
    console.error("Delete Workspace Error:", error.message);
    throw error;
  }

  return true;
}