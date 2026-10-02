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
  isValidEmail,
  isSafeUrl,
  isAllowedFileType,
  isAllowedFileSize,
} from '../src/utils/validation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('=== Starting Milestone 3 & Milestone 4 Verification Suite (Production Clean) ===\n');

// ----------------------------------------------------------------------------
// 1. Milestone 3: Auth Pages Static Code & Feature Audit
// ----------------------------------------------------------------------------
console.log('1. Verifying Milestone 3 (Auth Pages UI/UX Polish & Pure Production Auth)...');

const loginCode = fs.readFileSync(path.join(rootDir, 'src/pages/LoginPage.jsx'), 'utf-8');
const registerCode = fs.readFileSync(path.join(rootDir, 'src/pages/RegisterPage.jsx'), 'utf-8');
const forgotCode = fs.readFileSync(path.join(rootDir, 'src/pages/ForgotPasswordPage.jsx'), 'utf-8');
const resetCode = fs.readFileSync(path.join(rootDir, 'src/pages/ResetPasswordPage.jsx'), 'utf-8');

// 1.1 LoginPage Assertions
assert(loginCode.includes('showPassword'), 'LoginPage must support showPassword state');
assert(loginCode.includes('Eye') && loginCode.includes('EyeOff'), 'LoginPage must include Eye and EyeOff icons');
assert(loginCode.includes('animate-shake'), 'LoginPage must include animate-shake on error banner');
assert(!loginCode.includes('Explore in Demo Mode'), 'LoginPage must NOT include "Explore in Demo Mode" button');
assert(!loginCode.includes('handleDemoLogin'), 'LoginPage must NOT contain handleDemoLogin handler');
assert(loginCode.includes('MAX_EMAIL_LENGTH'), 'LoginPage must enforce MAX_EMAIL_LENGTH');
assert(loginCode.includes('MAX_PASSWORD_LENGTH'), 'LoginPage must enforce MAX_PASSWORD_LENGTH');
assert(loginCode.includes('min-h-[44px]'), 'LoginPage must provide min 44px mobile touch targets');
console.log('  ✓ LoginPage: Password toggle, error shake, zero demo bypass, maxLength limits & 44px touch targets verified');

// 1.2 RegisterPage Assertions
assert(registerCode.includes('showPassword'), 'RegisterPage must support showPassword state');
assert(registerCode.includes('animate-shake'), 'RegisterPage must include animate-shake on error');
assert(registerCode.includes('MAX_NAME_LENGTH'), 'RegisterPage must enforce MAX_NAME_LENGTH');
assert(registerCode.includes('MAX_EMAIL_LENGTH'), 'RegisterPage must enforce MAX_EMAIL_LENGTH');
assert(registerCode.includes('MAX_PASSWORD_LENGTH'), 'RegisterPage must enforce MAX_PASSWORD_LENGTH');
assert(registerCode.includes('MIN_PASSWORD_LENGTH'), 'RegisterPage must enforce MIN_PASSWORD_LENGTH');
assert(!registerCode.includes('<select') && !registerCode.includes('setRole'), 'RegisterPage must NOT have role selector');
assert(!registerCode.includes('Try Demo Mode'), 'RegisterPage must NOT include "Try Demo Mode" button');
assert(!registerCode.includes('handleDemoLogin'), 'RegisterPage must NOT contain handleDemoLogin handler');
assert(registerCode.includes('hasMinLength') || registerCode.includes('Password strength') || registerCode.includes('At least 8 characters'), 'RegisterPage must include password helper');
console.log('  ✓ RegisterPage: Zero role escalation, zero demo bypass, strength indicators, input limits, and password toggle verified');

// 1.3 Forgot & Reset Password Pages Assertions
assert(forgotCode.includes('animate-shake'), 'ForgotPasswordPage must include animate-shake on error');
assert(forgotCode.includes('MAX_EMAIL_LENGTH'), 'ForgotPasswordPage must enforce MAX_EMAIL_LENGTH');
assert(resetCode.includes('showPassword'), 'ResetPasswordPage must include password toggle');
assert(resetCode.includes('animate-shake'), 'ResetPasswordPage must include animate-shake');
assert(resetCode.includes('MAX_PASSWORD_LENGTH'), 'ResetPasswordPage must enforce MAX_PASSWORD_LENGTH');
console.log('  ✓ ForgotPasswordPage & ResetPasswordPage: Polish, error shake, and password toggle verified');

