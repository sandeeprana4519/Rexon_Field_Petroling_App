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

// API स्टेटस चेक
app.get('/api/status', (req, res) => {
  res.json({
    status: 'success',
    message: 'Rexon Patrolling API is live and healthy',
    timestamp: new Date().toISOString()
  });
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