export interface GridCell {
  id: number
  bounds: number[][]
  center: number[]
  status: 'unexplored' | 'explored' | 'inaccessible'
  regionName: string
  displayName: string
  notes?: string
  exploredDate?: string
  landmarks?: Landmark[]
}

export interface Landmark {
  name: string
  description: string
}

export interface GridData {
  gridSize: number
  cells: GridCell[]
  metadata?: any
}

export interface UserGridProgress {
  userId: string
  exploredCells: {
    [cellId: number]: {
      status: 'explored' | 'inaccessible'
      exploredDate: string
      notes?: string
    }
  }
  customNames?: {
    [cellId: number]: string
  }
  lastUpdated: string
} 