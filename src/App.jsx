import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import TaskList from './components/TaskList';
import TaskDrawer from './components/TaskDrawer';
import ConfirmDialog from './components/ConfirmDialog';
import Auth from './components/Auth';
import JoinBoardModal from './components/JoinBoardModal';
import CreateBoardModal from './components/CreateBoardModal';
import ActivityLogPanel from './components/ActivityLogPanel';
import { useTasks } from './lib/useTasks';
import { supabase } from './lib/supabaseClient';

export default function App() {
  const [view, setView] = useState('all');
  const [activeBoard, setActiveBoard] = useState(null);
  const [boards, setBoards] = useState([]);

  const { 
    user, 
    loading, 
    logout, 
    tasks, 
    addTask, 
    updateTask, 
    deleteTask, 
    toggleTask, 
    clearAll, 
    counts,
    refetchTasks
  } = useTasks(activeBoard?.id);

  const [search, setSearch] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);

  const handleSelectBoard = (board) => {
    setActiveBoard(board);
    if (board?.id) {
      localStorage.setItem('tasked_active_board_id', board.id);
    } else {
      localStorage.removeItem('tasked_active_board_id');
    }
  };

  const requestDeleteBoard = (board) => {
    if (!board?.id) return;
    setConfirm({ type: 'deleteBoard', board });
  };

  const executeDeleteBoard = async (boardToDelete) => {
    try {
      const { error } = await supabase
        .from('boards')
        .delete()
        .eq('id', boardToDelete.id);

      if (error) throw error;

      const updatedBoards = boards.filter((b) => b.id !== boardToDelete.id);
      setBoards(updatedBoards);

      if (activeBoard?.id === boardToDelete.id) {
        const fallbackBoard =
          updatedBoards.find((b) => b.is_default || b.name?.toLowerCase() === 'default') ||
          updatedBoards[0];

        handleSelectBoard(fallbackBoard || null);
      }

      if (refetchTasks) await refetchTasks();
    } catch (err) {
      console.error('Board delete error:', err);
    }
  };

  const fetchBoards = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data: memberBoards, error: memberErr } = await supabase
        .from('board_members')
        .select('board_id, boards(*)')
        .eq('user_id', user.id);

      if (memberErr) throw memberErr;

      let userBoards = memberBoards ? memberBoards.map((m) => m.boards).filter(Boolean) : [];

      if (userBoards.length === 0) {
        const { data: createdBoards } = await supabase
          .from('boards')
          .select('*')
          .eq('created_by', user.id);

        if (createdBoards && createdBoards.length > 0) {
          userBoards = createdBoards;
        }
      }

      if (userBoards.length === 0) {
        const { data: newBoard, error: createBoardErr } = await supabase
          .from('boards')
          .insert([{ name: 'Default', created_by: user.id }])
          .select()
          .single();

        if (!createBoardErr && newBoard) {
          await supabase
            .from('board_members')
            .insert([{ board_id: newBoard.id, user_id: user.id, role: 'owner' }]);
            
          userBoards = [newBoard];
        }
      }

      userBoards.sort((a, b) => {
        const aIsDefault = a.is_default || a.name?.toLowerCase() === 'default';
        const bIsDefault = b.is_default || b.name?.toLowerCase() === 'default';
        return (bIsDefault ? 1 : 0) - (aIsDefault ? 1 : 0);
      });

      setBoards(userBoards);

      const savedBoardId = localStorage.getItem('tasked_active_board_id');

      setActiveBoard((prevActive) => {
        if (prevActive) {
          const matched = userBoards.find((b) => b.id === prevActive.id);
          if (matched) return matched;
        }

        if (savedBoardId) {
          const savedBoard = userBoards.find((b) => b.id === savedBoardId);
          if (savedBoard) return savedBoard;
        }

        const defaultBoard = userBoards.find((b) => b.is_default || b.name?.toLowerCase() === 'default') || userBoards[0];
        if (defaultBoard?.id) {
          localStorage.setItem('tasked_active_board_id', defaultBoard.id);
        }
        return defaultBoard || null;
      });

    } catch (err) {
      console.error('Error fetching boards:', err);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  const handleBoardCreated = async (newBoard) => {
    setCreateModalOpen(false);
    if (newBoard?.id) {
      handleSelectBoard(newBoard);
      await fetchBoards();
      if (refetchTasks) await refetchTasks();
    }
  };

  const handleJoinBoard = async (inviteCode) => {
    const cleanCode = inviteCode.trim();

    const { data: board, error: boardError } = await supabase
      .from('boards')
      .select('id, name, invite_code')
      .ilike('invite_code', cleanCode)
      .maybeSingle();

    if (boardError) {
      console.error('Board search error:', boardError);
      throw new Error('Database error while finding board.');
    }

    if (!board) {
      throw new Error('Invalid invite code. No matching board found.');
    }

    const { data: existingMember, error: memberCheckErr } = await supabase
      .from('board_members')
      .select('id')
      .eq('board_id', board.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (memberCheckErr) {
      console.error('Member check error:', memberCheckErr);
    }

    if (existingMember) {
      throw new Error('You have already joined this board.');
    }

    const { error: joinError } = await supabase
      .from('board_members')
      .insert([
        {
          board_id: board.id,
          user_id: user.id,
          role: 'member'
        }
      ]);

    if (joinError) {
      console.error('Join error:', joinError);
      throw new Error(joinError.message || 'Failed to join the board.');
    }

    setJoinModalOpen(false);
    handleSelectBoard(board);
    await fetchBoards();
    if (refetchTasks) await refetchTasks();
  };

  if (loading) {
    return (
      <div className="h-dvh bg-void flex items-center justify-center text-gray-400">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading tasks...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  const openAddDrawer = () => {
    setEditingTask(null);
    setDrawerOpen(true);
  };

  const openEditDrawer = (task) => {
    setEditingTask(task);
    setDrawerOpen(true);
  };

  const closeDrawer = () => setDrawerOpen(false);

  const handleSave = async (form) => {
    try {
      if (editingTask) {
        await updateTask(editingTask.id, form);
      } else {
        const taskPayload = {
          ...form,
          ...(activeBoard?.id ? { board_id: activeBoard.id } : {})
        };
        await addTask(taskPayload);
      }
      setDrawerOpen(false);
      if (refetchTasks) await refetchTasks();
    } catch (err) {
      console.error('Task save error:', err);
    }
  };

  const requestDelete = (id) => setConfirm({ type: 'delete', id });
  const requestClearAll = () => setConfirm({ type: 'clearAll' });

  const handleConfirm = async () => {
    if (confirm?.type === 'delete') {
      await deleteTask(confirm.id);
    } else if (confirm?.type === 'clearAll') {
      await clearAll();
    } else if (confirm?.type === 'deleteBoard') {
      await executeDeleteBoard(confirm.board);
    }
    setConfirm(null);
    if (refetchTasks) await refetchTasks();
  };

  return (
    <div className="h-[100dvh] w-full flex bg-void overflow-hidden fixed inset-0">
      <div className="hidden md:block w-64 shrink-0 h-full border-r border-line">
        <Sidebar 
          view={view} 
          setView={setView} 
          counts={counts} 
          user={user} 
          boards={boards}
          activeBoard={activeBoard}
          onSelectBoard={(board) => handleSelectBoard(board)}
          onDeleteBoard={requestDeleteBoard}
          onLogout={logout} 
          onOpenJoinModal={() => setJoinModalOpen(true)}
          onOpenCreateModal={() => setCreateModalOpen(true)}
          onOpenLogs={() => setLogsOpen(true)}
        />
      </div>

      <AnimatePresence>
        {mobileNavOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileNavOpen(false)}
              className="fixed inset-0 z-40 bg-void/70 backdrop-blur-sm md:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 left-0 z-50 w-72 h-full md:hidden"
            >
              <Sidebar
                view={view}
                setView={(v) => {
                  setView(v);
                  setMobileNavOpen(false);
                }}
                counts={counts}
                user={user}
                boards={boards}
                activeBoard={activeBoard}
                onSelectBoard={(board) => {
                  handleSelectBoard(board);
                  setMobileNavOpen(false);
                }}
                onDeleteBoard={requestDeleteBoard}
                onLogout={logout}
                onClose={() => setMobileNavOpen(false)}
                onOpenJoinModal={() => {
                  setMobileNavOpen(false);
                  setJoinModalOpen(true);
                }}
                onOpenCreateModal={() => {
                  setMobileNavOpen(false);
                  setCreateModalOpen(true);
                }}
                onOpenLogs={() => {
                  setMobileNavOpen(false);
                  setLogsOpen(true);
                }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
        <div className="shrink-0 flex items-center justify-between pr-4">
          <div className="flex-1">
            <Topbar
              view={view}
              search={search}
              setSearch={setSearch}
              onAddClick={openAddDrawer}
              onMenuClick={() => setMobileNavOpen(true)}
              onClearAll={requestClearAll}
              hasTasks={tasks?.length > 0}
            />
          </div>
        </div>

        <main className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 md:px-8 py-6 max-w-3xl w-full mx-auto">
          <TaskList
            tasks={tasks || []}
            view={view}
            search={search}
            onToggle={toggleTask}
            onEdit={openEditDrawer}
            onDelete={requestDelete}
          />
        </main>
      </div>

      <ActivityLogPanel
        boardId={activeBoard?.id}
        isOpen={logsOpen}
        onClose={() => setLogsOpen(false)}
      />

      <TaskDrawer 
        open={drawerOpen} 
        onClose={closeDrawer} 
        onSave={handleSave} 
        editingTask={editingTask} 
      />
      
      <CreateBoardModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        user={user}
        onBoardCreated={handleBoardCreated}
      />

      <JoinBoardModal
        open={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
        onJoin={handleJoinBoard}
      />

      <ConfirmDialog
        open={!!confirm}
        title={
          confirm?.type === 'clearAll'
            ? 'Clear all tasks?'
            : confirm?.type === 'deleteBoard'
            ? `Delete "${confirm?.board?.name}" board?`
            : 'Delete this task?'
        }
        body={
          confirm?.type === 'clearAll'
            ? 'This removes every task permanently. This can’t be undone.'
            : confirm?.type === 'deleteBoard'
            ? 'This board and all tasks inside it will be permanently removed. This action cannot be undone.'
            : 'This task will be removed permanently.'
        }
        confirmLabel={
          confirm?.type === 'clearAll'
            ? 'Clear all'
            : confirm?.type === 'deleteBoard'
            ? 'Delete Board'
            : 'Delete'
        }
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}