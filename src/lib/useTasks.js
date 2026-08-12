import { useEffect, useMemo, useState } from 'react';
import { urgency } from './date';

const STORAGE_KEY = 'todo-modern-tasks';

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useTasks() {
  const [tasks, setTasks] = useState(loadTasks);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const addTask = ({ task, des, deadline, priority }) => {
    setTasks((prev) => [
      ...prev,
      { id: makeId(), task, des, deadline, priority: priority || 'normal', completed: false },
    ]);
  };

  const updateTask = (id, patch) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const deleteTask = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const toggleTask = (id) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const clearAll = () => setTasks([]);
  const clearCompleted = () => setTasks((prev) => prev.filter((t) => !t.completed));

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

  return { tasks, addTask, updateTask, deleteTask, toggleTask, clearAll, clearCompleted, counts };
}
