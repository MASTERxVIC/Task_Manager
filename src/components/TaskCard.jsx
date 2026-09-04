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

// Color Palette Matched to Mockup
const COLOR_CONFIG = {
  overdue: { bg: 'bg-[#C82D2B]', text: 'text-[#C82D2B]', pillBg: 'bg-[#FFD2D0]' },
  today: { bg: 'bg-[#BCE343]', text: 'text-[#8EA824]', pillBg: 'bg-[#EEFB8A]' },
  upcoming: { bg: 'bg-[#3C88CE]', text: 'text-[#2D6CA8]', pillBg: 'bg-[#C3E4FF]' },
  nodate: { bg: 'bg-[#E3AA65]', text: 'text-[#A06E32]', pillBg: 'bg-[#FFE3C3]' },
  done: { bg: 'bg-gray-500', text: 'text-gray-400', pillBg: 'bg-gray-300' }
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

  const urgencyKey = task.completed ? 'done' : (urgency(task) || 'nodate');
  const accentTheme = COLOR_CONFIG[urgencyKey] || COLOR_CONFIG.nodate;

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -12, transition: { duration: 0.15 } }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative group w-full max-w-[340px]"
      >
        {/* Back-Shadow Accent Block (Curved Outline Shift) */}
        <div 
          className={`absolute -left-2 -bottom-2 top-2 right-2 rounded-[22px] transition-all duration-300 ${accentTheme.bg}`} 
        />

        {/* Main Dark Card */}
        <div 
          className={`relative z-10 flex justify-between gap-3 rounded-[20px] bg-[#222222] p-4 text-white shadow-xl transition-all duration-200 min-h-[140px] ${
            task.completed ? 'opacity-60' : 'hover:scale-[1.01]'
          }`}
        >
          {/* LEFT SIDE CONTENT AREA */}
          <div className="flex flex-col justify-between flex-1 min-w-0">
            {/* Header: Title + Image Attachment + Mention Pill */}
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <h3 className={`font-bold text-base truncate ${task.completed ? 'line-through text-gray-400' : 'text-gray-100'}`}>
                  {task.task}
                </h3>

                {/* Paperclip Icon */}
                {task.image && (
                  <button
                    type="button"
                    onClick={() => setShowImageModal(true)}
                    title="View attachment"
                    className="text-gray-400 hover:text-white transition-colors shrink-0"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                    </svg>
                  </button>
                )}

                {/* Mentioned User Pill Badge */}
                {(task.assignee || task.mentionedUser) && (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${accentTheme.pillBg} ${accentTheme.text}`}>
                    {task.assignee || task.mentionedUser}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className={`text-xs leading-relaxed line-clamp-2 ${task.completed ? 'text-gray-500' : 'text-gray-300'}`}>
                {task.des || 'description description description'}
              </p>
            </div>

            {/* Bottom Badges */}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {/* Date Badge */}
              <span className={`px-3 py-0.5 rounded-full text-xs font-bold font-mono ${accentTheme.pillBg} ${accentTheme.text}`}>
                {task.deadline ? formatDeadline(task.deadline) : 'No Date'}
              </span>

              {/* Completed Remaining Days Badge */}
              {task.completed && (
                <span className={`px-3 py-0.5 rounded-full text-xs font-bold font-mono ${accentTheme.pillBg} ${accentTheme.text}`}>
                  {getRemainingDays(task.completed_at)}
                </span>
              )}
            </div>
          </div>

          {/* RIGHT SIDE VERTICAL ACTION COLUMN (Aligned to Mockup) */}
          <div className="flex flex-col justify-between items-center shrink-0 pl-1 py-0.5">
            {/* Edit Icon */}
            <button
              type="button"
              onClick={() => onEdit(task)}
              aria-label="Edit task"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </button>

            {/* Delete Icon */}
            <button
              type="button"
              onClick={() => onDelete(task.id)}
              aria-label="Delete task"
              className="text-gray-400 hover:text-red-400 transition-colors my-auto"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0l-1 14a2 2 0 01-2 2H7a2 2 0 01-2-2L4 6h16z" />
              </svg>
            </button>

            {/* Checkbox Icon */}
            <button
              type="button"
              onClick={() => onToggle(task.id)}
              aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
              className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                task.completed
                  ? 'bg-blue-400 border-blue-400 text-white'
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
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
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