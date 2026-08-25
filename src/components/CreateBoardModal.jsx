import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderPlus, X, Loader2, Copy, Check, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function CreateBoardModal({ open, onClose, user, onBoardCreated }) {
  const [boardName, setBoardName] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdBoard, setCreatedBoard] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!boardName.trim()) {
      setError('Please enter a board name');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // SQL triggers (Step 1 & 2) automatically handle invite_code generation & owner member insertion!
      const { data, error: insertError } = await supabase
        .from('boards')
        .insert([
          {
            name: boardName.trim(),
            created_by: user.id,
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      setCreatedBoard(data);
      if (onBoardCreated) onBoardCreated(data);
    } catch (err) {
      setError(err?.message || 'Failed to create board. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (!createdBoard?.invite_code) return;
    navigator.clipboard.writeText(createdBoard.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    if (loading) return;
    setBoardName('');
    setCreatedBoard(null);
    setError('');
    setCopied(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-void/80 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md bg-slate-900 border border-line rounded-2xl p-6 shadow-2xl z-10 text-white"
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {!createdBoard ? (
              /* FORM: Create Board */
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    <FolderPlus className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Create New Board</h3>
                    <p className="text-xs text-gray-400">Start a shared workspace for your team</p>
                  </div>
                </div>

                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1.5 uppercase tracking-wider">
                      Board Name
                    </label>
                    <input
                      type="text"
                      value={boardName}
                      onChange={(e) => {
                        setBoardName(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="e.g. Frontend Sprint 2026"
                      className="w-full px-4 py-2.5 bg-slate-800/80 border border-line focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm text-white placeholder:text-gray-500 outline-none transition-all"
                      autoFocus
                    />
                    {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={loading}
                      className="px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !boardName.trim()}
                      className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
                    >
                      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                      {loading ? 'Creating...' : 'Create Board'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              /* SUCCESS STATE: Display & Copy Invite Code */
              <div className="text-center py-2 space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white">Board Created!</h3>
                  <p className="text-xs text-gray-400">Share this code with team members to join</p>
                </div>

                {/* Invite Code Card */}
                <div className="p-4 bg-slate-800/80 border border-line rounded-xl flex items-center justify-between gap-3">
                  <div className="text-left">
                    <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">
                      Invite Code
                    </span>
                    <span className="text-base font-mono font-bold text-blue-400">
                      {createdBoard.invite_code}
                    </span>
                  </div>

                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-all shadow-md"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-green-300" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <button
                  onClick={handleClose}
                  className="w-full py-2.5 text-sm font-medium bg-slate-800 hover:bg-slate-700 text-gray-200 rounded-xl transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}