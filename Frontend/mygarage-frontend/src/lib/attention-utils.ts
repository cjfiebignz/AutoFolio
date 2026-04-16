import { ServiceSummary } from "@/types/autofolio";
import { VehicleViewModel } from "@/lib/mappers/vehicle";
import { ReminderViewModel } from "@/lib/mappers/reminder";
import { DocumentViewModel } from "@/lib/mappers/document";
import { getExpiryStatus, getRelativeTimeText, formatNumber } from "@/lib/date-utils";

export type AttentionSeverity = 'critical' | 'warning' | 'info' | 'healthy';
export type AttentionCategory = 'registration' | 'insurance' | 'service' | 'reminder' | 'documents';

export interface AttentionItem {
  key: string;
  category: AttentionCategory;
  severity: AttentionSeverity;
  title: string;
  subLabel?: string;
  href?: string;
}

export interface AttentionEngineOptions {
  vehicle: VehicleViewModel;
  reminders: ReminderViewModel[];
  serviceSummary?: ServiceSummary['serviceSummary'] | null;
  documents: DocumentViewModel[];
}

export function evaluateVehicleAttention(options: AttentionEngineOptions): AttentionItem[] {
  const { vehicle, reminders, serviceSummary, documents } = options;
  const attention: AttentionItem[] = [];

  // 1. Reminders (Overdue/Soon)
  const activeReminders = reminders.filter(r => r.urgency === 'overdue' || r.urgency === 'soon');
  activeReminders.forEach(r => {
    attention.push({
      key: `reminder-${r.id}`,
      category: 'reminder',
      severity: r.urgency === 'overdue' ? 'critical' : 'warning',
      title: r.title,
      subLabel: r.urgency === 'overdue' ? 'Overdue' : `Due in ${r.daysRemaining} days`,
      href: `/vehicles/${vehicle.id}?tab=reminders`
    });
  });

  // 2. Registration
  if (vehicle.hasRegistration) {
    const regStatus = getExpiryStatus(vehicle.registrationExpiryDate);
    
    // De-duplicate: check if ANY active reminder covers registration/rego
    const hasRegReminder = activeReminders.some(r => 
      (r.title.toLowerCase().includes('registration') || r.title.toLowerCase().includes('rego'))
    );

    if (!hasRegReminder) {
      if (regStatus === 'expired' || vehicle.registrationStatus === 'expired') {
        attention.push({
          key: 'reg-expired',
          category: 'registration',
          severity: 'critical',
          title: 'Registration Expired',
          subLabel: 'Legal compliance required',
          href: `/vehicles/${vehicle.id}/registration`
        });
      } else if (regStatus === 'due_soon') {
        attention.push({
          key: 'reg-due-soon',
          category: 'registration',
          severity: 'warning',
          title: 'Registration Due Soon',
          subLabel: 'Renewal window open',
          href: `/vehicles/${vehicle.id}/registration`
        });
      }
    }
  } else {
    attention.push({
      key: 'reg-missing',
      category: 'registration',
      severity: 'info',
      title: 'No Registration on file',
      subLabel: 'Add current record',
      href: `/vehicles/${vehicle.id}/registration`
    });
  }

  // 3. Insurance
  if (vehicle.hasInsurance) {
    const insStatus = getExpiryStatus(vehicle.insuranceExpiryDate);

    // De-duplicate: check if ANY active reminder covers insurance
    const hasInsReminder = activeReminders.some(r => 
      r.title.toLowerCase().includes('insurance')
    );

    if (!hasInsReminder) {
      if (insStatus === 'expired' || vehicle.insuranceStatus === 'expired') {
        attention.push({
          key: 'ins-expired',
          category: 'insurance',
          severity: 'critical',
          title: 'Insurance Expired',
          subLabel: 'Vehicle unprotected',
          href: `/vehicles/${vehicle.id}/insurance`
        });
      } else if (insStatus === 'due_soon') {
        attention.push({
          key: 'ins-due-soon',
          category: 'insurance',
          severity: 'warning',
          title: 'Insurance Due Soon',
          subLabel: 'Coverage renewal needed',
          href: `/vehicles/${vehicle.id}/insurance`
        });
      }
    }
  } else {
    attention.push({
      key: 'ins-missing',
      category: 'insurance',
      severity: 'info',
      title: 'No Insurance on file',
      subLabel: 'Protect your asset',
      href: `/vehicles/${vehicle.id}/insurance`
    });
  }

  // 4. Service
  if (serviceSummary) {
    if (serviceSummary.status === 'overdue') {
      let subLabel = 'Maintenance required';
      
      const isOverdueByKms = typeof serviceSummary.kmsUntilNextService === 'number' && serviceSummary.kmsUntilNextService < 0;
      
      if (isOverdueByKms) {
        subLabel = `Overdue by ${formatNumber(Math.abs(serviceSummary.kmsUntilNextService!))} km`;
      } else if (serviceSummary.nextServiceDueDate) {
        const rel = getRelativeTimeText(serviceSummary.nextServiceDueDate);
        if (rel.toLowerCase().includes('ago')) {
          subLabel = `Overdue by ${rel.toLowerCase().replace(' ago', '')}`;
        }
      }

      attention.push({
        key: 'service-overdue',
        category: 'service',
        severity: 'critical',
        title: 'Service Overdue',
        subLabel,
        href: `/vehicles/${vehicle.id}?tab=service`
      });
    } else if (serviceSummary.status === 'due_soon') {
      let subLabel = 'Service approaching';
      
      if (typeof serviceSummary.kmsUntilNextService === 'number' && serviceSummary.kmsUntilNextService >= 0) {
        subLabel = `Due in ${formatNumber(serviceSummary.kmsUntilNextService)} km`;
      } else if (serviceSummary.nextServiceDueDate) {
        subLabel = `Due ${getRelativeTimeText(serviceSummary.nextServiceDueDate).toLowerCase()}`;
      }

      attention.push({
        key: 'service-due-soon',
        category: 'service',
        severity: 'warning',
        title: 'Service Due Soon',
        subLabel,
        href: `/vehicles/${vehicle.id}?tab=service`
      });
    } else if (serviceSummary.status === 'insufficient_data') {
      let subLabel = 'Update odometer or baseline';
      if (serviceSummary.baselineSource === 'none') subLabel = 'Set service baseline';
      else if (serviceSummary.currentKms === null) subLabel = 'Update odometer';

      attention.push({
        key: 'service-insufficient',
        category: 'service',
        severity: 'info',
        title: 'Insufficient Service Data',
        subLabel,
        href: `/vehicles/${vehicle.id}/edit`
      });
    }
  } else {
    attention.push({
      key: 'service-none',
      category: 'service',
      severity: 'info',
      title: 'No Service records',
      subLabel: 'Start maintenance tracking',
      href: `/vehicles/${vehicle.id}?tab=service`
    });
  }

  // 5. Documents
  if (documents.length === 0) {
    attention.push({
      key: 'docs-missing',
      category: 'documents',
      severity: 'info',
      title: 'No Documents saved',
      subLabel: 'Store receipts or manuals',
      href: `/vehicles/${vehicle.id}?tab=documents`
    });
  }

  // Priority Sort
  const severityOrder: Record<AttentionSeverity, number> = {
    critical: 0,
    warning: 1,
    info: 2,
    healthy: 3
  };

  return attention.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}

