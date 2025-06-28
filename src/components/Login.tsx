import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { MapPin, Mail, Lock, Eye, EyeOff } from 'lucide-react'

const Login: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showCard, setShowCard] = useState(false)
  const [showHeader, setShowHeader] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showToggle, setShowToggle] = useState(false)
  const [showRedirect, setShowRedirect] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [showLogoutTransition, setShowLogoutTransition] = useState(false)
  const { signup, login, loginWithGoogle } = useAuth()
  const navigate = useNavigate()

  // Progressive reveal animation
  useEffect(() => {
    // Check if this is a logout transition
    const isLogoutTransition = sessionStorage.getItem('logoutTransition')
    if (isLogoutTransition) {
      sessionStorage.removeItem('logoutTransition')
      setShowLogoutTransition(true)
      // Start the reverse grid reveal animation
      setTimeout(() => {
        setShowLogoutTransition(false)
        // Start normal login animation
        setTimeout(() => setShowCard(true), 100)
        setTimeout(() => setShowHeader(true), 300)
        setTimeout(() => setShowForm(true), 600)
        setTimeout(() => setShowToggle(true), 900)
      }, 1500)
    } else {
      // Normal login animation
      setTimeout(() => setShowCard(true), 100)
      setTimeout(() => setShowHeader(true), 300)
      setTimeout(() => setShowForm(true), 600)
      setTimeout(() => setShowToggle(true), 900)
    }
  }, [])

  // Debounced typing effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTyping(false)
    }, 500) // Stop typing after 500ms of no input

    return () => clearTimeout(timer)
  }, [email, password])

  const handleInputChange = (field: 'email' | 'password', value: string) => {
    setIsTyping(true)
    if (field === 'email') {
      setEmail(value)
    } else {
      setPassword(value)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isSignUp) {
        await signup(email, password)
      } else {
        await login(email, password)
      }
      
      // Start redirect animation
      setShowRedirect(true)
      
      // Navigate after animation
      setTimeout(() => {
        navigate('/explorer')
      }, 1000)
      
    } catch (error: any) {
      setError(error.message || 'An error occurred')
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setLoading(true)

    try {
      await loginWithGoogle()
      
      // Start redirect animation
      setShowRedirect(true)
      
      // Navigate after animation
      setTimeout(() => {
        navigate('/explorer')
      }, 1000)
      
    } catch (error: any) {
      setError(error.message || 'An error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-primary px-4 overflow-y-auto">
      <div className="max-w-md w-full space-y-8 py-8">
        {/* Header with progressive reveal */}
        <div className={`text-center transition-all duration-700 ${showHeader ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'}`}>
          <div className="flex justify-center mb-6">
            <div className={`p-3 bg-singapore-red/10 rounded-xl transition-all duration-1000 map-pin-icon ${showHeader ? 'scale-100' : 'scale-0'} ${isTyping ? 'animate-bounce' : ''}`}>
              <MapPin className="h-10 w-10 text-singapore-red" />
            </div>
          </div>
          <h2 className={`text-3xl font-bold text-gray-900 dark:text-dark-primary mb-2 transition-all duration-700 delay-200 ${showHeader ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'}`}>
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h2>
          <p className={`text-gray-600 dark:text-dark-secondary transition-all duration-700 delay-400 ${showHeader ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'}`}>
            {isSignUp 
              ? 'Start your Singapore exploration journey' 
              : 'Welcome back to your exploration'
            }
          </p>
        </div>

        {/* Form with grid reveal animation */}
        <div className={`card transition-all duration-1000 ${showCard ? 'opacity-100 scale-100' : 'opacity-0 scale-75'} ${showRedirect ? 'opacity-0 scale-95' : ''}`}>
          <form className={`space-y-6 transition-all duration-700 ${showForm ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'}`} onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 animate-slide-in">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <div className={`transition-all duration-500 delay-200 ${showForm ? 'opacity-100 transform translate-x-0' : 'opacity-0 transform -translate-x-8'}`}>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-dark-secondary mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="input-field pl-12"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div className={`transition-all duration-500 delay-400 ${showForm ? 'opacity-100 transform translate-x-0' : 'opacity-0 transform -translate-x-8'}`}>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-dark-secondary mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  required
                  value={password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="input-field pl-12 pr-12"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center hover:text-gray-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className={`transition-all duration-500 delay-600 ${showForm ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'}`}>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {isSignUp ? 'Creating Account...' : 'Signing In...'}
                  </div>
                ) : (
                  isSignUp ? 'Create Account' : 'Sign In'
                )}
              </button>
            </div>

            {/* Divider */}
            <div className={`relative transition-all duration-500 delay-700 ${showForm ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'}`}>
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-dark-secondary text-gray-500 dark:text-gray-400">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Google Sign In Button */}
            <div className={`transition-all duration-500 delay-800 ${showForm ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'}`}>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white dark:bg-dark-secondary text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-tertiary focus:outline-none focus:ring-2 focus:ring-singapore-blue focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Continue with Google'
                )}
              </button>
            </div>
          </form>

          {/* Toggle Sign Up/Sign In with progressive reveal */}
          <div className={`mt-8 text-center transition-all duration-700 delay-800 ${showToggle ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'}`}>
            <p className="text-sm text-gray-600 dark:text-dark-secondary">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp)
                  setError('')
                }}
                className="ml-1 text-singapore-blue hover:text-blue-700 dark:hover:text-blue-400 font-medium transition-colors duration-200"
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Logout Transition - Reverse Grid Reveal */}
      {showLogoutTransition && (
        <div className="fixed inset-0 bg-white dark:bg-dark-primary z-50 flex items-center justify-center overflow-hidden">
          {/* Grid Pattern */}
          <div className="absolute inset-0 grid grid-cols-8 gap-1 p-4 opacity-20">
            {Array.from({ length: 64 }, (_, i) => (
              <div 
                key={i}
                className="bg-singapore-red rounded-sm animate-grid-reveal"
                style={{ 
                  animationDelay: `${i * 20}ms`,
                  animationDuration: '800ms'
                }}
              />
            ))}
          </div>
          
          {/* Center Content */}
          <div className="relative z-10 text-center animate-fade-in">
            <div className="p-4 bg-singapore-red/10 rounded-xl mb-4 animate-scale-in">
              <MapPin className="h-12 w-12 text-singapore-red mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-dark-primary mb-2">
              Welcome Back!
            </h3>
            <p className="text-gray-600 dark:text-dark-secondary">
              Ready to explore Singapore again?
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Login 