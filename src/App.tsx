import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import Login from './components/Login'
import GridExplorer from './components/GridExplorer'
import Profile from './components/Profile'
import Tuition from './components/Tuition'
import WorkProgressTracker from './components/WorkProgressTracker'

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-primary">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-singapore-red"></div>
      </div>
    )
  }
  
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

function AppContent() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-dark-primary">
        <main className="flex-1">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route 
              path="/explorer" 
              element={
                <ProtectedRoute>
                  <GridExplorer />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route path="/tuition" element={<Tuition />} />
            <Route path="/work-progress" element={<WorkProgressTracker />} />
            <Route path="/" element={<Navigate to="/tuition" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
        <Analytics />
        <SpeedInsights />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App 