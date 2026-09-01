import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { supabase } from './supabaseClient';
import { broadcastToBoard, checkAndSendMentions } from '../utils/pushService';
import { urgency } from './date';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function useTasks(boardId = null, boardMembers = []) {
  const [tasks, setTasks] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef(null);

  // DUPLICATE PREVENTER: Log deduplication tracker
  const lastLoggedRef = useRef({ key: '', timestamp: 0 });

  // Helper: Expired completed tasks locally filter karne ke liye
  const filterValidTasks = useCallback((taskList) => {
    const now = Date.now();
    return taskList.filter((t) => {
      if (!t.completed || !t.completed_at) return true;
      const age = now - new Date(t.completed_at).getTime();
      return age < SEVEN_DAYS_MS;
    });
  }, []);

  const logActivity = useCallback(async ({ actionType, todoId, taskTitle, details = {} }) => {
    if (!user || !boardId) return;

    // PREVENT DUPLICATES: Check if identical action logged in last 1000ms
    const logKey = `${actionType}_${todoId}`;
    const now = Date.now();
    if (
      lastLoggedRef.current.key === logKey &&
      now - lastLoggedRef.current.timestamp < 1000
    ) {
      console.log('Duplicate Activity Log Prevented:', logKey);
      return;
    }

    lastLoggedRef.current = { key: logKey, timestamp: now };

    try {
      // Board details check
      const { data: boardData, error: boardError } = await supabase
        .from('boards')
        .select('is_default, name')
        .eq('id', boardId)
        .maybeSingle();

      if (boardError) {
        console.error('Board check error for logging:', boardError);
        return;
      }

      // Default board condition check
      if (boardData && (boardData.is_default || boardData.name?.toLowerCase() === 'default')) {
        return;
      }

      // Insert Log Record
      const { data, error } = await supabase.from('activity_logs').insert([{
        board_id: boardId,
        todo_id: String(todoId),
        user_id: user.id,
        action_type: actionType,
        task_title: taskTitle,
        details: details
      }]).select();

      if (error) {
        console.error('Supabase Activity Log Insert Error:', error);
      } else {
        console.log('Activity Log Created Successfully:', data);
      }
    } catch (err) {
      console.error('Failed to write activity log:', err);
    }
  }, [user, boardId]);

  // 1. Fetch Board Specific or User Specific Tasks
  const fetchTasks = useCallback(async (userId, currentBoardId = null) => {
    setTasks([]);
    setLoading(true);
    try {
      let query = supabase.from('todos').select('*');

      if (currentBoardId) {
        query = query.eq('board_id', currentBoardId);
      } else {
        query = query.eq('user_id', userId).is('board_id', null);
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

  // 2. Cleanup Routine
  const cleanupOldTasks = useCallback(async (userId) => {
    try {
      const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS).toISOString();
      await supabase
        .from('todos')
        .delete()
        .eq('user_id', userId)
        .eq('completed', true)
        .lt('completed_at', sevenDaysAgo);
    } catch (err) {
      console.error('Cleanup tasks exception:', err);
    }
  }, []);

  // 3. Realtime Listener
  const setupRealtime = useCallback((userId, currentBoardId = null) => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channelName = currentBoardId ? `rt-todos-board-${currentBoardId}` : `rt-todos-default-${userId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'todos' },
        (payload) => {
          const { eventType, new: newRow, old: oldRow } = payload;

          if (eventType === 'INSERT') {
            const matchesBoard = currentBoardId 
              ? newRow.board_id === currentBoardId 
              : (!newRow.board_id && newRow.user_id === userId);

            if (matchesBoard) {
              setTasks((prev) => {
                const exists = prev.some((t) => t.id === newRow.id);
                if (exists) return prev;
                return filterValidTasks([newRow, ...prev]);
              });
            }
          } 
          else if (eventType === 'UPDATE') {
            setTasks((prev) => 
              filterValidTasks(
                prev.map((t) => (t.id === newRow.id ? { ...t, ...newRow } : t))
              )
            );
          } 
          else if (eventType === 'DELETE') {
            setTasks((prev) => prev.filter((t) => t.id !== oldRow.id));
          }
        }
      )
      .subscribe();

    channelRef.current = channel;
  }, [filterValidTasks]);

  // 4. Auth Session & Active Board Change Effect
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!isMounted) return;

      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await cleanupOldTasks(currentUser.id);
        fetchTasks(currentUser.id, boardId);
        setupRealtime(currentUser.id, boardId);
      } else {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;

      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (event === 'SIGNED_IN' && currentUser) {
        fetchTasks(currentUser.id, boardId);
        setupRealtime(currentUser.id, boardId);
      } else if (event === 'SIGNED_OUT') {
        setTasks([]);
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [boardId, fetchTasks, setupRealtime, cleanupOldTasks]);

  // 5. Add Task (Integrated Push Triggers)
  const addTask = async ({ task, des, deadline, priority, board_id = null }) => {
    if (!user) return;
    const newTaskId = crypto.randomUUID();
    const targetBoardId = board_id || boardId || null;
    
    const newTask = {
      id: newTaskId,
      user_id: user.id,
      board_id: targetBoardId,
      task,
      des,
      deadline,
      priority: priority || 'normal',
      completed: false,
      completed_at: null,
    };

    const { data, error } = await supabase.from('todos').insert([newTask]).select().single();
    if (!error && data) {
      setTasks((prev) => [data, ...prev]);
      
      await logActivity({
        actionType: 'CREATED',
        todoId: data.id,
        taskTitle: task
      });

      // --- PUSH NOTIFICATIONS ---
      if (targetBoardId && boardMembers.length > 0) {
        // 1. Broadcast push to all active board members
        broadcastToBoard({
          boardMembers,
          currentUserId: user.id,
          title: '📝 New Task Added',
          message: `${user.email?.split('@')[0] || 'Member'} ne naya task add kiya: "${task}"`
        });

        // 2. Mention Push (Agar task title ya description me @user hai)
        checkAndSendMentions({
          text: `${task} ${des || ''}`,
          taskTitle: task,
          boardMembers,
          currentUserId: user.id
        });
      }
    }
  };

  // 6. Update Task (Integrated Push Triggers)
  const updateTask = async (id, patch) => {
    const currentTask = tasks.find((t) => t.id === id);
    const { image, ...validPatch } = patch;

    const { error } = await supabase.from('todos').update(validPatch).eq('id', id);
    if (!error) {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
      
      const taskName = patch.task || currentTask?.task || 'Task';

      await logActivity({
        actionType: 'UPDATED',
        todoId: id,
        taskTitle: taskName,
        details: patch
      });

      // --- PUSH NOTIFICATIONS ---
      if (boardId && boardMembers.length > 0) {
        broadcastToBoard({
          boardMembers,
          currentUserId: user.id,
          title: '✏️ Task Updated',
          message: `${user.email?.split('@')[0] || 'Member'} ne task "${taskName}" update kiya hai.`
        });

        const updatedText = `${patch.task || ''} ${patch.des || ''}`;
        checkAndSendMentions({
          text: updatedText,
          taskTitle: taskName,
          boardMembers,
          currentUserId: user.id
        });
      }
    }
  };

  // 7. Toggle Task (Integrated Push Triggers)
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
      
      const actionName = nextCompleted ? 'COMPLETED' : 'UNDO';
      
      await logActivity({
        actionType: actionName,
        todoId: id,
        taskTitle: currentTask.task || 'Unknown Task',
        details: { completed: nextCompleted }
      });

      // --- PUSH NOTIFICATIONS ---
      if (boardId && boardMembers.length > 0) {
        broadcastToBoard({
          boardMembers,
          currentUserId: user.id,
          title: nextCompleted ? '✅ Task Completed' : '↩️ Task Reopened',
          message: `${user.email?.split('@')[0] || 'Member'} ne task "${currentTask.task}" ko ${nextCompleted ? 'complete' : 'reopen'} kar diya.`
        });
      }
    }
  };

  // 8. Delete Task (Integrated Push Triggers)
  const deleteTask = async (id) => {
    const taskToDelete = tasks.find((t) => t.id === id);

    const { error } = await supabase.from('todos').delete().eq('id', id);
    if (!error) {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      
      await logActivity({
        actionType: 'DELETED',
        todoId: id,
        taskTitle: taskToDelete?.task || 'Unknown Task'
      });

      // --- PUSH NOTIFICATIONS ---
      if (boardId && boardMembers.length > 0) {
        broadcastToBoard({
          boardMembers,
          currentUserId: user.id,
          title: '🗑️ Task Deleted',
          message: `${user.email?.split('@')[0] || 'Member'} ne task "${taskToDelete?.task || 'Unknown'}" delete kar diya.`
        });
      }
    }
  };

  const clearAll = async () => {
    if (!user) return;
    let query = supabase.from('todos').delete();
    if (boardId) {
      query = query.eq('board_id', boardId);
    } else {
      query = query.eq('user_id', user.id).is('board_id', null);
    }

    const { error } = await query;
    if (error) console.error('Error clearing tasks:', error);
    else setTasks([]);
  };

  const clearCompleted = async () => {
    if (!user) return;
    let query = supabase.from('todos').delete().eq('completed', true);
    if (boardId) {
      query = query.eq('board_id', boardId);
    } else {
      query = query.eq('user_id', user.id).is('board_id', null);
    }

    const { error } = await query;
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
    refetchTasks: () => user && fetchTasks(user.id, boardId),
  };
}