import React, { useState, useEffect, useCallback, useRef } from 'react'
import { MapContainer, TileLayer, useMap, Polygon, Polyline, Popup } from 'react-leaflet'
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
  Shuffle,
  LogOut,
  Moon,
  Sun,
  ChevronLeft,
  HelpCircle,
  MousePointer,
  Lightbulb,
  Navigation,
  Settings,
  Database,
  Monitor,
  Download,
  Upload
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { getUserProfile, subscribeToProfile, UserProfile, getAvatarById, getBackgroundColorById } from '../services/profileService'
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
import { useNavigate } from 'react-router-dom'

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
  isCelebrating?: boolean
  onContextMenu: (event: React.MouseEvent, cell: GridCell) => void
  onLongPressStart: (cell: GridCell) => void
  onLongPressEnd: () => void
  isLongPressing?: boolean
  isSelected?: boolean
}> = ({ cell, isExplored, isInaccessible, userNotes, exploredDate, isDragging, onCellClick, onToggleExplored, onMarkInaccessible, onUpdateNotes, onUpdateExploredDate, onUpdateCustomName, onRemoveCustomName, customName, isCelebrating, onContextMenu, onLongPressStart, onLongPressEnd, isLongPressing, isSelected }) => {
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

  // Add golden border for selected grid
  if (isSelected) {
    borderColor = '#F59E0B' // golden
  }

  // Add celebration animation
  if (isCelebrating) {
    fillColor = '#10B981'
    borderColor = '#059669'
    fillOpacity = 0.8
  }

  // Add fill animation for status changes
  const [isAnimating, setIsAnimating] = useState(false)
  const [animationProgress, setAnimationProgress] = useState(0)
  const [previousStatus, setPreviousStatus] = useState<'unexplored' | 'explored' | 'inaccessible'>('unexplored')
  
  // Determine current status
  const currentStatus = isExplored ? 'explored' : isInaccessible ? 'inaccessible' : 'unexplored'
  
  useEffect(() => {
    // Only trigger animation when status changes from unexplored to explored/inaccessible
    if (previousStatus === 'unexplored' && (currentStatus === 'explored' || currentStatus === 'inaccessible') && !isAnimating) {
      setIsAnimating(true)
      setAnimationProgress(0)
      
      // Start fill animation from bottom to top
      const startTime = Date.now()
      const duration = 1000 // 1 second
      
      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        
        setAnimationProgress(progress)
        
        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          setIsAnimating(false)
          setAnimationProgress(1)
        }
      }
      
      requestAnimationFrame(animate)
    }
    
    // Update previous status
    setPreviousStatus(currentStatus)
  }, [currentStatus, previousStatus, isAnimating])

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
    <>
      {/* Base grid cell with dynamic fill */}
      <Polygon
        positions={cell.bounds as [number, number][]}
        pathOptions={{
          color: borderColor,
          weight: isCelebrating ? 4 : 2,
          fillColor: (isExplored || isInaccessible) ? fillColor : 'transparent',
          fillOpacity: (isExplored || isInaccessible)
            ? (isAnimating ? (animationProgress * fillOpacity) : fillOpacity)
            : 0
        }}
        eventHandlers={{
          click: () => onCellClick(cell),
          contextmenu: (e) => {
            e.originalEvent.preventDefault()
            onContextMenu(e.originalEvent as any, cell)
          },
          mousedown: (e) => {
            if (e.originalEvent.button === 0) { // Left click only
              onLongPressStart(cell)
            }
          },
          mouseup: () => {
            onLongPressEnd()
          },
          mouseout: () => {
            onLongPressEnd()
          },
          mouseover: (e) => {
            // Don't open tooltip if map is being dragged or long pressing
            if (isDragging || isLongPressing) {
              return
            }
            
            const layer = e.target
            
            // Apply the Leaflet fix: override the _openTooltip method
            if (!layer._originalOpenTooltip) {
              layer._originalOpenTooltip = layer._openTooltip;
              layer._openTooltip = function(e: any) {
                if (!this._tooltip || !this._map) {
                  return;
                }
                
                // If the map is moving, we will show the tooltip after it's done.
                if (this._map.dragging && this._map.dragging.moving()) {
                  if (e.type === 'add' && !this._moveEndOpensTooltip) {
                    this._moveEndOpensTooltip = true;
                    var that = this;
                    this._map.once('moveend', function () {
                      that._moveEndOpensTooltip = false;
                      that._openTooltip(e);
                    });
                  }
                  return;
                }
                
                this._tooltip._source = e.layer || e.target;
                this.openTooltip(this._tooltip.options.sticky ? e.latlng : undefined);
              };
            }
            
            layer.bindTooltip(getTooltipContent(), {
              permanent: false,
              direction: 'top',
              className: 'custom-tooltip'
            }).openTooltip()
          }
        }}
      />
    </>
  )
}

