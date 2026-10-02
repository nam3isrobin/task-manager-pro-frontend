import axios from 'axios';
import { getAccessToken, clearAccessToken } from '../utils/tokenStorage';
import {
  isMockEnabled,
  mockLogin,
  mockRegister,
  mockVerifyOtp,
  mockResendOtp,
  mockApproveUser,
  mockRejectUser,
  mockGetAllAdminUsers,
  mockForgotPassword,
  mockResetPassword,
  mockGetTasks,
  mockCreateTask,
  mockUpdateTask,
  mockDeleteTask,
  mockUploadAttachment,
  mockAddComment,
  mockAddSubtask,
  mockToggleSubtask,
  mockDeleteSubtask,
  mockGetUsers,
  mockGetNotifications,
  mockMarkNotificationRead,
  mockMarkAllNotificationsRead,
} from '../mock/mockService';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Custom adapter to handle mock requests offline
api.interceptors.request.use(
  async (config) => {
    // Inject Bearer token from in-memory store
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // If mock mode is active, handle endpoints in-memory without hitting backend
    if (isMockEnabled()) {
      const url = config.url || '';
      const method = (config.method || 'get').toLowerCase();

      // Define a custom mock adapter for this request
      config.adapter = async () => {
        let resultData = null;

        try {
          // Auth routes
          if (url.includes('/auth/login') && method === 'post') {
            const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
            resultData = await mockLogin(body.email, body.password);
          } else if (url.includes('/auth/register') && method === 'post') {
            const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
            resultData = await mockRegister(body.name, body.email, body.password);
          } else if (url.includes('/auth/verify-otp') && method === 'post') {
            const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
            resultData = await mockVerifyOtp(body.email, body.otp);
          } else if (url.includes('/auth/resend-otp') && method === 'post') {
            const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
            resultData = await mockResendOtp(body.email);
          } else if (url.includes('/auth/forgot-password') && method === 'post') {
            const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
            resultData = await mockForgotPassword(body.email);
          } else if (url.includes('/auth/reset-password') && method === 'post') {
            const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
            resultData = await mockResetPassword(body.email, body.password);
          } else if (url.includes('/users/admin/all') && method === 'get') {
            resultData = await mockGetAllAdminUsers();
          } else if (url.match(/\/users\/admin\/[a-zA-Z0-9_-]+\/approve/) && method === 'patch') {
            const userId = url.split('/')[3];
            resultData = await mockApproveUser(userId);
          } else if (url.match(/\/users\/admin\/[a-zA-Z0-9_-]+\/reject/) && method === 'patch') {
            const userId = url.split('/')[3];
            const body = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {});
            resultData = await mockRejectUser(userId, body.reason);
          }

          // Task routes
          else if (url === '/tasks' || url.endsWith('/tasks')) {
            if (method === 'get') {
              resultData = await mockGetTasks(config.params || {});
            } else if (method === 'post') {
              const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
              resultData = await mockCreateTask(body);
            }
          } else if (url.match(/\/tasks\/[a-zA-Z0-9_-]+\/attachments/)) {
            const taskId = url.split('/')[2];
            resultData = await mockUploadAttachment(taskId, config.data);
          } else if (url.match(/\/tasks\/[a-zA-Z0-9_-]+\/comments/) && method === 'post') {
            const taskId = url.split('/')[2];
            const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
            resultData = await mockAddComment(taskId, body.text || body.commentText, body.author);
          } else if (url.match(/\/tasks\/[a-zA-Z0-9_-]+\/subtasks\/[a-zA-Z0-9_-]+\/toggle/) && (method === 'patch' || method === 'put' || method === 'post')) {
            const parts = url.split('/');
            const taskId = parts[2];
            const subtaskId = parts[4];
            resultData = await mockToggleSubtask(taskId, subtaskId);
          } else if (url.match(/\/tasks\/[a-zA-Z0-9_-]+\/subtasks\/[a-zA-Z0-9_-]+/) && method === 'delete') {
            const parts = url.split('/');
            const taskId = parts[2];
            const subtaskId = parts[4];
            resultData = await mockDeleteSubtask(taskId, subtaskId);
          } else if (url.match(/\/tasks\/[a-zA-Z0-9_-]+\/subtasks/) && method === 'post') {
            const taskId = url.split('/')[2];
            const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
            resultData = await mockAddSubtask(taskId, body.title);
          } else if (url.match(/\/tasks\/[a-zA-Z0-9_-]+/)) {
            const taskId = url.split('/')[2];
            if (method === 'put' || method === 'patch') {
              const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
              resultData = await mockUpdateTask(taskId, body);
            } else if (method === 'delete') {
              resultData = await mockDeleteTask(taskId);
            }
          }

          // Users & Notifications
          else if (url.includes('/users') && method === 'get') {
            resultData = await mockGetUsers();
          } else if (url.includes('/notifications/read-all') && (method === 'patch' || method === 'post')) {
            resultData = await mockMarkAllNotificationsRead();
          } else if (url.match(/\/notifications\/[a-zA-Z0-9_-]+\/read/)) {
            const notifId = url.split('/')[2];
            resultData = await mockMarkNotificationRead(notifId);
          } else if (url.includes('/notifications') && method === 'get') {
            resultData = await mockGetNotifications();
          } else {
            // Default empty success payload for unrecognized mock routes
            resultData = { success: true, data: [] };
          }

          return {
            data: resultData,
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
            request: {},
          };
        } catch (err) {
          const errorResponse = {
            data: { error: err.message || 'Mock operation failed' },
            status: 400,
            statusText: 'Bad Request',
            headers: {},
            config,
            request: {},
          };
          const axiosError = new Error(err.message || 'Mock operation failed');
          axiosError.response = errorResponse;
          axiosError.config = config;
          throw axiosError;
        }
      };
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      clearAccessToken();
      try {
        sessionStorage.removeItem('taskmanager_auth_user_v1');
      } catch {
        // ignore
      }
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
