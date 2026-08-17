import { useEffect, useMemo, useState } from 'react';
import { supabase } from './supabaseClient';
import { urgency } from './date';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useTasks() {
  const [tasks, setTasks] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Session check and auth status listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchTasks(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) fetchTasks(currentUser.id);
      else {
        setTasks([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Filter 7 days expired tasks from local state
  const filterValidTasks = (taskList) => {
    const now = Date.now();
    return taskList.filter((t) => {
      if (!t.completed || !t.completed_at) return true;
      const age = now - new Date(t.completed_at).getTime();
      return age < SEVEN_DAYS_MS;
    });
  };

  // 2. Fetch User Specific Tasks + Clean Expired Tasks from Supabase DB
  const fetchTasks = async (userId) => {
    setLoading(true);

    // Auto delete >7 days completed tasks in DB
    const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS).toISOString();
    await supabase
      .from('todos')
      .delete()
      .eq('user_id', userId)
      .eq('completed', true)
      .lt('completed_at', sevenDaysAgo);

    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
    } else {
      setTasks(filterValidTasks(data || []));
    }
    setLoading(false);
  };

  // 3. Add Task
  const addTask = async ({ task, des, deadline, priority }) => {
    if (!user) return;
    const newTask = {
      id: makeId(),
      user_id: user.id,
      task,
      des,
      deadline,
      priority: priority || 'normal',
      completed: false,
      completed_at: null,
    };

    const { error } = await supabase.from('todos').insert([newTask]);
    if (error) console.error('Error adding task:', error);
    else setTasks((prev) => [newTask, ...prev]);
  };

  const updateTask = async (id, patch) => {
    const { error } = await supabase.from('todos').update(patch).eq('id', id);
    if (error) console.error('Error updating task:', error);
    else setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const deleteTask = async (id) => {
    const { error } = await supabase.from('todos').delete().eq('id', id);
    if (error) console.error('Error deleting task:', error);
    else setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  // 4. Toggle Task (completed_at date capture)
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

  const clearAll = async () => {
    if (!user) return;
    const { error } = await supabase.from('todos').delete().eq('user_id', user.id);
    if (error) console.error('Error clearing tasks:', error);
    else setTasks([]);
  };

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

  const validTasks = useMemo(() => filterValidTasks(tasks), [tasks]);

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
  };
}