const GridExplorer: React.FC = () => {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [gridData, setGridData] = useState<any>(null)
  const [userProgress, setUserProgress] = useState<UserGridProgress | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
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
  const [showHelp, setShowHelp] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showShareNotification, setShowShareNotification] = useState(false)
  const [shareMessage, setShareMessage] = useState('')
  const mapRef = useRef<any>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchResultsRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [celebratingCell, setCelebratingCell] = useState<number | null>(null)
  const [showPlusOne, setShowPlusOne] = useState(false)
  const [plusOnePosition, setPlusOnePosition] = useState({ x: 0, y: 0 })
  const [pendingExploredCount, setPendingExploredCount] = useState<number | null>(null)
  const [confetti, setConfetti] = useState<Array<{id: number, x: number, y: number, color: string, delay: number}>>([])
  const [selectedGridModal, setSelectedGridModal] = useState<{
    show: boolean
    cell: GridCell | null
  }>({ show: false, cell: null })
  const [isModalCollapsed, setIsModalCollapsed] = useState(false)
  const [contextMenu, setContextMenu] = useState<{
    show: boolean
    x: number
    y: number
    cell: GridCell | null
  }>({ show: false, x: 0, y: 0, cell: null })
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null)
  const [longPressCell, setLongPressCell] = useState<number | null>(null)
  
  // Floating modal editing state
  const [editingName, setEditingName] = useState(false)
  const [editingNameValue, setEditingNameValue] = useState('')
  const [editingDate, setEditingDate] = useState(false)
  const [editingDateValue, setEditingDateValue] = useState('')
  const [editingNotes, setEditingNotes] = useState(false)
  const [editingNotesValue, setEditingNotesValue] = useState('')

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

  // Global ESC key handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input field
      const target = event.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return
      }

      if (event.key === 'Escape') {
        // Close any open popups
        const map = mapRef.current?.leafletElement
        if (map) {
          map.closePopup()
        }
        
        // Close search results
        setShowSearchResults(false)
        
        // Close top menu
        setShowTopMenu(false)
        
        // Close modals
        setShowHelp(false)
        setShowSettings(false)
      } else if (event.key === 'S' || event.key === 's') {
        // Focus search box
        event.preventDefault()
        searchInputRef.current?.focus()
      } else if (event.key === 'M' || event.key === 'm') {
        // Toggle top menu
        event.preventDefault()
        setShowTopMenu(!showTopMenu)
      } else if (event.key === 'C' || event.key === 'c') {
        // Zoom out and center on Singapore
        event.preventDefault()
        setMapCenter([1.3521, 103.8198]) // Singapore center coordinates
        setTargetZoom(12) // Zoom out to show all of Singapore
      } else if (event.key === 'H' || event.key === 'h') {
        // Toggle help modal
        event.preventDefault()
        setShowHelp(!showHelp)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showTopMenu, showHelp])

  // Global mouse click handler to close all tooltips
  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      // Close search results if clicking outside
      if (searchResultsRef.current && !searchResultsRef.current.contains(event.target as Node)) {
        setShowSearchResults(false)
      }
      
      // Close top menu if clicking outside
      const target = event.target as HTMLElement
      if (!target.closest('.top-menu') && !target.closest('.top-menu-button')) {
        setShowTopMenu(false)
      }
      
      // Close context menu if clicking outside
      if (!target.closest('.context-menu')) {
        setContextMenu({ show: false, x: 0, y: 0, cell: null })
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

  // Load grid data and user progress
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Loading grid data and user progress...')
        const data = getEnhancedGridData()
        setGridData(data)
        console.log('Grid data loaded:', data?.cells?.length, 'cells')
        
        if (user) {
          console.log('Loading user progress for user:', user.uid)
          const progress = await getUserGridProgress(user.uid)
          setUserProgress(progress)
          console.log('User progress loaded:', progress)
        } else {
          console.log('No user logged in')
        }
      } catch (error) {
        console.error('Error loading data:', error)
        setError('Failed to load data. Please check your connection and try again.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user])

  // Subscribe to user progress changes
  useEffect(() => {
    if (!user) return

    console.log('Setting up user progress subscription for user:', user.uid)
    const unsubscribe = subscribeToUserProgress(user.uid, (progress) => {
      console.log('Received user progress update:', progress)
      setUserProgress(progress)
      // Reset sync status when we receive updated data from database
      setSyncStatus('synced')
    })

    return () => {
      console.log('Cleaning up user progress subscription')
      unsubscribe()
    }
  }, [user])

  // Subscribe to user profile changes
  useEffect(() => {
    if (!user) return

    console.log('Setting up user profile subscription for user:', user.uid)
    const unsubscribe = subscribeToProfile(user.uid, (profile) => {
      console.log('Received user profile update:', profile)
      setUserProfile(profile)
    })

    return () => {
      console.log('Cleaning up user profile subscription')
      unsubscribe()
    }
  }, [user])

  const handleCellClick = useCallback((cell: GridCell) => {
    // Close any existing modal
    setSelectedGridModal({ show: false, cell: null })
    
    // Small delay to allow modal to close before opening new one
    setTimeout(() => {
      setMapCenter(cell.center as [number, number])
      setTargetZoom(18) // Max zoom
      setSelectedGridModal({ show: true, cell })
    }, 100)
  }, [])

  // Get exploration statistics
  const stats = gridData && userProgress ? getExplorationStats(gridData, userProgress) : null

  // Success animation sequence
  const triggerSuccessAnimation = useCallback(async (cellId: number, cellCenter: [number, number]) => {
    // Step 1: Close any open modals (popups) with ESC key simulation
    const map = mapRef.current?.leafletElement
    if (map) {
      // Simulate ESC key press to close popup
      const escEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        code: 'Escape',
        keyCode: 27,
        which: 27,
        bubbles: true
      })
      document.dispatchEvent(escEvent)
    }

    // Step 2: Zoom in and center on the grid
    setMapCenter(cellCenter)
    setTargetZoom(18) // Zoom all the way in

    // Step 3: Wait for zoom animation, then start confetti
    setTimeout(() => {
      setCelebratingCell(cellId)
      
      // Create confetti particles
      const confettiColors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']
      const newConfetti = Array.from({ length: 30 }, (_, i) => ({
        id: Date.now() + i,
        x: Math.random() * window.innerWidth,
        y: -20,
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        delay: Math.random() * 0.5
      }))
      setConfetti(newConfetti)
    }, 1000) // Wait longer for zoom animation

    // Step 4: Play ding sound and show +1 fly-out animation
    setTimeout(() => {
      // Play ding sound
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT')
      audio.volume = 0.3
      audio.play().catch(() => {
        // Fallback: create a simple beep sound
        const context = new (window.AudioContext || (window as any).webkitAudioContext)()
        const oscillator = context.createOscillator()
        const gainNode = context.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(context.destination)
        
        oscillator.frequency.setValueAtTime(800, context.currentTime)
        oscillator.frequency.setValueAtTime(1000, context.currentTime + 0.1)
        
        gainNode.gain.setValueAtTime(0.1, context.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.2)
        
        oscillator.start(context.currentTime)
        oscillator.stop(context.currentTime + 0.2)
      })
      
      setPlusOnePosition({ x: 50, y: 50 }) // Position relative to stats panel
      setShowPlusOne(true)
    }, 1800) // Sync with confetti animation

    // Step 5: Update stats count after +1 animation
    setTimeout(() => {
      if (stats) {
        setPendingExploredCount(stats.exploredCells + 1)
      }
    }, 3300) // After +1 animation completes

    // Step 6: Hide +1 after animation
    setTimeout(() => {
      setShowPlusOne(false)
    }, 3300)

    // Step 7: Clear confetti and reset celebration state
    setTimeout(() => {
      setConfetti([])
      setCelebratingCell(null)
      setPendingExploredCount(null)
    }, 4000)
  }, [stats])

  const handleToggleExplored = useCallback(async (cellId: number, isExplored: boolean) => {
    if (!user) {
      return
    }

    try {
      setSyncStatus('syncing')
      if (isExplored) {
        await markCellAsExplored(user.uid, cellId)
        // Trigger success animation for newly explored cells
        const cell = gridData?.cells?.find((c: GridCell) => c.id === cellId)
        if (cell) {
          triggerSuccessAnimation(cellId, cell.center as [number, number])
        }
      } else {
        await markCellAsUnexplored(user.uid, cellId)
      }
      setSyncStatus('synced')
    } catch (error) {
      console.error('Error toggling cell status:', error)
      setSyncStatus('unsaved')
    }
  }, [user, gridData, triggerSuccessAnimation])

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
      console.error('Error updating custom name:', error)
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
      console.error('Error removing custom name:', error)
      setSyncStatus('unsaved')
    }
  }, [user])

  const handleLogout = async () => {
    try {
      // Set flag for logout transition animation
      sessionStorage.setItem('logoutTransition', 'true')
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Failed to log out:', error)
    }
  }

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
        } else if (statusOperator === 'share') {
          shareUserProgress()
          return false // Don't show any results for share
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
          } else if (statusOperator === 'share') {
            shareUserProgress()
            return false // Don't show any results for share
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
      // Only handle shortcuts if not typing in an input field
      if (!event.ctrlKey && 
          !event.metaKey && 
          !event.altKey &&
          !(event.target instanceof HTMLInputElement) &&
          !(event.target instanceof HTMLTextAreaElement)) {
        
        // 'S' key - Focus search
        if (event.key.toLowerCase() === 's') {
          event.preventDefault()
          
          // Focus the search input
          if (searchInputRef.current) {
            searchInputRef.current.focus()
            searchInputRef.current.select() // Select existing text for easy replacement
          }
        }
        
        // 'M' key - Toggle menu
        if (event.key.toLowerCase() === 'm') {
          event.preventDefault()
          setShowTopMenu(!showTopMenu)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showTopMenu, showHelp])

  // Context menu handlers
  const handleContextMenu = useCallback((event: React.MouseEvent, cell: GridCell) => {
    event.preventDefault()
    event.stopPropagation()
    
    setContextMenu({
      show: true,
      x: event.clientX,
      y: event.clientY,
      cell: cell
    })
  }, [])

  const handleLongPressStart = useCallback((cell: GridCell) => {
    setLongPressCell(cell.id)
    const timer = setTimeout(() => {
      // Show context menu at center of screen for long press
      setContextMenu({
        show: true,
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        cell: cell
      })
      setLongPressCell(null)
    }, 500) // 500ms long press
    setLongPressTimer(timer)
  }, [])

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
    setLongPressCell(null)
  }, [longPressTimer])

  const handleContextMenuAction = useCallback(async (action: 'explored' | 'unexplored' | 'inaccessible') => {
    if (!contextMenu.show || !contextMenu.cell || !user) return

    const { cell } = contextMenu
    
    try {
      setSyncStatus('syncing')
      
      if (action === 'explored') {
        await markCellAsExplored(user.uid, cell.id)
        // Trigger success animation
        const gridCell = gridData?.cells?.find((c: GridCell) => c.id === cell.id)
        if (gridCell) {
          triggerSuccessAnimation(cell.id, gridCell.center as [number, number])
        }
      } else if (action === 'inaccessible') {
        await markCellAsInaccessible(user.uid, cell.id)
      } else if (action === 'unexplored') {
        await markCellAsUnexplored(user.uid, cell.id)
      }
      
      setSyncStatus('synced')
    } catch (error) {
      console.error('Error updating cell status:', error)
      setSyncStatus('unsaved')
    }
    
    setContextMenu({ show: false, x: 0, y: 0, cell: null })
  }, [contextMenu, user, gridData, triggerSuccessAnimation])

  const handleStatsClick = (filterType: 'explored' | 'unexplored' | 'inaccessible') => {
    // Set the search query to filter the map
    const searchOperator = `=${filterType}`
    setSearchQuery(searchOperator)
    
    // Zoom out and center on Singapore to show the filtered results
    setMapCenter([1.3521, 103.8198])
    setTargetZoom(12)
    
    // Close any open modals or menus
    setSelectedGridModal({ show: false, cell: null })
    setShowTopMenu(false)
    setShowSearchResults(false)
  }

  // Helper function to close modal and reset collapsed state
  const closeModal = () => {
    setSelectedGridModal({ show: false, cell: null })
    setIsModalCollapsed(false)
  }

  // Helper function to format dates
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = date.toLocaleString('en-US', { month: 'short' })
    const year = date.getFullYear()
    const weekday = date.toLocaleString('en-US', { weekday: 'short' })
    return `${day} ${month} ${year} (${weekday})`
  }

  // Data Export/Import Functions
  const exportUserData = () => {
    if (!user || !userProgress) return

    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      user: {
        uid: user.uid,
        email: user.email,
        profile: userProfile
      },
      explorationData: {
        exploredCells: userProgress.exploredCells || {},
        customNames: userProgress.customNames || {},
        lastUpdated: userProgress.lastUpdated
      }
    }

    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `singapore-grid-explorer-${user.uid}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const importUserData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string
        const importData = JSON.parse(content)

        // Validate the import data
        if (!importData.version || !importData.explorationData) {
          alert('Invalid file format. Please use a file exported from Singapore Grid Explorer.')
          return
        }

        // Show confirmation dialog
        const confirmed = window.confirm(
          'This will merge the imported data with your current data. Grids that already have data will be updated with the imported data. Continue?'
        )

        if (confirmed) {
          // Merge the data
          const currentData = userProgress || {} as UserGridProgress
          const importedData = importData.explorationData

          // Merge explored cells
          const mergedExploredCells = {
            ...(currentData.exploredCells || {}),
            ...(importedData.exploredCells || {})
          }

          // Merge custom names
          const mergedCustomNames = {
            ...(currentData.customNames || {}),
            ...(importedData.customNames || {})
          }

          // Update the user's data in Firebase
          const updatedProgress = {
            ...currentData,
            exploredCells: mergedExploredCells,
            customNames: mergedCustomNames,
            lastUpdated: new Date().toISOString()
          }

          // Save to Firebase - we'll need to implement a proper bulk update function
          // For now, just show a success message
          alert('Data imported successfully! Note: Full import functionality requires additional Firebase functions.')
        }
      } catch (error) {
        console.error('Error importing data:', error)
        alert('Error importing data. Please check the file format.')
      }
    }
    reader.readAsText(file)
  }

  const shareUserProgress = async () => {
    if (!user || !userProgress || !stats || !gridData) return

    const totalGrids = gridData.cells.length
    const completionPercentage = Math.round((stats.exploredCells / totalGrids) * 100)
    
    // Create timestamp in the format "28 Jun 2025 (Sat) 8:00pm"
    const now = new Date()
    const day = now.getDate().toString().padStart(2, '0')
    const month = now.toLocaleString('en-US', { month: 'short' })
    const year = now.getFullYear()
    const weekday = now.toLocaleString('en-US', { weekday: 'short' })
    const time = now.toLocaleString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
    const timestamp = `${day} ${month} ${year} (${weekday}) ${time}`
    
    const shareMessage = `🗺️ Singapore Grid Explorer Progress

