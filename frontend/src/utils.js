// Utility helpers

export function formatCurrency(amount) {
    const num = parseFloat(amount);
    return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function getGreeting() {
    const h = new Date().getHours();
    return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
}

export function getInitials(user) {
    return (user.first_name?.[0] || '') + (user.last_name?.[0] || '') || '?';
}

export function getRoleDisplay(role) {
    return role === 'rm' ? 'Relationship Manager' : role === 'superadmin' ? 'Super Admin' : 'Customer';
}
