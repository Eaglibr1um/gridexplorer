import { 
  doc, 
  updateDoc, 
  getDoc, 
  setDoc,
  onSnapshot,
  DocumentSnapshot
} from 'firebase/firestore'
import { db } from '../config/firebase'

export interface UserProfile {
  nickname?: string
  avatarId?: string
  backgroundColor?: string
}

// Preset avatar options - 20 exploration-themed icons
export const AVATAR_OPTIONS = [
  { id: 'explorer', name: 'Explorer', emoji: '🗺️' },
  { id: 'compass', name: 'Compass', emoji: '🧭' },
  { id: 'map', name: 'Map', emoji: '📋' },
  { id: 'camera', name: 'Camera', emoji: '📸' },
  { id: 'binoculars', name: 'Binoculars', emoji: '🔭' },
  { id: 'backpack', name: 'Backpack', emoji: '🎒' },
  { id: 'hiking', name: 'Hiking', emoji: '🥾' },
  { id: 'telescope', name: 'Telescope', emoji: '🔭' },
  { id: 'flag', name: 'Flag', emoji: '🏁' },
  { id: 'treasure', name: 'Treasure', emoji: '💎' },
  { id: 'mountain', name: 'Mountain', emoji: '⛰️' },
  { id: 'beach', name: 'Beach', emoji: '🏖️' },
  { id: 'city', name: 'City', emoji: '🏙️' },
  { id: 'park', name: 'Park', emoji: '🌳' },
  { id: 'bridge', name: 'Bridge', emoji: '🌉' },
  { id: 'tower', name: 'Tower', emoji: '🗼' },
  { id: 'boat', name: 'Boat', emoji: '⛵' },
  { id: 'plane', name: 'Plane', emoji: '✈️' },
  { id: 'train', name: 'Train', emoji: '🚆' },
  { id: 'bike', name: 'Bike', emoji: '🚴' }
]

// Background color options
export const BACKGROUND_COLORS = [
  { id: 'gradient', name: 'Singapore', value: 'bg-gradient-to-br from-singapore-blue to-singapore-red' },
  { id: 'blue', name: 'Ocean Blue', value: 'bg-gradient-to-br from-blue-500 to-blue-700' },
  { id: 'green', name: 'Forest Green', value: 'bg-gradient-to-br from-green-500 to-green-700' },
  { id: 'purple', name: 'Royal Purple', value: 'bg-gradient-to-br from-purple-500 to-purple-700' },
  { id: 'orange', name: 'Sunset Orange', value: 'bg-gradient-to-br from-orange-500 to-orange-700' },
  { id: 'pink', name: 'Cherry Blossom', value: 'bg-gradient-to-br from-pink-500 to-pink-700' },
  { id: 'teal', name: 'Tropical Teal', value: 'bg-gradient-to-br from-teal-500 to-teal-700' },
  { id: 'indigo', name: 'Deep Indigo', value: 'bg-gradient-to-br from-indigo-500 to-indigo-700' },
  { id: 'red', name: 'Crimson Red', value: 'bg-gradient-to-br from-red-500 to-red-700' },
  { id: 'yellow', name: 'Golden Yellow', value: 'bg-gradient-to-br from-yellow-500 to-yellow-700' },
  { id: 'gray', name: 'Steel Gray', value: 'bg-gradient-to-br from-gray-500 to-gray-700' },
  { id: 'emerald', name: 'Emerald', value: 'bg-gradient-to-br from-emerald-500 to-emerald-700' }
]

// Get user profile data
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userDoc = doc(db, 'users', uid)
    const userSnap = await getDoc(userDoc)
    
    if (userSnap.exists()) {
      const data = userSnap.data()
      return {
        nickname: data.nickname || undefined,
        avatarId: data.avatarId || undefined,
        backgroundColor: data.backgroundColor || undefined
      }
    } else {
      // Create user document if it doesn't exist
      await setDoc(userDoc, {
        email: null, // Will be updated by AuthContext
        createdAt: new Date().toISOString(),
        nickname: null,
        avatarId: null,
        backgroundColor: null
      })
      return {
        nickname: undefined,
        avatarId: undefined,
        backgroundColor: undefined
      }
    }
  } catch (error) {
    console.error('Error getting user profile:', error)
    return null
  }
}

// Update avatar
export const updateAvatar = async (uid: string, avatarId: string): Promise<void> => {
  try {
    const userDoc = doc(db, 'users', uid)
    await updateDoc(userDoc, {
      avatarId: avatarId
    })
  } catch (error) {
    console.error('Error updating avatar:', error)
    throw error
  }
}

// Update background color
export const updateBackgroundColor = async (uid: string, backgroundColor: string): Promise<void> => {
  try {
    const userDoc = doc(db, 'users', uid)
    await updateDoc(userDoc, {
      backgroundColor: backgroundColor
    })
  } catch (error) {
    console.error('Error updating background color:', error)
    throw error
  }
}

// Update nickname
export const updateNickname = async (uid: string, nickname: string): Promise<void> => {
  try {
    const userDoc = doc(db, 'users', uid)
    await updateDoc(userDoc, {
      nickname: nickname.trim() || null
    })
  } catch (error) {
    console.error('Error updating nickname:', error)
    throw error
  }
}

// Subscribe to profile changes
export const subscribeToProfile = (uid: string, callback: (profile: UserProfile | null) => void) => {
  const userDoc = doc(db, 'users', uid)
  
  return onSnapshot(userDoc, (docSnapshot: DocumentSnapshot) => {
    if (docSnapshot.exists()) {
      const data = docSnapshot.data()
      const profile: UserProfile = {
        nickname: data.nickname || undefined,
        avatarId: data.avatarId || undefined,
        backgroundColor: data.backgroundColor || undefined
      }
      callback(profile)
    } else {
      callback(null)
    }
  })
}

// Get avatar by ID
export const getAvatarById = (avatarId: string) => {
  return AVATAR_OPTIONS.find(avatar => avatar.id === avatarId) || AVATAR_OPTIONS[0]
}

// Get background color by ID
export const getBackgroundColorById = (colorId: string) => {
  return BACKGROUND_COLORS.find(color => color.id === colorId) || BACKGROUND_COLORS[0]
} 