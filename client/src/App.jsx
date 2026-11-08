import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import Layout from './components/layout/Layout.jsx';

// Page Views
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Students from './pages/Students.jsx';
import StudentDetail from './pages/StudentDetail.jsx';
import Attendance from './pages/Attendance.jsx';
import Academics from './pages/Academics.jsx';
import RiskMonitoring from './pages/RiskMonitoring.jsx';
import Interventions from './pages/Interventions.jsx';
import Staff from './pages/Staff.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Signed-in staff only */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="students" element={<Students />} />
            <Route path="students/:id" element={<StudentDetail />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="academics" element={<Academics />} />
            <Route path="risk" element={<RiskMonitoring />} />
            <Route path="interventions" element={<Interventions />} />
            <Route path="staff" element={<Staff />} />
            {/* Catch-all Not Found inside layout */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
