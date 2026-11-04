// Smart To-Do List - Main Application Logic

// ========== Auth Guard ==========
const currentUser = JSON.parse(localStorage.getItem('currentUser'));
if (!currentUser) {
    window.location.href = 'login.html';
}

// ========== State ==========
let tasks = [];
let currentView = 'overview';
let calendarDate = new Date();
let weeklyChart = null;
let editingTaskId = null;

// ========== Init ==========
document.addEventListener('DOMContentLoaded', () => {
    loadUser();
    loadTasks();
    initTheme();
    showView('overview');
    renderAll();
});

// ========== User ==========
function loadUser() {
    document.getElementById('user-name').textContent = currentUser.name;
    document.getElementById('user-email').textContent = currentUser.email;
    document.getElementById('user-avatar').textContent = currentUser.name.charAt(0).toUpperCase();
    document.getElementById('settings-name').value = currentUser.name;
    document.getElementById('settings-email').value = currentUser.email;
}

function saveProfile() {
    const name = document.getElementById('settings-name').value.trim();
    if (!name) return alert('Name cannot be empty');
    currentUser.name = name;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    // Update users list
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    const idx = users.findIndex(u => u.id === currentUser.id);
    if (idx !== -1) {
        users[idx].name = name;
        localStorage.setItem('users', JSON.stringify(users));
    }
    loadUser();
    alert('Profile updated successfully!');
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

// ========== Theme ==========
function initTheme() {
    const isDark = localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) document.documentElement.classList.add('dark');
    
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    document.getElementById('settings-theme-toggle').addEventListener('click', toggleTheme);
}

function toggleTheme() {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
}

// ========== Tasks Data ==========
function loadTasks() {
    tasks = JSON.parse(localStorage.getItem('tasks_' + currentUser.id) || '[]');
}

function saveTasks() {
    localStorage.setItem('tasks_' + currentUser.id, JSON.stringify(tasks));
}

function generateId() {
    return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// ========== Views ==========
function showView(view) {
    currentView = view;
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    document.getElementById('view-' + view).classList.add('active');
    
    document.querySelectorAll('.sidebar-link').forEach(el => el.classList.remove('active'));
    const link = document.querySelector(`.sidebar-link[data-view="${view}"]`);
    if (link) link.classList.add('active');
    
    const titles = {
        overview: 'Overview',
        tasks: 'My Tasks',
        today: 'Today',
        upcoming: 'Upcoming',
        calendar: 'Calendar',
        completed: 'Completed',
        categories: 'Categories',
        settings: 'Settings'
    };
    document.getElementById('page-title').textContent = titles[view] || 'Dashboard';
    
    // Close mobile sidebar
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.add('hidden');
    
    renderAll();
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebar-overlay').classList.toggle('hidden');
}

// ========== Render ==========
function renderAll() {
    updateStats();
    renderRecentTasks();
    renderUpcomingDeadlines();
    renderDailySummary();
    renderTasksView();
    renderTodayView();
    renderUpcomingView();
    renderCompletedView();
    renderCategories();
    renderCalendar();
    updateWeeklyChart();
}

function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = tasks.filter(t => !t.completed).length;
    const today = new Date();
    today.setHours(0,0,0,0);
    const overdue = tasks.filter(t => {
        if (t.completed || !t.dueDate) return false;
        const d = new Date(t.dueDate);
        d.setHours(0,0,0,0);
        return d < today;
    }).length;
    
    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-completed').textContent = completed;
    document.getElementById('stat-pending').textContent = pending;
    document.getElementById('stat-overdue').textContent = overdue;
    
    const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
    document.getElementById('completion-pct').textContent = pct + '%';
    const circle = document.getElementById('progress-circle');
    const offset = 251.2 - (251.2 * pct / 100);
    circle.style.strokeDashoffset = offset;
}

function getPriorityBadge(priority) {
    const colors = {
        High: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
        Medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
        Low: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
    };
    return `<span class="text-[10px] px-2 py-0.5 rounded-full font-medium ${colors[priority] || colors.Low}">${priority}</span>`;
}

