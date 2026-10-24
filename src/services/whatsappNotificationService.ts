import { Site, PatrolReport, SiteWhatsAppRecipient, ReportNotificationLog, NotificationDeliveryStatus, AdminWhatsAppNotificationConfig } from '../types';

/**
 * Standard Approved WhatsApp Business Notification Template Definition
 * Template Name: rexon_patrol_summary_v1
 * Category: UTILITY
 * Language: en (English) / hi (Hindi)
 */
export const WHATSAPP_TEMPLATE_SPEC = {
  templateName: 'rexon_patrol_summary_v1',
  category: 'UTILITY',
  header: '🛡️ REXON SECURITY PATROL AUDIT',
  sampleBody:
    'Dear {{1}},\n\nA scheduled security patrol has just been completed for *{{2}}*.\n\n• Report ID: *{{3}}*\n• Field Officer: *{{4}}* (Badge: {{5}})\n• Patrol Time: *{{6}}*\n• Security Status: *{{7}}*\n• Checkpoints: *{{8}}*\n• Incidents Logged: *{{9}}*\n\nReview verified checklist, GPS compliance, and audit records:\n{{10}}\n\n_Rexon Automated Security Dispatch Desk_',
  parametersGuide: [
    '{{1}} - Recipient Name (e.g. Martin Sterling)',
    '{{2}} - Site / Factory Name (e.g. Apex Rail Freight Yard)',
    '{{3}} - Report ID / Code (e.g. PTR-2026-001)',
    '{{4}} - Officer Name (e.g. Sandeep Rana)',
    '{{5}} - Badge Number (e.g. RF-101)',
    '{{6}} - Completion Time & Date',
    '{{7}} - Security Status (e.g. All Clear / Incident Reported)',
    '{{8}} - Verified Checkpoints count (e.g. 5 of 5 Verified)',
    '{{9}} - Incidents Count (e.g. 0 Clean / 1 Active Incident)',
    '{{10}} - Secure Report URL'
  ]
};

/**
 * Validates international E.164 phone numbers with country code.
 * Example valid: "+919876543210", "+15553928811", "+91 98765 43210"
 */
export const validateWhatsAppPhoneNumber = (phone: string): { isValid: boolean; normalized: string; error?: string } => {
  if (!phone || !phone.trim()) {
    return { isValid: false, normalized: '', error: 'Phone number is required.' };
  }

  // Remove spaces, hyphens, parentheses
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');

  if (!cleaned.startsWith('+')) {
    return {
      isValid: false,
      normalized: cleaned,
      error: 'Phone number must start with "+" followed by country code (e.g. +91 9876543210 or +1 5553928811).'
    };
  }

  const digitsOnly = cleaned.substring(1);
  if (!/^\d{8,15}$/.test(digitsOnly)) {
    return {
      isValid: false,
      normalized: cleaned,
      error: 'Invalid phone number format. Must contain 8 to 15 digits after country code.'
    };
  }

  return { isValid: true, normalized: `+${digitsOnly}` };
};

/**
 * Checks if WhatsApp Cloud API backend configuration is active.
 * Per security requirement #7: Never expose permanent WhatsApp access tokens in frontend code.
 * This checks for server-side function endpoint or environment variable flag.
 */
export const checkWhatsAppConfigurationStatus = (): {
  isConfigured: boolean;
  provider: string;
  message: string;
} => {
  const functionUrl = import.meta.env.VITE_WHATSAPP_FUNCTIONS_URL?.trim();
  const isEnvFlagged = import.meta.env.VITE_WHATSAPP_INTEGRATION_ENABLED === 'true';

  if (functionUrl || isEnvFlagged) {
    return {
      isConfigured: true,
      provider: 'Meta WhatsApp Business Cloud API (Firebase Cloud Functions)',
      message: 'Server-side WhatsApp Business Cloud API endpoint is active.'
    };
  }

  return {
    isConfigured: false,
    provider: 'Meta WhatsApp Business Cloud API',
    message: 'Setup Pending: WhatsApp Cloud API credentials and Cloud Functions trigger await deployment in Meta / Firebase Console.'
  };
};

/**
 * Formats a secure sanitized notification message body according to template specification.
 */
