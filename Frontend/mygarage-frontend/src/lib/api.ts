import { 
  UserVehicle, 
  UserVehicleWithSpecs, 
  ServiceSummary, 
  LifetimeCostSummary,
  ImportPreviewResponse,
  ImportSpecRow,
  ImportCommitResponse,
  SavedPart,
  PartPreset,
  DailyVehicleStreak
} from '@/types/autofolio';

const API_BASE_URL = process.env.NEXT_PUBLIC_AUTOFOLIO_API_BASE_URL || 'http://127.0.0.1:3001';

export async function getDailyVehicleStreak(userId: string): Promise<DailyVehicleStreak> {
  const url = `${API_BASE_URL}/user-vehicles/daily/streak?userId=${userId}`;
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch daily streak');
  }
  return response.json();
}

export async function updateVehicleOdometer(vehicleId: string, odometerKms: number): Promise<UserVehicle> {
  // Ensure we use the general vehicle update route: PATCH /user-vehicles/:id
  const url = `${API_BASE_URL}/user-vehicles/${vehicleId}`;
  
  const response = await fetch(url, {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ currentOdometer: odometerKms }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to update odometer (Status: ${response.status})`);
  }

  return response.json();
}

export async function getUserVehicles(userId: string): Promise<UserVehicle[]> {
  const url = `${API_BASE_URL}/user-vehicles/user/${userId}`;
  try {
    const response = await fetch(url, {
      cache: 'no-store',
    });
    if (!response.ok) {
      let errorData = {};
      try {
        errorData = await response.json();
      } catch (e) {}
      throw new Error((errorData as any).message || `Failed to fetch vehicles: ${response.statusText} (${response.status})`);
    }
    return response.json();
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
      throw new Error(`Network error: Could not reach backend at ${API_BASE_URL}. Ensure the backend is running and reachable.`);
    }
    throw err;
  }
}

export async function getUserVehicleWithSpecs(id: string): Promise<UserVehicleWithSpecs> {
  const url = `${API_BASE_URL}/user-vehicles/${id}/specs`;
  try {
    const response = await fetch(url, {
      cache: 'no-store',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to fetch vehicle specs: ${response.statusText}`);
    }
    return response.json();
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
      throw new Error(`Network error: Could not reach backend at ${API_BASE_URL}. Ensure the backend is running.`);
    }
    throw err;
  }
}

export async function getLifetimeCostSummary(id: string): Promise<LifetimeCostSummary> {
  const url = `${API_BASE_URL}/user-vehicles/${id}/cost-summary`;
  try {
    const response = await fetch(url, {
      cache: 'no-store',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to fetch cost summary: ${response.statusText}`);
    }
    return response.json();
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
      throw new Error(`Network error: Could not reach backend at ${API_BASE_URL}. Ensure the backend is running.`);
    }
    throw err;
  }
}

export async function exportVehicleHistoryPdf(id: string): Promise<Blob> {
  const url = `${API_BASE_URL}/user-vehicles/${id}/export-history`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/pdf',
    },
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = {};
    }
    const error: any = new Error(errorData.message || 'Failed to export history');
    error.type = errorData.type;
    throw error;
  }

  return response.blob();
}

export async function exportServiceHistoryPdf(id: string): Promise<Blob> {
  const url = `${API_BASE_URL}/user-vehicles/${id}/export-service-history`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Accept': 'application/pdf' },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error: any = new Error(errorData.message || 'Failed to export service history');
    error.type = errorData.type;
    throw error;
  }
  return response.blob();
}

export async function exportWorkHistoryPdf(id: string): Promise<Blob> {
  const url = `${API_BASE_URL}/user-vehicles/${id}/export-work-history`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Accept': 'application/pdf' },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error: any = new Error(errorData.message || 'Failed to export work history');
    error.type = errorData.type;
    throw error;
  }
  return response.blob();
}

export async function exportDocumentsZip(id: string, documentIds?: string[]): Promise<Blob> {
  const url = `${API_BASE_URL}/user-vehicles/${id}/export-documents-zip`;
  const options: RequestInit = {
    method: documentIds ? 'POST' : 'GET',
    headers: { 
      'Accept': 'application/zip',
      ...(documentIds ? { 'Content-Type': 'application/json' } : {})
    },
    body: documentIds ? JSON.stringify({ documentIds }) : undefined,
  };

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error: any = new Error(errorData.message || 'Failed to export documents');
    error.type = errorData.type;
    throw error;
  }
  return response.blob();
}

export async function getServiceSummary(id: string): Promise<ServiceSummary> {
  const url = `${API_BASE_URL}/user-vehicles/${id}/service-summary`;
  try {
    const response = await fetch(url, {
      cache: 'no-store',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to fetch service summary: ${response.statusText}`);
    }
    return response.json();
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
      throw new Error(`Network error: Could not reach backend at ${API_BASE_URL}. Ensure the backend is running.`);
    }
    throw err;
  }
}

export interface CreateVehicleData {
  nickname: string;
  licensePlate: string;
  make?: string;
  model?: string;
  year?: number;
  vin?: string;
  specId?: string;
  userId: string;
  isDaily?: boolean;
}

export interface UpdateVehicleData {
  nickname?: string;
  licensePlate?: string;
  make?: string;
  model?: string;
  year?: number;
  vin?: string;
  specId?: string;
  currentOdometer?: number | null;
  serviceIntervalKms?: number | null;
  serviceIntervalMonths?: number | null;
  isDaily?: boolean;
}

export async function createVehicle(data: CreateVehicleData): Promise<UserVehicle> {
  const url = `${API_BASE_URL}/user-vehicles`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to register vehicle: ${response.statusText}`);
    }

    return response.json();
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
      throw new Error(`Network error: Could not reach backend at ${API_BASE_URL}. Ensure the backend is running.`);
    }
    throw err;
  }
}

export async function updateVehicle(id: string, data: UpdateVehicleData): Promise<UserVehicle> {
  const response = await fetch(`${API_BASE_URL}/user-vehicles/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update vehicle');
  }

  return response.json();
}

export async function setVehicleDaily(id: string): Promise<UserVehicle> {
  const response = await fetch(`${API_BASE_URL}/user-vehicles/${id}/set-daily`, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to set vehicle as daily');
  }

  return response.json();
}

export async function deleteVehicle(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/user-vehicles/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete vehicle');
  }
}

export interface CreateServiceEventData {
  title: string;
  eventDate: string;
  odometerAtEvent?: number;
  serviceType: 'workshop' | 'diy';
  isMainService?: boolean;
  notes?: string;
  totalCost?: number;
}

export async function createService(vehicleId: string, data: CreateServiceEventData) {
  const response = await fetch(`${API_BASE_URL}/user-vehicles/${vehicleId}/services`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create service record');
  }

  return response.json();
}

export async function getService(vehicleId: string, serviceId: string) {
  const response = await fetch(`${API_BASE_URL}/user-vehicles/${vehicleId}/services/${serviceId}`, {
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch service record: ${response.statusText}`);
  }
  return response.json();
}

export async function updateService(vehicleId: string, serviceId: string, data: Partial<CreateServiceEventData>) {
  const response = await fetch(`${API_BASE_URL}/user-vehicles/${vehicleId}/services/${serviceId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update service record');
  }

  return response.json();
}

export async function deleteService(vehicleId: string, serviceId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/user-vehicles/${vehicleId}/services/${serviceId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete service record');
  }
}

export interface CreateWorkJobData {
  title: string;
  status: 'planned' | 'in-progress' | 'done';
  priority?: 'low' | 'medium' | 'high';
  date?: string;
  notes?: string;
  estimate?: number;
  parts?: { savedPartId: string; quantity: number; notes?: string }[];
  specs?: { customSpecId: string }[];
}

export async function createWorkJob(vehicleId: string, data: CreateWorkJobData) {
  const url = `${API_BASE_URL}/user-vehicles/${vehicleId}/work-jobs`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to create work record: ${response.statusText}`);
    }

    return response.json();
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
      throw new Error(`Network error: Could not reach backend at ${API_BASE_URL}. Ensure the backend is running.`);
    }
    throw err;
  }
}

export async function getWorkJob(vehicleId: string, workJobId: string) {
  const url = `${API_BASE_URL}/user-vehicles/${vehicleId}/work-jobs/${workJobId}`;
  try {
    const response = await fetch(url, {
      cache: 'no-store',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to fetch work record: ${response.statusText}`);
    }
    return response.json();
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
      throw new Error(`Network error: Could not reach backend at ${API_BASE_URL}. Ensure the backend is running.`);
    }
    throw err;
  }
}