function getCategoryBadge(cat) {
    const colors = {
        Personal: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
        Work: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
        Study: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
        Health: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
        Other: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
    };
    return `<span class="text-[10px] px-2 py-0.5 rounded-full font-medium ${colors[cat] || colors.Other}">${cat}</span>`;
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dCopy = new Date(d);
    dCopy.setHours(0,0,0,0);
    
    if (dCopy.getTime() === today.getTime()) return 'Today';
    if (dCopy.getTime() === tomorrow.getTime()) return 'Tomorrow';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined });
}

function isOverdue(task) {
    if (task.completed || !task.dueDate) return false;
    const today = new Date();
    today.setHours(0,0,0,0);
    const d = new Date(task.dueDate + 'T00:00:00');
    return d < today;
}

function createTaskCard(task, showActions = true) {
    const overdue = isOverdue(task);
    const priorityClass = 'priority-' + (task.priority || 'Low').toLowerCase();
    
    return `
    <div class="task-card bg-white dark:bg-slate-800 rounded-xl p-4 shadow-card border border-slate-100 dark:border-slate-700 ${priorityClass} transition-all ${task.completed ? 'opacity-70' : ''}" data-id="${task.id}">
        <div class="flex items-start gap-3">
            <button onclick="toggleComplete('${task.id}')" class="mt-0.5 w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-colors ${task.completed ? 'bg-primary-600 border-primary-600' : 'border-slate-300 dark:border-slate-500 hover:border-primary-500'}">
                ${task.completed ? '<i class="fas fa-check text-white text-[10px]"></i>' : ''}
            </button>
            <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-2">
                    <h4 class="font-medium text-sm ${task.completed ? 'line-through text-slate-400' : ''}">${escapeHtml(task.title)}</h4>
                    <div class="flex items-center gap-1.5 flex-shrink-0">
                        ${getPriorityBadge(task.priority)}
                        ${getCategoryBadge(task.category)}
                    </div>
                </div>
                ${task.description ? `<p class="text-xs text-slate-500 mt-1 line-clamp-2">${escapeHtml(task.description)}</p>` : ''}
                <div class="flex items-center gap-3 mt-2 text-xs text-slate-400">
                    ${task.dueDate ? `<span class="${overdue ? 'text-red-500 font-medium' : ''}"><i class="far fa-calendar mr-1"></i>${formatDate(task.dueDate)}${task.dueTime ? ' · ' + task.dueTime : ''}</span>` : ''}
                    ${overdue ? '<span class="text-red-500 font-medium"><i class="fas fa-exclamation-circle mr-1"></i>Overdue</span>' : ''}
                </div>
            </div>
            ${showActions ? `
            <div class="flex items-center gap-1 flex-shrink-0">
                <button onclick="editTask('${task.id}')" class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-primary-600" title="Edit">
                    <i class="fas fa-pen text-xs"></i>
                </button>
                <button onclick="deleteTask('${task.id}')" class="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500" title="Delete">
                    <i class="fas fa-trash text-xs"></i>
                </button>
            </div>` : ''}
        </div>
    </div>`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function renderRecentTasks() {
    const recent = [...tasks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
    const container = document.getElementById('recent-tasks');
    if (recent.length === 0) {
        container.innerHTML = '<p class="text-sm text-slate-400 text-center py-6">No tasks yet. Add your first task!</p>';
        return;
    }
    container.innerHTML = recent.map(t => createTaskCard(t)).join('');
}

function renderUpcomingDeadlines() {
    const today = new Date();
    today.setHours(0,0,0,0);
    const upcoming = tasks
        .filter(t => !t.completed && t.dueDate)
        .filter(t => {
            const d = new Date(t.dueDate + 'T00:00:00');
            return d >= today;
        })
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 5);
    
    const container = document.getElementById('upcoming-deadlines');
    if (upcoming.length === 0) {
        container.innerHTML = '<p class="text-sm text-slate-400 text-center py-6">No upcoming deadlines</p>';
        return;
    }
    container.innerHTML = upcoming.map(t => createTaskCard(t)).join('');
}

function renderDailySummary() {
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayStr = today.toISOString().split('T')[0];
    
    const todayTasks = tasks.filter(t => t.dueDate === todayStr);
    const completedToday = todayTasks.filter(t => t.completed).length;
    const pendingToday = todayTasks.filter(t => !t.completed).length;
    const overdue = tasks.filter(t => isOverdue(t)).length;
    
    let msg = `You have <strong>${pendingToday}</strong> task${pendingToday !== 1 ? 's' : ''} due today`;
    if (completedToday > 0) msg += ` and have already completed <strong>${completedToday}</strong>`;
    msg += '.';
    if (overdue > 0) msg += ` There ${overdue === 1 ? 'is' : 'are'} <strong class="text-red-500">${overdue} overdue</strong> task${overdue !== 1 ? 's' : ''} that need${overdue === 1 ? 's' : ''} attention.`;
    if (todayTasks.length === 0 && overdue === 0) msg = 'No tasks scheduled for today. Enjoy your free time or plan ahead!';
    
    document.getElementById('daily-summary').innerHTML = msg;
}

function renderTasksView() {
    const priority = document.getElementById('filter-priority')?.value || 'all';
    const category = document.getElementById('filter-category')?.value || 'all';
    const status = document.getElementById('filter-status')?.value || 'all';
    const search = (document.getElementById('search-tasks')?.value || '').toLowerCase();
    
    let filtered = [...tasks];
    if (priority !== 'all') filtered = filtered.filter(t => t.priority === priority);
    if (category !== 'all') filtered = filtered.filter(t => t.category === category);
    if (status === 'pending') filtered = filtered.filter(t => !t.completed);
    if (status === 'completed') filtered = filtered.filter(t => t.completed);
    if (search) filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(search) || 
        (t.description && t.description.toLowerCase().includes(search))
    );
    
    filtered.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    const container = document.getElementById('tasks-list');
    if (filtered.length === 0) {
        container.innerHTML = '<div class="text-center py-12 text-slate-400"><i class="fas fa-inbox text-4xl mb-3"></i><p>No tasks found</p></div>';
        return;
    }
    container.innerHTML = filtered.map(t => createTaskCard(t)).join('');
}

