import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ExpenseProvider } from './context/ExpenseContext';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AddExpense from './pages/AddExpense';
import Wallets from './pages/Wallets';
import Analytics from './pages/Analytics';
import Subscriptions from './pages/Subscriptions';
import Settings from './pages/Settings';
import Transactions from './pages/Transactions';
import AdminDashboard from './pages/AdminDashboard';
import Chatbot from './components/Chatbot';
import Login from './pages/Login';
import Signup from './pages/Signup';
import LandingPage from './pages/LandingPage';
import BusinessRegister from './pages/BusinessRegister';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

function App() {
  return (
    <AuthProvider>
      <ExpenseProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/business-register" element={<BusinessRegister />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout><Dashboard /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/add" element={
              <ProtectedRoute>
                <Layout><AddExpense /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/transactions" element={
              <ProtectedRoute>
                <Layout><Transactions /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/wallets" element={
              <ProtectedRoute>
                <Layout><Wallets /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/analytics" element={
              <ProtectedRoute>
                <Layout><Analytics /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/subscriptions" element={
              <ProtectedRoute>
                <Layout><Subscriptions /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Layout><Settings /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <AdminRoute>
                <Layout><AdminDashboard /></Layout>
              </AdminRoute>
            } />

            {/* Catch all - redirect to dashboard (which will redirect to login if needed) */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Chatbot />
        </BrowserRouter>
      </ExpenseProvider>
    </AuthProvider>
  );
}

export default App;
