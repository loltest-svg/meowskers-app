// ==========================================
//  TANSHU OS — Main Application (Optimized)
// ==========================================

import {
  initStoreForUser,
  loadRoadmap, saveRoadmap,
  loadHabits, saveHabits,
  loadPomodoro, savePomodoro,
  loadReminders, saveReminders,
  loadExams, saveExams,
  loadTimerSettings, saveTimerSettings,
  loadMoods, saveMoods
} from './store.js';
import {
  generateId, getTodayStr, getWeekDates, getLast7Days, getStreak,
  getCompletionRate, calculateProgress, countNodes, formatTimer, getGreeting, formatDate,
  getDayOfYear, getDaysInYear, getTimeUntil, dateToDay
} from './helpers.js';

// --- App State ---
let state = {
  currentUser: null,
  currentPage: 'dashboard',
  roadmap: null, habits: null, pomodoro: null, reminders: null, exams: null, timerSettings: null, moods: null,
  selectedNode: null, expandedNodes: new Set(), activeRoadmapTab: null,
  timerMode: 'focus', timerSeconds: 0, timerRunning: false, timerInterval: null, pomodoroCount: 0
};

function initAppState(username) {
  initStoreForUser(username);
  state.currentUser = username;
  state.timerSettings = loadTimerSettings();
  state.roadmap = loadRoadmap();
  state.habits = loadHabits();
  state.pomodoro = loadPomodoro();
  state.reminders = loadReminders();
  state.exams = loadExams();
  state.moods = loadMoods();

  state.timerSeconds = state.timerSettings.focus * 60;

  state.roadmap.rootIds.forEach(id => {
    state.expandedNodes.add(id);
    const node = state.roadmap.nodes[id];
    if (node && node.childIds) node.childIds.forEach(cid => state.expandedNodes.add(cid));
  });
  state.activeRoadmapTab = state.roadmap.rootIds[0] || null;

  // Start daily 8 PM browser notification checker
  setupDailyNotification();
}

// ==========================================
//  DAILY 8 PM BROWSER NOTIFICATION
// ==========================================
function setupDailyNotification() {
  // Request permission up-front
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }

  // Check every 30 seconds if it's 8:00 PM
  setInterval(() => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const now = new Date();
    if (now.getHours() !== 20 || now.getMinutes() !== 0) return;

    // Only fire once per minute using a date+hour+minute key
    const fireKey = `meowskers_notif_${now.toDateString()}_20:00`;
    if (localStorage.getItem(fireKey)) return;
    localStorage.setItem(fireKey, '1');

    // Build notification body
    const today = getTodayStr();
    const unfinishedHabits = state.habits.filter(h => !h.completions.includes(today));
    const upcoming = state.exams
      .filter(e => e.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 3);

    let body = `Hey ${state.currentUser === 'amitanshu' ? 'Tanshu' : 'Sona'}! 🐾 Time to check meowskers!`;
    if (unfinishedHabits.length > 0) {
      body += `\n\n📋 Habits left today: ${unfinishedHabits.map(h => h.title).join(', ')}`;
    }
    if (upcoming.length > 0) {
      body += `\n\n📅 Upcoming: ${upcoming.map(e => `${e.title} (${getTimeUntil(e.date)})`).join(', ')}`;
    }

    new Notification('🐱 meowskers — 8 PM Check-in!', {
      body,
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="0.9em" font-size="90">🐱</text></svg>'
    });
  }, 30000);
}

// --- Navigation ---
const NAV_ITEMS = [
  { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
  { id: 'roadmap', icon: '🐱', label: 'Roadmaps' },
  { id: 'habits', icon: '🌸', label: 'Habits' },
  { id: 'focus', icon: '⏱️', label: 'Focus Timer' },
  { id: 'reminders', icon: '🔔', label: 'Reminders' },
  { id: 'moods', icon: '💖', label: 'Moods' },
  { id: 'analytics', icon: '✨', label: 'Analytics' }
];

// ==========================================
//  RENDER (optimized — only replaces content area)
// ==========================================
let initialized = false;

function render() {
  const app = document.getElementById('app');

  // Check Login
  const savedUser = sessionStorage.getItem('sonaos_user');
  if (!savedUser && !state.currentUser) {
    app.innerHTML = renderLogin();
    attachLoginListener();
    return;
  }

  if (!state.currentUser) {
    initAppState(savedUser);
  }

  if (!initialized) {
    app.innerHTML = `
      <div class="app-layout">
        <aside class="sidebar" id="sidebar-container"></aside>
        <main class="main-content" id="page-content"></main>
      </div>
    `;
    initialized = true;
  }
  renderSidebar();
  renderPageContent();
}

function renderSidebar() {
  document.getElementById('sidebar-container').innerHTML = `
    <div class="sidebar-brand">
      <div class="brand-icon">🐱</div>
      <div>
        <h1 style="font-size:0.95rem;">meowskers</h1>
        <div class="brand-sub">the productivity app</div>
      </div>
    </div>
    <nav class="sidebar-nav">
      ${NAV_ITEMS.map(item => `
        <div class="nav-item ${state.currentPage === item.id ? 'active' : ''}" data-page="${item.id}">
          <span class="nav-icon">${item.icon}</span>
          <span class="nav-label">${item.label}</span>
        </div>
      `).join('')}
    </nav>
    <div class="sidebar-footer">
      <button class="btn btn-sm btn-danger" data-action="logout" style="width:100%;margin-bottom:8px;font-size:0.75rem;">🚪 Logout (${state.currentUser})</button>
      <div style="font-size:0.7rem;color:var(--text-muted);">Made with 🩷 meowskers 🐾</div>
    </div>
  `;
}

function renderPageContent() {
  const el = document.getElementById('page-content');
  switch (state.currentPage) {
    case 'dashboard': el.innerHTML = renderDashboard(); break;
    case 'roadmap': el.innerHTML = renderRoadmap(); break;
    case 'habits': el.innerHTML = renderHabits(); break;
    case 'focus': el.innerHTML = renderPomodoro(); break;
    case 'reminders': el.innerHTML = renderReminders(); break;
    case 'moods': el.innerHTML = renderMoods(); break;
    case 'analytics': el.innerHTML = renderAnalytics(); break;
    default: el.innerHTML = renderDashboard();
  }
}

// ==========================================
//  LOGIN SYSTEM
// ==========================================
function renderLogin() {
  return `
    <div style="display:flex;align-items:center;justify-content:center;height:100vh;background:var(--bg-primary);">
      <div class="card" style="width:100%;max-width:400px;text-align:center;padding:var(--space-2xl);">
        <div class="brand-icon" style="margin:0 auto var(--space-md);width:96px;height:96px;display:flex;align-items:center;justify-content:center;background:var(--accent-pink-glow);border-radius:var(--radius-md);overflow:hidden;box-shadow:var(--shadow-glow-pink);">
            <img src="https://play-lh.googleusercontent.com/8XpoXrCoXn92GQyn7QAz4RR5OttOLFxr0WpnN0krvSkNA9DVQYr9p1-Rn5b1HqLnIkA" alt="meowskers cat" style="width:100%;height:100%;object-fit:cover;">
        </div>
        <h2 style="font-family:'Nunito',sans-serif;font-weight:800;margin-bottom:var(--space-xs);">meowskers</h2>
        <p style="color:var(--text-secondary);font-size:0.85rem;margin-bottom:var(--space-xl);font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">the productivity app</p>
        
        <form id="login-form" style="text-align:left;">
          <div class="form-group" style="margin-bottom:var(--space-md);">
            <label style="font-size:0.75rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;">Username</label>
            <input type="text" id="login-user" required placeholder="Enter username">
          </div>
          <div class="form-group" style="margin-bottom:var(--space-xl);">
            <label style="font-size:0.75rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;">Password</label>
            <input type="password" id="login-pass" required placeholder="Enter password">
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center;padding:12px;">Login ✨</button>
          <div id="login-error" style="color:var(--accent-coral);font-size:0.8rem;margin-top:12px;text-align:center;display:none;">Invalid credentials. Please try again.</div>
        </form>
      </div>
    </div>
  `;
}

function attachLoginListener() {
  const form = document.getElementById('login-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const user = document.getElementById('login-user').value.trim();
      const pass = document.getElementById('login-pass').value.trim();
      const err = document.getElementById('login-error');

      if (user === 'amitanshu' && pass === 'amitanshulovesS') {
        sessionStorage.setItem('sonaos_user', 'amitanshu');
        render(); // Reload with auth
      } else if (user === 'aakanksha' && pass === 'aakankshalovesA') {
        sessionStorage.setItem('sonaos_user', 'aakanksha');
        render(); // Reload with auth
      } else {
        err.style.display = 'block';
      }
    });
  }
}