export const formatWhatsAppNotificationText = (
  site: Site,
  report: PatrolReport,
  recipient: SiteWhatsAppRecipient
): string => {
  const companyName = site.whatsappNotifications?.companyOrFactoryName || site.clientName || site.name;
  const verifiedCheckpoints = (report.checklist || []).filter((c) => c.checked).length;
  const totalCheckpoints = (report.checklist || []).length;
  const incidentCount = report.incidentCount || (report.incidents ? report.incidents.length : 0);
  const statusVerdict = incidentCount > 0 ? '⚠️ INCIDENT REPORTED' : '✅ ALL CLEAR & VERIFIED';

  const reportTime = `${report.scheduledDate} · ${report.completedAt || report.actualCheckInTime || report.scheduledTime}`;
  const baseUrl = window.location.origin;
  const secureReportLink = `${baseUrl}/?tab=reports&reportId=${encodeURIComponent(report.id)}`;

  return (
    `🛡️ *REXON SECURITY PATROL AUDIT*\n\n` +
    `Hello ${recipient.name},\n` +
    `A security patrol check-in has been completed for *${companyName}*.\n\n` +
    `• *Site:* ${site.name} (${site.area})\n` +
    `• *Report ID:* ${report.reportCode}\n` +
    `• *Officer:* ${report.officerName} (Badge: ${report.officerBadge})\n` +
    `• *Time:* ${reportTime}\n` +
    `• *Status:* ${statusVerdict}\n` +
    `• *Checkpoints:* ${verifiedCheckpoints} of ${totalCheckpoints} verified\n` +
    `• *Incidents:* ${incidentCount > 0 ? `${incidentCount} Action Required` : '0 (None)'}\n\n` +
    `Review verified checklist & GPS audit:\n${secureReportLink}\n\n` +
    `_Rexon Automated Security Dispatch_`
  );
};

export interface DispatchNotificationResult {
  triggered: boolean;
  overallStatus: NotificationDeliveryStatus;
  logs: ReportNotificationLog[];
  feedbackMessage: string;
}

/**
 * Dispatches automated WhatsApp notifications for a completed patrol report.
 * - Idempotent: checks for prior delivery to avoid duplicate messages.
 * - Adheres to Test Mode: stages logs without consuming Meta API credits if testMode is enabled.
 * - Honest: clearly flags setup-pending if server-side credentials are missing.
 */
