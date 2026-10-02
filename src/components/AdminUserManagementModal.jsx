import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { sanitizeErrorMessage } from '../utils/errorSanitizer';
import {
  X,
  ShieldAlert,
  UserCheck,
  UserX,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Mail,
  User,
  Shield,
  Search,
} from 'lucide-react';

export default function AdminUserManagementModal({ isOpen, onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [rejectingUserId, setRejectingUserId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('pending'); // 'pending' | 'all'

  const toast = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users/admin/all');
      setUsers(response.data?.data || []);
    } catch (err) {
      toast.error('Failed to load users', sanitizeErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      setRejectingUserId(null);
      setRejectionReason('');
    }
  }, [isOpen]);

  const handleApprove = async (userId, userEmail) => {
    setActionLoadingId(userId);
    try {
      await api.patch(`/users/admin/${userId}/approve`);
      toast.success('User Approved', `Account for ${userEmail} has been granted access.`);
      fetchUsers();
    } catch (err) {
      toast.error('Approval Failed', sanitizeErrorMessage(err));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectSubmit = async (e) => {
    e?.preventDefault();
    if (!rejectingUserId) return;
    setActionLoadingId(rejectingUserId);

    try {
      await api.patch(`/users/admin/${rejectingUserId}/reject`, {
        reason: rejectionReason.trim(),
      });
      toast.info('User Declined', 'Registration request has been rejected.');
      setRejectingUserId(null);
      setRejectionReason('');
      fetchUsers();
    } catch (err) {
      toast.error('Rejection Failed', sanitizeErrorMessage(err));
    } finally {
      setActionLoadingId(null);
    }
  };

  if (!isOpen) return null;

  const pendingUsers = users.filter((u) => u.approvalStatus === 'pending');
  const filteredUsers = users.filter((u) => {
    if (filterTab === 'pending' && u.approvalStatus !== 'pending') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.department?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0c1326] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                User Access & Security Governance
                {pendingUsers.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500 text-slate-950">
                    {pendingUsers.length} Pending
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Review verified registrations, grant access, or decline candidate requests
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-6 py-3.5 border-b border-white/10 bg-white/[0.01]">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFilterTab('pending')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterTab === 'pending'
                  ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/20 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              Pending Approval ({pendingUsers.length})
            </button>
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterTab === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/20 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              All Directory ({users.length})
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400 w-full sm:w-64"
            />
          </div>
        </div>

        {/* User List Content */}
        <div className="flex-1 overflow-y-auto p-6 divide-y divide-white/5">
          {loading ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-2" />
              <p className="text-xs">Loading accounts...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 mb-2 opacity-80" />
              <p className="text-sm font-semibold text-slate-300">No requests to display</p>
              <p className="text-xs text-slate-500 mt-1">
                {filterTab === 'pending'
                  ? 'All user registrations have been reviewed and approved.'
                  : 'No matching user accounts found.'}
              </p>
            </div>
          ) : (
            filteredUsers.map((item) => {
              const isPending = item.approvalStatus === 'pending';
              const isApproved = item.approvalStatus === 'approved';
              const isRejected = item.approvalStatus === 'rejected';
              const isRootAdmin = item.role === 'admin';

              return (
                <div
                  key={item._id}
                  className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  {/* User Meta */}
                  <div className="flex items-start space-x-3.5">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/20 to-indigo-500/20 border border-white/10 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0">
                      {item.name ? item.name.slice(0, 2).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-white">{item.name}</span>
                        {isRootAdmin && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                            Root Admin
                          </span>
                        )}
                        {isPending && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Awaiting Review
                          </span>
                        )}
                        {isApproved && !isRootAdmin && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Approved
                          </span>
                        )}
                        {isRejected && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                            Declined
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-500" />
                          {item.email}
                        </span>
                        <span>•</span>
                        <span>{item.department || 'General Team'}</span>
                      </div>
                      {isRejected && item.rejectionReason && (
                        <p className="text-[11px] text-red-300 mt-1">
                          <strong>Reason:</strong> {item.rejectionReason}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {!isRootAdmin && (
                    <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                      {isPending ? (
                        <>
                          <button
                            onClick={() => handleApprove(item._id, item.email)}
                            disabled={actionLoadingId === item._id}
                            className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 transition-all active:scale-[0.98]"
                          >
                            {actionLoadingId === item._id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <>
                                <UserCheck className="w-3.5 h-3.5 mr-1" />
                                Accept
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setRejectingUserId(item._id);
                              setRejectionReason('');
                            }}
                            disabled={actionLoadingId === item._id}
                            className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 transition-all"
                          >
                            <UserX className="w-3.5 h-3.5 mr-1" />
                            Decline
                          </button>
                        </>
                      ) : isApproved ? (
                        <button
                          onClick={() => {
                            setRejectingUserId(item._id);
                            setRejectionReason('');
                          }}
                          className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
                          title="Revoke access"
                        >
                          <UserX className="w-3.5 h-3.5 mr-1" />
                          Revoke
                        </button>
                      ) : (
                        <button
                          onClick={() => handleApprove(item._id, item.email)}
                          className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs text-emerald-400 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 transition-all"
                          title="Re-approve access"
                        >
                          <UserCheck className="w-3.5 h-3.5 mr-1" />
                          Re-approve
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Decline Reason Sub-Modal / Drawer */}
        {rejectingUserId && (
          <div className="p-5 border-t border-white/10 bg-red-950/20 animate-fade-in">
            <form onSubmit={handleRejectSubmit} className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  Decline Registration Request
                </span>
                <button
                  type="button"
                  onClick={() => setRejectingUserId(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
              <input
                type="text"
                placeholder="Reason for declining access (optional, will be emailed to user)..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white/5 border border-red-500/30 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-red-400"
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setRejectingUserId(null)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingId === rejectingUserId}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500 hover:bg-red-400 text-white shadow-md shadow-red-500/20"
                >
                  Confirm Decline
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
