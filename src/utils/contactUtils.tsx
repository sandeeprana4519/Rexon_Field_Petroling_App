import React from 'react';

/**
 * Direct 1-Click Phone Call (tel:) & WhatsApp (wa.me) Communication Helpers
 */

export const cleanPhoneNumber = (phone: string): string => {
  return phone.replace(/[^0-9]/g, '');
};

export const getCallUrl = (phone: string): string => {
  const clean = phone.replace(/[^0-9+]/g, '');
  return `tel:${clean}`;
};

export const getWhatsAppUrl = (phone: string, message?: string): string => {
  let clean = phone.replace(/[^0-9]/g, '');
  // Default to standard prefix if 10-digit mobile number provided
  if (clean.length === 10) {
    clean = `91${clean}`;
  } else if (clean.startsWith('0') && clean.length === 11) {
    clean = `91${clean.slice(1)}`;
  }
  const baseUrl = `https://wa.me/${clean}`;
  return message ? `${baseUrl}?text=${encodeURIComponent(message)}` : baseUrl;
};

export const REXON_ADMIN_CONTACT = {
  name: 'REXON Central Operations Control Room',
  phone: '+91 98765 43210',
  email: 'ops@rexon.com',
  available: '24/7 Live Monitoring & Dispatch'
};

/**
 * Recognizable WhatsApp Brand Icon
 */
export const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M17.472 14.382c-.301-.15-1.782-.879-2.057-.98-.276-.1-.476-.15-.677.15-.201.301-.778.98-.954 1.18-.175.201-.351.226-.652.075-.301-.15-1.272-.469-2.423-1.496-.896-.799-1.501-1.787-1.677-2.088-.175-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.175.201-.301.301-.502.101-.201.05-.376-.025-.526-.075-.15-.677-1.631-.928-2.235-.245-.589-.494-.509-.677-.518-.175-.009-.376-.01-.577-.01-.201 0-.527.075-.803.376s-1.054 1.029-1.054 2.509 1.079 2.909 1.229 3.11c.15.201 2.122 3.24 5.141 4.544.718.31 1.279.495 1.716.634.721.229 1.377.197 1.896.119.579-.087 1.782-.728 2.033-1.43.251-.702.251-1.304.176-1.43-.076-.126-.276-.201-.577-.352zM12 2C6.477 2 2 6.477 2 12c0 1.954.563 3.778 1.536 5.323L2 22l4.823-1.508C8.307 21.393 10.098 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.25c-1.637 0-3.155-.494-4.431-1.34l-.317-.209-2.862.895.908-2.775-.224-.336C4.168 15.158 3.65 13.627 3.65 12c0-4.604 3.746-8.35 8.35-8.35s8.35 3.746 8.35 8.35-3.746 8.35-8.35 8.35z" />
  </svg>
);
