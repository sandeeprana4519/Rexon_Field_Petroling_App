import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  doc, 
  getDoc 
} from 'firebase/firestore';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// मिडलवेयर
app.use(cors());
app.use(express.json());

// Firebase Configuration (आपकी .env फ़ाइल से लोड होगी)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// ==========================================
// 1. API ROUTES (यहाँ आपकी सभी API होंगी)
// ==========================================

// Helper: Haversine Distance in meters
function calculateHaversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function isValidCoordinate(lat, lng) {
  if (lat == null || lng == null) return false;
  const numLat = Number(lat);
  const numLng = Number(lng);
  if (isNaN(numLat) || isNaN(numLng)) return false;
  if (numLat < -90 || numLat > 90 || numLng < -180 || numLng > 180) return false;
  if (Math.abs(numLat) < 0.0001 && Math.abs(numLng) < 0.0001) return false;
  return true;
}

// API स्टेटस चेक
app.get('/api/status', (req, res) => {
  res.json({
    status: 'success',
    message: 'Rexon Patrolling API is live and healthy',
    timestamp: new Date().toISOString()
  });
});

// POST: Trusted Server-Side Geofencing Validation
app.post('/api/validate-patrol-start', async (req, res) => {
  try {
    const { siteId, officerId, deviceCoordinates, accuracyMeters, companyId = 'rexon-security' } = req.body;

    if (!siteId || !deviceCoordinates) {
      return res.status(400).json({
        success: false,
        verified: false,
        messageHindi: 'अमान्य अनुरोध: साइट आईडी या डिवाइस कोऑर्डिनेट्स अनुपलब्ध हैं।',
        messageEnglish: 'siteId and deviceCoordinates are required.'
      });
    }

    const devLat = Number(deviceCoordinates.lat);
    const devLng = Number(deviceCoordinates.lng);
    const devAcc = Math.round(Number(accuracyMeters || 999) * 10) / 10;

    if (isNaN(devLat) || isNaN(devLng)) {
      return res.status(400).json({
        success: false,
        verified: false,
        messageHindi: 'अमान्य डिवाइस GPS कोऑर्डिनेट्स।',
        messageEnglish: 'Invalid device coordinates.'
      });
    }

    // 1. Fetch site document
    let siteData = null;
    try {
      const siteDocRef = doc(db, 'companies', companyId, 'sites', siteId);
      const siteSnap = await getDoc(siteDocRef);
      if (siteSnap.exists()) {
        siteData = siteSnap.data();
      } else {
        // Fallback root collection check
        const rootSiteRef = doc(db, 'sites', siteId);
        const rootSnap = await getDoc(rootSiteRef);
        if (rootSnap.exists()) {
          siteData = rootSnap.data();
        }
      }
    } catch (e) {
      console.warn('[Server Geofence] DB lookup warning:', e.message);
    }

    // 2. Fallback to site data if passed in payload securely or if DB is offline
    if (!siteData && req.body.authoritativeSiteCoords) {
      siteData = {
        coordinates: req.body.authoritativeSiteCoords,
        geofenceRadiusMeters: req.body.geofenceRadiusMeters || 50
      };
    }

    if (!siteData || !isValidCoordinate(siteData.coordinates?.lat, siteData.coordinates?.lng)) {
      return res.status(200).json({
        success: false,
        verified: false,
        status: 'missing_site_coords',
        code: 'MISSING_SITE_COORDINATES',
        messageHindi: 'साइट GPS कोऑर्डिनेट्स अनुपलब्ध: इस साइट के लिए अधिकृत GPS कोऑर्डिनेट्स सेट नहीं हैं।',
        messageEnglish: 'Site has no valid authoritative GPS coordinates.'
      });
    }

    const siteLat = Number(siteData.coordinates.lat);
    const siteLng = Number(siteData.coordinates.lng);
    const radius = Math.min(100, Math.max(50, Number(siteData.geofenceRadiusMeters || 50)));

    // 3. Accuracy threshold check (max 20m)
    if (devAcc > 20) {
      return res.status(200).json({
        success: false,
        verified: false,
        status: 'inaccurate',
        code: 'INACCURATE_GPS',
        accuracyMeters: devAcc,
        messageHindi: `GPS सिग्नल सटीकता अपर्याप्त (±${Math.round(devAcc)}m): अधिकतम 20 मीटर सटीकता आवश्यक है।`,
        messageEnglish: `Reported accuracy exceeds 20m threshold.`
      });
    }

    // 4. Calculate Distance
    const distance = calculateHaversineDistanceMeters(devLat, devLng, siteLat, siteLng);

    // 5. Check Geofence Boundary
    if (distance > radius) {
      return res.status(200).json({
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
      });
    }

    const validationToken = `GEO-SRV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    return res.status(200).json({
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
      token: validationToken,
      messageHindi: `GPS जियोफेंस सत्यापित: आप साइट की परिधि के अंदर हैं (दूरी: ${Math.round(distance)}m, सटीकता: ±${Math.round(devAcc)}m)।`,
      messageEnglish: `GPS geofence verified inside ${radius}m perimeter.`
    });
  } catch (error) {
    res.status(500).json({ success: false, verified: false, error: error.message });
  }
});

// GET: सभी साइट्स फेच करें
app.get('/api/sites', async (req, res) => {
  try {
    const querySnapshot = await getDocs(collection(db, 'sites'));
    const sites = querySnapshot.docs.map(document => ({
      id: document.id,
      ...document.data()
    }));
    res.status(200).json({ success: true, count: sites.length, data: sites });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST: नई साइट क्रिएट करें
app.post('/api/sites', async (req, res) => {
  try {
    const siteData = req.body;
    if (!siteData.name && !siteData.siteName) {
      return res.status(400).json({ success: false, message: 'Site name is required' });
    }

    const docRef = await addDoc(collection(db, 'sites'), {
      ...siteData,
      createdAt: new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      message: 'Site created successfully',
      id: docRef.id
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST: पेट्रोलिंग लॉग या चेकपॉइंट रिपोर्ट सबमिट करें
app.post('/api/patrol-logs', async (req, res) => {
  try {
    const logData = req.body;
    const docRef = await addDoc(collection(db, 'patrol_logs'), {
      ...logData,
      createdAt: new Date().toISOString()
    });
    res.status(201).json({ success: true, id: docRef.id });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 2. FRONTEND SERVE (Vite के dist फ़ोल्डर के लिए)
// ==========================================
// जब कोई API कॉल नहीं होगी, तो यह Vite की वेबसाइट खोलेगा
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// सर्वर स्टार्ट
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});