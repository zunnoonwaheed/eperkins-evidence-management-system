/**
 * Date and time utility functions
 */

/**
 * Format ISO date to readable format
 * Example: "2026-06-29T04:10:00.794Z" -> "Jun 29, 2026 · 04:10 UTC"
 */
export function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  const month = date.toLocaleString('en-US', { month: 'short' });
  const day = date.getDate();
  const year = date.getFullYear();
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');

  return `${month} ${day}, ${year} · ${hours}:${minutes} UTC`;
}

/**
 * Format ISO date to date only
 * Example: "2026-06-29T04:10:00.794Z" -> "June 29, 2026"
 */
export function formatDateOnly(isoDate: string): string {
  const date = new Date(isoDate);
  const month = date.toLocaleString('en-US', { month: 'long' });
  const day = date.getDate();
  const year = date.getFullYear();

  return `${month} ${day}, ${year}`;
}

/**
 * Format ISO date to time only
 * Example: "2026-06-29T04:10:00.794Z" -> "04:10:00 UTC"
 */
export function formatTimeOnly(isoDate: string): string {
  const date = new Date(isoDate);
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  const seconds = date.getUTCSeconds().toString().padStart(2, '0');

  return `${hours}:${minutes}:${seconds} UTC`;
}

/**
 * Calculate time difference from now
 * Returns: { days, hours, minutes, seconds }
 */
export function getTimeDifference(isoDate: string) {
  const signedDate = new Date(isoDate);
  const now = new Date();
  const diff = now.getTime() - signedDate.getTime();

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds };
}

/**
 * Format time difference to readable string
 * Example: "2 days, 5 hours, 30 minutes, 15 seconds"
 */
export function formatTimeDifference(isoDate: string): string {
  const { days, hours, minutes, seconds } = getTimeDifference(isoDate);
  return `${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds`;
}

/**
 * Get relative time (e.g., "2 days ago", "5 hours ago")
 */
export function getRelativeTime(isoDate: string): string {
  const { days, hours, minutes } = getTimeDifference(isoDate);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
}
