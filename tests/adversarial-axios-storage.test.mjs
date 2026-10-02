import assert from 'node:assert';
import api from '../src/services/api.js';
import { setMockEnabled, isMockEnabled, resetMockData } from '../src/mock/mockService.js';
import { getAccessToken, setAccessToken, clearAccessToken } from '../src/utils/tokenStorage.js';

console.log('=== CHALLENGER 1: AXIOS INTERCEPTOR & SESSION STORAGE ADVERSARIAL TEST ===\n');

// Polyfill global sessionStorage and window for Node environment
const mockStorage = new Map();
global.sessionStorage = {
  getItem: (key) => mockStorage.get(key) || null,
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
};

global.window = {
  location: {
    search: '',
    pathname: '/',
    href: '/',
  },
};

// 1. Enable mock mode
setMockEnabled(true);
assert.strictEqual(isMockEnabled(), true, 'Mock mode should be active');
assert.strictEqual(global.sessionStorage.getItem('demo_mode'), 'true', 'sessionStorage demo_mode should be true');

// Reset mock data
resetMockData();

// 2. Test Axios mock adapter for Auth Login
console.log('1. Testing api.post("/auth/login")...');
const loginResponse = await api.post('/auth/login', {
  email: 'sarah.jenkins@taskmanagerpro.dev',
  password: 'password123',
});
assert.strictEqual(loginResponse.status, 200);
assert.strictEqual(loginResponse.data.success, true);
assert(loginResponse.data.data.token.startsWith('mock-jwt-'));
assert.strictEqual(loginResponse.data.data.email, 'sarah.jenkins@taskmanagerpro.dev');
console.log('  ✓ api.post("/auth/login") handled via mock adapter');

// Set token in memory
setAccessToken(loginResponse.data.data.token);

// 3. Test Axios mock adapter for GET /tasks
console.log('2. Testing api.get("/tasks")...');
const tasksResponse = await api.get('/tasks');
assert.strictEqual(tasksResponse.status, 200);
assert.strictEqual(tasksResponse.data.success, true);
assert(tasksResponse.data.data.length >= 8);
console.log('  ✓ api.get("/tasks") returned 8+ tasks');

// 4. Test Axios mock adapter for POST /tasks
console.log('3. Testing api.post("/tasks")...');
const createResponse = await api.post('/tasks', {
  title: 'Axios Mock Interceptor Task',
  description: 'Testing through axios client',
  status: 'In Progress',
  priority: 'Urgent',
  tags: ['integration', 'axios'],
});
assert.strictEqual(createResponse.status, 200);
assert.strictEqual(createResponse.data.success, true);
const createdId = createResponse.data.data._id;
assert(createdId.startsWith('tsk-'));
console.log('  ✓ api.post("/tasks") created task with ID:', createdId);

// 5. Test Axios mock adapter for PUT /tasks/:id
console.log('4. Testing api.put(`/tasks/${createdId}`)...');
const updateResponse = await api.put(`/tasks/${createdId}`, {
  status: 'Completed',
});
assert.strictEqual(updateResponse.status, 200);
assert.strictEqual(updateResponse.data.data.status, 'Completed');
console.log('  ✓ api.put("/tasks/:id") updated status');

// 6. Test Axios mock adapter for DELETE /tasks/:id
console.log('5. Testing api.delete(`/tasks/${createdId}`)...');
const deleteResponse = await api.delete(`/tasks/${createdId}`);
assert.strictEqual(deleteResponse.status, 200);
assert.strictEqual(deleteResponse.data.success, true);
console.log('  ✓ api.delete("/tasks/:id") deleted task');

// 7. Test Axios mock adapter error handling on non-existent task
console.log('6. Testing api error handling on non-existent task ID...');
let axiosErrorCaught = false;
try {
  await api.delete('/tasks/tsk-non-existent-12345');
} catch (err) {
  axiosErrorCaught = true;
  assert.strictEqual(err.response?.status, 400);
  assert.strictEqual(err.response?.data?.error, 'Task not found');
}
assert.strictEqual(axiosErrorCaught, true, 'Non-existent task should reject with status 400');
console.log('  ✓ Axios error response structure matched expected 400 Bad Request');

// 8. Test Users and Notifications via Axios
console.log('7. Testing api.get("/users") and api.get("/notifications")...');
const usersRes = await api.get('/users');
assert.strictEqual(usersRes.status, 200);
assert(usersRes.data.data.length >= 4);

const notifsRes = await api.get('/notifications');
assert.strictEqual(notifsRes.status, 200);
assert(notifsRes.data.data.length >= 3);

const markAllRes = await api.patch('/notifications/read-all');
assert.strictEqual(markAllRes.status, 200);
assert.strictEqual(markAllRes.data.success, true);
console.log('  ✓ Users and notifications endpoints verified via Axios');

// 9. Test Corrupted SessionStorage resilience
console.log('8. Testing corrupted sessionStorage handling...');
global.sessionStorage.setItem('taskmanager_mock_tasks_v1', '{MALFORMED_JSON:::');
const fallbackTasks = await api.get('/tasks');
assert.strictEqual(fallbackTasks.status, 200);
assert(fallbackTasks.data.data.length >= 8);
console.log('  ✓ Gracefully recovered from corrupted sessionStorage');

console.log('\n===============================================================');
console.log('=== AXIOS MOCK ADAPTER & STORAGE ADVERSARIAL TESTS PASSED!  ===');
console.log('===============================================================');
