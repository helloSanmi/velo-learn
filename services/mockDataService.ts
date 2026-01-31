
const USERS_KEY = 'cloudtasks_users';
const TASKS_KEY = 'cloudtasks_data';
const PROJECTS_KEY = 'cloudtasks_projects';
const SESSION_KEY = 'cloudtasks_session';

const INITIAL_USERS = [
  { "id": "u-1", "username": "alex", "displayName": "Alex Rivera", "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex", "email": "alex@cloudtasks.io", "role": "member" },
  { "id": "u-2", "username": "sarah", "displayName": "Sarah Chen", "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah", "email": "sarah@cloudtasks.io", "role": "member" },
  { "id": "u-3", "username": "mike", "displayName": "Michael Scott", "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike", "email": "mike@cloudtasks.io", "role": "member" },
  { "id": "u-4", "username": "elena", "displayName": "Elena Rodriguez", "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena", "email": "elena@cloudtasks.io", "role": "member" },
  { "id": "u-5", "username": "james", "displayName": "James Wilson", "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=James", "email": "james@cloudtasks.io", "role": "member" },
  { "id": "demo-admin", "username": "admin", "displayName": "System Admin", "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin", "email": "admin@cloudtasks.io", "role": "admin" }
];

const INITIAL_PROJECTS = [
  {
    "id": "p1",
    "name": "Product Roadmap 2025",
    "description": "Core product strategy and feature development.",
    "color": "bg-indigo-600",
    "members": ["u-1", "u-2", "u-3", "u-4", "u-5", "demo-admin"]
  },
  {
    "id": "p2",
    "name": "Marketing Rebrand",
    "description": "New website design and brand guidelines.",
    "color": "bg-rose-500",
    "members": ["u-1", "u-4", "demo-admin"]
  },
  {
    "id": "p3",
    "name": "Security Audit",
    "description": "Bi-annual compliance and penetration testing.",
    "color": "bg-slate-700",
    "members": ["u-5", "demo-admin"]
  }
];

const INITIAL_TASKS = [
  {
    "id": "task-1",
    "userId": "u-3",
    "assigneeId": "u-1",
    "projectId": "p1",
    "title": "Define Core AI Engine Architecture",
    "description": "Design the orchestration layer between Gemini and the UI state.",
    "status": "in-progress",
    "priority": "High",
    "createdAt": 1740175200000,
    "order": 0,
    "tags": ["Architecture", "AI"],
    "subtasks": [
      { "id": "st-1", "title": "Schema design", "isCompleted": true },
      { "id": "st-2", "title": "Model selection", "isCompleted": false }
    ],
    "comments": [],
    "auditLog": [{ "id": "a1", "userId": "u-3", "displayName": "Michael Scott", "action": "Task initialized", "timestamp": 1740175200000 }]
  },
  {
    "id": "task-2",
    "userId": "u-3",
    "assigneeId": "u-2",
    "projectId": "p1",
    "title": "Frontend Performance Audit",
    "description": "Identify rendering bottlenecks in the Kanban board.",
    "status": "todo",
    "priority": "Medium",
    "createdAt": 1740261600000,
    "order": 1,
    "tags": ["Performance", "Frontend"],
    "subtasks": [
      { "id": "st-3", "title": "Profile with React DevTools", "isCompleted": false }
    ],
    "comments": [],
    "auditLog": []
  },
  {
    "id": "task-3",
    "userId": "u-1",
    "assigneeId": "u-4",
    "projectId": "p2",
    "title": "New Typography System",
    "description": "Evaluate Inter vs Roboto for the dashboard interface.",
    "status": "done",
    "priority": "Low",
    "createdAt": 1740304800000,
    "order": 0,
    "tags": ["Design"],
    "subtasks": [
      { "id": "st-4", "title": "Create Figma mocks", "isCompleted": true },
      { "id": "st-5", "title": "Review with team", "isCompleted": true }
    ],
    "comments": [],
    "auditLog": []
  },
  {
    "id": "task-4",
    "userId": "u-5",
    "assigneeId": "u-5",
    "projectId": "p3",
    "title": "SOC2 Compliance Checklist",
    "description": "Ensure all logs are being correctly captured and stored.",
    "status": "todo",
    "priority": "High",
    "createdAt": 1740344400000,
    "order": 0,
    "tags": ["Compliance", "Security"],
    "subtasks": [
      { "id": "st-6", "title": "Audit access logs", "isCompleted": false },
      { "id": "st-7", "title": "Review encryption keys", "isCompleted": false }
    ],
    "comments": [],
    "auditLog": []
  }
];

export const mockDataService = {
  init: async (): Promise<void> => {
    try {
      if (!localStorage.getItem(USERS_KEY)) {
        localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
      }
      if (!localStorage.getItem(PROJECTS_KEY)) {
        localStorage.setItem(PROJECTS_KEY, JSON.stringify(INITIAL_PROJECTS));
      }
      if (!localStorage.getItem(TASKS_KEY)) {
        localStorage.setItem(TASKS_KEY, JSON.stringify(INITIAL_TASKS));
      }
      if (!localStorage.getItem(SESSION_KEY)) {
        const admin = INITIAL_USERS.find(u => u.username === "admin");
        localStorage.setItem(SESSION_KEY, JSON.stringify(admin));
      }
    } catch (error) {
      console.error('Failed to initialize mock data:', error);
    }
  },
  
  clearData: () => {
    localStorage.removeItem(USERS_KEY);
    localStorage.removeItem(TASKS_KEY);
    localStorage.removeItem(PROJECTS_KEY);
    localStorage.removeItem(SESSION_KEY);
  }
};
