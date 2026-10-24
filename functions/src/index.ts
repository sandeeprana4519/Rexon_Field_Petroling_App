/**
 * REXON Field Patrolling App - Backend WhatsApp Notification Service
 * Trigger: Cloud Firestore onDocumentCreated('companies/{companyId}/patrolReports/{reportId}')
 * Provider: Official Meta WhatsApp Business Platform Cloud API
 */

import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

interface WhatsAppRecipient {
  id: string;
  name: string;
  role: string;
  phone: string;
  isActive: boolean;
  notifyOnAllPatrols?: boolean;
  notifyOnIncidentsOnly?: boolean;
}

interface SiteNotificationConfig {
  enabled: boolean;
  companyOrFactoryName?: string;
  recipients: WhatsAppRecipient[];
  testMode?: boolean;
}

/**
 * Sends a templated message via Meta WhatsApp Business Cloud API.
 * Access token and Phone Number ID are read securely from server-side environment / Secret Manager.
 */
async function sendWhatsAppTemplateMessage(params: {
  phoneNumberId: string;
  accessToken: string;
  recipientPhone: string;
  recipientName: string;
  siteName: string;
  reportCode: string;
  officerName: string;
  officerBadge: string;
  completedAt: string;
  statusVerdict: string;
  checkpointsSummary: string;
  incidentsSummary: string;
  reportLink: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const url = `https://graph.facebook.com/v21.0/${params.phoneNumberId}/messages`;

  // Standard Meta WhatsApp Cloud API template payload
  const payload = {
    messaging_product: 'whatsapp',
    to: params.recipientPhone.replace(/[^0-9]/g, ''),
    type: 'template',
    template: {
      name: 'rexon_patrol_summary_v1',
      language: { code: 'en' },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: params.recipientName },
            { type: 'text', text: params.siteName },
            { type: 'text', text: params.reportCode },
            { type: 'text', text: params.officerName },
            { type: 'text', text: params.officerBadge },
            { type: 'text', text: params.completedAt },
            { type: 'text', text: params.statusVerdict },
            { type: 'text', text: params.checkpointsSummary },
            { type: 'text', text: params.incidentsSummary },
            { type: 'text', text: params.reportLink }
          ]
        }
      ]
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data?.error?.message || `WhatsApp API error (HTTP ${response.status})`
      };
    }

    const messageId = data?.messages?.[0]?.id;
    return { success: true, messageId };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error reaching WhatsApp API' };
  }
}

/**
 * Idempotent Firestore Trigger: Runs immediately after a patrol report is created.
 */
