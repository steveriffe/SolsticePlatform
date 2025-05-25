// Utility function to generate an ARC between two coordinates
export function createArc(start: [number, number], end: [number, number]) {
  // Calculate intermediate points for a curved arc
  const midPoint = [
    (start[0] + end[0]) / 2,
    (start[1] + end[1]) / 2
  ];
  
  // Add some curvature by adjusting the midpoint
  const distance = Math.sqrt(
    Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2)
  );
  
  // Make longer routes curve more
  const curveStrength = Math.min(distance / 10, 5);
  
  // Create a third control point perpendicular to the line between start and end
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  
  // Perpendicular vector
  const perpX = -dy;
  const perpY = dx;
  
  // Normalize and scale
  const len = Math.sqrt(perpX * perpX + perpY * perpY);
  const controlPoint = [
    midPoint[0] + (perpX / len) * curveStrength,
    midPoint[1] + (perpY / len) * curveStrength
  ];
  
  // Create a curved path using quadratic bezier
  return {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [
        start,
        controlPoint,
        end
      ]
    }
  };
}

// Utility function to aggregate/simplify routes at different zoom levels
export function simplifyRoutes(routes: any[], zoomLevel: number) {
  // At high zoom levels, show all routes
  if (zoomLevel > 8) {
    return routes;
  }
  
  // At medium zoom levels, simplify by merging routes between same city pairs
  if (zoomLevel > 4) {
    const cityPairs: {[key: string]: any} = {};
    
    routes.forEach(route => {
      const key = `${route.from.city}-${route.to.city}`;
      if (!cityPairs[key]) {
        cityPairs[key] = {...route};
        cityPairs[key].count = 1;
      } else {
        cityPairs[key].count++;
      }
    });
    
    return Object.values(cityPairs);
  }
  
  // At low zoom levels, simplify by merging routes between same countries
  const countryPairs: {[key: string]: any} = {};
  
  routes.forEach(route => {
    const key = `${route.from.country}-${route.to.country}`;
    if (!countryPairs[key]) {
      countryPairs[key] = {...route};
      countryPairs[key].count = 1;
    } else {
      countryPairs[key].count++;
    }
  });
  
  return Object.values(countryPairs);
}

// Apply a colorscale to visualize frequency/density of routes
export function getDensityColor(count: number, maxCount: number) {
  // Use a gradient from blue to red for density visualization
  const ratio = Math.min(count / maxCount, 1);
  
  // RGB values for gradient from blue (0,0,255) to red (255,0,0)
  const r = Math.round(255 * ratio);
  const b = Math.round(255 * (1 - ratio));
  
  return [r, 0, b, 255]; // RGBA
}

// Calculate a great circle path between two points
export function getGreatCirclePath(startLonLat: [number, number], endLonLat: [number, number], numPoints = 100): [number, number][] {
  const path: [number, number][] = [];
  
  // Start and end coordinates in radians
  const lon1 = toRadians(startLonLat[0]);
  const lat1 = toRadians(startLonLat[1]);
  const lon2 = toRadians(endLonLat[0]);
  const lat2 = toRadians(endLonLat[1]);
  
  // Calculate the distance
  const d = 2 * Math.asin(
    Math.sqrt(
      Math.pow(Math.sin((lat1 - lat2) / 2), 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin((lon1 - lon2) / 2), 2)
    )
  );
  
  // For paths that cross the anti-meridian, we need special handling
  const crossesAntiMeridian = Math.abs(startLonLat[0] - endLonLat[0]) > 180;
  
  // If the distance is very small, just return start and end
  if (d < 0.0001 || !numPoints) {
    path.push(startLonLat);
    path.push(endLonLat);
    return path;
  }
  
  // Interpolate points along the great circle
  for (let i = 0; i <= numPoints; i++) {
    const f = i / numPoints;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    
    const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
    const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
    const z = A * Math.sin(lat1) + B * Math.sin(lat2);
    
    const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
    const lon = Math.atan2(y, x);
    
    let pointLon = toDegrees(lon);
    const pointLat = toDegrees(lat);
    
    // Handle paths crossing the anti-meridian (180° longitude)
    if (crossesAntiMeridian) {
      if ((startLonLat[0] < 0 && endLonLat[0] > 0) || (startLonLat[0] > 0 && endLonLat[0] < 0)) {
        if (pointLon < 0 && Math.abs(pointLon) > 90) {
          pointLon += 360;
        } else if (pointLon > 0 && Math.abs(pointLon) > 90) {
          pointLon -= 360;
        }
      }
    }
    
    path.push([pointLon, pointLat]);
  }
  
  return path;
}

// Helper function to convert degrees to radians
function toRadians(degrees: number): number {
  return degrees * Math.PI / 180;
}

// Helper function to convert radians to degrees
function toDegrees(radians: number): number {
  return radians * 180 / Math.PI;
}