function renderTodayView() {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayTasks = tasks.filter(t => t.dueDate === todayStr || (!t.dueDate && !t.completed));
    // Prefer tasks due today, also show undated pending
    const dueToday = tasks.filter(t => t.dueDate === todayStr);
    
    const container = document.getElementById('today-tasks');
    if (dueToday.length === 0) {
        container.innerHTML = '<div class="text-center py-12 text-slate-400"><i class="fas fa-sun text-4xl mb-3"></i><p>No tasks due today. Great job staying on top of things!</p></div>';
        return;
    }
    container.innerHTML = dueToday
        .sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1))
        .map(t => createTaskCard(t)).join('');
}

function renderUpcomingView() {
    const today = new Date();
    today.setHours(0,0,0,0);
    const upcoming = tasks
        .filter(t => !t.completed && t.dueDate)
        .filter(t => new Date(t.dueDate + 'T00:00:00') > today)
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    
    const container = document.getElementById('upcoming-tasks');
    if (upcoming.length === 0) {
        container.innerHTML = '<div class="text-center py-12 text-slate-400"><i class="fas fa-calendar-day text-4xl mb-3"></i><p>No upcoming tasks scheduled</p></div>';
        return;
    }
    container.innerHTML = upcoming.map(t => createTaskCard(t)).join('');
}

function renderCompletedView() {
    const completed = tasks.filter(t => t.completed).sort((a, b) => new Date(b.completedAt || b.createdAt) - new Date(a.completedAt || a.createdAt));
    const container = document.getElementById('completed-tasks');
    if (completed.length === 0) {
        container.innerHTML = '<div class="text-center py-12 text-slate-400"><i class="fas fa-check-circle text-4xl mb-3"></i><p>No completed tasks yet. Start checking things off!</p></div>';
        return;
    }
    container.innerHTML = completed.map(t => createTaskCard(t)).join('');
}