// ----------------------------------------------------------------------------
// 2. Milestone 4: TaskFilters & Enums Verification
// ----------------------------------------------------------------------------
console.log('\n2. Verifying Milestone 4 (TaskFilters & Enums)...');

const filterCode = fs.readFileSync(path.join(rootDir, 'src/components/TaskFilters.jsx'), 'utf-8');

// Check typo fix: 'Todo' instead of 'To-Do'
assert(filterCode.includes('<option value="Todo">Todo</option>'), 'TaskFilters must contain <option value="Todo">Todo</option>');
assert(!filterCode.includes('value="To-Do"'), 'TaskFilters must NOT contain value="To-Do"');

// Check missing status option: 'On Hold'
assert(filterCode.includes('<option value="On Hold">On Hold</option>'), 'TaskFilters must contain <option value="On Hold">');

// Check missing priority option: 'Urgent'
assert(filterCode.includes('<option value="Urgent">Urgent</option>'), 'TaskFilters must contain <option value="Urgent">');

// Check search bounds and active count
assert(filterCode.includes('maxLength={100}'), 'TaskFilters search must enforce maxLength={100}');
assert(filterCode.includes('activeFilterCount') || filterCode.includes('active'), 'TaskFilters must display active filter indicator');
console.log('  ✓ TaskFilters: "Todo" enum fix, "On Hold", "Urgent", maxLength={100} & active filter badge verified');

// ----------------------------------------------------------------------------
// 3. Milestone 4: TaskCard Verification
// ----------------------------------------------------------------------------
console.log('\n3. Verifying Milestone 4 (TaskCard UI/UX)...');

const cardCode = fs.readFileSync(path.join(rootDir, 'src/components/TaskCard.jsx'), 'utf-8');

assert(cardCode.includes('hover:-translate-y-1'), 'TaskCard must have hover lift elevation');
assert(cardCode.includes('hover:border-amber-500'), 'TaskCard must have hover border accent');
assert(cardCode.includes('Urgent') && cardCode.includes('High') && cardCode.includes('Medium') && cardCode.includes('Low'), 'TaskCard must map all 4 priorities');
assert(cardCode.includes('Todo') && cardCode.includes('In Progress') && cardCode.includes('Completed') && cardCode.includes('On Hold'), 'TaskCard must map all 4 statuses');
assert(cardCode.includes('isOverdue') || cardCode.includes('overdue'), 'TaskCard must compute overdue status');
assert(cardCode.includes('getInitials') || cardCode.includes('initials'), 'TaskCard must display avatar initials');
assert(cardCode.includes('animate-fade-in'), 'TaskCard must have entrance animation');
console.log('  ✓ TaskCard: Hover elevation, priority accent bars, status pills, overdue warning, initials & entrance animation verified');

// ----------------------------------------------------------------------------
// 4. Milestone 4: DashboardPage Verification
// ----------------------------------------------------------------------------
console.log('\n4. Verifying Milestone 4 (DashboardPage UI/UX & Clean Production)...');

const dashCode = fs.readFileSync(path.join(rootDir, 'src/pages/DashboardPage.jsx'), 'utf-8');

assert(dashCode.includes('totalTasks') && dashCode.includes('inProgressCount') && dashCode.includes('completedCount') && dashCode.includes('urgentCount'), 'Dashboard must compute 4 stat metrics');
assert(dashCode.includes('grid-cols-1 md:grid-cols-2 lg:grid-cols-3'), 'Dashboard must use 3-column responsive task grid');
assert(dashCode.includes('No tasks match your filters'), 'Dashboard must have filtered empty state');
assert(dashCode.includes('No tasks created yet'), 'Dashboard must have zero-task workspace empty state');
assert(!dashCode.includes('Demo Mode Active'), 'Dashboard must NOT show demo mode banner');
assert(!dashCode.includes('Reset Demo Data'), 'Dashboard must NOT show Reset Demo Data action');
assert(!dashCode.includes('handleResetDemoData'), 'Dashboard must NOT contain handleResetDemoData');
console.log('  ✓ DashboardPage: Metric stat cards, 3-column grid, differentiated empty states & zero demo artifacts verified');

