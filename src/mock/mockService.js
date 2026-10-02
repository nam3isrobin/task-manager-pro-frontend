/**
 * Mock API Service & Offline Simulator for TaskManagerPro
 * Enables full offline UI/UX demo with persistent CRUD operations in sessionStorage/memory.
 */

import {
  getInitialMockTasks,
  getInitialMockUsers,
  getInitialMockNotifications,
  INITIAL_MOCK_USERS,
} from './mockData.js';

let _mockExplicitlyEnabled = false;

// In-memory fallbacks if sessionStorage is restricted or disabled
let _memoryTasks = null;
let _memoryUsers = null;
let _memoryNotifications = null;

const STORAGE_KEYS = {
  TASKS: 'taskmanager_mock_tasks_v1',
  USERS: 'taskmanager_mock_users_v1',
  NOTIFICATIONS: 'taskmanager_mock_notifications_v1',
  DEMO_MODE: 'demo_mode',
};

/**
 * Check if mock mode is active
 */
export function isMockEnabled() {
  if (_mockExplicitlyEnabled) return true;

  if (typeof window !== 'undefined') {
    // Check URL query parameters (?demo=true or ?mock=true)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('demo') === 'true' || urlParams.get('mock') === 'true') {
      return true;
    }

    // Check sessionStorage
    try {
      if (sessionStorage.getItem(STORAGE_KEYS.DEMO_MODE) === 'true') {
        return true;
      }
    } catch {
      // sessionStorage unavailable
    }
  }

  // Check Vite environment variable
  if (
    typeof import.meta !== 'undefined' &&
    (import.meta.env?.VITE_MOCK_AUTH === 'true' || import.meta.env?.VITE_USE_MOCK === 'true')
  ) {
    return true;
  }

  return false;
}

/**
 * Explicitly toggle mock mode
 */
export function setMockEnabled(enabled) {
  _mockExplicitlyEnabled = Boolean(enabled);
  if (typeof window !== 'undefined') {
    try {
      if (enabled) {
        sessionStorage.setItem(STORAGE_KEYS.DEMO_MODE, 'true');
      } else {
        sessionStorage.removeItem(STORAGE_KEYS.DEMO_MODE);
      }
    } catch {
      // ignore storage error
    }
  }
}

// ----------------------------------------------------------------------------
// Storage Persistence Helpers
// ----------------------------------------------------------------------------

function loadTasks() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEYS.TASKS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    if (_memoryTasks) return _memoryTasks;
  }
  const initial = getInitialMockTasks();
  saveTasks(initial);
  return initial;
}

function saveTasks(tasks) {
  _memoryTasks = tasks;
  try {
    sessionStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  } catch {
    // ignore
  }
}

function loadUsers() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEYS.USERS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    if (_memoryUsers) return _memoryUsers;
  }
  const initial = getInitialMockUsers();
  saveUsers(initial);
  return initial;
}

function saveUsers(users) {
  _memoryUsers = users;
  try {
    sessionStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  } catch {
    // ignore
  }
}

function loadNotifications() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    if (_memoryNotifications) return _memoryNotifications;
  }
  const initial = getInitialMockNotifications();
  saveNotifications(initial);
  return initial;
}

function saveNotifications(notifications) {
  _memoryNotifications = notifications;
  try {
    sessionStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  } catch {
    // ignore
  }
}

/**
 * Reset all mock data back to initial seeds
 */
export function resetMockData() {
  _memoryTasks = null;
  _memoryUsers = null;
  _memoryNotifications = null;
  try {
    sessionStorage.removeItem(STORAGE_KEYS.TASKS);
    sessionStorage.removeItem(STORAGE_KEYS.USERS);
    sessionStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
  } catch {
    // ignore
  }
  return {
    tasks: loadTasks(),
    users: loadUsers(),
    notifications: loadNotifications(),
  };
}

// ----------------------------------------------------------------------------
// Mock Auth & OTP Handlers
// ----------------------------------------------------------------------------

// Mock pending OTP store
let _mockPendingOtps = {};

