import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute, PublicRoute } from './components/RouteGuards';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Admissions from './pages/Admissions';
import AdmissionForm from './pages/AdmissionForm';
import PrintReports from './pages/PrintReports';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            {/* Public Auth Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={<Navigate to="/login" replace />}
            />

            {/* Secure Operator Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admissions"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Admissions />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admissions/new"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AdmissionForm />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admissions/edit/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AdmissionForm />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PrintReports />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Fallbacks */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
