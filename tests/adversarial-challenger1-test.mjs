import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
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
import api from '../src/services/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

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
console.log('=== CHALLENGER 1: MASTER PRODUCTION ADVERSARIAL TEST HARNESS ===');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// 1. IN-MEMORY TOKEN STORAGE (OWASP A07 & XSS PROTECTION)
// -----------------------------------------------------------------------------
console.log('--- 1. IN-MEMORY TOKEN STORAGE & SUBSCRIPTION LIFECYCLE ---');

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
// 2. ERROR SANITIZER (OWASP A05 & DOM SAFETY)
// -----------------------------------------------------------------------------
console.log('\n--- 2. ERROR SANITIZER (OWASP A05 & DOM CRASH DEFENSE) ---');

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
// 3. VALIDATION & SECURITY CONSTRAINTS
// -----------------------------------------------------------------------------
console.log('\n--- 3. VALIDATION & SECURITY CONSTRAINTS ---');

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
// 4. PRODUCTION API CLIENT & ZERO MOCK ARTIFACT INVARIANTS
// -----------------------------------------------------------------------------
console.log('\n--- 4. PRODUCTION API CLIENT & ZERO MOCK ARTIFACTS ---');

runSync('Production: src/mock directory completely removed', () => {
  assert(!fs.existsSync(path.join(rootDir, 'src/mock')), 'src/mock directory must not exist');
});

runSync('Production: Zero mock or demo strings in production UI', () => {
  const loginSrc = fs.readFileSync(path.join(rootDir, 'src/pages/LoginPage.jsx'), 'utf-8');
  assert(!loginSrc.includes('Demo Mode'), 'LoginPage must not contain Demo Mode');

  const regSrc = fs.readFileSync(path.join(rootDir, 'src/pages/RegisterPage.jsx'), 'utf-8');
  assert(!regSrc.includes('Demo Mode'), 'RegisterPage must not contain Demo Mode');

  const dashSrc = fs.readFileSync(path.join(rootDir, 'src/pages/DashboardPage.jsx'), 'utf-8');
  assert(!dashSrc.includes('Demo Mode Active'), 'DashboardPage must not contain Demo Mode Active');

  const navSrc = fs.readFileSync(path.join(rootDir, 'src/components/Navbar.jsx'), 'utf-8');
  assert(!navSrc.includes('Demo'), 'Navbar must not contain Demo badge');
});

runSync('Production: Axios client request interceptor injects Bearer token', async () => {
  setAccessToken('prod-token-xyz');
  const reqInterceptor = api.interceptors.request.handlers[0].fulfilled;
  const config = await reqInterceptor({ headers: {} });
  assert.strictEqual(config.headers.Authorization, 'Bearer prod-token-xyz');
  clearAccessToken();
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
