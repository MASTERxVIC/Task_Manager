# Tasked

A modern rebuild of the original Task Manager, as a React + Vite app —
card-based tasks, a sidebar for one-click filtering, and a slide-in panel
for adding/editing instead of a static form.

## Stack

- React 19 + Vite
- Tailwind CSS v4
- Framer Motion (drawer/list animations)
- localStorage persistence (same storage model as the original, now keyed
  under `todo-modern-tasks`)

## Getting started

```bash
npm install
npm run dev       # local dev server
npm run build     # production build → dist/
npm run preview   # preview the production build
```

## What changed from the original

- **Table → cards.** Each task is a card with a checkbox, priority dot,
  description preview, and a color-coded due-date badge.
- **Sidebar navigation** replaces the dropdown filter: All Tasks, Today,
  Upcoming, Overdue, Completed — each with a live count, one click away at
  all times (collapses into a slide-out drawer on mobile).
- **Add/Edit task** now opens in a right-side slide-over panel instead of a
  form pinned to the top of the page, and doubles as the edit form (the
  original had no edit — only add/delete).
- **Search** replaces the old two-step "choose filter → apply" flow for
  finding a task by name/description; date-range and completion filtering
  is now instant via the sidebar sections.
- **Grouped, chronological list** (Overdue → Today → Upcoming → No date →
  Completed) in the "All Tasks" view, with a gradient timeline rail down
  the left edge that shifts color from urgent to calm — a quick visual read
  of how loaded the week is.
- **Delete/Clear all** now confirm via an in-app dialog instead of
  `confirm()`/`alert()` browser popups.
- GitHub/LinkedIn links and the Documentation page are preserved, now in
  the sidebar footer. `Documentation.html` is served as-is from `public/`.

## Structure

```
src/
  components/
    Sidebar.jsx       # nav + counts + social/doc links
    Topbar.jsx         # search, mobile menu toggle, new-task button
    TaskList.jsx        # grouping, empty states, timeline rail
    TaskCard.jsx          # single task row
    TaskDrawer.jsx          # add/edit slide-over form
    ConfirmDialog.jsx         # delete/clear-all confirmation
    EmptyState.jsx              # per-view empty messaging
  lib/
    useTasks.js        # CRUD + localStorage + counts
    date.js             # urgency/grouping/date formatting helpers
  App.jsx
  index.css            # design tokens (@theme), fonts
```

## Notes

- Priority (low/normal/high) is a new field not present in the original —
  it's optional and defaults to "normal."
- Task data model is `{ id, task, des, deadline, priority, completed }`.
  If you want to migrate tasks from the original app's `localStorage`
  ("tasks" key), map each entry to this shape and write it under
  `todo-modern-tasks`.
