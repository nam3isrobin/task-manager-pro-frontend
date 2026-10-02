import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { User, Loader2 } from 'lucide-react';

export default function AssigneeSelector({ value, onChange }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await api.get('/users');
        const userData = response.data?.data || response.data;
        setUsers(Array.isArray(userData) ? userData : []);
      } catch (err) {
        setError('Failed to load team members');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const selectedId = typeof value === 'object' && value !== null ? value._id : value;

  return (
    <div className="relative">
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
        Assignee
      </label>
      <div className="relative rounded-xl shadow-sm">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          {loading ? (
            <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />
          ) : (
            <User className="h-4 w-4 text-slate-500" />
          )}
        </div>
        <select
          value={selectedId || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={loading}
          className="block w-full pl-10 pr-3.5 py-2.5 bg-[#0a0f1e] border border-white/10 rounded-xl text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all cursor-pointer disabled:opacity-50"
        >
          <option value="">Unassigned (No team member)</option>
          {users.map((user) => (
            <option key={user._id} value={user._id}>
              {user.name} ({user.role}) — {user.email}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}

