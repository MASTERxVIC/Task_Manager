import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function ActivityLogPanel({ boardId, isOpen, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchActivityLogs = async (currentBoardId) => {
    if (!currentBoardId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('activity_logs')
      .select('*, profiles:user_id(email, full_name)')
      .eq('board_id', currentBoardId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching activity logs:', error);
    } else {
      setLogs(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen && boardId) {
      fetchActivityLogs(boardId);
    }
  }, [boardId, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 md:w-96 bg-white shadow-2xl z-50 p-4 overflow-y-auto border-l border-gray-200">
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h2 className="text-lg font-bold text-gray-800">Board Activity</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-800 text-sm font-semibold"
        >
          ✕ Close
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Loading activity logs...</p>
      ) : logs.length === 0 ? (
        <p className="text-gray-400 text-sm">No activity recorded yet.</p>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="p-3 bg-gray-50 rounded-lg text-sm border border-gray-100">
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-gray-700">
                  {log.profiles?.full_name || log.profiles?.email || 'Unknown Member'}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-gray-600">
                <span className={`font-semibold uppercase text-xs mr-1 ${
                  log.action_type === 'CREATED' ? 'text-green-600' :
                  log.action_type === 'DELETED' ? 'text-red-600' : 'text-blue-600'
                }`}>
                  [{log.action_type}]
                </span>
                {log.task_title ? `"${log.task_title}"` : ''}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}