function renderCategories() {
    const cats = [
        { name: 'Personal', icon: 'fa-user', bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-600' },
        { name: 'Work', icon: 'fa-briefcase', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600' },
        { name: 'Study', icon: 'fa-book', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600' },
        { name: 'Health', icon: 'fa-heart', bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-600' },
        { name: 'Other', icon: 'fa-folder', bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-600' }
    ];
    
    const container = document.getElementById('categories-grid');
    container.innerHTML = cats.map(cat => {
        const catTasks = tasks.filter(t => t.category === cat.name);
        const completed = catTasks.filter(t => t.completed).length;
        const pending = catTasks.length - completed;
        return `
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-card border border-slate-100 dark:border-slate-700 cursor-pointer hover:shadow-md transition-all" onclick="filterByCategory('${cat.name}')">
            <div class="flex items-center gap-3 mb-4">
                <div class="w-11 h-11 rounded-xl ${cat.bg} flex items-center justify-center">
                    <i class="fas ${cat.icon} ${cat.text}"></i>
                </div>
                <div>
                    <h4 class="font-semibold">${cat.name}</h4>
                    <p class="text-xs text-slate-500">${catTasks.length} task${catTasks.length !== 1 ? 's' : ''}</p>
                </div>
            </div>
            <div class="flex gap-4 text-sm">
                <span class="text-emerald-600"><i class="fas fa-check mr-1"></i>${completed} done</span>
                <span class="text-amber-600"><i class="fas fa-clock mr-1"></i>${pending} pending</span>
            </div>
        </div>`;
    }).join('');
}

function filterByCategory(cat) {
    showView('tasks');
    document.getElementById('filter-category').value = cat;
    renderTasksView();
}

// ========== Calendar ==========
function changeMonth(delta) {
    calendarDate.setMonth(calendarDate.getMonth() + delta);
    renderCalendar();
}

function renderCalendar() {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    document.getElementById('calendar-month').textContent = calendarDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    
    let html = '';
    for (let i = 0; i < firstDay; i++) {
        html += '<div class="aspect-square"></div>';
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayTasks = tasks.filter(t => t.dueDate === dateStr);
        const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
        const hasTasks = dayTasks.length > 0;
        const hasOverdue = dayTasks.some(t => isOverdue(t));
        
        html += `
        <div onclick="showDayTasks('${dateStr}')" class="aspect-square rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors
            ${isToday ? 'bg-primary-600 text-white font-bold' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}
            ${hasTasks && !isToday ? 'bg-primary-50 dark:bg-primary-900/20' : ''}">
            <span class="text-sm">${day}</span>
            ${hasTasks ? `<div class="flex gap-0.5 mt-0.5">${dayTasks.slice(0,3).map(t => `<div class="w-1 h-1 rounded-full ${t.completed ? 'bg-emerald-400' : hasOverdue ? 'bg-red-400' : (isToday ? 'bg-white' : 'bg-primary-500')}"></div>`).join('')}</div>` : ''}
        </div>`;
    }
    
    document.getElementById('calendar-grid').innerHTML = html;
}

function showDayTasks(dateStr) {
    const dayTasks = tasks.filter(t => t.dueDate === dateStr);
    const container = document.getElementById('calendar-day-tasks');
    if (dayTasks.length === 0) {
        container.innerHTML = `<p class="text-sm text-slate-400 text-center py-4">No tasks on ${formatDate(dateStr)}</p>`;
        return;
    }
    container.innerHTML = `<h4 class="font-semibold mb-3">Tasks on ${formatDate(dateStr)}</h4>` + dayTasks.map(t => createTaskCard(t)).join('');
}

// ========== Chart ==========
function updateWeeklyChart() {
    const ctx = document.getElementById('weekly-chart');
    if (!ctx) return;
    
    const days = [];
    const completedData = [];
    const createdData = [];
    
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0,0,0,0);
        const dateStr = d.toISOString().split('T')[0];
        days.push(d.toLocaleDateString('en-IN', { weekday: 'short' }));
        
        const completed = tasks.filter(t => t.completed && t.completedAt && t.completedAt.startsWith(dateStr)).length;
        const created = tasks.filter(t => t.createdAt && t.createdAt.startsWith(dateStr)).length;
        completedData.push(completed);
        createdData.push(created);
    }
    
    if (weeklyChart) weeklyChart.destroy();
    
    const isDark = document.documentElement.classList.contains('dark');
    
    weeklyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: days,
            datasets: [
                {
                    label: 'Completed',
                    data: completedData,
                    backgroundColor: '#10b981',
                    borderRadius: 6,
                    barThickness: 16
                },
                {
                    label: 'Created',
                    data: createdData,
                    backgroundColor: '#3b82f6',
                    borderRadius: 6,
                    barThickness: 16
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: isDark ? '#94a3b8' : '#64748b', boxWidth: 12, font: { size: 11 } }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: isDark ? '#94a3b8' : '#64748b' }
                },
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1, color: isDark ? '#94a3b8' : '#64748b' },
                    grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }
                }
            }
        }
    });
}

