import assert from 'node:assert';
import { getInitialMockTasks, getInitialMockUsers, getInitialMockNotifications } from '../src/mock/mockData.js';
import {
  isMockEnabled,
  setMockEnabled,
  mockLogin,
  mockRegister,
  mockGetTasks,
  mockCreateTask,
  mockUpdateTask,
  mockDeleteTask,
  mockUploadAttachment,
  mockGetUsers,
  mockGetNotifications,
  resetMockData,
} from '../src/mock/mockService.js';
import { getAccessToken, setAccessToken, clearAccessToken, hasAccessToken } from '../src/utils/tokenStorage.js';
import { sanitizeErrorMessage } from '../src/utils/errorSanitizer.js';
import {
  MAX_NAME_LENGTH,
  MAX_EMAIL_LENGTH,
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  MAX_TASK_TITLE_LENGTH,
  MAX_TASK_DESC_LENGTH,
  MAX_TAGS_COUNT,
  MAX_TAG_LENGTH,
  MAX_FILE_SIZE_BYTES,
  ALLOWED_FILE_TYPES,
  isValidEmail,
  isSafeUrl,
  isAllowedFileType,
  isAllowedFileSize,
} from '../src/utils/validation.js';

console.log('--- Starting Milestone 1 & 2 Verification Suite ---');

// 1. Verify Mock Data Seeds
console.log('1. Verifying Mock Data Seeds...');
const tasks = getInitialMockTasks();
const users = getInitialMockUsers();
const notifs = getInitialMockNotifications();

assert(tasks.length >= 8, `Expected at least 8 tasks, got ${tasks.length}`);
assert(users.length >= 4, `Expected at least 4 users, got ${users.length}`);
assert(notifs.length >= 3, `Expected at least 3 notifications, got ${notifs.length}`);

// Verify all 4 statuses are represented
const statuses = new Set(tasks.map((t) => t.status));
assert(statuses.has('Todo'), 'Missing Todo status');
assert(statuses.has('In Progress'), 'Missing In Progress status');
assert(statuses.has('Completed'), 'Missing Completed status');
assert(statuses.has('On Hold'), 'Missing On Hold status');
console.log('  ✓ All 4 statuses present:', Array.from(statuses));

// Verify all 4 priorities are represented
const priorities = new Set(tasks.map((t) => t.priority));
assert(priorities.has('Low'), 'Missing Low priority');
assert(priorities.has('Medium'), 'Missing Medium priority');
assert(priorities.has('High'), 'Missing High priority');
assert(priorities.has('Urgent'), 'Missing Urgent priority');
console.log('  ✓ All 4 priorities present:', Array.from(priorities));

// 2. Verify Mock Service Mode and Persistence
console.log('2. Verifying Mock Service Operations...');
setMockEnabled(true);
assert.strictEqual(isMockEnabled(), true, 'Mock mode should be enabled');

// Test Mock Auth
const loginRes = await mockLogin('sarah.jenkins@taskmanagerpro.dev', 'password123');
assert(loginRes.success, 'Mock login failed');
assert(loginRes.data.token.startsWith('mock-jwt-'), 'Mock token invalid format');
assert.strictEqual(loginRes.data.email, 'sarah.jenkins@taskmanagerpro.dev');
console.log('  ✓ Mock login verified');

// Test Mock Register
const regRes = await mockRegister('New Engineer', 'new.engineer@test.com', 'SecurePass123!');
assert(regRes.success, 'Mock register failed');
assert.strictEqual(regRes.data.role, 'user', 'Mock register MUST strictly default to role: user');
console.log('  ✓ Mock register strictly assigns user role');

// Test Mock Task Filtering & Search
const allTasksRes = await mockGetTasks();
assert(allTasksRes.data.length >= 8, 'Failed to fetch all mock tasks');

const urgentTasksRes = await mockGetTasks({ priority: 'Urgent' });
assert(urgentTasksRes.data.every((t) => t.priority === 'Urgent'), 'Priority filter failed');

const inProgressRes = await mockGetTasks({ status: 'In Progress' });
assert(inProgressRes.data.every((t) => t.status === 'In Progress'), 'Status filter failed');

const searchRes = await mockGetTasks({ search: 'Kubernetes' });
assert(searchRes.data.length >= 1, 'Search filter failed');
console.log('  ✓ Mock task filtering & search verified');

