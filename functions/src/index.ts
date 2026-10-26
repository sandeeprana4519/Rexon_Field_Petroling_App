/**
 * REXON & Zaxon Field Patrolling App - Backend Services
 * WhatsApp notification triggers removed per system architecture transition to Zaxon Owner App.
 */

import * as admin from 'firebase-admin';

if (admin.apps.length === 0) {
  admin.initializeApp();
}

// Clean backend entry point - ready for future non-WhatsApp cloud functions if needed.
