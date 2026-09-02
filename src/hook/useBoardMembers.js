import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useBoardMembers(boardId) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!boardId) {
      setMembers([]);
      return;
    }

    const fetchMembers = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("board_members")
        .select(`
          user_id,
          role,
          profiles:user_id (id, full_name, email)
        `)
        .eq("board_id", boardId);

      if (error) {
        console.error("Error fetching board members:", error);
        setMembers([]);
      } else {
        // Clean and format the data
        const formatted = (data || []).map((m) => ({
          id: m.profiles?.id || m.user_id,
          full_name: m.profiles?.full_name || '',
          email: m.profiles?.email || '',
          role: m.role
        }));
        setMembers(formatted);
      }
      setLoading(false);
    };

    fetchMembers();
  }, [boardId]);

  const rawMembers = members; // keep it simple
  return { members: rawMembers, loading };
}