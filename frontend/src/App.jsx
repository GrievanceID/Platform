import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './layouts/ProtectedRoute';
import { CitizenLayout } from './layouts/CitizenLayout';
import { StaffLayout } from './layouts/StaffLayout';
import { LandingPage } from './pages/public/LandingPage';
import { FeaturesPage } from './pages/public/FeaturesPage';
import { LoginPage } from './pages/LoginPage';
import { GrievanceListPage } from './pages/citizen/GrievanceListPage';
import { NewGrievancePage } from './pages/citizen/NewGrievancePage';
import { GrievanceDetailPage } from './pages/citizen/GrievanceDetailPage';
import { ProfilePage } from './pages/citizen/ProfilePage';
import { HelpPage } from './pages/citizen/HelpPage';
import { ReviewerQueuePage } from './pages/reviewer/ReviewerQueuePage';
import { ReviewerCasePage } from './pages/reviewer/ReviewerCasePage';
import { EmployeeDashboardPage } from './pages/employee/EmployeeDashboardPage';
import { EmployeeCasePage } from './pages/employee/EmployeeCasePage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminEmployeesPage } from './pages/admin/AdminEmployeesPage';
import { AdminStatsPage } from './pages/admin/AdminStatsPage';
import { AdminIssuesPage } from './pages/admin/AdminIssuesPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Citizen */}
          <Route
            element={
              <ProtectedRoute allowed_roles={['citizen']}>
                <CitizenLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/grievances/mine" element={<GrievanceListPage />} />
            <Route path="/grievances/new"  element={<NewGrievancePage />} />
            <Route path="/grievances/:id"  element={<GrievanceDetailPage />} />
            <Route path="/profile"         element={<ProfilePage />} />
            <Route path="/help"            element={<HelpPage />} />
          </Route>

          {/* Reviewer */}
          <Route
            element={
              <ProtectedRoute allowed_roles={['reviewer']}>
                <StaffLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/reviewer/queue"     element={<ReviewerQueuePage />} />
            <Route path="/reviewer/queue/:id" element={<ReviewerCasePage />} />
          </Route>

          {/* Employee */}
          <Route
            element={
              <ProtectedRoute allowed_roles={['employee']}>
                <StaffLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/employee/dashboard" element={<EmployeeDashboardPage />} />
            <Route path="/employee/cases/:id" element={<EmployeeCasePage />} />
          </Route>

          {/* Admin */}
          <Route
            element={
              <ProtectedRoute allowed_roles={['admin']}>
                <StaffLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/admin/dashboard"  element={<AdminDashboardPage />} />
            <Route path="/admin/employees"  element={<AdminEmployeesPage />} />
            <Route path="/admin/stats"      element={<AdminStatsPage />} />
            <Route path="/admin/issues"     element={<AdminIssuesPage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