export async function mockRegister(name, email, password) {
  await new Promise((r) => setTimeout(r, 120));

  const users = loadUsers();
  const trimmedEmail = (email || '').trim().toLowerCase();
  const existing = users.find((u) => u.email.toLowerCase() === trimmedEmail);
  if (existing) {
    throw new Error('A user with this email address already exists');
  }

  const generatedOtp = '123456'; // standard deterministic demo OTP code
  _mockPendingOtps[trimmedEmail] = {
    otp: generatedOtp,
    expiresAt: Date.now() + 10 * 60 * 1000,
    attempts: 0,
  };

  const newUser = {
    _id: `usr-${Date.now()}`,
    name: name.trim(),
    email: trimmedEmail,
    role: 'user', // strictly default to 'user'
    isVerified: true,
    approvalStatus: 'approved',
    avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
    department: 'General Team',
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);

  const mockToken = `mock-jwt-${newUser._id}-${Date.now()}`;

  return {
    success: true,
    requiresVerification: false,
    message: 'Registration successful. Welcome to TaskManagerPro Demo!',
    data: {
      token: mockToken,
      ...newUser,
    },
  };
}

export async function mockVerifyOtp(email, otp) {
  await new Promise((r) => setTimeout(r, 120));

  const users = loadUsers();
  const trimmedEmail = (email || '').trim().toLowerCase();
  const user = users.find((u) => u.email.toLowerCase() === trimmedEmail);

  if (!user) {
    throw new Error('User account not found');
  }

  const pending = _mockPendingOtps[trimmedEmail] || { otp: '123456' };
  if (otp.trim() !== pending.otp && otp.trim() !== '123456') {
    throw new Error('Invalid verification code. Use code 123456 in demo mode.');
  }

  user.isVerified = true;
  user.approvalStatus = 'approved';
  user.rejectionReason = '';
  saveUsers(users);

  const mockToken = `mock-jwt-${user._id}-${Date.now()}`;
  return {
    success: true,
    isVerified: true,
    approvalStatus: 'approved',
    data: {
      token: mockToken,
      ...user,
    },
  };
}

export async function mockResendOtp(email) {
  await new Promise((r) => setTimeout(r, 120));
  const trimmedEmail = (email || '').trim().toLowerCase();
  _mockPendingOtps[trimmedEmail] = {
    otp: '123456',
    expiresAt: Date.now() + 10 * 60 * 1000,
  };
  return {
    success: true,
    message: 'Verification code resent. Use code 123456.',
    simulatedOtp: '123456',
  };
}

export async function mockLogin(email, password) {
  await new Promise((r) => setTimeout(r, 120));

  const users = loadUsers();
  const foundUser = users.find((u) => u.email.toLowerCase() === (email || '').toLowerCase()) || users[0];

  // In demo mode, ensure verified & approved
  foundUser.isVerified = true;
  foundUser.approvalStatus = 'approved';
  saveUsers(users);

  const userObj = {
    _id: foundUser._id,
    name: foundUser.name,
    email: foundUser.email,
    role: foundUser.role,
    avatar: foundUser.avatar,
    department: foundUser.department,
    isVerified: foundUser.isVerified,
    approvalStatus: foundUser.approvalStatus,
  };

  const mockToken = `mock-jwt-${userObj._id}-${Date.now()}`;

  return {
    success: true,
    data: {
      token: mockToken,
      ...userObj,
    },
  };
}

export async function mockApproveUser(userId) {
  await new Promise((r) => setTimeout(r, 80));
  const users = loadUsers();
  const user = users.find((u) => u._id === userId);
  if (!user) throw new Error('User not found');
  user.approvalStatus = 'approved';
  user.rejectionReason = '';
  saveUsers(users);
  return { success: true, data: user };
}

export async function mockRejectUser(userId, reason = '') {
  await new Promise((r) => setTimeout(r, 80));
  const users = loadUsers();
  const user = users.find((u) => u._id === userId);
  if (!user) throw new Error('User not found');
  if (user.role === 'admin') throw new Error('Cannot reject Root Administrator');
  user.approvalStatus = 'rejected';
  user.rejectionReason = reason || 'Access declined by administrator';
  saveUsers(users);
  return { success: true, data: user };
}

export async function mockGetAllAdminUsers() {
  await new Promise((r) => setTimeout(r, 60));
  return {
    success: true,
    data: loadUsers(),
  };
}

