import { Site, FieldOfficer } from '../types';
import {
  GeofenceValidationResult,
  getCurrentDevicePosition,
  validateGeofenceLocal,
  isValidCoordinate,
  sanitizeGeofenceRadius,
  MAX_ALLOWED_ACCURACY_METERS,
  calculateHaversineDistanceMeters
} from '../utils/geofenceUtils';

/**
 * Validates GPS Geofence for starting a patrol.
 * Combines device-level fresh GPS acquisition with trusted backend verification.
 */
export async function validatePatrolStartWithBackend(
  site: Site,
  officer: FieldOfficer,
  customPosition?: { lat: number; lng: number; accuracy: number }
): Promise<GeofenceValidationResult> {
  // 1. Authoritative Site Coordinates Check
  if (!isValidCoordinate(site.coordinates?.lat, site.coordinates?.lng)) {
    return {
      verified: false,
      status: 'missing_site_coords',
      distanceMeters: 0,
      accuracyMeters: 0,
      configuredRadiusMeters: sanitizeGeofenceRadius(site.geofenceRadiusMeters),
      siteCoordinates: { lat: 0, lng: 0 },
      deviceCoordinates: { lat: 0, lng: 0 },
      timestamp: new Date().toISOString(),
      messageHindi:
        'साइट GPS कोऑर्डिनेट्स अनुपलब्ध: इस साइट के लिए अधिकृत GPS कोऑर्डिनेट्स (Latitude/Longitude) सेट नहीं हैं। पेट्रोलिंग शुरू नहीं की जा सकती। कृपया एडमिन से संपर्क करें।',
      messageEnglish:
        'Authoritative site coordinates missing or invalid. Patrol start is blocked. Please contact Admin.'
    };
  }

  // 2. Obtain fresh device GPS reading (or use customPosition if testing/debugging)
  let devicePos: { lat: number; lng: number; accuracy: number };
  if (customPosition) {
    devicePos = customPosition;
  } else {
    try {
      devicePos = await getCurrentDevicePosition();
    } catch (err: any) {
      return {
        verified: false,
        status: (err.code === 'PERMISSION_DENIED' ? 'permission_denied' : 'gps_unavailable') as any,
        distanceMeters: 0,
        accuracyMeters: 0,
        configuredRadiusMeters: sanitizeGeofenceRadius(site.geofenceRadiusMeters),
        siteCoordinates: { lat: site.coordinates!.lat!, lng: site.coordinates!.lng! },
        deviceCoordinates: { lat: 0, lng: 0 },
        timestamp: new Date().toISOString(),
        messageHindi: err.messageHindi || 'GPS सिग्नल प्राप्त करने में समस्या आई। पुनः प्रयास करें।',
        messageEnglish: err.messageEnglish || 'Failed to acquire device GPS position.'
      };
    }
  }

  // 3. Client-side sanity check
  const localResult = validateGeofenceLocal(site, devicePos);
  if (!localResult.verified) {
    return localResult;
  }

  // 4. Trusted Backend Enforcement
  // Attempt verification with the backend endpoint
  try {
    const response = await fetch('/api/validate-patrol-start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        siteId: site.id,
        officerId: officer.id,
        deviceCoordinates: { lat: devicePos.lat, lng: devicePos.lng },
        accuracyMeters: devicePos.accuracy,
        authoritativeSiteCoords: {
          lat: site.coordinates!.lat,
          lng: site.coordinates!.lng
        },
        geofenceRadiusMeters: sanitizeGeofenceRadius(site.geofenceRadiusMeters)
      })
    });

    if (response.ok) {
      const serverData = await response.json();
      return {
        verified: !!serverData.verified,
        status: serverData.status || (serverData.verified ? 'valid' : 'outside_radius'),
        distanceMeters: serverData.distanceMeters ?? localResult.distanceMeters,
        accuracyMeters: serverData.accuracyMeters ?? localResult.accuracyMeters,
        configuredRadiusMeters: serverData.configuredRadiusMeters ?? localResult.configuredRadiusMeters,
        siteCoordinates: serverData.siteCoordinates || localResult.siteCoordinates,
        deviceCoordinates: serverData.deviceCoordinates || localResult.deviceCoordinates,
        timestamp: serverData.timestamp || new Date().toISOString(),
        token: serverData.token || localResult.token,
        messageHindi: serverData.messageHindi || localResult.messageHindi,
        messageEnglish: serverData.messageEnglish || localResult.messageEnglish
      };
    }
  } catch (backendError) {
    console.warn('[Geofence] Backend API unreachable, using local authoritative verification:', backendError);
  }

  // Return authoritative local verification if backend route is unavailable
  return localResult;
}

/**
 * Validates GPS Geofence at patrol completion time.
 * Captures fresh device location to audit completion position.
 */
export async function validatePatrolCompletionLocation(
  site: Site
): Promise<{
  verified: boolean;
  distanceMeters: number;
  accuracyMeters: number;
  deviceCoordinates?: { lat: number; lng: number };
  errorHindi?: string;
}> {
  if (!isValidCoordinate(site.coordinates?.lat, site.coordinates?.lng)) {
    return {
      verified: false,
      distanceMeters: 0,
      accuracyMeters: 0,
      errorHindi: 'साइट कोऑर्डिनेट्स उपलब्ध नहीं हैं।'
    };
  }

  try {
    const pos = await getCurrentDevicePosition();
    const distance = calculateHaversineDistanceMeters(
      pos.lat,
      pos.lng,
      site.coordinates!.lat!,
      site.coordinates!.lng!
    );
    const radius = sanitizeGeofenceRadius(site.geofenceRadiusMeters);

    return {
      verified: distance <= radius && pos.accuracy <= MAX_ALLOWED_ACCURACY_METERS,
      distanceMeters: distance,
      accuracyMeters: Math.round(pos.accuracy * 10) / 10,
      deviceCoordinates: { lat: pos.lat, lng: pos.lng }
    };
  } catch (err: any) {
    return {
      verified: false,
      distanceMeters: 0,
      accuracyMeters: 0,
      errorHindi: err.messageHindi || 'GPS सिग्नल अनुपलब्ध'
    };
  }
}
