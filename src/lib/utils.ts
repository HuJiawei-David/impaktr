// home/ubuntu/impaktrweb/src/lib/utils.ts

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTimeAgo(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(diffInSeconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
    }
  }

  return 'Just now';
}

export function formatHours(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)} min`;
  }
  
  if (hours === 1) {
    return '1 hour';
  }
  
  if (hours < 24) {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    
    if (minutes === 0) {
      return `${wholeHours} hours`;
    }
    
    return `${wholeHours}h ${minutes}m`;
  }
  
  const days = Math.floor(hours / 24);
  const remainingHours = Math.round(hours % 24);
  
  if (remainingHours === 0) {
    return `${days} day${days > 1 ? 's' : ''}`;
  }
  
  return `${days}d ${remainingHours}h`;
}

export function formatScore(score: number): string {
  if (score < 10) {
    return score.toFixed(1);
  }
  
  if (score < 100) {
    return score.toFixed(0);
  }
  
  if (score < 1000) {
    return score.toFixed(0);
  }
  
  return `${(score / 1000).toFixed(1)}K`;
}

export function formatNumber(num: number): string {
  if (num < 1000) {
    return num.toString();
  }
  
  if (num < 1000000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  
  return `${(num / 1000000).toFixed(1)}M`;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function calculateProgress(current: number, target: number): number {
  return Math.min(Math.round((current / target) * 100), 100);
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
}

export function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

export function getRandomColor(): string {
  const colors = [
    '#3B82F6', '#8B5CF6', '#06D6A0', '#F59E0B', '#EF4444',
    '#10B981', '#F97316', '#84CC16', '#06B6D4', '#8B5A2B'
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
}

export function parseCoordinates(locationString: string): { lat: number; lng: number } | null {
  const match = locationString.match(/lat:\s*(-?\d+\.?\d*),?\s*lng:\s*(-?\d+\.?\d*)/i);
  
  if (match) {
    return {
      lat: parseFloat(match[1]),
      lng: parseFloat(match[2]),
    };
  }
  
  return null;
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function getSDGColor(sdgNumber: number): string {
  const sdgColors: { [key: number]: string } = {
    1: '#e5243b', 2: '#dda63a', 3: '#4c9f38', 4: '#c5192d', 5: '#ff3a21',
    6: '#26bde2', 7: '#fcc30b', 8: '#a21942', 9: '#fd6925', 10: '#dd1367',
    11: '#fd9d24', 12: '#bf8b2e', 13: '#3f7e44', 14: '#0a97d9', 15: '#56c02b',
    16: '#00689d', 17: '#19486a'
  };
  
  return sdgColors[sdgNumber] || '#666666';
}

export function getSDGName(sdgNumber: number): string {
  const sdgNames: { [key: number]: string } = {
    1: 'No Poverty',
    2: 'Zero Hunger',
    3: 'Good Health and Well-being',
    4: 'Quality Education',
    5: 'Gender Equality',
    6: 'Clean Water and Sanitation',
    7: 'Affordable and Clean Energy',
    8: 'Decent Work and Economic Growth',
    9: 'Industry, Innovation and Infrastructure',
    10: 'Reduced Inequalities',
    11: 'Sustainable Cities and Communities',
    12: 'Responsible Consumption and Production',
    13: 'Climate Action',
    14: 'Life Below Water',
    15: 'Life on Land',
    16: 'Peace, Justice and Strong Institutions',
    17: 'Partnerships for the Goals',
  };

  return sdgNames[sdgNumber] || `SDG ${sdgNumber}`;
}

export function getRankColor(rank: string): string {
  const rankColors: { [key: string]: string } = {
    HELPER: '#9CA3AF',
    SUPPORTER: '#60A5FA',
    CONTRIBUTOR: '#34D399',
    BUILDER: '#FBBF24',
    ADVOCATE: '#F472B6',
    CHANGEMAKER: '#A78BFA',
    MENTOR: '#FB7185',
    LEADER: '#F59E0B',
    AMBASSADOR: '#8B5CF6',
    GLOBAL_CITIZEN: '#10B981',
  };

  return rankColors[rank] || '#9CA3AF';
}

export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

export function validateFileSize(file: File, maxSizeMB: number): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function generateUniqueId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text);
  } else {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return Promise.resolve();
    } catch (err) {
      document.body.removeChild(textArea);
      return Promise.reject(err);
    }
  }
}

export function shareToSocialMedia(platform: string, url: string, title?: string, text?: string): void {
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text || '');
  const encodedTitle = encodeURIComponent(title || '');
  const shareText = encodedText || encodedTitle;

  let shareUrl = '';

  switch (platform.toLowerCase()) {
    case 'facebook':
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
      break;
    case 'twitter':
      shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${shareText}`;
      break;
    case 'linkedin':
      shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
      break;
    case 'whatsapp':
      shareUrl = `https://wa.me/?text=${shareText}%20${encodedUrl}`;
      break;
    default:
      console.error('Unsupported platform:', platform);
      return;
  }

  window.open(shareUrl, '_blank', 'width=600,height=400');
}

export function getRelativeTimeString(date: Date | string): string {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const diffInMs = dateObj.getTime() - Date.now();
  const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));

  if (Math.abs(diffInDays) < 7) {
    return rtf.format(diffInDays, 'day');
  }

  if (Math.abs(diffInDays) < 30) {
    const diffInWeeks = Math.ceil(diffInDays / 7);
    return rtf.format(diffInWeeks, 'week');
  }

  if (Math.abs(diffInDays) < 365) {
    const diffInMonths = Math.ceil(diffInDays / 30);
    return rtf.format(diffInMonths, 'month');
  }

  const diffInYears = Math.ceil(diffInDays / 365);
  return rtf.format(diffInYears, 'year');
}

export function sanitizeHtml(html: string): string {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

export function parseJsonSafely<T>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return fallback;
  }
}

export function createQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value.toString());
    }
  });

  return searchParams.toString();
}