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
  const { signup, login } = useAuth()
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-primary px-4">
      <div className="max-w-md w-full space-y-8">
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