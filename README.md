# TKTS Broadway Analytics

A modern, responsive web application that tracks and displays Broadway show availability on TKTS with advanced filtering and analytics.

## Features

- Real-time show tracking and analytics
- Mobile-responsive design with touch-friendly interface
- Advanced filtering by day, price, and availability
- Weekly availability breakdown charts
- Price and discount tracking

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: TailwindCSS
- **Icons**: Lucide React
- **Backend**: Supabase (PostgreSQL)
- **Build**: Vite
- **Charts**: Recharts

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Configure environment** (optional):

  Create a `.env` file in the project root and add your Supabase credentials as needed.

3. **Start development**:
   ```bash
   npm run dev
   ```

4. Open http://localhost:3000

*Note: The app works with mock data if Supabase isn't configured.*

## Project Structure

```
src/
├── components/     # React components
├── types/         # TypeScript definitions
├── lib/           # Utilities and services
├── App.tsx        # Main app component
└── index.css      # Global styles
```

## Available Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # Code linting
```

## Deployment

1. Build: `npm run build`
2. Deploy the `dist/` folder to any static host
3. Set environment variables for Supabase (if using live data)

Compatible with Vercel, Netlify, GitHub Pages, and other static hosting providers.