// ==========================================
//  DASHBOARD
// ==========================================
function renderDashboard() {
  const today = getTodayStr();
  const nodeStats = countNodes(state.roadmap.nodes);
  const totalProgress = state.roadmap.rootIds.length > 0
    ? Math.round(state.roadmap.rootIds.reduce((sum, id) => sum + calculateProgress(id, state.roadmap.nodes), 0) / state.roadmap.rootIds.length)
    : 0;
  const todaySessions = state.pomodoro.filter(s => s.date === today);
  const focusMinutes = todaySessions.reduce((sum, s) => sum + s.duration, 0);
  const habitsCompletedToday = state.habits.filter(h => h.completions.includes(today)).length;
  const bestStreak = Math.max(0, ...state.habits.map(h => getStreak(h.completions)));
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const dayOfYear = getDayOfYear();
  const daysInYear = getDaysInYear();
  const examDays = new Map();
  state.exams.forEach(e => { const d = dateToDay(e.date); examDays.set(d, e); });

  // Upcoming deadlines sorted by date
  const upcoming = [...state.exams].filter(e => e.date >= today).sort((a, b) => a.date.localeCompare(b.date));

  return `
    <div class="page-header">
      <h2>${getGreeting()} 👋</h2>
      <p class="subtitle">${dateStr} · Day ${dayOfYear} of ${daysInYear}</p>
    </div>
    <div class="stats-grid">
      <div class="stat-card blue"><div class="stat-icon">🗺️</div><div class="stat-value">${totalProgress}%</div><div class="stat-label">Roadmap Progress</div><div class="progress-bar" style="margin-top:8px"><div class="progress-fill" style="width:${totalProgress}%"></div></div></div>
      <div class="stat-card purple"><div class="stat-icon">⏱️</div><div class="stat-value">${focusMinutes}m</div><div class="stat-label">Focus Time Today</div></div>
      <div class="stat-card green"><div class="stat-icon">🔥</div><div class="stat-value">${habitsCompletedToday}/${state.habits.length}</div><div class="stat-label">Habits Done Today</div></div>
      <div class="stat-card orange"><div class="stat-icon">🏆</div><div class="stat-value">${bestStreak}</div><div class="stat-label">Best Streak (days)</div></div>
    </div>

    <div class="card" style="margin-bottom:var(--space-lg);">
      <div class="card-header">
        <span class="card-title">🐾 Year Progress · ${dayOfYear}/${daysInYear} days</span>
        <button class="btn btn-sm btn-primary" data-action="add-exam">+ Add Deadline</button>
      </div>
      <div class="bubble-grid">${Array.from({ length: daysInYear }, (_, i) => {
    const day = i + 1;
    const isPast = day <= dayOfYear;
    const isToday = day === dayOfYear;
    const exam = examDays.get(day);
    let cls = 'bubble';
    if (isPast) cls += ' filled';
    if (isToday) cls += ' today';
    if (exam) cls += ' exam';
    const tooltip = exam ? exam.title : '';
    return `<div class="${cls}" ${tooltip ? `title="${tooltip}"` : ''}></div>`;
  }).join('')}</div>
      ${upcoming.length > 0 ? `
        <div class="upcoming-deadlines">
          <div style="font-size:0.78rem;font-weight:700;color:var(--accent-pink-strong);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;">📅 Upcoming Deadlines</div>
          ${upcoming.slice(0, 5).map(e => `
            <div class="deadline-item">
              <span class="deadline-dot" style="background:${e.color || 'var(--accent-pink)'}"></span>
              <span class="deadline-title">${e.title}</span>
              <span class="deadline-type badge badge-${e.type === 'midterm' ? 'skill' : e.type === 'endterm' ? 'goal' : 'task'}">${e.type}</span>
              <span class="deadline-countdown">${getTimeUntil(e.date)}</span>
              <button class="btn btn-icon btn-sm btn-danger" data-action="delete-exam" data-exam-id="${e.id}" style="width:22px;height:22px;font-size:0.6rem;">✕</button>
            </div>`).join('')}
        </div>` : ''}
    </div>

    <div class="dashboard-grid">
      <div class="card">
        <div class="card-header"><span class="card-title">📋 Today's Habits</span></div>
        <div class="habits-grid">
          ${state.habits.map(h => {
    const done = h.completions.includes(today);
    return `<div class="habit-card" style="padding:12px 16px;">
                <div class="habit-icon" style="width:36px;height:36px;background:${h.color}22;font-size:1.1rem;">${h.icon}</div>
                <div class="habit-info"><div class="habit-name" style="font-size:0.875rem;">${h.name}</div></div>
                <button class="habit-toggle ${done ? 'done' : ''}" data-habit-toggle="${h.id}">${done ? '✓' : ''}</button>
              </div>`;
  }).join('')}
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">🗺️ Roadmap Overview</span></div>
        ${state.roadmap.rootIds.map(rootId => {
    const node = state.roadmap.nodes[rootId];
    if (!node) return '';
    const progress = calculateProgress(rootId, state.roadmap.nodes);
    return `<div style="margin-bottom:16px;cursor:pointer;" data-goto-roadmap="${rootId}">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span style="font-weight:600;font-size:0.9rem;">${node.title}</span>
                <span style="font-size:0.78rem;color:var(--text-secondary);">${progress}%</span>
              </div>
              <div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div>
            </div>`;
  }).join('')}
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">⏱️ Quick Focus</span></div>
        <div style="text-align:center;padding:16px 0;">
          <div style="font-size:2.5rem;font-weight:800;margin-bottom:8px;font-variant-numeric:tabular-nums;">${formatTimer(state.timerSeconds)}</div>
          <div style="color:var(--text-secondary);font-size:0.8rem;margin-bottom:16px;text-transform:uppercase;letter-spacing:0.1em;">${state.timerMode === 'focus' ? 'Focus Session' : 'Break Time'}</div>
          <button class="btn btn-primary" data-action="goto-focus">${state.timerRunning ? '⏸ Pause' : '▶ Start Focus'}</button>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">📊 Stats Summary</span></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div style="text-align:center;padding:12px;background:var(--bg-input);border-radius:var(--radius-md);"><div style="font-size:1.3rem;font-weight:700;">${nodeStats.completed}</div><div style="font-size:0.75rem;color:var(--text-secondary);">Nodes Completed</div></div>
          <div style="text-align:center;padding:12px;background:var(--bg-input);border-radius:var(--radius-md);"><div style="font-size:1.3rem;font-weight:700;">${nodeStats.total}</div><div style="font-size:0.75rem;color:var(--text-secondary);">Total Nodes</div></div>
          <div style="text-align:center;padding:12px;background:var(--bg-input);border-radius:var(--radius-md);"><div style="font-size:1.3rem;font-weight:700;">${todaySessions.length}</div><div style="font-size:0.75rem;color:var(--text-secondary);">Focus Sessions</div></div>
          <div style="text-align:center;padding:12px;background:var(--bg-input);border-radius:var(--radius-md);"><div style="font-size:1.3rem;font-weight:700;">${state.roadmap.rootIds.length}</div><div style="font-size:0.75rem;color:var(--text-secondary);">Active Roadmaps</div></div>
        </div>
      </div>
    </div>`;
}

