import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useTodos = (activeBoardId) => {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);

  // 0. FETCH TODOS (With Strict Board Isolation Guard)
  const fetchTodos = useCallback(async () => {
    // Race Condition Guard: Jab tak board state pass/resolve na ho, execution hold rakhein
    if (activeBoardId === undefined) return;

    setLoading(true);
    try {
      let query = supabase.from('todos').select('*');

      // Filter by Active Board Context
      if (activeBoardId) {
        query = query.eq('board_id', activeBoardId);
      } else {
        // Default Workspace Logic: Fetch only default tasks (where board_id is null)
        query = query.is('board_id', null);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching todos:', error.message);
      } else {
        setTodos(data || []);
      }
    } catch (err) {
      console.error('Fetch execution error:', err);
    } finally {
      setLoading(false);
    }
  }, [activeBoardId]);

  // Board switch hote hi purane state ko instantly clear karo
  useEffect(() => {
    setTodos([]);
    fetchTodos();
  }, [activeBoardId, fetchTodos]);

  // Helper to insert log (Default vs Custom board handles gracefully)
  const logActivity = async ({ boardId, userId, todoId, actionType, taskTitle, details = {} }) => {
    if (!boardId || !userId) {
      console.warn('Activity log skipped: boardId or userId is missing.', { boardId, userId });
      return;
    }

    try {
      // Clean safe payload
      const payload = {
        board_id: boardId,
        user_id: userId,
        todo_id: todoId || null, // Handle null if task is deleted
        action_type: actionType,
        task_title: taskTitle,
        details: details,
      };

      const { error } = await supabase.from('activity_logs').insert([payload]);

      if (error) {
        console.error('Failed to log activity:', error.message);
      }
    } catch (err) {
      console.error('Failed to log activity:', err);
    }
  };

  // 1. CREATE TODO
  const addTodo = async ({ task, boardId, userId, priority, deadline }) => {
    const safeBoardId = boardId || null;
    
    // Clean Payload without undefined attributes
    const payload = {
      task,
      board_id: safeBoardId,
      user_id: userId,
      completed: false
    };

    if (priority) payload.priority = priority;
    if (deadline) payload.deadline = deadline;

    const { data, error } = await supabase
      .from('todos')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error("Supabase Todo Insert Error Details:", error.message, error.details);
    }

    if (!error && data) {
      // Optimistic UI update / Refetch
      setTodos((prev) => [data, ...prev]);

      await logActivity({
        boardId: safeBoardId,
        userId,
        todoId: data.id,
        actionType: 'CREATE',
        taskTitle: data.task,
      });
    }
    return { data, error };
  };

  // 2. EDIT / UPDATE TODO
  const updateTodo = async (todoId, updates, boardId, userId) => {
    const { data, error } = await supabase
      .from('todos')
      .update(updates)
      .eq('id', todoId)
      .select()
      .single();

    if (error) {
      console.error("Supabase Todo Update Error:", error.message);
    }

    if (!error && data) {
      setTodos((prev) => prev.map((t) => (t.id === todoId ? data : t)));

      let actionType = 'EDIT';
      if (typeof updates.completed === 'boolean') {
        actionType = updates.completed ? 'COMPLETED' : 'UNDO';
      }

      const targetBoardId = boardId || data.board_id;
      const targetUserId = userId || data.user_id;

      await logActivity({
        boardId: targetBoardId,
        userId: targetUserId,
        todoId: data.id,
        actionType: actionType,
        taskTitle: data.task,
        details: updates,
      });
    }
    return { data, error };
  };

  // 3. DELETE TODO
  const deleteTodo = async (todoId, taskTitle, boardId, userId) => {
    // Foreign Key crash fix: Pehle Activity Log likho, fir item Delete karo!
    if (boardId && userId) {
      await logActivity({
        boardId,
        userId,
        todoId: null, // Foreign Key integrity guard
        actionType: 'DELETE',
        taskTitle: taskTitle,
      });
    }

    const { error } = await supabase.from('todos').delete().eq('id', todoId);
    
    if (error) {
      console.error("Supabase Todo Delete Error:", error.message);
    } else {
      setTodos((prev) => prev.filter((t) => t.id !== todoId));
    }

    return { error };
  };

  // 4. TOGGLE COMPLETE / UNDO FUNCTION
  const toggleTodoStatus = async (todoId, currentCompleted, taskTitle, boardId, userId) => {
    const newStatus = !currentCompleted;

    // Build update object safely
    const updatePayload = { completed: newStatus };

    const { data, error } = await supabase
      .from('todos')
      .update(updatePayload)
      .eq('id', todoId)
      .select()
      .single();

    if (error) {
      console.error("Supabase Toggle Status Error:", error.message, error.details);
    }

    if (!error && data) {
      setTodos((prev) => prev.map((t) => (t.id === todoId ? data : t)));

      const actionType = newStatus ? 'COMPLETED' : 'UNDO';

      const targetBoardId = boardId || data.board_id;
      const targetUserId = userId || data.user_id;

      await logActivity({
        boardId: targetBoardId,
        userId: targetUserId,
        todoId: data.id,
        actionType: actionType,
        taskTitle: taskTitle || data.task,
        details: { completed: newStatus }
      });
    }

    return { data, error };
  };

  return { todos, loading, refreshTodos: fetchTodos, addTodo, updateTodo, deleteTodo, toggleTodoStatus };
};