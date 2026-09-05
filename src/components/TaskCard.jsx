import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { urgency, formatDeadline } from "../lib/date";

function getRemainingDays(completedAt) {
  if (!completedAt) return "Deletes in 7d";
  const completedDate = new Date(completedAt).getTime();
  const msPassed = Date.now() - completedDate;
  const daysPassed = Math.floor(msPassed / (1000 * 60 * 60 * 24));
  const daysLeft = Math.max(0, 7 - daysPassed);
  if (daysLeft === 0) return "Deletes today";
  return `Deletes in ${daysLeft}d`;
}

// Category Specific Themes
const CATEGORY_THEME = {
  overdue: {
    text: "text-[#CF0003]",
    hoverText: "hover:text-[#CF0003]",
    pillBg: "bg-[#FFE2E0]",
    border: "border-[#CF0003]",
    borderColorClass: "bg-[#CF0003]",
  },
  today: {
    text: "text-[#8EA824]",
    hoverText: "hover:text-[#8EA824]",
    pillBg: "bg-[#F2FDC3]",
    border: "border-[#8EA824]",
    borderColorClass: "bg-[#B0E01E]",
  },
  upcoming: {
    text: "text-[#008ACF]",
    hoverText: "hover:text-[#008ACF]",
    pillBg: "bg-[#DDEFFE]",
    border: "border-[#008ACF]",
    borderColorClass: "bg-[#008ACF]",
  },
  none: {
    text: "text-[#A06E32]",
    hoverText: "hover:text-[#A06E32]",
    pillBg: "bg-[#FFF0DD]",
    border: "border-[#A06E32]",
    borderColorClass: "bg-[#FFC684]",
  },
};

// Helper: Get actual category even if task is completed
function getTaskCategory(task) {
  if (task.category) return task.category;
  if (!task.deadline) return "none";
  const rawUrgency = urgency({ ...task, completed: false });
  return rawUrgency || "none";
}

