import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register Service Worker for PWA compliance
if ('serviceWorker' in navigator && process.env.NODE_ENV !== 'test') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('Rexon PWA Service Worker registered with scope:', registration.scope);
      })
      .catch((error) => {
        console.warn('PWA Service Worker registration note:', error);
      });
  });
}

createRoot(document.getElementById('root')!).render(<App />);
