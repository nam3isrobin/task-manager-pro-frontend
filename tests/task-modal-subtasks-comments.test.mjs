import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  setMockEnabled,
  mockGetTasks,
  mockCreateTask,
  mockUpdateTask,
  mockAddComment,
  mockAddSubtask,
  mockToggleSubtask,
  mockDeleteSubtask,
  resetMockData,
} from "../src/mock/mockService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

console.log("=== Running Task Modal, Mock Service & Backend Tests ===");

// 1. Static TaskModal.jsx verification
console.log("1. Verifying TaskModal.jsx tabs, subtasks, comments, activityLog UI...");
const modalCode = fs.readFileSync(path.join(rootDir, "src/components/TaskModal.jsx"), "utf-8");

assert(modalCode.includes("activeTab"), "TaskModal must track activeTab state");
assert(modalCode.includes("Details"), "TaskModal must render Details tab");
assert(modalCode.includes("Checklist") || modalCode.includes("subtasks"), "TaskModal must render Checklist/Subtasks tab");
assert(modalCode.includes("Comments"), "TaskModal must render Comments tab");
assert(modalCode.includes("Activity Log") || modalCode.includes("activity"), "TaskModal must render Activity Log tab");
assert(modalCode.includes("completedSubtasks") || modalCode.includes("subtasksPercent"), "TaskModal must calculate subtask progress");
assert(modalCode.includes("handleAddSubtask"), "TaskModal must support handleAddSubtask");
assert(modalCode.includes("handleToggleSubtask"), "TaskModal must support handleToggleSubtask");
assert(modalCode.includes("handleDeleteSubtask"), "TaskModal must support handleDeleteSubtask");
assert(modalCode.includes("handleAddComment"), "TaskModal must support handleAddComment");
assert(modalCode.includes("activityLog"), "TaskModal must display and manage activityLog");

console.log("  ✓ TaskModal tabs, interactive checklist, progress bar, comments thread, and activity timeline verified");

// 2. MockService API Handlers verification
console.log("2. Verifying mockService.js subtask, comment & activity tracking operations...");
setMockEnabled(true);
resetMockData();

const taskRes = await mockGetTasks();
const firstTask = taskRes.data[0];
const taskId = firstTask._id;

// 2.1 Add Subtask
const addSubRes = await mockAddSubtask(taskId, "Test subtask item 1");
assert(addSubRes.success, "mockAddSubtask should return success");
const updatedTask1 = addSubRes.data;
const foundSub = updatedTask1.subtasks.find((s) => s.title === "Test subtask item 1");
assert(foundSub, "New subtask should be present in task");
assert.strictEqual(foundSub.completed, false, "New subtask should default to completed: false");
assert(updatedTask1.activityLog.some((act) => act.action.includes("added subtask")), "Activity log should record subtask addition");
console.log("  ✓ mockAddSubtask created subtask and logged activity");

// 2.2 Toggle Subtask
const toggleRes = await mockToggleSubtask(taskId, foundSub.id);
assert(toggleRes.success, "mockToggleSubtask should return success");
const toggledTask = toggleRes.data;
const toggledSub = toggledTask.subtasks.find((s) => s.id === foundSub.id);
assert.strictEqual(toggledSub.completed, true, "Subtask completed state should be toggled to true");
assert(toggledTask.activityLog.some((act) => act.action.includes("completed subtask")), "Activity log should record subtask completion");
console.log("  ✓ mockToggleSubtask toggled completion and logged activity");

// 2.3 Delete Subtask
const delSubRes = await mockDeleteSubtask(taskId, foundSub.id);
assert(delSubRes.success, "mockDeleteSubtask should return success");
const taskAfterDel = delSubRes.data;
assert(!taskAfterDel.subtasks.some((s) => s.id === foundSub.id), "Deleted subtask should be removed");
assert(taskAfterDel.activityLog.some((act) => act.action.includes("deleted subtask")), "Activity log should record subtask deletion");
console.log("  ✓ mockDeleteSubtask removed subtask and logged activity");

// 2.4 Add Comment
const commentRes = await mockAddComment(taskId, "This is an automated test comment", "usr-101");
assert(commentRes.success, "mockAddComment should return success");
const taskWithComment = commentRes.data;
assert(taskWithComment.comments.some((c) => c.text === "This is an automated test comment"), "Comment should be in task.comments");
assert(taskWithComment.activityLog.some((act) => act.action.includes("added a comment")), "Activity log should record comment addition");
console.log("  ✓ mockAddComment added comment and logged activity");

// 2.5 mockUpdateTask activity logging
const updateRes = await mockUpdateTask(taskId, { status: "Completed", priority: "Urgent" });
assert(updateRes.success, "mockUpdateTask should succeed");
const updatedTask2 = updateRes.data;
assert.strictEqual(updatedTask2.status, "Completed");
assert.strictEqual(updatedTask2.priority, "Urgent");
assert(updatedTask2.activityLog.some((act) => act.action.includes("updated status to Completed")), "Activity log should record status update");
assert(updatedTask2.activityLog.some((act) => act.action.includes("changed priority to Urgent")), "Activity log should record priority change");
console.log("  ✓ mockUpdateTask logged status and priority modifications into activityLog");

// 3. Backend Model and Controller static verification
console.log("3. Verifying Backend task.model.js and task.controller.js...");
const modelCode = fs.readFileSync(path.join(rootDir, "../backend/src/models/task.model.js"), "utf-8");
const controllerCode = fs.readFileSync(path.join(rootDir, "../backend/src/controllers/task.controller.js"), "utf-8");

assert(modelCode.includes("subtasks: ["), "task.model.js must define subtasks field");
assert(modelCode.includes("comments: ["), "task.model.js must define comments field");
assert(modelCode.includes("activityLog: ["), "task.model.js must define activityLog field");

assert(controllerCode.includes("activityLog"), "task.controller.js must manage activityLog");
assert(controllerCode.includes("populateTaskFields") || controllerCode.includes("comments.author"), "task.controller.js must populate comments/activityLog");
console.log("  ✓ Backend task.model.js and task.controller.js schema and activity tracking verified");

console.log("\n=======================================================");
console.log("=== ALL TASK MODAL, MOCK SERVICE & BACKEND TESTS PASSED ===");
console.log("=======================================================\n");