// ==========================================
//  ROADMAP
// ==========================================
function renderRoadmap() {
  const activeTab = state.activeRoadmapTab;
  const activeNode = activeTab ? state.roadmap.nodes[activeTab] : null;

  return `
    <div class="page-header">
      <h2>🗺️ Roadmaps</h2>
      <p class="subtitle">Your learning and life paths — expand, track, and conquer.</p>
    </div>
    <div class="roadmap-tabs">
      ${state.roadmap.rootIds.map(rootId => {
    const node = state.roadmap.nodes[rootId];
    if (!node) return '';
    return `<button class="roadmap-tab ${activeTab === rootId ? 'active' : ''}" data-roadmap-tab="${rootId}">${node.title}</button>`;
  }).join('')}
      <button class="btn btn-sm" data-action="add-roadmap" style="margin-left:auto;">+ New Roadmap</button>
    </div>
    <div class="roadmap-toolbar">
      <button class="btn btn-sm" data-action="expand-all">Expand All</button>
      <button class="btn btn-sm" data-action="collapse-all">Collapse All</button>
      ${activeNode ? `<button class="btn btn-sm btn-primary" data-action="add-child" data-parent="${activeTab}">+ Add Node</button>` : ''}
      ${activeNode ? `<div style="margin-left:auto;font-size:0.85rem;color:var(--text-secondary);">Progress: <strong style="color:var(--text-primary);">${calculateProgress(activeTab, state.roadmap.nodes)}%</strong></div>` : ''}
    </div>
    <div class="roadmap-container">
      <div class="roadmap-tree">${activeNode ? renderTreeChildren(activeTab) : '<div class="empty-state"><div class="empty-icon">🗺️</div><p>Create your first roadmap to get started!</p></div>'}</div>
      ${state.selectedNode ? renderNodePanel() : ''}
    </div>`;
}

function renderTreeChildren(nodeId) {
  const node = state.roadmap.nodes[nodeId];
  if (!node || !node.childIds || node.childIds.length === 0) return '';
  return node.childIds.map(childId => renderTreeNode(childId)).join('');
}

function renderTreeNode(nodeId) {
  const node = state.roadmap.nodes[nodeId];
  if (!node) return '';
  const hasChildren = node.childIds && node.childIds.length > 0;
  const isExpanded = state.expandedNodes.has(nodeId);
  const progress = hasChildren ? calculateProgress(nodeId, state.roadmap.nodes) : 0;
  const isSelected = state.selectedNode === nodeId;

  return `
    <div class="tree-node">
      <div class="node-row ${isSelected ? 'selected' : ''}">
        <span class="node-expand ${hasChildren && isExpanded ? 'rotated' : ''}" data-toggle="${nodeId}" style="visibility:${hasChildren ? 'visible' : 'hidden'}">▶</span>
        <span class="node-checkbox ${node.completed ? 'checked' : ''}" data-check="${nodeId}">✓</span>
        <span class="node-title ${node.completed ? 'completed' : ''}" data-select="${nodeId}">${node.title}</span>
        <span class="badge badge-${node.type}">${node.type}</span>
        ${hasChildren ? `<span class="node-progress-mini"><span class="fill" style="width:${progress}%"></span></span><span class="node-progress-text">${progress}%</span>` : ''}
      </div>
      ${hasChildren ? `<div class="tree-children ${isExpanded ? 'expanded' : 'collapsed'}">${isExpanded ? node.childIds.map(cid => renderTreeNode(cid)).join('') : ''}</div>` : ''}
    </div>`;
}

function renderNodePanel() {
  const node = state.roadmap.nodes[state.selectedNode];
  if (!node) return '';
  const progress = calculateProgress(node.id, state.roadmap.nodes);

  return `
    <div class="node-panel">
      <div class="panel-header">
        <h3>${node.title}</h3>
        <button class="btn btn-icon btn-sm" data-action="close-panel">✕</button>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:16px;">
        <span class="badge badge-${node.type}">${node.type}</span>
        <span style="font-size:0.78rem;color:var(--text-secondary);">Created ${formatDate(node.createdAt)}</span>
      </div>
      <div class="panel-section">
        <div class="panel-section-title">Progress</div>
        <div style="display:flex;align-items:center;gap:8px;">
          <div class="progress-bar" style="flex:1;"><div class="progress-fill green" style="width:${progress}%"></div></div>
          <span style="font-size:0.85rem;font-weight:600;">${progress}%</span>
        </div>
      </div>
      <div class="panel-section">
        <div class="panel-section-title">Notes</div>
        <textarea id="node-notes" placeholder="Add notes, study summaries, ideas..." style="min-height:100px;">${node.notes || ''}</textarea>
        <button class="btn btn-sm" style="margin-top:8px;" data-action="save-notes">💾 Save Notes</button>
      </div>
      <div class="panel-section">
        <div class="panel-section-title">Resources & Links</div>
        ${(node.resources || []).map((r, i) => `
          <div class="resource-item">
            <span>🔗</span>
            <a href="${r.url}" target="_blank" rel="noopener">${r.title || r.url}</a>
            <button class="btn btn-icon btn-sm btn-danger" data-action="remove-resource" data-idx="${i}" style="margin-left:auto;width:24px;height:24px;font-size:0.7rem;">✕</button>
          </div>`).join('')}
        <div style="display:flex;gap:6px;margin-top:8px;">
          <input type="text" id="res-title" placeholder="Title" style="flex:1;">
          <input type="url" id="res-url" placeholder="URL" style="flex:1;">
          <button class="btn btn-sm btn-primary" data-action="add-resource">+</button>
        </div>
      </div>
      <div class="panel-section">
        <div class="panel-section-title">Sub-items</div>
        ${(node.childIds || []).map(cid => {
    const child = state.roadmap.nodes[cid];
    if (!child) return '';
    return `
            <div style="display:flex;align-items:center;gap:8px;padding:4px 0;">
              <span class="node-checkbox ${child.completed ? 'checked' : ''}" data-check="${cid}" style="width:16px;height:16px;font-size:9px;">✓</span>
              <span style="font-size:0.85rem;flex:1;${child.completed ? 'color:var(--text-muted);text-decoration:line-through;' : ''}">${child.title}</span>
              <button class="btn btn-icon btn-sm btn-danger" data-action="delete-node" data-node-id="${cid}" style="width:22px;height:22px;font-size:0.65rem;">✕</button>
            </div>`;
  }).join('')}
        <div style="display:flex;gap:6px;margin-top:8px;">
          <input type="text" id="new-child" placeholder="Add sub-item...">
          <select id="new-child-type" style="width:auto;">
            <option value="task">Task</option>
            <option value="skill">Skill</option>
            <option value="goal">Goal</option>
          </select>
          <button class="btn btn-sm btn-primary" data-action="add-child-panel">+</button>
        </div>
      </div>
      <div class="panel-section" style="border-top:1px solid var(--border-subtle);padding-top:16px;">
        <button class="btn btn-sm btn-danger" data-action="delete-node" data-node-id="${node.id}" style="width:100%;">🗑️ Delete This Node</button>
      </div>
    </div>`;
}

// ==========================================
//  HABITS
// ==========================================
function renderHabits() {
  const today = getTodayStr();
  const weekDates = getWeekDates();

  return `
    <div class="page-header">
      <h2>🔥 Habit Tracker</h2>
      <p class="subtitle">Build consistency, one day at a time.</p>
    </div>
    <div class="roadmap-toolbar">
      <button class="btn btn-primary" data-action="add-habit">+ New Habit</button>
    </div>
    <div class="habits-grid">
      ${state.habits.map(h => {
    const doneToday = h.completions.includes(today);
    const streak = getStreak(h.completions);
    const rate = getCompletionRate(h.completions);
    return `
          <div class="habit-card">
            <div class="habit-icon" style="background:${h.color}22;">${h.icon}</div>
            <div class="habit-info">
              <div class="habit-name">${h.name}</div>
              <div class="habit-streak">🔥 ${streak} day streak · ${rate}% (30d)</div>
            </div>
            <div class="habit-week">
              ${weekDates.map(d => {
      const completed = h.completions.includes(d.date);
      return `<div class="habit-day ${completed ? 'completed' : ''} ${d.isToday ? 'today' : ''}">${d.label}</div>`;
    }).join('')}
            </div>
            <button class="habit-toggle ${doneToday ? 'done' : ''}" data-habit-toggle="${h.id}">${doneToday ? '✓' : ''}</button>
            <button class="btn btn-icon btn-sm btn-danger" data-action="delete-habit" data-habit-id="${h.id}" style="width:28px;height:28px;font-size:0.65rem;">✕</button>
          </div>`;
  }).join('')}
    </div>
    ${state.habits.length === 0 ? '<div class="empty-state"><div class="empty-icon">🔥</div><p>Add your first habit to start tracking!</p></div>' : ''}`;
}

