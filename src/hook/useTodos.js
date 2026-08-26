import { supabase } from '../lib/supabaseClient';

export const useTodos = () => {
  
  // Helper to insert log
  const logActivity = async ({ boardId, userId, todoId, actionType, taskTitle, details = {} }) => {
    if (!boardId || !userId) {
      console.warn('Activity log skipped: boardId or userId is missing.', { boardId, userId });
      return;
    }

    try {
      const { error } = await supabase.from('activity_logs').insert([
        {
          board_id: boardId,
          user_id: userId,
          todo_id: todoId,
          action_type: actionType,
          task_title: taskTitle,
          details: details,
        },
      ]);

      if (error) {
        console.error('Failed to log activity:', error);
      }
    } catch (err) {
      console.error('Failed to log activity:', err);
    }
  };

  // 1. CREATE TODO
  const addTodo = async ({ task, boardId, userId, priority, deadline }) => {
    const { data, error } = await supabase
      .from('todos')
      .insert([{ task, board_id: boardId, user_id: userId, priority, deadline, completed: false }])
      .select()
      .single();

    if (!error && data) {
      await logActivity({
        boardId,
        userId,
        todoId: data.id,
        actionType: 'CREATE',
        taskTitle: data.task,
      });
    }
    return { data, error };
  };

  // 2. EDIT / UPDATE TODO (Smart Detection for Toggle/Completed)
  const updateTodo = async (todoId, updates, boardId, userId) => {
    const { data, error } = await supabase
      .from('todos')
      .update(updates)
      .eq('id', todoId)
      .select()
      .single();

    if (!error && data) {
      // Automatic action type detection
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
    const { error } = await supabase.from('todos').delete().eq('id', todoId);

    if (!error) {
      await logActivity({
        boardId,
        userId,
        todoId,
        actionType: 'DELETE',
        taskTitle: taskTitle,
      });
    }
    return { error };
  };

  // 4. TOGGLE COMPLETE / UNDO FUNCTION
  const toggleTodoStatus = async (todoId, currentCompleted, taskTitle, boardId, userId) => {
    const newStatus = !currentCompleted;

    const { data, error } = await supabase
      .from('todos')
      .update({ 
        completed: newStatus,
        completed_at: newStatus ? new Date().toISOString() : null 
      })
      .eq('id', todoId)
      .select()
      .single();

    if (!error && data) {
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

  return { addTodo, updateTodo, deleteTodo, toggleTodoStatus };
};