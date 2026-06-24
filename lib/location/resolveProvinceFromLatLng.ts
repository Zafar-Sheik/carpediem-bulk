import { getProvinceFromCoordinates } from './getProvinceFromCoordinates';

const PROVINCES = [
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

function normalizeProvinceName(name: string): string | null {
  const normalized = name.trim();
  if ((PROVINCES as readonly string[]).includes(normalized)) return normalized;
  const lower = normalized.toLowerCase();
  for (const p of PROVINCES) {
    if (p.toLowerCase() === lower) return p;
  }
  const variations: Record<string, string> = {
    'gauteng': 'Gauteng',
    'kwazulu-natal': 'KwaZulu-Natal',
    'kwazulu natal': 'KwaZulu-Natal',
    'kzn': 'KwaZulu-Natal',
    'western cape': 'Western Cape',
    'eastern cape': 'Eastern Cape',
    'free state': 'Free State',
    'limpopo': 'Limpopo',
    'mpumalanga': 'Mpumalanga',
    'north west': 'North West',
    'northwest': 'North West',
    'northern cape': 'Northern Cape',
  };
  return variations[lower] || null;
}

async function provinceFromNominatim(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'ContactBulkNotification/1.0 (https://github.com/Revi-Sicko/bulk)',
      },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      address?: { state?: string; region?: string; county?: string };
    };
    const addr = data.address;
    if (!addr) return null;
    const raw = addr.state || addr.region || addr.county;
    if (!raw) return null;
    return normalizeProvinceName(raw);
  } catch {
    return null;
  }
}

type BBox = { name: typeof PROVINCES[number]; minLat: number; maxLat: number; minLng: number; maxLng: number };

const SA_BOXES: BBox[] = [
  { name: 'KwaZulu-Natal', minLat: -30.8, maxLat: -26.5, minLng: 28.5, maxLng: 32.95 },
  { name: 'Gauteng', minLat: -26.55, maxLat: -25.35, minLng: 27.8, maxLng: 28.55 },
  { name: 'Western Cape', minLat: -34.9, maxLat: -30.0, minLng: 17.5, maxLng: 22.85 },
  { name: 'Eastern Cape', minLat: -34.2, maxLat: -30.0, minLng: 22.85, maxLng: 30.0 },
  { name: 'Free State', minLat: -30.8, maxLat: -27.2, minLng: 25.0, maxLng: 29.75 },
  { name: 'Limpopo', minLat: -25.8, maxLat: -22.0, minLng: 26.5, maxLng: 31.2 },
  { name: 'Mpumalanga', minLat: -27.2, maxLat: -24.5, minLng: 28.5, maxLng: 31.65 },
  { name: 'North West', minLat: -28.0, maxLat: -24.5, minLng: 22.0, maxLng: 27.8 },
  { name: 'Northern Cape', minLat: -32.0, maxLat: -24.5, minLng: 16.45, maxLng: 25.0 },
];

function provinceFromBoundingBoxes(lat: number, lng: number): string | null {
  for (const b of SA_BOXES) {
    if (lat >= b.minLat && lat <= b.maxLat && lng >= b.minLng && lng <= b.maxLng) {
      return b.name;
    }
  }
  return null;
}

export async function resolveProvinceFromLatLng(lat: number, lng: number): Promise<string> {
  if (Number.isNaN(lat) || Number.isNaN(lng)) return 'unknown';
  if (lat < -35 || lat > -22 || lng < 16 || lng > 33) return 'unknown';

  const openCage = await getProvinceFromCoordinates(lat, lng);
  if (openCage && openCage !== 'unknown') return openCage;

  const nominatim = await provinceFromNominatim(lat, lng);
  if (nominatim) return nominatim;

  const bbox = provinceFromBoundingBoxes(lat, lng);
  if (bbox) return bbox;

  return 'unknown';
}
