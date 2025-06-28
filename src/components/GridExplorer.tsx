import React, { useState, useEffect, useCallback, useRef } from 'react'
import { MapContainer, TileLayer, useMap, Polygon, Popup } from 'react-leaflet'
import { 
  MapPin, 
  Info, 
  Layers, 
  Search, 
  Filter, 
  CheckCircle, 
  Edit3,
  Save,
  X,
  BarChart3,
  Target,
  Ban,
  MapPinIcon,
  Circle,
  Grid3X3,
  ArrowRight,
  ChevronDown,
  Shuffle
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { 
  getGridData, 
  getUserGridProgress, 
  markCellAsExplored, 
  markCellAsUnexplored,
  markCellAsInaccessible,
  updateCellNotes,
  updateCellExploredDate,
  subscribeToUserProgress,
  getExplorationStats,
  updateCustomGridName,
  removeCustomGridName,
  getEnhancedGridData
} from '../services/gridService'
import { GridCell, UserGridProgress } from '../types/grid'

// Custom hook to handle map center updates
const MapUpdater: React.FC<{ center: [number, number]; zoom?: number }> = ({ center, zoom }) => {
  const map = useMap()
  
  useEffect(() => {
    if (map && center) {
      // Use flyTo for smooth animation to the center with zoom
      const targetZoom = zoom || map.getZoom()
      map.flyTo(center, targetZoom, {
        duration: 1.5,
        easeLinearity: 0.25
      })
    }
  }, [center, zoom, map])
  
  return null
}

// Grid Cell Component
const GridCellComponent: React.FC<{
  cell: GridCell
  isExplored: boolean
  isInaccessible: boolean
  userNotes?: string
  exploredDate?: string
  isDragging: boolean
  onCellClick: (cell: GridCell) => void
  onToggleExplored: (cellId: number, isExplored: boolean) => void
  onMarkInaccessible: (cellId: number) => void
  onUpdateNotes: (cellId: number, notes: string) => void
  onUpdateExploredDate: (cellId: number, date: string) => void
  onUpdateCustomName: (cellId: number, customName: string) => void
  onRemoveCustomName: (cellId: number) => void
  customName?: string
}> = ({ cell, isExplored, isInaccessible, userNotes, exploredDate, isDragging, onCellClick, onToggleExplored, onMarkInaccessible, onUpdateNotes, onUpdateExploredDate, onUpdateCustomName, onRemoveCustomName, customName }) => {
  const [editingNotes, setEditingNotes] = useState(false)
  const [notes, setNotes] = useState(userNotes || '')
  const [editingDate, setEditingDate] = useState(false)
  const [date, setDate] = useState(exploredDate ? new Date(exploredDate).toISOString().split('T')[0] : '')
  const [editingName, setEditingName] = useState(false)
  const [name, setName] = useState(customName || cell.displayName)

  const handleSaveNotes = () => {
    onUpdateNotes(cell.id, notes)
    setEditingNotes(false)
  }

  const handleSaveDate = () => {
    if (date) {
      onUpdateExploredDate(cell.id, new Date(date).toISOString())
    }
    setEditingDate(false)
  }

  const handleSaveName = () => {
    if (name.trim()) {
      if (name.trim() === cell.displayName) {
        // If name is same as default, remove custom name
        onRemoveCustomName(cell.id)
      } else {
        // Set custom name
        onUpdateCustomName(cell.id, name.trim())
      }
    }
    setEditingName(false)
  }

  // Get the display name (custom or default)
  const displayName = customName || cell.displayName

  // Determine grid cell styling based on status
  let fillColor = 'transparent'
  let borderColor = '#6B7280' // gray border for unexplored
  let fillOpacity = 0

  if (isExplored) {
    fillColor = '#10B981' // green
    borderColor = '#059669'
    fillOpacity = 0.6
  } else if (isInaccessible) {
    fillColor = '#EF4444' // red
    borderColor = '#DC2626'
    fillOpacity = 0.6
  }

  // Create tooltip content
  const getTooltipContent = () => {
    let content = `
      <div class="p-2 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <h3 class="font-semibold text-gray-900 dark:text-white">${displayName}</h3>
        ${customName ? `<p class="text-xs text-gray-500 dark:text-gray-400">Grid #${cell.id}</p>` : ''}
        <p class="text-sm text-gray-600 dark:text-gray-300 mt-1">
          Status: ${isExplored ? 'Explored' : isInaccessible ? 'Inaccessible' : 'Unexplored'}
        </p>
    `

    // Add exploration date for explored/inaccessible grids
    if ((isExplored || isInaccessible) && exploredDate) {
      const date = new Date(exploredDate).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
      content += `<p class="text-xs text-gray-600 dark:text-gray-400 mt-1">Explored: ${date}</p>`
    }

    // Add notes snippet if available
    if (userNotes && userNotes.trim()) {
      const notesSnippet = userNotes.length > 50 ? userNotes.substring(0, 50) + '...' : userNotes
      content += `<p class="text-xs text-gray-600 dark:text-gray-400 mt-1">Notes: ${notesSnippet}</p>`
    }

    // Add landmarks if available
    if (cell.landmarks && cell.landmarks.length > 0) {
      content += `
        <div class="mt-2">
          <p class="text-xs font-medium text-gray-700 dark:text-gray-300">Landmarks:</p>
          ${cell.landmarks.map((landmark: any) => `
            <p class="text-xs text-gray-600 dark:text-gray-400">• ${landmark.name}</p>
          `).join('')}
        </div>
      `
    }

    content += '</div>'
    return content
  }

  return (
    <Polygon
      positions={cell.bounds as [number, number][]}
      pathOptions={{
        color: borderColor,
        weight: 2,
        fillColor,
        fillOpacity
      }}
      eventHandlers={{
        click: () => onCellClick(cell),
        mouseover: (e) => {
          // Don't open tooltip if map is being dragged
          if (isDragging) {
            return
          }
          
          const layer = e.target
          layer.bindTooltip(getTooltipContent(), {
            permanent: false,
            direction: 'top',
            className: 'custom-tooltip'
          }).openTooltip()
        },
        mouseout: (e) => {
          const layer = e.target
          // Close tooltip immediately when mouse leaves
          layer.closeTooltip()
        }
      }}
    >
      <Popup>
        <div className="p-3 min-w-[300px] bg-white dark:bg-black text-gray-900 dark:text-white">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{displayName}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Grid #{cell.id}</p>
            </div>
            <div className="flex space-x-2">
              {!isExplored && !isInaccessible && (
                <button
                  onClick={() => onToggleExplored(cell.id, true)}
                  className="p-1 rounded-full bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40"
                  title="Mark as Explored"
                >
                  <CheckCircle className="h-4 w-4" />
                </button>
              )}
              {!isInaccessible && (
                <button
                  onClick={() => onMarkInaccessible(cell.id)}
                  className="p-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
                  title="Mark as Inaccessible"
                >
                  <Ban className="h-4 w-4" />
                </button>
              )}
              {(isExplored || isInaccessible) && (
                <button
                  onClick={() => onToggleExplored(cell.id, false)}
                  className="p-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-black border border-gray-300 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-900"
                  title="Mark as Unexplored"
                >
                  <Circle className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          
          {/* Editable Grid Name */}
          <div className="mb-3">
            {editingName ? (
              <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-black text-gray-900 dark:text-white"
                  placeholder="Enter custom grid name..."
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleSaveName}
                    className="px-3 py-1 bg-singapore-blue text-white rounded text-sm"
                  >
                    <Save className="h-3 w-3 inline mr-1" />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingName(false)
                      setName(customName || cell.displayName)
                    }}
                    className="px-3 py-1 bg-gray-300 dark:bg-black border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded text-sm"
                  >
                    <X className="h-3 w-3 inline mr-1" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setEditingName(true)}
                  className="text-singapore-blue hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                >
                  <Edit3 className="h-3 w-3 inline mr-1" />
                  {customName ? 'Edit' : 'Rename'} Grid
                </button>
                {customName && (
                  <button
                    onClick={() => onRemoveCustomName(cell.id)}
                    className="ml-3 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 text-sm"
                  >
                    <X className="h-3 w-3 inline mr-1" />
                    Reset to Default
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Region: {cell.regionName}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Status: {isExplored ? 'Explored' : isInaccessible ? 'Inaccessible' : 'Unexplored'}
              </p>
              {(isExplored || isInaccessible) && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    Explored Date:
                  </p>
                  {editingDate ? (
                    <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-black text-gray-900 dark:text-white"
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={handleSaveDate}
                          className="px-3 py-1 bg-singapore-blue text-white rounded text-sm"
                        >
                          <Save className="h-3 w-3 inline mr-1" />
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingDate(false)
                            setDate(exploredDate ? new Date(exploredDate).toISOString().split('T')[0] : '')
                          }}
                          className="px-3 py-1 bg-gray-300 dark:bg-black border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded text-sm"
                        >
                          <X className="h-3 w-3 inline mr-1" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div onClick={(e) => e.stopPropagation()}>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                        {exploredDate ? (() => {
                          const date = new Date(exploredDate)
                          const day = date.getDate().toString().padStart(2, '0')
                          const month = date.toLocaleDateString('en-GB', { month: 'short' })
                          const year = date.getFullYear()
                          const weekday = date.toLocaleDateString('en-GB', { weekday: 'short' })
                          return `${day} ${month} ${year} (${weekday})`
                        })() : 'No date set'}
                      </p>
                      <button
                        onClick={() => setEditingDate(true)}
                        className="text-singapore-blue hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                      >
                        <Edit3 className="h-3 w-3 inline mr-1" />
                        {exploredDate ? 'Edit' : 'Set'} Date
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {cell.landmarks && cell.landmarks.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Landmarks:</h4>
                {cell.landmarks.map((landmark, index) => (
                  <div key={index} className="mb-2 p-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-700 rounded">
                    <p className="font-medium text-sm text-gray-900 dark:text-white">{landmark.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{landmark.description}</p>
                  </div>
                ))}
              </div>
            )}

            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Notes:</h4>
              {editingNotes ? (
                <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-black text-gray-900 dark:text-white"
                    rows={3}
                    placeholder="Add your notes about this area..."
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSaveNotes}
                      className="px-3 py-1 bg-singapore-blue text-white rounded text-sm"
                    >
                      <Save className="h-3 w-3 inline mr-1" />
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingNotes(false)
                        setNotes(userNotes || '')
                      }}
                      className="px-3 py-1 bg-gray-300 dark:bg-black border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded text-sm"
                    >
                      <X className="h-3 w-3 inline mr-1" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div onClick={(e) => e.stopPropagation()}>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    {userNotes || 'No notes yet'}
                  </p>
                  <button
                    onClick={() => setEditingNotes(true)}
                    className="text-singapore-blue hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                  >
                    <Edit3 className="h-3 w-3 inline mr-1" />
                    {userNotes ? 'Edit' : 'Add'} Notes
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Popup>
    </Polygon>
  )
}

const GridExplorer: React.FC = () => {
  const { user } = useAuth()
  const [gridData, setGridData] = useState<any>(null)
  const [userProgress, setUserProgress] = useState<UserGridProgress | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<GridCell[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [selectedResultIndex, setSelectedResultIndex] = useState(-1)
  const [mapCenter, setMapCenter] = useState<[number, number]>([1.3521, 103.8198])
  const [targetZoom, setTargetZoom] = useState<number>(11)
  const [showStats, setShowStats] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'unsaved'>('synced')
  const [showTopMenu, setShowTopMenu] = useState(false)
  const mapRef = useRef<any>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchResultsRef = useRef<HTMLDivElement>(null)

  // Track map dragging state
  useEffect(() => {
    const map = mapRef.current?.leafletElement
    if (!map) return

    const onDragStart = () => setIsDragging(true)
    const onDragEnd = () => setIsDragging(false)
    const onZoomStart = () => setIsDragging(true)
    const onMoveStart = () => setIsDragging(true)
    const onMoveEnd = () => setIsDragging(false)

    map.on('dragstart', onDragStart)
    map.on('dragend', onDragEnd)
    map.on('zoomstart', onZoomStart)
    map.on('movestart', onMoveStart)
    map.on('moveend', onMoveEnd)

    return () => {
      map.off('dragstart', onDragStart)
      map.off('dragend', onDragEnd)
      map.off('zoomstart', onZoomStart)
      map.off('movestart', onMoveStart)
      map.off('moveend', onMoveEnd)
    }
  }, [])

  // Global mouse click handler to close all tooltips
  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      // Close search results if clicking outside
      if (searchResultsRef.current && !searchResultsRef.current.contains(event.target as Node)) {
        setShowSearchResults(false)
      }
      
      // Close all tooltips by clicking on the map
      const map = mapRef.current?.leafletElement
      if (map) {
        // Trigger a click on the map to close any open tooltips
        map.fire('click')
      }
    }

    // Add global click listener
    document.addEventListener('click', handleGlobalClick)

    return () => {
      document.removeEventListener('click', handleGlobalClick)
    }
  }, [])

  // Mouse move handler for top menu
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const y = event.clientY
      const threshold = 50 // Show menu when mouse is within 50px of top
      
      if (y <= threshold) {
        setShowTopMenu(true)
      } else {
        setShowTopMenu(false)
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  // Auto-close tooltips every 0.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const map = mapRef.current?.leafletElement
      if (map) {
        // Close any open tooltips
        map.fire('click')
      }
    }, 500) // 0.5 seconds

    return () => {
      clearInterval(interval)
    }
  }, [])

  // Load grid data and user progress
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = getEnhancedGridData()
        setGridData(data)
        
        if (user) {
          const progress = await getUserGridProgress(user.uid)
          setUserProgress(progress)
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user])

  // Subscribe to user progress changes
  useEffect(() => {
    if (!user) return

    const unsubscribe = subscribeToUserProgress(user.uid, (progress) => {
      setUserProgress(progress)
      // Reset sync status when we receive updated data from database
      setSyncStatus('synced')
    })

    return () => unsubscribe()
  }, [user])

  const handleCellClick = useCallback((cell: GridCell) => {
    setMapCenter(cell.center as [number, number])
    setTargetZoom(15) // Zoom in to make grid clearly visible
  }, [])

  const handleToggleExplored = useCallback(async (cellId: number, isExplored: boolean) => {
    if (!user) {
      return
    }

    try {
      setSyncStatus('syncing')
      if (isExplored) {
        await markCellAsExplored(user.uid, cellId)
      } else {
        await markCellAsUnexplored(user.uid, cellId)
      }
      setSyncStatus('synced')
    } catch (error) {
      console.error('Error toggling cell status:', error)
      setSyncStatus('unsaved')
    }
  }, [user])

  const handleMarkInaccessible = useCallback(async (cellId: number) => {
    if (!user) {
      return
    }

    try {
      setSyncStatus('syncing')
      await markCellAsInaccessible(user.uid, cellId)
      setSyncStatus('synced')
    } catch (error) {
      console.error('Error marking cell as inaccessible:', error)
      setSyncStatus('unsaved')
    }
  }, [user])

  const handleUpdateNotes = useCallback(async (cellId: number, notes: string) => {
    if (!user) return

    try {
      setSyncStatus('syncing')
      await updateCellNotes(user.uid, cellId, notes)
      setSyncStatus('synced')
    } catch (error) {
      console.error('Error updating notes:', error)
      setSyncStatus('unsaved')
    }
  }, [user])

  const handleUpdateExploredDate = useCallback(async (cellId: number, date: string) => {
    if (!user) return

    try {
      setSyncStatus('syncing')
      await updateCellExploredDate(user.uid, cellId, date)
      setSyncStatus('synced')
    } catch (error) {
      console.error('Error updating explored date:', error)
      setSyncStatus('unsaved')
    }
  }, [user])

  const handleUpdateCustomName = useCallback(async (cellId: number, customName: string) => {
    if (!user) return

    try {
      setSyncStatus('syncing')
      await updateCustomGridName(user.uid, cellId, customName)
      setSyncStatus('synced')
    } catch (error) {
      console.error('Error updating custom grid name:', error)
      setSyncStatus('unsaved')
    }
  }, [user])

  const handleRemoveCustomName = useCallback(async (cellId: number) => {
    if (!user) return

    try {
      setSyncStatus('syncing')
      await removeCustomGridName(user.uid, cellId)
      setSyncStatus('synced')
    } catch (error) {
      console.error('Error removing custom grid name:', error)
      setSyncStatus('unsaved')
    }
  }, [user])

  // Filter cells based on search and filters
  const filteredCells = gridData?.cells?.filter((cell: GridCell) => {
    try {
      const trimmedQuery = searchQuery.trim().toLowerCase()
      
      // Handle status filters via search operators
      if (trimmedQuery.startsWith('=')) {
        const statusOperator = trimmedQuery.substring(1)
        const cellStatus = userProgress?.exploredCells?.[cell.id]?.status || 'unexplored'
        
        if (statusOperator === 'explored') {
          return cellStatus === 'explored'
        } else if (statusOperator === 'unexplored') {
          return !userProgress?.exploredCells?.[cell.id]
        } else if (statusOperator === 'inaccessible') {
          return cellStatus === 'inaccessible'
        } else if (statusOperator === 'all') {
          return true // Show all grids
        }
        return false // Unknown status operator
      }

      // Range search (e.g., "23-42")
      if (trimmedQuery.includes('-') && !trimmedQuery.includes(' ')) {
        const rangeMatch = trimmedQuery.match(/^(\d+)-(\d+)$/)
        if (rangeMatch) {
          const start = parseInt(rangeMatch[1])
          const end = parseInt(rangeMatch[2])
          if (start <= end && cell.id >= start && cell.id <= end) {
            return true
          }
          return false
        }
      }

      // Regular text search filtering
      const matchesSearch = !trimmedQuery || 
                           (cell.displayName && cell.displayName.toLowerCase().includes(trimmedQuery)) ||
                           (userProgress?.customNames?.[cell.id] && userProgress.customNames[cell.id].toLowerCase().includes(trimmedQuery)) ||
                           (cell.regionName && cell.regionName.toLowerCase().includes(trimmedQuery)) ||
                           cell.id.toString().includes(trimmedQuery) ||
                           (userProgress?.exploredCells?.[cell.id]?.notes && 
                            userProgress.exploredCells[cell.id].notes!.toLowerCase().includes(trimmedQuery)) ||
                           (cell.landmarks && Array.isArray(cell.landmarks) && cell.landmarks.some(landmark => 
                             landmark && landmark.name && landmark.name.toLowerCase().includes(trimmedQuery) ||
                             landmark && landmark.description && landmark.description.toLowerCase().includes(trimmedQuery)
                           )) ||
                           // Always include original grid number in search
                           `grid ${cell.id}`.toLowerCase().includes(trimmedQuery)

      return matchesSearch
    } catch (error) {
      console.error('Error filtering cell:', error)
      return false
    }
  }) || []

  // Get exploration statistics
  const stats = gridData && userProgress ? getExplorationStats(gridData, userProgress) : null

  // Perform search and update results
  const performSearch = (query: string) => {
    if (!gridData?.cells) return

    // Handle special commands
    if (query.trim() === '=random') {
      // Get all unexplored grids
      const unexploredGrids = gridData.cells.filter((cell: GridCell) => {
        const cellStatus = userProgress?.exploredCells?.[cell.id]?.status
        return !cellStatus || cellStatus !== 'explored' && cellStatus !== 'inaccessible'
      })
      
      if (unexploredGrids.length > 0) {
        // Select a random unexplored grid
        const randomIndex = Math.floor(Math.random() * unexploredGrids.length)
        const randomGrid = unexploredGrids[randomIndex]
        
        // Filter to show only this random grid
        setSearchResults([randomGrid])
        setShowSearchResults(true)
        
        // Navigate to the random grid
        setMapCenter(randomGrid.center as [number, number])
        setTargetZoom(15)
        
        // Show a brief notification
        console.log(`Random grid selected: Grid ${randomGrid.id}`)
        return
      } else {
        // No unexplored grids available
        setSearchResults([])
        return
      }
    }

    // Regular search logic
    const results = gridData.cells.filter((cell: GridCell) => {
      try {
        const trimmedQuery = query.trim().toLowerCase()
        
        // Handle status filters via search operators
        if (trimmedQuery.startsWith('=')) {
          const statusOperator = trimmedQuery.substring(1)
          const cellStatus = userProgress?.exploredCells?.[cell.id]?.status || 'unexplored'
          
          if (statusOperator === 'explored') {
            return cellStatus === 'explored'
          } else if (statusOperator === 'unexplored') {
            return !userProgress?.exploredCells?.[cell.id]
          } else if (statusOperator === 'inaccessible') {
            return cellStatus === 'inaccessible'
          } else if (statusOperator === 'all') {
            return true
          }
          return false
        }
        
        // Text search
        const searchableText = [
          cell.id.toString(),
          cell.displayName,
          userProgress?.customNames?.[cell.id] || '',
          userProgress?.exploredCells?.[cell.id]?.notes || '',
          cell.regionName,
          ...(cell.landmarks?.map(l => l.name + ' ' + l.description) || [])
        ].join(' ').toLowerCase()
        
        // Range search (e.g., "23-42")
        if (trimmedQuery.includes('-') && !trimmedQuery.includes(' ')) {
          const rangeMatch = trimmedQuery.match(/^(\d+)-(\d+)$/)
          if (rangeMatch) {
            const start = parseInt(rangeMatch[1])
            const end = parseInt(rangeMatch[2])
            if (start <= end && cell.id >= start && cell.id <= end) {
              return true
            }
            return false
          }
        }
        
        return searchableText.includes(trimmedQuery)
      } catch (error) {
        console.error('Error in search filter:', error)
        return false
      }
    })
    
    setSearchResults(results)
  }

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    setSelectedResultIndex(-1) // Reset selection when search changes
    
    if (query.trim()) {
      performSearch(query)
      setShowSearchResults(true)
    } else {
      setSearchResults([])
      setShowSearchResults(false)
    }
  }

  // Handle search input focus - close tooltips
  const handleSearchFocus = () => {
    // Close all tooltips by clicking on the map
    const map = mapRef.current?.leafletElement
    if (map) {
      map.fire('click')
    }
    
    if (searchQuery.trim() && searchResults.length > 0) {
      setShowSearchResults(true)
    }
  }

  // Handle search result selection
  const handleSearchResultSelect = (cell: GridCell) => {
    // Center the map on the selected grid with higher zoom
    setMapCenter(cell.center as [number, number])
    setTargetZoom(15) // Zoom in to make grid clearly visible
    
    // Set the search query to the display name (custom or default)
    const displayName = userProgress?.customNames?.[cell.id] || cell.displayName
    setSearchQuery(displayName)
    setShowSearchResults(false)
    
    // Close any open tooltips after a short delay to ensure map has centered
    setTimeout(() => {
      const map = mapRef.current?.leafletElement
      if (map) {
        map.fire('click')
      }
    }, 100)
    
    // Focus back to search input
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }

  // Handle keyboard navigation for search results
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && showSearchResults && searchResults.length > 0) {
      e.preventDefault()
      if (selectedResultIndex >= 0 && selectedResultIndex < searchResults.length) {
        handleSearchResultSelect(searchResults[selectedResultIndex])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (showSearchResults && searchResults.length > 0) {
        setSelectedResultIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : 0
        )
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (showSearchResults && searchResults.length > 0) {
        setSelectedResultIndex(prev => 
          prev > 0 ? prev - 1 : searchResults.length - 1
        )
      }
    } else if (e.key === 'Escape') {
      setShowSearchResults(false)
      setSelectedResultIndex(-1)
    }
  }

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle 'S' key if not typing in an input field
      if (event.key.toLowerCase() === 's' && 
          !event.ctrlKey && 
          !event.metaKey && 
          !event.altKey &&
          !(event.target instanceof HTMLInputElement) &&
          !(event.target instanceof HTMLTextAreaElement)) {
        
        event.preventDefault()
        
        // Focus the search input
        if (searchInputRef.current) {
          searchInputRef.current.focus()
          searchInputRef.current.select() // Select existing text for easy replacement
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-primary">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-singapore-red"></div>
      </div>
    )
  }

  // Error boundary for the main component
  if (!gridData || !gridData.cells) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-primary">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">Error Loading Grid Data</div>
          <p className="text-gray-600 dark:text-dark-secondary">Please refresh the page to try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Dropdown Menu Bar - Top */}
      {showTopMenu && (
        <div className="fixed top-0 left-0 right-0 z-[2000] bg-white dark:bg-dark-secondary border-b border-gray-200 dark:border-dark-primary shadow-lg transition-all duration-300 ease-in-out">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-6">
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-dark-primary">Singapore Grid Explorer</h1>
                <p className="text-xs text-gray-600 dark:text-dark-secondary">
                  Explore Singapore's grid system and track your progress
                </p>
              </div>
              
              {/* Navigation Links */}
              <div className="flex items-center space-x-4">
                <button className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors duration-200">
                  Dashboard
                </button>
                <button className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors duration-200">
                  Settings
                </button>
                <button className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors duration-200">
                  Help
                </button>
              </div>
            </div>
            
            {/* User Info & Actions */}
            <div className="flex items-center space-x-4">
              {user && (
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-singapore-blue rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user.email?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {user.email}
                  </span>
                </div>
              )}
              <button className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors duration-200">
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header - Fixed at top */}
      <div className="flex-shrink-0 bg-white dark:bg-dark-secondary border-b border-gray-200 dark:border-dark-primary p-4 z-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-primary">Singapore Grid Explorer</h1>
            <p className="text-gray-600 dark:text-dark-secondary mt-1 text-sm">
              Explore Singapore's grid system and track your progress
            </p>
          </div>
        </div>

        {/* Filters - Compact */}
        <div className="flex items-center gap-3 mt-3">
        </div>
      </div>

      {/* Map Container - Fill remaining space */}
      <div className="flex-1 relative">
        {/* Search Box - Top Right */}
        <div className="absolute top-4 right-4 z-[1000] w-80">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Press 'S' to search • Search grids, names, notes, landmarks, dates, or status (=explored, =unexplored, =inaccessible)..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={handleSearchFocus}
              onKeyDown={handleSearchKeyDown}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-dark-primary rounded-xl focus:outline-none focus:ring-2 focus:ring-singapore-blue focus:border-transparent bg-white dark:bg-dark-tertiary text-gray-900 dark:text-dark-primary placeholder-gray-400 dark:placeholder-dark-tertiary transition-all duration-200 shadow-lg"
            />
            
            {/* Search Results Dropdown */}
            {showSearchResults && (
              <div
                ref={searchResultsRef}
                className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-dark-secondary border border-gray-200 dark:border-dark-primary rounded-xl shadow-xl z-[9999] max-h-80 overflow-y-auto"
              >
                {searchQuery.trim().startsWith('=') && (
                  <div className="px-4 py-3 bg-gray-50 dark:bg-dark-tertiary border-b border-gray-200 dark:border-dark-primary rounded-t-xl">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Status Filters</p>
                    <div className="space-y-2">
                      {['explored', 'unexplored', 'inaccessible', 'random', 'all'].filter(option => 
                        option.startsWith(searchQuery.trim().substring(1).toLowerCase())
                      ).map(option => (
                        <button
                          key={option}
                          onClick={() => {
                            setSearchQuery(`=${option}`)
                            performSearch(`=${option}`)
                          }}
                          className="w-full flex items-center space-x-3 p-3 text-left hover:bg-white dark:hover:bg-dark-secondary rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-dark-primary transition-all duration-200 group"
                        >
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                            option === 'explored' ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' :
                            option === 'unexplored' ? 'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400' :
                            option === 'inaccessible' ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400' :
                            option === 'random' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400' :
                            'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                          }`}>
                            {option === 'explored' ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : option === 'unexplored' ? (
                              <Circle className="h-4 w-4" />
                            ) : option === 'inaccessible' ? (
                              <Ban className="h-4 w-4" />
                            ) : option === 'random' ? (
                              <Shuffle className="h-4 w-4" />
                            ) : (
                              <Grid3X3 className="h-4 w-4" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-dark-primary">
                              ={option}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {option === 'random' ? 'Go to a random unexplored grid' : `Show all ${option} grids`}
                            </div>
                          </div>
                          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <ArrowRight className="h-4 w-4 text-gray-400" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {searchResults.length > 0 ? (
                  <>
                    <div className="px-4 py-3 bg-gray-50 dark:bg-dark-tertiary border-b border-gray-200 dark:border-dark-primary rounded-t-xl">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                      </p>
                    </div>
                    {searchResults.map((cell, index) => {
                      try {
                        const isExplored = userProgress?.exploredCells?.[cell.id]?.status === 'explored'
                        const isInaccessible = userProgress?.exploredCells?.[cell.id]?.status === 'inaccessible'
                        const exploredDate = userProgress?.exploredCells?.[cell.id]?.exploredDate
                        const customName = userProgress?.customNames?.[cell.id]
                        const isSelected = index === selectedResultIndex
                        
                        return (
                          <button
                            key={cell.id}
                            onClick={() => handleSearchResultSelect(cell)}
                            className={`w-full flex items-center space-x-3 p-3 text-left border-b border-gray-100 dark:border-dark-primary last:border-b-0 transition-colors duration-200 group ${
                              isSelected 
                                ? 'bg-singapore-blue/10 dark:bg-singapore-blue/20 border-singapore-blue/20' 
                                : 'hover:bg-gray-50 dark:hover:bg-dark-tertiary'
                            }`}
                          >
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                              isExplored ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' :
                              isInaccessible ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400' :
                              'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400'
                            }`}>
                              {isExplored ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : isInaccessible ? (
                                <Ban className="h-4 w-4" />
                              ) : (
                                <Circle className="h-4 w-4" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 dark:text-dark-primary truncate">
                                {customName || `Grid ${cell.id}`}
                                {customName && (
                                  <span className="ml-2 text-xs bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400 px-2 py-1 rounded">
                                    #{cell.id}
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                {isExplored && exploredDate ? (
                                  `Explored: ${(() => {
                                    const date = new Date(exploredDate)
                                    const day = date.getDate().toString().padStart(2, '0')
                                    const month = date.toLocaleDateString('en-GB', { month: 'short' })
                                    const year = date.getFullYear()
                                    const weekday = date.toLocaleDateString('en-GB', { weekday: 'short' })
                                    return `${day} ${month} ${year} (${weekday})`
                                  })()}`
                                ) : (
                                  `Grid ${cell.id} • ${cell.regionName}`
                                )}
                              </div>
                            </div>
                            <div className={`flex-shrink-0 transition-opacity duration-200 ${
                              isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                            }`}>
                              <ArrowRight className="h-4 w-4 text-gray-400" />
                            </div>
                          </button>
                        )
                      } catch (error) {
                        console.error('Error rendering search result:', error)
                        return null
                      }
                    })}
                  </>
                ) : (
                  <div className="px-4 py-8 text-center">
                    <div className="text-gray-400 dark:text-gray-500 text-sm">No results found</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Compact Floating Stats Panel - Bottom */}
        {stats && (
          <div className="absolute bottom-4 left-4 z-[1000]">
            <div className="bg-white dark:bg-dark-secondary rounded-xl shadow-lg border border-gray-200 dark:border-dark-primary p-3 backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95">
              <div className="flex items-center space-x-4">
                {/* Progress Stats */}
                <div className="flex items-center space-x-3">
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{stats.exploredCells}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Explored</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-600">{stats.inaccessibleCells}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Inaccessible</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-orange-500">{stats.unexploredCells}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Unexplored</div>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 dark:bg-dark-primary rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-singapore-blue to-singapore-red h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${stats.progressPercentage}%` }}
                    ></div>
                  </div>
                  <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 min-w-[3rem]">
                    {Math.round(stats.progressPercentage)}%
                  </div>
                </div>

                {/* Sync Status */}
                <div className="flex items-center space-x-2">
                  {syncStatus === 'synced' && (
                    <>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-medium text-green-600 dark:text-green-400">Saved</span>
                    </>
                  )}
                  {syncStatus === 'syncing' && (
                    <>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Saving...</span>
                    </>
                  )}
                  {syncStatus === 'unsaved' && (
                    <>
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-medium text-red-600 dark:text-red-400">Error</span>
                    </>
                  )}
                </div>

                {/* Expand Button */}
                <button
                  onClick={() => setShowStats(!showStats)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-tertiary transition-colors duration-200"
                  title={showStats ? 'Hide details' : 'Show details'}
                >
                  <BarChart3 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Expanded Region Details */}
              {showStats && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-dark-primary">
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                    {Object.entries(stats.regionStats).map(([region, data]: [string, any]) => (
                      <div key={region} className="p-2 bg-gray-50 dark:bg-dark-tertiary rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-gray-900 dark:text-dark-primary text-xs">{region}</h4>
                          <span className="text-xs font-semibold text-singapore-blue">
                            {Math.round((data.explored / data.total) * 100)}%
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {data.explored}/{data.total}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Grid Count Display - Bottom Right */}
        <div className="absolute bottom-4 right-4 z-[1000]">
          <div className="bg-white dark:bg-dark-secondary rounded-lg shadow-lg border border-gray-200 dark:border-dark-primary px-3 py-2 backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Showing {filteredCells.length}/{gridData?.cells?.length || 0} grids
            </div>
          </div>
        </div>

        <MapContainer
          ref={mapRef}
          center={mapCenter}
          zoom={targetZoom}
          style={{ height: '100%', width: '100%' }}
        >
          <MapUpdater center={mapCenter} zoom={targetZoom} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {filteredCells.map((cell: GridCell) => {
            const isExplored = userProgress?.exploredCells[cell.id]?.status === 'explored'
            const isInaccessible = userProgress?.exploredCells[cell.id]?.status === 'inaccessible'
            const userNotes = userProgress?.exploredCells[cell.id]?.notes
            const exploredDate = userProgress?.exploredCells[cell.id]?.exploredDate
            const customName = userProgress?.customNames?.[cell.id]
            
            return (
              <GridCellComponent
                key={cell.id}
                cell={cell}
                isExplored={isExplored}
                isInaccessible={isInaccessible}
                userNotes={userNotes}
                exploredDate={exploredDate}
                isDragging={isDragging}
                onCellClick={handleCellClick}
                onToggleExplored={handleToggleExplored}
                onMarkInaccessible={handleMarkInaccessible}
                onUpdateNotes={handleUpdateNotes}
                onUpdateExploredDate={handleUpdateExploredDate}
                onUpdateCustomName={handleUpdateCustomName}
                onRemoveCustomName={handleRemoveCustomName}
                customName={customName}
              />
            )
          })}
        </MapContainer>
      </div>
    </div>
  )
}

export default GridExplorer 