export default function TaskCard({ task, onToggle, onEdit, onDelete }) {
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    if (showImageModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
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
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="relative group shrink-0 select-none w-full max-w-xl mx-auto my-2"
      >
        {/* LEFT CURVED ACCENT BAR LAYER */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-8 rounded-l-3xl ${accentTheme.borderColorClass}`}
        />

        {/* MAIN CARD CONTAINER */}
        <div
          className={`relative z-10 flex flex-col justify-between rounded-3xl bg-[#2A2A2A] ml-3 pl-5 pr-5 py-4 text-white shadow-xl transition-all duration-200 min-h-[110px] ${
            task.completed ? "opacity-60" : "opacity-100"
          }`}
        >
          {/* TOP ROW: TITLE, ATTACHMENT, ASSIGNEES & ACTION BUTTONS */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              <h3
                className={`text-xl font-bold font-afacad truncate max-w-[150px] sm:max-w-[200px] ${
                  task.completed ? "text-gray-300" : "text-white"
                }`}
              >
                {task.task}
              </h3>

              {/* ATTACHMENT BUTTON */}
              {(task.image || task.img) && (
                <button
                  type="button"
                  onClick={() => setShowImageModal(true)}
                  className={`transition-colors shrink-0 text-gray-400 opacity-60 hover:opacity-100 cursor-pointer ${accentTheme.hoverText}`}
                >
                  <svg
                    width="15"
                    height="17"
                    viewBox="0 0 18 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1 9.43198L7.89429 2.53769C9.94454 0.487437 13.2687 0.487437 15.319 2.53769C17.3692 4.58794 17.369 7.91224 15.3187 9.96249L7.36377 17.9174C5.99693 19.2843 3.78123 19.2841 2.4144 17.9173C1.04756 16.5504 1.04723 14.3346 2.41406 12.9677L10.369 5.01279C11.0524 4.32937 12.1611 4.32937 12.8445 5.01279C13.5279 5.6962 13.5274 6.80398 12.844 7.4874L5.94971 14.3817"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              )}

              {/* MULTI-ASSIGNEE PILL */}
              {(() => {
                const rawAssignees =
                  task.assignees || task.assignee || task.mentionedUser || [];
                let memberList = [];

                if (Array.isArray(rawAssignees)) {
                  memberList = rawAssignees;
                } else if (
                  typeof rawAssignees === "string" &&
                  rawAssignees.trim()
                ) {
                  memberList = rawAssignees
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean);
                }

                if (memberList.length === 0) return null;

                const firstMember = memberList[0];
                const extraCount = memberList.length - 1;
                const isSingleMember = memberList.length === 1;

                return (
                  <div className="relative group/pill inline-block shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-xl text-xs font-mono font-bold border ${accentTheme.pillBg} ${accentTheme.text} ${accentTheme.border} cursor-pointer transition-all`}
                    >
                      <span
                        className={
                          isSingleMember
                            ? "whitespace-nowrap"
                            : "truncate max-w-[100px]"
                        }
                      >
                        {firstMember}
                      </span>

                      {extraCount > 0 && (
                        <span className="bg-[#FDD739] text-[#1E1E23] text-[10px] px-1 py-0.2 rounded-lg font-mono font-semibold ml-0.5">
                          +{extraCount}
                        </span>
                      )}
                    </span>

                    {!isSingleMember && (
                      <div className="absolute left-0 top-full mt-1 hidden group-hover/pill:flex flex-col gap-1 bg-[#FDD739] text-xs font-sans rounded-xl px-3 py-2 shadow-2xl border border-gray-900 z-50 whitespace-nowrap pointer-events-none transition-opacity">
                        <span className="font-sans font-semibold text-[11px] text-[#1E1E23] border-b border-gray-500 pb-1 mb-0.5">
                          Assigned Members ({memberList.length}):
                        </span>
                        {memberList.map((m, idx) => (
                          <span
                            key={idx}
                            className="flex items-center gap-1.5 text-[#1E1E23]"
                          >
                            • {m}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* TOP-RIGHT HORIZONTAL ACTIONS (EDIT, DELETE, CHECKBOX) */}
            <div className="flex items-center gap-3 shrink-0 text-gray-400 pt-0.5">
              <button
                type="button"
                onClick={() => onEdit(task)}
                className={`transition-colors p-1 opacity-60 hover:opacity-100 cursor-pointer ${accentTheme.hoverText}`}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M9 4.58605L1 12.5861V16.5861H17M1 16.5861L5 16.586L13 8.58604M9 4.58605L11.8686 1.7174L11.8704 1.7157C12.2652 1.32082 12.463 1.12303 12.691 1.04894C12.8919 0.983686 13.1082 0.983686 13.3091 1.04894C13.5369 1.12297 13.7345 1.32054 14.1288 1.71486L15.8686 3.45466C16.2646 3.85067 16.4627 4.04878 16.5369 4.2771C16.6022 4.47795 16.6021 4.69429 16.5369 4.89513C16.4628 5.1233 16.265 5.3211 15.8695 5.71655L15.8686 5.7174L13 8.58604M9 4.58605L13 8.58604"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => onDelete(task.id)}
                className={`transition-colors p-1 opacity-60 hover:opacity-100 cursor-pointer ${accentTheme.hoverText}`}
              >
                <svg
                  width="15"
                  height="16"
                  viewBox="0 0 18 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M11 8V15M7 8V15M3 4V15.8C3 16.9201 3 17.4798 3.21799 17.9076C3.40973 18.2839 3.71547 18.5905 4.0918 18.7822C4.5192 19 5.07899 19 6.19691 19H11.8031C12.921 19 13.48 19 13.9074 18.7822C14.2837 18.5905 14.5905 18.2839 14.7822 17.9076C15 17.4802 15 16.921 15 15.8031V4M3 4H5M3 4H1M5 4H13M5 4C5 3.06812 5 2.60241 5.15224 2.23486C5.35523 1.74481 5.74432 1.35523 6.23438 1.15224C6.60192 1 7.06812 1 8 1H10C10.9319 1 11.3978 1 11.7654 1.15224C12.2554 1.35523 12.6447 1.74481 12.8477 2.23486C12.9999 2.6024 13 3.06812 13 4M13 4H15M15 4H17"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => onToggle(task.id)}
                className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all opacity-60 hover:opacity-100 cursor-pointer ${
                  task.completed
                    ? `border-gray-400 bg-transparent ${accentTheme.text}`
                    : `border-gray-400 bg-transparent text-transparent ${accentTheme.hoverText}`
                }`}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* MIDDLE ROW: DESCRIPTION */}
          <p
            className={`text-base font-afacad font-normal line-clamp-2 my-2 ${
              task.completed ? "text-gray-400" : "text-gray-300"
            }`}
          >
            {task.des || "description description description"}
          </p>

          {/* BOTTOM ROW: DATE & STATUS PILLS */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`px-3 py-0.5 rounded-xl text-xs font-mono border shrink-0 ${accentTheme.pillBg} ${accentTheme.text} ${accentTheme.border}`}
            >
              {task.deadline ? formatDeadline(task.deadline) : "No Date"}
            </span>

            {task.completed && (
              <span
                className={`px-3 py-0.5 rounded-xl text-xs font-mono border shrink-0 ${accentTheme.pillBg} ${accentTheme.text} ${accentTheme.border}`}
              >
                {getRemainingDays(task.completed_at)}
              </span>
            )}
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
                src={task.image || task.img}
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