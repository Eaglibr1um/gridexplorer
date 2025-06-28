# Singapore Grid Explorer 🗺️

An interactive web application for exploring Singapore's grid system with real-time progress tracking, notes, and analytics.

## Features ✨

### 🗺️ Interactive Grid Overlay
- Real Singapore grid data with 1000+ grid cells
- Color-coded grid cells (red = unexplored, green = explored)
- Click to explore functionality
- Interactive tooltips and popups

### 📊 Progress Tracking
- Real-time exploration progress
- Personal notes for each grid cell
- Exploration date tracking
- Progress statistics and analytics

### 🔍 Advanced Filtering
- Filter by exploration status (explored/unexplored)
- Filter by region
- Search by location name
- Real-time filtering updates

### 📈 Analytics Dashboard
- Overall progress percentage
- Region-wise progress breakdown
- Recent explorations timeline
- Visual progress bars and charts

### 🔐 User Authentication
- Firebase Authentication
- Secure user data storage
- Real-time data synchronization

## Tech Stack 🛠️

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Maps**: Leaflet with React-Leaflet
- **Backend**: Firebase (Authentication, Firestore)
- **Deployment**: Vercel

## Getting Started 🚀

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Firebase project

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd gridexplorer
```

2. Install dependencies:
```bash
npm install
```

3. Set up Firebase:
   - Create a Firebase project
   - Enable Authentication (Email/Password)
   - Create a Firestore database
   - Add your Firebase config to `.env`:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

## Usage Guide 📖

### 1. Authentication
- Sign up with your email and password
- Login to access the grid explorer

### 2. Dashboard
- View your overall exploration progress
- See recent explorations
- Check region-wise statistics

### 3. Grid Explorer
- **Explore Grids**: Click on any red (unexplored) grid cell to mark it as explored
- **Add Notes**: Click on a grid cell and add personal notes about your visit
- **Filter**: Use the filters to show only explored/unexplored grids or specific regions
- **Search**: Search for specific locations by name
- **Statistics**: Toggle the stats panel to see detailed analytics

### 4. Features
- **Interactive Map**: Pan and zoom to explore different areas
- **Color Coding**: Red = unexplored, Green = explored
- **Tooltips**: Hover over grids for quick info
- **Popups**: Click for detailed information and actions
- **Real-time Updates**: Changes sync immediately across devices

## Data Structure 📊

The application uses real Singapore grid data with the following structure:

```typescript
interface GridCell {
  id: number
  bounds: number[][] // Polygon coordinates
  center: number[]   // Center point
  status: 'unexplored' | 'explored'
  regionName: string
  displayName: string
  notes?: string
  exploredDate?: string
  landmarks?: Landmark[]
}
```

## Deployment 🌐

The application is configured for deployment on Vercel:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push

## Contributing 🤝

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License 📄

This project is licensed under the MIT License.

## Acknowledgments 🙏

- Singapore grid data provided by the community
- Inspired by exploration and discovery apps
- Built with modern web technologies

---

**Happy Exploring! 🗺️✨**