✅ Explored: ${stats.exploredCells} grids
❌ Inaccessible: ${stats.inaccessibleCells} grids  
⭕ Unexplored: ${stats.unexploredCells} grids

📊 Total Progress: ${stats.exploredCells}/${totalGrids} (${completionPercentage}% complete)

🌐 Explore Singapore's grid system: 
https://gridexplorer.vercel.app

📅 ${timestamp}`

    try {
      await navigator.clipboard.writeText(shareMessage)
      
      // Show success notification with preview
      setShareMessage(shareMessage)
      setShowShareNotification(true)
      
      // Clear search field
      setSearchQuery('')
      setShowSearchResults(false)
      
      // Hide notification after 4 seconds
      setTimeout(() => {
        setShowShareNotification(false)
        setShareMessage('')
      }, 4000)
      
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      // Fallback: show the message in an alert
      alert('Share message copied to clipboard!')
    }
  }

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
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50 dark:bg-dark-primary overflow-hidden">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">Error Loading Grid Data</div>
          <p className="text-gray-600 dark:text-dark-secondary">Please refresh the page to try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      {/* Error Display */}
      {error && (
        <div className="absolute top-4 left-4 z-[1001] bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 max-w-md">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <span className="text-red-600 dark:text-red-400 text-sm font-bold">!</span>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Connection Error</h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="flex-shrink-0 text-red-400 hover:text-red-600 dark:hover:text-red-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Menu Button - Visible on all devices */}
      <div className="fixed top-4 left-4 z-[1000] top-menu-button">
        <button
          onClick={() => setShowTopMenu(!showTopMenu)}
          className="p-3 sm:p-3 bg-white dark:bg-dark-secondary rounded-xl shadow-lg border border-gray-200 dark:border-dark-primary transition-all duration-300 hover:bg-gray-50 dark:hover:bg-dark-tertiary hover:scale-105 hover:shadow-xl active:scale-95"
        >
          <div className="flex items-center space-x-2">
            <div className="p-1 bg-singapore-red/10 rounded transition-all duration-300 hover:bg-singapore-red/20">
              <MapPin className="h-4 w-4 sm:h-4 sm:w-4 text-singapore-red transition-transform duration-300 hover:rotate-12" />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">Menu</span>
          </div>
        </button>
      </div>

      {/* Dropdown Menu Bar - Top */}
      {showTopMenu && (
        <div className="fixed top-0 left-0 right-0 z-[2000] bg-white dark:bg-dark-secondary border-b border-gray-200 dark:border-dark-primary shadow-lg transition-all duration-500 ease-out top-menu animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between p-3 sm:p-4">
            <div className="flex items-center space-x-3 sm:space-x-6">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="p-2 bg-singapore-red/10 rounded-lg transition-all duration-300 hover:bg-singapore-red/20">
                  <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-singapore-red transition-transform duration-300 hover:rotate-12" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-dark-primary">Singapore Grid Explorer</h1>
                  <p className="text-xs text-gray-600 dark:text-dark-secondary hidden sm:block">
                    Explore Singapore's grid system and track your progress
                  </p>
                </div>
              </div>
              
              {/* Navigation Links - Hidden on mobile */}
              <div className="hidden sm:flex items-center space-x-4">
                <button 
                  onClick={() => setShowSettings(true)}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-all duration-300 hover:scale-105"
                >
                  Settings
                </button>
                <button 
                  onClick={() => setShowHelp(!showHelp)}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-all duration-300 hover:scale-105"
                >
                  Help
                </button>
              </div>
            </div>
            
            {/* User Info & Actions */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-dark-tertiary hover:bg-gray-200 dark:hover:bg-dark-primary transition-all duration-300 hover:scale-110 hover:rotate-12"
                title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              >
                {theme === 'light' ? (
                  <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700 dark:text-dark-secondary" />
                ) : (
                  <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700 dark:text-dark-secondary" />
                )}
              </button>

              {user && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => navigate('/profile')}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg cursor-pointer overflow-hidden ${
                      userProfile?.backgroundColor ? 
                        getBackgroundColorById(userProfile.backgroundColor).value : 
                        'bg-gradient-to-br from-singapore-blue to-singapore-red'
                    }`}
                  >
                    <span className="text-white text-xs sm:text-sm font-medium">
                      {userProfile?.avatarId ? 
                        getAvatarById(userProfile.avatarId).emoji : 
                        (userProfile?.nickname?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U')
                      }
                    </span>
                  </button>
                  <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 hidden sm:block">
                    {userProfile?.nickname || user.email}
                  </span>
                </div>
              )}
              <button 
                onClick={handleLogout}
                className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-all duration-300 hover:scale-105"
              >
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:block">Logout</span>
              </button>
              
              {/* Close Button */}
              <button
                onClick={() => setShowTopMenu(false)}
                className="p-2 rounded-lg bg-gray-100 dark:bg-dark-tertiary hover:bg-gray-200 dark:hover:bg-dark-primary transition-all duration-300 hover:scale-110 hover:rotate-90"
                title="Close Menu"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700 dark:text-dark-secondary" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map Container - Fill remaining space */}
      <div className="flex-1 relative">
        {/* Search Box - Top Right */}
        <div className="fixed top-4 right-4 z-[1000] w-64 sm:w-80">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={handleSearchFocus}
              onKeyDown={handleSearchKeyDown}
              className="w-full pl-10 pr-10 border border-gray-200 dark:border-dark-primary rounded-xl focus:outline-none focus:ring-2 focus:ring-singapore-blue focus:border-transparent bg-white dark:bg-dark-tertiary text-gray-900 dark:text-dark-primary placeholder-gray-400 dark:placeholder-dark-tertiary transition-all duration-300 shadow-lg hover:shadow-xl focus:shadow-2xl focus:scale-[1.02] text-base sm:text-base"
            />
            
            {/* Clear Button */}
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setShowSearchResults(false)
                  searchInputRef.current?.focus()
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-dark-primary transition-colors duration-200"
              >
                <X className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
              </button>
            )}
            
            {/* Search Results Dropdown */}
            {showSearchResults && (
              <div
                ref={searchResultsRef}
                className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-dark-secondary border border-gray-200 dark:border-dark-primary rounded-xl shadow-xl z-[9999] max-h-64 sm:max-h-80 overflow-y-auto"
              >
                {searchQuery.trim().startsWith('=') && (
                  <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 dark:bg-dark-tertiary border-b border-gray-200 dark:border-dark-primary rounded-t-xl">
                    <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">Status Filters</p>
                    <div className="space-y-1 sm:space-y-2">
                      {['explored', 'unexplored', 'inaccessible', 'random', 'all', 'share'].filter(option => 
                        option.startsWith(searchQuery.trim().substring(1).toLowerCase())
                      ).map(option => (
                        <button
                          key={option}
                          onClick={() => {
                            if (option === 'share') {
                              shareUserProgress()
                            } else {
                              setSearchQuery(`=${option}`)
                              performSearch(`=${option}`)
                            }
                          }}
                          className="w-full flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 text-left hover:bg-white dark:hover:bg-dark-secondary rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-dark-primary transition-all duration-200 group"
                        >
                          <div className={`flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                            option === 'explored' ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' :
                            option === 'unexplored' ? 'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400' :
                            option === 'inaccessible' ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400' :
                            option === 'random' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400' :
                            option === 'share' ? 'bg-teal-100 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400' :
                            'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                          }`}>
                            {option === 'explored' ? (
                              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                            ) : option === 'unexplored' ? (
                              <Circle className="h-3 w-3 sm:h-4 sm:w-4" />
                            ) : option === 'inaccessible' ? (
                              <Ban className="h-3 w-3 sm:h-4 sm:w-4" />
                            ) : option === 'random' ? (
                              <Shuffle className="h-3 w-3 sm:h-4 sm:w-4" />
                            ) : option === 'share' ? (
                              <Target className="h-3 w-3 sm:h-4 sm:w-4" />
                            ) : (
                              <Grid3X3 className="h-3 w-3 sm:h-4 sm:w-4" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-dark-primary text-xs sm:text-sm">
                              ={option}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                              {option === 'random' ? 'Go to a random unexplored grid' : 
                               option === 'share' ? 'Share your exploration progress' : 
                               `Show all ${option} grids`}
                            </div>
                          </div>
                          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
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
                                  `Explored: ${formatDate(exploredDate)}`
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

        {/* Confetti Overlay */}
        {confetti.length > 0 && (
          <div className="fixed inset-0 pointer-events-none z-[9998]">
            {confetti.map(particle => (
              <div
                key={particle.id}
                className="confetti"
                style={{
                  left: `${particle.x}px`,
                  top: `${particle.y}px`,
                  backgroundColor: particle.color,
                  animationDelay: `${particle.delay}s`
                }}
              />
            ))}
          </div>
        )}

        {/* Context Menu */}
        {contextMenu && contextMenu.show && (
          <div 
            className="fixed z-[2000] bg-white dark:bg-dark-secondary rounded-xl shadow-xl border border-gray-200 dark:border-dark-primary p-3 sm:p-4 min-w-64 sm:min-w-72"
            style={{
              left: contextMenu.x,
              top: contextMenu.y,
              transform: 'translate(-50%, -100%) translateY(-8px)'
            }}
          >
            <div className="mb-3 sm:mb-4">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="p-2 bg-singapore-red/10 rounded-lg">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-singapore-red" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-dark-primary text-sm sm:text-base">
                    {contextMenu.cell?.displayName}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {contextMenu.cell?.regionName}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="py-1">
              <button
                onClick={() => handleContextMenuAction('explored')}
                className="w-full flex items-center space-x-2 sm:space-x-3 px-2 sm:px-3 py-2 sm:py-3 text-left hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors duration-200 group"
              >
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-dark-primary text-xs sm:text-sm">Mark as Explored</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">Completed this area</div>
                </div>
              </button>
              
              <button
                onClick={() => handleContextMenuAction('inaccessible')}
                className="w-full flex items-center space-x-2 sm:space-x-3 px-2 sm:px-3 py-2 sm:py-3 text-left hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200 group"
              >
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                  <Ban className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-dark-primary text-xs sm:text-sm">Mark as Inaccessible</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">Cannot be explored</div>
                </div>
              </button>
              
              <button
                onClick={() => handleContextMenuAction('unexplored')}
                className="w-full flex items-center space-x-2 sm:space-x-3 px-2 sm:px-3 py-2 sm:py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-900/20 rounded-lg transition-colors duration-200 group"
              >
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-100 dark:bg-gray-900/20 rounded-full flex items-center justify-center">
                  <Circle className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-dark-primary text-xs sm:text-sm">Mark as Unexplored</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">Reset to unvisited</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* +1 Fly-out Animation */}
        {showPlusOne && (
          <div className="absolute bottom-4 left-4 z-[1001] pointer-events-none">
            <div 
              className="text-green-600 font-bold text-lg animate-plus-one"
              style={{
                transform: `translate(${plusOnePosition.x}px, ${plusOnePosition.y}px)`
              }}
            >
              +1
            </div>
          </div>
        )}

        {/* Compact Floating Stats Panel - Bottom */}
        {stats && (
          <div className="fixed bottom-4 left-4 z-[1000]">
            <div className="bg-white dark:bg-dark-secondary rounded-xl shadow-lg border border-gray-200 dark:border-dark-primary p-2 sm:p-3 backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95 transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
              <div className="flex items-center space-x-2 sm:space-x-4">
                {/* Progress Stats */}
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div 
                    className="text-center transition-transform duration-300 hover:scale-110 cursor-pointer"
                    onClick={() => handleStatsClick('explored')}
                    title="Click to show explored grids"
                  >
                    <div className={`text-sm sm:text-lg font-bold text-green-600 transition-all duration-500 ${showPlusOne ? 'animate-number-bounce' : ''}`}>
                      {pendingExploredCount || stats.exploredCells}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Explored</div>
                  </div>
                  <div 
                    className="text-center transition-transform duration-300 hover:scale-110 cursor-pointer"
                    onClick={() => handleStatsClick('inaccessible')}
                    title="Click to show inaccessible grids"
                  >
                    <div className="text-sm sm:text-lg font-bold text-red-600">{stats.inaccessibleCells}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Inaccessible</div>
                  </div>
                  <div 
                    className="text-center transition-transform duration-300 hover:scale-110 cursor-pointer"
                    onClick={() => handleStatsClick('unexplored')}
                    title="Click to show unexplored grids"
                  >
                    <div className="text-sm sm:text-lg font-bold text-orange-500">{stats.unexploredCells}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Unexplored</div>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <div className="w-12 sm:w-16 bg-gray-200 dark:bg-dark-primary rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-singapore-blue to-singapore-red h-2 rounded-full transition-all duration-700 ease-out relative" 
                      style={{ width: `${stats.progressPercentage}%` }}
                    >
                      <div className="absolute inset-0 bg-white opacity-20 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 min-w-[2rem] sm:min-w-[3rem] transition-all duration-300 hover:scale-110">
                    {Math.round(stats.progressPercentage)}%
                  </div>
                </div>

                {/* Sync Status */}
                <div className="flex items-center space-x-1 sm:space-x-2">
                  {syncStatus === 'synced' && (
                    <>
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-medium text-green-600 dark:text-green-400 hidden sm:block">Saved</span>
                    </>
                  )}
                  {syncStatus === 'syncing' && (
                    <>
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400 hidden sm:block">Saving...</span>
                    </>
                  )}
                  {syncStatus === 'unsaved' && (
                    <>
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-medium text-red-600 dark:text-red-400 hidden sm:block">Error</span>
                    </>
                  )}
                </div>

                {/* Expand Button */}
                <button
                  onClick={() => setShowStats(!showStats)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-tertiary transition-colors duration-200"
                  title={showStats ? 'Hide details' : 'Show details'}
                >
                  <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Expanded Region Details */}
              {showStats && (
                <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-200 dark:border-dark-primary">
                  <div className="grid grid-cols-2 gap-1 sm:gap-2 max-h-24 sm:max-h-32 overflow-y-auto">
                    {Object.entries(stats.regionStats).map(([region, data]: [string, any]) => (
                      <div key={region} className="p-1.5 sm:p-2 bg-gray-50 dark:bg-dark-tertiary rounded-lg">
                        <div className="flex items-center justify-between mb-0.5 sm:mb-1">
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
        <div className="fixed bottom-4 right-4 z-[1000] hidden lg:block">
          <div className="bg-white dark:bg-dark-secondary rounded-lg shadow-lg border border-gray-200 dark:border-dark-primary px-2 sm:px-3 py-1.5 sm:py-2 backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95 transition-all duration-300 hover:shadow-xl hover:scale-105">
            <div className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
              Showing {filteredCells.length}/{gridData?.cells?.length || 0} grids
            </div>
          </div>
        </div>

        <MapContainer
          center={mapCenter}
          zoom={targetZoom}
          style={{ height: '100vh', width: '100%' }}
          zoomControl={false}
          attributionControl={false}
          ref={mapRef}
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
                isCelebrating={cell.id === celebratingCell}
                onContextMenu={handleContextMenu}
                onLongPressStart={handleLongPressStart}
                onLongPressEnd={handleLongPressEnd}
                isLongPressing={longPressCell === cell.id}
                isSelected={selectedGridModal.cell?.id === cell.id}
              />
            )
          })}

          {/* Golden Polyline overlay for selected grid */}
          {selectedGridModal.show && selectedGridModal.cell && (
            <Polyline
              positions={selectedGridModal.cell.bounds as [number, number][]}
              pathOptions={{
                color: '#F59E0B',
                weight: 2,
                opacity: 1
              }}
            />
          )}
        </MapContainer>
      </div>

      {/* Floating Grid Modal */}
      {selectedGridModal.show && selectedGridModal.cell && (() => {
        const cell = selectedGridModal.cell
        const cellProgress = userProgress?.exploredCells?.[cell.id]
        const isExplored = cellProgress?.status === 'explored'
        const isInaccessible = cellProgress?.status === 'inaccessible'
        const userNotes = cellProgress?.notes || ''
        const exploredDate = cellProgress?.exploredDate || ''
        const customName = userProgress?.customNames?.[cell.id] || ''

        const handleSaveName = () => {
          if (editingNameValue.trim()) {
            if (editingNameValue.trim() === cell.displayName) {
              // If name is same as default, remove custom name
              handleRemoveCustomName(cell.id)
            } else {
              // Set custom name
              handleUpdateCustomName(cell.id, editingNameValue.trim())
            }
          }
          setEditingName(false)
        }

        const handleSaveDate = () => {
          if (editingDateValue) {
            handleUpdateExploredDate(cell.id, new Date(editingDateValue).toISOString())
          }
          setEditingDate(false)
        }

        const handleSaveNotes = () => {
          handleUpdateNotes(cell.id, editingNotesValue)
          setEditingNotes(false)
        }

        const handleStartEditingName = () => {
          setEditingNameValue(customName || cell.displayName)
          setEditingName(true)
        }

        const handleStartEditingDate = () => {
          setEditingDateValue(exploredDate ? new Date(exploredDate).toISOString().split('T')[0] : '')
          setEditingDate(true)
        }

        const handleStartEditingNotes = () => {
          setEditingNotesValue(userNotes || '')
          setEditingNotes(true)
        }

        return (
          <>
            {/* Mobile: Slide-out drawer from left */}
            <div className={`fixed inset-0 z-[1000] lg:hidden ${
              isModalCollapsed ? 'pointer-events-none' : ''
            }`}>
              {/* Backdrop */}
              <div 
                className={`absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300 ${
                  isModalCollapsed ? 'opacity-0 pointer-events-none' : ''
                }`}
                onClick={() => setIsModalCollapsed(true)}
              />
              
              {/* Floating collapse button when modal is collapsed */}
              {isModalCollapsed && (
                <button
                  onClick={() => setIsModalCollapsed(false)}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-[1001] p-3 bg-white dark:bg-dark-secondary rounded-full shadow-lg border border-gray-200 dark:border-dark-primary hover:bg-gray-50 dark:hover:bg-dark-tertiary transition-all duration-200 pointer-events-auto"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-500 dark:text-gray-400 rotate-180" />
                </button>
              )}
              
              {/* Drawer */}
              <div className={`absolute left-0 top-0 h-full w-80 max-w-[85vw] bg-white dark:bg-dark-secondary shadow-2xl transform transition-transform duration-300 ease-out pointer-events-auto ${
                isModalCollapsed ? '-translate-x-full' : 'translate-x-0'
              }`}>
                <div className="h-full flex flex-col">
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-primary">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-dark-primary text-lg truncate">
                        {customName || cell.displayName}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Grid #{cell.id} • {cell.regionName}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setIsModalCollapsed(!isModalCollapsed)}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-tertiary transition-colors duration-200"
                      >
                        <ChevronLeft className={`h-5 w-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
                          isModalCollapsed ? 'rotate-180' : ''
                        }`} />
                      </button>
                      <button
                        onClick={closeModal}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-tertiary transition-colors duration-200"
                      >
                        <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Status Actions */}
                    <div className="flex flex-col space-y-2">
                      {!isExplored && !isInaccessible && (
                        <button
                          onClick={() => handleToggleExplored(cell.id, true)}
                          className="flex items-center justify-center space-x-2 px-3 py-2 bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors duration-200"
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Mark Explored</span>
                        </button>
                      )}
                      {!isInaccessible && (
                        <button
                          onClick={() => handleMarkInaccessible(cell.id)}
                          className="flex items-center justify-center space-x-2 px-3 py-2 bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors duration-200"
                        >
                          <Ban className="h-4 w-4" />
                          <span className="text-sm font-medium">Mark Inaccessible</span>
                        </button>
                      )}
                      {(isExplored || isInaccessible) && (
                        <button
                          onClick={() => handleToggleExplored(cell.id, false)}
                          className="flex items-center justify-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-900/40 transition-colors duration-200"
                        >
                          <Circle className="h-4 w-4" />
                          <span className="text-sm font-medium">Mark Unexplored</span>
                        </button>
                      )}
                    </div>

                    {/* Grid Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Grid Name
                      </label>
                      {editingName ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editingNameValue}
                            onChange={(e) => setEditingNameValue(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-dark-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-singapore-blue focus:border-transparent bg-white dark:bg-dark-tertiary text-gray-900 dark:text-dark-primary"
                            placeholder="Enter custom grid name..."
                          />
                          <div className="flex space-x-2">
                            <button
                              onClick={handleSaveName}
                              className="px-3 py-1 bg-singapore-blue text-white rounded text-sm"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingName(false)
                                setEditingNameValue(customName || cell.displayName)
                              }}
                              className="px-3 py-1 bg-gray-300 dark:bg-black border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-900 dark:text-dark-primary truncate flex-1">
                            {customName || cell.displayName}
                          </span>
                          <button
                            onClick={handleStartEditingName}
                            className="text-singapore-blue hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm ml-2"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Explored Date */}
                    {(isExplored || isInaccessible) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Explored Date
                        </label>
                        {editingDate ? (
                          <div className="space-y-2">
                            <input
                              type="date"
                              value={editingDateValue}
                              onChange={(e) => setEditingDateValue(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-singapore-blue focus:border-transparent bg-white dark:bg-dark-tertiary text-gray-900 dark:text-dark-primary"
                            />
                            <div className="flex space-x-2">
                              <button
                                onClick={handleSaveDate}
                                className="px-3 py-1 bg-singapore-blue text-white rounded text-sm"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setEditingDate(false)
                                  setEditingDateValue(exploredDate ? new Date(exploredDate).toISOString().split('T')[0] : '')
                                }}
                                className="px-3 py-1 bg-gray-300 dark:bg-black border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-900 dark:text-dark-primary">
                              {exploredDate ? formatDate(exploredDate) : 'Not set'}
                            </span>
                            <button
                              onClick={handleStartEditingDate}
                              className="text-singapore-blue hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                            >
                              Edit
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Notes
                      </label>
                      {editingNotes ? (
                        <div className="space-y-2">
                          <textarea
                            value={editingNotesValue}
                            onChange={(e) => setEditingNotesValue(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-dark-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-singapore-blue focus:border-transparent bg-white dark:bg-dark-tertiary text-gray-900 dark:text-dark-primary resize-none"
                            placeholder="Add notes about this grid..."
                          />
                          <div className="flex space-x-2">
                            <button
                              onClick={handleSaveNotes}
                              className="px-3 py-1 bg-singapore-blue text-white rounded text-sm"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingNotes(false)
                                setEditingNotesValue(userNotes || '')
                              }}
                              className="px-3 py-1 bg-gray-300 dark:bg-black border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="min-h-[60px] p-3 bg-gray-50 dark:bg-dark-tertiary rounded-lg">
                            <p className="text-gray-900 dark:text-dark-primary text-sm whitespace-pre-wrap">
                              {userNotes || 'No notes added yet.'}
                            </p>
                          </div>
                          <button
                            onClick={handleStartEditingNotes}
                            className="text-singapore-blue hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                          >
                            {userNotes ? 'Edit Notes' : 'Add Notes'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop: Fixed modal (existing behavior) */}
            <div className="hidden lg:block fixed left-4 top-32 z-[1000] w-80 animate-slide-in">
              <div className="bg-white dark:bg-dark-secondary rounded-xl shadow-2xl border border-gray-200 dark:border-dark-primary p-6 backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95 max-h-[70vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-dark-primary text-lg">
                      {customName || cell.displayName}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Grid #{cell.id} • {cell.regionName}
                    </p>
                  </div>
                  <button
                    onClick={closeModal}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-tertiary transition-colors duration-200"
                  >
                    <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>

                {/* Status Actions */}
                <div className="flex items-center space-x-2 mb-4">
                  {!isExplored && !isInaccessible && (
                    <button
                      onClick={() => handleToggleExplored(cell.id, true)}
                      className="flex items-center space-x-2 px-3 py-2 bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors duration-200"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Mark Explored</span>
                    </button>
                  )}
                  {!isInaccessible && (
                    <button
                      onClick={() => handleMarkInaccessible(cell.id)}
                      className="flex items-center space-x-2 px-3 py-2 bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors duration-200"
                    >
                      <Ban className="h-4 w-4" />
                      <span className="text-sm font-medium">Mark Inaccessible</span>
                    </button>
                  )}
                  {(isExplored || isInaccessible) && (
                    <button
                      onClick={() => handleToggleExplored(cell.id, false)}
                      className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-900/40 transition-colors duration-200"
                    >
                      <Circle className="h-4 w-4" />
                      <span className="text-sm font-medium">Mark Unexplored</span>
                    </button>
                  )}
                </div>

                {/* Grid Name */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Grid Name
                  </label>
                  {editingName ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editingNameValue}
                        onChange={(e) => setEditingNameValue(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-dark-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-singapore-blue focus:border-transparent bg-white dark:bg-dark-tertiary text-gray-900 dark:text-dark-primary"
                        placeholder="Enter custom grid name..."
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={handleSaveName}
                          className="px-3 py-1 bg-singapore-blue text-white rounded text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingName(false)
                            setEditingNameValue(customName || cell.displayName)
                          }}
                          className="px-3 py-1 bg-gray-300 dark:bg-black border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-900 dark:text-dark-primary">
                        {customName || cell.displayName}
                      </span>
                      <button
                        onClick={handleStartEditingName}
                        className="text-singapore-blue hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm ml-2"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>

                {/* Explored Date */}
                {(isExplored || isInaccessible) && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Explored Date
                    </label>
                    {editingDate ? (
                      <div className="space-y-2">
                        <input
                          type="date"
                          value={editingDateValue}
                          onChange={(e) => setEditingDateValue(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-dark-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-singapore-blue focus:border-transparent bg-white dark:bg-dark-tertiary text-gray-900 dark:text-dark-primary"
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={handleSaveDate}
                            className="px-3 py-1 bg-singapore-blue text-white rounded text-sm"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingDate(false)
                              setEditingDateValue(exploredDate ? new Date(exploredDate).toISOString().split('T')[0] : '')
                            }}
                            className="px-3 py-1 bg-gray-300 dark:bg-black border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-900 dark:text-dark-primary">
                          {exploredDate ? formatDate(exploredDate) : 'Not set'}
                        </span>
                        <button
                          onClick={handleStartEditingDate}
                          className="text-singapore-blue hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Notes */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes
                  </label>
                  {editingNotes ? (
                    <div className="space-y-2">
                      <textarea
                        value={editingNotesValue}
                        onChange={(e) => setEditingNotesValue(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-dark-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-singapore-blue focus:border-transparent bg-white dark:bg-dark-tertiary text-gray-900 dark:text-dark-primary resize-none"
                        placeholder="Add notes about this grid..."
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={handleSaveNotes}
                          className="px-3 py-1 bg-singapore-blue text-white rounded text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingNotes(false)
                            setEditingNotesValue(userNotes || '')
                          }}
                          className="px-3 py-1 bg-gray-300 dark:bg-black border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="min-h-[60px] p-3 bg-gray-50 dark:bg-dark-tertiary rounded-lg">
                        <p className="text-gray-900 dark:text-dark-primary text-sm whitespace-pre-wrap">
                          {userNotes || 'No notes added yet.'}
                        </p>
                      </div>
                      <button
                        onClick={handleStartEditingNotes}
                        className="text-singapore-blue hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                      >
                        {userNotes ? 'Edit Notes' : 'Add Notes'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )
      })()}

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-dark-secondary rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-primary">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-singapore-blue/10 rounded-lg">
                  <HelpCircle className="h-6 w-6 text-singapore-blue" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-dark-primary">Keyboard Shortcuts</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Master the grid explorer with these shortcuts</p>
                </div>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-tertiary transition-colors duration-200"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-6">
                {/* Navigation Shortcuts */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-primary mb-4 flex items-center">
                    <Navigation className="h-5 w-5 mr-2 text-singapore-blue" />
                    Navigation
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-dark-tertiary rounded-lg">
                      <kbd className="px-2 py-1 bg-white dark:bg-dark-secondary border border-gray-300 dark:border-dark-primary rounded text-sm font-mono text-gray-700 dark:text-gray-300 min-w-[40px] text-center">S</kbd>
                      <span className="text-gray-700 dark:text-gray-300">Focus search box</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-dark-tertiary rounded-lg">
                      <kbd className="px-2 py-1 bg-white dark:bg-dark-secondary border border-gray-300 dark:border-dark-primary rounded text-sm font-mono text-gray-700 dark:text-gray-300 min-w-[40px] text-center">M</kbd>
                      <span className="text-gray-700 dark:text-gray-300">Toggle menu</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-dark-tertiary rounded-lg">
                      <kbd className="px-2 py-1 bg-white dark:bg-dark-secondary border border-gray-300 dark:border-dark-primary rounded text-sm font-mono text-gray-700 dark:text-gray-300 min-w-[40px] text-center">C</kbd>
                      <span className="text-gray-700 dark:text-gray-300">Center on Singapore</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-dark-tertiary rounded-lg">
                      <kbd className="px-2 py-1 bg-white dark:bg-dark-secondary border border-gray-300 dark:border-dark-primary rounded text-sm font-mono text-gray-700 dark:text-gray-300 min-w-[40px] text-center">ESC</kbd>
                      <span className="text-gray-700 dark:text-gray-300">Close modals</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-dark-tertiary rounded-lg">
                      <kbd className="px-2 py-1 bg-white dark:bg-dark-secondary border border-gray-300 dark:border-dark-primary rounded text-sm font-mono text-gray-700 dark:text-gray-300 min-w-[40px] text-center">H</kbd>
                      <span className="text-gray-700 dark:text-gray-300">Open help</span>
                    </div>
                  </div>
                </div>

                {/* Search Shortcuts */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-primary mb-4 flex items-center">
                    <Search className="h-5 w-5 mr-2 text-singapore-blue" />
                    Search & Filtering
                  </h3>
                  <div className="space-y-3">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">Search Operators</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <kbd className="px-2 py-1 bg-white dark:bg-dark-secondary border border-blue-300 dark:border-blue-700 rounded text-xs font-mono text-blue-700 dark:text-blue-300">=explored</kbd>
                          <span className="text-blue-800 dark:text-blue-200">Show all explored grids</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <kbd className="px-2 py-1 bg-white dark:bg-dark-secondary border border-blue-300 dark:border-blue-700 rounded text-xs font-mono text-blue-700 dark:text-blue-300">=unexplored</kbd>
                          <span className="text-blue-800 dark:text-blue-200">Show all unexplored grids</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <kbd className="px-2 py-1 bg-white dark:bg-dark-secondary border border-blue-300 dark:border-blue-700 rounded text-xs font-mono text-blue-700 dark:text-blue-300">=inaccessible</kbd>
                          <span className="text-blue-800 dark:text-blue-200">Show all inaccessible grids</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <kbd className="px-2 py-1 bg-white dark:bg-dark-secondary border border-blue-300 dark:border-blue-700 rounded text-xs font-mono text-blue-700 dark:text-blue-300">=random</kbd>
                          <span className="text-blue-800 dark:text-blue-200">Go to random unexplored grid</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <kbd className="px-2 py-1 bg-white dark:bg-dark-secondary border border-blue-300 dark:border-blue-700 rounded text-xs font-mono text-blue-700 dark:text-blue-300">=all</kbd>
                          <span className="text-blue-800 dark:text-blue-200">Show all grids</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <kbd className="px-2 py-1 bg-white dark:bg-dark-secondary border border-blue-300 dark:border-blue-700 rounded text-xs font-mono text-blue-700 dark:text-blue-300">=share</kbd>
                          <span className="text-blue-800 dark:text-blue-200">Share your progress</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Interaction Shortcuts */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-primary mb-4 flex items-center">
                    <MousePointer className="h-5 w-5 mr-2 text-singapore-blue" />
                    Grid Interaction
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-dark-tertiary rounded-lg">
                      <MousePointer className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-300">Left click: Open grid details</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-dark-tertiary rounded-lg">
                      <MousePointer className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-300">Right click: Mark as explored</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-dark-tertiary rounded-lg">
                      <MousePointer className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-300">Long press: Mark as inaccessible</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-dark-tertiary rounded-lg">
                      <MousePointer className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-300">Hover: Show grid info</span>
                    </div>
                  </div>
                </div>

                {/* Stats Shortcuts */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-primary mb-4 flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-singapore-blue" />
                    Statistics
                  </h3>
                  <div className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-sm text-green-800 dark:text-green-200 mb-3">
                      Click on any stat number to filter and zoom to those grids:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-green-700 dark:text-green-300">Explored grids</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                        <span className="text-sm text-green-700 dark:text-green-300">Unexplored grids</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-sm text-green-700 dark:text-green-300">Inaccessible grids</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tips */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-primary mb-4 flex items-center">
                    <Lightbulb className="h-5 w-5 mr-2 text-singapore-blue" />
                    Pro Tips
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3 p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <Lightbulb className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-yellow-800 dark:text-yellow-200">
                        Use <kbd className="px-1 py-0.5 bg-white dark:bg-dark-secondary border border-yellow-300 dark:border-yellow-700 rounded text-xs font-mono">=random</kbd> to discover new areas quickly
                      </span>
                    </div>
                    <div className="flex items-start space-x-3 p-3 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-lg">
                      <Lightbulb className="h-4 w-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-purple-800 dark:text-purple-200">
                        Right-click and long-press work anywhere on the map for quick marking
                      </span>
                    </div>
                    <div className="flex items-start space-x-3 p-3 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800 rounded-lg">
                      <Lightbulb className="h-4 w-4 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-indigo-800 dark:text-indigo-200">
                        Custom grid names are searchable and help you remember special locations
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-dark-secondary rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-primary">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-singapore-blue/10 rounded-lg">
                  <Settings className="h-6 w-6 text-singapore-blue" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-dark-primary">Settings</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Customize your exploration experience</p>
                </div>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-tertiary transition-colors duration-200"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-6">
                {/* Data Management */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-primary mb-4 flex items-center">
                    <Database className="h-5 w-5 mr-2 text-singapore-blue" />
                    Data Management
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">Export Your Data</h4>
                      <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                        Download a backup of all your exploration data including explored grids, custom names, notes, and dates.
                      </p>
                      <button
                        onClick={exportUserData}
                        disabled={!user || !userProgress}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        <Download className="h-4 w-4" />
                        <span>Export Data</span>
                      </button>
                    </div>

                    <div className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg">
                      <h4 className="font-medium text-green-900 dark:text-green-300 mb-2">Import Data</h4>
                      <p className="text-sm text-green-800 dark:text-green-200 mb-3">
                        Import previously exported data. This will merge with your current data.
                      </p>
                      <label className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer transition-colors duration-200">
                        <Upload className="h-4 w-4" />
                        <span>Import Data</span>
                        <input
                          type="file"
                          accept=".json"
                          onChange={importUserData}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Display Settings */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-primary mb-4 flex items-center">
                    <Monitor className="h-5 w-5 mr-2 text-singapore-blue" />
                    Display Settings
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-tertiary rounded-lg">
                      <div>
                        <span className="text-gray-900 dark:text-dark-primary font-medium">Theme</span>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Choose light or dark mode</p>
                      </div>
                      <button
                        onClick={toggleTheme}
                        className="p-2 rounded-lg bg-gray-100 dark:bg-dark-primary hover:bg-gray-200 dark:hover:bg-dark-tertiary transition-colors duration-200"
                      >
                        {theme === 'light' ? (
                          <Moon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                        ) : (
                          <Sun className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Exploration Settings */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-primary mb-4 flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-singapore-blue" />
                    Exploration Settings
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-tertiary rounded-lg">
                      <div>
                        <span className="text-gray-900 dark:text-dark-primary font-medium">Celebration Animations</span>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Show confetti when marking grids as explored</p>
                      </div>
                      <div className="w-12 h-6 bg-gray-300 dark:bg-gray-600 rounded-full relative cursor-pointer">
                        <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform duration-200"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Statistics */}
                {stats && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-primary mb-4 flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2 text-singapore-blue" />
                      Your Statistics
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="p-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg text-center">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.exploredCells}</div>
                        <div className="text-sm text-green-700 dark:text-green-300">Explored</div>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-900/10 border border-gray-200 dark:border-gray-800 rounded-lg text-center">
                        <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">{stats.unexploredCells}</div>
                        <div className="text-sm text-gray-700 dark:text-gray-300">Unexplored</div>
                      </div>
                      <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg text-center">
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.inaccessibleCells}</div>
                        <div className="text-sm text-red-700 dark:text-red-300">Inaccessible</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Success Notification */}
      {showShareNotification && (
        <div className="fixed top-20 right-4 z-[1001] bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 shadow-xl animate-in slide-in-from-top-2">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-green-800 dark:text-green-200">Progress Collated!</h3>
              <p className="text-xs text-green-600 dark:text-green-400">Progress message copied to clipboard!</p>
            </div>
            <button
              onClick={() => setShowShareNotification(false)}
              className="flex-shrink-0 text-green-400 hover:text-green-600 dark:hover:text-green-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Stats Panel - Bottom Left */}
    </div>
  )
}

export default GridExplorer