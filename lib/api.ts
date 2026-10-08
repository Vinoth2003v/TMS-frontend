const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://tms-backend-production-b2bb.up.railway.app/api';

// ─────────────────────────────────────────────────────────────────────────────
// DEMO DATA (used when Spring Boot backend is offline)
// ─────────────────────────────────────────────────────────────────────────────
const DEMO_USERS = [
  { id: 1, name: "Admin User",    email: "admin@gmail.com",   password: "admin",   role: "ADMIN",           department: "Administration" },
  { id: 2, name: "Manager User",  email: "manager@gmail.com", password: "manager", role: "MANAGER",         department: "Engineering"    },
  { id: 3, name: "Team Member",   email: "member@gmail.com",  password: "member",  role: "TEAM_MEMBER",     department: "Development"    },
  { id: 4, name: "Regular User",  email: "user@gmail.com",    password: "user",    role: "INDIVIDUAL_USER", department: "Operations"     },
];

const DEMO_TASKS: any[] = [
  { id: 1,  title: "Design new landing page",    description: "Redesign the homepage",            status: "In Progress",       priority: "High",   assignedTo: "member@gmail.com",  createdBy: "manager@gmail.com", dueDate: "2026-10-05", category: "Design",       labels: ["urgent","design"],  comments: [] },
  { id: 2,  title: "Fix login bug",              description: "Users can't login on mobile",      status: "Todo",              priority: "High",   assignedTo: "member@gmail.com",  createdBy: "manager@gmail.com", dueDate: "2026-10-03", category: "Development", labels: ["bug"],              comments: [] },
  { id: 3,  title: "Write API documentation",   description: "Document all REST endpoints",      status: "Completed",         priority: "Medium", assignedTo: "user@gmail.com",    createdBy: "manager@gmail.com", dueDate: "2026-09-30", category: "Research",    labels: ["docs"],             comments: [{ id: 1, by: "Manager User", text: "Great work!", date: "2026-09-28" }] },
  { id: 4,  title: "Database optimization",      description: "Optimize slow queries",            status: "Pending Approval",  priority: "Medium", assignedTo: "member@gmail.com",  createdBy: "manager@gmail.com", dueDate: "2026-10-08", category: "Development", labels: ["performance"],      comments: [] },
  { id: 5,  title: "Q4 Marketing Plan",          description: "Plan Q4 campaigns",               status: "In Progress",       priority: "High",   assignedTo: "user@gmail.com",    createdBy: "admin@gmail.com",   dueDate: "2026-10-10", category: "Marketing",   labels: ["strategy"],         comments: [] },
  { id: 6,  title: "Team onboarding docs",       description: "Create onboarding materials",     status: "Todo",              priority: "Low",    assignedTo: "member@gmail.com",  createdBy: "manager@gmail.com", dueDate: "2026-10-15", category: "Operations",  labels: [],                   comments: [] },
  { id: 7,  title: "Security audit",             description: "Audit authentication flow",       status: "Todo",              priority: "High",   assignedTo: "user@gmail.com",    createdBy: "admin@gmail.com",   dueDate: "2026-10-04", category: "Development", labels: ["security"],         comments: [] },
  { id: 8,  title: "User feedback analysis",     description: "Analyze last month feedback",     status: "Completed",         priority: "Low",    assignedTo: "member@gmail.com",  createdBy: "manager@gmail.com", dueDate: "2026-09-28", category: "Research",    labels: ["analytics"],        comments: [] },
];

let demoTasks = [...DEMO_TASKS];
let nextTaskId = 100;

function isDemoMode(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem('demoMode') === 'true';
}

// Auto-detect backend on startup and clear demo mode if reachable.
// We POST to the public /auth/login endpoint — any HTTP response (even 401/400)
// means the backend is up. Only a network-level failure means it's offline.
if (typeof window !== 'undefined') {
  fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: '__ping__', password: '__ping__' }),
  })
    .then(() => {
      // Got an HTTP response → backend is reachable, disable demo mode
      localStorage.removeItem('demoMode');
    })
    .catch(() => {
      // Network-level failure → backend truly offline, demo mode stays
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// HTTP HELPER
// ─────────────────────────────────────────────────────────────────────────────
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || 'Request failed');
  }
  return res.json();
}