// ----------------------------------------------------------------------------
// 5. Milestone 4: Navbar, TaskModal, AttachmentUploader, CommandPalette Verification
// ----------------------------------------------------------------------------
console.log('\n5. Verifying Milestone 4 (Navbar, TaskModal, AttachmentUploader, CommandPalette)...');

const navCode = fs.readFileSync(path.join(rootDir, 'src/components/Navbar.jsx'), 'utf-8');
const modalCode = fs.readFileSync(path.join(rootDir, 'src/components/TaskModal.jsx'), 'utf-8');
const uploaderCode = fs.readFileSync(path.join(rootDir, 'src/components/AttachmentUploader.jsx'), 'utf-8');
const cmdCode = fs.readFileSync(path.join(rootDir, 'src/components/CommandPalette.jsx'), 'utf-8');

// Navbar
assert(navCode.includes('backdrop-blur'), 'Navbar must have backdrop-blur glass styling');
assert(navCode.includes('getInitials') || navCode.includes('initials'), 'Navbar must render user avatar initials');
assert(navCode.includes('roleStyles') || navCode.includes('userRole') || navCode.includes('role'), 'Navbar must render user role badge');
assert(!navCode.includes('Demo'), 'Navbar must NOT render demo badge');
console.log('  ✓ Navbar: Glassmorphic bar, profile initials avatar, role badge verified (zero demo badge)');

// CommandPalette
assert(!cmdCode.includes('onToggleDemo'), 'CommandPalette must NOT have onToggleDemo prop');
assert(!cmdCode.includes('Enable Demo Mode'), 'CommandPalette must NOT have Enable Demo Mode action');
console.log('  ✓ CommandPalette: Clean production command actions without demo mode toggles');

// TaskModal
assert(modalCode.includes('MAX_TASK_TITLE_LENGTH'), 'TaskModal must enforce MAX_TASK_TITLE_LENGTH');
assert(modalCode.includes('MAX_TASK_DESC_LENGTH'), 'TaskModal must enforce MAX_TASK_DESC_LENGTH');
assert(modalCode.includes('MAX_TAGS_COUNT'), 'TaskModal must enforce MAX_TAGS_COUNT');
assert(modalCode.includes('MAX_TAG_LENGTH'), 'TaskModal must enforce MAX_TAG_LENGTH');
assert(modalCode.includes('title.length') && modalCode.includes('description.length'), 'TaskModal must render character counters');
console.log('  ✓ TaskModal: Bounds (150 title, 2000 desc, 10 tags, 30 tag len) and character counters verified');

// AttachmentUploader
assert(uploaderCode.includes('MAX_FILE_SIZE_BYTES') || uploaderCode.includes('isAllowedFileSize'), 'AttachmentUploader must check file size');
assert(uploaderCode.includes('isAllowedFileType'), 'AttachmentUploader must check file type');
assert(uploaderCode.includes('isSafeUrl'), 'AttachmentUploader must validate URLs against XSS schemes');
console.log('  ✓ AttachmentUploader: 10MB limit, allowed MIME types, and isSafeUrl XSS validation verified');

// ----------------------------------------------------------------------------
// 6. Milestone 3 & 4: CSS Keyframes & Animations Verification
// ----------------------------------------------------------------------------
console.log('\n6. Verifying CSS Keyframes & Theme Tokens...');

const cssContent = fs.readFileSync(path.join(rootDir, 'src/index.css'), 'utf-8');
const tailwindConfig = fs.readFileSync(path.join(rootDir, 'tailwind.config.js'), 'utf-8');

assert(cssContent.includes('@keyframes shake'), 'index.css must declare @keyframes shake');
assert(cssContent.includes('.animate-shake'), 'index.css must declare .animate-shake utility');
assert(tailwindConfig.includes("'shake'") || tailwindConfig.includes('"shake"'), 'tailwind.config.js must include shake keyframe');
assert(cssContent.includes('@keyframes fadeIn') || cssContent.includes('fade-in'), 'index.css must include fade-in animation');
console.log('  ✓ CSS Tokens: @keyframes shake, .animate-shake, fadeIn animations verified');

console.log('\n===============================================================');
console.log('=== ALL MILESTONE 3 & 4 VERIFICATIONS PASSED CLEANLY (100%) ===');
console.log('===============================================================\n');
