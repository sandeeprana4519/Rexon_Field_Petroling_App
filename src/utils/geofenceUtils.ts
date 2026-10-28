import { Site } from '../types';

/**
 * REXON GPS Geofencing Standards & Validation Utilities
 */
export const DEFAULT_GEOFENCE_RADIUS_METERS = 50;
export const MIN_GEOFENCE_RADIUS_METERS = 50;
export const MAX_GEOFENCE_RADIUS_METERS = 100;
export const MAX_ALLOWED_ACCURACY_METERS = 20;

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface RawDevicePosition {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

export type GeofenceValidationStatus =
  | 'valid'
  | 'outside_radius'
  | 'inaccurate'
  | 'missing_site_coords'
  | 'permission_denied'
  | 'gps_unavailable'
  | 'unassigned_site'
  | 'officer_inactive';

export interface GeofenceValidationResult {
  verified: boolean;
  status: GeofenceValidationStatus;
  distanceMeters: number;
  accuracyMeters: number;
  configuredRadiusMeters: number;
  siteCoordinates: Coordinates;
  deviceCoordinates: Coordinates;
  timestamp: string;
  token?: string;
  messageHindi: string;
  messageEnglish: string;
}

/**
 * Checks whether coordinates are valid geographic latitude and longitude.
 * Excludes (0,0) [Null Island], NaN, out-of-range, and nullish values.
 */
export function isValidCoordinate(lat?: number | null, lng?: number | null): boolean {
  if (lat == null || lng == null) return false;
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (isNaN(lat) || isNaN(lng)) return false;
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;
  // Null Island check: lat=0, lng=0 is not a legitimate security installation site
  if (Math.abs(lat) < 0.0001 && Math.abs(lng) < 0.0001) return false;
  return true;
}

/**
 * Clamps geofence radius strictly to the permitted 50-100 meter range, defaulting to 50m.
 */
export function sanitizeGeofenceRadius(radius?: number | null): number {
  if (radius == null || isNaN(radius)) return DEFAULT_GEOFENCE_RADIUS_METERS;
  return Math.min(
    MAX_GEOFENCE_RADIUS_METERS,
    Math.max(MIN_GEOFENCE_RADIUS_METERS, Math.round(radius))
  );
}

/**
 * Calculates high-precision distance between two geographic points using Haversine formula.
 * Returns distance in meters.
 */
export function calculateHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Mean radius of the Earth in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaPhi = toRad(lat2 - lat1);
  const deltaLambda = toRad(lon2 - lon1);

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  // Round to 1 decimal place
  return Math.round(distance * 10) / 10;
}

/**
 * Requests fresh GPS position from browser/device navigator.geolocation with maximumAge: 0.
 */
export function getCurrentDevicePosition(): Promise<RawDevicePosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject({
        code: 'NOT_SUPPORTED',
        messageHindi: 'इस डिवाइस या ब्राउज़र में Geolocation समर्थित नहीं है।',
        messageEnglish: 'Geolocation is not supported by this device or browser.'
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp
        });
      },
      (err) => {
        let messageHindi = 'GPS सिग्नल प्राप्त करने में समस्या आई। पुनः प्रयास करें।';
        let messageEnglish = err.message || 'Error acquiring GPS location.';
        let code: string = 'UNKNOWN';

        if (err.code === 1 /* PERMISSION_DENIED */) {
          code = 'PERMISSION_DENIED';
          messageHindi =
            'लोकेशन अनुमति अस्वीकृत (Location Permission Denied): कृपया ब्राउज़र या मोबाइल सेटिंग्स में लोकेशन की अनुमति दें और पुनः प्रयास करें।';
        } else if (err.code === 2 /* POSITION_UNAVAILABLE */) {
          code = 'POSITION_UNAVAILABLE';
          messageHindi =
            'GPS सिग्नल अनुपलब्ध (GPS Signal Unavailable): डिवाइस का लोकेशन सिग्नल प्राप्त नहीं हो सका। कृपया खुले स्थान में जाकर पुनः प्रयास करें।';
        } else if (err.code === 3 /* TIMEOUT */) {
          code = 'TIMEOUT';
          messageHindi =
            'GPS समय समाप्त (Location Request Timed Out): लोकेशन प्राप्त करने का समय समाप्त हो गया। कृपया पुनः प्रयास करें।';
        }

        reject({ code, messageHindi, messageEnglish });
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0 // Do not use cached position
      }
    );
  });
}

/**
 * Validates GPS position against authoritative site coordinates and radius.
 * Evaluates missing coordinates, accuracy threshold (max 20m), and geofence boundary.
 */
