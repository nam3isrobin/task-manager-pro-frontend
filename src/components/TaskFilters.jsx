import React from 'react';
import { Search, Filter, ArrowUpDown, RotateCcw, X } from 'lucide-react';

export default function TaskFilters({ filters, onFilterChange, onReset }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onFilterChange({ [name]: value });
  };

  const handleClearSearch = () => {
    onFilterChange({ search: '' });
  };

  // Count active non-default filters
  const activeFilterCount = [
    Boolean(filters.search && filters.search.trim()),
    Boolean(filters.status),
    Boolean(filters.priority),
    Boolean(filters.sort && filters.sort !== '-createdAt'),
  ].filter(Boolean).length;

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-5 mb-8 flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between shadow-glass">
      {/* Search Bar */}
      <div className="relative flex-1 max-w-full lg:max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-slate-500" />
        </div>
        <input
          type="text"
          name="search"
          maxLength={100}
          value={filters.search || ''}
          onChange={handleChange}
          placeholder="Search tasks by title, description, or tags..."
          className="w-full bg-[#0a0f1e]/90 border border-white/10 text-slate-100 placeholder-slate-500 rounded-xl pl-10 pr-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
        />
        {filters.search && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 focus:outline-none"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Dropdowns and Actions */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Status Filter */}
        <div className="flex items-center space-x-1.5 flex-1 sm:flex-initial">
          <Filter className="w-4 h-4 text-slate-500 hidden sm:inline-block" />
          <select
            name="status"
            value={filters.status || ''}
            onChange={handleChange}
            className="w-full sm:w-auto bg-[#0a0f1e] border border-white/10 text-slate-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="Todo">Todo</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="On Hold">On Hold</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center space-x-1.5 flex-1 sm:flex-initial">
          <select
            name="priority"
            value={filters.priority || ''}
            onChange={handleChange}
            className="w-full sm:w-auto bg-[#0a0f1e] border border-white/10 text-slate-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all cursor-pointer"
          >
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>
        </div>

        {/* Sort Filter */}
        <div className="flex items-center space-x-1.5 flex-1 sm:flex-initial">
          <ArrowUpDown className="w-4 h-4 text-slate-500 hidden sm:inline-block" />
          <select
            name="sort"
            value={filters.sort || '-createdAt'}
            onChange={handleChange}
            className="w-full sm:w-auto bg-[#0a0f1e] border border-white/10 text-slate-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all cursor-pointer"
          >
            <option value="-createdAt">Newest First</option>
            <option value="createdAt">Oldest First</option>
            <option value="dueDate">Due Date (Earliest)</option>
            <option value="-priority">Priority (High to Low)</option>
          </select>
        </div>

        {/* Active Filter Counter & Reset Button */}
        {activeFilterCount > 0 && onReset && (
          <div className="flex items-center space-x-2 pl-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {activeFilterCount} active
            </span>
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center text-xs font-medium text-slate-400 hover:text-amber-400 py-1.5 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Reset
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

