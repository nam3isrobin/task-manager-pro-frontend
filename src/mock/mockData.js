/**
 * Mock Seed Data for TaskManagerPro
 * Comprehensive enterprise task dataset with full status and priority coverage.
 */

export const INITIAL_MOCK_USERS = [
  {
    _id: 'usr-101',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@taskmanagerpro.dev',
    role: 'admin',
    isVerified: true,
    approvalStatus: 'approved',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    department: 'Engineering Leadership',
    createdAt: '2026-01-10T08:00:00.000Z',
  },
  {
    _id: 'usr-102',
    name: 'Marcus Vance',
    email: 'marcus.vance@taskmanagerpro.dev',
    role: 'manager',
    isVerified: true,
    approvalStatus: 'approved',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    department: 'Infrastructure & Cloud',
    createdAt: '2026-01-12T09:30:00.000Z',
  },
  {
    _id: 'usr-103',
    name: 'Elena Rostova',
    email: 'elena.rostova@taskmanagerpro.dev',
    role: 'user',
    isVerified: true,
    approvalStatus: 'approved',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    department: 'Frontend Engineering',
    createdAt: '2026-01-15T11:15:00.000Z',
  },
  {
    _id: 'usr-104',
    name: 'David Kim',
    email: 'david.kim@taskmanagerpro.dev',
    role: 'user',
    isVerified: true,
    approvalStatus: 'approved',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    department: 'Platform Architecture',
    createdAt: '2026-01-20T14:00:00.000Z',
  },
  {
    _id: 'usr-105',
    name: 'Amara Okafor',
    email: 'amara.okafor@taskmanagerpro.dev',
    role: 'user',
    isVerified: true,
    approvalStatus: 'approved',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    department: 'Product Design & UI',
    createdAt: '2026-02-01T10:00:00.000Z',
  },
  {
    _id: 'usr-106',
    name: 'Alex Rivera',
    email: 'alex.rivera@candidate.io',
    role: 'user',
    isVerified: true,
    approvalStatus: 'pending',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    department: 'Security & QA',
    createdAt: '2026-09-01T15:00:00.000Z',
  },
];

