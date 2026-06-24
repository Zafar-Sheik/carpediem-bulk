/**
 * Reverse Geocoding Utility
 * Converts latitude/longitude to South African province using OpenCage API
 */

const OPENCAGE_API_KEY = process.env.OPENCAGE_API_KEY;
const OPENCAGE_API_URL = 'https://api.opencagedata.com/geocode/v1/json';

/**
 * South African provinces list
 */
const SOUTH_AFRICAN_PROVINCES = [
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

/**
 * Extract province from OpenCage response
 */
function extractProvinceFromResponse(results: Array<{
  components?: Record<string, string>;
  formatted?: string;
}>): string | null {
  if (!results || results.length === 0) {
    return null;
  }

  const firstResult = results[0];
  const components = firstResult.components || {};

  // Try to get province from various possible fields
  const province = 
    components.province || 
    components.state || 
    components.province_code;
  
  if (province) {
    // Normalize province name
    const normalizedProvince = normalizeProvinceName(province);
    if (normalizedProvince) {
      return normalizedProvince;
    }
  }

  return null;
}

/**
 * Normalize province name to match our enum
 */
function normalizeProvinceName(name: string): string | null {
  const normalized = name.trim();
  
  // Direct match
  if (SOUTH_AFRICAN_PROVINCES.includes(normalized as typeof SOUTH_AFRICAN_PROVINCES[number])) {
    return normalized;
  }

  // Case-insensitive match
  const lowerName = normalized.toLowerCase();
  for (const province of SOUTH_AFRICAN_PROVINCES) {
    if (province.toLowerCase() === lowerName) {
      return province;
    }
  }

  // Handle common variations
  const variations: Record<string, string> = {
    'gauteng': 'Gauteng',
    'kwazulu-natal': 'KwaZulu-Natal',
    'kwazulu natal': 'KwaZulu-Natal',
    'western cape': 'Western Cape',
    'eastern cape': 'Eastern Cape',
    'free state': 'Free State',
    'fs': 'Free State',
    'limpopo': 'Limpopo',
    'mpumalanga': 'Mpumalanga',
    'north west': 'North West',
    'northwest': 'North West',
    'northern cape': 'Northern Cape',
  };

  return variations[lowerName] || null;
}

/**
 * Convert latitude/longitude to South African province using OpenCage API
 * 
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Promise<string> - Province name or "unknown" if not found
 */
export async function getProvinceFromCoordinates(lat: number, lng: number): Promise<string> {
  // Validate coordinates
  if (isNaN(lat) || isNaN(lng) || lat < -35 || lat > -22 || lng < 16 || lng > 33) {
    console.warn('Invalid coordinates:', lat, lng);
    return 'unknown';
  }

  // Check if API key is configured
  if (!OPENCAGE_API_KEY) {
    console.warn('OpenCage API key not configured, using fallback');
    return 'unknown';
  }

  try {
    const url = new URL(OPENCAGE_API_URL);
    url.searchParams.set('key', OPENCAGE_API_KEY);
    url.searchParams.set('q', `${lat},${lng}`);
    url.searchParams.set('countrycode', 'za'); // South Africa
    url.searchParams.set('language', 'en');
    url.searchParams.set('pretty', '1');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('OpenCage API error:', response.status, response.statusText);
      return 'unknown';
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      console.warn('No results from OpenCage API');
      return 'unknown';
    }

    const province = extractProvinceFromResponse(data.results);

    if (province) {
      return province;
    }

    console.warn('Province not found in API response');
    return 'unknown';

  } catch (error) {
    console.error('Error calling OpenCage API:', error);
    return 'unknown';
  }
}

export default getProvinceFromCoordinates;