export const dispatchPatrolReportNotification = async (
  site: Site,
  report: PatrolReport,
  adminConfig?: AdminWhatsAppNotificationConfig
): Promise<DispatchNotificationResult> => {
  const notifConfig = site.whatsappNotifications || site.notificationConfig;
  const isSiteNotifEnabled = notifConfig && notifConfig.enabled;
  const isAdminNotifEnabled = adminConfig && adminConfig.enabled && !!adminConfig.adminPhone?.trim();

  // 1. Check if notifications are enabled for this site or for master Admin
  if (!isSiteNotifEnabled && !isAdminNotifEnabled) {
    return {
      triggered: false,
      overallStatus: 'unconfigured',
      logs: [],
      feedbackMessage: `WhatsApp notifications are disabled for site "${site.name}" and Admin alerts are inactive.`
    };
  }

  // Compile recipients: authorized site contacts (Owner / HR) + Master Admin
  const recipients: SiteWhatsAppRecipient[] = [];

  if (isSiteNotifEnabled && notifConfig?.recipients) {
    const siteRecipients = notifConfig.recipients.filter((r) => r.isActive !== false && r.active !== false);
    recipients.push(...siteRecipients);
  }

  if (isAdminNotifEnabled && adminConfig) {
    recipients.push({
      id: 'admin-master-dispatch',
      name: adminConfig.adminName || 'REXON Operations Desk',
      role: 'Operations Desk',
      phone: adminConfig.adminPhone,
      isActive: true,
      notifyOnIncidentsOnly: adminConfig.notifyOn === 'incidents_only'
    });
  }

  if (recipients.length === 0) {
    return {
      triggered: false,
      overallStatus: 'unconfigured',
      logs: [],
      feedbackMessage: `No active WhatsApp recipients configured for "${site.name}".`
    };
  }

  const isGlobalTestMode = notifConfig?.testMode === true || adminConfig?.testMode === true;
  const configStatus = checkWhatsAppConfigurationStatus();
  const existingLogs = report.notificationLogs || [];
  const newLogs: ReportNotificationLog[] = [];

  const incidentCount = report.incidentCount || (report.incidents ? report.incidents.length : 0);
  const hasIncidents = incidentCount > 0;

  for (const recipient of recipients) {
    // If recipient has filter "only notify on incidents" and there are no incidents, skip
    if ((recipient.notifyOnIncidentsOnly || recipient.triggerOn === 'incidents_only') && !hasIncidents) {
      continue;
    }

    // Idempotency check: don't re-send if already sent successfully for this recipient
    const alreadySent = existingLogs.find(
      (l) => l.recipientId === recipient.id && (l.status === 'sent' || l.status === 'test_mode')
    );
    if (alreadySent) {
      newLogs.push(alreadySent);
      continue;
    }

    const logId = `notif-${report.id}-${recipient.id}-${Date.now()}`;
    const rawPhone = recipient.phone || recipient.phoneNumber || '';
    const validatedPhone = validateWhatsAppPhoneNumber(rawPhone);

    if (!validatedPhone.isValid) {
      newLogs.push({
        id: logId,
        recipientId: recipient.id,
        recipientName: recipient.name,
        recipientRole: recipient.role,
        recipientPhone: rawPhone,
        status: 'failed',
        sentAt: new Date().toISOString(),
        errorMessage: validatedPhone.error || 'Invalid phone format (Country code required).'
      });
      continue;
    }

    const isRecipientTestMode = recipient.id === 'admin-master-dispatch' ? (adminConfig?.testMode ?? isGlobalTestMode) : isGlobalTestMode;

    // Branch A: Test Mode Active
    if (isRecipientTestMode) {
      newLogs.push({
        id: logId,
        recipientId: recipient.id,
        recipientName: recipient.name,
        recipientRole: recipient.role,
        recipientPhone: validatedPhone.normalized,
        status: 'test_mode',
        sentAt: new Date().toISOString(),
        testMode: true,
        providerMessageId: `test-msg-${Date.now()}`
      });
      continue;
    }

    // Branch B: Real Production Mode but Backend Credentials Unconfigured
    if (!configStatus.isConfigured) {
      newLogs.push({
        id: logId,
        recipientId: recipient.id,
        recipientName: recipient.name,
        recipientRole: recipient.role,
        recipientPhone: validatedPhone.normalized,
        status: 'unconfigured',
        sentAt: new Date().toISOString(),
        errorMessage: 'Setup Pending: WhatsApp Cloud API credentials not configured in Cloud Functions.'
      });
      continue;
    }

    // Branch C: Real Production Cloud Functions Dispatch
    try {
      const functionEndpoint = import.meta.env.VITE_WHATSAPP_FUNCTIONS_URL;
      const res = await fetch(functionEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId: site.id,
          reportId: report.id,
          recipientId: recipient.id,
          recipientPhone: validatedPhone.normalized,
          recipientName: recipient.name,
          messageText: formatWhatsAppNotificationText(site, report, recipient)
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Provider returned HTTP ${res.status}`);
      }

      const resData = await res.json();
      newLogs.push({
        id: logId,
        recipientId: recipient.id,
        recipientName: recipient.name,
        recipientRole: recipient.role,
        recipientPhone: validatedPhone.normalized,
        status: 'sent',
        sentAt: new Date().toISOString(),
        providerMessageId: resData.messageId || `wam-id-${Date.now()}`
      });
    } catch (err: any) {
      newLogs.push({
        id: logId,
        recipientId: recipient.id,
        recipientName: recipient.name,
        recipientRole: recipient.role,
        recipientPhone: validatedPhone.normalized,
        status: 'failed',
        sentAt: new Date().toISOString(),
        errorMessage: err?.message || 'Network error reaching WhatsApp Cloud API gateway.'
      });
    }
  }

  // Determine overall status
  let overallStatus: NotificationDeliveryStatus = 'pending';
  if (newLogs.some((l) => l.status === 'sent')) {
    overallStatus = 'sent';
  } else if (newLogs.every((l) => l.status === 'test_mode')) {
    overallStatus = 'test_mode';
  } else if (newLogs.every((l) => l.status === 'unconfigured')) {
    overallStatus = 'unconfigured';
  } else if (newLogs.some((l) => l.status === 'failed')) {
    overallStatus = 'failed';
  }

  let feedbackMessage = '';
  if (isGlobalTestMode) {
    feedbackMessage = `WhatsApp Test Mode: Notification staged for ${newLogs.length} recipient(s) without live dispatch.`;
  } else if (overallStatus === 'sent') {
    feedbackMessage = `WhatsApp notification successfully dispatched to ${newLogs.filter((l) => l.status === 'sent').length} recipient(s).`;
  } else if (overallStatus === 'unconfigured') {
    feedbackMessage = `WhatsApp notifications staged: Cloud Functions credentials setup pending.`;
  } else {
    feedbackMessage = `WhatsApp dispatch encountered issues for some recipients.`;
  }

  return {
    triggered: true,
    overallStatus,
    logs: newLogs,
    feedbackMessage
  };
};

/**
 * Resends a WhatsApp notification manually for an authorized Administrator.
 */
export const resendWhatsAppReportNotification = async (
  site: Site,
  report: PatrolReport,
  recipientId: string
): Promise<{ success: boolean; updatedLog: ReportNotificationLog; message: string }> => {
  const recipient = (site.whatsappNotifications?.recipients || []).find((r) => r.id === recipientId);
  if (!recipient) {
    throw new Error('Recipient not found in site configuration.');
  }

  const isTestMode = site.whatsappNotifications?.testMode === true;
  const configStatus = checkWhatsAppConfigurationStatus();
  const validatedPhone = validateWhatsAppPhoneNumber(recipient.phone);

  if (!validatedPhone.isValid) {
    return {
      success: false,
      updatedLog: {
        id: `notif-resend-${Date.now()}`,
        recipientId: recipient.id,
        recipientName: recipient.name,
        recipientPhone: recipient.phone,
        status: 'failed',
        sentAt: new Date().toISOString(),
        errorMessage: validatedPhone.error
      },
      message: validatedPhone.error || 'Invalid phone format.'
    };
  }

  if (isTestMode) {
    const log: ReportNotificationLog = {
      id: `notif-resend-${Date.now()}`,
      recipientId: recipient.id,
      recipientName: recipient.name,
      recipientRole: recipient.role,
      recipientPhone: validatedPhone.normalized,
      status: 'test_mode',
      sentAt: new Date().toISOString(),
      testMode: true,
      providerMessageId: `test-resend-${Date.now()}`
    };
    return {
      success: true,
      updatedLog: log,
      message: `Test Mode: Resend simulated for ${recipient.name} (${validatedPhone.normalized}).`
    };
  }

  if (!configStatus.isConfigured) {
    const log: ReportNotificationLog = {
      id: `notif-resend-${Date.now()}`,
      recipientId: recipient.id,
      recipientName: recipient.name,
      recipientRole: recipient.role,
      recipientPhone: validatedPhone.normalized,
      status: 'unconfigured',
      sentAt: new Date().toISOString(),
      errorMessage: 'Setup Pending: WhatsApp Cloud API credentials not configured in Cloud Functions.'
    };
    return {
      success: false,
      updatedLog: log,
      message: 'Setup Pending: WhatsApp credentials required in Cloud Functions.'
    };
  }

  // Dispatch live
  try {
    const functionEndpoint = import.meta.env.VITE_WHATSAPP_FUNCTIONS_URL;
    const res = await fetch(functionEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteId: site.id,
        reportId: report.id,
        recipientId: recipient.id,
        recipientPhone: validatedPhone.normalized,
        recipientName: recipient.name,
        messageText: formatWhatsAppNotificationText(site, report, recipient)
      })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const resData = await res.json();

    const log: ReportNotificationLog = {
      id: `notif-resend-${Date.now()}`,
      recipientId: recipient.id,
      recipientName: recipient.name,
      recipientRole: recipient.role,
      recipientPhone: validatedPhone.normalized,
      status: 'sent',
      sentAt: new Date().toISOString(),
      providerMessageId: resData.messageId || `wam-resend-${Date.now()}`
    };

    return {
      success: true,
      updatedLog: log,
      message: `WhatsApp notification successfully resent to ${recipient.name}.`
    };
  } catch (err: any) {
    const log: ReportNotificationLog = {
      id: `notif-resend-${Date.now()}`,
      recipientId: recipient.id,
      recipientName: recipient.name,
      recipientRole: recipient.role,
      recipientPhone: validatedPhone.normalized,
      status: 'failed',
      sentAt: new Date().toISOString(),
      errorMessage: err?.message || 'Failed to send WhatsApp message.'
    };

    return {
      success: false,
      updatedLog: log,
      message: `Resend failed: ${err?.message || 'Provider error'}`
    };
  }
};
