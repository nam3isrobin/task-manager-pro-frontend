import assert from 'node:assert';
import api from '../src/services/api.js';
import { getAccessToken, setAccessToken, clearAccessToken, hasAccessToken } from '../src/utils/tokenStorage.js';

console.log('=== CHALLENGER 1: AXIOS INTERCEPTOR & SESSION STORAGE ADVERSARIAL TEST (PRODUCTION) ===\n');

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

// 1. Verify Axios Instance Defaults
console.log('1. Verifying Axios Client Base Configuration...');
assert(api.defaults.baseURL.includes('/api'), 'baseURL must point to /api endpoint');
assert.strictEqual(api.defaults.headers['Content-Type'], 'application/json');
console.log('  ✓ Axios baseURL and headers verified');

// 2. Test Request Interceptor Token Injection
console.log('2. Verifying Request Interceptor Authorization Bearer Injection...');
clearAccessToken();

// Simulate request interceptor without token
let testConfig = { headers: {} };
const requestInterceptor = api.interceptors.request.handlers[0].fulfilled;
let processedConfig = await requestInterceptor(testConfig);
assert.strictEqual(processedConfig.headers.Authorization, undefined, 'No auth header when token is null');

// Simulate request interceptor with token
setAccessToken('secure-jwt-test-token-777');
testConfig = { headers: {} };
processedConfig = await requestInterceptor(testConfig);
assert.strictEqual(processedConfig.headers.Authorization, 'Bearer secure-jwt-test-token-777', 'Must inject Bearer token');
console.log('  ✓ Request interceptor successfully injects Bearer token into config.headers');

// 3. Test Response Interceptor 401 Handling
console.log('3. Verifying Response Interceptor 401 Unauthorized Handling...');
global.sessionStorage.setItem('taskmanager_auth_user_v1', JSON.stringify({ name: 'Test User' }));
assert(hasAccessToken(), 'Token should be present before 401');

const responseErrorHandler = api.interceptors.response.handlers[0].rejected;
const error401 = {
  response: {
    status: 401,
    data: { error: 'Unauthorized token expired' },
  },
};

try {
  await responseErrorHandler(error401);
  assert.fail('401 error handler must reject error');
} catch (rejectedErr) {
  assert.strictEqual(rejectedErr.response?.status, 401);
}

// Token should be wiped
assert.strictEqual(getAccessToken(), null, '401 interceptor must wipe in-memory access token');
// Session storage should be cleared
assert.strictEqual(global.sessionStorage.getItem('taskmanager_auth_user_v1'), null, '401 interceptor must clear session user');
// Window location should be redirected to /login
assert.strictEqual(global.window.location.href, '/login', '401 interceptor must redirect window to /login');
console.log('  ✓ Response interceptor clears access token, wipes session storage, and redirects to /login');

// 4. Test Response Interceptor Passing Normal Responses & Other Errors
console.log('4. Verifying Response Interceptor Non-401 Passthrough...');
const successResponseHandler = api.interceptors.response.handlers[0].fulfilled;
const mock200Response = { status: 200, data: { success: true } };
const passedResponse = successResponseHandler(mock200Response);
assert.strictEqual(passedResponse.status, 200);

const error500 = {
  response: {
    status: 500,
    data: { error: 'Internal server error' },
  },
};
try {
  await responseErrorHandler(error500);
  assert.fail('500 error handler must reject error');
} catch (rejectedErr) {
  assert.strictEqual(rejectedErr.response?.status, 500);
}
console.log('  ✓ 200 OK and non-401 responses pass through as expected');

console.log('\n===============================================================');
console.log('=== AXIOS INTERCEPTOR & STORAGE PRODUCTION TESTS PASSED!   ===');
console.log('===============================================================');
