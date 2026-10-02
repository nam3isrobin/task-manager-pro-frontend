import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, AlertTriangle, User, Tag } from 'lucide-react';

const priorityColors = {
  Low: 'border-slate-500/30 bg-slate-500/10 text-slate-300',
  Medium: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
  High: 'border-orange-500/30 bg-orange-500/10 text-orange-300',
  Urgent: 'border-red-500/30 bg-red-500/10 text-red-300',
};

export default function CalendarView({ tasks, onEdit, onOpenCreateModal }) {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 8, 1)); // Sep 2026

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Group tasks by date string (YYYY-MM-DD)
  const tasksByDate = {};
  tasks.forEach((task) => {
    if (task.dueDate) {
      const d = new Date(task.dueDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!tasksByDate[key]) tasksByDate[key] = [];
      tasksByDate[key].push(task);
    }
  });

  const daysArray = [];
  // Empty slots before 1st of month
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push(null);
  }
  // Days of month
  for (let d = 1; d <= daysInMonth; d++) {
    daysArray.push(d);
  }

  return (
    <div className="bg-[#0a1020]/70 backdrop-blur-md rounded-2xl border border-white/[0.08] p-5 shadow-2xl pb-6">
      {/* Calendar Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 mb-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              {monthNames[month]} {year}
            </h2>
            <p className="text-xs text-slate-400">View tasks by delivery due date schedule</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
          >
            Today
          </button>
          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-0.5">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
        <span>Sun</span>
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {daysArray.map((day, idx) => {
          if (!day) {
            return (
              <div
                key={`empty-${idx}`}
                className="min-h-[110px] bg-white/[0.01] border border-white/[0.03] rounded-xl p-2 opacity-30"
              />
            );
          }

          const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayTasks = tasksByDate[dateKey] || [];
          const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

          return (
            <div
              key={`day-${day}`}
              onClick={() => onOpenCreateModal({ dueDate: new Date(year, month, day).toISOString() })}
              className={`min-h-[110px] bg-[#0d1528]/80 hover:bg-[#121c35] border rounded-xl p-2 transition-all cursor-pointer flex flex-col group ${
                isToday ? 'border-amber-500/50 shadow-lg shadow-amber-500/10' : 'border-white/[0.06] hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                    isToday ? 'bg-amber-500 text-slate-900' : 'text-slate-300 group-hover:text-amber-400'
                  }`}
                >
                  {day}
                </span>
                {dayTasks.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-medium">
                    {dayTasks.length}
                  </span>
                )}
              </div>

              {/* Tasks within this day */}
              <div className="flex-1 flex flex-col gap-1 overflow-y-auto max-h-[80px] pr-0.5">
                {dayTasks.map((task) => (
                  <div
                    key={task._id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(task);
                    }}
                    className={`text-[11px] p-1.5 rounded-lg border truncate font-medium transition-all hover:scale-[1.02] ${
                      task.status === 'Completed'
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20 line-through opacity-75'
                        : task.priority === 'Urgent'
                        ? 'bg-red-500/15 text-red-200 border-red-500/30'
                        : 'bg-white/5 text-slate-200 border-white/10 hover:border-amber-500/30'
                    }`}
                    title={`${task.title} (${task.status})`}
                  >
                    <span className="truncate">{task.title}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
