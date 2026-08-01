// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { getUser } from './services/api';
import Header from './components/Header';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Scan from './pages/Scan';
import FileDetail from './pages/FileDetail';
import Upload from './pages/Upload';
import WorkflowBuilder from './pages/WorkflowBuilder';
import Analytics from './pages/Analytics';
import CitizenStatus from './pages/CitizenStatus';

// Route guard to check user login session & roles
function ProtectedRoute({ children, allowedRoles }) {
  const user = getUser();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If authenticated but unauthorized, fall back to home routing
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-govBlue-50 text-govBlue-900 flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto pb-12 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}

// Redirect root index to proper landing dashboard based on officer role
function HomeRedirect() {
  const user = getUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'commissioner') {
    return <Navigate to="/analytics" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Citizen Portal (Landing Page) */}
        <Route path="/" element={<CitizenStatus />} />
        <Route path="/status" element={<CitizenStatus />} />
        
        {/* Authentication */}
        <Route path="/login" element={<Login />} />

        {/* Revenue Inspector File Upload */}
        <Route
          path="/upload"
          element={
            <ProtectedRoute allowedRoles={['revenue_inspector']}>
              <Upload />
            </ProtectedRoute>
          }
        />

        {/* Commissioner Analytics */}
        <Route
          path="/analytics"
          element={
            <ProtectedRoute allowedRoles={['commissioner']}>
              <Analytics />
            </ProtectedRoute>
          }
        />

        {/* Officers Dashboard (RI, TPO, AE, EE) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['revenue_inspector', 'town_planning_officer', 'assistant_engineer', 'executive_engineer']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Qr/Barcode Live Scanner (Any officer) */}
        <Route
          path="/scan"
          element={
            <ProtectedRoute>
              <Scan />
            </ProtectedRoute>
          }
        />

        {/* File Detail View (Any officer) */}
        <Route
          path="/files/:id"
          element={
            <ProtectedRoute>
              <FileDetail />
            </ProtectedRoute>
          }
        />

        {/* Workflow Template Builder UI Shell */}
        <Route
          path="/builder"
          element={
            <ProtectedRoute>
              <WorkflowBuilder />
            </ProtectedRoute>
          }
        />

        {/* Wildcard Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