export async function updateWorkJob(vehicleId: string, workJobId: string, data: Partial<CreateWorkJobData>) {
  const url = `${API_BASE_URL}/user-vehicles/${vehicleId}/work-jobs/${workJobId}`;
  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to update work record: ${response.statusText}`);
    }

    return response.json();
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
      throw new Error(`Network error: Could not reach backend at ${API_BASE_URL}. Ensure the backend is running.`);
    }
    throw err;
  }
}

export async function deleteWorkJob(vehicleId: string, workJobId: string): Promise<void> {
  const url = `${API_BASE_URL}/user-vehicles/${vehicleId}/work-jobs/${workJobId}`;
  try {
    const response = await fetch(url, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to delete work record: ${response.statusText}`);
    }
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
      throw new Error(`Network error: Could not reach backend at ${API_BASE_URL}. Ensure the backend is running.`);
    }
    throw err;
  }
}

export interface CreateDocumentData {
  title: string;
  category: string;
  date: string;
  notes?: string;
  fileUrl?: string;
  fileType?: string;
  fileSize?: number;
  serviceEventId?: string;
}

export async function uploadDocument(vehicleId: string, file: File, title: string, category: string) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', title);
  formData.append('category', category);

  const response = await fetch(`${API_BASE_URL}/user-vehicles/${vehicleId}/documents`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to upload document');
  }

  return response.json();
}