// Test Mock Task CRUD
const createdTaskRes = await mockCreateTask({
  title: 'Test Verification Task',
  description: 'Testing mock creation pipeline',
  status: 'Todo',
  priority: 'High',
  tags: ['test', 'ci'],
});
assert(createdTaskRes.success, 'Mock task creation failed');
const createdId = createdTaskRes.data._id;
assert(createdId, 'Mock task ID missing');

const updateRes = await mockUpdateTask(createdId, { status: 'Completed' });
assert.strictEqual(updateRes.data.status, 'Completed', 'Mock task update failed');

const deleteRes = await mockDeleteTask(createdId);
assert(deleteRes.success, 'Mock task delete failed');
console.log('  ✓ Mock task CRUD operations verified');

// 3. Verify Token Storage
console.log('3. Verifying In-Memory Token Storage...');
clearAccessToken();
assert.strictEqual(getAccessToken(), null, 'Token should initially be null');
assert.strictEqual(hasAccessToken(), false, 'hasAccessToken should be false');

setAccessToken('secure-in-memory-token-xyz');
assert.strictEqual(getAccessToken(), 'secure-in-memory-token-xyz', 'Token getter mismatch');
assert.strictEqual(hasAccessToken(), true, 'hasAccessToken should be true');

clearAccessToken();
assert.strictEqual(getAccessToken(), null, 'Token should be null after clear');
console.log('  ✓ In-memory token storage operations verified');

// 4. Verify Error Sanitizer
console.log('4. Verifying Error Sanitizer...');
const rawStackError = new Error('Database error at User.find (/var/www/server/models/User.js:45:12)');
const sanitized = sanitizeErrorMessage(rawStackError);
assert(!sanitized.includes('/var/www/'), 'Sanitizer failed to strip file paths');
assert(!sanitized.includes('User.js'), 'Sanitizer failed to strip code filename');

const axiosError = {
  response: {
    data: {
      error: 'Invalid credentials provided',
    },
  },
};
assert.strictEqual(sanitizeErrorMessage(axiosError), 'Invalid credentials provided');

const objectCrashError = { details: { code: 500 } };
const safeOutput = sanitizeErrorMessage(objectCrashError);
assert.strictEqual(typeof safeOutput, 'string', 'Sanitizer must always return string');
console.log('  ✓ Error sanitizer verified against stack leakage and object crashes');

// 5. Verify Validation Constraints & Helpers
console.log('5. Verifying Validation Constraints & Helpers...');
assert.strictEqual(MAX_NAME_LENGTH, 70);
assert.strictEqual(MAX_EMAIL_LENGTH, 254);
assert.strictEqual(MAX_PASSWORD_LENGTH, 128);
assert.strictEqual(MIN_PASSWORD_LENGTH, 8);
assert.strictEqual(MAX_TASK_TITLE_LENGTH, 150);
assert.strictEqual(MAX_TASK_DESC_LENGTH, 2000);
assert.strictEqual(MAX_TAGS_COUNT, 10);
assert.strictEqual(MAX_TAG_LENGTH, 30);
assert.strictEqual(MAX_FILE_SIZE_BYTES, 10485760);

assert.strictEqual(isValidEmail('valid.user@company.com'), true);
assert.strictEqual(isValidEmail('invalid-email'), false);
assert.strictEqual(isValidEmail(''), false);
assert.strictEqual(isValidEmail('@nodomain.com'), false);

assert.strictEqual(isSafeUrl('https://example.com/file.pdf'), true);
assert.strictEqual(isSafeUrl('/attachments/file.pdf'), true);
assert.strictEqual(isSafeUrl('javascript:alert(1)'), false);
assert.strictEqual(isSafeUrl('data:text/html,<script>alert(1)</script>'), false);
assert.strictEqual(isSafeUrl('vbscript:msgbox(1)'), false);

assert.strictEqual(isAllowedFileType({ type: 'application/pdf' }), true);
assert.strictEqual(isAllowedFileType({ type: 'image/png' }), true);
assert.strictEqual(isAllowedFileType({ type: 'application/x-msdownload' }), false);

assert.strictEqual(isAllowedFileSize({ size: 5 * 1024 * 1024 }), true);
assert.strictEqual(isAllowedFileSize({ size: 15 * 1024 * 1024 }), false);

console.log('  ✓ Validation constants, regex, XSS URL checks, and file constraints verified');

console.log('\n--- ALL VERIFICATIONS PASSED CLEANLY (100%) ---');
