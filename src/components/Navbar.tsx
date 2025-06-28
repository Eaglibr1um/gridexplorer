import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { MapPin, LogOut, Sun, Moon } from 'lucide-react'

const Navbar: React.FC = () => {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Failed to log out:', error)
    }
  }

  return (
    <nav className="bg-white dark:bg-dark-secondary shadow-sm border-b border-gray-100 dark:border-dark-primary transition-colors duration-200">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-3">
            <div className="p-2 bg-singapore-red/10 rounded-lg">
              <MapPin className="h-6 w-6 text-singapore-red" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-dark-primary">
              Singapore Grid Explorer
            </span>
          </Link>

          {/* Navigation Links */}
          {user && (
            <div className="flex items-center space-x-6">
              <Link
                to="/dashboard"
                className="text-gray-700 dark:text-dark-secondary hover:text-singapore-blue dark:hover:text-singapore-blue transition-colors duration-200 font-medium"
              >
                Dashboard
              </Link>
              <Link
                to="/explorer"
                className="text-gray-700 dark:text-dark-secondary hover:text-singapore-blue dark:hover:text-singapore-blue transition-colors duration-200 font-medium"
              >
                Explorer
              </Link>
            </div>
          )}

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-dark-tertiary hover:bg-gray-200 dark:hover:bg-dark-primary transition-colors duration-200"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5 text-gray-700 dark:text-dark-secondary" />
              ) : (
                <Sun className="h-5 w-5 text-gray-700 dark:text-dark-secondary" />
              )}
            </button>

            {/* User Info */}
            {user && (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700 dark:text-dark-secondary font-medium">
                  {user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 text-gray-700 dark:text-dark-secondary hover:text-singapore-red dark:hover:text-singapore-red transition-colors duration-200 font-medium"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar 