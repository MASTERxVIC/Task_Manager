import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient'; 

export function useRealtimeTasks(dashboardId) {
  const [tasks, setTasks] = useState([]);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (!dashboardId) return;

    // Fetch initial tasks
    const fetchTasks = async () => {
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('dashboard_id', dashboardId);
      if (data) setTasks(data);
    };

    fetchTasks();

    // Listen to real-time changes
    const channel = supabase
      .channel(`dashboard-${dashboardId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `dashboard_id=eq.${dashboardId}` },
        (payload) => {
          fetchTasks(); // Reload tasks

          // Real-time Notification logic
          if (payload.eventType === 'INSERT') {
            setNotification(`New task added: "${payload.new.title}"`);
          } else if (payload.eventType === 'DELETE') {
            setNotification(`A task was deleted`);
          } else if (payload.eventType === 'UPDATE') {
            setNotification(`Task state updated`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dashboardId]);

  return { tasks, notification };
}