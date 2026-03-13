// ==========================================
//  LIFE OS — Helpers & Utilities
// ==========================================

export function generateId() {
    return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6);
}

export function getTodayStr() {
    return new Date().toISOString().split('T')[0];
}

export function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function getWeekDates() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
    const days = [];
    const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        days.push({
            date: d.toISOString().split('T')[0],
            label: labels[i],
            isToday: d.toISOString().split('T')[0] === getTodayStr()
        });
    }
    return days;
}

export function getLast7Days() {
    const days = [];
    const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push({
            date: d.toISOString().split('T')[0],
            label: labels[d.getDay()]
        });
    }
    return days;
}

export function getStreak(completions) {
    if (!completions || completions.length === 0) return 0;
    const sorted = [...completions].sort().reverse();
    const today = getTodayStr();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (sorted[0] !== today && sorted[0] !== yesterdayStr) return 0;

    let streak = 1;
    for (let i = 1; i < sorted.length; i++) {
        const prev = new Date(sorted[i - 1]);
        const curr = new Date(sorted[i]);
        const diff = (prev - curr) / (1000 * 60 * 60 * 24);
        if (diff === 1) {
            streak++;
        } else {
            break;
        }
    }
    return streak;
}

export function getCompletionRate(completions, days = 30) {
    if (!completions) return 0;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    const recent = completions.filter(d => d >= cutoffStr);
    return Math.round((recent.length / days) * 100);
}

export function calculateProgress(nodeId, nodes) {
    const node = nodes[nodeId];
    if (!node) return 0;
    if (!node.childIds || node.childIds.length === 0) {
        return node.completed ? 100 : 0;
    }
    const childProgresses = node.childIds.map(id => calculateProgress(id, nodes));
    const avg = childProgresses.reduce((a, b) => a + b, 0) / childProgresses.length;
    return Math.round(avg);
}

export function countNodes(nodes) {
    const all = Object.values(nodes);
    return {
        total: all.length,
        completed: all.filter(n => n.completed).length,
        inProgress: all.filter(n => !n.completed && n.childIds && n.childIds.length > 0 && calculateProgress(n.id, nodes) > 0).length
    };
}

export function formatTimer(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
}

// --- Doomsday Calendar Helpers ---
export function getDayOfYear(date = new Date()) {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date - start;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function getDaysInYear(year = new Date().getFullYear()) {
    return ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) ? 366 : 365;
}

export function getTimeUntil(dateStr) {
    const target = new Date(dateStr + 'T23:59:59');
    const now = new Date();
    const diffMs = target - now;
    if (diffMs <= 0) return 'Past due';
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today!';
    if (days === 1) return 'Tomorrow';
    if (days < 7) return `${days} days`;
    if (days < 30) return `${Math.floor(days / 7)}w ${days % 7}d`;
    return `${Math.floor(days / 30)}mo ${days % 30}d`;
}

export function dateToDay(dateStr) {
    const d = new Date(dateStr);
    const start = new Date(d.getFullYear(), 0, 0);
    return Math.floor((d - start) / (1000 * 60 * 60 * 24));
}

