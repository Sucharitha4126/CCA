import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import LandingPage from './pages/LandingPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import UserDashboard from './pages/UserDashboard.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import GraphAnalysis from './pages/GraphAnalysis.jsx'
import TransactionPage from './pages/TransactionPage.jsx'
import UnauthorizedPage from './pages/UnauthorizedPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import SecurityCenterPage from './pages/SecurityCenterPage.jsx'

function ProtectedRoute({ children, adminOnly = false }) {
  const { token, user, loading } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  if (loading) return <div className="grid min-h-screen place-items-center grid-bg text-slate-300">Loading secure workspace...</div>
  if (adminOnly && user?.role !== 'admin') return <Navigate to="/unauthorized" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin/login" element={<LoginPage adminMode />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
      <Route path="/transactions" element={<ProtectedRoute><TransactionPage /></ProtectedRoute>} />
      <Route path="/security" element={<ProtectedRoute><SecurityCenterPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/graph" element={<ProtectedRoute adminOnly><Navigate to="/graph-analysis" replace /></ProtectedRoute>} />
      <Route path="/graph-analysis" element={<ProtectedRoute adminOnly><GraphAnalysis /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/fraud-monitoring" element={<ProtectedRoute adminOnly><AdminDashboard section="fraud" /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute adminOnly><AdminDashboard section="users" /></ProtectedRoute>} />
      <Route path="/admin/security" element={<ProtectedRoute adminOnly><AdminDashboard section="security" /></ProtectedRoute>} />
      <Route path="/admin/alerts" element={<ProtectedRoute adminOnly><AdminDashboard section="alerts" /></ProtectedRoute>} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
    </Routes>
  )
}
