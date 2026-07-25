export function getLocalYYYYMMDD(date: Date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function getLocalDateTimeString(date: Date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

export function getTimeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Checks if the Indian stock market is currently open (09:15 to 15:30 IST, Mon-Fri).
 * Evaluated correctly regardless of the user's local timezone.
 */
export function isMarketOpen(): boolean {
  const now = new Date();
  const options = { timeZone: 'Asia/Kolkata', hour12: false, hour: 'numeric', minute: 'numeric', weekday: 'short' } as const;
  const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(now);
  
  let hour = 0, minute = 0, weekday = '';
  for (const part of parts) {
    if (part.type === 'hour') hour = parseInt(part.value, 10);
    if (part.type === 'minute') minute = parseInt(part.value, 10);
    if (part.type === 'weekday') weekday = part.value;
  }
  
  if (weekday === 'Sat' || weekday === 'Sun') return false;
  
  const timeInMinutes = (hour === 24 ? 0 : hour) * 60 + minute;
  const marketOpen = 9 * 60 + 15; // 09:15 AM
  const marketClose = 15 * 60 + 30; // 03:30 PM
  
  return timeInMinutes >= marketOpen && timeInMinutes <= marketClose;
}