async function tryRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  try {
    return await request<T>(endpoint, options);
  } catch (e: any) {
    // Only switch to demo mode on a true network failure (fetch TypeError),
    // NOT on HTTP errors like 401/403/400 which mean the backend is reachable.
    if (e instanceof TypeError && (e.message === 'Failed to fetch' || e.message.includes('NetworkError'))) {
      if (typeof window !== 'undefined') localStorage.setItem('demoMode', 'true');
    }
    throw e;
  }
}

async function uploadRequest<T>(endpoint: string, formData: FormData): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
  });
  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || 'File upload failed');
  }
  return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────
export const authApi = {
  login: async (email: string, password: string): Promise<{ token: string; user: any }> => {
    try {
      const result = await request<{ token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (typeof window !== 'undefined') localStorage.removeItem('demoMode');
      return result;
    } catch (e: any) {
      // Fall back to demo mode if backend is unreachable
      if (e instanceof TypeError || e.message === 'Failed to fetch' || e.message?.includes('fetch')) {
        const u = DEMO_USERS.find(u => u.email === email && u.password === password);
        if (!u) throw new Error('Invalid email or password');
        const { password: _, ...safeUser } = u;
        if (typeof window !== 'undefined') localStorage.setItem('demoMode', 'true');
        return { token: `demo-token-${u.id}`, user: safeUser };
      }
      throw e;
    }
  },

  register: async (data: { name: string; email: string; password: string; role: string }): Promise<{ token: string; user: any }> => {
    try {
      return await request<{ token: string; user: any }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (e: any) {
      if (e instanceof TypeError || e.message === 'Failed to fetch' || e.message?.includes('fetch')) {
        // Demo mode registration
        const exists = DEMO_USERS.find(u => u.email === data.email);
        const newUser = { id: Date.now(), name: data.name, email: data.email, password: data.password, role: "INDIVIDUAL_USER", department: '' };
        DEMO_USERS.push(newUser as any);
        if (typeof window !== 'undefined') localStorage.setItem('demoMode', 'true');
        const { password: _, ...safeUser } = newUser;
        return { token: `demo-token-${newUser.id}`, user: safeUser };
      }
      throw e;
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// TASKS
// ─────────────────────────────────────────────────────────────────────────────
export const tasksApi = {
  getAll: async (params?: { assignedTo?: string; createdBy?: string }): Promise<any[]> => {
    if (isDemoMode()) {
      let tasks = [...demoTasks];
      if (params?.assignedTo) tasks = tasks.filter(t => t.assignedTo === params.assignedTo);
      if (params?.createdBy)  tasks = tasks.filter(t => t.createdBy  === params.createdBy);
      return tasks;
    }
    const q = new URLSearchParams();
    if (params?.assignedTo) q.set('assignedTo', params.assignedTo);
    if (params?.createdBy)  q.set('createdBy',  params.createdBy);
    const qs = q.toString();
    return request<any[]>(`/tasks${qs ? '?' + qs : ''}`);
  },

  getById:             (id: number) => isDemoMode()
    ? Promise.resolve(demoTasks.find(t => t.id === id))
    : request<any>(`/tasks/${id}`),

  getByUser:           (email: string) => isDemoMode()
    ? Promise.resolve(demoTasks.filter(t => t.assignedTo === email || t.createdBy === email))
    : request<any[]>(`/tasks/user/${encodeURIComponent(email)}`),

  getUpcomingDeadlines: (days = 3) => isDemoMode()
    ? Promise.resolve(demoTasks.filter(t => t.dueDate && t.status !== 'Completed' &&
        new Date(t.dueDate).getTime() - Date.now() < 86400000 * days))
    : request<any[]>(`/tasks/deadlines?days=${days}`),

  create: async (data: any): Promise<any> => {
    if (isDemoMode()) {
      const newTask = { ...data, id: nextTaskId++, comments: [], createdAt: new Date().toISOString() };
      demoTasks.unshift(newTask);
      return newTask;
    }
    return request<any>('/tasks', { method: 'POST', body: JSON.stringify(data) });
  },

  update: async (id: number, data: any): Promise<any> => {
    if (isDemoMode()) {
      const idx = demoTasks.findIndex(t => t.id === id);
      if (idx !== -1) { demoTasks[idx] = { ...demoTasks[idx], ...data }; return demoTasks[idx]; }
      throw new Error('Task not found');
    }
    return request<any>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  },

  delete: async (id: number): Promise<any> => {
    if (isDemoMode()) { demoTasks = demoTasks.filter(t => t.id !== id); return {}; }
    return request<any>(`/tasks/${id}`, { method: 'DELETE' });
  },

  addComment: async (taskId: number, text: string, by: string, email: string): Promise<any> => {
    if (isDemoMode()) {
      const task = demoTasks.find(t => t.id === taskId);
      if (task) {
        if (!task.comments) task.comments = [];
        task.comments.push({ id: Date.now(), text, by, email, date: new Date().toISOString() });
        return task;
      }
      throw new Error('Task not found');
    }
    return request<any>(`/tasks/${taskId}/comments`, {
      method: 'POST', body: JSON.stringify({ text, by, email }),
    });
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────────────────────────────────────
export const usersApi = {
  getAll: () => isDemoMode()
    ? Promise.resolve(DEMO_USERS.map(({ password: _, ...u }) => u))
    : request<any[]>('/users'),

  getById: (id: number) => isDemoMode()
    ? Promise.resolve(DEMO_USERS.find(u => u.id === id))
    : request<any>(`/users/${id}`),

  getByEmail: (email: string) => isDemoMode()
    ? Promise.resolve(DEMO_USERS.find(u => u.email === email))
    : request<any>(`/users/email/${encodeURIComponent(email)}`),

  getByRole: (role: string) => isDemoMode()
    ? Promise.resolve(DEMO_USERS.filter(u => u.role === role).map(({ password: _, ...u }) => u))
    : request<any[]>(`/users/role/${role}`),

  search: (q: string) => isDemoMode()
    ? Promise.resolve(DEMO_USERS.filter(u => u.name.toLowerCase().includes(q.toLowerCase()) || u.email.includes(q)).map(({ password: _, ...u }) => u))
    : request<any[]>(`/users/search?q=${encodeURIComponent(q)}`),

  update: async (id: number, data: any): Promise<any> => {
    if (isDemoMode()) {
      const idx = DEMO_USERS.findIndex(u => u.id === id);
      if (idx !== -1) { Object.assign(DEMO_USERS[idx], data); const { password: _, ...u } = DEMO_USERS[idx]; return u; }
      throw new Error('User not found');
    }
    return request<any>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  },

  updateRole: async (id: number, role: string): Promise<any> => {
    if (isDemoMode()) {
      const idx = DEMO_USERS.findIndex(u => u.id === id);
      if (idx !== -1) { DEMO_USERS[idx].role = role; const { password: _, ...u } = DEMO_USERS[idx]; return u; }
      throw new Error('User not found');
    }
    return request<any>(`/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) });
  },

  delete: async (id: number): Promise<any> => {
    if (isDemoMode()) { const idx = DEMO_USERS.findIndex(u => u.id === id); if (idx !== -1) DEMO_USERS.splice(idx, 1); return {}; }
    return request<any>(`/users/${id}`, { method: 'DELETE' });
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────
let demoNotifs: any[] = [];

export const notificationsApi = {
  getAll: (email?: string) => isDemoMode()
    ? Promise.resolve(email ? demoNotifs.filter(n => n.to === email) : demoNotifs)
    : request<any[]>(`/notifications${email ? `?to=${encodeURIComponent(email)}` : ''}`),

  getUnread: (email: string) => isDemoMode()
    ? Promise.resolve(demoNotifs.filter(n => n.to === email && !n.read))
    : request<any[]>(`/notifications/unread?email=${encodeURIComponent(email)}`),

  getUnreadCount: (email: string) => isDemoMode()
    ? Promise.resolve({ count: demoNotifs.filter(n => n.to === email && !n.read).length })
    : request<{ count: number }>(`/notifications/unread/count?email=${encodeURIComponent(email)}`),

  create: async (to: string, message: string, type = 'INFO'): Promise<any> => {
    if (isDemoMode()) {
      const n = { id: Date.now(), to, message, type, read: false, date: new Date().toISOString() };
      demoNotifs.unshift(n);
      return n;
    }
    return request<any>('/notifications', { method: 'POST', body: JSON.stringify({ to, message, type }) });
  },

  markAsRead:    (id: number) => isDemoMode()
    ? Promise.resolve((() => { const n = demoNotifs.find(n => n.id === id); if (n) n.read = true; return n; })())
    : request<any>(`/notifications/${id}/read`, { method: 'PATCH' }),

  markAllAsRead: (email: string) => isDemoMode()
    ? Promise.resolve(demoNotifs.filter(n => n.to === email).forEach(n => (n.read = true)))
    : request<any>(`/notifications/read-all?email=${encodeURIComponent(email)}`, { method: 'PATCH' }),
};

// ─────────────────────────────────────────────────────────────────────────────
// ANALYTICS
// ─────────────────────────────────────────────────────────────────────────────
export const analyticsApi = {
  getGlobal: () => {
    if (isDemoMode()) {
      const byStatus: any = {};
      const byPriority: any = {};
      demoTasks.forEach(t => {
        byStatus[t.status]     = (byStatus[t.status]     || 0) + 1;
        byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
      });
      const completed = demoTasks.filter(t => t.status === 'Completed').length;
      return Promise.resolve({
        totalUsers: DEMO_USERS.length,
        totalTasks: demoTasks.length,
        completedTasks: completed,
        completionRate: demoTasks.length ? Math.round((completed / demoTasks.length) * 100) : 0,
        tasksByStatus: byStatus,
        tasksByPriority: byPriority,
        teamStats: DEMO_USERS.map(u => {
          const assigned  = demoTasks.filter(t => t.assignedTo === u.email).length;
          const done      = demoTasks.filter(t => t.assignedTo === u.email && t.status === 'Completed').length;
          return { name: u.name, email: u.email, assignedTasks: assigned, completedTasks: done, productivity: assigned ? Math.round((done / assigned) * 100) : 0 };
        }),
      });
    }
    return request<any>('/analytics');
  },

  getForManager: (email: string) => {
    if (isDemoMode()) {
      const tasks = demoTasks.filter(t => t.createdBy === email);
      const byStatus: any = {};
      const byPriority: any = {};
      const byCat: any = {};
      tasks.forEach(t => {
        byStatus[t.status]     = (byStatus[t.status]     || 0) + 1;
        byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
        byCat[t.category]      = (byCat[t.category]      || 0) + 1;
      });
      const completed = tasks.filter(t => t.status === 'Completed').length;
      const inProgress = tasks.filter(t => t.status === 'In Progress').length;
      const members = [...new Set(tasks.map(t => t.assignedTo))];
      return Promise.resolve({
        totalTasks: tasks.length, completedTasks: completed, inProgressTasks: inProgress,
        completionRate: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
        tasksByStatus: byStatus, tasksByPriority: byPriority, tasksByCategory: byCat,
        teamStats: members.map(email => {
          const u = DEMO_USERS.find(u => u.email === email);
          const a = tasks.filter(t => t.assignedTo === email).length;
          const d = tasks.filter(t => t.assignedTo === email && t.status === 'Completed').length;
          return { name: u?.name || email, email, assignedTasks: a, completedTasks: d, productivity: a ? Math.round((d / a) * 100) : 0 };
        }),
      });
    }
    return request<any>(`/analytics/manager/${encodeURIComponent(email)}`);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// FILES
// ─────────────────────────────────────────────────────────────────────────────
let demoFiles: any[] = [];

export const filesApi = {
  upload: async (taskId: number | string, file: File, uploadedBy: string): Promise<any> => {
    if (isDemoMode()) {
      const newFile = {
        id: Date.now(),
        taskId,
        fileName: `${Date.now()}_${file.name}`,
        originalName: file.name,
        fileType: file.type || 'application/octet-stream',
        fileSize: file.size,
        uploadedBy: uploadedBy || 'Team Member',
        createdAt: new Date().toISOString(),
        demoBlobUrl: URL.createObjectURL(file),
      };
      demoFiles.push(newFile);
      return newFile;
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('uploadedBy', uploadedBy);
    return uploadRequest<any>(`/files/upload/${taskId}`, formData);
  },
  getByTask: (taskId: number | string) => isDemoMode()
    ? Promise.resolve(demoFiles.filter(f => String(f.taskId) === String(taskId)))
    : request<any[]>(`/files/task/${taskId}`),
  download: (id: number | string) => `${BASE_URL}/files/download/${id}`,
  getDownloadUrl: (id: number | string) => `${BASE_URL}/files/download/${id}`,
  getViewUrl: (id: number | string) => `${BASE_URL}/files/view/${id}`,
  delete: (id: number | string) => {
    if (isDemoMode()) {
      demoFiles = demoFiles.filter(f => String(f.id) !== String(id));
      return Promise.resolve({});
    }
    return request<any>(`/files/${id}`, { method: 'DELETE' });
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────────────────────────────────────────
let demoCategories: any[] = [
  { id: 1, name: 'Development', description: 'Software engineering tasks' },
  { id: 2, name: 'Design', description: 'UI/UX design tasks' },
  { id: 3, name: 'Marketing', description: 'Marketing and sales' },
  { id: 4, name: 'Operations', description: 'DevOps and IT operations' }
];

export const categoriesApi = {
  getAll: () => isDemoMode()
    ? Promise.resolve([...demoCategories])
    : request<any[]>('/categories'),
    
  create: async (data: { name: string, description: string }): Promise<any> => {
    if (isDemoMode()) {
      if (demoCategories.some(c => c.name === data.name)) throw new Error("Category already exists");
      const newCat = { id: Date.now(), ...data };
      demoCategories.push(newCat);
      return newCat;
    }
    return request<any>('/categories', { method: 'POST', body: JSON.stringify(data) });
  },
  
  update: async (id: number, data: { name: string, description: string }): Promise<any> => {
    if (isDemoMode()) {
      const idx = demoCategories.findIndex(c => c.id === id);
      if (idx !== -1) { demoCategories[idx] = { ...demoCategories[idx], ...data }; return demoCategories[idx]; }
      throw new Error('Category not found');
    }
    return request<any>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  
  delete: async (id: number): Promise<any> => {
    if (isDemoMode()) { demoCategories = demoCategories.filter(c => c.id !== id); return {}; }
    return request<any>(`/categories/${id}`, { method: 'DELETE' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// HELP REQUESTS
// ─────────────────────────────────────────────────────────────────────────────
let demoHelpRequests: any[] = [];

export const helpRequestsApi = {
  create: async (payload: { taskId: string | number, issueTitle: string, description: string, teamMemberEmail: string, attachmentUrl?: string }): Promise<any> => {
    if (isDemoMode()) {
      const newTask = { id: Date.now(), status: "Pending", messages: [], ...payload, createdAt: new Date().toISOString() };
      demoHelpRequests.push(newTask);
      return newTask;
    }
    return request<any>('/help-requests', { method: 'POST', body: JSON.stringify(payload) });
  },

  getMemberRequests: async (email: string): Promise<any[]> => {
    if (isDemoMode()) return demoHelpRequests.filter(r => r.teamMemberEmail === email);
    return request<any[]>(`/help-requests/member/${email}`);
  },

  getManagerRequests: async (email: string): Promise<any[]> => {
    if (isDemoMode()) return demoHelpRequests; // In demo, manager sees all for simplicity
    return request<any[]>(`/help-requests/manager/${email}`);
  },

  updateStatus: async (id: number, status: string): Promise<any> => {
    if (isDemoMode()) {
      const idx = demoHelpRequests.findIndex(r => r.id === id);
      if (idx !== -1) demoHelpRequests[idx].status = status;
      return demoHelpRequests[idx];
    }
    return request<any>(`/help-requests/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
  },

  addMessage: async (id: number, payload: { text: string, senderEmail: string, senderName: string }): Promise<any> => {
    if (isDemoMode()) {
      const idx = demoHelpRequests.findIndex(r => r.id === id);
      if (idx !== -1) {
        if (!demoHelpRequests[idx].messages) demoHelpRequests[idx].messages = [];
        demoHelpRequests[idx].messages.push({ ...payload, createdAt: new Date().toISOString() });
        if (demoHelpRequests[idx].status === "Pending") demoHelpRequests[idx].status = "Responded";
      }
      return demoHelpRequests[idx];
    }
    return request<any>(`/help-requests/${id}/messages`, { method: 'POST', body: JSON.stringify(payload) });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CHAT & MESSAGING
// ─────────────────────────────────────────────────────────────────────────────
let demoChatMessages: any[] = [
  {
    id: 1,
    senderEmail: "manager@tasksystem.com",
    receiverEmail: "member@tasksystem.com",
    message: "Hi, please check Task #24 when you have a moment.",
    read: true,
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 2,
    senderEmail: "member@tasksystem.com",
    receiverEmail: "manager@tasksystem.com",
    message: "Sure, I am on it and will upload the deliverable today.",
    read: true,
    createdAt: new Date(Date.now() - 1800000).toISOString()
  }
];

export const chatApi = {
  sendMessage: async (payload: { receiverEmail: string; message: string; taskId?: number; senderEmail?: string }): Promise<any> => {
    if (isDemoMode()) {
      const newMsg = {
        id: Date.now(),
        senderEmail: payload.senderEmail || 'manager@tasksystem.com',
        receiverEmail: payload.receiverEmail,
        message: payload.message,
        taskId: payload.taskId,
        read: false,
        createdAt: new Date().toISOString()
      };
      demoChatMessages.push(newMsg);
      return Promise.resolve(newMsg);
    }
    return request<any>('/chat/send', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  getConversation: async (withEmail: string, currentEmail?: string): Promise<any[]> => {
    if (isDemoMode()) {
      const curr = currentEmail || 'manager@tasksystem.com';
      const filtered = demoChatMessages.filter(m =>
        (m.senderEmail === curr && m.receiverEmail === withEmail) ||
        (m.senderEmail === withEmail && m.receiverEmail === curr)
      );
      demoChatMessages.forEach(m => {
        if (m.senderEmail === withEmail && m.receiverEmail === curr) m.read = true;
      });
      return Promise.resolve(filtered);
    }
    const params = new URLSearchParams({ with: withEmail });
    if (currentEmail) params.append('current', currentEmail);
    return request<any[]>(`/chat/conversation?${params.toString()}`);
  },

  markAsRead: async (senderEmail: string, receiverEmail?: string): Promise<any> => {
    if (isDemoMode()) {
      demoChatMessages.forEach(m => {
        if (m.senderEmail === senderEmail && (!receiverEmail || m.receiverEmail === receiverEmail)) {
          m.read = true;
        }
      });
      return Promise.resolve({ success: true });
    }
    return request<any>('/chat/mark-read', {
      method: 'POST',
      body: JSON.stringify({ senderEmail, receiverEmail })
    });
  },

  getUnreadCounts: async (email?: string): Promise<{ total: number; bySender: Record<string, number> }> => {
    if (isDemoMode()) {
      const userEmail = email || 'manager@tasksystem.com';
      const bySender: Record<string, number> = {};
      let total = 0;
      demoChatMessages.forEach(m => {
        if (!m.read && m.receiverEmail === userEmail) {
          total++;
          bySender[m.senderEmail] = (bySender[m.senderEmail] || 0) + 1;
        }
      });
      return Promise.resolve({ total, bySender });
    }
    const params = email ? `?email=${encodeURIComponent(email)}` : '';
    return request<{ total: number; bySender: Record<string, number> }>(`/chat/unread-counts${params}`).catch(() => ({ total: 0, bySender: {} }));
  },

  getRecent: async (email?: string): Promise<any[]> => {
    if (isDemoMode()) {
      return Promise.resolve([...demoChatMessages].reverse());
    }
    const params = email ? `?email=${encodeURIComponent(email)}` : '';
    return request<any[]>(`/chat/recent${params}`).catch(() => []);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// WORKLOAD RISK ANALYSIS
// ─────────────────────────────────────────────────────────────────────────────
export interface WorkloadRiskData {
  memberId: number | string;
  memberName: string;
  memberEmail: string;
  activeTasks: number;
  overdueTasks: number;
  highPriorityTasks: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  message: string;
}

export const workloadApi = {
  getMemberWorkload: async (memberIdentifier: string | number): Promise<WorkloadRiskData> => {
    if (isDemoMode()) {
      const email = String(memberIdentifier).includes('@')
        ? String(memberIdentifier)
        : (DEMO_USERS.find(u => String(u.id) === String(memberIdentifier))?.email || String(memberIdentifier));
      
      const memberTasks = demoTasks.filter(t => t.assignedTo?.toLowerCase() === email.toLowerCase());
      const incomplete = memberTasks.filter(t => t.status !== 'Completed' && t.status !== 'COMPLETED');
      const activeTasks = incomplete.length;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const overdueTasks = incomplete.filter(t => t.dueDate && new Date(t.dueDate) < today).length;
      
      const highPriorityTasks = incomplete.filter(t => {
        const p = (t.priority || '').toUpperCase();
        return p === 'HIGH' || p === 'URGENT';
      }).length;
      
      let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
      if (activeTasks >= 7 || overdueTasks >= 2 || (activeTasks >= 4 && overdueTasks >= 1) || (activeTasks >= 4 && highPriorityTasks >= 2)) {
        riskLevel = 'HIGH';
      } else if (activeTasks >= 4 || overdueTasks >= 1 || highPriorityTasks >= 2) {
        riskLevel = 'MEDIUM';
      } else {
        riskLevel = 'LOW';
      }
      
      let message = "✓ This member's current workload is within a normal range.";
      if (riskLevel === 'HIGH') {
        message = overdueTasks > 0
          ? `⚠️ This member currently has a high workload. They have ${activeTasks} incomplete tasks and ${overdueTasks} overdue tasks. Please review before assigning another task.`
          : `⚠️ This member currently has a high workload. They have ${activeTasks} incomplete tasks. Please review before assigning another task.`;
      } else if (riskLevel === 'MEDIUM') {
        message = "⚠️ This member has a moderate workload. Consider reviewing their current tasks.";
      }
      
      const userObj = DEMO_USERS.find(u => u.email?.toLowerCase() === email.toLowerCase());
      return Promise.resolve({
        memberId: userObj?.id || memberIdentifier,
        memberName: userObj?.name || email.split('@')[0],
        memberEmail: email,
        activeTasks,
        overdueTasks,
        highPriorityTasks,
        riskLevel,
        message
      });
    }

    return request<WorkloadRiskData>(`/manager/team-members/${encodeURIComponent(memberIdentifier)}/workload`);
  }
};




