import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import TaskFilters from '../components/TaskFilters';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import ConfirmModal from '../components/ConfirmModal';
import KanbanBoard from '../components/KanbanBoard';
import CalendarView from '../components/CalendarView';
import TaskTableView from '../components/TaskTableView';
import CommandPalette from '../components/CommandPalette';
import AnalyticsModal from '../components/AnalyticsModal';
import AdminUserManagementModal from '../components/AdminUserManagementModal';
import { useToast } from '../context/ToastContext';
import { getTasks, createTask, updateTask, deleteTask } from '../services/taskService';
import { sanitizeErrorMessage } from '../utils/errorSanitizer';
import { useAuth } from '../context/AuthContext';
import { resetMockData } from '../mock/mockService';
import {
  Plus,
  CheckCircle,
  Clock,
  AlertTriangle,
  Layers,
  Loader2,
  Zap,
  RotateCcw,
  Search,
  Sparkles,
  LayoutGrid,
  Kanban as Kanbans,
  Calendar,
  List,
  BarChart3,
  TrendingUp,
  Command,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

const VIEW_STORAGE_KEY = 'taskmanager_active_view';

export default function DashboardPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ search: '', status: '', priority: '', sort: '-createdAt' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  // View Switcher & Tooling states
  const [currentView, setCurrentView] = useState(() => {
    try {
      return localStorage.getItem(VIEW_STORAGE_KEY) || 'grid';
    } catch {
      return 'grid';
    }
  });
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);

  const { user, isDemo, disableDemoMode, enableDemoMode, logout } = useAuth();
  const toast = useToast();

  const handleViewChange = (view) => {
    setCurrentView(view);
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, view);
    } catch {
      // ignore
    }
  };

  // Keyboard shortcut for Command Palette (⌘K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      if (!params.search) delete params.search;
      if (!params.status) delete params.status;
      if (!params.priority) delete params.priority;

      const response = await getTasks(params);
      setTasks(response.data || []);
      if (response.total !== undefined) {
        setPagination((prev) => ({ ...prev, total: response.total }));
      }
    } catch (err) {
      const msg = sanitizeErrorMessage(err, 'Failed to fetch tasks');
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters({ search: '', status: '', priority: '', sort: '-createdAt' });
  };

  const handleOpenCreateModal = (initialData = null) => {
    setEditingTask(initialData);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleSaveTask = async (id, taskData) => {
    try {
      if (id) {
        await updateTask(id, taskData);
        toast.success('Task Updated', `"${taskData.title || 'Task'}" was updated successfully.`);
      } else {
        await createTask(taskData);
        toast.success('Task Created', `"${taskData.title || 'Task'}" has been created.`);
      }
      fetchTasks();
    } catch (err) {
      const msg = sanitizeErrorMessage(err, 'Failed to save task');
      setError(msg);
      toast.error('Save Failed', msg);
    }
  };

  const handleDeleteTask = (id) => {
    setDeleteTargetId(id);
    setIsConfirmOpen(true);
  };

  const confirmDeleteTask = async () => {
    if (!deleteTargetId) return;
    const targetTask = tasks.find((t) => t._id === deleteTargetId);
    const targetId = deleteTargetId;
    try {
      await deleteTask(targetId);
      setIsConfirmOpen(false);
      setDeleteTargetId(null);
      fetchTasks();

      toast.error('Task Deleted', `"${targetTask?.title || 'Task'}" was permanently deleted.`, {
        label: 'Undo',
        onClick: async () => {
          if (targetTask) {
            try {
              const { _id, createdAt, updatedAt, __v, ...rest } = targetTask;
              await createTask(rest);
              fetchTasks();
              toast.success('Task Restored', `"${targetTask.title}" has been restored.`);
            } catch (err) {
              toast.error('Restore Failed', 'Unable to restore task.');
            }
          }
        },
      });
    } catch (err) {
      const msg = sanitizeErrorMessage(err, 'Failed to delete task');
      setError(msg);
      toast.error('Delete Failed', msg);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    const targetTask = tasks.find((t) => t._id === id);
    try {
      await updateTask(id, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) => (t._id === id ? { ...t, status: newStatus } : t))
      );
      toast.info('Status Updated', `"${targetTask?.title || 'Task'}" is now marked as ${newStatus}.`);
    } catch (err) {
      const msg = sanitizeErrorMessage(err, 'Failed to update task status');
      setError(msg);
      toast.error('Status Update Failed', msg);
    }
  };

  const handleResetDemoData = async () => {
    resetMockData();
    setResetMessage('Demo tasks reset to default seeds.');
    setTimeout(() => setResetMessage(''), 3000);
    fetchTasks();
    toast.info('Demo Data Reset', 'Workspace tasks restored to default seed state.');
  };

  // Stats calculations
  const totalTasks = tasks.length;
  const completedCount = tasks.filter((t) => t.status === 'Completed').length;
  const inProgressCount = tasks.filter((t) => t.status === 'In Progress').length;
  const urgentCount = tasks.filter((t) => t.priority === 'Urgent').length;

  const hasActiveFilters = Boolean(
    (filters.search && filters.search.trim()) ||
    filters.status ||
    filters.priority
  );

  const viewOptions = [
    { id: 'grid', label: 'Grid', icon: LayoutGrid },
    { id: 'kanban', label: 'Kanban Board', icon: Kanbans },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'table', label: 'Table', icon: List },
  ];

  return (
    <div
      className="min-h-screen bg-[#060b18] flex flex-col selection:bg-indigo-500/30 selection:text-white"
      style={{ background: 'linear-gradient(160deg, #060b18 0%, #0a0f1e 50%, #060b18 100%)' }}
    >
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Demo Mode Notice Banner */}
        {isDemo && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-indigo-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-glass animate-fade-in">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-amber-300">Demo Mode Active</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                    Offline Mock
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Full CRUD simulated in client memory. No backend server required.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
              <button
                onClick={handleResetDemoData}
                className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400"
                title="Reset tasks to initial seeded enterprise tasks"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                Reset Demo Data
              </button>
              <button
                onClick={disableDemoMode}
                className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40"
              >
                Exit Demo
              </button>
            </div>
          </div>
        )}

        {/* Reset Feedback Notification */}
        {resetMessage && (
          <div className="mb-6 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl p-3.5 text-xs sm:text-sm flex items-center animate-fade-in">
            <CheckCircle className="w-4 h-4 mr-2 shrink-0" />
            <span>{resetMessage}</span>
          </div>
        )}

        {/* Dashboard Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Task Dashboard</h1>
              <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/5 text-slate-400 border border-white/10">
                Workspace
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">Manage, schedule, and track team tasks across workflows</p>
          </div>

          {/* Quick Actions Header Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* Command Palette Trigger */}
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 rounded-xl text-xs sm:text-sm font-medium transition-all shadow-sm"
              title="Open Command Palette (⌘K)"
            >
              <Command className="w-4 h-4 text-amber-400" />
              <span>Search & Commands</span>
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono text-slate-400">
                ⌘K
              </kbd>
            </button>

            {/* Analytics Modal Trigger */}
            <button
              onClick={() => setIsAnalyticsOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 rounded-xl text-xs sm:text-sm font-medium transition-all shadow-sm"
              title="Open Sprint & Productivity Analytics"
            >
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              <span>Analytics</span>
            </button>

            {/* Admin User Management Trigger (Admin only) */}
            {user?.role === 'admin' && (
              <button
                onClick={() => setIsUserManagementOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm"
                title="Review & approve pending candidate accounts"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>User Approvals</span>
              </button>
            )}

            {/* New Task Button */}
            <button
              onClick={() => handleOpenCreateModal()}
              className="inline-flex items-center justify-center min-h-[38px] px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-xl shadow-lg shadow-amber-500/25 transition-all text-xs sm:text-sm active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              New Task
            </button>
          </div>
        </div>

        {/* Metric Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">
          {/* Total Tasks */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 hover:-translate-y-0.5 hover:border-indigo-500/30 hover:shadow-glass-lg transition-all duration-200 flex items-center justify-between group">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Tasks</p>
              <p className="text-2xl sm:text-3xl font-bold text-white mt-1 tracking-tight">{totalTasks}</p>
              <p className="text-[11px] text-slate-500 mt-1">All workspace items</p>
            </div>
            <div className="bg-indigo-500/15 group-hover:bg-indigo-500/25 border border-indigo-500/30 p-3 rounded-2xl text-indigo-400 transition-colors">
              <Layers className="w-6 h-6" />
            </div>
          </div>

          {/* In Progress */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 hover:-translate-y-0.5 hover:border-amber-500/30 hover:shadow-glass-lg transition-all duration-200 flex items-center justify-between group">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">In Progress</p>
              <p className="text-2xl sm:text-3xl font-bold text-amber-400 mt-1 tracking-tight">{inProgressCount}</p>
              <p className="text-[11px] text-slate-500 mt-1">Actively in workflow</p>
            </div>
            <div className="bg-amber-500/15 group-hover:bg-amber-500/25 border border-amber-500/30 p-3 rounded-2xl text-amber-400 transition-colors">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          {/* Completed */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 hover:-translate-y-0.5 hover:border-emerald-500/30 hover:shadow-glass-lg transition-all duration-200 flex items-center justify-between group">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completed</p>
              <p className="text-2xl sm:text-3xl font-bold text-emerald-400 mt-1 tracking-tight">{completedCount}</p>
              <p className="text-[11px] text-slate-500 mt-1">Finished & resolved</p>
            </div>
            <div className="bg-emerald-500/15 group-hover:bg-emerald-500/25 border border-emerald-500/30 p-3 rounded-2xl text-emerald-400 transition-colors">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>

          {/* Urgent Priority */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 hover:-translate-y-0.5 hover:border-red-500/30 hover:shadow-glass-lg transition-all duration-200 flex items-center justify-between group">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Urgent Priority</p>
              <p className="text-2xl sm:text-3xl font-bold text-red-400 mt-1 tracking-tight">{urgentCount}</p>
              <p className="text-[11px] text-slate-500 mt-1">Immediate attention</p>
            </div>
            <div className="bg-red-500/15 group-hover:bg-red-500/25 border border-red-500/30 p-3 rounded-2xl text-red-400 transition-colors">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* View Switcher Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center p-1 bg-[#0a1020]/90 backdrop-blur-md border border-white/10 rounded-2xl shadow-inner">
            {viewOptions.map((view) => {
              const Icon = view.icon;
              const isActive = currentView === view.id;
              return (
                <button
                  key={view.id}
                  onClick={() => handleViewChange(view.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                  aria-pressed={isActive}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                  <span>{view.label}</span>
                </button>
              );
            })}
          </div>

          <div className="text-xs text-slate-400 font-medium">
            Showing <span className="text-white font-semibold">{tasks.length}</span> task{tasks.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Filters Toolbar */}
        <TaskFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
        />

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl p-4 text-sm flex items-center justify-between animate-shake">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError('')}
              className="text-xs text-red-300 hover:text-white underline ml-4 font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Dynamic Views & Differentiated Empty States */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-24 space-y-3">
            <Loader2 className="w-9 h-9 animate-spin text-amber-500" />
            <p className="text-sm text-slate-400">Loading workspace tasks...</p>
          </div>
        ) : tasks.length > 0 ? (
          <div>
            {currentView === 'kanban' && (
              <KanbanBoard
                tasks={tasks}
                onEdit={handleOpenEditModal}
                onDelete={handleDeleteTask}
                onStatusChange={handleStatusChange}
                onOpenCreateModal={handleOpenCreateModal}
              />
            )}

            {currentView === 'calendar' && (
              <CalendarView
                tasks={tasks}
                onEdit={handleOpenEditModal}
                onOpenCreateModal={handleOpenCreateModal}
              />
            )}

            {currentView === 'table' && (
              <TaskTableView
                tasks={tasks}
                onEdit={handleOpenEditModal}
                onDelete={handleDeleteTask}
                onStatusChange={handleStatusChange}
              />
            )}

            {currentView === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {tasks.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    onEdit={handleOpenEditModal}
                    onDelete={handleDeleteTask}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            )}
          </div>
        ) : hasActiveFilters ? (
          /* Filtered Empty State */
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-12 sm:p-16 text-center max-w-lg mx-auto shadow-glass animate-fade-in">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Search className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-semibold text-slate-200 mb-1">No tasks match your filters</h3>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              We couldn't find any tasks matching your search keywords or filter criteria. Try resetting filters to view all tasks.
            </p>
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-xl shadow-lg shadow-amber-500/20 transition-all text-sm"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Clear Filters
            </button>
          </div>
        ) : (
          /* Workspace Zero State */
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-12 sm:p-16 text-center max-w-lg mx-auto shadow-glass animate-fade-in">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-semibold text-slate-200 mb-1">No tasks created yet</h3>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              Your workspace is clear. Create your first task to start assigning work, setting due dates, and tracking progress.
            </p>
            <button
              onClick={() => handleOpenCreateModal()}
              className="inline-flex items-center px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-xl shadow-lg shadow-amber-500/20 transition-all text-sm"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create First Task
            </button>
          </div>
        )}
      </main>

      {/* Task Create / Edit Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        task={editingTask}
        onSave={handleSaveTask}
      />

      {/* Reusable Glassmorphism Confirm Delete Modal */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Delete Task"
        message="Are you sure you want to permanently delete this task? This action cannot be undone."
        confirmText="Delete Task"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={confirmDeleteTask}
        onClose={() => {
          setIsConfirmOpen(false);
          setDeleteTargetId(null);
        }}
      />

      {/* Command Palette (⌘K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        tasks={tasks}
        onSelectTask={handleOpenEditModal}
        onOpenCreateModal={() => handleOpenCreateModal()}
        onSwitchView={handleViewChange}
        onOpenAnalytics={() => setIsAnalyticsOpen(true)}
        onToggleDemo={isDemo ? disableDemoMode : enableDemoMode}
        isDemo={isDemo}
        onLogout={logout}
      />

      {/* Productivity & Sprint Analytics Modal */}
      <AnalyticsModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        tasks={tasks}
      />

      {/* Admin User Management & Access Approval Modal */}
      <AdminUserManagementModal
        isOpen={isUserManagementOpen}
        onClose={() => setIsUserManagementOpen(false)}
      />
    </div>
  );
}


