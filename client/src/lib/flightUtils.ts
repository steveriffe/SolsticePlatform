// Calculate haversine distance between two points
export function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance);
}

function toRad(value: number): number {
  return value * Math.PI / 180;
}

// Format flight duration from hours to hours:minutes
export function formatDuration(hours: number): string {
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  
  return `${h}h ${m}m`;
}

// Format date to a more readable format
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Generate a color for an airline if brand color is not available
export function generateAirlineColor(airlineCode: string): string {
  // Simple hash function to generate a color based on airline code
  let hash = 0;
  for (let i = 0; i < airlineCode.length; i++) {
    hash = airlineCode.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Convert to hex color
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  
  return color;
}

// Parse CSV string into flight objects
export function parseCSV(csvString: string) {
  const lines = csvString.split('\n');
  const headers = lines[0].split(',').map(header => header.trim());
  
  const results = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = line.split(',');
    const obj: Record<string, string> = {};
    
    headers.forEach((header, j) => {
      obj[header] = values[j]?.trim() || '';
    });
    
    results.push(obj);
  }
  
  return results;
}
