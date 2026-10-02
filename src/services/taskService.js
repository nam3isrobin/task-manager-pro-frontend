import api from './api';

export const getTasks = async (params) => {
  const response = await api.get('/tasks', { params });
  return response.data;
};

export const createTask = async (taskData) => {
  const response = await api.post('/tasks', taskData);
  return response.data;
};

export const updateTask = async (id, taskData) => {
  const response = await api.put(`/tasks/${id}`, taskData);
  return response.data;
};

export const deleteTask = async (id) => {
  const response = await api.delete(`/tasks/${id}`);
  return response.data;
};

export const uploadAttachment = async (taskId, formData) => {
  const response = await api.post(`/tasks/${taskId}/attachments`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const addComment = async (taskId, text) => {
  const response = await api.post(`/tasks/${taskId}/comments`, { text });
  return response.data;
};

export const addSubtask = async (taskId, title) => {
  const response = await api.post(`/tasks/${taskId}/subtasks`, { title });
  return response.data;
};

export const toggleSubtask = async (taskId, subtaskId) => {
  const response = await api.patch(`/tasks/${taskId}/subtasks/${subtaskId}/toggle`);
  return response.data;
};

export const deleteSubtask = async (taskId, subtaskId) => {
  const response = await api.delete(`/tasks/${taskId}/subtasks/${subtaskId}`);
  return response.data;
};
