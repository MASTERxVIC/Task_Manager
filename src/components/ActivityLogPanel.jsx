import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';

export default function ActivityLogPanel({ boardId, isOpen, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchActivityLogs = async (currentBoardId) => {
    if (!currentBoardId) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*, profiles!user_id(email, full_name)')
      .eq('board_id', currentBoardId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching logs:', error);
    } else {
      setLogs(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen && boardId) {
      fetchActivityLogs(boardId);

      // Realtime listener
      const channel = supabase
        .channel(`board_activity_${boardId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'activity_logs',
            filter: `board_id=eq.${boardId}`,
          },
          () => {
            fetchActivityLogs(boardId);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [boardId, isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Animation */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm"
          />

          {/* Drawer Panel Animation */}
          <motion.div
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-modal="true"
            className="fixed top-0 right-0 z-50 h-full w-full sm:w-[420px] bg-surface flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-line ">
              <h2 className="font-display font-semibold text-lg text-white">
                Board Activity
              </h2>
              <button
                onClick={onClose}
                aria-label="Close"
                className="text-muted/70 hover:text-ink p-1 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3 no-scrollbar">
              {loading ? (
                <div className="flex justify-center items-center py-10">
                  <p className="text-muted text-xs font-medium">Loading activity logs...</p>
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-muted text-xs font-medium">No activity recorded yet.</p>
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 bg-white rounded-xl border border-line shadow-sm transition-all flex flex-col gap-2"
                  >
                    {/* Top Row: User Name + Action Badge on left, Timestamp on right */}
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-semibold text-sm sm:text-xs text-gray-800 truncate">
                          {log.profiles?.full_name || log.profiles?.email || 'Unknown Member'}
                        </span>
                        
                        {/* Action Badge right next to User Name */}
                        <span
                          className={`uppercase text-[8px] font-code px-1.5 py-0.5 rounded-full font-semibold shrink-0 ${
                            log.action_type === 'CREATE' || log.action_type === 'CREATED'
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                              : log.action_type === 'DELETE' || log.action_type === 'DELETED'
                              ? 'bg-rose-50 text-rose-600 border border-rose-200'
                              : log.action_type === 'COMPLETED'
                              ? 'bg-teal-50 text-teal-600 border border-teal-200'
                              : log.action_type === 'UNDO'
                              ? 'bg-amber-50 text-amber-600 border border-amber-200'
                              : 'bg-sky-50 text-sky-600 border border-sky-200'
                          }`}
                        >
                          {log.action_type}
                        </span>
                      </div>

                      <span className="text-[10px] text-muted font-medium shrink-0">
                        {new Date(log.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Bottom Row: Task Title taking full row width */}
                    {log.task_title && (
                      <div className="text-xs font-code text-gray-600 px-2.5 py-1.5 break-words">
                        "{log.task_title}"
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}