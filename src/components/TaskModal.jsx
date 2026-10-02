import React, { useState, useEffect } from "react";
import AssigneeSelector from "./AssigneeSelector";
import AttachmentUploader from "./AttachmentUploader";
import {
  X,
  Loader2,
  AlertCircle,
  FileText,
  CheckSquare,
  MessageSquare,
  History,
  Plus,
  Trash2,
  Send,
  Check,
  Clock,
} from "lucide-react";
import {
  MAX_TASK_TITLE_LENGTH,
  MAX_TASK_DESC_LENGTH,
  MAX_TAGS_COUNT,
  MAX_TAG_LENGTH,
} from "../utils/validation";
import { sanitizeErrorMessage } from "../utils/errorSanitizer";
import { useAuth } from "../context/AuthContext";

function getInitials(name) {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 30) return "Just now";
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TaskModal({ isOpen, onClose, task, onSave }) {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("details");

  // Details fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Todo");
  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState("");
  const [assignee, setAssignee] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [attachments, setAttachments] = useState([]);

  // Subtasks, Comments, Activity Log state
  const [subtasks, setSubtasks] = useState([]);
  const [comments, setComments] = useState([]);
  const [activityLog, setActivityLog] = useState([]);

  // Form inputs for tabs
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newCommentText, setNewCommentText] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setStatus(task.status || "Todo");
      setPriority(task.priority || "Medium");

      // Safe date formatting for <input type="date" />
      let safeDateStr = "";
      if (task.dueDate) {
        try {
          const d = new Date(task.dueDate);
          if (!isNaN(d.getTime())) {
            safeDateStr = d.toISOString().substring(0, 10);
          }
        } catch {
          // ignore
        }
      }
      setDueDate(safeDateStr);

      const assignedId = task.assignedTo?._id || task.assignedTo || task.assignee?._id || task.assignee || "";
      setAssignee(typeof assignedId === "object" ? assignedId._id || "" : assignedId);
      setTagsInput(Array.isArray(task.tags) ? task.tags.join(", ") : "");
      setAttachments(task.attachments || []);
      setSubtasks(Array.isArray(task.subtasks) ? JSON.parse(JSON.stringify(task.subtasks)) : []);
      setComments(Array.isArray(task.comments) ? JSON.parse(JSON.stringify(task.comments)) : []);
      setActivityLog(Array.isArray(task.activityLog) ? JSON.parse(JSON.stringify(task.activityLog)) : []);
    } else {
      setTitle("");
      setDescription("");
      setStatus("Todo");
      setPriority("Medium");
      setDueDate("");
      setAssignee("");
      setTagsInput("");
      setAttachments([]);
      setSubtasks([]);
      setComments([]);
      setActivityLog([]);
    }
    setActiveTab("details");
    setNewSubtaskTitle("");
    setNewCommentText("");
    setError("");
  }, [task, isOpen]);

  if (!isOpen) return null;

  // --------------------------------------------------------------------------
  // Subtask Handlers
  // --------------------------------------------------------------------------
  const handleAddSubtask = (e) => {
    if (e) e.preventDefault();
    const trimmed = newSubtaskTitle.trim();
    if (!trimmed) return;

    const newSubtask = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: trimmed,
      completed: false,
    };

    const updatedSubtasks = [...subtasks, newSubtask];
    setSubtasks(updatedSubtasks);

    // Track in local activity log
    const actor = currentUser || { name: "Current User" };
    const newLog = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user: actor,
      action: `added subtask "${trimmed}"`,
      timestamp: new Date().toISOString(),
    };
    setActivityLog((prev) => [newLog, ...prev]);

    setNewSubtaskTitle("");
  };

  const handleToggleSubtask = (subtaskId) => {
    let toggledItem = null;
    const updatedSubtasks = subtasks.map((st) => {
      if (st.id === subtaskId || st._id === subtaskId) {
        toggledItem = { ...st, completed: !st.completed };
        return toggledItem;
      }
      return st;
    });

    setSubtasks(updatedSubtasks);

    if (toggledItem) {
      const actor = currentUser || { name: "Current User" };
      const newLog = {
        id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        user: actor,
        action: `${toggledItem.completed ? "completed" : "uncompleted"} subtask "${toggledItem.title}"`,
        timestamp: new Date().toISOString(),
      };
      setActivityLog((prev) => [newLog, ...prev]);
    }
  };

  const handleDeleteSubtask = (subtaskId) => {
    const target = subtasks.find((st) => st.id === subtaskId || st._id === subtaskId);
    setSubtasks(subtasks.filter((st) => st.id !== subtaskId && st._id !== subtaskId));

    if (target) {
      const actor = currentUser || { name: "Current User" };
      const newLog = {
        id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        user: actor,
        action: `deleted subtask "${target.title}"`,
        timestamp: new Date().toISOString(),
      };
      setActivityLog((prev) => [newLog, ...prev]);
    }
  };

  // Subtasks progress calculations
  const totalSubtasks = subtasks.length;
  const completedSubtasks = subtasks.filter((st) => st.completed).length;
  const subtasksPercent = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  // --------------------------------------------------------------------------
  // Comment Handlers
  // --------------------------------------------------------------------------
  const handleAddComment = (e) => {
    if (e) e.preventDefault();
    const trimmed = newCommentText.trim();
    if (!trimmed) return;

    const authorObj = currentUser || {
      _id: "usr-current",
      name: "Sarah Jenkins",
      role: "user",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    };

    const newComment = {
      id: `cm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      author: authorObj,
      text: trimmed,
      createdAt: new Date().toISOString(),
    };

    setComments((prev) => [...prev, newComment]);

    const newLog = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user: authorObj,
      action: "added a comment",
      timestamp: new Date().toISOString(),
    };
    setActivityLog((prev) => [newLog, ...prev]);

    setNewCommentText("");
  };

  // --------------------------------------------------------------------------
  // Submit / Save Form
  // --------------------------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Task title is required");
      setActiveTab("details");
      return;
    }

    if (trimmedTitle.length > MAX_TASK_TITLE_LENGTH) {
      setError(`Task title cannot exceed ${MAX_TASK_TITLE_LENGTH} characters`);
      setActiveTab("details");
      return;
    }

    if (description.length > MAX_TASK_DESC_LENGTH) {
      setError(`Description cannot exceed ${MAX_TASK_DESC_LENGTH} characters`);
      setActiveTab("details");
      return;
    }

    let parsedTags = [];
    if (tagsInput && tagsInput.trim()) {
      const rawTags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
      if (rawTags.length > MAX_TAGS_COUNT) {
        setError(`Cannot add more than ${MAX_TAGS_COUNT} tags`);
        setActiveTab("details");
        return;
      }
      for (const t of rawTags) {
        if (t.length > MAX_TAG_LENGTH) {
          setError(`Tag "${t}" exceeds maximum length of ${MAX_TAG_LENGTH} characters`);
          setActiveTab("details");
          return;
        }
      }
      parsedTags = rawTags;
    }

    let safeDueDateIso;
    if (dueDate) {
      try {
        const d = new Date(dueDate);
        if (!isNaN(d.getTime())) {
          safeDueDateIso = d.toISOString();
        }
      } catch {
        // invalid date
      }
    }

    const taskData = {
      title: trimmedTitle,
      description: description.trim(),
      status,
      priority,
      dueDate: safeDueDateIso,
      assignedTo: assignee || null,
      assignee: assignee || null,
      tags: parsedTags,
      subtasks,
      comments,
      activityLog,
    };

    setLoading(true);
    try {
      await onSave(task ? task._id : null, taskData);
      onClose();
    } catch (err) {
      setError(sanitizeErrorMessage(err, "Failed to save task. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#0d1528] border border-white/10 rounded-2xl shadow-glass-xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 bg-white/[0.03] shrink-0">
          <div className="flex items-center space-x-2.5">
            <h3 className="text-base font-bold text-slate-100">
              {task ? "Edit Task" : "Create New Task"}
            </h3>
            {task?.status && (
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
                {task.status}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Bar */}
        <div className="flex border-b border-white/8 bg-[#090e1c] px-4 pt-1 shrink-0 overflow-x-auto">
          {/* Details Tab */}
          <button
            type="button"
            onClick={() => setActiveTab("details")}
            className={`flex items-center space-x-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "details"
                ? "border-amber-400 text-amber-300 bg-white/[0.04]"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Details</span>
          </button>

          {/* Checklist (Subtasks) Tab */}
          <button
            type="button"
            onClick={() => setActiveTab("checklist")}
            className={`flex items-center space-x-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "checklist"
                ? "border-amber-400 text-amber-300 bg-white/[0.04]"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]"
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Checklist (Subtasks)</span>
            {totalSubtasks > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                  completedSubtasks === totalSubtasks
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-white/10 text-slate-300 border border-white/10"
                }`}
              >
                {completedSubtasks}/{totalSubtasks}
              </span>
            )}
          </button>

          {/* Comments Tab */}
          <button
            type="button"
            onClick={() => setActiveTab("comments")}
            className={`flex items-center space-x-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "comments"
                ? "border-amber-400 text-amber-300 bg-white/[0.04]"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Comments</span>
            {comments.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono bg-white/10 text-slate-300 border border-white/10">
                {comments.length}
              </span>
            )}
          </button>

          {/* Activity Log Tab */}
          <button
            type="button"
            onClick={() => setActiveTab("activity")}
            className={`flex items-center space-x-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "activity"
                ? "border-amber-400 text-amber-300 bg-white/[0.04]"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]"
            }`}
          >
            <History className="w-4 h-4" />
            <span>Activity Log</span>
            {activityLog.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono bg-white/10 text-slate-300 border border-white/10">
                {activityLog.length}
              </span>
            )}
          </button>
        </div>

        {/* Modal Form Container */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div
              className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-3.5 text-sm flex items-center animate-shake"
              role="alert"
            >
              <AlertCircle className="w-5 h-5 mr-2.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 1: DETAILS                                                   */}
          {/* ================================================================ */}
          {activeTab === "details" && (
            <div className="space-y-4 animate-fade-in">
              {/* Title Field */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Title <span className="text-amber-400">*</span>
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {title.length}/{MAX_TASK_TITLE_LENGTH}
                  </span>
                </div>
                <input
                  type="text"
                  required
                  maxLength={MAX_TASK_TITLE_LENGTH}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Task title..."
                  className="block w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                />
              </div>

              {/* Description Field */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Description
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {description.length}/{MAX_TASK_DESC_LENGTH}
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={MAX_TASK_DESC_LENGTH}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed task description..."
                  className="block w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all resize-none"
                />
              </div>

              {/* Status & Priority Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="block w-full px-3.5 py-2.5 bg-[#0a0f1e] border border-white/10 rounded-xl text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all cursor-pointer"
                  >
                    <option value="Todo">Todo</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="block w-full px-3.5 py-2.5 bg-[#0a0f1e] border border-white/10 rounded-xl text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all cursor-pointer"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Due Date & Assignee Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="block w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all cursor-pointer"
                  />
                </div>

                <div>
                  <AssigneeSelector value={assignee} onChange={setAssignee} />
                </div>
              </div>

              {/* Tags Field */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Tags (comma-separated, max {MAX_TAGS_COUNT})
                  </label>
                </div>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="frontend, bug, v1"
                  className="block w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                />
              </div>

              {/* Attachment Uploader */}
              {task && (
                <AttachmentUploader
                  taskId={task._id}
                  attachments={attachments}
                  onUploadSuccess={(updatedTask) => setAttachments(updatedTask.attachments || [])}
                />
              )}
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 2: CHECKLIST (SUBTASKS)                                      */}
          {/* ================================================================ */}
          {activeTab === "checklist" && (
            <div className="space-y-4 animate-fade-in">
              {/* Live Progress Bar Header */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold uppercase tracking-wider text-slate-300">
                    Subtask Progress
                  </span>
                  <span className="font-mono text-amber-400 font-bold">
                    {completedSubtasks} of {totalSubtasks} completed ({subtasksPercent}%)
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      subtasksPercent === 100
                        ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                        : "bg-gradient-to-r from-amber-500 to-amber-400"
                    }`}
                    style={{ width: `${subtasksPercent}%` }}
                  />
                </div>
              </div>

              {/* Add Subtask Form */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSubtask();
                    }
                  }}
                  placeholder="Add a new subtask (press Enter or click Add)..."
                  className="flex-1 px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  disabled={!newSubtaskTitle.trim()}
                  className="inline-flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-900 font-semibold rounded-xl text-xs transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </button>
              </div>

              {/* Subtasks List */}
              <div className="space-y-2">
                {subtasks.length === 0 ? (
                  <div className="text-center py-8 bg-white/[0.02] border border-dashed border-white/10 rounded-xl">
                    <CheckSquare className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <p className="text-xs text-slate-400">No subtasks created yet</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Break down this task into smaller actionable steps.
                    </p>
                  </div>
                ) : (
                  subtasks.map((st, idx) => {
                    const stId = st.id || st._id || `sub-${idx}`;
                    return (
                      <div
                        key={stId}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                          st.completed
                            ? "bg-emerald-500/[0.05] border-emerald-500/20"
                            : "bg-white/5 border-white/10 hover:border-white/20"
                        }`}
                      >
                        <div className="flex items-center space-x-3 flex-1 min-w-0 mr-2">
                          <button
                            type="button"
                            onClick={() => handleToggleSubtask(stId)}
                            className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all shrink-0 ${
                              st.completed
                                ? "bg-emerald-500 border-emerald-400 text-slate-900 shadow-sm"
                                : "bg-transparent border-slate-500 hover:border-amber-400 text-transparent"
                            }`}
                            aria-label={`Toggle subtask "${st.title}"`}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                          <span
                            onClick={() => handleToggleSubtask(stId)}
                            className={`text-sm cursor-pointer select-none truncate ${
                              st.completed
                                ? "line-through text-slate-500"
                                : "text-slate-200 hover:text-white"
                            }`}
                          >
                            {st.title}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteSubtask(stId)}
                          className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/5 transition-colors shrink-0"
                          title="Delete subtask"
                          aria-label="Delete subtask"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 3: COMMENTS                                                  */}
          {/* ================================================================ */}
          {activeTab === "comments" && (
            <div className="space-y-4 animate-fade-in">
              {/* Comment Input Form */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-2.5">
                <textarea
                  rows={2}
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Write a comment or project update..."
                  className="block w-full px-3 py-2 bg-[#0a0f1e] border border-white/10 rounded-lg text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddComment}
                    disabled={!newCommentText.trim()}
                    className="inline-flex items-center px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-900 font-semibold rounded-lg text-xs transition-colors shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    Add Comment
                  </button>
                </div>
              </div>

              {/* Comments Thread */}
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {comments.length === 0 ? (
                  <div className="text-center py-8 bg-white/[0.02] border border-dashed border-white/10 rounded-xl">
                    <MessageSquare className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <p className="text-xs text-slate-400">No comments yet</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Start the team discussion by typing a comment above.
                    </p>
                  </div>
                ) : (
                  comments.map((cm, idx) => {
                    const authorName = cm.author?.name || "Team Member";
                    const authorAvatar = cm.author?.avatar;
                    const authorRole = cm.author?.role;
                    return (
                      <div
                        key={cm.id || cm._id || `cm-${idx}`}
                        className="bg-white/5 border border-white/8 rounded-xl p-3.5 space-y-2 hover:border-white/15 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2.5">
                            {authorAvatar ? (
                              <img
                                src={authorAvatar}
                                alt={authorName}
                                className="w-6 h-6 rounded-full object-cover ring-1 ring-white/10"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-[10px] flex items-center justify-center ring-1 ring-indigo-500/30">
                                {getInitials(authorName)}
                              </div>
                            )}
                            <div className="flex items-center space-x-1.5">
                              <span className="text-xs font-semibold text-slate-200">
                                {authorName}
                              </span>
                              {authorRole && (
                                <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-white/5 text-slate-400 border border-white/8 font-mono">
                                  {authorRole}
                                </span>
                              )}
                            </div>
                          </div>
                          <span
                            className="text-[11px] text-slate-500 flex items-center"
                            title={formatDateTime(cm.createdAt)}
                          >
                            <Clock className="w-3 h-3 mr-1 opacity-70" />
                            {formatRelativeTime(cm.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed pl-8">
                          {cm.text}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 4: ACTIVITY LOG                                              */}
          {/* ================================================================ */}
          {activeTab === "activity" && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4 max-h-80 overflow-y-auto">
                {activityLog.length === 0 ? (
                  <div className="text-center py-8">
                    <History className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <p className="text-xs text-slate-400">No activity recorded yet</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Changes and updates to this task will appear in this timeline.
                    </p>
                  </div>
                ) : (
                  <div className="relative border-l border-white/10 ml-3 pl-5 space-y-4 my-2">
                    {activityLog.map((act, idx) => {
                      const userName = act.user?.name || (typeof act.user === "string" ? act.user : "User");
                      return (
                        <div key={act.id || act._id || `act-${idx}`} className="relative group">
                          {/* Timeline bullet node */}
                          <div className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-amber-400 ring-4 ring-[#0d1528] group-hover:scale-110 transition-transform" />
                          <div className="space-y-0.5">
                            <p className="text-xs text-slate-200 leading-snug">
                              <span className="font-semibold text-amber-300">{userName}</span>{" "}
                              <span className="text-slate-300">{act.action}</span>
                            </p>
                            <p
                              className="text-[10px] text-slate-500 font-mono"
                              title={formatDateTime(act.timestamp || act.createdAt)}
                            >
                              {formatDateTime(act.timestamp || act.createdAt) ||
                                formatRelativeTime(act.timestamp || act.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Modal Actions Footer */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-white/8 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-white/10 rounded-xl text-sm font-medium text-slate-400 bg-white/5 hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-xl text-sm shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : task ? "Update Task" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
