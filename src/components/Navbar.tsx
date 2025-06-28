import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { MapPin, LogOut, User, Compass } from 'lucide-react'

const Navbar: React.FC = () => {
  const { user, logout } = useAuth()
  const location = useLocation()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Failed to log out:', error)
    }
  }

  if (!user) return null

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <MapPin className="h-8 w-8 text-singapore-red" />
              <span className="text-xl font-bold text-gray-900">Grid Explorer</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              to="/dashboard"
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                location.pathname === '/dashboard'
                  ? 'bg-singapore-red text-white'
                  : 'text-gray-700 hover:text-singapore-red hover:bg-gray-50'
              }`}
            >
              <User className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>

            <Link
              to="/explorer"
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                location.pathname === '/explorer'
                  ? 'bg-singapore-red text-white'
                  : 'text-gray-700 hover:text-singapore-red hover:bg-gray-50'
              }`}
            >
              <Compass className="h-4 w-4" />
              <span>Explorer</span>
            </Link>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">
                {user.email}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-singapore-red hover:bg-gray-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar 