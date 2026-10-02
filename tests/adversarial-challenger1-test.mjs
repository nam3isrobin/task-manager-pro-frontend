import assert from 'node:assert';
import {
  INITIAL_MOCK_USERS,
  INITIAL_MOCK_TASKS,
  INITIAL_MOCK_NOTIFICATIONS,
  getInitialMockTasks,
  getInitialMockUsers,
  getInitialMockNotifications,
} from '../src/mock/mockData.js';
import {
  isMockEnabled,
  setMockEnabled,
  resetMockData,
  mockLogin,
  mockRegister,
  mockForgotPassword,
  mockResetPassword,
  mockGetTasks,
  mockCreateTask,
  mockUpdateTask,
  mockDeleteTask,
  mockUploadAttachment,
  mockGetUsers,
  mockGetNotifications,
  mockMarkNotificationRead,
  mockMarkAllNotificationsRead,
} from '../src/mock/mockService.js';
import {
  getAccessToken,
  setAccessToken,
  clearAccessToken,
  hasAccessToken,
  subscribeToToken,
} from '../src/utils/tokenStorage.js';
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
  sanitizeString,
} from '../src/utils/validation.js';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const findings = [];

function runSync(testName, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  [PASS] ${testName}`);
  } catch (err) {
    failedTests++;
    console.error(`  [FAIL] ${testName}`);
    console.error(`         Error: ${err.message}`);
    findings.push({ name: testName, error: err.message, stack: err.stack });
  }
}

async function runAsync(testName, fn) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`  [PASS] ${testName}`);
  } catch (err) {
    failedTests++;
    console.error(`  [FAIL] ${testName}`);
    console.error(`         Error: ${err.message}`);
    findings.push({ name: testName, error: err.message, stack: err.stack });
  }
}

console.log('================================================================');
console.log('=== CHALLENGER 1: MASTER EMPIRICAL ADVERSARIAL TEST HARNESS ===');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// 1. MOCK DATA INTEGRITY & IMMUTABILITY
// -----------------------------------------------------------------------------
console.log('--- 1. MOCK DATA INTEGRITY & IMMUTABILITY ---');

runSync('MockData: Dataset cardinality & coverage requirements', () => {
  const tasks = getInitialMockTasks();
  assert(tasks.length >= 8, `Expected >= 8 tasks, got ${tasks.length}`);

  const requiredStatuses = ['Todo', 'In Progress', 'Completed', 'On Hold'];
  const actualStatuses = new Set(tasks.map(t => t.status));
  for (const s of requiredStatuses) {
    assert(actualStatuses.has(s), `Missing required status: "${s}"`);
  }

  const requiredPriorities = ['Low', 'Medium', 'High', 'Urgent'];
  const actualPriorities = new Set(tasks.map(t => t.priority));
  for (const p of requiredPriorities) {
    assert(actualPriorities.has(p), `Missing required priority: "${p}"`);
  }
});

runSync('MockData: Users & Roles schema integrity', () => {
  const users = getInitialMockUsers();
  assert(users.length >= 4, `Expected >= 4 users, got ${users.length}`);
  for (const u of users) {
    assert(typeof u._id === 'string' && u._id.startsWith('usr-'), `Invalid user _id: ${u._id}`);
    assert(typeof u.name === 'string' && u.name.length > 0, `Invalid user name: ${u.name}`);
    assert(typeof u.email === 'string' && isValidEmail(u.email), `Invalid user email: ${u.email}`);
    assert(['admin', 'manager', 'user'].includes(u.role), `Unauthorized role: ${u.role}`);
  }
});

runSync('MockData: Notifications schema integrity', () => {
  const notifs = getInitialMockNotifications();
  assert(notifs.length >= 3, `Expected >= 3 notifications, got ${notifs.length}`);
  for (const n of notifs) {
    assert(typeof n._id === 'string' && n._id.startsWith('ntf-'), `Invalid notification _id: ${n._id}`);
    assert(typeof n.title === 'string', 'Notification missing title');
    assert(typeof n.message === 'string', 'Notification missing message');
    assert(typeof n.read === 'boolean', 'Notification missing boolean read status');
  }
});

runSync('MockData: Deep immutability of factory clone functions', () => {
  const taskClone1 = getInitialMockTasks();
  taskClone1[0].title = 'ADVERSARIAL_MUTATION_TITLE';
  taskClone1[0].tags.push('CORRUPTED_TAG');
  taskClone1.splice(1, 3);

  const taskClone2 = getInitialMockTasks();
  assert.notStrictEqual(taskClone2[0].title, 'ADVERSARIAL_MUTATION_TITLE', 'getInitialMockTasks exposed shared mutable reference!');
  assert.strictEqual(taskClone2[0].tags.includes('CORRUPTED_TAG'), false, 'getInitialMockTasks shared mutable inner array!');
  assert.strictEqual(taskClone2.length, INITIAL_MOCK_TASKS.length, 'getInitialMockTasks length was corrupted!');
});

// -----------------------------------------------------------------------------
// 2. IN-MEMORY TOKEN STORAGE (OWASP A07 & XSS PROTECTION)
// -----------------------------------------------------------------------------
console.log('\n--- 2. IN-MEMORY TOKEN STORAGE & SUBSCRIPTION LIFECYCLE ---');

runSync('TokenStorage: Null initial state', () => {
  clearAccessToken();
  assert.strictEqual(getAccessToken(), null);
  assert.strictEqual(hasAccessToken(), false);
});

runSync('TokenStorage: Set, get, overwrite, and clear operations', () => {
  setAccessToken('jwt-token-alpha-123');
  assert.strictEqual(getAccessToken(), 'jwt-token-alpha-123');
  assert.strictEqual(hasAccessToken(), true);

  setAccessToken('jwt-token-beta-456');
  assert.strictEqual(getAccessToken(), 'jwt-token-beta-456');
  assert.strictEqual(hasAccessToken(), true);

  clearAccessToken();
  assert.strictEqual(getAccessToken(), null);
  assert.strictEqual(hasAccessToken(), false);
});

runSync('TokenStorage: Falsy values and type normalization', () => {
  setAccessToken('');
  assert.strictEqual(getAccessToken(), null);

  setAccessToken(null);
  assert.strictEqual(getAccessToken(), null);

  setAccessToken(undefined);
  assert.strictEqual(getAccessToken(), null);

  setAccessToken(0);
  assert.strictEqual(getAccessToken(), null);
});

runSync('TokenStorage: Reactive subscriber notifications and isolation', () => {
  const receivedTokens = [];
  const unsubscribe1 = subscribeToToken((token) => receivedTokens.push(token));
  
  // Subscriber that throws intentionally
  const unsubscribe2 = subscribeToToken(() => {
    throw new Error('Intentional crash in subscriber');
  });

  setAccessToken('sub-token-1');
  assert.deepStrictEqual(receivedTokens, ['sub-token-1']);
  assert.strictEqual(getAccessToken(), 'sub-token-1', 'State update must succeed despite subscriber exception');

  // Unsubscribe
  unsubscribe1();
  unsubscribe2();

  setAccessToken('sub-token-2');
  assert.deepStrictEqual(receivedTokens, ['sub-token-1'], 'Unsubscribed callback must not receive updates');
  clearAccessToken();
});

// -----------------------------------------------------------------------------
// 3. ERROR SANITIZER (OWASP A05 & DOM SAFETY)
// -----------------------------------------------------------------------------
console.log('\n--- 3. ERROR SANITIZER (OWASP A05 & DOM CRASH DEFENSE) ---');

runSync('ErrorSanitizer: Handles null, undefined, and non-object inputs safely', () => {
  assert.strictEqual(sanitizeErrorMessage(null), 'An unexpected error occurred. Please try again.');
  assert.strictEqual(sanitizeErrorMessage(undefined), 'An unexpected error occurred. Please try again.');
  assert.strictEqual(sanitizeErrorMessage(false), 'An unexpected error occurred. Please try again.');
  assert.strictEqual(sanitizeErrorMessage(404), 'An unexpected error occurred. Please try again.');
  assert.strictEqual(sanitizeErrorMessage(''), 'An unexpected error occurred. Please try again.');
  assert.strictEqual(sanitizeErrorMessage('   '), 'An unexpected error occurred. Please try again.');
});

runSync('ErrorSanitizer: Custom fallback message support', () => {
  assert.strictEqual(sanitizeErrorMessage(null, 'Network connection failed'), 'Network connection failed');
  assert.strictEqual(sanitizeErrorMessage('', 'Custom fallback'), 'Custom fallback');
});

runSync('ErrorSanitizer: Strips stack traces and code frames', () => {
  const err = new Error('Syntax error at parseJson (/home/app/utils/json.js:42:15) at processTicksAndRejections (node:internal/process/task_queues:95:5)');
  const sanitized = sanitizeErrorMessage(err);
  assert(!sanitized.includes('/home/app/utils'), 'Exposed path in sanitized error');
  assert(!sanitized.includes('json.js'), 'Exposed filename in sanitized error');
  assert(!sanitized.includes('at parseJson'), 'Exposed stack frame in sanitized error');
});

runSync('ErrorSanitizer: Strips Unix and Windows file system paths', () => {
  const unixErr = new Error('Failed to load configuration from /etc/ssl/certs/private.key');
  const sanitizedUnix = sanitizeErrorMessage(unixErr);
  assert(!sanitizedUnix.includes('/etc/ssl/certs'), `Exposed Unix path: ${sanitizedUnix}`);

  const winErr = new Error('Missing binary D:\\Production\\Backend\\service.dll');
  const sanitizedWin = sanitizeErrorMessage(winErr);
  assert(!sanitizedWin.includes('D:\\Production'), `Exposed Windows path: ${sanitizedWin}`);
});

runSync('ErrorSanitizer: Strips internal URLs and endpoints', () => {
  const err = new Error('HTTP 502 from https://vault-internal.prod.aws.internal:8200/v1/auth/token');
  const sanitized = sanitizeErrorMessage(err);
  assert(!sanitized.includes('https://vault-internal'), `Exposed internal URL: ${sanitized}`);
});

runSync('ErrorSanitizer: Strips DB and SQL internals', () => {
  const mongoErr = new Error('MongoError: E11000 duplicate key error collection: users index: email_1 dup key');
  const sanitizedMongo = sanitizeErrorMessage(mongoErr);
  assert(!sanitizedMongo.includes('MongoError'), 'Exposed MongoError');
  assert(!sanitizedMongo.includes('E11000'), 'Exposed E11000');

  const sqlErr = new Error('SQLSTATE[42S02]: Base table not found: 1146 Table tasks does not exist');
  const sanitizedSql = sanitizeErrorMessage(sqlErr);
  assert(!sanitizedSql.includes('SQLSTATE'), 'Exposed SQLSTATE');
});

runSync('ErrorSanitizer: Strips raw JS exception names', () => {
  const typeErr = new Error('TypeError: Cannot read properties of null (reading "map")');
  const sanitized = sanitizeErrorMessage(typeErr);
  assert(!sanitized.includes('TypeError:'), 'Exposed TypeError:');
});

runSync('ErrorSanitizer: Parses Axios-style response payloads (error, message, msg, nested)', () => {
  assert.strictEqual(
    sanitizeErrorMessage({ response: { data: { error: 'Account suspended by administrator' } } }),
    'Account suspended by administrator'
  );
  assert.strictEqual(
    sanitizeErrorMessage({ response: { data: { message: 'Password is too weak' } } }),
    'Password is too weak'
  );
  assert.strictEqual(
    sanitizeErrorMessage({ response: { data: { msg: 'Rate limit exceeded' } } }),
    'Rate limit exceeded'
  );
  assert.strictEqual(
    sanitizeErrorMessage({ response: { data: { error: { message: 'Deep nested payload message' } } } }),
    'Deep nested payload message'
  );
});

runSync('ErrorSanitizer: Bounds string length to MAX_ERROR_LENGTH (200 chars)', () => {
  const hugeErr = new Error('Z'.repeat(1000));
  const res = sanitizeErrorMessage(hugeErr);
  assert(res.length <= 205, `Length ${res.length} exceeded maximum bound`);
  assert(res.endsWith('...'), `Expected ellipsis, got ${res}`);
});

// -----------------------------------------------------------------------------
// 4. MOCK AUTH & DEMO MODE TOGGLE
// -----------------------------------------------------------------------------
console.log('\n--- 4. MOCK AUTHENTICATION & DEMO MODE ---');

runSync('MockAuth: isMockEnabled and setMockEnabled state toggle', () => {
  setMockEnabled(true);
  assert.strictEqual(isMockEnabled(), true);
  setMockEnabled(false);
  assert.strictEqual(isMockEnabled(), false);
  setMockEnabled(true);
});

await runAsync('MockAuth: mockLogin with Sarah Jenkins (admin)', async () => {
  const res = await mockLogin('sarah.jenkins@taskmanagerpro.dev', 'password123');
  assert.strictEqual(res.success, true);
  assert(res.data.token.startsWith('mock-jwt-usr-101'));
  assert.strictEqual(res.data.name, 'Sarah Jenkins');
  assert.strictEqual(res.data.role, 'admin');
  assert.strictEqual(res.data.email, 'sarah.jenkins@taskmanagerpro.dev');
});

await runAsync('MockAuth: mockLogin email case-insensitivity', async () => {
  const res = await mockLogin('SARAH.JENKINS@TASKMANAGERPRO.DEV', 'password');
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.data.email, 'sarah.jenkins@taskmanagerpro.dev');
});

await runAsync('MockAuth: mockLogin with unknown email falls back to demo account', async () => {
  const res = await mockLogin('random.guest@example.com', 'password');
  assert.strictEqual(res.success, true);
  assert(res.data.token.startsWith('mock-jwt-'));
  assert.strictEqual(res.data.role, 'admin');
});

await runAsync('MockAuth: mockRegister enforces role: "user" strictly', async () => {
  const email = `challenger.user.${Date.now()}@domain.org`;
  const res = await mockRegister('Challenger Verifier', email, 'SuperSecurePassword123!');
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.data.role, 'user', 'Public register MUST strictly default to role: user');
  assert.strictEqual(res.data.name, 'Challenger Verifier');
  assert.strictEqual(res.data.email, email.toLowerCase());
  assert(res.data.token.startsWith('mock-jwt-'));
});

await runAsync('MockAuth: mockRegister duplicate email rejection', async () => {
  let threw = false;
  try {
    await mockRegister('Duplicate User', 'sarah.jenkins@taskmanagerpro.dev', 'pass123');
  } catch (err) {
    threw = true;
    assert.strictEqual(err.message, 'A user with this email address already exists');
  }
  assert.strictEqual(threw, true);
});

await runAsync('MockAuth: mockForgotPassword and mockResetPassword responses', async () => {
  const forgot = await mockForgotPassword('sarah.jenkins@taskmanagerpro.dev');
  assert.strictEqual(forgot.success, true);
  assert(typeof forgot.message === 'string');

  const reset = await mockResetPassword('sarah.jenkins@taskmanagerpro.dev', 'BrandNewPassword123!');
  assert.strictEqual(reset.success, true);
  assert(typeof reset.message === 'string');
});

// -----------------------------------------------------------------------------
// 5. MOCK TASK OPERATIONS, SEARCH, FILTERING, SORTING & CRUD
// -----------------------------------------------------------------------------
console.log('\n--- 5. MOCK TASK OPERATIONS & ADVERSARIAL EDGE CASES ---');

// Reset mock state
resetMockData();

await runAsync('MockTasks: mockGetTasks default returns all seeded tasks sorted by -createdAt', async () => {
  const res = await mockGetTasks();
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.data.length, INITIAL_MOCK_TASKS.length);
  assert.strictEqual(res.total, INITIAL_MOCK_TASKS.length);

  for (let i = 0; i < res.data.length - 1; i++) {
    const t1 = new Date(res.data[i].createdAt).getTime();
    const t2 = new Date(res.data[i + 1].createdAt).getTime();
    assert(t1 >= t2, `Default sort ordering broken: ${res.data[i].createdAt} vs ${res.data[i+1].createdAt}`);
  }
});

await runAsync('MockTasks: Search edge cases - empty string, whitespace, null', async () => {
  const empty = await mockGetTasks({ search: '' });
  assert.strictEqual(empty.data.length, INITIAL_MOCK_TASKS.length);

  const spaces = await mockGetTasks({ search: '     ' });
  assert.strictEqual(spaces.data.length, INITIAL_MOCK_TASKS.length);

  const undef = await mockGetTasks({ search: undefined });
  assert.strictEqual(undef.data.length, INITIAL_MOCK_TASKS.length);
});

await runAsync('MockTasks: Search - title, description, and tags multi-field coverage', async () => {
  // Title match
  const tSearch = await mockGetTasks({ search: 'Authentication' });
  assert(tSearch.data.length >= 1);
  assert(tSearch.data.some(t => t.title.toLowerCase().includes('authentication')));

  // Description match
  const dSearch = await mockGetTasks({ search: 'microservices' });
  assert(dSearch.data.length >= 1);

  // Tag match
  const tagSearch = await mockGetTasks({ search: 'owasp' });
  assert(tagSearch.data.length >= 1);
  assert(tagSearch.data.some(t => t.tags.includes('owasp')));
});

await runAsync('MockTasks: Search - Case-insensitivity & special characters safety', async () => {
  const upper = await mockGetTasks({ search: 'ZERO-TRUST' });
  assert(upper.data.length >= 1);

  // Regex characters in search string (must not crash or throw RegExp errors)
  const regexChars = await mockGetTasks({ search: '.*+?^${}()|[]\\' });
  assert.strictEqual(regexChars.data.length, 0);

  // Unicode search query
  const unicode = await mockGetTasks({ search: 'Р' });
  assert(Array.isArray(unicode.data));
});

await runAsync('MockTasks: Status filter across all 4 statuses', async () => {
  const statuses = ['Todo', 'In Progress', 'Completed', 'On Hold'];
  for (const s of statuses) {
    const res = await mockGetTasks({ status: s });
    assert(res.data.length > 0, `No tasks found for status "${s}"`);
    assert(res.data.every(t => t.status.toLowerCase() === s.toLowerCase()), `Filter returned wrong status for "${s}"`);
  }
});

await runAsync('MockTasks: Priority filter across all 4 priorities', async () => {
  const priorities = ['Low', 'Medium', 'High', 'Urgent'];
  for (const p of priorities) {
    const res = await mockGetTasks({ priority: p });
    assert(res.data.length > 0, `No tasks found for priority "${p}"`);
    assert(res.data.every(t => t.priority.toLowerCase() === p.toLowerCase()), `Filter returned wrong priority for "${p}"`);
  }
});

await runAsync('MockTasks: Combined status and priority filtering', async () => {
  const res = await mockGetTasks({ status: 'On Hold', priority: 'Urgent' });
  assert(res.data.length >= 1);
  assert(res.data.every(t => t.status === 'On Hold' && t.priority === 'Urgent'));
});

await runAsync('MockTasks: Sorting by createdAt (asc/desc) and dueDate (asc/desc)', async () => {
  // 1. sort: 'createdAt' (oldest first)
  const ascCreated = await mockGetTasks({ sort: 'createdAt' });
  for (let i = 0; i < ascCreated.data.length - 1; i++) {
    const t1 = new Date(ascCreated.data[i].createdAt).getTime();
    const t2 = new Date(ascCreated.data[i + 1].createdAt).getTime();
    assert(t1 <= t2, `Ascending createdAt failed`);
  }

  // 2. sort: '-createdAt' (newest first)
  const descCreated = await mockGetTasks({ sort: '-createdAt' });
  for (let i = 0; i < descCreated.data.length - 1; i++) {
    const t1 = new Date(descCreated.data[i].createdAt).getTime();
    const t2 = new Date(descCreated.data[i + 1].createdAt).getTime();
    assert(t1 >= t2, `Descending createdAt failed`);
  }

  // 3. sort: 'dueDate' (earliest first)
  const ascDue = await mockGetTasks({ sort: 'dueDate' });
  for (let i = 0; i < ascDue.data.length - 1; i++) {
    const t1 = new Date(ascDue.data[i].dueDate || 0).getTime();
    const t2 = new Date(ascDue.data[i + 1].dueDate || 0).getTime();
    assert(t1 <= t2, `Ascending dueDate failed`);
  }

  // 4. sort: '-dueDate' (latest first)
  const descDue = await mockGetTasks({ sort: '-dueDate' });
  for (let i = 0; i < descDue.data.length - 1; i++) {
    const t1 = new Date(descDue.data[i].dueDate || 0).getTime();
    const t2 = new Date(descDue.data[i + 1].dueDate || 0).getTime();
    assert(t1 >= t2, `Descending dueDate failed`);
  }
});

await runAsync('MockTasks: Priority sorting investigation (-priority and priority)', async () => {
  const pSortDesc = await mockGetTasks({ sort: '-priority' });
  assert.strictEqual(pSortDesc.success, true);
  assert(pSortDesc.data.length >= 8);
  console.log(`         [Observation] mockGetTasks({ sort: '-priority' }) returned ${pSortDesc.data.length} tasks`);
});

await runAsync('MockTasks: Task creation across all 4 statuses and 4 priorities', async () => {
  const statuses = ['Todo', 'In Progress', 'Completed', 'On Hold'];
  const priorities = ['Low', 'Medium', 'High', 'Urgent'];

  for (let i = 0; i < 4; i++) {
    const s = statuses[i];
    const p = priorities[i];

    const createRes = await mockCreateTask({
      title: `Task Matrix Test ${s} / ${p}`,
      description: `Description for ${s} and ${p}`,
      status: s,
      priority: p,
      tags: ['matrix-test', s.toLowerCase()],
      assignedTo: 'usr-102',
    });

    assert.strictEqual(createRes.success, true);
    assert.strictEqual(createRes.data.status, s);
    assert.strictEqual(createRes.data.priority, p);
    assert.strictEqual(createRes.data.assignedTo?._id, 'usr-102');
    assert(createRes.data._id.startsWith('tsk-'));
  }
});

await runAsync('MockTasks: Task update across all 4 statuses and 4 priorities', async () => {
  const tasks = (await mockGetTasks()).data;
  const targetTask = tasks[0];

  const statuses = ['Todo', 'In Progress', 'Completed', 'On Hold'];
  const priorities = ['Low', 'Medium', 'High', 'Urgent'];

  for (let i = 0; i < 4; i++) {
    const updateRes = await mockUpdateTask(targetTask._id, {
      status: statuses[i],
      priority: priorities[i],
      title: `Updated Title ${i}`,
    });

    assert.strictEqual(updateRes.success, true);
    assert.strictEqual(updateRes.data.status, statuses[i]);
    assert.strictEqual(updateRes.data.priority, priorities[i]);
  }
});

await runAsync('MockTasks: Non-existent Task ID handling across update, delete, attachments', async () => {
  const nonExistentId = 'tsk-non-existent-id-404';

  // Update non-existent
  let updateErr = false;
  try {
    await mockUpdateTask(nonExistentId, { title: 'Ghost' });
  } catch (err) {
    updateErr = true;
    assert.strictEqual(err.message, 'Task not found');
  }
  assert.strictEqual(updateErr, true);

  // Delete non-existent
  let deleteErr = false;
  try {
    await mockDeleteTask(nonExistentId);
  } catch (err) {
    deleteErr = true;
    assert.strictEqual(err.message, 'Task not found');
  }
  assert.strictEqual(deleteErr, true);

  // Attachment upload to non-existent
  let attachErr = false;
  try {
    await mockUploadAttachment(nonExistentId, { name: 'test.pdf', size: 1024 });
  } catch (err) {
    attachErr = true;
    assert.strictEqual(err.message, 'Task not found');
  }
  assert.strictEqual(attachErr, true);
});

await runAsync('MockTasks: Attachment upload on existing task', async () => {
  const tasks = (await mockGetTasks()).data;
  const t = tasks[0];

  const uploadRes = await mockUploadAttachment(t._id, {
    name: 'architecture-diagram.png',
    size: 450000,
  });

  assert.strictEqual(uploadRes.success, true);
  const lastAtt = uploadRes.data.attachments[uploadRes.data.attachments.length - 1];
  assert.strictEqual(lastAtt.filename, 'architecture-diagram.png');
  assert.strictEqual(lastAtt.size, 450000);
});

await runAsync('MockTasks: Notifications operations & unread count workflow', async () => {
  const notifs = (await mockGetNotifications()).data;
  assert(notifs.length >= 3);

  // Mark single read
  const unread = notifs.find(n => !n.read) || notifs[0];
  const markRes = await mockMarkNotificationRead(unread._id);
  assert.strictEqual(markRes.success, true);
  assert.strictEqual(markRes.data.read, true);

  // Mark non-existent notification
  const invalidNotif = await mockMarkNotificationRead('ntf-invalid-999');
  assert.strictEqual(invalidNotif.success, false);

  // Mark all read
  const markAll = await mockMarkAllNotificationsRead();
  assert.strictEqual(markAll.success, true);

  const updatedNotifs = (await mockGetNotifications()).data;
  assert(updatedNotifs.every(n => n.read === true));
});

await runAsync('MockTasks: Demo Mode Reset cleans mutated state and restores initial seeds', async () => {
  // Capture current length before deleting
  const preDeleteTasks = (await mockGetTasks()).data;
  const preCount = preDeleteTasks.length;
  await mockDeleteTask(preDeleteTasks[0]._id);
  await mockDeleteTask(preDeleteTasks[1]._id);

  const mutatedTasks = (await mockGetTasks()).data;
  assert.strictEqual(mutatedTasks.length, preCount - 2, 'Task count must decrease by 2 after deletions');

  // Reset
  const resetRes = resetMockData();
  assert.strictEqual(resetRes.tasks.length, INITIAL_MOCK_TASKS.length, 'Reset should restore initial tasks count');
  assert.strictEqual(resetRes.users.length, INITIAL_MOCK_USERS.length, 'Reset should restore initial users count');
  assert.strictEqual(resetRes.notifications.length, INITIAL_MOCK_NOTIFICATIONS.length, 'Reset should restore initial notifications count');

  const freshTasks = (await mockGetTasks()).data;
  assert.strictEqual(freshTasks.length, INITIAL_MOCK_TASKS.length);
});

// -----------------------------------------------------------------------------
// 6. VALIDATION & SECURITY CONSTRAINTS
// -----------------------------------------------------------------------------
console.log('\n--- 6. VALIDATION & SECURITY CONSTRAINTS ---');

runSync('Validation: Numeric length and size bounds', () => {
  assert.strictEqual(MAX_NAME_LENGTH, 70);
  assert.strictEqual(MAX_EMAIL_LENGTH, 254);
  assert.strictEqual(MAX_PASSWORD_LENGTH, 128);
  assert.strictEqual(MIN_PASSWORD_LENGTH, 8);
  assert.strictEqual(MAX_TASK_TITLE_LENGTH, 150);
  assert.strictEqual(MAX_TASK_DESC_LENGTH, 2000);
  assert.strictEqual(MAX_TAGS_COUNT, 10);
  assert.strictEqual(MAX_TAG_LENGTH, 30);
  assert.strictEqual(MAX_FILE_SIZE_BYTES, 10485760);
});

runSync('Validation: isValidEmail test matrix', () => {
  assert.strictEqual(isValidEmail('admin@taskmanagerpro.dev'), true);
  assert.strictEqual(isValidEmail('sarah.j+enterprise@subdomain.corp.co'), true);
  assert.strictEqual(isValidEmail(''), false);
  assert.strictEqual(isValidEmail(null), false);
  assert.strictEqual(isValidEmail('plain-string'), false);
  assert.strictEqual(isValidEmail('@missinguser.com'), false);
  assert.strictEqual(isValidEmail('user@.com'), false);
});

runSync('Validation: isSafeUrl XSS attack defense matrix', () => {
  assert.strictEqual(isSafeUrl('https://taskmanagerpro.dev/docs/spec.pdf'), true);
  assert.strictEqual(isSafeUrl('/uploads/spec.pdf'), true);
  assert.strictEqual(isSafeUrl('./spec.pdf'), true);
  assert.strictEqual(isSafeUrl('#overview'), true);
  assert.strictEqual(isSafeUrl('blob:http://localhost:5173/12345'), true);

  // Attack vectors
  assert.strictEqual(isSafeUrl('javascript:alert(document.cookie)'), false);
  assert.strictEqual(isSafeUrl('JAVASCRIPT:alert(1)'), false);
  assert.strictEqual(isSafeUrl('vbscript:msgbox(1)'), false);
  assert.strictEqual(isSafeUrl('data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=='), false);
  assert.strictEqual(isSafeUrl(null), false);
  assert.strictEqual(isSafeUrl(''), false);
});

runSync('Validation: File type and size limits', () => {
  assert.strictEqual(isAllowedFileType({ type: 'application/pdf' }), true);
  assert.strictEqual(isAllowedFileType({ type: 'image/png' }), true);
  assert.strictEqual(isAllowedFileType({ type: 'image/jpeg' }), true);
  assert.strictEqual(isAllowedFileType({ type: 'application/x-sh' }), false);
  assert.strictEqual(isAllowedFileType({ type: 'application/x-msdos-program' }), false);
  assert.strictEqual(isAllowedFileType({ name: 'document.pdf' }), true);
  assert.strictEqual(isAllowedFileType({ name: 'payload.exe' }), false);

  assert.strictEqual(isAllowedFileSize({ size: 10485760 }), true); // Exactly 10MB
  assert.strictEqual(isAllowedFileSize({ size: 10485761 }), false); // 10MB + 1 byte
});

runSync('Validation: sanitizeString bounds', () => {
  assert.strictEqual(sanitizeString('   Clean Text   ', 50), 'Clean Text');
  assert.strictEqual(sanitizeString('1234567890', 5), '12345');
  assert.strictEqual(sanitizeString(null), '');
});

// -----------------------------------------------------------------------------
// HARNESS EXECUTION SUMMARY
// -----------------------------------------------------------------------------
console.log('\n================================================================');
console.log(`=== HARNESS COMPLETE: ${passedTests}/${totalTests} TESTS PASSED ===`);
console.log(`=== STATUS: ${failedTests === 0 ? 'SUCCESS (100% PASS)' : 'FAILURES DETECTED'} ===`);
console.log('================================================================\n');

if (failedTests > 0) {
  console.error(`Total failures: ${failedTests}`);
  process.exit(1);
} else {
  process.exit(0);
}
