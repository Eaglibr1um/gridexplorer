import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { MapPin, Compass, BarChart3, Clock, TrendingUp } from 'lucide-react'

const Dashboard: React.FC = () => {
  const { user } = useAuth()

  const stats = [
    {
      title: 'Total Grid Points',
      value: '1,234',
      icon: MapPin,
      color: 'text-singapore-red',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Explored Areas',
      value: '89',
      icon: Compass,
      color: 'text-singapore-blue',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Data Points',
      value: '5,678',
      icon: BarChart3,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Last Updated',
      value: '2 hours ago',
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ]

  const recentActivities = [
    { id: 1, action: 'Explored Marina Bay area', time: '2 hours ago', type: 'exploration' },
    { id: 2, action: 'Added new grid point at Orchard Road', time: '4 hours ago', type: 'addition' },
    { id: 3, action: 'Updated data for Chinatown district', time: '1 day ago', type: 'update' },
    { id: 4, action: 'Completed survey of Sentosa Island', time: '2 days ago', type: 'survey' }
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-singapore-blue to-singapore-red rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user?.email?.split('@')[0]}!
        </h1>
        <p className="text-white/80">
          Explore Singapore's grid system and discover new insights about our city.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="/explorer"
          className="card hover:shadow-lg transition-shadow cursor-pointer group"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-singapore-red/10 rounded-lg group-hover:bg-singapore-red/20 transition-colors">
              <Compass className="h-8 w-8 text-singapore-red" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Grid Explorer</h3>
              <p className="text-gray-600">Explore Singapore's grid system on an interactive map</p>
            </div>
          </div>
        </Link>

        <div className="card hover:shadow-lg transition-shadow cursor-pointer group">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-singapore-blue/10 rounded-lg group-hover:bg-singapore-blue/20 transition-colors">
              <TrendingUp className="h-8 w-8 text-singapore-blue" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Analytics</h3>
              <p className="text-gray-600">View detailed analytics and insights (Coming Soon)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activities */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activities</h2>
        <div className="card">
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'exploration' ? 'bg-singapore-blue' :
                    activity.type === 'addition' ? 'bg-green-500' :
                    activity.type === 'update' ? 'bg-yellow-500' : 'bg-purple-500'
                  }`} />
                  <span className="text-gray-900">{activity.action}</span>
                </div>
                <span className="text-sm text-gray-500">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard 