import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';

export default function ActivityLogPanel({ boardId, isOpen, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Helper function to strictly deduplicate array items by ID
  const removeDuplicates = (list) => {
    const seen = new Set();
    return list.filter((item) => {
      if (!item || !item.id || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  };

  // Robust function to fetch logs + map user profiles guaranteed
  const fetchActivityLogs = async (currentBoardId) => {
    if (!currentBoardId) {
      setLogs([]);
      return;
    }

    setLoading(true);

    // 1. Fetch Raw Activity Logs
    const { data: logData, error: logError } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('board_id', currentBoardId)
      .order('created_at', { ascending: false });

    if (logError) {
      console.error('Error fetching logs:', logError);
      setLoading(false);
      return;
    }

    if (!logData || logData.length === 0) {
      setLogs([]);
      setLoading(false);
      return;
    }

    // 2. Extract unique user_ids from logs
    const userIds = [...new Set(logData.map((item) => item.user_id).filter(Boolean))];

    // 3. Fetch profiles explicitly for all user_ids
    let profilesMap = {};
    if (userIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);

      if (profilesData) {
        profilesMap = profilesData.reduce((acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {});
      }
    }

    // 4. Attach profiles to each log entry explicitly
    const mergedLogs = logData.map((log) => ({
      ...log,
      profiles: profilesMap[log.user_id] || null,
    }));

    // Deduplicate array before setting state
    setLogs(removeDuplicates(mergedLogs));
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen && boardId) {
      fetchActivityLogs(boardId);

      // Realtime channel setup
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
          async (payload) => {
            // Fetch profile specifically for the new log's user
            const { data: profileData } = await supabase
              .from('profiles')
              .select('id, email, full_name')
              .eq('id', payload.new.user_id)
              .maybeSingle();

            const newLogWithProfile = {
              ...payload.new,
              profiles: profileData || null,
            };

            // Safely deduplicate during realtime update
            setLogs((prev) => removeDuplicates([newLogWithProfile, ...prev]));
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setLogs([]);
    }
  }, [boardId, isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-[#1E1E24]/40 backdrop-blur-sm"
          />

          <motion.div
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-modal="true"
            className="fixed top-0 right-0 z-50 h-full w-full sm:w-[420px] bg-[#1E1E24] flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-500">
              <h2 className="font-display font-semibold text-lg text-muted ">
                Board Activity
              </h2>
              <button
                onClick={onClose}
                aria-label="Close"
                className="text-muted/80 hover:text-muted p-1 cursor-pointer transition-colors"
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

            <div className="flex-1 overflow-y-auto p-6 space-y-3 no-scrollbar">
              {loading && logs.length === 0 ? (
                <div className="flex justify-center items-center py-10">
                  <p className="text-muted text-xs font-semibold">Loading activity logs...</p>
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-muted text-xs font-semibold">No activity recorded yet.</p>
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 bg-muted rounded-xl shadow-sm transition-all flex flex-col gap-1"
                  >
                    <div className="flex justify-between items-center gap-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-semibold md:text-sm text-xs text-muted truncate">
                          {log.profiles?.full_name || log.profiles?.email || 'Unknown Member'}
                        </span>
                        
                        <span
                          className={`uppercase text-[8px] 
                            px-1.5 py-0.5 rounded-full font-semibold shrink-0  ${
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

                      <span className="text-[10px] text-muted/85 font-medium shrink-0">
                        {new Date(log.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {log.task_title && (
                      <div className="text-xs font-code text-muted/85 break-words">
                        {log.task_title}
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