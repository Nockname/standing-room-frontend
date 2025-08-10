import { describe, it, expect } from 'vitest';
import { parseNYString } from '../lib/utils';

describe('parseNYString', () => {
  describe('Basic functionality', () => {
    it('should convert UTC timestamp to NY date format', () => {
      // 2024-07-15 20:00:00 UTC should be 2024-07-15 in NY (EDT, UTC-4)
      const utcTimestamp = '2024-07-15 20:00:00+00';
      const result = parseNYString(utcTimestamp);
      expect(result).toBe('2024-7-15');
    });

    it('should handle timestamps with microseconds', () => {
      const utcTimestamp = '2024-07-15 20:00:00.123456+00';
      const result = parseNYString(utcTimestamp);
      expect(result).toBe('2024-7-15');
    });

    it('should handle timestamps with milliseconds', () => {
      const utcTimestamp = '2024-07-15 20:00:00.123+00';
      const result = parseNYString(utcTimestamp);
      expect(result).toBe('2024-7-15');
    });

    it('should handle timestamps without timezone indicator', () => {
      const utcTimestamp = '2024-07-15 20:00:00';
      const result = parseNYString(utcTimestamp);
      expect(result).toBe('2024-7-15');
    });
  });

  describe('Timezone conversion edge cases', () => {
    it('should handle early morning UTC that becomes previous day in NY', () => {
      // 2024-07-15 03:00:00 UTC should be 2024-07-14 23:00 in NY (EDT, UTC-4)
      const utcTimestamp = '2024-07-15 03:00:00+00';
      const result = parseNYString(utcTimestamp);
      expect(result).toBe('2024-7-14');
    });

    it('should handle late night UTC that stays same day in NY', () => {
      // 2024-07-15 23:00:00 UTC should be 2024-07-15 19:00 in NY (EDT, UTC-4)
      const utcTimestamp = '2024-07-15 23:00:00+00';
      const result = parseNYString(utcTimestamp);
      expect(result).toBe('2024-7-15');
    });

    it('should handle winter time (EST, UTC-5)', () => {
      // 2024-01-15 04:00:00 UTC should be 2024-01-14 23:00 in NY (EST, UTC-5)
      const utcTimestamp = '2024-01-15 04:00:00+00';
      const result = parseNYString(utcTimestamp);
      expect(result).toBe('2024-1-14');
    });

    it('should handle summer time (EDT, UTC-4)', () => {
      // 2024-07-15 03:00:00 UTC should be 2024-07-14 23:00 in NY (EDT, UTC-4)
      const utcTimestamp = '2024-07-15 03:00:00+00';
      const result = parseNYString(utcTimestamp);
      expect(result).toBe('2024-7-14');
    });
  });

  describe('Daylight Saving Time transitions', () => {
    it('should handle spring forward transition (March)', () => {
      // Second Sunday in March 2024 is March 10
      // 2024-03-10 06:00:00 UTC should be 2024-03-10 02:00 in NY (before spring forward)
      const utcTimestamp = '2024-03-10 06:00:00+00';
      const result = parseNYString(utcTimestamp);
      expect(result).toBe('2024-3-10');
    });

    it('should handle fall back transition (November)', () => {
      // First Sunday in November 2024 is November 3
      // 2024-11-03 05:00:00 UTC should be 2024-11-03 01:00 in NY (during fall back)
      const utcTimestamp = '2024-11-03 05:00:00+00';
      const result = parseNYString(utcTimestamp);
      expect(result).toBe('2024-11-3');
    });
  });

  describe('Month and year boundaries', () => {
    it('should handle end of month correctly', () => {
      // 2024-01-31 23:00:00 UTC should be 2024-01-31 18:00 in NY (EST)
      const utcTimestamp = '2024-01-31 23:00:00+00';
      const result = parseNYString(utcTimestamp);
      expect(result).toBe('2024-1-31');
    });

    it('should handle beginning of month correctly', () => {
      // 2024-02-01 04:00:00 UTC should be 2024-01-31 23:00 in NY (EST)
      const utcTimestamp = '2024-02-01 04:00:00+00';
      const result = parseNYString(utcTimestamp);
      expect(result).toBe('2024-1-31');
    });

    it('should handle end of year correctly', () => {
      // 2023-12-31 23:00:00 UTC should be 2023-12-31 18:00 in NY (EST)
      const utcTimestamp = '2023-12-31 23:00:00+00';
      const result = parseNYString(utcTimestamp);
      expect(result).toBe('2023-12-31');
    });

    it('should handle beginning of year correctly', () => {
      // 2024-01-01 04:00:00 UTC should be 2023-12-31 23:00 in NY (EST)
      const utcTimestamp = '2024-01-01 04:00:00+00';
      const result = parseNYString(utcTimestamp);
      expect(result).toBe('2023-12-31');
    });
  });

  describe('Leap year handling', () => {
    it('should handle February 29 in leap year', () => {
      // 2024 is a leap year
      const utcTimestamp = '2024-02-29 12:00:00+00';
      const result = parseNYString(utcTimestamp);
      expect(result).toBe('2024-2-29');
    });

    it('should handle day before leap day', () => {
      const utcTimestamp = '2024-02-28 23:00:00+00';
      const result = parseNYString(utcTimestamp);
      expect(result).toBe('2024-2-28');
    });

    it('should handle day after leap day', () => {
      const utcTimestamp = '2024-03-01 04:00:00+00';
      const result = parseNYString(utcTimestamp);
      expect(result).toBe('2024-2-29');
    });
  });

  describe('Format variations', () => {
    it('should handle PostgreSQL timestamp format with microseconds', () => {
      // Typical Supabase/PostgreSQL format
      const utcTimestamp = '2024-07-29 15:23:27.136077+00';
      const result = parseNYString(utcTimestamp);
      expect(result).toBe('2024-7-29');
    });

    it('should handle ISO 8601 format with T separator', () => {
      const utcTimestamp = '2024-07-29T15:23:27Z';
      const result = parseNYString(utcTimestamp);
      expect(result).toBe('2024-7-29');
    });

    it('should handle timestamp without seconds', () => {
      const utcTimestamp = '2024-07-29 15:23+00';
      const result = parseNYString(utcTimestamp);
      expect(result).toBe('2024-7-29');
    });
  });

  describe('Output format validation', () => {
    it('should return single-digit months without leading zero', () => {
      const utcTimestamp = '2024-03-15 12:00:00+00';
      const result = parseNYString(utcTimestamp);
      expect(result).toBe('2024-3-15');
    });

    it('should return single-digit days without leading zero', () => {
      const utcTimestamp = '2024-12-05 12:00:00+00';
      const result = parseNYString(utcTimestamp);
      expect(result).toBe('2024-12-5');
    });

    it('should return double-digit months and days correctly', () => {
      const utcTimestamp = '2024-12-25 12:00:00+00';
      const result = parseNYString(utcTimestamp);
      expect(result).toBe('2024-12-25');
    });

    it('should maintain four-digit year format', () => {
      const utcTimestamp = '2024-07-29 12:00:00+00';
      const result = parseNYString(utcTimestamp);
      expect(result).toMatch(/^\d{4}-\d{1,2}-\d{1,2}$/);
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle midnight UTC', () => {
      const utcTimestamp = '2024-07-29 00:00:00+00';
      const result = parseNYString(utcTimestamp);
      expect(result).toBe('2024-7-28'); // Should be previous day in NY
    });

    it('should handle noon UTC', () => {
      const utcTimestamp = '2024-07-29 12:00:00+00';
      const result = parseNYString(utcTimestamp);
      expect(result).toBe('2024-7-29'); // Should be same day in NY
    });

    it('should handle very early morning hours', () => {
      const utcTimestamp = '2024-07-29 01:00:00+00';
      const result = parseNYString(utcTimestamp);
      expect(result).toBe('2024-7-28'); // Should be previous day in NY
    });

    it('should handle late evening hours', () => {
      const utcTimestamp = '2024-07-29 22:00:00+00';
      const result = parseNYString(utcTimestamp);
      expect(result).toBe('2024-7-29'); // Should be same day in NY
    });
  });

  describe('Real-world Broadway show time scenarios', () => {
    it('should handle matinee performance time (2:00 PM EST)', () => {
      // 2:00 PM EST = 7:00 PM UTC (winter)
      const utcTimestamp = '2024-01-15 19:00:00+00';
      const result = parseNYString(utcTimestamp);
      expect(result).toBe('2024-1-15');
    });

    it('should handle evening performance time (8:00 PM EDT)', () => {
      // 8:00 PM EDT = 12:00 AM UTC next day (summer)
      const utcTimestamp = '2024-07-16 00:00:00+00';
      const result = parseNYString(utcTimestamp);
      expect(result).toBe('2024-7-15');
    });

    it('should handle late night after-show data entry', () => {
      // 11:30 PM EDT = 3:30 AM UTC next day
      const utcTimestamp = '2024-07-16 03:30:00+00';
      const result = parseNYString(utcTimestamp);
      expect(result).toBe('2024-7-15');
    });
  });

  describe('Historical data scenarios', () => {
    it('should handle dates from previous years', () => {
      const utcTimestamp = '2023-12-15 20:00:00+00';
      const result = parseNYString(utcTimestamp);
      expect(result).toBe('2023-12-15');
    });

    it('should handle very old dates', () => {
      const utcTimestamp = '2020-03-15 14:00:00+00';
      const result = parseNYString(utcTimestamp);
      expect(result).toBe('2020-3-15');
    });

    it('should handle future dates', () => {
      const utcTimestamp = '2025-06-15 18:00:00+00';
      const result = parseNYString(utcTimestamp);
      expect(result).toBe('2025-6-15');
    });
  });
});
