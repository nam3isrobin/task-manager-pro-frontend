import React from 'react';
import { Calendar, User, Tag, Trash2, Edit2, Paperclip, AlertTriangle } from 'lucide-react';

export default function TaskCard({ task, onEdit, onDelete, onStatusChange }) {
  const priorityConfig = {
    Urgent: {
      badge: 'bg-red-500/15 text-red-300 border-red-500/40',
      dot: 'bg-red-400',
      bar: 'bg-red-500',
    },
    High: {
      badge: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
      dot: 'bg-amber-400',
      bar: 'bg-amber-500',
    },
    Medium: {
      badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40',
      dot: 'bg-indigo-400',
      bar: 'bg-indigo-500',
    },
    Low: {
      badge: 'bg-slate-500/15 text-slate-300 border-slate-500/40',
      dot: 'bg-slate-400',
      bar: 'bg-slate-500',
    },
  };

  const statusColors = {
    Todo: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    'In Progress': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    Completed: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    'On Hold': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  };

  const assignedUser = task.assignedTo || task.assignee;
  const assigneeName = typeof assignedUser === 'object' && assignedUser !== null ? assignedUser.name : (typeof assignedUser === 'string' ? assignedUser : 'Unassigned');

  // Generate initials for avatar badge
  const getInitials = (name) => {
    if (!name || name === 'Unassigned') return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // Safe date check & overdue detection
  let formattedDate = '';
  let isOverdue = false;
  if (task.dueDate) {
    try {
      const parsedDate = new Date(task.dueDate);
      if (!isNaN(parsedDate.getTime())) {
        formattedDate = parsedDate.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: parsedDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
        });
        isOverdue = task.status !== 'Completed' && parsedDate.getTime() < Date.now();
      }
    } catch {
      // ignore
    }
  }

  const priority = task.priority || 'Medium';
  const priorityStyle = priorityConfig[priority] || priorityConfig.Medium;

  return (
    <div className="group bg-[#0d1528]/85 backdrop-blur-md border border-white/10 rounded-2xl p-5 hover:-translate-y-1 hover:border-amber-500/30 hover:shadow-glass-lg transition-all duration-200 flex flex-col justify-between animate-fade-in relative overflow-hidden">
      {/* Priority accent top bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${priorityStyle.bar} opacity-60 group-hover:opacity-100 transition-opacity`} />

      <div>
        {/* Header: Title & Priority Pill */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <h3
            className="text-sm sm:text-base font-semibold text-slate-100 group-hover:text-white line-clamp-1 flex-1 tracking-tight"
            title={task.title}
          >
            {task.title}
          </h3>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border shrink-0 ${priorityStyle.badge}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${priorityStyle.dot}`} />
            {priority}
          </span>
        </div>

        {/* Description */}
        <p className="text-xs sm:text-sm text-slate-400 line-clamp-2 mb-4 leading-relaxed">
          {task.description || 'No description provided.'}
        </p>

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {task.tags.map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-md text-xs px-2 py-0.5"
              >
                <Tag className="w-3 h-3 mr-1 opacity-70" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info & Actions */}
      <div className="border-t border-white/8 pt-3.5 mt-auto space-y-3">
        {/* Assignee & Due Date Row */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-bold text-[10px]" title={assigneeName}>
              {getInitials(assigneeName)}
            </div>
            <span className="truncate max-w-[110px] text-slate-300">
              {assigneeName}
            </span>
          </div>

          {formattedDate && (
            <div
              className={`flex items-center space-x-1 font-medium ${
                isOverdue ? 'text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20' : 'text-slate-400'
              }`}
              title={isOverdue ? 'Task is overdue!' : 'Due Date'}
            >
              {isOverdue ? <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> : <Calendar className="w-3.5 h-3.5 text-slate-500" />}
              <span>{formattedDate}</span>
            </div>
          )}
        </div>

        {/* Status Dropdown & Action Buttons */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center space-x-2">
            <select
              value={task.status}
              onChange={(e) => onStatusChange(task._id, e.target.value)}
              className={`text-xs font-semibold rounded-lg px-2.5 py-1 border focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors cursor-pointer ${
                statusColors[task.status] || 'bg-slate-500/20 text-slate-300 border-slate-500/30'
              }`}
              aria-label="Update task status"
            >
              <option value="Todo" className="bg-[#0d1528] text-slate-200">Todo</option>
              <option value="In Progress" className="bg-[#0d1528] text-amber-300">In Progress</option>
              <option value="Completed" className="bg-[#0d1528] text-emerald-300">Completed</option>
              <option value="On Hold" className="bg-[#0d1528] text-purple-300">On Hold</option>
            </select>

            {task.attachments && task.attachments.length > 0 && (
              <span
                className="inline-flex items-center text-xs text-slate-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/5"
                title={`${task.attachments.length} attachment(s)`}
              >
                <Paperclip className="w-3.5 h-3.5 mr-0.5 text-slate-500" />
                {task.attachments.length}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => onEdit(task)}
              className="text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400"
              title="Edit Task"
              aria-label="Edit task"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(task._id)}
              className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-400"
              title="Delete Task"
              aria-label="Delete task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

