import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import TaskList from './components/TaskList';
import TaskDrawer from './components/TaskDrawer';
import ConfirmDialog from './components/ConfirmDialog';
import Auth from './components/Auth';
import JoinBoardModal from './components/JoinBoardModal';
import CreateBoardModal from './components/CreateBoardModal';
import { useTasks } from './lib/useTasks';
import { supabase } from './lib/supabaseClient';

export default function App() {
  const [view, setView] = useState('all');
  const [activeBoard, setActiveBoard] = useState(null);
  const [boards, setBoards] = useState([]); // User's boards state

  // Pass activeBoard?.id to useTasks if your hook supports board filtering
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

  // Fetch all boards for the logged-in user
  const fetchBoards = async () => {
    if (!user) return;
    try {
      // Fetch boards owned by user or where user is a member
      const { data: memberBoards, error: memberErr } = await supabase
        .from('board_members')
        .select('board_id, boards(*)')
        .eq('user_id', user.id);

      if (memberErr) throw memberErr;

      const userBoards = memberBoards ? memberBoards.map((m) => m.boards).filter(Boolean) : [];
      setBoards(userBoards);

      // Default active board set karein agar select nahi hai
      if (userBoards.length > 0 && !activeBoard) {
        setActiveBoard(userBoards[0]);
      }
    } catch (err) {
      console.error('Error fetching boards:', err);
    }
  };

  useEffect(() => {
    fetchBoards();
  }, [user]);

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
        // Active board ID ko explicitly task ke sath attach karein
        const taskPayload = {
          ...form,
          ...(activeBoard?.id ? { board_id: activeBoard.id } : {})
        };

        await addTask(taskPayload);
      }
      setDrawerOpen(false);
      if (refetchTasks) await refetchTasks(); // Immediate UI sync
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
    }
    setConfirm(null);
    if (refetchTasks) await refetchTasks();
  };

  const handleBoardCreated = async (newBoard) => {
    setActiveBoard(newBoard);
    await fetchBoards();
    if (refetchTasks) await refetchTasks();
  };

  const handleJoinBoard = async (inviteCode) => {
    const { data: board, error: boardError } = await supabase
      .from('boards')
      .select('id, name, invite_code')
      .eq('invite_code', inviteCode.trim().toUpperCase())
      .maybeSingle();

    if (boardError || !board) {
      throw new Error('Invalid invite code. Please check and try again.');
    }

    const { data: existingMember } = await supabase
      .from('board_members')
      .select('id')
      .eq('board_id', board.id)
      .eq('user_id', user.id)
      .maybeSingle();

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

    if (joinError) throw new Error(joinError.message);

    setActiveBoard(board);
    await fetchBoards();
    if (refetchTasks) await refetchTasks();
  };

  return (
    <div className="h-[100dvh] w-full flex bg-void overflow-hidden fixed inset-0">
      
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 shrink-0 h-full border-r border-line">
        <Sidebar 
          view={view} 
          setView={setView} 
          counts={counts} 
          user={user} 
          boards={boards}
          activeBoard={activeBoard}
          onSelectBoard={(board) => setActiveBoard(board)}
          onLogout={logout} 
          onOpenJoinModal={() => setJoinModalOpen(true)}
          onOpenCreateModal={() => setCreateModalOpen(true)}
        />
      </div>

      {/* Mobile Drawer Overlay */}
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
                  setActiveBoard(board);
                  setMobileNavOpen(false);
                }}
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
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
        <div className="shrink-0">
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
        title={confirm?.type === 'clearAll' ? 'Clear all tasks?' : 'Delete this task?'}
        body={
          confirm?.type === 'clearAll'
            ? 'This removes every task permanently. This can’t be undone.'
            : 'This task will be removed permanently.'
        }
        confirmLabel={confirm?.type === 'clearAll' ? 'Clear all' : 'Delete'}
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}