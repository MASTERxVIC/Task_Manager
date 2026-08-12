import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import TaskList from './components/TaskList';
import TaskDrawer from './components/TaskDrawer';
import ConfirmDialog from './components/ConfirmDialog';
import { useTasks } from './lib/useTasks';

export default function App() {
  const { tasks, addTask, updateTask, deleteTask, toggleTask, clearAll, counts } = useTasks();

  const [view, setView] = useState('all');
  const [search, setSearch] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [confirm, setConfirm] = useState(null); // { type: 'delete' | 'clearAll', id? }

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

  return (
    <div className="min-h-screen flex bg-void">
      {/* desktop sidebar */}
      <div className="hidden md:block shrink-0">
        <Sidebar view={view} setView={setView} counts={counts} />
      </div>

      {/* mobile sidebar drawer */}
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
              className="fixed inset-y-0 left-0 z-50 w-72 md:hidden"
            >
              <Sidebar
                view={view}
                setView={(v) => {
                  setView(v);
                  setMobileNavOpen(false);
                }}
                counts={counts}
                onClose={() => setMobileNavOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar
          view={view}
          search={search}
          setSearch={setSearch}
          onAddClick={openAddDrawer}
          onMenuClick={() => setMobileNavOpen(true)}
          onClearAll={requestClearAll}
          hasTasks={tasks.length > 0}
        />

        <main className="flex-1 px-4 md:px-8 py-6 max-w-3xl w-full mx-auto">
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
            ? 'This removes every task permanently. This can\u2019t be undone.'
            : 'This task will be removed permanently.'
        }
        confirmLabel={confirm?.type === 'clearAll' ? 'Clear all' : 'Delete'}
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
