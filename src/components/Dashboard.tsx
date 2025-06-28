import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { MapPin, Compass, BarChart3, Clock, TrendingUp, Target, CheckCircle, XCircle, Ban } from 'lucide-react'
import { getGridData, getUserGridProgress, getExplorationStats } from '../services/gridService'
import { UserGridProgress } from '../types/grid'

const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const [gridData, setGridData] = useState<any>(null)
  const [userProgress, setUserProgress] = useState<UserGridProgress | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = getGridData()
        setGridData(data)
        
        if (user) {
          const progress = await getUserGridProgress(user.uid)
          setUserProgress(progress)
          
          if (data && progress) {
            const explorationStats = getExplorationStats(data, progress)
            setStats(explorationStats)
          }
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user])

  const recentExplorations = userProgress ? 
    Object.entries(userProgress.exploredCells)
      .sort(([,a], [,b]) => new Date(b.exploredDate).getTime() - new Date(a.exploredDate).getTime())
      .slice(0, 5)
      .map(([cellId, data]) => {
        const cell = gridData?.cells?.find((c: any) => c.id === parseInt(cellId))
        return {
          id: cellId,
          name: cell?.displayName || `Grid ${cellId}`,
          date: data.exploredDate,
          notes: data.notes
        }
      }) : []

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-singapore-red"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-singapore-blue to-singapore-red rounded-xl p-8 text-white mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user?.email?.split('@')[0]}!
        </h1>
        <p className="text-white/90 text-lg">
          Continue your Singapore exploration journey
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <Link
          to="/explorer"
          className="card hover:shadow-lg transition-all duration-200 cursor-pointer group border-2 border-transparent hover:border-singapore-blue/20"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-singapore-red/10 rounded-xl group-hover:bg-singapore-red/20 transition-colors">
              <Compass className="h-8 w-8 text-singapore-red" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-dark-primary">Grid Explorer</h3>
              <p className="text-gray-600 dark:text-dark-secondary mt-1">Explore Singapore's grid system</p>
            </div>
          </div>
        </Link>

        <div className="card border-2 border-transparent">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-singapore-blue/10 rounded-xl">
              <TrendingUp className="h-8 w-8 text-singapore-blue" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-dark-primary">Analytics</h3>
              <p className="text-gray-600 dark:text-dark-secondary mt-1">View exploration insights</p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-primary mb-8">Exploration Progress</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-dark-secondary">Total Grids</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-dark-primary">{stats.totalCells}</p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-dark-tertiary">
                  <MapPin className="h-6 w-6 text-gray-600 dark:text-dark-secondary" />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-dark-secondary">Explored</p>
                  <p className="text-3xl font-bold text-green-600">{stats.exploredCells}</p>
                </div>
                <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-dark-secondary">Unexplored</p>
                  <p className="text-3xl font-bold text-red-600">{stats.unexploredCells}</p>
                </div>
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-dark-secondary">Progress</p>
                  <p className="text-3xl font-bold text-singapore-blue">{stats.progressPercentage}%</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                  <BarChart3 className="h-6 w-6 text-singapore-blue" />
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="card mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-primary">Overall Progress</h3>
              <span className="text-sm text-gray-600 dark:text-dark-secondary">{stats.exploredCells} / {stats.totalCells} grids</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-dark-primary rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-singapore-blue to-singapore-red h-3 rounded-full transition-all duration-500"
                style={{ width: `${stats.progressPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Progress by Region */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-primary mb-6">Progress by Region</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(stats.regionStats).map(([region, data]: [string, any]) => (
                <div key={region} className="p-4 bg-gray-50 dark:bg-dark-tertiary rounded-xl">
                  <h4 className="font-medium text-gray-900 dark:text-dark-primary mb-2">{region}</h4>
                  <p className="text-sm text-gray-600 dark:text-dark-secondary mb-3">
                    {data.explored} explored, {data.inaccessible} inaccessible
                  </p>
                  <div className="w-full bg-gray-200 dark:bg-dark-primary rounded-full h-2">
                    <div 
                      className="bg-singapore-blue h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${(data.explored / data.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Explorations */}
      {recentExplorations.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-primary mb-6">Recent Explorations</h2>
          <div className="card">
            <div className="space-y-4">
              {recentExplorations.map((exploration) => (
                <div key={exploration.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-tertiary rounded-xl">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-dark-primary">{exploration.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-dark-secondary">
                        {new Date(exploration.date).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  {exploration.notes && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                      "{exploration.notes}"
                    </p>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-6 text-center">
              <Link to="/explorer" className="btn-primary">
                Continue Exploring
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard 