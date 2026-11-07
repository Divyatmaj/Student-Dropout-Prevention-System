import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layout shell
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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Standalone Authentication Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Institutional Layout & Sub-routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="students" element={<Students />} />
          <Route path="students/:id" element={<StudentDetail />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="academics" element={<Academics />} />
          <Route path="risk" element={<RiskMonitoring />} />
          <Route path="interventions" element={<Interventions />} />
        </Route>

        {/* Fallback Catch-all: Redirect unknown routes back to /dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
