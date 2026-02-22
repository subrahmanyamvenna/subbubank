import { NavLink, useNavigate } from 'react-router-dom';
import api from '../api';
import { getInitials, getRoleDisplay } from '../utils';

export default function Sidebar() {
    const user = api.getUser();
    const navigate = useNavigate();
    if (!user) return null;

    const navItems = getNavItems(user.role);

    const handleLogout = () => {
        api.clearTokens();
        navigate('/');
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <div className="brand-icon">🏦</div>
                <h2>Subbu Bank</h2>
            </div>
            <nav className="sidebar-nav">
                {navItems.map(item => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        {item.label}
                    </NavLink>
                ))}
            </nav>
            <div className="sidebar-user">
                <div className="user-info">
                    <div className="user-avatar">{getInitials(user)}</div>
                    <div>
                        <div className="user-name">{user.full_name || user.username}</div>
                        <div className="user-role">{getRoleDisplay(user.role)}</div>
                    </div>
                </div>
                <button className="logout-btn" onClick={handleLogout}>🚪 Sign Out</button>
            </div>
        </aside>
    );
}

function getNavItems(role) {
    const items = [{ icon: '📊', label: 'Dashboard', path: '/dashboard' }];
    if (role === 'superadmin') {
        items.push({ icon: '👔', label: 'Manage RMs', path: '/manage-users' });
        items.push({ icon: '👥', label: 'All Customers', path: '/all-customers' });
    } else if (role === 'rm') {
        items.push({ icon: '👤', label: 'My Customers', path: '/manage-users' });
    } else if (role === 'customer') {
        items.push({ icon: '🏦', label: 'My Accounts', path: '/accounts' });
        items.push({ icon: '💸', label: 'Transact', path: '/transactions' });
        items.push({ icon: '📜', label: 'Statements', path: '/statements' });
        items.push({ icon: '🛎️', label: 'Services', path: '/services' });
    }
    return items;
}
