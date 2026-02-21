import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import api from '../api';

export default function AppLayout() {
    if (!api.isLoggedIn()) return <Navigate to="/" replace />;

    return (
        <>
            <div className="bg-animation"></div>
            <div className="app-layout">
                <Sidebar />
                <main className="main-content">
                    <Outlet />
                </main>
            </div>
        </>
    );
}