// ========== Task CRUD ==========
function openAddTaskModal() {
    editingTaskId = null;
    document.getElementById('modal-title').textContent = 'Add New Task';
    document.getElementById('task-form').reset();
    document.getElementById('task-id').value = '';
    document.getElementById('task-priority').value = 'Medium';
    document.getElementById('task-category').value = 'Personal';
    // Default due date to today
    document.getElementById('task-due-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('task-modal').classList.remove('hidden');
    document.getElementById('task-modal').classList.add('flex');
}

function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    editingTaskId = id;
    document.getElementById('modal-title').textContent = 'Edit Task';
    document.getElementById('task-id').value = task.id;
    document.getElementById('task-title').value = task.title;
    document.getElementById('task-description').value = task.description || '';
    document.getElementById('task-due-date').value = task.dueDate || '';
    document.getElementById('task-due-time').value = task.dueTime || '';
    document.getElementById('task-priority').value = task.priority || 'Medium';
    document.getElementById('task-category').value = task.category || 'Personal';
    document.getElementById('task-modal').classList.remove('hidden');
    document.getElementById('task-modal').classList.add('flex');
}

function closeTaskModal() {
    document.getElementById('task-modal').classList.add('hidden');
    document.getElementById('task-modal').classList.remove('flex');
    editingTaskId = null;
}

document.getElementById('task-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const title = document.getElementById('task-title').value.trim();
    if (!title) return;
    
    const taskData = {
        title,
        description: document.getElementById('task-description').value.trim(),
        dueDate: document.getElementById('task-due-date').value || null,
        dueTime: document.getElementById('task-due-time').value || null,
        priority: document.getElementById('task-priority').value,
        category: document.getElementById('task-category').value
    };
    
    if (editingTaskId) {
        const idx = tasks.findIndex(t => t.id === editingTaskId);
        if (idx !== -1) {
            tasks[idx] = { ...tasks[idx], ...taskData, updatedAt: new Date().toISOString() };
        }
    } else {
        tasks.push({
            id: generateId(),
            ...taskData,
            completed: false,
            createdAt: new Date().toISOString()
        });
    }
    
    saveTasks();
    closeTaskModal();
    renderAll();
});

function toggleComplete(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    task.completed = !task.completed;
    task.completedAt = task.completed ? new Date().toISOString() : null;
    saveTasks();
    renderAll();
}

function deleteTask(id) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderAll();
}

function clearAllTasks() {
    if (!confirm('This will permanently delete ALL your tasks. Are you sure?')) return;
    if (!confirm('This action cannot be undone. Confirm again?')) return;
    tasks = [];
    saveTasks();
    renderAll();
    alert('All tasks cleared.');
}

// Close modal on outside click
document.getElementById('task-modal').addEventListener('click', function(e) {
    if (e.target === this) closeTaskModal();
});
