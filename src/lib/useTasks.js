import { useEffect, useMemo, useState } from 'react';
import { supabase } from './supabaseClient';
import { urgency } from './date';

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

  // 2. Fetch User Specific Tasks
  const fetchTasks = async (userId) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) console.error('Error fetching tasks:', error);
    else setTasks(data || []);
    setLoading(false);
  };

  // 3. Add Task (linked with user_id)
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

  const toggleTask = async (id) => {
    const currentTask = tasks.find((t) => t.id === id);
    if (!currentTask) return;

    const { error } = await supabase
      .from('todos')
      .update({ completed: !currentTask.completed })
      .eq('id', id);

    if (error) console.error('Error toggling task:', error);
    else {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: !currentTask.completed } : t))
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

  const counts = useMemo(() => {
    const c = { all: tasks.length, today: 0, upcoming: 0, completed: 0, overdue: 0 };
    tasks.forEach((t) => {
      const u = urgency(t);
      if (t.completed) c.completed += 1;
      else if (u === 'today') c.today += 1;
      else if (u === 'upcoming') c.upcoming += 1;
      else if (u === 'overdue') c.overdue += 1;
    });
    return c;
  }, [tasks]);

  return {
    user,
    tasks,
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