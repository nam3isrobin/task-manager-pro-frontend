import React from 'react';
import { X, CheckCircle2, Clock, AlertTriangle, Layers, TrendingUp, Users, PieChart, ShieldAlert } from 'lucide-react';

export default function AnalyticsModal({ isOpen, onClose, tasks = [] }) {
  if (!isOpen) return null;

  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'Completed').length;
  const inProgress = tasks.filter((t) => t.status === 'In Progress').length;
  const todo = tasks.filter((t) => (t.status || 'Todo') === 'Todo').length;
  const onHold = tasks.filter((t) => t.status === 'On Hold').length;

  const urgent = tasks.filter((t) => t.priority === 'Urgent').length;
  const high = tasks.filter((t) => t.priority === 'High').length;
  const medium = tasks.filter((t) => t.priority === 'Medium').length;
  const low = tasks.filter((t) => t.priority === 'Low').length;

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Calculate overdue tasks
  const now = new Date();
  const overdue = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'Completed'
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div
        className="w-full max-w-4xl bg-[#0a1020]/95 border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Productivity & Sprint Analytics</h2>
              <p className="text-xs text-slate-400">Real-time breakdown of workspace health and velocity</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Top Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completion Rate</p>
              <p className="text-3xl font-extrabold text-emerald-400 mt-1">{completionRate}%</p>
              <p className="text-[11px] text-slate-400 mt-1">{completed} of {total} tasks closed</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Sprints</p>
              <p className="text-3xl font-extrabold text-amber-400 mt-1">{inProgress}</p>
              <p className="text-[11px] text-slate-400 mt-1">In progress right now</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Urgent Attention</p>
              <p className="text-3xl font-extrabold text-red-400 mt-1">{urgent}</p>
              <p className="text-[11px] text-slate-400 mt-1">Urgent priority items</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overdue Alerts</p>
              <p className="text-3xl font-extrabold text-orange-400 mt-1">{overdue}</p>
              <p className="text-[11px] text-slate-400 mt-1">Past delivery due date</p>
            </div>
          </div>

          {/* Status Breakdown Section */}
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Status Progression Breakdown
            </h3>
            <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden flex gap-0.5">
              <div style={{ width: `${(completed / (total || 1)) * 100}%` }} className="h-full bg-emerald-500 transition-all" title="Completed" />
              <div style={{ width: `${(inProgress / (total || 1)) * 100}%` }} className="h-full bg-amber-500 transition-all" title="In Progress" />
              <div style={{ width: `${(todo / (total || 1)) * 100}%` }} className="h-full bg-slate-500 transition-all" title="To Do" />
              <div style={{ width: `${(onHold / (total || 1)) * 100}%` }} className="h-full bg-violet-500 transition-all" title="On Hold" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-slate-300">Completed: <strong>{completed}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-slate-300">In Progress: <strong>{inProgress}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-500" />
                <span className="text-slate-300">To Do: <strong>{todo}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-violet-500" />
                <span className="text-slate-300">On Hold: <strong>{onHold}</strong></span>
              </div>
            </div>
          </div>

          {/* Priority Severity Distribution */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                Priority Severity Distribution
              </h3>
              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between mb-1 text-slate-300">
                    <span>Urgent Priority</span>
                    <span className="font-bold text-red-400">{urgent}</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div style={{ width: `${(urgent / (total || 1)) * 100}%` }} className="h-full bg-red-500" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1 text-slate-300">
                    <span>High Priority</span>
                    <span className="font-bold text-orange-400">{high}</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div style={{ width: `${(high / (total || 1)) * 100}%` }} className="h-full bg-orange-500" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1 text-slate-300">
                    <span>Medium Priority</span>
                    <span className="font-bold text-blue-400">{medium}</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div style={{ width: `${(medium / (total || 1)) * 100}%` }} className="h-full bg-blue-500" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1 text-slate-300">
                    <span>Low Priority</span>
                    <span className="font-bold text-slate-400">{low}</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div style={{ width: `${(low / (total || 1)) * 100}%` }} className="h-full bg-slate-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Team Velocity Summary */}
            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  Workspace Health Summary
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Your team has achieved a <strong>{completionRate}%</strong> completion rate.
                  {overdue > 0 ? (
                    <span className="text-orange-400 block mt-2">
                      ⚠️ Note: {overdue} active task{overdue > 1 ? 's are' : ' is'} overdue and requires escalation.
                    </span>
                  ) : (
                    <span className="text-emerald-400 block mt-2">
                      ✨ Great job! Zero overdue tasks in this active cycle.
                    </span>
                  )}
                </p>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                <span>Total Work Items: <strong>{total}</strong></span>
                <button
                  onClick={onClose}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
