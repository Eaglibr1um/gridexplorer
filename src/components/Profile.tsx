import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  getUserProfile, 
  updateAvatar,
  updateBackgroundColor,
  updateNickname,
  subscribeToProfile,
  UserProfile,
  AVATAR_OPTIONS,
  BACKGROUND_COLORS,
  getAvatarById,
  getBackgroundColorById
} from '../services/profileService'
import { 
  MapPin, 
  User, 
  Save, 
  Edit3,
  ArrowLeft,
  Check,
  Palette
} from 'lucide-react'

const Profile: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingNickname, setEditingNickname] = useState(false)
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState<string>('')
  const [selectedBackground, setSelectedBackground] = useState<string>('')

  // Load profile data
  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    const loadProfile = async () => {
      try {
        const profileData = await getUserProfile(user.uid)
        setProfile(profileData)
        setNickname(profileData?.nickname || '')
        setSelectedAvatar(profileData?.avatarId || 'explorer')
        setSelectedBackground(profileData?.backgroundColor || 'gradient')
      } catch (error) {
        console.error('Error loading profile:', error)
        setError('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()

    // Subscribe to profile changes
    const unsubscribe = subscribeToProfile(user.uid, (profileData) => {
      setProfile(profileData)
      setNickname(profileData?.nickname || '')
      setSelectedAvatar(profileData?.avatarId || 'explorer')
      setSelectedBackground(profileData?.backgroundColor || 'gradient')
    })

    return () => unsubscribe()
  }, [user, navigate])

  // Handle avatar selection
  const handleAvatarSelect = async (avatarId: string) => {
    if (!user) return

    try {
      setError('')
      await updateAvatar(user.uid, avatarId)
      setSelectedAvatar(avatarId)
      setSuccess('Avatar updated successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error: any) {
      setError(error.message || 'Failed to update avatar')
    }
  }

  // Handle background color selection
  const handleBackgroundSelect = async (colorId: string) => {
    if (!user) return

    try {
      setError('')
      await updateBackgroundColor(user.uid, colorId)
      setSelectedBackground(colorId)
      setSuccess('Background color updated successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error: any) {
      setError(error.message || 'Failed to update background color')
    }
  }

  // Handle nickname save
  const handleSaveNickname = async () => {
    if (!user) return

    try {
      setError('')
      await updateNickname(user.uid, nickname)
      setEditingNickname(false)
      setSuccess('Nickname updated successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error: any) {
      setError(error.message || 'Failed to update nickname')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-primary">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-singapore-red"></div>
      </div>
    )
  }

  const currentAvatar = getAvatarById(selectedAvatar)
  const currentBackground = getBackgroundColorById(selectedBackground)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-primary">
      {/* Header */}
      <div className="bg-white dark:bg-dark-secondary shadow-sm border-b border-gray-200 dark:border-dark-primary">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/explorer')}
                className="p-2 rounded-lg bg-gray-100 dark:bg-dark-tertiary hover:bg-gray-200 dark:hover:bg-dark-primary transition-colors duration-200"
              >
                <ArrowLeft className="h-5 w-5 text-gray-700 dark:text-dark-secondary" />
              </button>
              <div className="p-2 bg-singapore-red/10 rounded-lg">
                <MapPin className="h-6 w-6 text-singapore-red" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-dark-primary">Profile Settings</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
              <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
            </div>
          )}

          {/* Current Avatar Display */}
          <div className="bg-white dark:bg-dark-secondary rounded-xl shadow-lg border border-gray-200 dark:border-dark-primary p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-primary mb-4">Current Avatar</h2>
            
            <div className="flex items-center space-x-4">
              <div className={`w-20 h-20 rounded-full ${currentBackground.value} flex items-center justify-center text-3xl shadow-lg`}>
                {currentAvatar.emoji}
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-dark-primary">{currentAvatar.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Your selected avatar</p>
              </div>
            </div>
          </div>

          {/* Avatar Selection */}
          <div className="bg-white dark:bg-dark-secondary rounded-xl shadow-lg border border-gray-200 dark:border-dark-primary p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-primary mb-4">Choose Avatar</h2>
            
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-3 overflow-x-auto">
              {AVATAR_OPTIONS.map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => handleAvatarSelect(avatar.id)}
                  className={`relative p-2 sm:p-3 rounded-xl border-2 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-singapore-blue/50 focus:z-10 flex flex-col items-center justify-center ${
                    selectedAvatar === avatar.id
                      ? 'border-singapore-blue bg-singapore-blue/10 shadow-lg'
                      : 'border-gray-200 dark:border-dark-primary hover:border-singapore-blue/50'
                  }`}
                >
                  <div className="text-xl sm:text-2xl mb-0.5 sm:mb-1">{avatar.emoji}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 truncate hidden sm:block">{avatar.name}</div>
                  {selectedAvatar === avatar.id && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-singapore-blue rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Background Color Selection */}
          <div className="bg-white dark:bg-dark-secondary rounded-xl shadow-lg border border-gray-200 dark:border-dark-primary p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-primary mb-4 flex items-center">
              <Palette className="h-5 w-5 mr-2 text-singapore-blue" />
              Choose Background Color
            </h2>
            
            <div className="grid grid-cols-4 gap-3">
              {BACKGROUND_COLORS.map((color) => (
                <button
                  key={color.id}
                  onClick={() => handleBackgroundSelect(color.id)}
                  className={`relative p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105 flex flex-col items-center justify-center ${
                    selectedBackground === color.id
                      ? 'border-singapore-blue shadow-lg'
                      : 'border-gray-200 dark:border-dark-primary hover:border-singapore-blue/50'
                  }`}
                >
                  <div className={`w-full h-12 rounded-lg ${color.value} mb-2`}></div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 text-center hidden sm:block">{color.name}</div>
                  {selectedBackground === color.id && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-singapore-blue rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Nickname Section */}
          <div className="bg-white dark:bg-dark-secondary rounded-xl shadow-lg border border-gray-200 dark:border-dark-primary p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-primary mb-4">Display Name</h2>
            
            <div className="space-y-3">
              {editingNickname ? (
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Enter your nickname"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-dark-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-singapore-blue focus:border-transparent bg-white dark:bg-dark-tertiary text-gray-900 dark:text-dark-primary"
                    maxLength={20}
                  />
                  <button
                    onClick={handleSaveNickname}
                    className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200"
                  >
                    <Save className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingNickname(false)
                      setNickname(profile?.nickname || '')
                    }}
                    className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Current display name</p>
                    <p className="text-lg font-medium text-gray-900 dark:text-dark-primary">
                      {profile?.nickname || 'Not set'}
                    </p>
                  </div>
                  <button
                    onClick={() => setEditingNickname(true)}
                    className="p-2 bg-singapore-blue text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                </div>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400">
                This name will be displayed in the menu instead of your email address.
              </p>
            </div>
          </div>

          {/* User Info Section */}
          <div className="bg-white dark:bg-dark-secondary rounded-xl shadow-lg border border-gray-200 dark:border-dark-primary p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-primary mb-4">Account Information</h2>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Email address</p>
                <p className="text-lg font-medium text-gray-900 dark:text-dark-primary">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Account created</p>
                <p className="text-lg font-medium text-gray-900 dark:text-dark-primary">
                  {user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile 