import React from 'react';
import { Plus, MoreHorizontal, User, Tag, Calendar, CheckSquare, MessageSquare, Paperclip, Clock } from 'lucide-react';

const COLUMNS = [
  { id: 'Todo', title: 'To Do', color: 'border-slate-500/30 text-slate-300', countBg: 'bg-slate-500/20 text-slate-300', dot: 'bg-slate-400' },
  { id: 'In Progress', title: 'In Progress', color: 'border-amber-500/30 text-amber-300', countBg: 'bg-amber-500/20 text-amber-300', dot: 'bg-amber-400 animate-pulse' },
  { id: 'On Hold', title: 'On Hold', color: 'border-violet-500/30 text-violet-300', countBg: 'bg-violet-500/20 text-violet-300', dot: 'bg-violet-400' },
  { id: 'Completed', title: 'Completed', color: 'border-emerald-500/30 text-emerald-300', countBg: 'bg-emerald-500/20 text-emerald-300', dot: 'bg-emerald-400' },
];

const priorityColors = {
  Low: 'border-slate-500/30 bg-slate-500/10 text-slate-300',
  Medium: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
  High: 'border-orange-500/30 bg-orange-500/10 text-orange-300',
  Urgent: 'border-red-500/30 bg-red-500/10 text-red-300 animate-pulse',
};

export default function KanbanBoard({ tasks, onEdit, onDelete, onStatusChange, onOpenCreateModal }) {
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      onStatusChange(taskId, targetStatus);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 pb-6">
      {COLUMNS.map((column) => {
        const columnTasks = tasks.filter((t) => (t.status || 'Todo') === column.id);

        return (
          <div
            key={column.id}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
            className="flex flex-col bg-[#0a1020]/60 backdrop-blur-md rounded-2xl border border-white/[0.08] p-4 min-h-[500px] transition-colors duration-200 hover:border-white/15"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <span className={`w-2.5 h-2.5 rounded-full ${column.dot}`} />
                <h3 className="font-semibold text-sm text-white">{column.title}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${column.countBg}`}>
                  {columnTasks.length}
                </span>
              </div>
              <button
                onClick={() => onOpenCreateModal({ status: column.id })}
                className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title={`Add task to ${column.title}`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Task List in Column */}
            <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1">
              {columnTasks.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-xl p-6 text-center text-slate-500">
                  <p className="text-xs">Drag tasks here or click +</p>
                </div>
              ) : (
                columnTasks.map((task) => {
                  const completedSubtasks = task.subtasks?.filter((s) => s.completed)?.length || 0;
                  const totalSubtasks = task.subtasks?.length || 0;

                  return (
                    <div
                      key={task._id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task._id)}
                      onClick={() => onEdit(task)}
                      className="group bg-[#0d1528] hover:bg-[#121c35] border border-white/[0.08] hover:border-amber-500/40 rounded-xl p-3.5 shadow-lg transition-all duration-200 cursor-grab active:cursor-grabbing hover:-translate-y-0.5"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span
                          className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                            priorityColors[task.priority] || priorityColors.Medium
                          }`}
                        >
                          {task.priority || 'Medium'}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(task);
                            }}
                            className="text-slate-400 hover:text-amber-400 p-0.5 rounded"
                          >
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className="text-sm font-semibold text-slate-100 group-hover:text-amber-200 transition-colors line-clamp-2 mb-1.5">
                        {task.title}
                      </h4>

                      {task.description && (
                        <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                          {task.description}
                        </p>
                      )}

                      {/* Subtasks Progress Bar if present */}
                      {totalSubtasks > 0 && (
                        <div className="mb-3 bg-white/5 rounded-md p-1.5 border border-white/5">
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                            <span className="flex items-center gap-1">
                              <CheckSquare className="w-3 h-3 text-amber-400" />
                              Subtasks
                            </span>
                            <span>{completedSubtasks}/{totalSubtasks}</span>
                          </div>
                          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-500 rounded-full transition-all duration-300"
                              style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Tags */}
                      {task.tags && task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {task.tags.slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] bg-indigo-500/15 text-indigo-300 px-1.5 py-0.5 rounded flex items-center gap-0.5"
                            >
                              <Tag className="w-2.5 h-2.5 opacity-70" />
                              {tag}
                            </span>
                          ))}
                          {task.tags.length > 3 && (
                            <span className="text-[10px] text-slate-500">+{task.tags.length - 3}</span>
                          )}
                        </div>
                      )}

                      {/* Card Footer */}
                      <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-xs text-slate-400">
                        <div className="flex items-center gap-1.5">
                          {task.assignedTo?.avatar ? (
                            <img
                              src={task.assignedTo.avatar}
                              alt={task.assignedTo.name}
                              className="w-5 h-5 rounded-full object-cover border border-white/20"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] flex items-center justify-center font-bold">
                              {task.assignedTo?.name ? task.assignedTo.name.charAt(0) : '?'}
                            </div>
                          )}
                          <span className="text-[11px] truncate max-w-[80px]">
                            {task.assignedTo?.name || 'Unassigned'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px]">
                          {task.comments && task.comments.length > 0 && (
                            <span className="flex items-center gap-0.5 text-slate-400">
                              <MessageSquare className="w-3 h-3 text-slate-500" />
                              {task.comments.length}
                            </span>
                          )}
                          {task.dueDate && (
                            <span className="flex items-center gap-1 text-slate-400">
                              <Calendar className="w-3 h-3 text-slate-500" />
                              {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
