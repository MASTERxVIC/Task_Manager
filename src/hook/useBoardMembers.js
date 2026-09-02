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
      } else {
        setMembers(data || []);
      }
      setLoading(false);
    };

    fetchMembers();
  }, [boardId]);

  return { members, loading };
}