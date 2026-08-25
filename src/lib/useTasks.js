import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { supabase } from './supabaseClient';
import { urgency } from './date';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function useTasks() {
  const [tasks, setTasks] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef(null);

  // Clean Expired Tasks from local state
  const filterValidTasks = useCallback((taskList) => {
    const now = Date.now();
    return taskList.filter((t) => {
      if (!t.completed || !t.completed_at) return true;
      const age = now - new Date(t.completed_at).getTime();
      return age < SEVEN_DAYS_MS;
    });
  }, []);

  // 1. Fetch User Specific Tasks + Joined Board Tasks
  const fetchTasks = useCallback(async (userId) => {
    setLoading(true);

    try {
      // Step A: Auto delete >7 days completed tasks in DB
      const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS).toISOString();
      await supabase
        .from('todos')
        .delete()
        .eq('user_id', userId)
        .eq('completed', true)
        .lt('completed_at', sevenDaysAgo);

      // Step B: Get all board IDs user is a member of
      const { data: boardMemberships } = await supabase
        .from('board_members')
        .select('board_id')
        .eq('user_id', userId);

      const joinedBoardIds = boardMemberships ? boardMemberships.map((b) => b.board_id) : [];

      // Step C: Fetch tasks created by user OR belonging to user's joined boards
      let query = supabase.from('todos').select('*');

      if (joinedBoardIds.length > 0) {
        query = query.or(`user_id.eq.${userId},board_id.in.(${joinedBoardIds.join(',')})`);
      } else {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tasks:', error);
      } else {
        setTasks(filterValidTasks(data || []));
      }
    } catch (err) {
      console.error('Fetch tasks exception:', err);
    } finally {
      setLoading(false);
    }
  }, [filterValidTasks]);

  // 2. Setup Safe Realtime Listener
  const setupRealtime = useCallback((userId) => {
    // Agar active channel exist karta hai to pehle safely remove karein
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // New unique channel per user session
    const channel = supabase
      .channel(`rt-todos-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'todos' },
        () => {
          fetchTasks(userId);
        }
      );

    // .on() ke bad hi .subscribe() execute hoga
    channel.subscribe();
    channelRef.current = channel;
  }, [fetchTasks]);

  // 3. Auth Session Listener & Realtime Sync Setup
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        fetchTasks(currentUser.id);
        setupRealtime(currentUser.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        fetchTasks(currentUser.id);
        setupRealtime(currentUser.id);
      } else {
        setTasks([]);
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [fetchTasks, setupRealtime]);

  // 4. Add Task (Supabase DB UUID default set karega)
  const addTask = async ({ task, des, deadline, priority, board_id = null }) => {
    if (!user) return;
    const newTask = {
      user_id: user.id,
      board_id,
      task,
      des,
      deadline,
      priority: priority || 'normal',
      completed: false,
      completed_at: null,
    };

    const { data, error } = await supabase.from('todos').insert([newTask]).select().single();
    if (error) {
      console.error('Error adding task:', error);
    } else if (data) {
      setTasks((prev) => [data, ...prev]);
    }
  };

  // 5. Update Task
  const updateTask = async (id, patch) => {
    const { error } = await supabase.from('todos').update(patch).eq('id', id);
    if (error) console.error('Error updating task:', error);
    else setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  // 6. Delete Task
  const deleteTask = async (id) => {
    const { error } = await supabase.from('todos').delete().eq('id', id);
    if (error) console.error('Error deleting task:', error);
    else setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  // 7. Toggle Task
  const toggleTask = async (id) => {
    const currentTask = tasks.find((t) => t.id === id);
    if (!currentTask) return;

    const nextCompleted = !currentTask.completed;
    const completedAt = nextCompleted ? new Date().toISOString() : null;

    const { error } = await supabase
      .from('todos')
      .update({ completed: nextCompleted, completed_at: completedAt })
      .eq('id', id);

    if (error) {
      console.error('Error toggling task:', error);
    } else {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, completed: nextCompleted, completed_at: completedAt } : t
        )
      );
    }
  };

  // 8. Clear All Tasks
  const clearAll = async () => {
    if (!user) return;
    const { error } = await supabase.from('todos').delete().eq('user_id', user.id);
    if (error) console.error('Error clearing tasks:', error);
    else setTasks([]);
  };

  // 9. Clear Completed Tasks
  const clearCompleted = async () => {
    if (!user) return;
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('user_id', user.id)
      .eq('completed', true);

    if (error) console.error('Error clearing completed tasks:', error);
    else setTasks((prev) => prev.filter((t) => !t.completed));
  };

  const logout = () => supabase.auth.signOut();

  const validTasks = useMemo(() => filterValidTasks(tasks), [tasks, filterValidTasks]);

  const counts = useMemo(() => {
    const c = { all: validTasks.length, today: 0, upcoming: 0, completed: 0, overdue: 0 };
    validTasks.forEach((t) => {
      const u = urgency(t);
      if (t.completed) c.completed += 1;
      else if (u === 'today') c.today += 1;
      else if (u === 'upcoming') c.upcoming += 1;
      else if (u === 'overdue') c.overdue += 1;
    });
    return c;
  }, [validTasks]);

  return {
    user,
    tasks: validTasks,
    loading,
    addTask,
    updateTask,
    deleteTask,
    toggleTask,
    clearAll,
    clearCompleted,
    logout,
    counts,
    refetchTasks: () => user && fetchTasks(user.id),
  };
}