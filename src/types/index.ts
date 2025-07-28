// Types for TKTS show data
export interface Show {
  id: string;
  title: string;
  theater?: string;
  category?: string;
  availability_frequency: number; // 0-1 representing percentage
  average_price_range?: [number, number]; // [low, high]
  average_discount?: number;
  last_seen?: string;
  days_available?: DayAvailability[];
}

export interface DayAvailability {
  day_of_week: string;
  availability_percentage: number;
  average_price_range?: [number, number]; // [low, high]
  average_discount?: number;
  frequency_count: number;
}

export interface ShowWithStats extends Show {
  prediction_accuracy?: number;
  trending?: 'up' | 'down' | 'stable';
}

export interface ShowWithRecentActivity extends Show {
  recentActivityScore: number;
}

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface FilterOptions {
  dayOfWeek: DayOfWeek | 'all';
  sortBy: 'frequency' | 'price' | 'discount' | 'title';
  sortOrder: 'asc' | 'desc';
  showTime: 'all' | 'matinee' | 'evening';
  showBroadway?: boolean;
  showOffBroadway?: boolean;
  searchQuery?: string;
}
