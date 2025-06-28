import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot,
  query,
  where 
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { GridData, GridCell, UserGridProgress } from '../types/grid'
import singaporeGridData from '../../singapore_grid_export_2025-06-21.json'

// Load the Singapore grid data
export const getGridData = (): GridData => {
  return singaporeGridData as GridData
}

// Get user's grid progress from Firestore
export const getUserGridProgress = async (userId: string): Promise<UserGridProgress | null> => {
  try {
    const docRef = doc(db, 'userGridProgress', userId)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      return docSnap.data() as UserGridProgress
    } else {
      // Create new progress document for user
      const newProgress: UserGridProgress = {
        userId,
        exploredCells: {},
        lastUpdated: new Date().toISOString()
      }
      await setDoc(docRef, newProgress)
      return newProgress
    }
  } catch (error) {
    console.error('Error getting user grid progress:', error)
    return null
  }
}

// Mark a grid cell as explored
export const markCellAsExplored = async (
  userId: string, 
  cellId: number, 
  notes?: string
): Promise<boolean> => {
  try {
    const docRef = doc(db, 'userGridProgress', userId)
    const exploredDate = new Date().toISOString()
    
    await updateDoc(docRef, {
      [`exploredCells.${cellId}`]: {
        status: 'explored',
        exploredDate,
        notes: notes || ''
      },
      lastUpdated: exploredDate
    })
    
    return true
  } catch (error) {
    console.error('Error marking cell as explored:', error)
    return false
  }
}

// Mark a grid cell as inaccessible
export const markCellAsInaccessible = async (
  userId: string, 
  cellId: number, 
  notes?: string
): Promise<boolean> => {
  try {
    const docRef = doc(db, 'userGridProgress', userId)
    const exploredDate = new Date().toISOString()
    
    await updateDoc(docRef, {
      [`exploredCells.${cellId}`]: {
        status: 'inaccessible',
        exploredDate,
        notes: notes || ''
      },
      lastUpdated: exploredDate
    })
    
    return true
  } catch (error) {
    console.error('Error marking cell as inaccessible:', error)
    return false
  }
}

// Update notes for a grid cell
export const updateCellNotes = async (
  userId: string, 
  cellId: number, 
  notes: string
): Promise<boolean> => {
  try {
    const docRef = doc(db, 'userGridProgress', userId)
    
    await updateDoc(docRef, {
      [`exploredCells.${cellId}.notes`]: notes,
      lastUpdated: new Date().toISOString()
    })
    
    return true
  } catch (error) {
    console.error('Error updating cell notes:', error)
    return false
  }
}

// Update explored date for a grid cell
export const updateCellExploredDate = async (
  userId: string, 
  cellId: number, 
  date: string
): Promise<boolean> => {
  try {
    const docRef = doc(db, 'userGridProgress', userId)
    
    await updateDoc(docRef, {
      [`exploredCells.${cellId}.exploredDate`]: date,
      lastUpdated: new Date().toISOString()
    })
    
    return true
  } catch (error) {
    console.error('Error updating cell explored date:', error)
    return false
  }
}

// Mark a grid cell as unexplored
export const markCellAsUnexplored = async (
  userId: string, 
  cellId: number
): Promise<boolean> => {
  try {
    const docRef = doc(db, 'userGridProgress', userId)
    
    await updateDoc(docRef, {
      [`exploredCells.${cellId}`]: null,
      lastUpdated: new Date().toISOString()
    })
    
    return true
  } catch (error) {
    console.error('Error marking cell as unexplored:', error)
    return false
  }
}

// Subscribe to user's grid progress changes
export const subscribeToUserProgress = (
  userId: string, 
  callback: (progress: UserGridProgress | null) => void
) => {
  const docRef = doc(db, 'userGridProgress', userId)
  
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data() as UserGridProgress)
    } else {
      callback(null)
    }
  })
}

// Get exploration statistics
export const getExplorationStats = (gridData: GridData, userProgress: UserGridProgress | null) => {
  const totalCells = gridData.cells.length
  const exploredCells = userProgress ? Object.keys(userProgress.exploredCells).filter(id => 
    userProgress.exploredCells[parseInt(id)]?.status === 'explored'
  ).length : 0
  const inaccessibleCells = userProgress ? Object.keys(userProgress.exploredCells).filter(id => 
    userProgress.exploredCells[parseInt(id)]?.status === 'inaccessible'
  ).length : 0
  const completedCells = exploredCells + inaccessibleCells
  const unexploredCells = totalCells - completedCells
  const progressPercentage = Math.round((completedCells / totalCells) * 100)
  
  // Count by region
  const regionStats = gridData.cells.reduce((acc, cell) => {
    const cellProgress = userProgress?.exploredCells[cell.id]
    const isExplored = cellProgress?.status === 'explored'
    const isInaccessible = cellProgress?.status === 'inaccessible'
    
    if (!acc[cell.regionName]) {
      acc[cell.regionName] = { total: 0, explored: 0, inaccessible: 0 }
    }
    acc[cell.regionName].total++
    if (isExplored) {
      acc[cell.regionName].explored++
    }
    if (isInaccessible) {
      acc[cell.regionName].inaccessible++
    }
    
    return acc
  }, {} as Record<string, { total: number; explored: number; inaccessible: number }>)
  
  return {
    totalCells,
    exploredCells,
    inaccessibleCells,
    completedCells,
    unexploredCells,
    progressPercentage,
    regionStats
  }
}

// Update custom grid name
export const updateCustomGridName = async (
  userId: string, 
  cellId: number, 
  customName: string
): Promise<boolean> => {
  try {
    const docRef = doc(db, 'userGridProgress', userId)
    
    await updateDoc(docRef, {
      [`customNames.${cellId}`]: customName,
      lastUpdated: new Date().toISOString()
    })
    
    return true
  } catch (error) {
    console.error('Error updating custom grid name:', error)
    return false
  }
}

// Remove custom grid name (revert to default)
export const removeCustomGridName = async (
  userId: string, 
  cellId: number
): Promise<boolean> => {
  try {
    const docRef = doc(db, 'userGridProgress', userId)
    
    await updateDoc(docRef, {
      [`customNames.${cellId}`]: null,
      lastUpdated: new Date().toISOString()
    })
    
    return true
  } catch (error) {
    console.error('Error removing custom grid name:', error)
    return false
  }
}

// Enhanced grid data with simple grid numbering
export const getEnhancedGridData = () => {
  const originalData = getGridData()
  
  if (!originalData || !originalData.cells) {
    return originalData
  }

  const enhancedCells = originalData.cells.map((cell: any) => {
    return {
      ...cell,
      regionName: "Singapore",
      displayName: `Grid ${cell.id}`
    }
  })

  return {
    ...originalData,
    cells: enhancedCells
  }
} 