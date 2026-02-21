const API_BASE = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000') + '/api';

const api = {
    getTokens() {
        return { access: localStorage.getItem('sb_access'), refresh: localStorage.getItem('sb_refresh') };
    },
    setTokens(access, refresh) {
        localStorage.setItem('sb_access', access);
        if (refresh) localStorage.setItem('sb_refresh', refresh);
    },
    clearTokens() {
        localStorage.removeItem('sb_access');
        localStorage.removeItem('sb_refresh');
        localStorage.removeItem('sb_user');
    },
    setUser(user) { localStorage.setItem('sb_user', JSON.stringify(user)); },
    getUser() { const d = localStorage.getItem('sb_user'); return d ? JSON.parse(d) : null; },
    isLoggedIn() { return !!this.getTokens().access; },

    async request(endpoint, options = {}) {
        const { access } = this.getTokens();
        const headers = {
            'Content-Type': 'application/json',
            ...(access ? { Authorization: `Bearer ${access}` } : {}),
            ...options.headers,
        };
        try {
            let response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
            if (response.status === 401) {
                const refreshed = await this.refreshToken();
                if (refreshed) {
                    headers.Authorization = `Bearer ${this.getTokens().access}`;
                    response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
                    if (!response.ok) throw await this.parseError(response);
                    return response.json();
                } else {
                    this.clearTokens();
                    window.location.href = '/';
                    return;
                }
            }
            if (!response.ok) throw await this.parseError(response);
            return response.json();
        } catch (error) {
            if (error.message === 'Failed to fetch') {
                throw { detail: 'Cannot connect to server. Is the backend running on port 8000?' };
            }
            throw error;
        }
    },

    async parseError(response) {
        try { return await response.json(); } catch { return { detail: `Error ${response.status}` }; }
    },

    async refreshToken() {
        const { refresh } = this.getTokens();
        if (!refresh) return false;
        try {
            const r = await fetch(`${API_BASE}/token/refresh/`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh }),
            });
            if (!r.ok) return false;
            const data = await r.json();
            this.setTokens(data.access, data.refresh || refresh);
            return true;
        } catch { return false; }
    },

    async login(username, password) {
        const r = await fetch(`${API_BASE}/token/`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        if (!r.ok) throw await this.parseError(r);
        const data = await r.json();
        this.setTokens(data.access, data.refresh);
        const user = await this.request('/me/');
        this.setUser(user);
        return user;
    },

    getProfile() { return this.request('/me/'); },
    getDashboardStats() { return this.request('/dashboard-stats/'); },
    getManagers() { return this.request('/managers/'); },
    createManager(data) { return this.request('/managers/', { method: 'POST', body: JSON.stringify({ ...data, role: 'rm' }) }); },
    getCustomers() { return this.request('/customers/'); },
    createCustomer(data) { return this.request('/customers/', { method: 'POST', body: JSON.stringify({ ...data, role: 'customer' }) }); },
    getAccounts() { return this.request('/accounts/'); },
    getTransactions(p = {}) { const q = new URLSearchParams(p).toString(); return this.request(`/transactions/${q ? '?' + q : ''}`); },
    getServices() { return this.request('/services/'); },
    createService(data) { return this.request('/services/', { method: 'POST', body: JSON.stringify(data) }); },
    getAllCustomers() { return this.request('/all-customers/'); },
    getCustomerAccounts(id) { return this.request(`/customers/${id}/accounts/`); },
};

export default api;
