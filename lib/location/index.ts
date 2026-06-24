/**
 * Location Utility Library
 * Handles reverse geocoding to map coordinates to South African provinces
 */

// South African provinces list
export const SOUTH_AFRICAN_PROVINCES = [
  'Gauteng',
  'KwaZulu-Natal',
  'Western Cape',
  'Eastern Cape',
  'Free State',
  'Limpopo',
  'Mpumalanga',
  'North West',
  'Northern Cape',
] as const;

export type SouthAfricanProvince = typeof SOUTH_AFRICAN_PROVINCES[number] | 'unknown';

// Province boundary polygons (simplified coordinates for point-in-polygon)
// These are approximate boundaries for each province
interface ProvincePolygon {
  name: SouthAfricanProvince;
  coordinates: [number, number][];
}

// Simplified polygon boundaries for South African provinces
// Format: [longitude, latitude]
const PROVINCE_POLYGONS: ProvincePolygon[] = [
  {
    name: 'Gauteng',
    coordinates: [
      [27.9, -26.5], [28.5, -26.5], [28.5, -25.7], [27.9, -25.7], [27.9, -26.5]
    ]
  },
  {
    name: 'KwaZulu-Natal',
    coordinates: [
      [29.0, -28.5], [32.0, -28.5], [32.0, -26.5], [31.0, -26.5], [29.0, -28.5]
    ]
  },
  {
    name: 'Western Cape',
    coordinates: [
      [16.5, -34.5], [22.0, -34.5], [22.0, -31.5], [19.5, -31.5], [16.5, -34.5]
    ]
  },
  {
    name: 'Eastern Cape',
    coordinates: [
      [22.5, -34.0], [30.0, -34.0], [30.0, -30.0], [25.5, -30.0], [22.5, -34.0]
    ]
  },
  {
    name: 'Free State',
    coordinates: [
      [24.5, -30.5], [29.5, -30.5], [29.5, -26.5], [24.5, -26.5], [24.5, -30.5]
    ]
  },
  {
    name: 'Limpopo',
    coordinates: [
      [26.5, -25.5], [30.0, -25.5], [30.0, -22.0], [26.5, -22.0], [26.5, -25.5]
    ]
  },
  {
    name: 'Mpumalanga',
    coordinates: [
      [28.5, -27.0], [32.0, -27.0], [32.0, -24.5], [28.5, -24.5], [28.5, -27.0]
    ]
  },
  {
    name: 'North West',
    coordinates: [
      [22.5, -27.5], [27.5, -27.5], [27.5, -25.5], [22.5, -25.5], [22.5, -27.5]
    ]
  },
  {
    name: 'Northern Cape',
    coordinates: [
      [16.5, -32.0], [29.0, -32.0], [29.0, -28.0], [20.0, -28.0], [16.5, -32.0]
    ]
  }
];

/**
 * Ray casting algorithm for point in polygon detection
 */
function isPointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    const intersect = ((yi > y) !== (yj > y)) && 
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    
    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Get province from coordinates using local polygon mapping
 * This is a lightweight solution that works without external APIs
 * 
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Province name or 'unknown' if not found
 */
export function getProvinceFromCoordinates(lat: number, lng: number): SouthAfricanProvince {
  // Validate coordinates
  if (isNaN(lat) || isNaN(lng) || lat < -35 || lat > -22 || lng < 16 || lng > 33) {
    return 'unknown';
  }

  // Check each province polygon
  for (const province of PROVINCE_POLYGONS) {
    if (isPointInPolygon([lng, lat], province.coordinates)) {
      return province.name;
    }
  }

  // Default fallback - South Africa bounds check
  // Roughly: lat -35 to -22, lng 16 to 33
  if (lat >= -35 && lat <= -22 && lng >= 16 && lng <= 33) {
    // If we're in SA but not matched to a province, try more precise check
    // For edge cases, default to 'unknown'
    return 'unknown';
  }

  return 'unknown';
}

/**
 * Get user's current location using browser Geolocation API
 * 
 * @returns Promise with coordinates or null if denied/unavailable
 */
export async function getCurrentLocation(): Promise<{ lat: number; lng: number } | null> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.warn('Geolocation error:', error.message);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes cache
      }
    );
  });
}

/**
 * Get user's province - combines location fetch and reverse geocoding
 * 
 * @returns Province name or 'unknown'
 */
export async function getUserProvince(): Promise<SouthAfricanProvince> {
  const location = await getCurrentLocation();
  
  if (!location) {
    return 'unknown';
  }

  return getProvinceFromCoordinates(location.lat, location.lng);
}

/**
 * Request location permission from user
 * 
 * @returns Promise<boolean> - true if permission granted
 */
export async function requestLocationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    return false;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      () => resolve(true),
      () => resolve(false),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 0 }
    );
  });
}

/**
 * Province options for dropdown UI
 */
export const PROVINCE_OPTIONS = [
  { value: 'All', label: 'All Provinces' },
  ...SOUTH_AFRICAN_PROVINCES.map(province => ({
    value: province,
    label: province,
  })),
] as const;

export type ProvinceOptionValue = typeof PROVINCE_OPTIONS[number]['value'];