export const INITIAL_MOCK_TASKS = [
  {
    _id: 'tsk-001',
    title: 'Implement Zero-Trust API Authentication & RBAC',
    description: 'Transition from legacy JWT localStorage tokens to in-memory secure context and enforce fine-grained role-based access control across all API routes.',
    status: 'In Progress',
    priority: 'Urgent',
    dueDate: '2026-09-15T23:59:59.000Z',
    tags: ['security', 'auth', 'backend', 'owasp'],
    assignedTo: INITIAL_MOCK_USERS[0], // Sarah Jenkins
    subtasks: [
      { id: 'sub-1', title: 'Audit all endpoints for JWT in headers', completed: true },
      { id: 'sub-2', title: 'Implement in-memory token encryption', completed: true },
      { id: 'sub-3', title: 'Add fine-grained RBAC middleware tests', completed: false },
    ],
    comments: [
      {
        id: 'cm-1',
        author: INITIAL_MOCK_USERS[0],
        text: 'In-memory token encryption is now active across all dev mock adapters.',
        createdAt: '2026-08-30T10:15:00.000Z',
      },
      {
        id: 'cm-2',
        author: INITIAL_MOCK_USERS[1],
        text: 'Looks solid! Will review the RBAC middleware branch today.',
        createdAt: '2026-08-31T14:30:00.000Z',
      },
    ],
    activityLog: [
      { id: 'act-1', user: INITIAL_MOCK_USERS[0], action: 'created task', timestamp: '2026-08-25T10:00:00.000Z' },
      { id: 'act-2', user: INITIAL_MOCK_USERS[0], action: 'changed priority to Urgent', timestamp: '2026-08-28T11:00:00.000Z' },
      { id: 'act-3', user: INITIAL_MOCK_USERS[0], action: 'updated status to In Progress', timestamp: '2026-09-01T10:30:00.000Z' },
    ],
    attachments: [
      {
        _id: 'att-101',
        filename: 'zero-trust-architecture-spec.pdf',
        originalName: 'zero-trust-architecture-spec.pdf',
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        size: 142850,
        createdAt: '2026-08-28T14:20:00.000Z',
      },
      {
        _id: 'att-102',
        filename: 'rbac-matrix-diagram.png',
        originalName: 'rbac-matrix-diagram.png',
        url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&auto=format&fit=crop&q=80',
        size: 89340,
        createdAt: '2026-08-29T09:10:00.000Z',
      },
    ],
    createdAt: '2026-08-25T10:00:00.000Z',
    updatedAt: '2026-09-01T10:30:00.000Z',
    createdBy: 'usr-101',
  },
  {
    _id: 'tsk-002',
    title: 'Migrate Cloud Infrastructure to Kubernetes Cluster',
    description: 'Containerize backend microservices with Docker and deploy Helm charts onto multi-region Kubernetes clusters with auto-scaling triggers.',
    status: 'Todo',
    priority: 'High',
    dueDate: '2026-09-25T18:00:00.000Z',
    tags: ['devops', 'cloud', 'kubernetes', 'infrastructure'],
    assignedTo: INITIAL_MOCK_USERS[1], // Marcus Vance
    attachments: [
      {
        _id: 'att-201',
        filename: 'k8s-cluster-manifest.yaml',
        originalName: 'k8s-cluster-manifest.yaml',
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        size: 24500,
        createdAt: '2026-08-29T16:45:00.000Z',
      },
    ],
    createdAt: '2026-08-26T11:15:00.000Z',
    updatedAt: '2026-08-26T11:15:00.000Z',
    createdBy: 'usr-102',
  },
  {
    _id: 'tsk-003',
    title: 'Audit & Fix Frontend Accessibility & WCAG 2.1 AA Compliance',
    description: 'Ensure all UI components pass automated axe-core audits, verify color contrast ratios in Midnight Glass theme, and add missing aria attributes.',
    status: 'Completed',
    priority: 'Medium',
    dueDate: '2026-08-30T17:00:00.000Z',
    tags: ['frontend', 'a11y', 'ui', 'accessibility'],
    assignedTo: INITIAL_MOCK_USERS[2], // Elena Rostova
    attachments: [
      {
        _id: 'att-301',
        filename: 'wcag-audit-results.pdf',
        originalName: 'wcag-audit-results.pdf',
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        size: 512000,
        createdAt: '2026-08-30T16:30:00.000Z',
      },
    ],
    createdAt: '2026-08-20T09:00:00.000Z',
    updatedAt: '2026-08-30T17:00:00.000Z',
    createdBy: 'usr-101',
  },
  {
    _id: 'tsk-004',
    title: 'Optimize PostgreSQL Query Latency & Add Composite Indexes',
    description: 'Analyze slow query logs for task filtering endpoints. Introduce composite B-tree indexes on (status, priority, createdAt) to reduce p99 response time below 40ms.',
    status: 'In Progress',
    priority: 'High',
    dueDate: '2026-09-10T12:00:00.000Z',
    tags: ['database', 'postgres', 'performance', 'sql'],
    assignedTo: INITIAL_MOCK_USERS[3], // David Kim
    attachments: [],
    createdAt: '2026-08-27T13:40:00.000Z',
    updatedAt: '2026-08-31T15:20:00.000Z',
    createdBy: 'usr-102',
  },
  {
    _id: 'tsk-005',
    title: 'Revamp Mobile Dashboard Dark Glassmorphic Theme',
    description: 'Tune CSS backdrop-filter blur parameters, optimize touch target padding (min 44px) for 375px viewports, and implement smooth hover card micro-interactions.',
    status: 'Completed',
    priority: 'Low',
    dueDate: '2026-08-28T20:00:00.000Z',
    tags: ['design', 'ui', 'mobile', 'css', 'glassmorphism'],
    assignedTo: INITIAL_MOCK_USERS[4], // Amara Okafor
    attachments: [
      {
        _id: 'att-501',
        filename: 'mobile-figma-specs.pdf',
        originalName: 'mobile-figma-specs.pdf',
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        size: 780000,
        createdAt: '2026-08-27T18:00:00.000Z',
      },
    ],
    createdAt: '2026-08-22T10:00:00.000Z',
    updatedAt: '2026-08-28T19:45:00.000Z',
    createdBy: 'usr-103',
  },
  {
    _id: 'tsk-006',
    title: 'Pending SOC2 Type II Compliance Report & Third-Party Sign-Off',
    description: 'Coordinate with independent cybersecurity auditor on penetration testing report and finalize encryption-at-rest attestation documents.',
    status: 'On Hold',
    priority: 'Urgent',
    dueDate: '2026-09-18T17:00:00.000Z',
    tags: ['compliance', 'soc2', 'security', 'legal'],
    assignedTo: INITIAL_MOCK_USERS[0], // Sarah Jenkins
    attachments: [
      {
        _id: 'att-601',
        filename: 'soc2-preliminary-gap-analysis.pdf',
        originalName: 'soc2-preliminary-gap-analysis.pdf',
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        size: 340000,
        createdAt: '2026-08-29T11:00:00.000Z',
      },
    ],
    createdAt: '2026-08-24T08:30:00.000Z',
    updatedAt: '2026-08-30T14:10:00.000Z',
    createdBy: 'usr-101',
  },
  {
    _id: 'tsk-007',
    title: 'Automate End-to-End Playwright Regression Test Suite',
    description: 'Implement browser automation scripts covering auth flows, task creation, inline status changes, and filter combos with visual assertions.',
    status: 'Todo',
    priority: 'Medium',
    dueDate: '2026-09-22T16:00:00.000Z',
    tags: ['qa', 'testing', 'playwright', 'automation'],
    assignedTo: INITIAL_MOCK_USERS[2], // Elena Rostova
    attachments: [],
    createdAt: '2026-08-28T09:30:00.000Z',
    updatedAt: '2026-08-28T09:30:00.000Z',
    createdBy: 'usr-101',
  },
  {
    _id: 'tsk-008',
    title: 'Implement Webhook Rate Limiting & Circuit Breakers',
    description: 'Protect internal services against cascading failures by deploying Redis token-bucket rate limiters and Resilience4j circuit breakers.',
    status: 'On Hold',
    priority: 'High',
    dueDate: '2026-09-28T18:00:00.000Z',
    tags: ['backend', 'resilience', 'api', 'rate-limiting'],
    assignedTo: INITIAL_MOCK_USERS[3], // David Kim
    attachments: [],
    createdAt: '2026-08-29T14:00:00.000Z',
    updatedAt: '2026-08-31T11:00:00.000Z',
    createdBy: 'usr-102',
  },
  {
    _id: 'tsk-009',
    title: 'Design Disaster Recovery & Automated Backup Runbook',
    description: 'Document step-by-step failover procedures for AWS multi-AZ database replication, write automated validation scripts, and conduct team drill.',
    status: 'Todo',
    priority: 'Low',
    dueDate: '2026-10-05T17:00:00.000Z',
    tags: ['ops', 'backup', 'disaster-recovery', 'docs'],
    assignedTo: INITIAL_MOCK_USERS[1], // Marcus Vance
    attachments: [],
    createdAt: '2026-08-30T10:00:00.000Z',
    updatedAt: '2026-08-30T10:00:00.000Z',
    createdBy: 'usr-102',
  },
];

