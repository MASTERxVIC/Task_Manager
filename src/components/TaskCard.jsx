import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { urgency, formatDeadline } from '../lib/date';

function getRemainingDays(completedAt) {
  if (!completedAt) return 'Deletes in 7d';
  const completedDate = new Date(completedAt).getTime();
  const msPassed = Date.now() - completedDate;
  const daysPassed = Math.floor(msPassed / (1000 * 60 * 60 * 24));
  const daysLeft = Math.max(0, 7 - daysPassed);
  if (daysLeft === 0) return 'Deletes today';
  return `Deletes in ${daysLeft}d`;
}

// Category Specific Themes
const CATEGORY_THEME = {
  overdue: { 
    text: 'text-[#CF0003]',
    pillBg: 'bg-[#FFE2E0]', 
    border: 'border-[#CF0003]',
    borderColorClass: 'border-l-[#CF0003]'
  },
  today: { 
    text: 'text-[#8EA824]',
    pillBg: 'bg-[#F2FDC3]', 
    border: 'border-[#8EA824]',
    borderColorClass: 'border-l-[#B0E01E]'
  },
  upcoming: { 
    text: 'text-[#008ACF]',
    pillBg: 'bg-[#DDEFFE]', 
    border: 'border-[#008ACF]',
    borderColorClass: 'border-l-[#008ACF]'
  },
  none: { 
    text: 'text-[#A06E32]',
    pillBg: 'bg-[#FFF0DD]', 
    border: 'border-[#A06E32]',
    borderColorClass: 'border-l-[#FFC684]'
  }
};

// Helper: Get actual category even if task is completed
function getTaskCategory(task) {
  if (task.category) return task.category;
  if (!task.deadline) return 'none';
  const rawUrgency = urgency({ ...task, completed: false });
  return rawUrgency || 'none';
}

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

  const categoryKey = getTaskCategory(task);
  const accentTheme = CATEGORY_THEME[categoryKey] || CATEGORY_THEME.none;

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -12, transition: { duration: 0.15 } }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative group shrink-0 select-none"
      >
        {/* FIXED DIMENSIONS: Width 348px & Height 193px exact mockup layout ke match me */}
        <div 
          className={`relative z-10 flex justify-between gap-2 rounded-4xl bg-[#222222] pl-5 pr-4 py-5 text-white shadow-xl transition-all duration-200 w-84 h-48.25 border-l-8 ${accentTheme.borderColorClass} ${
            task.completed ? 'opacity-60' : 'opacity-100'
          }`}
        >
          {/* LEFT CONTENT */}
          <div className="flex flex-col justify-between flex-1 min-w-0">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <h3 className={`text-xl font-bold font-afacad truncate  ${task.completed ? 'text-gray-300' : 'text-white'}`}>
                  {task.task}
                </h3>

                {task.image && (
                  <button
                    type="button"
                    onClick={() => setShowImageModal(true)}
                    className="text-gray-400 hover:text-white transition-colors shrink-0"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                    </svg>
                  </button>
                )}

                {(task.assignee || task.mentionedUser) && (
                  <span className={`px-3 py-0.5 rounded-full text-[15px] font-mono font-bold border ${accentTheme.pillBg} ${accentTheme.text} ${accentTheme.border}`}>
                    {task.assignee || task.mentionedUser}
                  </span>
                )}
              </div>

              <p className={`text-xl font-afacad font-regular line-clamp-2 ${task.completed ? 'text-gray-400' : 'text-gray-300'}`}>
                {task.des || 'description description description'}
              </p>
            </div>

            <div className="flex items-center gap-2 mt-auto flex-wrap">
              <span className={`px-3.5 py-1 rounded-full text-xs font-bold border ${accentTheme.pillBg} ${accentTheme.text} ${accentTheme.border}`}>
                {task.deadline ? formatDeadline(task.deadline) : 'No Date'}
              </span>

              {task.completed && (
                <span className={`px-3.5 py-1 rounded-full text-xs font-bold border ${accentTheme.pillBg} ${accentTheme.text} ${accentTheme.border}`}>
                  {getRemainingDays(task.completed_at)}
                </span>
              )}
            </div>
          </div>

          {/* RIGHT ACTION COLUMN */}
          <div className="flex flex-col justify-between items-center shrink-0 px-2 py-1 text-gray-400">
            <button
              type="button"
              onClick={() => onEdit(task)}
              className="hover:text-white transition-colors p-0.5"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => onDelete(task.id)}
              className="hover:text-red-400 transition-colors my-auto p-0.5"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0l-1 14a2 2 0 01-2 2H7a2 2 0 01-2-2L4 6h16z" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => onToggle(task.id)}
              className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-all ${
                task.completed
                  ? 'border-gray-400 bg-transparent text-gray-300'
                  : 'border-gray-400 hover:border-gray-200 bg-transparent text-transparent'
              }`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 13l4 4L19 7" />
              </svg>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {showImageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowImageModal(false)}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-lg w-full bg-[#222222] border border-white/10 rounded-2xl p-2 shadow-2xl overflow-hidden"
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