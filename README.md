# TKTS Broadway Analytics

A modern, responsive web application that tracks and displays Broadway show availability on TKTS (Theatre Development Fund) with advanced filtering and prediction capabilities.

## Features

- 📊 **Real-time Show Tracking**: Monitor availability frequency for Broadway shows
- 📱 **Responsive Design**: Optimized for both mobile and desktop
- 🔍 **Advanced Filtering**: Filter by day of week, price range, and availability
- 📈 **Predictive Analytics**: See predicted availability percentages for each day
- 💰 **Price & Discount Tracking**: View average prices and discount percentages
- 🎭 **Modern UI**: Clean, theater-inspired design with intuitive navigation
- 📲 **Mobile-First**: Touch-friendly interface with floating action buttons
- 🚀 **Performance Optimized**: Fast loading with modern React and Vite

## Screenshots & Features

### Desktop Experience
- **Dashboard Overview**: Comprehensive statistics and insights
- **Advanced Filtering**: Full filter panel with multiple options
- **Weekly Breakdown**: Visual charts showing availability patterns
- **Theater Information**: Complete show details with venue information

### Mobile Experience  
- **Quick Stats**: Compact statistics overview
- **Floating Filter Button**: Easy access to filtering options
- **Touch-Optimized Cards**: Large touch targets and readable text
- **Bottom Sheet Filters**: Native mobile filter experience

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: TailwindCSS with custom theater theme
- **Icons**: Lucide React (modern, lightweight icons)
- **Backend**: Supabase (PostgreSQL database with real-time features)
- **Build Tool**: Vite (fast development and production builds)
- **Charts**: Recharts (responsive chart library)

## Quick Start

1. **Clone and Install**:
   ```bash
   cd frontend
   npm install
   ```

2. **Configure Supabase** (optional - app works with mock data):
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials:
   # VITE_SUPABASE_URL=your-project-url
   # VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```

4. **Open**: http://localhost:3000

The application will automatically use mock data if Supabase isn't configured, so you can see the interface immediately.

## Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build locally
npm run lint         # Run ESLint

# Production deployment
npm run build && npm run preview
```

## Project Structure

```
src/
├── components/          # React components
│   ├── Header.tsx      # Application header with branding
│   ├── ShowCard.tsx    # Individual show display cards
│   ├── FilterPanel.tsx # Desktop filtering controls
│   ├── MobileFilter.tsx # Mobile filter modal
│   ├── Dashboard.tsx   # Desktop statistics dashboard
│   └── QuickStats.tsx  # Mobile compact statistics
├── types/              # TypeScript type definitions
│   └── index.ts        # Show, filter, and API types
├── lib/                # Utilities and services
│   ├── supabase.ts     # Database client and mock data
│   └── utils.ts        # Helper functions and calculations
├── App.tsx             # Main application component
├── main.tsx            # Application entry point
└── index.css           # Global styles and Tailwind
```

## Features Overview

### Show Cards
Each show displays:
- **Title & Theater**: Show name and venue
- **Availability Indicator**: Color-coded percentage (green=high, red=low)
- **Price Information**: Average ticket prices
- **Discount Percentage**: Average TKTS discount
- **Last Seen Date**: When the show was last available
- **Weekly Breakdown**: Mini-chart showing daily availability patterns

### Filtering & Sorting
- **Day of Week**: Filter shows available on specific days
- **Price Range**: Set maximum price limits
- **Availability Threshold**: Set minimum availability percentages
- **Search**: Find shows by title or theater name
- **Sorting Options**: Sort by frequency, price, discount, or name
- **Order**: Ascending or descending sort order

### Responsive Design
- **Mobile-First**: Designed for mobile, enhanced for desktop
- **Adaptive Layouts**: Grid layouts that respond to screen size
- **Touch-Friendly**: Large buttons and touch targets
- **Performance**: Optimized for all device types

### Data Visualization
- **Availability Colors**: Intuitive color coding (green/yellow/orange/red)
- **Weekly Charts**: Mini visualizations of daily patterns
- **Statistics Dashboard**: Overview of trends and insights
- **Popular Days**: Ranking of best days to visit TKTS

## Data Sources

The application supports both:
- **Live Data**: Connect to Supabase for real-time TKTS data
- **Mock Data**: Built-in sample data including:
  - The Lion King (85% availability)
  - Hamilton (45% availability)  
  - Wicked (75% availability)
  - Chicago (92% availability)
  - The Phantom of the Opera (68% availability)

### Database Schema (Supabase)
```sql
-- Shows table
CREATE TABLE shows (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  theater TEXT,
  category TEXT,
  availability_frequency REAL NOT NULL,
  average_price REAL,
  average_discount REAL,
  last_seen DATE,
  days_available JSONB
);

-- Example days_available structure:
[
  {
    "day_of_week": "Tuesday",
    "availability_percentage": 90,
    "average_price": 115,
    "average_discount": 40,
    "frequency_count": 45
  }
]
```

## Development

### Setup Development Environment
```bash
# Install dependencies
npm install

# Start development server (with hot reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Code Style
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code quality and consistency rules
- **Prettier**: Code formatting (if configured)
- **TailwindCSS**: Utility-first CSS framework

### Adding New Features
1. Create components in `src/components/`
2. Add types to `src/types/index.ts`
3. Update mock data in `src/lib/supabase.ts`
4. Test on both mobile and desktop
5. Update this README

## Deployment

### Production Build
```bash
npm run build
```
Creates optimized files in `dist/` directory.

### Environment Variables
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Hosting Options
- **Vercel**: Zero-config deployment
- **Netlify**: Drag-and-drop deployment
- **GitHub Pages**: Free static hosting
- **Any static host**: Upload `dist/` folder contents

## Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (last 2 versions)
- **Mobile**: iOS Safari, Chrome Mobile, Samsung Internet
- **Progressive Enhancement**: Graceful fallbacks for older browsers

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly on mobile and desktop
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write responsive CSS with mobile-first approach
- Test filtering and sorting functionality
- Ensure accessibility (ARIA labels, keyboard navigation)
- Update documentation for new features

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Acknowledgments

- **TKTS**: Theatre Development Fund for Broadway discount tickets
- **Supabase**: Backend-as-a-Service platform
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide**: Beautiful, customizable icons
- **React**: The library for building user interfaces