// ==========================================
//  POMODORO
// ==========================================
function renderPomodoro() {
  const today = getTodayStr();
  const ts = state.timerSettings;
  const todaySessions = state.pomodoro.filter(s => s.date === today);
  const totalMinutes = todaySessions.reduce((sum, s) => sum + s.duration, 0);
  const modeMinutes = state.timerMode === 'focus' ? ts.focus : state.timerMode === 'break' ? ts.shortBreak : ts.longBreak;
  const totalSeconds = modeMinutes * 60;
  const progress = ((totalSeconds - state.timerSeconds) / totalSeconds) * 100;
  const circumference = 2 * Math.PI * 120;
  const dashoffset = circumference - (progress / 100) * circumference;

  return `
    <div class="page-header" style="text-align:center;">
      <h2>⏱️ Focus Timer</h2>
      <p class="subtitle">Deep work, distraction-free.</p>
    </div>
    <div class="pomodoro-container">
      <div class="timer-modes">
        <button class="timer-mode-btn ${state.timerMode === 'focus' ? 'active' : ''}" data-timer-mode="focus">Focus (${ts.focus}m)</button>
        <button class="timer-mode-btn ${state.timerMode === 'break' ? 'active' : ''}" data-timer-mode="break">Break (${ts.shortBreak}m)</button>
        <button class="timer-mode-btn ${state.timerMode === 'longBreak' ? 'active' : ''}" data-timer-mode="longBreak">Long (${ts.longBreak}m)</button>
      </div>
      <div class="timer-ring-container">
        <svg class="timer-ring" viewBox="0 0 260 260">
          <defs><linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#f9a8c9" /><stop offset="100%" stop-color="#c4b5fd" /></linearGradient></defs>
          <circle class="ring-bg" cx="130" cy="130" r="120" />
          <circle class="ring-progress" cx="130" cy="130" r="120" stroke-dasharray="${circumference}" stroke-dashoffset="${dashoffset}" />
        </svg>
        <div class="timer-display">
          <div class="timer-time">${formatTimer(state.timerSeconds)}</div>
          <div class="timer-label">${state.timerMode === 'focus' ? 'Focus' : state.timerMode === 'break' ? 'Break' : 'Long Break'}</div>
        </div>
      </div>
      <div class="timer-controls">
        <button class="btn btn-primary" data-action="timer-toggle" style="padding:12px 32px;font-size:1rem;">${state.timerRunning ? '⏸ Pause' : '▶ Start'}</button>
        <button class="btn" data-action="timer-reset">↻ Reset</button>
      </div>
      <div class="card" style="width:100%;max-width:500px;">
        <div class="card-header"><span class="card-title">⚙️ Customize Durations</span></div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
          <div>
            <label style="font-size:0.75rem;font-weight:700;color:var(--text-secondary);display:block;margin-bottom:4px;">Focus (min)</label>
            <input type="number" id="timer-focus" value="${ts.focus}" min="1" max="120" style="text-align:center;">
          </div>
          <div>
            <label style="font-size:0.75rem;font-weight:700;color:var(--text-secondary);display:block;margin-bottom:4px;">Short Break</label>
            <input type="number" id="timer-short" value="${ts.shortBreak}" min="1" max="60" style="text-align:center;">
          </div>
          <div>
            <label style="font-size:0.75rem;font-weight:700;color:var(--text-secondary);display:block;margin-bottom:4px;">Long Break</label>
            <input type="number" id="timer-long" value="${ts.longBreak}" min="1" max="60" style="text-align:center;">
          </div>
        </div>
        <button class="btn btn-primary btn-sm" data-action="save-timer-settings" style="margin-top:12px;width:100%;">💾 Save Settings</button>
      </div>
      <div class="pomodoro-stats">
        <div class="pomo-stat"><div class="pomo-stat-value">${todaySessions.length}</div><div class="pomo-stat-label">Sessions Today</div></div>
        <div class="pomo-stat"><div class="pomo-stat-value">${totalMinutes}m</div><div class="pomo-stat-label">Focus Time</div></div>
        <div class="pomo-stat"><div class="pomo-stat-value">${state.pomodoroCount}</div><div class="pomo-stat-label">This Streak</div></div>
      </div>
      ${todaySessions.length > 0 ? `
        <div class="card" style="width:100%;max-width:500px;">
          <div class="card-header"><span class="card-title">Today's Sessions</span></div>
          ${todaySessions.map(s => `
            <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border-subtle);font-size:0.85rem;">
              <span>${s.duration} min focus</span>
              <span style="color:var(--text-muted);">${new Date(s.completedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>`).join('')}
        </div>` : ''}
    </div>`;
}

// ==========================================
//  REMINDERS
// ==========================================
function renderReminders() {
  const today = getTodayStr();
  const sorted = [...state.reminders].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return (a.date + a.time).localeCompare(b.date + b.time);
  });
  const upcoming = sorted.filter(r => !r.completed && r.date >= today);
  const past = sorted.filter(r => r.completed || r.date < today);

  return `
    <div class="page-header">
      <h2>🔔 Reminders</h2>
      <p class="subtitle">Never miss anything important.</p>
    </div>
    <div class="roadmap-toolbar">
      <button class="btn btn-primary" data-action="add-reminder">+ New Reminder</button>
    </div>
    ${upcoming.length > 0 ? `
      <div style="margin-bottom:var(--space-lg);">
        <div style="font-size:0.78rem;font-weight:700;color:var(--accent-pink-strong);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:12px;">📌 Upcoming</div>
        ${upcoming.map(r => renderReminderCard(r)).join('')}
      </div>` : ''}
    ${past.length > 0 ? `
      <div>
        <div style="font-size:0.78rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:12px;">✅ Completed / Past</div>
        ${past.map(r => renderReminderCard(r)).join('')}
      </div>` : ''}
    ${state.reminders.length === 0 ? '<div class="empty-state"><div class="empty-icon">🔔</div><p>No reminders yet. Add one to get started!</p></div>' : ''}`;
}

function renderReminderCard(r) {
  const isOverdue = !r.completed && r.date < getTodayStr();
  return `
    <div class="reminder-card ${r.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}">
      <button class="reminder-check ${r.completed ? 'done' : ''}" data-action="toggle-reminder" data-reminder-id="${r.id}">${r.completed ? '✓' : ''}</button>
      <div class="reminder-info">
        <div class="reminder-title">${r.title}</div>
        <div class="reminder-meta">
          <span>📅 ${formatDate(r.date)}</span>
          ${r.time ? `<span>🕐 ${r.time}</span>` : ''}
          ${isOverdue ? '<span style="color:var(--accent-coral);font-weight:700;">⚠️ Overdue</span>' : ''}
          ${!r.completed && r.date >= getTodayStr() ? `<span style="color:var(--accent-pink-strong);">${getTimeUntil(r.date)}</span>` : ''}
        </div>
        ${r.notes ? `<div class="reminder-notes">${r.notes}</div>` : ''}
      </div>
      <button class="btn btn-icon btn-sm btn-danger" data-action="delete-reminder" data-reminder-id="${r.id}" style="width:28px;height:28px;font-size:0.65rem;">✕</button>
    </div>`;
}

