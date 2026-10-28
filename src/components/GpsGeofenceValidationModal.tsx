import React, { useState, useEffect } from 'react';
import {
  Shield,
  MapPin,
  Compass,
  AlertTriangle,
  CheckCircle2,
  X,
  RefreshCw,
  Navigation,
  ArrowRight,
  Lock,
  ExternalLink,
  Info,
  Radio,
  Sliders
} from 'lucide-react';
import { Site, FieldOfficer } from '../types';
import {
  GeofenceValidationResult,
  isValidCoordinate,
  sanitizeGeofenceRadius,
  MAX_ALLOWED_ACCURACY_METERS,
  MIN_GEOFENCE_RADIUS_METERS,
  MAX_GEOFENCE_RADIUS_METERS,
  calculateHaversineDistanceMeters
} from '../utils/geofenceUtils';
import { validatePatrolStartWithBackend } from '../services/geofenceService';
import { getGoogleMapsNavUrl } from '../utils/mapUtils';

interface GpsGeofenceValidationModalProps {
  site: Site;
  officer: FieldOfficer;
  scheduledTime?: string;
  onClose: () => void;
  onValidationSuccess: (result: GeofenceValidationResult) => void;
}

export const GpsGeofenceValidationModal: React.FC<GpsGeofenceValidationModalProps> = ({
  site,
  officer,
  scheduledTime,
  onClose,
  onValidationSuccess
}) => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<GeofenceValidationResult | null>(null);
  const [isTestModeExpanded, setIsTestModeExpanded] = useState(false);
  const [activeTestScenario, setActiveTestScenario] = useState<string | null>(null);

  const radius = sanitizeGeofenceRadius(site.geofenceRadiusMeters);
  const hasValidSiteCoords = isValidCoordinate(site.coordinates?.lat, site.coordinates?.lng);

  // Execute validation on mount with fresh GPS
  useEffect(() => {
    runValidation();
  }, []);

  const runValidation = async (customCoords?: { lat: number; lng: number; accuracy: number }) => {
    setIsValidating(true);
    try {
      const res = await validatePatrolStartWithBackend(site, officer, customCoords);
      setValidationResult(res);
    } catch (err: any) {
      setValidationResult({
        verified: false,
        status: 'gps_unavailable',
        distanceMeters: 0,
        accuracyMeters: 0,
        configuredRadiusMeters: radius,
        siteCoordinates: {
          lat: site.coordinates?.lat || 0,
          lng: site.coordinates?.lng || 0
        },
        deviceCoordinates: { lat: 0, lng: 0 },
        timestamp: new Date().toISOString(),
        messageHindi: err?.messageHindi || 'GPS सिग्नल प्राप्त करने में समस्या आई। पुनः प्रयास करें।',
        messageEnglish: err?.messageEnglish || 'Failed to acquire device GPS position.'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleStartPatrolConfirmed = () => {
    if (!validationResult || !validationResult.verified) return;
    onValidationSuccess(validationResult);
  };

  /**
   * Test Scenarios allowing complete verification of edge cases
   */
  const handleRunTestScenario = (scenario: 'inside' | 'boundary' | 'outside' | 'inaccurate' | 'denied') => {
    setActiveTestScenario(scenario);
    if (!hasValidSiteCoords) {
      runValidation();
      return;
    }

    const sLat = site.coordinates!.lat!;
    const sLng = site.coordinates!.lng!;

    // 1 deg lat ≈ 111,000 meters. 0.0001 deg ≈ 11.1 meters
    if (scenario === 'inside') {
      // 15 meters away, high accuracy (±4m)
      const offset = 15 / 111000;
      runValidation({ lat: sLat + offset, lng: sLng, accuracy: 4.2 });
    } else if (scenario === 'boundary') {
      // Exactly near radius boundary (e.g. 48 meters if radius is 50m), high accuracy
      const boundaryDist = Math.max(10, radius - 2);
      const offset = boundaryDist / 111000;
      runValidation({ lat: sLat + offset, lng: sLng, accuracy: 5.0 });
    } else if (scenario === 'outside') {
      // 130 meters away (outside 50m radius)
      const offset = 130 / 111000;
      runValidation({ lat: sLat + offset, lng: sLng, accuracy: 6.5 });
    } else if (scenario === 'inaccurate') {
      // 20 meters away, but poor GPS accuracy (±38m, exceeds 20m threshold)
      const offset = 20 / 111000;
      runValidation({ lat: sLat + offset, lng: sLng, accuracy: 38.0 });
    } else if (scenario === 'denied') {
      setValidationResult({
        verified: false,
        status: 'permission_denied',
        distanceMeters: 0,
        accuracyMeters: 0,
        configuredRadiusMeters: radius,
        siteCoordinates: { lat: sLat, lng: sLng },
        deviceCoordinates: { lat: 0, lng: 0 },
        timestamp: new Date().toISOString(),
        messageHindi:
          'लोकेशन अनुमति अस्वीकृत (Location Permission Denied): कृपया ब्राउज़र या मोबाइल सेटिंग्स में लोकेशन की अनुमति दें और पुनः प्रयास करें।',
        messageEnglish: 'Location permission was denied by user or system policy.'
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-[#FFFFFF] border border-[#E7DED2] rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 text-[#4B3621] relative max-h-[90vh] overflow-y-auto">
        {/* Header Strip */}
        <div className="flex items-start justify-between gap-3 border-b border-[#E7DED2] pb-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs ${
                validationResult?.verified
                  ? 'bg-[#1B5E20]'
                  : validationResult && !validationResult.verified
                  ? 'bg-[#C62828]'
                  : 'bg-[#6F4E37]'
              }`}
            >
              <Compass className={`w-5 h-5 ${isValidating ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#4B3621] tracking-tight">
                GPS Geofence Validation
              </h2>
              <p className="text-[11px] text-[#8B735B] font-mono">
                पेट्रोलिंग पूर्व अनिवार्य लोकेशन सत्यापन
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8B735B] hover:text-[#4B3621] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Site Details Card */}
        <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E7DED2] space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <div className="font-bold text-[#4B3621] truncate pr-2">{site.name}</div>
            <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-[#E8D8C5] text-[#4B3621] border border-[#D5C2AD] shrink-0">
              {site.code}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-[#8B735B] block text-[10px]">अधिकृत साइट निर्देशांक (Authoritative Coordinates):</span>
              <span className="font-mono font-semibold text-[#4B3621] block truncate">
                {hasValidSiteCoords
                  ? `${site.coordinates!.lat!.toFixed(5)}, ${site.coordinates!.lng!.toFixed(5)}`
                  : '⚠️ कोऑर्डिनेट्स सेट नहीं हैं (Missing)'}
              </span>
            </div>
            <div>
              <span className="text-[#8B735B] block text-[10px]">अनुमत जियोफेंस परिधि (Allowed Radius):</span>
              <span className="font-mono font-bold text-[#1B5E20] block">
                {radius} मीटर ({MIN_GEOFENCE_RADIUS_METERS}–{MAX_GEOFENCE_RADIUS_METERS}m सीमा)
              </span>
            </div>
          </div>
        </div>

        {/* Live Validation Status Display */}
        {isValidating ? (
          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E7DED2] flex flex-col items-center justify-center text-center space-y-2 py-6">
            <div className="w-8 h-8 border-3 border-[#6F4E37]/30 border-t-[#6F4E37] rounded-full animate-spin" />
            <div className="text-xs font-bold text-[#4B3621]">ताज़ा GPS लोकेशन जांची जा रही है...</div>
            <div className="text-[11px] text-[#8B735B]">
              Fetching real-time GPS coordinates and validating with backend...
            </div>
          </div>
        ) : validationResult ? (
          <div
            className={`p-4 rounded-2xl border space-y-3 ${
              validationResult.verified
                ? 'bg-[#E8F5E9] border-[#C8E6C9] text-[#1B5E20]'
                : 'bg-[#FFEBEE] border-[#FFCDD2] text-[#C62828]'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {validationResult.verified ? (
                <CheckCircle2 className="w-5 h-5 text-[#2E7D32] shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-[#C62828] shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <div className="font-bold text-xs sm:text-sm">
                  {validationResult.verified ? 'जियोफेंस सत्यापन सफल (Verified)' : 'सत्यापन अस्वीकृत (Validation Blocked)'}
                </div>
                <p className="text-xs leading-relaxed font-medium">
                  {validationResult.messageHindi}
                </p>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-[11px] font-mono">
              <div className="p-2 rounded-xl bg-white/80 border border-black/5">
                <span className="text-[#8B735B] block text-[10px]">साइट से दूरी:</span>
                <strong className={validationResult.verified ? 'text-[#1B5E20]' : 'text-[#C62828]'}>
                  {validationResult.distanceMeters > 0
                    ? `${Math.round(validationResult.distanceMeters)}m`
                    : 'N/A'}
                </strong>
                <span className="text-[9px] text-[#8B735B] block">(Max: {radius}m)</span>
              </div>

              <div className="p-2 rounded-xl bg-white/80 border border-black/5">
                <span className="text-[#8B735B] block text-[10px]">GPS सटीकता:</span>
                <strong className={validationResult.accuracyMeters <= MAX_ALLOWED_ACCURACY_METERS ? 'text-[#1B5E20]' : 'text-[#C62828]'}>
                  {validationResult.accuracyMeters > 0
                    ? `±${Math.round(validationResult.accuracyMeters)}m`
                    : 'N/A'}
                </strong>
                <span className="text-[9px] text-[#8B735B] block">(Max: {MAX_ALLOWED_ACCURACY_METERS}m)</span>
              </div>

              <div className="col-span-2 sm:col-span-1 p-2 rounded-xl bg-white/80 border border-black/5">
                <span className="text-[#8B735B] block text-[10px]">सत्यापन स्थिति:</span>
                <strong className={validationResult.verified ? 'text-[#1B5E20]' : 'text-[#C62828]'}>
                  {validationResult.verified ? 'AUTHORIZED' : 'BLOCKED'}
                </strong>
                <span className="text-[9px] text-[#8B735B] block">
                  {validationResult.token ? 'Token Issued' : 'No Token'}
                </span>
              </div>
            </div>
          </div>
        ) : null}

        {/* Live Retry / Navigate Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            disabled={isValidating}
            onClick={() => {
              setActiveTestScenario(null);
              runValidation();
            }}
            className="flex-1 py-2 px-3 rounded-xl bg-[#FAF7F2] hover:bg-[#F0E8DD] text-[#4B3621] border border-[#E7DED2] text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#6F4E37] ${isValidating ? 'animate-spin' : ''}`} />
            <span>पुनः जांचें (Re-Check Fresh GPS)</span>
          </button>

          {hasValidSiteCoords && (
            <a
              href={getGoogleMapsNavUrl(site)}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 px-3 rounded-xl bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0"
              title="Open Google Maps to navigate to site"
            >
              <Navigation className="w-3.5 h-3.5 text-white fill-white" />
              <span>साइट नेविगेशन</span>
            </a>
          )}
        </div>

        {/* Developer & Admin Test Suite Strip */}
        <div className="border-t border-[#E7DED2] pt-3">
          <button
            type="button"
            onClick={() => setIsTestModeExpanded(!isTestModeExpanded)}
            className="w-full flex items-center justify-between text-[11px] font-bold text-[#8B735B] hover:text-[#4B3621] py-1 cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-[#6F4E37]" />
              <span>🧪 Geofence Test Modes / टेस्ट परिदृश्य (Edge Cases)</span>
            </div>
            <span className="text-[10px] underline">
              {isTestModeExpanded ? 'Hide Tests' : 'Show Tests'}
            </span>
          </button>

          {isTestModeExpanded && (
            <div className="mt-2 p-3 rounded-xl bg-[#FAF7F2] border border-[#E7DED2] space-y-2 text-xs">
              <p className="text-[10px] text-[#8B735B] leading-tight">
                विभिन्न भौगोलिक व सिस्टम परिदृश्यों (Inside, Outside, Inaccurate, Denied) की सीधे जांच करें:
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleRunTestScenario('inside')}
                  className={`p-2 rounded-lg text-[11px] font-bold text-left border transition-all cursor-pointer ${
                    activeTestScenario === 'inside'
                      ? 'bg-[#E8F5E9] border-[#2E7D32] text-[#1B5E20]'
                      : 'bg-white border-[#E7DED2] text-[#4B3621] hover:bg-[#F0E8DD]'
                  }`}
                >
                  <div className="text-[#1B5E20]">✓ परिधि अंदर (15m)</div>
                  <div className="text-[9px] text-[#8B735B]">±4m सटीकता (Valid)</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleRunTestScenario('boundary')}
                  className={`p-2 rounded-lg text-[11px] font-bold text-left border transition-all cursor-pointer ${
                    activeTestScenario === 'boundary'
                      ? 'bg-[#E8F5E9] border-[#2E7D32] text-[#1B5E20]'
                      : 'bg-white border-[#E7DED2] text-[#4B3621] hover:bg-[#F0E8DD]'
                  }`}
                >
                  <div className="text-[#1B5E20]">✓ सीमा के पास (48m)</div>
                  <div className="text-[9px] text-[#8B735B]">बाउंड्री टेस्ट (Valid)</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleRunTestScenario('outside')}
                  className={`p-2 rounded-lg text-[11px] font-bold text-left border transition-all cursor-pointer ${
                    activeTestScenario === 'outside'
                      ? 'bg-[#FFEBEE] border-[#C62828] text-[#C62828]'
                      : 'bg-white border-[#E7DED2] text-[#4B3621] hover:bg-[#F0E8DD]'
                  }`}
                >
                  <div className="text-[#C62828]">✗ परिधि बाहर (130m)</div>
                  <div className="text-[9px] text-[#8B735B]">Outside Radius (Fail)</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleRunTestScenario('inaccurate')}
                  className={`p-2 rounded-lg text-[11px] font-bold text-left border transition-all cursor-pointer ${
                    activeTestScenario === 'inaccurate'
                      ? 'bg-[#FFEBEE] border-[#C62828] text-[#C62828]'
                      : 'bg-white border-[#E7DED2] text-[#4B3621] hover:bg-[#F0E8DD]'
                  }`}
                >
                  <div className="text-[#C62828]">✗ खराब GPS (±38m)</div>
                  <div className="text-[9px] text-[#8B735B]">Accuracy &gt; 20m (Fail)</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleRunTestScenario('denied')}
                  className={`p-2 rounded-lg text-[11px] font-bold text-left border transition-all cursor-pointer col-span-2 ${
                    activeTestScenario === 'denied'
                      ? 'bg-[#FFEBEE] border-[#C62828] text-[#C62828]'
                      : 'bg-white border-[#E7DED2] text-[#4B3621] hover:bg-[#F0E8DD]'
                  }`}
                >
                  <div className="text-[#C62828]">✗ लोकेशन परमिशन ब्लॉक (Permission Denied)</div>
                  <div className="text-[9px] text-[#8B735B]">सिमुलेट परमिशन रिजेक्शन</div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Primary Action Button */}
        <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#E7DED2]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#F0E8DD] text-[#4B3621] border border-[#E7DED2] text-xs font-semibold cursor-pointer transition-colors"
          >
            रद्द करें (Cancel)
          </button>

          <button
            type="button"
            disabled={!validationResult?.verified || isValidating}
            onClick={handleStartPatrolConfirmed}
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-[#6F4E37] hover:bg-[#5A3E2B] text-white text-xs font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>पेट्रोलिंग शुरू करें (Start Patrol)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