export interface VehicleSummaryAttention {
  hasAlerts: boolean;
  highestSeverity: AttentionSeverity;
  summaryLabel: string;
  alertCount: number;
}

/**
 * Summarizes attention items for a single vehicle into a compact format
 * suitable for the garage collection view.
 */
export function evaluateVehicleSummaryAttention(options: AttentionEngineOptions): VehicleSummaryAttention {
  const items = evaluateVehicleAttention(options);
  
  // Filter out 'info' and 'healthy' for the summary badge to keep it high-signal
  const criticalItems = items.filter(i => i.severity === 'critical');
  const warningItems = items.filter(i => i.severity === 'warning');
  
  const hasAlerts = criticalItems.length > 0 || warningItems.length > 0;
  const alertCount = criticalItems.length + warningItems.length;
  const highestSeverity = criticalItems.length > 0 ? 'critical' : (warningItems.length > 0 ? 'warning' : 'healthy');
  
  let summaryLabel = '';
  if (criticalItems.length > 0) {
    // Priority labels for critical
    const serviceOverdue = criticalItems.find(i => i.category === 'service');
    const regExpired = criticalItems.find(i => i.category === 'registration');
    const insExpired = criticalItems.find(i => i.category === 'insurance');
    
    if (serviceOverdue) summaryLabel = serviceOverdue.subLabel || 'Service Overdue';
    else if (regExpired) summaryLabel = regExpired.subLabel || 'Reg Expired';
    else if (insExpired) summaryLabel = insExpired.subLabel || 'Insurance Expired';
    else if (criticalItems.length > 1) summaryLabel = `${criticalItems.length} Critical Alerts`;
    else summaryLabel = criticalItems[0].title;
  } else if (warningItems.length > 0) {
    const serviceSoon = warningItems.find(i => i.category === 'service');
    const regSoon = warningItems.find(i => i.category === 'registration');
    
    if (serviceSoon) summaryLabel = serviceSoon.subLabel || 'Service Soon';
    else if (regSoon) summaryLabel = regSoon.subLabel || 'Reg Due Soon';
    else if (warningItems.length > 1) summaryLabel = `${warningItems.length} Alerts`;
    else summaryLabel = warningItems[0].title;
  }

  return {
    hasAlerts,
    highestSeverity,
    summaryLabel,
    alertCount
  };
}
