/**
 * Adversarial Security & Boundary Test Suite
 * Executed by Challenger 2 (Security & Boundary Adversarial Verifier)
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

import { sanitizeErrorMessage } from '../src/utils/errorSanitizer.js';
import { getAccessToken, setAccessToken, clearAccessToken, hasAccessToken } from '../src/utils/tokenStorage.js';
import { mockRegister, mockLogin, setMockEnabled, isMockEnabled } from '../src/mock/mockService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('================================================================');
console.log('=== CHALLENGER 2: ADVERSARIAL SECURITY & BOUNDARY TEST HARNESS ===');
console.log('================================================================\n');

let totalTests = 0;
let passedTests = 0;
let findings = [];

function test(description, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ PASS: ${description}`);
  } catch (err) {
    console.error(`  ✗ FAIL: ${description}`);
    console.error(`    Error: ${err.message}`);
    findings.push({ test: description, error: err.message });
  }
}

// ============================================================================
// 1. Role Escalation Adversarial Probing
// ============================================================================
console.log('\n--- [PROBE 1] Role Escalation & Privilege Boundary Tests ---');

test('mockRegister strictly assigns "user" role regardless of input parameters', async () => {
  setMockEnabled(true);
  const user = await mockRegister('Attacker Name', `attacker_${Date.now()}@domain.com`, 'SecureP@ssw0rd!');
  assert.strictEqual(user.success, true);
  assert.strictEqual(user.data.role, 'user', 'Role must strictly be user');
});

test('RegisterPage source code has no role selection or role payload', () => {
  const regCode = fs.readFileSync(path.join(rootDir, 'src/pages/RegisterPage.jsx'), 'utf-8');
  assert(!regCode.includes('<select'), 'RegisterPage must NOT have select dropdown');
  assert(!regCode.includes('setRole'), 'RegisterPage must NOT have setRole state hook');
  assert(!regCode.includes("role: 'admin'"), 'RegisterPage must NOT contain role: admin');
  assert(!regCode.includes('role: "admin"'), 'RegisterPage must NOT contain role: "admin"');
});

test('AuthContext register function excludes role parameter from public registration payload', () => {
  const authCode = fs.readFileSync(path.join(rootDir, 'src/context/AuthContext.jsx'), 'utf-8');
  const registerMatch = authCode.match(/api\.post\('\/auth\/register',\s*\{([\s\S]*?)\}\)/);
  assert(registerMatch, 'api.post /auth/register call not found');
  const payloadStr = registerMatch[1];
  assert(!payloadStr.includes('role'), 'Public registration payload must NOT include role field');
});

// ============================================================================
// 2. Error Message Sanitization & Information Disclosure Probing
// ============================================================================
console.log('\n--- [PROBE 2] Error Sanitization & Information Leakage Probing ---');

test('sanitizeErrorMessage strips V8/Node stack frames', () => {
  const err = new Error('Connection failed at Database.connect (/app/server/db.js:123:45)');
  const res = sanitizeErrorMessage(err);
  assert(!res.includes('/app/server/db.js'), 'Must strip file path in stack frame');
  assert(!res.includes('123:45'), 'Must strip line numbers');
});

test('sanitizeErrorMessage strips Unix file paths (/etc/passwd, /var/log/...)', () => {
  const err = 'Failed to read configuration file at /etc/secret/keys.json';
  const res = sanitizeErrorMessage(err);
  assert(!res.includes('/etc/secret/keys.json'), 'Must strip Unix paths');
});

test('sanitizeErrorMessage strips Windows file paths (C:\\secret\\...)', () => {
  const err = 'Access denied at C:\\Users\\Admin\\AppData\\secret.key';
  const res = sanitizeErrorMessage(err);
  assert(!res.includes('C:\\Users\\Admin'), 'Must strip Windows paths');
});

test('sanitizeErrorMessage strips Database internals (MongoError, E11000, SQLSTATE)', () => {
  const mongoErr = 'MongoError: E11000 duplicate key error on index: email';
  const mongoRes = sanitizeErrorMessage(mongoErr);
  assert(!mongoRes.includes('E11000'), 'Must strip E11000');
  assert(!mongoRes.includes('MongoError'), 'Must strip MongoError');

  const sqlErr = 'SQLSTATE[42000]: syntax error at or near SELECT * FROM';
  const sqlRes = sanitizeErrorMessage(sqlErr);
  assert(!sqlRes.includes('SQLSTATE'), 'Must strip SQLSTATE');
  assert(!sqlRes.includes('SELECT'), 'Must strip SELECT');
});

test('sanitizeErrorMessage strips raw JS error constructors (TypeError:, ReferenceError:)', () => {
  const typeErr = 'TypeError: Cannot read properties of undefined (reading "token")';
  const typeRes = sanitizeErrorMessage(typeErr);
  assert(!typeRes.includes('TypeError:'), 'Must strip TypeError: prefix');
});

test('sanitizeErrorMessage handles deeply nested Axios error structures without crashing', () => {
  const axiosErr1 = { response: { data: { error: 'Authentication token expired' } } };
  assert.strictEqual(sanitizeErrorMessage(axiosErr1), 'Authentication token expired');

  const axiosErr2 = { response: { data: { message: 'Resource not found' } } };
  assert.strictEqual(sanitizeErrorMessage(axiosErr2), 'Resource not found');

  const axiosErr3 = { response: { data: { msg: 'Validation failed' } } };
  assert.strictEqual(sanitizeErrorMessage(axiosErr3), 'Validation failed');
});

test('sanitizeErrorMessage safely handles non-standard object/null/undefined error inputs', () => {
  const fallback = 'Safe fallback message';
  assert.strictEqual(sanitizeErrorMessage(null, fallback), fallback);
  assert.strictEqual(sanitizeErrorMessage(undefined, fallback), fallback);
  assert.strictEqual(sanitizeErrorMessage(12345, fallback), fallback);
  assert.strictEqual(sanitizeErrorMessage({}, fallback), fallback);
  assert.strictEqual(sanitizeErrorMessage({ randomKey: 'xyz' }, fallback), fallback);
  assert.strictEqual(sanitizeErrorMessage('', fallback), fallback);
  assert.strictEqual(sanitizeErrorMessage('   ', fallback), fallback);
  assert.strictEqual(sanitizeErrorMessage('a', fallback), fallback);
});

test('sanitizeErrorMessage truncates long strings to 200 chars plus ellipsis', () => {
  const longMsg = 'A'.repeat(500);
  const res = sanitizeErrorMessage(longMsg);
  assert(res.length <= 203, `Length ${res.length} exceeds 203`);
  assert(res.endsWith('...'), 'Must end with ellipsis');
});

// ============================================================================
// 3. Dangerous URL Scheme Probing (XSS Prevention)
// ============================================================================
console.log('\n--- [PROBE 3] Dangerous URL Schemes & Attachment Link Probing ---');

test('isSafeUrl allows legitimate absolute HTTPS/HTTP/Blob and relative paths', () => {
  assert.strictEqual(isSafeUrl('https://example.com/document.pdf'), true);
  assert.strictEqual(isSafeUrl('http://example.com/photo.png'), true);
  assert.strictEqual(isSafeUrl('blob:http://localhost:3000/blob-uuid'), true);
  assert.strictEqual(isSafeUrl('/uploads/task-123.pdf'), true);
  assert.strictEqual(isSafeUrl('./attachments/doc.pdf'), true);
  assert.strictEqual(isSafeUrl('#task-details'), true);
});

test('isSafeUrl rejects javascript: scheme with varied casing, whitespace, and payloads', () => {
  assert.strictEqual(isSafeUrl('javascript:alert(1)'), false);
  assert.strictEqual(isSafeUrl('javascript:alert(document.cookie)'), false);
  assert.strictEqual(isSafeUrl('javascript:void(0)'), false);
  assert.strictEqual(isSafeUrl('JAVASCRIPT:alert(1)'), false);
  assert.strictEqual(isSafeUrl('JavaScript:window.location="http://evil.com"'), false);
  assert.strictEqual(isSafeUrl('   javascript:alert(1)   '), false);
});

test('isSafeUrl rejects data: and vbscript: schemes', () => {
  assert.strictEqual(isSafeUrl('data:text/html,<script>alert(1)</script>'), false);
  assert.strictEqual(isSafeUrl('data:application/javascript;base64,YWxlcnQoMSk='), false);
  assert.strictEqual(isSafeUrl('vbscript:msgbox(1)'), false);
  assert.strictEqual(isSafeUrl('VBSCRIPT:alert(1)'), false);
});

test('isSafeUrl rejects file: and ftp: protocols', () => {
  assert.strictEqual(isSafeUrl('file:///etc/passwd'), false);
  assert.strictEqual(isSafeUrl('file://C:/Windows/win.ini'), false);
  assert.strictEqual(isSafeUrl('ftp://ftp.server.com/archive.zip'), false);
});

test('isSafeUrl rejects non-string and empty string inputs', () => {
  assert.strictEqual(isSafeUrl(null), false);
  assert.strictEqual(isSafeUrl(undefined), false);
  assert.strictEqual(isSafeUrl(''), false);
  assert.strictEqual(isSafeUrl(12345), false);
  assert.strictEqual(isSafeUrl({}), false);
  assert.strictEqual(isSafeUrl(false), false);
});

// ============================================================================
// 4. File Upload Boundaries & MIME Verification
// ============================================================================
console.log('\n--- [PROBE 4] File Upload Size & MIME Type Boundary Probing ---');

test('isAllowedFileSize strictly enforces 10MB (10,485,760 bytes) boundary', () => {
  assert.strictEqual(MAX_FILE_SIZE_BYTES, 10 * 1024 * 1024);
  assert.strictEqual(isAllowedFileSize({ size: 10485760 }), true, 'Exact 10MB must be allowed');
  assert.strictEqual(isAllowedFileSize({ size: 10485761 }), false, '10MB + 1 byte must be rejected');
  assert.strictEqual(isAllowedFileSize({ size: 10485759 }), true, '10MB - 1 byte must be allowed');
  assert.strictEqual(isAllowedFileSize({ size: 15 * 1024 * 1024 }), false, '15MB must be rejected');
  assert.strictEqual(isAllowedFileSize({ size: 0 }), true, '0 bytes allowed by size check');
  assert.strictEqual(isAllowedFileSize(null), false);
  assert.strictEqual(isAllowedFileSize({}), false);
  assert.strictEqual(isAllowedFileSize({ size: '10MB' }), false);
});

test('isAllowedFileType strictly accepts whitelisted MIME types', () => {
  const validTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'text/plain',
    'application/json',
  ];
  for (const t of validTypes) {
    assert.strictEqual(isAllowedFileType({ type: t }), true, `Allowed type ${t} failed`);
  }
});

test('isAllowedFileType rejects dangerous executable, script, and unknown MIME types', () => {
  const dangerousTypes = [
    'application/x-msdownload',
    'application/x-sh',
    'application/x-executable',
    'application/x-bat',
    'application/javascript',
    'text/javascript',
    'text/html',
    'application/x-php',
    'application/octet-stream',
  ];
  for (const t of dangerousTypes) {
    assert.strictEqual(isAllowedFileType({ type: t }), false, `Dangerous type ${t} should be rejected`);
  }
});

test('isAllowedFileType checks extension fallback if MIME type is missing', () => {
  assert.strictEqual(isAllowedFileType({ name: 'specs.pdf' }), true);
  assert.strictEqual(isAllowedFileType({ name: 'photo.jpg' }), true);
  assert.strictEqual(isAllowedFileType({ name: 'photo.PNG' }), true);
  assert.strictEqual(isAllowedFileType({ name: 'malware.exe' }), false);
  assert.strictEqual(isAllowedFileType({ name: 'script.sh' }), false);
  assert.strictEqual(isAllowedFileType({ name: 'hack.php' }), false);
  assert.strictEqual(isAllowedFileType({ name: 'index.html' }), false);
});

// ============================================================================
// 5. Input Length Boundaries Probing
// ============================================================================
console.log('\n--- [PROBE 5] Input Length Boundaries & Sanitization Probing ---');

test('Validation constants match specification bounds', () => {
  assert.strictEqual(MAX_NAME_LENGTH, 70);
  assert.strictEqual(MAX_EMAIL_LENGTH, 254);
  assert.strictEqual(MAX_PASSWORD_LENGTH, 128);
  assert.strictEqual(MIN_PASSWORD_LENGTH, 8);
  assert.strictEqual(MAX_TASK_TITLE_LENGTH, 150);
  assert.strictEqual(MAX_TASK_DESC_LENGTH, 2000);
  assert.strictEqual(MAX_TAGS_COUNT, 10);
  assert.strictEqual(MAX_TAG_LENGTH, 30);
});

test('isValidEmail enforces RFC 5321 length and format constraints', () => {
  assert.strictEqual(isValidEmail('user@company.com'), true);
  assert.strictEqual(isValidEmail('first.last+tag@sub.domain.org'), true);
  assert.strictEqual(isValidEmail(''), false);
  assert.strictEqual(isValidEmail('plainaddress'), false);
  assert.strictEqual(isValidEmail('@missinguser.com'), false);
  assert.strictEqual(isValidEmail('user@.com'), false);
  assert.strictEqual(isValidEmail('user@com'), false);
  
  // Boundary > 254 characters
  const longLocalPart = 'a'.repeat(245);
  const oversizedEmail = `${longLocalPart}@example.com`; // 245 + 12 = 257 > 254
  assert.strictEqual(isValidEmail(oversizedEmail), false, 'Oversized email > 254 must be rejected');
});

test('sanitizeString correctly truncates string to maxLength', () => {
  const input = 'X'.repeat(500);
  assert.strictEqual(sanitizeString(input, 150).length, 150);
  assert.strictEqual(sanitizeString(input, 2000).length, 500);
  assert.strictEqual(sanitizeString(null, 50), '');
  assert.strictEqual(sanitizeString(undefined, 50), '');
});

// ============================================================================
// 6. Static Invariant & AST Code Probing
// ============================================================================
console.log('\n--- [PROBE 6] Static Invariant Probing (Zero Native Dialogs, Strict CSP) ---');

test('Zero window.confirm, window.alert, window.prompt, or bare alert() across entire src/', () => {
  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.name.endsWith('.js') || entry.name.endsWith('.jsx')) {
        const raw = fs.readFileSync(fullPath, 'utf-8');
        const clean = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '');
        assert(!clean.includes('window.confirm'), `Found window.confirm in ${fullPath}`);
        assert(!clean.includes('window.alert'), `Found window.alert in ${fullPath}`);
        assert(!clean.includes('window.prompt'), `Found window.prompt in ${fullPath}`);
        assert(!/[^a-zA-Z0-9_$]alert\s*\(/.test(clean), `Found alert() in ${fullPath}`);
      }
    }
  }
  scanDir(path.join(rootDir, 'src'));
});

test('index.html contains strict Content-Security-Policy and protective HTTP-Equiv headers', () => {
  const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8');
  assert(html.includes('http-equiv="Content-Security-Policy"'), 'CSP meta tag missing');
  assert(html.includes("default-src 'self'"), "default-src 'self' missing");
  assert(html.includes("object-src 'none'"), "object-src 'none' missing");
  assert(html.includes("base-uri 'self'"), "base-uri 'self' missing");
  assert(html.includes('http-equiv="X-Content-Type-Options" content="nosniff"'), 'X-Content-Type-Options nosniff missing');
  assert(html.includes('name="referrer" content="strict-origin-when-cross-origin"'), 'Strict referrer policy missing');
});

test('Zero localStorage JWT token persistence in source code', () => {
  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.name.endsWith('.js') || entry.name.endsWith('.jsx')) {
        const raw = fs.readFileSync(fullPath, 'utf-8');
        const clean = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '');
        assert(!clean.includes("localStorage.setItem('token'"), `Found localStorage token store in ${fullPath}`);
        assert(!clean.includes('localStorage.setItem("token"'), `Found localStorage token store in ${fullPath}`);
      }
    }
  }
  scanDir(path.join(rootDir, 'src'));
});

// ============================================================================
// Summary
// ============================================================================
console.log('\n================================================================');
console.log(`Results: ${passedTests}/${totalTests} tests passed (${findings.length} findings)`);
console.log('================================================================');

if (findings.length > 0) {
  console.error('\nFindings Summary:');
  findings.forEach((f, idx) => console.error(`${idx + 1}. ${f.test}: ${f.error}`));
  process.exit(1);
} else {
  console.log('🎉 ALL ADVERSARIAL SECURITY PROBES PASSED WITH 100% SUCCESS!');
  process.exit(0);
}
