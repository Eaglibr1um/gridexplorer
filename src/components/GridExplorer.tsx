import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { Icon } from 'leaflet'
import { MapPin, Info, Layers, Search, Filter } from 'lucide-react'

// Custom hook to handle map center updates
const MapUpdater: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap()
  
  useEffect(() => {
    map.setView(center, map.getZoom())
  }, [center, map])
  
  return null
}

// Singapore grid data (simplified example)
const singaporeGridData = [
  {
    id: 1,
    name: 'Marina Bay',
    position: [1.2838, 103.8591] as [number, number],
    type: 'commercial',
    description: 'Financial district and tourist attraction'
  },
  {
    id: 2,
    name: 'Orchard Road',
    position: [1.3048, 103.8318] as [number, number],
    type: 'retail',
    description: 'Shopping and entertainment district'
  },
  {
    id: 3,
    name: 'Chinatown',
    position: [1.2838, 103.8436] as [number, number],
    type: 'cultural',
    description: 'Historic Chinese district'
  },
  {
    id: 4,
    name: 'Sentosa Island',
    position: [1.2494, 103.8303] as [number, number],
    type: 'leisure',
    description: 'Resort island and tourist destination'
  },
  {
    id: 5,
    name: 'Jurong East',
    position: [1.3333, 103.7422] as [number, number],
    type: 'industrial',
    description: 'Industrial and residential area'
  }
]

const GridExplorer: React.FC = () => {
  const [selectedType, setSelectedType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [mapCenter, setMapCenter] = useState<[number, number]>([1.3521, 103.8198]) // Singapore center

  // Custom marker icon
  const customIcon = new Icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyQzIgMTcuNTIgNi40OCAyMiAxMiAyMkMxNy41MiAyMiAyMiAxNy41MiAyMiAxMkMyMiA2LjQ4IDE3LjUyIDIgMTIgMloiIGZpbGw9IiNFRjMzNDAiLz4KPHBhdGggZD0iTTEyIDE2QzE0LjIwOTEgMTYgMTYgMTQuMjA5MSAxNiAxMkMxNiA5Ljc5MDg2IDE0LjIwOTEgOCAxMiA4QzkuNzkwODYgOCA4IDkuNzkwODYgOCAxMkM4IDE0LjIwOTEgOS43OTA4NiAxNiAxMiAxNloiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo=',
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24]
  })

  const filteredData = singaporeGridData.filter(item => {
    const matchesType = selectedType === 'all' || item.type === selectedType
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesType && matchesSearch
  })

  const handleMarkerClick = (position: [number, number]) => {
    setMapCenter(position)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Singapore Grid Explorer</h1>
          <p className="text-gray-600 mt-2">
            Explore Singapore's grid system and discover different areas of the city
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-singapore-blue focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-singapore-blue focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="commercial">Commercial</option>
              <option value="retail">Retail</option>
              <option value="cultural">Cultural</option>
              <option value="leisure">Leisure</option>
              <option value="industrial">Industrial</option>
            </select>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="card p-0 overflow-hidden">
        <div className="h-[600px] relative">
          <MapContainer
            center={mapCenter}
            zoom={11}
            style={{ height: '100%', width: '100%' }}
          >
            <MapUpdater center={mapCenter} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {filteredData.map((item) => (
              <Marker
                key={item.id}
                position={item.position}
                icon={customIcon}
                eventHandlers={{
                  click: () => handleMarkerClick(item.position)
                }}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                    <div className="mt-2">
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                        item.type === 'commercial' ? 'bg-blue-100 text-blue-800' :
                        item.type === 'retail' ? 'bg-green-100 text-green-800' :
                        item.type === 'cultural' ? 'bg-purple-100 text-purple-800' :
                        item.type === 'leisure' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                      </span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* Grid Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <Layers className="h-6 w-6 text-singapore-blue" />
            <h3 className="text-lg font-semibold text-gray-900">Grid Statistics</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Points:</span>
              <span className="font-semibold">{singaporeGridData.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Filtered:</span>
              <span className="font-semibold">{filteredData.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Coverage Area:</span>
              <span className="font-semibold">~720 km²</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <Info className="h-6 w-6 text-singapore-red" />
            <h3 className="text-lg font-semibold text-gray-900">Legend</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Commercial</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Retail</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Cultural</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Leisure</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Industrial</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <MapPin className="h-6 w-6 text-singapore-gold" />
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => setMapCenter([1.3521, 103.8198])}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Center on Singapore
            </button>
            <button
              onClick={() => setSelectedType('all')}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Show All Points
            </button>
            <button
              onClick={() => setSearchQuery('')}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear Search
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GridExplorer 