export async function mockForgotPassword(email) {
  await new Promise((r) => setTimeout(r, 120));
  return {
    success: true,
    message: 'If an account exists with that email, a password reset link has been dispatched.',
  };
}

export async function mockResetPassword(email, newPassword) {
  await new Promise((r) => setTimeout(r, 120));
  return {
    success: true,
    message: 'Password updated successfully. You may now sign in.',
  };
}

// ----------------------------------------------------------------------------
// Mock Task Operations
// ----------------------------------------------------------------------------

export async function mockGetTasks(params = {}) {
  await new Promise((r) => setTimeout(r, 80));

  let tasks = loadTasks();

  // Search filter
  if (params.search && params.search.trim()) {
    const q = params.search.trim().toLowerCase();
    tasks = tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(q)))
    );
  }

  // Status filter
  if (params.status && params.status !== '') {
    tasks = tasks.filter((t) => t.status.toLowerCase() === params.status.toLowerCase());
  }

  // Priority filter
  if (params.priority && params.priority !== '') {
    tasks = tasks.filter((t) => t.priority.toLowerCase() === params.priority.toLowerCase());
  }

  // Sorting
  if (params.sort) {
    if (params.sort === '-createdAt') {
      tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (params.sort === 'createdAt') {
      tasks.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (params.sort === 'dueDate') {
      tasks.sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0));
    } else if (params.sort === '-dueDate') {
      tasks.sort((a, b) => new Date(b.dueDate || 0) - new Date(a.dueDate || 0));
    }
  } else {
    // Default sort by -createdAt
    tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  return {
    success: true,
    data: tasks,
    total: tasks.length,
  };
}

export async function mockCreateTask(taskData) {
  await new Promise((r) => setTimeout(r, 100));

  const tasks = loadTasks();
  const users = loadUsers();

  let assignedUser = null;
  if (taskData.assignedTo) {
    if (typeof taskData.assignedTo === 'object' && taskData.assignedTo !== null) {
      assignedUser = taskData.assignedTo;
    } else {
      assignedUser = users.find((u) => u._id === taskData.assignedTo) || null;
    }
  }

  const newTask = {
    _id: `tsk-${Date.now()}`,
    title: (taskData.title || '').trim(),
    description: (taskData.description || '').trim(),
    status: taskData.status || 'Todo',
    priority: taskData.priority || 'Medium',
    dueDate: taskData.dueDate || new Date(Date.now() + 7 * 86400 * 1000).toISOString(),
    tags: Array.isArray(taskData.tags) ? taskData.tags : [],
    assignedTo: assignedUser,
    subtasks: Array.isArray(taskData.subtasks) ? taskData.subtasks : [],
    comments: Array.isArray(taskData.comments) ? taskData.comments : [],
    activityLog: Array.isArray(taskData.activityLog) && taskData.activityLog.length > 0
      ? taskData.activityLog
      : [
          {
            id: `act-${Date.now()}`,
            user: assignedUser || users[0],
            action: 'created task',
            timestamp: new Date().toISOString(),
          },
        ],
    attachments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'usr-101',
  };

  tasks.unshift(newTask);
  saveTasks(tasks);

  return {
    success: true,
    data: newTask,
  };
}

export async function mockUpdateTask(id, taskData) {
  await new Promise((r) => setTimeout(r, 100));

  const tasks = loadTasks();
  const users = loadUsers();
  const index = tasks.findIndex((t) => t._id === id);

  if (index === -1) {
    throw new Error('Task not found');
  }

  const existing = tasks[index];
  let assignedUser = existing.assignedTo;

  if (taskData.assignedTo !== undefined) {
    if (typeof taskData.assignedTo === 'object' && taskData.assignedTo !== null) {
      assignedUser = taskData.assignedTo;
    } else if (taskData.assignedTo) {
      assignedUser = users.find((u) => u._id === taskData.assignedTo) || null;
    } else {
      assignedUser = null;
    }
  }

  // Build activity log entries for changes
  const newActivityEntries = [];
  const actor = users[0]; // Active actor

  if (taskData.status && taskData.status !== existing.status) {
    newActivityEntries.push({
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user: actor,
      action: `updated status to ${taskData.status}`,
      timestamp: new Date().toISOString(),
    });
  }

  if (taskData.priority && taskData.priority !== existing.priority) {
    newActivityEntries.push({
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user: actor,
      action: `changed priority to ${taskData.priority}`,
      timestamp: new Date().toISOString(),
    });
  }

  if (taskData.assignedTo !== undefined) {
    const prevAssigneeId = existing.assignedTo?._id || existing.assignedTo;
    const newAssigneeId = assignedUser?._id || assignedUser;
    if (prevAssigneeId !== newAssigneeId) {
      newActivityEntries.push({
        id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        user: actor,
        action: assignedUser ? `reassigned task to ${assignedUser.name}` : 'unassigned task',
        timestamp: new Date().toISOString(),
      });
    }
  }

  const existingActivity = Array.isArray(existing.activityLog) ? existing.activityLog : [];
  const updatedActivityLog = taskData.activityLog
    ? taskData.activityLog
    : [...existingActivity, ...newActivityEntries];

  const updatedTask = {
    ...existing,
    ...taskData,
    subtasks: taskData.subtasks !== undefined ? taskData.subtasks : (existing.subtasks || []),
    comments: taskData.comments !== undefined ? taskData.comments : (existing.comments || []),
    activityLog: updatedActivityLog,
    assignedTo: assignedUser,
    updatedAt: new Date().toISOString(),
  };

  tasks[index] = updatedTask;
  saveTasks(tasks);

  return {
    success: true,
    data: updatedTask,
  };
}

export async function mockAddComment(taskId, commentText, author = null) {
  await new Promise((r) => setTimeout(r, 80));

  const tasks = loadTasks();
  const users = loadUsers();
  const task = tasks.find((t) => t._id === taskId);
  if (!task) {
    throw new Error('Task not found');
  }

  let authorObj = null;
  if (author && typeof author === 'object') {
    authorObj = author;
  } else if (author && typeof author === 'string') {
    authorObj = users.find((u) => u._id === author) || users[0];
  } else {
    authorObj = users[0];
  }

  const newComment = {
    id: `cm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    author: authorObj,
    text: (commentText || '').trim(),
    createdAt: new Date().toISOString(),
  };

  if (!Array.isArray(task.comments)) {
    task.comments = [];
  }
  task.comments.push(newComment);

  if (!Array.isArray(task.activityLog)) {
    task.activityLog = [];
  }
  task.activityLog.push({
    id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    user: authorObj,
    action: 'added a comment',
    timestamp: new Date().toISOString(),
  });

  task.updatedAt = new Date().toISOString();
  saveTasks(tasks);

  return {
    success: true,
    data: task,
    comment: newComment,
  };
}

export async function mockAddSubtask(taskId, title) {
  await new Promise((r) => setTimeout(r, 80));

  const tasks = loadTasks();
  const users = loadUsers();
  const task = tasks.find((t) => t._id === taskId);
  if (!task) {
    throw new Error('Task not found');
  }

  const newSubtask = {
    id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    title: (title || '').trim(),
    completed: false,
  };

  if (!Array.isArray(task.subtasks)) {
    task.subtasks = [];
  }
  task.subtasks.push(newSubtask);

  if (!Array.isArray(task.activityLog)) {
    task.activityLog = [];
  }
  task.activityLog.push({
    id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    user: users[0],
    action: `added subtask "${newSubtask.title}"`,
    timestamp: new Date().toISOString(),
  });

  task.updatedAt = new Date().toISOString();
  saveTasks(tasks);

  return {
    success: true,
    data: task,
    subtask: newSubtask,
  };
}

export async function mockToggleSubtask(taskId, subtaskId) {
  await new Promise((r) => setTimeout(r, 80));

  const tasks = loadTasks();
  const users = loadUsers();
  const task = tasks.find((t) => t._id === taskId);
  if (!task) {
    throw new Error('Task not found');
  }

  if (!Array.isArray(task.subtasks)) {
    task.subtasks = [];
  }

  const subtask = task.subtasks.find((s) => s.id === subtaskId || s._id === subtaskId);
  if (!subtask) {
    throw new Error('Subtask not found');
  }

  subtask.completed = !subtask.completed;

  if (!Array.isArray(task.activityLog)) {
    task.activityLog = [];
  }
  task.activityLog.push({
    id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    user: users[0],
    action: `${subtask.completed ? 'completed' : 'uncompleted'} subtask "${subtask.title}"`,
    timestamp: new Date().toISOString(),
  });

  task.updatedAt = new Date().toISOString();
  saveTasks(tasks);

  return {
    success: true,
    data: task,
    subtask,
  };
}

export async function mockDeleteSubtask(taskId, subtaskId) {
  await new Promise((r) => setTimeout(r, 80));

  const tasks = loadTasks();
  const users = loadUsers();
  const task = tasks.find((t) => t._id === taskId);
  if (!task) {
    throw new Error('Task not found');
  }

  if (!Array.isArray(task.subtasks)) {
    task.subtasks = [];
  }

  const deletedSubtask = task.subtasks.find((s) => s.id === subtaskId || s._id === subtaskId);
  task.subtasks = task.subtasks.filter((s) => s.id !== subtaskId && s._id !== subtaskId);

  if (!Array.isArray(task.activityLog)) {
    task.activityLog = [];
  }
  task.activityLog.push({
    id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    user: users[0],
    action: `deleted subtask "${deletedSubtask ? deletedSubtask.title : subtaskId}"`,
    timestamp: new Date().toISOString(),
  });

  task.updatedAt = new Date().toISOString();
  saveTasks(tasks);

  return {
    success: true,
    data: task,
  };
}

export async function mockDeleteTask(id) {
  await new Promise((r) => setTimeout(r, 80));

  let tasks = loadTasks();
  const initialLength = tasks.length;
  tasks = tasks.filter((t) => t._id !== id);

  if (tasks.length === initialLength) {
    throw new Error('Task not found');
  }

  saveTasks(tasks);

  return {
    success: true,
    data: { message: 'Task deleted successfully', _id: id },
  };
}

export async function mockUploadAttachment(taskId, formDataOrFile) {
  await new Promise((r) => setTimeout(r, 150));

  const tasks = loadTasks();
  const task = tasks.find((t) => t._id === taskId);
  if (!task) {
    throw new Error('Task not found');
  }

  let filename = 'document-attachment.pdf';
  let size = 124000;

  if (formDataOrFile instanceof FormData) {
    const file = formDataOrFile.get('file');
    if (file && typeof file === 'object') {
      filename = file.name || filename;
      size = file.size || size;
    }
  } else if (formDataOrFile && typeof formDataOrFile === 'object') {
    filename = formDataOrFile.name || filename;
    size = formDataOrFile.size || size;
  }

  const newAttachment = {
    _id: `att-${Date.now()}`,
    filename,
    originalName: filename,
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    size,
    createdAt: new Date().toISOString(),
  };

  if (!Array.isArray(task.attachments)) {
    task.attachments = [];
  }
  task.attachments.push(newAttachment);
  task.updatedAt = new Date().toISOString();

  saveTasks(tasks);

  return {
    success: true,
    data: task,
  };
}

// ----------------------------------------------------------------------------
// Mock Users & Notifications Handlers
// ----------------------------------------------------------------------------

export async function mockGetUsers() {
  await new Promise((r) => setTimeout(r, 50));
  const users = loadUsers();
  return {
    success: true,
    data: users,
  };
}

export async function mockGetNotifications() {
  await new Promise((r) => setTimeout(r, 50));
  const notifs = loadNotifications();
  return {
    success: true,
    data: notifs,
  };
}

export async function mockMarkNotificationRead(id) {
  await new Promise((r) => setTimeout(r, 50));
  const notifs = loadNotifications();
  const index = notifs.findIndex((n) => n._id === id);
  if (index !== -1) {
    notifs[index].read = true;
    saveNotifications(notifs);
    return { success: true, data: notifs[index] };
  }
  return { success: false, message: 'Notification not found' };
}

export async function mockMarkAllNotificationsRead() {
  await new Promise((r) => setTimeout(r, 50));
  const notifs = loadNotifications();
  notifs.forEach((n) => {
    n.read = true;
  });
  saveNotifications(notifs);
  return {
    success: true,
    data: { message: 'All notifications marked as read' },
  };
}