// ==========================================
//  MOOD TRACKER
// ==========================================
function renderMoods() {
  const today = getTodayStr();
  const todayMoods = state.moods.filter(m => m.date === today).sort((a, b) => b.timestamp - a.timestamp);

  // Calculate average for last 7 days for motivational message
  const last7 = getLast7Days();
  const recentMoods = state.moods.filter(m => last7.some(d => d.date === m.date));
  let avgLabel = "No recent data. Log a mood!";
  if (recentMoods.length > 0) {
    const avgScore = recentMoods.reduce((sum, m) => sum + m.score, 0) / recentMoods.length;
    if (avgScore >= 4.5) avgLabel = "You're on fire lately! Keep that beautiful smile! ✨";
    else if (avgScore >= 3.5) avgLabel = "Doing pretty good! Keep the positive momentum going 🌸";
    else if (avgScore >= 2.5) avgLabel = "Things have been okay. Remember to take time for yourself! 🐾";
    else avgLabel = "It's okay to have down days. Sending lots of warm hugs! 🩷";
  }

  // Generate 30 Day Graph Data
  const last30Days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayMoods = state.moods.filter(m => m.date === dateStr);
    const avg = dayMoods.length ? (dayMoods.reduce((sum, m) => sum + m.score, 0) / dayMoods.length) : null;
    last30Days.push({ date: dateStr, avg });
  }

  // SVG dimensions
  const width = 600, height = 150;
  const dx = width / 29;
  const dy = height / 4; // Scores 1 to 5 = range 4
  const points = last30Days.map((d, i) => d.avg ? `${i * dx},${height - ((d.avg - 1) * dy)}` : null).filter(p => p);
  const pathData = points.length ? `M ${points.join(' L ')}` : '';

  return `
    <div class="page-header" style="text-align:center;">
      <h2>💖 Mood Tracker</h2>
      <p class="subtitle">How are you feeling today, ${state.currentUser}?</p>
      <div style="margin-top:16px;font-size:0.9rem;color:var(--accent-pink-strong);font-weight:700;background:var(--accent-pink-glow);padding:8px 16px;border-radius:var(--radius-full);display:inline-block;">
        ${avgLabel}
      </div>
    </div>

    <!-- Mood Input Form -->
    <div class="card" style="margin-bottom:var(--space-xl);text-align:center;">
      <div style="margin-bottom:16px;">
        <input type="text" id="mood-text" placeholder="What's making you feel this way?" style="max-width:400px;text-align:center;border-radius:var(--radius-full);background:white;">
      </div>
      <div class="mood-selectors" style="display:flex;justify-content:center;gap:12px;margin-bottom:16px;flex-wrap:wrap;">
        <button class="mood-btn" data-action="save-mood" data-score="1" data-emoji="😢" title="Awful">😢 Awful</button>
        <button class="mood-btn" data-action="save-mood" data-score="2" data-emoji="🙁" title="Bad">🙁 Bad</button>
        <button class="mood-btn" data-action="save-mood" data-score="3" data-emoji="😐" title="Okay">😐 Okay</button>
        <button class="mood-btn" data-action="save-mood" data-score="4" data-emoji="🙂" title="Good">🙂 Good</button>
        <button class="mood-btn" data-action="save-mood" data-score="5" data-emoji="🤩" title="Great">🤩 Great</button>
      </div>
    </div>

    <div class="dashboard-grid">
      <!-- Fast Today Timeline -->
      <div class="card">
        <div class="card-header"><span class="card-title">Today's Timeline</span></div>
        <div style="display:flex;flex-direction:column;gap:12px;max-height:300px;overflow-y:auto;">
          ${todayMoods.length > 0 ? todayMoods.map(m => `
            <div style="display:flex;align-items:center;gap:12px;padding:8px;background:var(--bg-input);border-radius:var(--radius-md);">
              <div style="font-size:1.5rem;">${m.emoji}</div>
              <div style="flex:1;">
                <div style="font-size:0.85rem;color:var(--text-primary);">${m.text || 'No note added.'}</div>
                <div style="font-size:0.7rem;color:var(--text-muted);">${m.time}</div>
              </div>
              <button class="btn btn-icon btn-sm btn-danger" data-action="delete-mood" data-mood-id="${m.id}" style="width:24px;height:24px;font-size:0.6rem;">✕</button>
            </div>
          `).join('') : '<div style="font-size:0.85rem;color:var(--text-muted);text-align:center;padding:20px 0;">No moods logged today yet!</div>'}
        </div>
      </div>

      <!-- 30 Day SVG Chart -->
      <div class="card" style="padding-bottom:10px;">
        <div class="card-header"><span class="card-title">30 Day Trend (1-5)</span></div>
        ${points.length > 1 ? `
        <div style="position:relative;width:100%;height:150px;margin-top:10px;">
          <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" style="width:100%;height:100%;overflow:visible;">
            <path d="${pathData}" fill="none" stroke="var(--accent-pink-strong)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
            ${last30Days.map((d, i) => d.avg ? `<circle cx="${i * dx}" cy="${height - ((d.avg - 1) * dy)}" r="5" fill="white" stroke="var(--accent-pink-strong)" stroke-width="2" />` : '').join('')}
          </svg>
          <div style="display:flex;justify-content:space-between;font-size:0.65rem;color:var(--text-muted);margin-top:8px;">
            <span>30 days ago</span><span>Today</span>
          </div>
        </div>
        ` : '<div style="font-size:0.85rem;color:var(--text-muted);text-align:center;padding:20px 0;">Not enough data yet. Log moods on multiple days!</div>'}
      </div>
    </div>
  `;
}

// ==========================================
//  ANALYTICS
// ==========================================
function renderAnalytics() {
  const nodeStats = countNodes(state.roadmap.nodes);
  const last7 = getLast7Days();
  const focusByDay = last7.map(d => {
    const sessions = state.pomodoro.filter(s => s.date === d.date);
    return { ...d, minutes: sessions.reduce((sum, s) => sum + s.duration, 0) };
  });
  const maxFocus = Math.max(1, ...focusByDay.map(d => d.minutes));
  const habitStats = state.habits.map(h => ({
    name: h.name, icon: h.icon,
    streak: getStreak(h.completions),
    rate: getCompletionRate(h.completions),
    total: h.completions.length
  }));
  const roadmapStats = state.roadmap.rootIds.map(id => {
    const node = state.roadmap.nodes[id];
    return { title: node ? node.title : 'Unknown', progress: calculateProgress(id, state.roadmap.nodes) };
  });

  return `
    <div class="page-header">
      <h2>📊 Analytics</h2>
      <p class="subtitle">Your productivity at a glance.</p>
    </div>
    <div class="stats-grid">
      <div class="stat-card blue"><div class="stat-icon">📌</div><div class="stat-value">${nodeStats.total}</div><div class="stat-label">Total Nodes</div></div>
      <div class="stat-card green"><div class="stat-icon">✅</div><div class="stat-value">${nodeStats.completed}</div><div class="stat-label">Completed</div></div>
      <div class="stat-card purple"><div class="stat-icon">⏱️</div><div class="stat-value">${state.pomodoro.reduce((s, p) => s + p.duration, 0)}m</div><div class="stat-label">Total Focus Time</div></div>
      <div class="stat-card orange"><div class="stat-icon">📅</div><div class="stat-value">${state.pomodoro.length}</div><div class="stat-label">Total Sessions</div></div>
    </div>
    <div class="analytics-grid">
      <div class="chart-card">
        <div class="chart-title">📈 Focus Time (Last 7 Days)</div>
        <div class="bar-chart">
          ${focusByDay.map(d => `
            <div class="bar">
              <div class="bar-value">${d.minutes}m</div>
              <div class="bar-fill" style="height:${Math.max(4, (d.minutes / maxFocus) * 100)}%"></div>
              <div class="bar-label">${d.label}</div>
            </div>`).join('')}
        </div>
      </div>
      <div class="chart-card">
        <div class="chart-title">🗺️ Roadmap Progress</div>
        ${roadmapStats.map(r => `
          <div style="margin-bottom:16px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
              <span style="font-size:0.85rem;font-weight:600;">${r.title}</span>
              <span style="font-size:0.78rem;color:var(--text-secondary);">${r.progress}%</span>
            </div>
            <div class="progress-bar" style="height:8px;"><div class="progress-fill" style="width:${r.progress}%"></div></div>
          </div>`).join('')}
      </div>
      <div class="chart-card">
        <div class="chart-title">🔥 Habit Streaks</div>
        ${habitStats.map(h => `
          <div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid var(--border-subtle);">
            <span style="font-size:1.2rem;">${h.icon}</span>
            <span style="flex:1;font-size:0.85rem;font-weight:500;">${h.name}</span>
            <span style="font-size:0.85rem;font-weight:700;color:var(--accent-orange);">🔥 ${h.streak}</span>
            <span style="font-size:0.78rem;color:var(--text-secondary);">${h.rate}%</span>
          </div>`).join('')}
      </div>
      <div class="chart-card">
        <div class="chart-title">🏆 Productivity Score</div>
        <div style="text-align:center;padding:24px;">
          <div style="font-size:3rem;font-weight:800;background:linear-gradient(135deg,var(--accent-blue),var(--accent-purple));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">${calculateProductivityScore()}</div>
          <div style="font-size:0.85rem;color:var(--text-secondary);margin-top:8px;">Out of 100</div>
          <div class="progress-bar" style="margin-top:16px;height:10px;"><div class="progress-fill" style="width:${calculateProductivityScore()}%"></div></div>
          <div style="font-size:0.78rem;color:var(--text-muted);margin-top:12px;">Based on roadmap progress, focus time, and habit consistency</div>
        </div>
      </div>
    </div>`;
}

