import React, { useState, useEffect } from 'react';
import { Search, Plus, LayoutGrid, Kanban as Kanbans, Calendar, List, BarChart3, LogOut, CheckSquare, Zap, X } from 'lucide-react';

export default function CommandPalette({
  isOpen,
  onClose,
  tasks,
  onSelectTask,
  onOpenCreateModal,
  onSwitchView,
  onOpenAnalytics,
  onToggleDemo,
  isDemo,
  onLogout
}) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickActions = [
    { id: 'create', icon: Plus, title: 'Create New Task', action: () => { onClose(); onOpenCreateModal(); } },
    { id: 'analytics', icon: BarChart3, title: 'Open Productivity Analytics', action: () => { onClose(); onOpenAnalytics(); } },
    { id: 'view-grid', icon: LayoutGrid, title: 'Switch to Grid View', action: () => { onClose(); onSwitchView('grid'); } },
    { id: 'view-kanban', icon: Kanbans, title: 'Switch to Kanban Board', action: () => { onClose(); onSwitchView('kanban'); } },
    { id: 'view-calendar', icon: Calendar, title: 'Switch to Calendar View', action: () => { onClose(); onSwitchView('calendar'); } },
    { id: 'view-table', icon: List, title: 'Switch to Table View', action: () => { onClose(); onSwitchView('table'); } },
    { id: 'demo', icon: Zap, title: isDemo ? 'Disable Demo Mode' : 'Enable Demo Mode', action: () => { onClose(); onToggleDemo(); } },
    { id: 'logout', icon: LogOut, title: 'Log Out', action: () => { onClose(); onLogout(); } },
  ];

  // Filter tasks based on query
  const filteredTasks = query.trim()
    ? tasks.filter((t) =>
        t.title.toLowerCase().includes(query.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(query.toLowerCase())) ||
        (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase())))
      )
    : [];

  const filteredActions = query.trim()
    ? quickActions.filter((a) => a.title.toLowerCase().includes(query.toLowerCase()))
    : quickActions;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div
        className="w-full max-w-2xl bg-[#0a1020]/95 border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input header */}
        <div className="flex items-center px-4 py-3.5 border-b border-white/10 gap-3">
          <Search className="w-5 h-5 text-amber-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search tasks, tags, assignees... (ESC to exit)"
            className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none"
          />
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-4">
          {/* Matched Tasks */}
          {filteredTasks.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Matching Tasks ({filteredTasks.length})
              </div>
              <div className="space-y-1 mt-1">
                {filteredTasks.slice(0, 6).map((task) => (
                  <button
                    key={task._id}
                    onClick={() => {
                      onClose();
                      onSelectTask(task);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/[0.08] text-left transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <CheckSquare className="w-4 h-4 text-amber-400 shrink-0" />
                      <div className="truncate">
                        <p className="text-sm font-medium text-slate-200 group-hover:text-white truncate">
                          {task.title}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {task.status} • {task.priority} Priority
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono px-2 py-0.5 rounded bg-white/5">
                      Open
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          {filteredActions.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Actions & Navigation
              </div>
              <div className="space-y-1 mt-1">
                {filteredActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      onClick={action.action}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/[0.08] text-left transition-colors text-slate-300 hover:text-white text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-slate-400" />
                        <span>{action.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">↵ Run</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {filteredTasks.length === 0 && filteredActions.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-sm">
              No matching commands or tasks found for "{query}"
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 border-t border-white/[0.06] bg-white/[0.02] flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-mono">ESC</kbd> Close</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-mono">⌘K</kbd> Toggle Palette</span>
          </div>
          <span>TaskManagerPro Command Engine</span>
        </div>
      </div>
    </div>
  );
}
