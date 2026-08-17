import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import TaskList from './components/TaskList';
import TaskDrawer from './components/TaskDrawer';
import ConfirmDialog from './components/ConfirmDialog';
import Auth from './components/Auth';
import { useTasks } from './lib/useTasks';

export default function App() {
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
    counts 
  } = useTasks();

  const [view, setView] = useState('all');
  const [search, setSearch] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [confirm, setConfirm] = useState(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center text-gray-400">
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

  const handleSave = (form) => {
    if (editingTask) {
      updateTask(editingTask.id, form);
    } else {
      addTask(form);
    }
    setDrawerOpen(false);
  };

  const requestDelete = (id) => setConfirm({ type: 'delete', id });
  const requestClearAll = () => setConfirm({ type: 'clearAll' });

  const handleConfirm = () => {
    if (confirm?.type === 'delete') deleteTask(confirm.id);
    if (confirm?.type === 'clearAll') clearAll();
    setConfirm(null);
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

  return (
    /* h-dvh mobile browser address bar height ke saath adapt hota hai */
      <div className="h-[100dvh] w-full flex bg-void overflow-hidden fixed inset-0">
      
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 shrink-0 h-full border-r border-line">
        <Sidebar 
          view={view} 
          setView={setView} 
          counts={counts} 
          user={user} 
          onLogout={logout} 
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
                onLogout={logout}
                onClose={() => setMobileNavOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
        {/* Topbar fixed at top */}
        <div className="shrink-0">
          <Topbar
            view={view}
            search={search}
            setSearch={setSearch}
            onAddClick={openAddDrawer}
            onMenuClick={() => setMobileNavOpen(true)}
            onClearAll={requestClearAll}
            hasTasks={tasks.length > 0}
          />
        </div>

        {/* Sirf Task List area scroll hoga (min-h-0 is key here) */}
        <main className="flex-1 min-h-0 overflow-y-auto px-4 md:px-8 py-6 max-w-3xl w-full mx-auto">
          <TaskList
            tasks={tasks}
            view={view}
            search={search}
            onToggle={toggleTask}
            onEdit={openEditDrawer}
            onDelete={requestDelete}
          />
        </main>
      </div>

      <TaskDrawer open={drawerOpen} onClose={closeDrawer} onSave={handleSave} editingTask={editingTask} />
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