export function validateGeofenceLocal(
  site: Site,
  devicePos: { lat: number; lng: number; accuracy: number }
): GeofenceValidationResult {
  const siteLat = site.coordinates?.lat;
  const siteLng = site.coordinates?.lng;

  // 1. Authoritative Site Coordinates Check
  if (!isValidCoordinate(siteLat, siteLng)) {
    return {
      verified: false,
      status: 'missing_site_coords',
      distanceMeters: 0,
      accuracyMeters: devicePos.accuracy || 0,
      configuredRadiusMeters: sanitizeGeofenceRadius(site.geofenceRadiusMeters),
      siteCoordinates: { lat: 0, lng: 0 },
      deviceCoordinates: { lat: devicePos.lat, lng: devicePos.lng },
      timestamp: new Date().toISOString(),
      messageHindi:
        'साइट GPS कोऑर्डिनेट्स अनुपलब्ध: इस साइट के लिए अधिकृत GPS कोऑर्डिनेट्स (Latitude/Longitude) सेट नहीं हैं। पेट्रोलिंग शुरू नहीं की जा सकती। कृपया एडमिन से संपर्क करें।',
      messageEnglish:
        'Authoritative site coordinates missing or invalid. Patrol start is blocked. Please contact Admin.'
    };
  }

  const authoritativeSiteCoords: Coordinates = { lat: siteLat!, lng: siteLng! };
  const radius = sanitizeGeofenceRadius(site.geofenceRadiusMeters);
  const accuracy = Math.round(devicePos.accuracy * 10) / 10;

  // 2. Accuracy Check (Maximum allowed: 20 meters)
  if (accuracy > MAX_ALLOWED_ACCURACY_METERS) {
    return {
      verified: false,
      status: 'inaccurate',
      distanceMeters: 0,
      accuracyMeters: accuracy,
      configuredRadiusMeters: radius,
      siteCoordinates: authoritativeSiteCoords,
      deviceCoordinates: { lat: devicePos.lat, lng: devicePos.lng },
      timestamp: new Date().toISOString(),
      messageHindi: `GPS सिग्नल सटीकता अपर्याप्त (सटीकता: ±${Math.round(accuracy)}m): सुरक्षा नियमों के तहत अधिकतम ${MAX_ALLOWED_ACCURACY_METERS} मीटर सटीकता अनिवार्य है। कृपया खुले आसमान के नीचे जाएं और पुनः प्रयास करें।`,
      messageEnglish: `Reported horizontal GPS accuracy (±${accuracy}m) exceeds the permitted threshold of ${MAX_ALLOWED_ACCURACY_METERS}m.`
    };
  }

  // 3. Haversine Distance Calculation
  const distance = calculateHaversineDistanceMeters(
    devicePos.lat,
    devicePos.lng,
    authoritativeSiteCoords.lat,
    authoritativeSiteCoords.lng
  );

  // 4. Geofence Boundary Verification
  if (distance > radius) {
    return {
      verified: false,
      status: 'outside_radius',
      distanceMeters: distance,
      accuracyMeters: accuracy,
      configuredRadiusMeters: radius,
      siteCoordinates: authoritativeSiteCoords,
      deviceCoordinates: { lat: devicePos.lat, lng: devicePos.lng },
      timestamp: new Date().toISOString(),
      messageHindi: `जियोफेंस सीमा से बाहर (दूरी: ${Math.round(distance)}m, सीमा: ${radius}m): आप साइट की अधिकृत परिधि से बाहर हैं। पेट्रोलिंग केवल साइट पर पहुंचकर ही शुरू की जा सकती है।`,
      messageEnglish: `Outside geofence radius. Measured distance: ${distance}m (Allowed radius: ${radius}m).`
    };
  }

  // 5. Successful Validation
  return {
    verified: true,
    status: 'valid',
    distanceMeters: distance,
    accuracyMeters: accuracy,
    configuredRadiusMeters: radius,
    siteCoordinates: authoritativeSiteCoords,
    deviceCoordinates: { lat: devicePos.lat, lng: devicePos.lng },
    timestamp: new Date().toISOString(),
    token: `GEO-TOKEN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
    messageHindi: `GPS जियोफेंस सत्यापित (GPS Geofence Verified): आप साइट की परिधि के अंदर हैं (दूरी: ${Math.round(distance)}m, सटीकता: ±${Math.round(accuracy)}m)।`,
    messageEnglish: `GPS geofence verified inside ${radius}m perimeter (Distance: ${distance}m, Accuracy: ±${accuracy}m).`
  };
}