export const INITIAL_MOCK_NOTIFICATIONS = [
  {
    _id: 'ntf-001',
    title: 'Task Assigned',
    message: 'Sarah Jenkins assigned you to "Implement Zero-Trust API Authentication & RBAC"',
    read: false,
    taskId: 'tsk-001',
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 mins ago
  },
  {
    _id: 'ntf-002',
    title: 'Urgent Task Reminder',
    message: 'Urgent task "Pending SOC2 Compliance Report" due date is approaching',
    read: false,
    taskId: 'tsk-006',
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
  },
  {
    _id: 'ntf-003',
    title: 'Task Comment',
    message: 'Marcus Vance updated status on "Migrate Cloud Infrastructure to Kubernetes"',
    read: true,
    taskId: 'tsk-002',
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(), // 3 hours ago
  },
  {
    _id: 'ntf-004',
    title: 'System Notice',
    message: 'Platform security patch v2.4 applied. In-memory token encryption active.',
    read: true,
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), // 1 day ago
  },
];

export function getInitialMockTasks() {
  return JSON.parse(JSON.stringify(INITIAL_MOCK_TASKS));
}

export function getInitialMockUsers() {
  return JSON.parse(JSON.stringify(INITIAL_MOCK_USERS));
}

export function getInitialMockNotifications() {
  return JSON.parse(JSON.stringify(INITIAL_MOCK_NOTIFICATIONS));
}
