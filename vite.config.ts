import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

function geofenceApiPlugin() {
  return {
    name: 'geofence-api-plugin',
    configureServer(server: any) {
      server.middlewares.use('/api/validate-patrol-start', (req: any, res: any) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        let body = '';
        req.on('data', (chunk: any) => {
          body += chunk;
        });

        req.on('end', () => {
          try {
            const data = JSON.parse(body || '{}');
            const { deviceCoordinates, accuracyMeters, authoritativeSiteCoords, geofenceRadiusMeters } = data;

            const devLat = Number(deviceCoordinates?.lat);
            const devLng = Number(deviceCoordinates?.lng);
            const devAcc = Math.round(Number(accuracyMeters || 999) * 10) / 10;

            const siteLat = Number(authoritativeSiteCoords?.lat);
            const siteLng = Number(authoritativeSiteCoords?.lng);

            res.setHeader('Content-Type', 'application/json');

            // 1. Authoritative site coordinates check
            if (
              isNaN(siteLat) ||
              isNaN(siteLng) ||
              siteLat < -90 ||
              siteLat > 90 ||
              siteLng < -180 ||
              siteLng > 180 ||
              (Math.abs(siteLat) < 0.0001 && Math.abs(siteLng) < 0.0001)
            ) {
              res.statusCode = 200;
              res.end(
                JSON.stringify({
                  success: false,
                  verified: false,
                  status: 'missing_site_coords',
                  code: 'MISSING_SITE_COORDINATES',
                  messageHindi:
                    'साइट GPS कोऑर्डिनेट्स अनुपलब्ध: इस साइट के लिए अधिकृत GPS कोऑर्डिनेट्स (Latitude/Longitude) सेट नहीं हैं।',
                  messageEnglish: 'Authoritative site coordinates missing or invalid.'
                })
              );
              return;
            }

            // 2. Accuracy check (max 20m)
            if (devAcc > 20) {
              res.statusCode = 200;
              res.end(
                JSON.stringify({
                  success: false,
                  verified: false,
                  status: 'inaccurate',
                  code: 'INACCURATE_GPS',
                  accuracyMeters: devAcc,
                  messageHindi: `GPS सिग्नल सटीकता अपर्याप्त (±${Math.round(devAcc)}m): सुरक्षा नियमों के तहत अधिकतम 20 मीटर सटीकता अनिवार्य है।`,
                  messageEnglish: 'Reported horizontal accuracy exceeds 20 meters.'
                })
              );
              return;
            }

            // 3. Haversine distance
            const R = 6371000;
            const toRad = (d: number) => (d * Math.PI) / 180;
            const dLat = toRad(siteLat - devLat);
            const dLon = toRad(siteLng - devLng);
            const a =
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(devLat)) * Math.cos(toRad(siteLat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = Math.round(R * c * 10) / 10;

            // 4. Radius (50 - 100m)
            const radius = Math.min(100, Math.max(50, Number(geofenceRadiusMeters || 50)));

            if (distance > radius) {
              res.statusCode = 200;
              res.end(
                JSON.stringify({
                  success: false,
                  verified: false,
                  status: 'outside_radius',
                  code: 'OUTSIDE_GEOFENCE',
                  distanceMeters: distance,
                  configuredRadiusMeters: radius,
                  accuracyMeters: devAcc,
                  siteCoordinates: { lat: siteLat, lng: siteLng },
                  deviceCoordinates: { lat: devLat, lng: devLng },
                  messageHindi: `जियोफेंस सीमा से बाहर (दूरी: ${Math.round(distance)}m, अनुमति: ${radius}m): आप अधिकृत परिधि से बाहर हैं।`,
                  messageEnglish: `Outside geofence radius. Measured: ${distance}m (Allowed: ${radius}m).`
                })
              );
              return;
            }

            // Valid
            const token = `GEO-SRV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
            res.statusCode = 200;
            res.end(
              JSON.stringify({
                success: true,
                verified: true,
                status: 'valid',
                code: 'VERIFIED',
                distanceMeters: distance,
                accuracyMeters: devAcc,
                configuredRadiusMeters: radius,
                siteCoordinates: { lat: siteLat, lng: siteLng },
                deviceCoordinates: { lat: devLat, lng: devLng },
                timestamp: new Date().toISOString(),
                token,
                messageHindi: `GPS जियोफेंस सत्यापित: आप साइट की परिधि के अंदर हैं (दूरी: ${Math.round(distance)}m, सटीकता: ±${Math.round(devAcc)}m)।`,
                messageEnglish: `GPS geofence verified inside ${radius}m perimeter.`
              })
            );
          } catch (e: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: e.message }));
          }
        });
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), geofenceApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: true as const,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
