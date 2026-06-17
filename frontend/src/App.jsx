import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './layouts/ProtectedRoute';
import { CitizenLayout } from './layouts/CitizenLayout';
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { GrievanceListPage } from './pages/citizen/GrievanceListPage';
import { NewGrievancePage } from './pages/citizen/NewGrievancePage';
import { GrievanceDetailPage } from './pages/citizen/GrievanceDetailPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public — no auth guard */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Citizen-protected routes under the sidebar layout */}
          <Route
            element={
              <ProtectedRoute allowed_roles={['citizen']}>
                <CitizenLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/grievances/mine" element={<GrievanceListPage />} />
            <Route path="/grievances/new" element={<NewGrievancePage />} />
            <Route path="/grievances/:id" element={<GrievanceDetailPage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