function calculateProductivityScore() {
  const nodeStats = countNodes(state.roadmap.nodes);
  const roadmapScore = nodeStats.total > 0 ? (nodeStats.completed / nodeStats.total) * 100 : 0;
  const today = getTodayStr();
  const habitsToday = state.habits.filter(h => h.completions.includes(today)).length;
  const habitScore = state.habits.length > 0 ? (habitsToday / state.habits.length) * 100 : 0;
  const todaySessions = state.pomodoro.filter(s => s.date === today);
  const focusScore = Math.min(100, todaySessions.length * 25);
  return Math.round((roadmapScore * 0.4 + habitScore * 0.35 + focusScore * 0.25));
}

// ==========================================
//  EVENT HANDLING — ONE-TIME DELEGATION
// ==========================================
function initEventListeners() {
  const app = document.getElementById('app');

  app.addEventListener('click', (e) => {
    // Prevent clicks on links from triggering other handlers
    if (e.target.tagName === 'A') return;

    // --- Navigation ---
    const navItem = e.target.closest('[data-page]');
    if (navItem) {
      e.preventDefault();
      e.stopPropagation();
      state.currentPage = navItem.dataset.page;
      render();
      return;
    }

    // --- Roadmap tab ---
    const tab = e.target.closest('[data-roadmap-tab]');
    if (tab) {
      e.stopPropagation();
      state.activeRoadmapTab = tab.dataset.roadmapTab;
      state.selectedNode = null;
      render();
      return;
    }

    // --- Go to roadmap from dashboard ---
    const gotoRoadmap = e.target.closest('[data-goto-roadmap]');
    if (gotoRoadmap) {
      e.stopPropagation();
      state.currentPage = 'roadmap';
      state.activeRoadmapTab = gotoRoadmap.dataset.gotoRoadmap;
      render();
      return;
    }

    // --- Tree expand/collapse (handle BEFORE check to prevent conflict) ---
    const toggle = e.target.closest('[data-toggle]');
    if (toggle) {
      e.preventDefault();
      e.stopPropagation();
      const nodeId = toggle.dataset.toggle;
      if (state.expandedNodes.has(nodeId)) {
        state.expandedNodes.delete(nodeId);
      } else {
        state.expandedNodes.add(nodeId);
      }
      render();
      return;
    }

    // --- Checkbox ---
    const check = e.target.closest('[data-check]');
    if (check) {
      e.preventDefault();
      e.stopPropagation();
      const nodeId = check.dataset.check;
      toggleNodeCompletion(nodeId);
      saveRoadmap(state.roadmap);
      render();
      return;
    }

    // --- Node select ---
    const select = e.target.closest('[data-select]');
    if (select) {
      e.preventDefault();
      e.stopPropagation();
      state.selectedNode = select.dataset.select;
      render();
      return;
    }

    // --- Habit toggle ---
    const habitToggle = e.target.closest('[data-habit-toggle]');
    if (habitToggle) {
      e.preventDefault();
      e.stopPropagation();
      toggleHabit(habitToggle.dataset.habitToggle);
      return;
    }

    // --- Timer mode ---
    const timerMode = e.target.closest('[data-timer-mode]');
    if (timerMode) {
      e.stopPropagation();
      switchTimerMode(timerMode.dataset.timerMode);
      return;
    }

    // --- Actions ---
    const action = e.target.closest('[data-action]');
    if (action) {
      e.preventDefault();
      e.stopPropagation();
      handleAction(action.dataset.action, action);
      return;
    }
  });

  // Handle Enter key in inputs
  app.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      if (e.target.id === 'new-child') {
        e.preventDefault();
        const input = e.target;
        const typeSelect = document.getElementById('new-child-type');
        if (input.value.trim() && state.selectedNode) {
          addChildNode(state.selectedNode, input.value.trim(), typeSelect ? typeSelect.value : 'task');
        }
      } else if (e.target.id === 'res-url' || e.target.id === 'res-title') {
        e.preventDefault();
        const title = document.getElementById('res-title');
        const url = document.getElementById('res-url');
        if (url && url.value && state.selectedNode) {
          const node = state.roadmap.nodes[state.selectedNode];
          if (!node.resources) node.resources = [];
          node.resources.push({ title: title.value || url.value, url: url.value });
          saveRoadmap(state.roadmap);
          render();
        }
      } else if (e.target.id === 'modal-node-title' || e.target.id === 'modal-roadmap-title' || e.target.id === 'modal-habit-name') {
        e.preventDefault();
        const confirmBtn = document.getElementById('modal-confirm');
        if (confirmBtn) confirmBtn.click();
      }
    }
  });
}

function handleAction(action, el) {
  switch (action) {
    case 'close-panel':
      state.selectedNode = null;
      render();
      break;

    case 'save-notes': {
      const textarea = document.getElementById('node-notes');
      if (textarea && state.selectedNode) {
        state.roadmap.nodes[state.selectedNode].notes = textarea.value;
        saveRoadmap(state.roadmap);
        // Visual feedback
        el.textContent = '✅ Saved!';
        setTimeout(() => { el.textContent = '💾 Save Notes'; }, 1200);
      }
      break;
    }

    case 'add-resource': {
      const title = document.getElementById('res-title');
      const url = document.getElementById('res-url');
      if (title && url && url.value && state.selectedNode) {
        const node = state.roadmap.nodes[state.selectedNode];
        if (!node.resources) node.resources = [];
        node.resources.push({ title: title.value || url.value, url: url.value });
        saveRoadmap(state.roadmap);
        render();
      }
      break;
    }

    case 'remove-resource': {
      const idx = parseInt(el.dataset.idx);
      if (state.selectedNode && !isNaN(idx)) {
        state.roadmap.nodes[state.selectedNode].resources.splice(idx, 1);
        saveRoadmap(state.roadmap);
        render();
      }
      break;
    }

    case 'add-child-panel': {
      const input = document.getElementById('new-child');
      const typeSelect = document.getElementById('new-child-type');
      if (input && input.value.trim() && state.selectedNode) {
        addChildNode(state.selectedNode, input.value.trim(), typeSelect ? typeSelect.value : 'task');
      }
      break;
    }

    case 'add-child': {
      showAddNodeModal(el.dataset.parent);
      break;
    }

    case 'delete-node': {
      const nodeId = el.dataset.nodeId;
      if (nodeId && confirm('Delete this node and all its children?')) {
        deleteNode(nodeId);
      }
      break;
    }

    case 'add-roadmap':
      showAddRoadmapModal();
      break;

    case 'expand-all':
      Object.keys(state.roadmap.nodes).forEach(id => state.expandedNodes.add(id));
      render();
      break;

    case 'collapse-all':
      state.expandedNodes.clear();
      state.roadmap.rootIds.forEach(id => state.expandedNodes.add(id));
      render();
      break;

    case 'add-habit':
      showAddHabitModal();
      break;

    case 'delete-habit': {
      const habitId = el.dataset.habitId;
      if (habitId && confirm('Delete this habit?')) {
        state.habits = state.habits.filter(h => h.id !== habitId);
        saveHabits(state.habits);
        render();
      }
      break;
    }

    case 'timer-toggle':
      toggleTimer();
      break;

    case 'timer-reset':
      resetTimer();
      break;

    case 'goto-focus':
      state.currentPage = 'focus';
      render();
      break;

    case 'add-exam':
      showAddExamModal();
      break;

    case 'delete-exam': {
      const examId = el.dataset.examId;
      if (examId && confirm('Delete this deadline?')) {
        state.exams = state.exams.filter(e => e.id !== examId);
        saveExams(state.exams);
        render();
      }
      break;
    }

    case 'add-reminder':
      showAddReminderModal();
      break;

    case 'toggle-reminder': {
      const remId = el.dataset.reminderId;
      const rem = state.reminders.find(r => r.id === remId);
      if (rem) {
        rem.completed = !rem.completed;
        saveReminders(state.reminders);
        render();
      }
      break;
    }

    case 'delete-reminder': {
      const remId = el.dataset.reminderId;
      if (remId && confirm('Delete this reminder?')) {
        state.reminders = state.reminders.filter(r => r.id !== remId);
        saveReminders(state.reminders);
        render();
      }
      break;
    }

    case 'save-mood': {
      const score = parseInt(el.dataset.score);
      const emoji = el.dataset.emoji;
      const text = document.getElementById('mood-text').value.trim();
      const now = new Date();
      state.moods.push({
        id: generateId(), text, emoji, score,
        date: getTodayStr(),
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: now.getTime()
      });
      saveMoods(state.moods);
      render();
      break;
    }

    case 'delete-mood': {
      const moodId = el.dataset.moodId;
      state.moods = state.moods.filter(m => m.id !== moodId);
      saveMoods(state.moods);
      render();
      break;
    }

    case 'save-timer-settings': {
      state.timerSettings = {
        focus: parseInt(document.getElementById('timer-focus').value) || 25,
        shortBreak: parseInt(document.getElementById('timer-short').value) || 5,
        longBreak: parseInt(document.getElementById('timer-long').value) || 15
      };
      saveTimerSettings(state.timerSettings);
      resetTimer();
      break;
    }

    case 'logout':
      sessionStorage.removeItem('sonaos_user');
      state.currentUser = null;
      initialized = false;
      render();
      break;

    case 'timer-settings':
      showTimerSettingsModal();
      break;
  }
}

// ==========================================
//  NODE OPERATIONS
// ==========================================
function toggleNodeCompletion(nodeId) {
  const node = state.roadmap.nodes[nodeId];
  if (!node) return;
  node.completed = !node.completed;
  if (node.childIds && node.childIds.length > 0) {
    cascadeCompletion(node.childIds, node.completed);
  }
  // Also update parent completion status
  updateParentCompletion(node.parentId);
}

function cascadeCompletion(childIds, completed) {
  childIds.forEach(id => {
    const child = state.roadmap.nodes[id];
    if (child) {
      child.completed = completed;
      if (child.childIds && child.childIds.length > 0) {
        cascadeCompletion(child.childIds, completed);
      }
    }
  });
}

function updateParentCompletion(parentId) {
  if (!parentId) return;
  const parent = state.roadmap.nodes[parentId];
  if (!parent || !parent.childIds || parent.childIds.length === 0) return;
  const allDone = parent.childIds.every(id => state.roadmap.nodes[id] && state.roadmap.nodes[id].completed);
  const anyDone = parent.childIds.some(id => state.roadmap.nodes[id] && state.roadmap.nodes[id].completed);
  parent.completed = allDone;
  updateParentCompletion(parent.parentId);
}

function addChildNode(parentId, title, type = 'task') {
  const id = generateId();
  state.roadmap.nodes[id] = {
    id, title, parentId, childIds: [],
    completed: false, notes: '', resources: [],
    type, createdAt: new Date().toISOString()
  };
  state.roadmap.nodes[parentId].childIds.push(id);
  state.expandedNodes.add(parentId);
  saveRoadmap(state.roadmap);
  render();
}

function deleteNode(nodeId) {
  const node = state.roadmap.nodes[nodeId];
  if (!node) return;
  if (node.childIds) {
    [...node.childIds].forEach(cid => deleteNode(cid));
  }
  if (node.parentId && state.roadmap.nodes[node.parentId]) {
    state.roadmap.nodes[node.parentId].childIds = state.roadmap.nodes[node.parentId].childIds.filter(id => id !== nodeId);
  }
  state.roadmap.rootIds = state.roadmap.rootIds.filter(id => id !== nodeId);
  if (state.selectedNode === nodeId) state.selectedNode = null;
  if (state.activeRoadmapTab === nodeId) state.activeRoadmapTab = state.roadmap.rootIds[0] || null;
  delete state.roadmap.nodes[nodeId];
  saveRoadmap(state.roadmap);
  render();
}

// ==========================================
//  HABIT OPERATIONS
// ==========================================
function toggleHabit(habitId) {
  const today = getTodayStr();
  const habit = state.habits.find(h => h.id === habitId);
  if (!habit) return;
  if (habit.completions.includes(today)) {
    habit.completions = habit.completions.filter(d => d !== today);
  } else {
    habit.completions.push(today);
  }
  saveHabits(state.habits);
  render();
}

// ==========================================
//  POMODORO OPERATIONS
// ==========================================
function switchTimerMode(mode) {
  if (state.timerRunning) {
    clearInterval(state.timerInterval);
    state.timerRunning = false;
  }
  state.timerMode = mode;
  state.timerSeconds = mode === 'focus' ? 25 * 60 : mode === 'break' ? 5 * 60 : 15 * 60;
  render();
}

function toggleTimer() {
  if (state.timerRunning) {
    clearInterval(state.timerInterval);
    state.timerRunning = false;
    render();
  } else {
    state.timerRunning = true;
    render();
    state.timerInterval = setInterval(() => {
      state.timerSeconds--;
      if (state.timerSeconds <= 0) {
        clearInterval(state.timerInterval);
        state.timerRunning = false;
        const ts = state.timerSettings;
        if (state.timerMode === 'focus') {
          state.pomodoroCount++;
          state.pomodoro.push({ id: generateId(), duration: ts.focus, completedAt: new Date().toISOString(), date: getTodayStr() });
          savePomodoro(state.pomodoro);
          state.timerMode = state.pomodoroCount % 4 === 0 ? 'longBreak' : 'break';
          state.timerSeconds = state.timerMode === 'longBreak' ? ts.longBreak * 60 : ts.shortBreak * 60;
        } else {
          state.timerMode = 'focus';
          state.timerSeconds = ts.focus * 60;
        }
        render();
        if (Notification.permission === 'granted') {
          new Notification('meowskers 🐱', { body: state.timerMode === 'focus' ? 'Break over! Time to focus meow~' : 'Purrfect work! Take a break 🐾' });
        }
      } else {
        updateTimerDOM();
      }
    }, 1000);
  }
}

function resetTimer() {
  clearInterval(state.timerInterval);
  state.timerRunning = false;
  const ts = state.timerSettings;
  state.timerSeconds = state.timerMode === 'focus' ? ts.focus * 60 : state.timerMode === 'break' ? ts.shortBreak * 60 : ts.longBreak * 60;
  render();
}

// Fast DOM update for timer — no full re-render
function updateTimerDOM() {
  const timeEl = document.querySelector('.timer-time');
  if (timeEl) timeEl.textContent = formatTimer(state.timerSeconds);

  const ts = state.timerSettings;
  const totalSeconds = state.timerMode === 'focus' ? ts.focus * 60 : state.timerMode === 'break' ? ts.shortBreak * 60 : ts.longBreak * 60;
  const progress = ((totalSeconds - state.timerSeconds) / totalSeconds) * 100;
  const circumference = 2 * Math.PI * 120;
  const dashoffset = circumference - (progress / 100) * circumference;
  const ring = document.querySelector('.ring-progress');
  if (ring) ring.setAttribute('stroke-dashoffset', dashoffset);
}

// ==========================================
//  MODALS
// ==========================================

function showAddExamModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <h3>Add Upcoming Deadline</h3>
      <div class="form-group"><label>Title</label><input type="text" id="modal-exam-title" placeholder="e.g. Midterm Exams, Math Project..."></div>
      <div class="form-group"><label>Date</label><input type="date" id="modal-exam-date" value="${getTodayStr()}"></div>
      <div class="form-group"><label>Type</label>
        <select id="modal-exam-type">
          <option value="deadline">Project Deadline</option>
          <option value="midterm">Midterm Exam</option>
          <option value="endterm">End Term Exam</option>
        </select>
      </div>
      <div class="modal-actions">
        <button class="btn" id="modal-cancel">Cancel</button>
        <button class="btn btn-primary" id="modal-confirm">Add</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('#modal-cancel').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  overlay.querySelector('#modal-confirm').addEventListener('click', () => {
    const title = document.getElementById('modal-exam-title').value.trim();
    const date = document.getElementById('modal-exam-date').value;
    const type = document.getElementById('modal-exam-type').value;
    const color = type === 'midterm' ? '#f472b6' : type === 'endterm' ? '#fda4af' : '#c4b5fd';
    if (title && date) {
      state.exams.push({ id: generateId(), title, date, type, color });
      saveExams(state.exams);
      overlay.remove();
      render();
    }
  });
  setTimeout(() => document.getElementById('modal-exam-title').focus(), 50);
}

function showAddReminderModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <h3>Add Reminder</h3>
      <div class="form-group"><label>Title</label><input type="text" id="modal-rem-title" placeholder="e.g. Pay bills, Call mom..."></div>
      <div class="form-group" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div><label>Date</label><input type="date" id="modal-rem-date" value="${getTodayStr()}"></div>
        <div><label>Time (Optional)</label><input type="time" id="modal-rem-time"></div>
      </div>
      <div class="form-group"><label>Notes (Optional)</label><textarea id="modal-rem-notes" rows="2" placeholder="Any extra details..."></textarea></div>
      <div class="modal-actions">
        <button class="btn" id="modal-cancel">Cancel</button>
        <button class="btn btn-primary" id="modal-confirm">Add Reminder</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('#modal-cancel').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  overlay.querySelector('#modal-confirm').addEventListener('click', () => {
    const title = document.getElementById('modal-rem-title').value.trim();
    const date = document.getElementById('modal-rem-date').value;
    const time = document.getElementById('modal-rem-time').value;
    const notes = document.getElementById('modal-rem-notes').value.trim();
    if (title && date) {
      state.reminders.push({ id: generateId(), title, date, time, notes, completed: false });
      saveReminders(state.reminders);
      overlay.remove();
      render();
    }
  });
  setTimeout(() => document.getElementById('modal-rem-title').focus(), 50);
}


function showAddNodeModal(parentId) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <h3>Add New Node</h3>
      <div class="form-group"><label>Title</label><input type="text" id="modal-node-title" placeholder="Enter node title..."></div>
      <div class="form-group"><label>Type</label><select id="modal-node-type"><option value="task">Task</option><option value="skill">Skill</option><option value="goal">Goal</option></select></div>
      <div class="modal-actions">
        <button class="btn" id="modal-cancel">Cancel</button>
        <button class="btn btn-primary" id="modal-confirm">Add Node</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('#modal-cancel').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  overlay.querySelector('#modal-confirm').addEventListener('click', () => {
    const title = document.getElementById('modal-node-title').value.trim();
    const type = document.getElementById('modal-node-type').value;
    if (title) { addChildNode(parentId, title, type); overlay.remove(); }
  });
  setTimeout(() => document.getElementById('modal-node-title').focus(), 50);
}

function showAddRoadmapModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <h3>Create New Roadmap</h3>
      <div class="form-group"><label>Roadmap Name</label><input type="text" id="modal-roadmap-title" placeholder="e.g. Web Development, Career Goals..."></div>
      <div class="modal-actions">
        <button class="btn" id="modal-cancel">Cancel</button>
        <button class="btn btn-primary" id="modal-confirm">Create</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('#modal-cancel').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  overlay.querySelector('#modal-confirm').addEventListener('click', () => {
    const title = document.getElementById('modal-roadmap-title').value.trim();
    if (title) {
      const id = generateId();
      state.roadmap.nodes[id] = {
        id, title, parentId: null, childIds: [],
        completed: false, notes: '', resources: [],
        type: 'goal', createdAt: new Date().toISOString()
      };
      state.roadmap.rootIds.push(id);
      state.activeRoadmapTab = id;
      state.expandedNodes.add(id);
      saveRoadmap(state.roadmap);
      overlay.remove();
      render();
    }
  });
  setTimeout(() => document.getElementById('modal-roadmap-title').focus(), 50);
}

function showAddHabitModal() {
  const icons = ['🏃', '🏋️', '📚', '💻', '📖', '💧', '😴', '🧘', '🥗', '🧠', '✍️', '🎯', '🎵', '🌱', '🚶'];
  const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b', '#ec4899', '#ef4444', '#14b8a6'];
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <h3>Add New Habit</h3>
      <div class="form-group"><label>Habit Name</label><input type="text" id="modal-habit-name" placeholder="e.g. Morning Run, Read 30 min..."></div>
      <div class="form-group"><label>Icon</label>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          ${icons.map((icon, i) => `<button class="btn btn-icon btn-sm icon-pick ${i === 0 ? 'active' : ''}" data-icon="${icon}" style="font-size:1.2rem;width:36px;height:36px;">${icon}</button>`).join('')}
        </div>
      </div>
      <div class="form-group"><label>Color</label>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          ${colors.map((c, i) => `<button class="btn btn-icon btn-sm color-pick ${i === 0 ? 'active' : ''}" data-color="${c}" style="width:28px;height:28px;background:${c};border:2px solid ${i === 0 ? 'white' : 'transparent'};border-radius:50%;"></button>`).join('')}
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn" id="modal-cancel">Cancel</button>
        <button class="btn btn-primary" id="modal-confirm">Add Habit</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  let selectedIcon = icons[0], selectedColor = colors[0];
  overlay.querySelectorAll('.icon-pick').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      overlay.querySelectorAll('.icon-pick').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedIcon = btn.dataset.icon;
    });
  });
  overlay.querySelectorAll('.color-pick').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      overlay.querySelectorAll('.color-pick').forEach(b => { b.style.borderColor = 'transparent'; b.classList.remove('active'); });
      btn.classList.add('active');
      btn.style.borderColor = 'white';
      selectedColor = btn.dataset.color;
    });
  });
  overlay.querySelector('#modal-cancel').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  overlay.querySelector('#modal-confirm').addEventListener('click', () => {
    const name = document.getElementById('modal-habit-name').value.trim();
    if (name) {
      state.habits.push({
        id: generateId(), name, icon: selectedIcon, color: selectedColor,
        completions: [], createdAt: new Date().toISOString()
      });
      saveHabits(state.habits);
      overlay.remove();
      render();
    }
  });
  setTimeout(() => document.getElementById('modal-habit-name').focus(), 50);
}

// --- Notification permission ---
if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission();
}

// ==========================================
//  MIDNIGHT AUTO-REFRESH
//  Checks every 30s if the date has changed.
//  When a new day starts, the UI re-renders so
//  habits, stats, and tasks show fresh data.
// ==========================================
let currentDay = getTodayStr();

function startDayWatcher() {
  setInterval(() => {
    const now = getTodayStr();
    if (now !== currentDay) {
      console.log(`🐱 New day detected: ${now} — refreshing TANSHU OS!`);
      currentDay = now;
      // Re-load persisted data (in case another tab changed it)
      state.roadmap = loadRoadmap();
      state.habits = loadHabits();
      state.pomodoro = loadPomodoro();
      render();
    }
  }, 30000); // check every 30 seconds
}

// Also schedule a precise refresh right at midnight
function scheduleNextMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setDate(midnight.getDate() + 1);
  midnight.setHours(0, 0, 1, 0); // 1 second past midnight
  const msUntilMidnight = midnight - now;

  setTimeout(() => {
    console.log('🐱 Midnight! Starting a fresh day~');
    currentDay = getTodayStr();
    state.roadmap = loadRoadmap();
    state.habits = loadHabits();
    state.pomodoro = loadPomodoro();
    render();
    scheduleNextMidnight(); // schedule the next one
  }, msUntilMidnight);
}

// ==========================================
//  INIT — attach events ONCE, then render
// ==========================================
initEventListeners();
render();
startDayWatcher();
scheduleNextMidnight();
