import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, X, Loader2, KeyRound } from 'lucide-react';

export default function JoinBoardModal({ open, onClose, onJoin }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();

    if (!cleanCode) {
      setError('Please enter a valid invite code.');
      return;
    }

    if (cleanCode.length < 5) {
      setError('Invite code must be at least 5 characters.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Call parent handle function (backend/supabase logic pass kar sakte hain yahan)
      if (onJoin) {
        await onJoin(cleanCode);
      }

      // Reset & close on success
      setCode('');
      onClose();
    } catch (err) {
      setError(err?.message || 'Failed to join board. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setCode('');
    setError('');
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

            {/* Header Icon & Title */}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-surface border border-surface/20 ">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Join a Shared Board</h3>
                <p className="text-xs text-gray-400">Enter the invite code shared by your teammate</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5 uppercase tracking-wider">
                  Invite Code
                </label>
                <div className="relative flex items-center">
                  <KeyRound className="absolute left-3.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value.toUpperCase());
                      if (error) setError('');
                    }}
                    placeholder="e.g. TASKED-9988"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-line rounded-xl text-sm font-mono tracking-wider text-white placeholder:text-gray-500 placeholder:font-sans outline-none transition-all uppercase"
                    autoFocus
                  />
                </div>
                {error && (
                  <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                    {error}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="px-4 py-2 text-sm bg-white text-rose-800  hover:text-white hover:bg-rose-800  rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !code.trim()}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-surface/70 hover:bg-surface rounded-xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? 'Joining...' : 'Join Board'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}