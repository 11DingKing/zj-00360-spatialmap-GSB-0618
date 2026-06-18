import type { BuildingUsage } from '../types';
import { USAGE_COLORS, YEAR_COLOR_RANGES } from './constants';

export function getUsageColor(usage: BuildingUsage): string {
  return USAGE_COLORS[usage] || '#9E9E9E';
}

export function getYearColor(year: number): string {
  for (const range of YEAR_COLOR_RANGES) {
    if (year >= range.min && year < range.max) {
      return range.color;
    }
  }
  if (year >= YEAR_COLOR_RANGES[YEAR_COLOR_RANGES.length - 1].max) {
    return YEAR_COLOR_RANGES[YEAR_COLOR_RANGES.length - 1].color;
  }
  return '#9E9E9E';
}

export function getColorWithOpacity(color: string, opacity: number): string {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
