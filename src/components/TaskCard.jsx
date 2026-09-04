import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { urgency, formatDeadline, URGENCY_META } from '../lib/date';

function getRemainingDays(completedAt) {
  if (!completedAt) return 'Deletes in 7d';
  const completedDate = new Date(completedAt).getTime();
  const msPassed = Date.now() - completedDate;
  const daysPassed = Math.floor(msPassed / (1000 * 60 * 60 * 24));
  const daysLeft = Math.max(0, 7 - daysPassed);
  if (daysLeft === 0) return 'Deletes today';
  return `Deletes in ${daysLeft}d`;
}

// Color Configuration according to Design
const COLOR_CONFIG = {
  overdue: { bg: 'bg-[#D93D31]', text: 'text-[#D93D31]', lightBg: 'bg-[#D93D31]/15' },
  today: { bg: 'bg-[#C2E15F]', text: 'text-[#C2E15F]', lightBg: 'bg-[#C2E15F]/15' },
  upcoming: { bg: 'bg-[#5BB0E6]', text: 'text-[#5BB0E6]', lightBg: 'bg-[#5BB0E6]/15' },
  nodate: { bg: 'bg-[#E5AA6E]', text: 'text-[#E5AA6E]', lightBg: 'bg-[#E5AA6E]/15' },
  done: { bg: 'bg-gray-500', text: 'text-gray-400', lightBg: 'bg-gray-500/15' }
};

export default function TaskCard({ task, onToggle, onEdit, onDelete }) {
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    if (showImageModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showImageModal]);

  // Determine urgency category key
  const urgencyKey = task.completed ? 'done' : (urgency(task) || 'nodate');
  
  // Design Accent Colors
  const accentTheme = COLOR_CONFIG[urgencyKey] || COLOR_CONFIG.nodate;

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -12, transition: { duration: 0.15 } }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative group w-full max-w-sm"
      >
        {/* Back-Shadow Offset Accent Block */}
        <div 
          className={`absolute -left-1.5 -bottom-1.5 w-full h-full rounded-2xl transition-all duration-300 ${accentTheme.bg}`} 
        />

        {/* Main Card */}
        <div 
          className={`relative z-10 flex flex-col justify-between rounded-2xl bg-[#2D2D2D] p-4 text-white shadow-md border border-white/5 transition-all duration-200 ${
            task.completed ? 'opacity-65 grayscale-[20%]' : 'hover:scale-[1.01]'
          }`}
        >
          {/* TOP ROW: Title, Attachment, Tag & Edit Icon */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className={`font-semibold text-sm truncate ${task.completed ? 'line-through text-gray-400' : 'text-gray-100'}`}>
                {task.task}
              </h3>

              {/* Paperclip / Image Attachment Trigger */}
              {task.image && (
                <button
                  type="button"
                  onClick={() => setShowImageModal(true)}
                  title="View attachment"
                  className="text-gray-400 hover:text-white transition-colors shrink-0"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                  </svg>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Optional Mentioned Person Pill */}
              {(task.assignee || task.mentionedUser) && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white text-[#2D2D2D]">
                  {task.assignee || task.mentionedUser}
                </span>
              )}

              {/* Edit Button */}
              <button
                type="button"
                onClick={() => onEdit(task)}
                aria-label="Edit task"
                className="text-gray-400 hover:text-white p-1 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </button>
            </div>
          </div>

          {/* MIDDLE ROW: Description & Delete Action */}
          <div className="flex items-start justify-between gap-2 my-1">
            <p className={`text-xs leading-relaxed line-clamp-2 ${task.completed ? 'text-gray-500' : 'text-gray-300'}`}>
              {task.des || 'No description provided'}
            </p>

            {/* Delete Button */}
            <button
              type="button"
              onClick={() => onDelete(task.id)}
              aria-label="Delete task"
              className="text-gray-400 hover:text-red-400 p-1 shrink-0 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0l-1 14a2 2 0 01-2 2H7a2 2 0 01-2-2L4 6h16z" />
              </svg>
            </button>
          </div>

          {/* BOTTOM ROW: Date Badge, Auto Delete Badge & Completion Checkbox */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Date Badge */}
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium ${accentTheme.lightBg} ${accentTheme.text}`}>
                {task.deadline ? formatDeadline(task.deadline) : 'No Date'}
              </span>

              {/* Completed Auto Delete Badge */}
              {task.completed && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-gray-300">
                  {getRemainingDays(task.completed_at)}
                </span>
              )}
            </div>

            {/* Checkbox Complete Toggle Button */}
            <button
              type="button"
              onClick={() => onToggle(task.id)}
              aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
              className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                task.completed
                  ? 'bg-blue-400 border-blue-400 text-white'
                  : 'border-gray-500 hover:border-gray-300 bg-transparent'
              }`}
            >
              {task.completed && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Lightbox Modal (Original Functionality Intact) */}
      <AnimatePresence>
        {showImageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowImageModal(false)}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-lg w-full bg-[#2D2D2D] border border-white/10 rounded-2xl p-2 shadow-2xl overflow-hidden"
            >
              <img
                src={task.image}
                alt={task.task}
                className="w-full max-h-[80vh] object-contain rounded-xl"
              />
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="absolute top-4 right-4 bg-black/70 hover:bg-black text-white w-7 h-7 rounded-full text-xs flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}