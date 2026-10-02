import React, { useState } from 'react';
import { Calendar, User, Tag, Trash2, Edit2, CheckCircle2, Clock, AlertTriangle, ArrowUpDown, ChevronDown } from 'lucide-react';

const priorityColors = {
  Low: 'bg-slate-500/15 text-slate-300 border-slate-500/20',
  Medium: 'bg-blue-500/15 text-blue-300 border-blue-500/20',
  High: 'bg-orange-500/15 text-orange-300 border-orange-500/20',
  Urgent: 'bg-red-500/15 text-red-300 border-red-500/20',
};

const statusColors = {
  Todo: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
  'In Progress': 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  Completed: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  'On Hold': 'bg-violet-500/15 text-violet-300 border-violet-500/30',
};

export default function TaskTableView({ tasks, onEdit, onDelete, onStatusChange }) {
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  const [sortField, setSortField] = useState('createdAt');
  const [sortAsc, setSortAsc] = useState(false);

  const toggleSelectAll = () => {
    if (selectedTasks.size === tasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(tasks.map((t) => t._id)));
    }
  };

  const toggleSelectTask = (id) => {
    const next = new Set(selectedTasks);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedTasks(next);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    let valA = a[sortField] || '';
    let valB = b[sortField] || '';
    if (sortField === 'assignee') {
      valA = a.assignedTo?.name || '';
      valB = b.assignedTo?.name || '';
    }
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  return (
    <div className="bg-[#0a1020]/70 backdrop-blur-md rounded-2xl border border-white/[0.08] shadow-2xl overflow-hidden pb-2">
      {/* Batch toolbar if items are selected */}
      {selectedTasks.size > 0 && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-3 flex items-center justify-between">
          <span className="text-xs font-semibold text-amber-300">
            {selectedTasks.size} task{selectedTasks.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                Array.from(selectedTasks).forEach((id) => onStatusChange(id, 'Completed'));
                setSelectedTasks(new Set());
              }}
              className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-medium transition-colors"
            >
              Mark Completed
            </button>
            <button
              onClick={() => {
                Array.from(selectedTasks).forEach((id) => onDelete(id));
                setSelectedTasks(new Set());
              }}
              className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-lg text-xs font-medium transition-colors"
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/[0.08] bg-white/[0.02] text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <th className="py-3.5 pl-6 pr-3 w-10">
                <input
                  type="checkbox"
                  checked={tasks.length > 0 && selectedTasks.size === tasks.length}
                  onChange={toggleSelectAll}
                  className="rounded border-white/20 bg-white/5 text-amber-500 focus:ring-amber-500"
                />
              </th>
              <th
                onClick={() => handleSort('title')}
                className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Task Title</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('status')}
                className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors w-36"
              >
                <div className="flex items-center gap-1.5">
                  <span>Status</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('priority')}
                className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors w-32"
              >
                <div className="flex items-center gap-1.5">
                  <span>Priority</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('assignee')}
                className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors w-44"
              >
                <div className="flex items-center gap-1.5">
                  <span>Assignee</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('dueDate')}
                className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors w-36"
              >
                <div className="flex items-center gap-1.5">
                  <span>Due Date</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-3.5 pr-6 pl-4 text-right w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04] text-sm">
            {sortedTasks.map((task) => {
              const isSelected = selectedTasks.has(task._id);

              return (
                <tr
                  key={task._id}
                  className={`group transition-colors ${
                    isSelected ? 'bg-amber-500/[0.06]' : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <td className="py-3.5 pl-6 pr-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectTask(task._id)}
                      className="rounded border-white/20 bg-white/5 text-amber-500 focus:ring-amber-500"
                    />
                  </td>
                  <td className="py-3.5 px-4">
                    <div
                      onClick={() => onEdit(task)}
                      className="font-medium text-slate-100 group-hover:text-amber-300 cursor-pointer transition-colors"
                    >
                      {task.title}
                    </div>
                    {task.tags && task.tags.length > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        {task.tags.slice(0, 2).map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] bg-indigo-500/10 text-indigo-300 px-1.5 py-0.2 rounded border border-indigo-500/20"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <select
                      value={task.status || 'Todo'}
                      onChange={(e) => onStatusChange(task._id, e.target.value)}
                      className={`text-xs font-semibold rounded-lg px-2.5 py-1 border transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                        statusColors[task.status] || statusColors.Todo
                      }`}
                    >
                      <option value="Todo" className="bg-[#0a0f1e] text-white">To Do</option>
                      <option value="In Progress" className="bg-[#0a0f1e] text-white">In Progress</option>
                      <option value="On Hold" className="bg-[#0a0f1e] text-white">On Hold</option>
                      <option value="Completed" className="bg-[#0a0f1e] text-white">Completed</option>
                    </select>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        priorityColors[task.priority] || priorityColors.Medium
                      }`}
                    >
                      {task.priority || 'Medium'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
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
                      <span className="text-xs text-slate-300 truncate max-w-[120px]">
                        {task.assignedTo?.name || 'Unassigned'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-400">
                    {task.dueDate ? (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-3.5 pr-6 pl-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onEdit(task)}
                        className="p-1 text-slate-400 hover:text-amber-400 hover:bg-white/5 rounded-lg transition-colors"
                        title="Edit Task"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(task._id)}
                        className="p-1 text-slate-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
                        title="Delete Task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
