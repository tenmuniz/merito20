import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return format(date, "dd/MM/yyyy HH:mm", { locale: ptBR });
}

export function formatRelativeDate(date: Date): string {
  const formatted = formatDistanceToNow(date, { locale: ptBR, addSuffix: true });
  return formatted.includes('segundo') ? 'agora mesmo' : formatted;
}

export function getTeamColorClass(teamName: string): {
  bg: string;
  text: string;
  light: string;
  border: string;
  progressBg: string;
} {
  switch (teamName.toLowerCase()) {
    case 'alfa':
      return {
        bg: 'bg-blue-500',
        text: 'text-blue-600',
        light: 'bg-blue-100',
        border: 'border-blue-500',
        progressBg: 'bg-gradient-to-r from-blue-500 to-blue-600'
      };
    case 'bravo':
      return {
        bg: 'bg-green-500',
        text: 'text-green-600',
        light: 'bg-green-100',
        border: 'border-green-500',
        progressBg: 'bg-gradient-to-r from-green-500 to-green-600'
      };
    case 'charlie':
      return {
        bg: 'bg-red-500',
        text: 'text-red-600',
        light: 'bg-red-100',
        border: 'border-red-500',
        progressBg: 'bg-gradient-to-r from-red-500 to-red-600'
      };
    default:
      return {
        bg: 'bg-gray-500',
        text: 'text-gray-600',
        light: 'bg-gray-100',
        border: 'border-gray-500',
        progressBg: 'bg-gradient-to-r from-gray-400 to-gray-500'
      };
  }
}

// Calculate percentage of a value against a total or max value
export function calculatePercentage(value: number, max: number): number {
  return Math.min(Math.round((value / max) * 100), 100);
}

// Format points with suffix
export function formatPoints(points: number): string {
  return `${points} pts`;
}

// Get ranking position text
export function getRankingText(position: number): string {
  switch (position) {
    case 1:
      return '1° lugar';
    case 2:
      return '2° lugar';
    case 3:
      return '3° lugar';
    default:
      return `${position}° lugar`;
  }
}

// Generate color for chart
export function getChartColor(index: number): string {
  const colors = [
    '#3b82f6', // blue-500
    '#10b981', // green-500
    '#ef4444', // red-500
    '#f59e0b', // amber-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#06b6d4', // cyan-500
  ];
  
  return colors[index % colors.length];
}