export async function getDocument(vehicleId: string, documentId: string) {
  const response = await fetch(`${API_BASE_URL}/user-vehicles/${vehicleId}/documents/${documentId}`, {
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch document: ${response.statusText}`);
  }
  return response.json();
}


export async function updateDocument(vehicleId: string, documentId: string, data: Partial<CreateDocumentData>) {
  const response = await fetch(`${API_BASE_URL}/user-vehicles/${vehicleId}/documents/${documentId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update document');
  }

  return response.json();
}

export async function deleteDocument(vehicleId: string, documentId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/user-vehicles/${vehicleId}/documents/${documentId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete document');
  }
}

export interface CreateReminderData {
  title: string;
  dueDate: string;
  type?: string;
  notes?: string;
}

export async function createReminder(vehicleId: string, data: CreateReminderData) {
  const response = await fetch(`${API_BASE_URL}/user-vehicles/${vehicleId}/reminders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create reminder');
  }

  return response.json();
}

export async function getReminder(vehicleId: string, reminderId: string) {
  const response = await fetch(`${API_BASE_URL}/user-vehicles/${vehicleId}/reminders/${reminderId}`, {
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch reminder: ${response.statusText}`);
  }
  return response.json();
}

export async function updateReminderMetadata(vehicleId: string, reminderId: string, data: Partial<CreateReminderData>) {
  const response = await fetch(`${API_BASE_URL}/user-vehicles/${vehicleId}/reminders/${reminderId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update reminder');
  }

  return response.json();
}

export async function deleteReminder(vehicleId: string, reminderId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/user-vehicles/${vehicleId}/reminders/${reminderId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete reminder');
  }
}

export async function updateReminderStatus(vehicleId: string, reminderId: string, status: 'open' | 'done' | 'dismissed') {
  const response = await fetch(`${API_BASE_URL}/user-vehicles/${vehicleId}/reminders/${reminderId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update reminder status');
  }

  return response.json();
}

export async function uploadVehiclePhoto(vehicleId: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/user-vehicles/${vehicleId}/photos`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to upload photo');
  }

  return response.json();
}

export async function deleteVehiclePhoto(vehicleId: string, photoId: string) {
  const response = await fetch(`${API_BASE_URL}/user-vehicles/${vehicleId}/photos/${photoId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete photo');
  }
}

export async function uploadVehicleBanner(vehicleId: string, file: File, metadata?: { bannerCropX?: number; bannerCropY?: number; bannerZoom?: number }) {
  const formData = new FormData();
  formData.append('file', file);
  if (metadata?.bannerCropX !== undefined) formData.append('bannerCropX', metadata.bannerCropX.toString());
  if (metadata?.bannerCropY !== undefined) formData.append('bannerCropY', metadata.bannerCropY.toString());
  if (metadata?.bannerZoom !== undefined) formData.append('bannerZoom', metadata.bannerZoom.toString());

  const response = await fetch(`${API_BASE_URL}/user-vehicles/${vehicleId}/banner`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to upload banner');
  }

  return response.json();
}

export async function updateVehicleBannerMetadata(vehicleId: string, metadata: { bannerCropX?: number; bannerCropY?: number; bannerZoom?: number }) {
  const response = await fetch(`${API_BASE_URL}/user-vehicles/${vehicleId}/banner/metadata`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update banner metadata');
  }

  return response.json();
}

export async function deleteVehicleBanner(vehicleId: string) {
  const response = await fetch(`${API_BASE_URL}/user-vehicles/${vehicleId}/banner`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete banner');
  }
}

export async function uploadServiceAttachment(vehicleId: string, serviceId: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/user-vehicles/${vehicleId}/services/${serviceId}/attachments`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to upload attachment');
  }

  return response.json();
}

export async function deleteServiceAttachment(vehicleId: string, serviceId: string, attachmentId: string) {
  const response = await fetch(`${API_BASE_URL}/user-vehicles/${vehicleId}/services/${serviceId}/attachments/${attachmentId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete attachment');
  }
}

export async function uploadWorkAttachment(vehicleId: string, workJobId: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/user-vehicles/${vehicleId}/work-jobs/${workJobId}/attachments`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to upload attachment');
  }

  return response.json();
}

export async function deleteWorkAttachment(vehicleId: string, workJobId: string, attachmentId: string) {
  const response = await fetch(`${API_BASE_URL}/user-vehicles/${vehicleId}/work-jobs/${workJobId}/attachments/${attachmentId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete attachment');
  }
}

export interface CreateCustomSpecData {
  group: string;
  label: string;
  value: string;
  unit?: string;
  notes?: string;
}

export async function createCustomSpec(vehicleId: string, data: CreateCustomSpecData) {
  const response = await fetch(`${API_BASE_URL}/user-vehicles/${vehicleId}/custom-specs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create custom spec');
  }

  return response.json();
}

export async function updateCustomSpec(vehicleId: string, specId: string, data: Partial<CreateCustomSpecData>) {
  const response = await fetch(`${API_BASE_URL}/user-vehicles/${vehicleId}/custom-specs/${specId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update custom spec');
  }

  return response.json();
}

export async function deleteCustomSpec(vehicleId: string, specId: string) {
  const response = await fetch(`${API_BASE_URL}/user-vehicles/${vehicleId}/custom-specs/${specId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete custom spec');
  }
}

// --- Registration API Helpers ---

export interface CreateRegistrationData {
  regNumber: string;
  countryCode: string;
  region?: string;
  registrationStartDate?: string;
  expiryDate: string;
  durationMonths?: number;
  issuingBody?: string;
  cost?: number;
  isCurrent?: boolean;
  registrationStatus?: 'active' | 'expired' | 'cancelled' | 'pending';
  notes?: string;
}

export async function createRegistration(vehicleId: string, data: CreateRegistrationData) {
  const response = await fetch(`${API_BASE_URL}/user-vehicles/${vehicleId}/registrations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create registration record');
  }
  return response.json();
}

export async function updateRegistration(vehicleId: string, regId: string, data: Partial<CreateRegistrationData>) {
  const response = await fetch(`${API_BASE_URL}/user-vehicles/${vehicleId}/registrations/${regId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update registration record');
  }
  return response.json();
}

export async function deleteRegistration(vehicleId: string, regId: string) {
  const response = await fetch(`${API_BASE_URL}/user-vehicles/${vehicleId}/registrations/${regId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete registration record');
  }
}

// --- User Preferences API Helpers ---

export interface UpdateUserPreferencesData {
  defaultCurrency?: string;
  plan?: string;
}

export async function getUserPreferences(userId: string) {
  const url = `${API_BASE_URL}/users/${userId}/preferences`;
  try {
    const response = await fetch(url, {
      cache: 'no-store',
    });
    if (!response.ok) {
      let errorData = {};
      try {
        errorData = await response.json();
      } catch (e) {}
      throw new Error((errorData as any).message || `Failed to fetch user preferences: ${response.statusText} (${response.status})`);
    }
    return response.json();
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
      throw new Error(`Network error: Could not reach backend at ${API_BASE_URL}. Ensure the backend is running and reachable.`);
    }
    throw err;
  }
}

export async function updateUserPreferences(userId: string, data: UpdateUserPreferencesData) {
  // Explicitly construct the clean body object
  const body: any = {};
  if (data.defaultCurrency) body.defaultCurrency = data.defaultCurrency;
  if (data.plan) body.plan = data.plan;

  const response = await fetch(`${API_BASE_URL}/users/${userId}/preferences`, {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to update user preferences');
  }
  return response.json();
}

// --- Insurance API Helpers ---

export interface CreateInsuranceData {
  provider: string;
  policyNumber?: string;
  policyType: string;
  policyStartDate?: string;
  expiryDate: string;
  premiumAmount?: number;
  currency?: string;
  paymentFrequency: string;
  isCurrent?: boolean;
  insuranceStatus?: 'active' | 'expired' | 'cancelled' | 'pending';
  notes?: string;
}

export async function createInsurance(vehicleId: string, data: CreateInsuranceData) {
  const response = await fetch(`${API_BASE_URL}/user-vehicles/${vehicleId}/insurance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create insurance record');
  }
  return response.json();
}

export async function updateInsurance(vehicleId: string, insId: string, data: Partial<CreateInsuranceData>) {
  const response = await fetch(`${API_BASE_URL}/user-vehicles/${vehicleId}/insurance/${insId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update insurance record');
  }
  return response.json();
}

export async function deleteInsurance(vehicleId: string, insId: string) {
  const response = await fetch(`${API_BASE_URL}/user-vehicles/${vehicleId}/insurance/${insId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete insurance record');
  }
}

export async function getPublicReport(token: string) {
  const url = `${API_BASE_URL}/public/vehicle-report/${token}`;
  try {
    const response = await fetch(url, {
      cache: 'no-store',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to fetch public report: ${response.statusText}`);
    }
    return response.json();
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
      throw new Error(`Network error: Could not reach backend at ${API_BASE_URL}. Ensure the backend is running.`);
    }
    throw err;
  }
}

export async function enablePublicReport(vehicleId: string): Promise<UserVehicle> {
  const response = await fetch(`${API_BASE_URL}/user-vehicles/${vehicleId}/public-report/enable`, {
    method: 'POST',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to enable public report');
  }
  return response.json();
}

export async function disablePublicReport(vehicleId: string): Promise<UserVehicle> {
  const response = await fetch(`${API_BASE_URL}/user-vehicles/${vehicleId}/public-report/disable`, {
    method: 'POST',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to disable public report');
  }
  return response.json();
}

// --- Spec Import API Helpers ---

export async function previewSpecImport(vehicleId: string, file: File): Promise<ImportPreviewResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/vehicle-specs/import/preview?vehicleId=${vehicleId}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to preview import');
  }

  return response.json();
}

export async function commitSpecImport(vehicleId: string, rows: ImportSpecRow[], fileName: string): Promise<ImportCommitResponse> {
  const response = await fetch(`${API_BASE_URL}/vehicle-specs/import/commit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vehicleId, rows, fileName }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to commit import');
  }

  return response.json();
}

export function getSpecTemplateUrl() {
  return `${API_BASE_URL}/vehicle-specs/import/template`;
}

export function getSpecExampleUrl() {
  return `${API_BASE_URL}/vehicle-specs/import/example`;
}

export interface CreateSavedPartData {
  category: string;
  name: string;
  partNumber?: string | null;
  description?: string | null;
  preferredBrand?: string | null;
  supplier?: string | null;
  purchaseUrl?: string | null;
  lastPrice?: number | null;
  lastPurchaseDate?: string | null;
  defaultQuantity?: number;
  notes?: string | null;
}

export async function createSavedPart(vehicleId: string, data: CreateSavedPartData) {
  const response = await fetch(`${API_BASE_URL}/user-vehicles/${vehicleId}/parts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to save part');
  }
  return response.json();
}

export async function updateSavedPart(vehicleId: string, partId: string, data: Partial<CreateSavedPartData>) {
  const response = await fetch(`${API_BASE_URL}/user-vehicles/${vehicleId}/parts/${partId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update part');
  }
  return response.json();
}

export async function deleteSavedPart(vehicleId: string, partId: string) {
  const response = await fetch(`${API_BASE_URL}/user-vehicles/${vehicleId}/parts/${partId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete part');
  }
}

export interface CreatePartPresetData {
  name: string;
  notes?: string | null;
  items: { savedPartId: string; quantity: number }[];
}

export async function createPartPreset(vehicleId: string, data: CreatePartPresetData) {
  const response = await fetch(`${API_BASE_URL}/user-vehicles/${vehicleId}/parts/presets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create preset');
  }
  return response.json();
}

export async function updatePartPreset(vehicleId: string, presetId: string, data: Partial<CreatePartPresetData>) {
  const response = await fetch(`${API_BASE_URL}/user-vehicles/${vehicleId}/parts/presets/${presetId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update preset');
  }
  return response.json();
}

export async function deletePartPreset(vehicleId: string, presetId: string) {
  const response = await fetch(`${API_BASE_URL}/user-vehicles/${vehicleId}/parts/presets/${presetId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete preset');
  }
}

export async function exportWorkJobPdf(vehicleId: string, workJobId: string): Promise<Blob> {
  const url = `${API_BASE_URL}/user-vehicles/${vehicleId}/work-jobs/${workJobId}/export`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Accept': 'application/pdf' },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error: any = new Error(errorData.message || 'Failed to export job card');
    error.type = errorData.type;
    throw error;
  }
  return response.blob();
}

export interface ShoppingListRequest {
  items: {
    savedPartId: string;
    quantity: number;
  }[];
}

export async function generateShoppingList(vehicleId: string, data: ShoppingListRequest) {
  const response = await fetch(`${API_BASE_URL}/user-vehicles/${vehicleId}/parts/shopping-list`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to generate shopping list');
  }
  return response.json();
}

export async function exportShoppingListPdf(vehicleId: string, data: ShoppingListRequest): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/user-vehicles/${vehicleId}/parts/shopping-list/export`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/pdf'
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to export shopping list PDF');
  }
  return response.blob();
}
