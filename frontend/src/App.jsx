import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import AppLayout from './components/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import Statements from './pages/Statements';
import Services from './pages/Services';
import Transactions from './pages/Transactions';
import ManageUsers from './pages/ManageUsers';
import AllCustomers from './pages/AllCustomers';

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/statements" element={<Statements />} />
            <Route path="/services" element={<Services />} />
            <Route path="/manage-users" element={<ManageUsers />} />
            <Route path="/all-customers" element={<AllCustomers />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
