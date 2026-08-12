import { motion, AnimatePresence } from 'framer-motion';

export default function ConfirmDialog({ open, title, body, confirmLabel = 'Confirm', onConfirm, onCancel }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-void/70 backdrop-blur-sm flex items-center justify-center px-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            className="bg-surface border border-line rounded-2xl p-6 w-full max-w-sm"
          >
            <h3 className="font-display font-semibold text-ink">{title}</h3>
            <p className="text-sm text-muted mt-2">{body}</p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={onCancel}
                className="flex-1 py-2 rounded-xl text-sm font-medium text-muted hover:text-ink border border-line transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 py-2 rounded-xl text-sm font-semibold bg-coral text-void hover:opacity-90 transition-opacity"
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