export const onPatrolReportCreated = onDocumentCreated(
  {
    document: 'companies/{companyId}/patrolReports/{reportId}',
    secrets: ['WHATSAPP_ACCESS_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID']
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const report = snap.data();
    const { companyId, reportId } = event.params;

    // 1. Idempotency check: if notification was already processed, exit
    if (report.notificationStatus === 'sent' || report.notificationStatus === 'test_mode') {
      console.log(`[WhatsApp Trigger] Report ${reportId} already has status ${report.notificationStatus}. Skipping.`);
      return;
    }

    const siteId = report.siteId;
    if (!siteId) return;

    // 2. Load site notification settings from /companies/{companyId}/sites/{siteId}
    const siteSnap = await db.doc(`companies/${companyId}/sites/${siteId}`).get();
    const siteData = siteSnap.exists ? siteSnap.data() : null;
    const notifConfig: SiteNotificationConfig | undefined = siteData?.whatsappNotifications || siteData?.notificationConfig;

    // Load Admin global settings from /companies/{companyId}/settings/companyConfig
    const companySnap = await db.doc(`companies/${companyId}/settings/companyConfig`).get();
    const companyData = companySnap.exists ? companySnap.data() : null;

    const recipients: WhatsAppRecipient[] = [];

    // Add site-specific Owner / HR recipients
    if (notifConfig && notifConfig.enabled && notifConfig.recipients) {
      const activeSiteRecipients = notifConfig.recipients.filter((r) => r.isActive !== false);
      recipients.push(...activeSiteRecipients);
    }

    // Add Master Admin recipient if enabled
    if (companyData && companyData.adminWhatsAppAlertsEnabled && companyData.adminWhatsAppPhone) {
      recipients.push({
        id: 'admin-master-dispatch',
        name: companyData.adminWhatsAppName || 'REXON Central Operations',
        role: 'Operations Desk',
        phone: companyData.adminWhatsAppPhone,
        isActive: true,
        notifyOnIncidentsOnly: companyData.adminNotifyOn === 'incidents_only'
      });
    }

    if (recipients.length === 0) {
      console.log(`[WhatsApp Trigger] No active WhatsApp recipients configured for site ${siteId} or Admin.`);
      return;
    }

    const isTestMode = notifConfig?.testMode === true || companyData?.adminTestMode === true;
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    const incidentCount = report.incidentCount || (report.incidents ? report.incidents.length : 0);
    const hasIncidents = incidentCount > 0;
    const statusVerdict = hasIncidents ? '⚠️ INCIDENT REPORTED' : '✅ ALL CLEAR & VERIFIED';
    const verifiedCheckpoints = (report.checklist || []).filter((c: any) => c.checked).length;
    const totalCheckpoints = (report.checklist || []).length;
    const checkpointsSummary = `${verifiedCheckpoints} of ${totalCheckpoints} verified`;
    const incidentsSummary = hasIncidents ? `${incidentCount} Action Required` : '0 Clean';
    const completedAt = `${report.scheduledDate} · ${report.completedAt || report.actualCheckInTime || report.scheduledTime}`;
    const reportLink = `https://${companyId}.web.app/?tab=reports&reportId=${reportId}`;

    const logs: any[] = [];

    for (const rec of recipients) {
      if (rec.notifyOnIncidentsOnly && !hasIncidents) continue;

      const logId = `notif-${reportId}-${rec.id}-${Date.now()}`;

      // If test mode or credentials missing
      if (isTestMode || !token || !phoneNumberId) {
        logs.push({
          id: logId,
          recipientId: rec.id,
          recipientName: rec.name,
          recipientRole: rec.role,
          recipientPhone: rec.phone,
          status: isTestMode ? 'test_mode' : 'unconfigured',
          sentAt: new Date().toISOString(),
          testMode: isTestMode,
          errorMessage: isTestMode
            ? undefined
            : 'WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID secret not configured in Cloud Functions.'
        });
        continue;
      }

      // Live delivery via Meta WhatsApp Business Cloud API
      const result = await sendWhatsAppTemplateMessage({
        phoneNumberId,
        accessToken: token,
        recipientPhone: rec.phone,
        recipientName: rec.name,
        siteName: notifConfig.companyOrFactoryName || siteData.name,
        reportCode: report.reportCode,
        officerName: report.officerName,
        officerBadge: report.officerBadge,
        completedAt,
        statusVerdict,
        checkpointsSummary,
        incidentsSummary,
        reportLink
      });

      logs.push({
        id: logId,
        recipientId: rec.id,
        recipientName: rec.name,
        recipientRole: rec.role,
        recipientPhone: rec.phone,
        status: result.success ? 'sent' : 'failed',
        sentAt: new Date().toISOString(),
        providerMessageId: result.messageId,
        errorMessage: result.error
      });
    }

    let overallStatus = 'pending';
    if (logs.some((l) => l.status === 'sent')) overallStatus = 'sent';
    else if (logs.every((l) => l.status === 'test_mode')) overallStatus = 'test_mode';
    else if (logs.every((l) => l.status === 'unconfigured')) overallStatus = 'unconfigured';
    else if (logs.some((l) => l.status === 'failed')) overallStatus = 'failed';

    // 3. Atomically update report document with notification delivery logs
    await snap.ref.update({
      notificationStatus: overallStatus,
      notificationLogs: logs
    });

    console.log(`[WhatsApp Trigger] Completed notification processing for report ${reportId}: status=${overallStatus}`);
  }
);
