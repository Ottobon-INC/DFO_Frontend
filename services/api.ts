

export const API_BASE_URL = ''; // Always use Vite proxy to handle CORS automatically

export interface AppointmentUpdatePayload {
    appointment_date?: string;
    start_time?: string;
    appointment_time?: string;
    end_time?: string;
    doctor_id?: string;
    notes?: string;
    type?: string;
    visit_reason?: string;
}

export interface AppointmentStatusPayload {
    status: 'Scheduled' | 'Arrived' | 'Checked-In' | 'Completed' | 'Canceled' | 'Expected';
    cancellation_reason?: string;
}

// Robust fetch wrapper
class ApiError extends Error {
    public status: number;
    public data: any; // Full error response body

    constructor(message: string, status: number, data?: any) {
        super(message);
        this.status = status;
        this.data = data;
        this.name = 'ApiError';
    }
}

async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(url, { ...options, credentials: 'include' });
    
    if (response.status === 401 && !url.includes('/api/auth/login') && !url.includes('/api/v1/superadmin/auth/login')) {
        // Only force-logout if the token itself is expired/invalid.
        // Parse the error body to distinguish "expired token" from "insufficient permissions".
        let errorBody: any = null;
        try { errorBody = await response.clone().json(); } catch {}
        const errorMsg = (errorBody?.error || errorBody?.message || '').toLowerCase();
        const isTokenDead = errorMsg.includes('expired') || errorMsg.includes('invalid') || errorMsg.includes('unauthorized');

        if (isTokenDead) {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            localStorage.removeItem('userRole');
            window.location.href = '/login';
            throw new Error('Session expired. Please log in again.');
        }
        // Otherwise, throw an ApiError so the calling component can show a "Forbidden" toast
        throw new ApiError(errorBody?.error || 'Access denied', 401, errorBody);
    }

    if (!response.ok) {
        let errorMessage = `Request failed ${response.status} ${response.statusText}`;
        let errorData = null;
        try {
            const errorJson = await response.json();
            errorData = errorJson;
            if (errorJson) {
                const rawError = errorJson.error || errorJson.message;
                if (typeof rawError === 'string') {
                    errorMessage = rawError;
                } else if (rawError && typeof rawError === 'object') {
                    errorMessage = rawError.error || rawError.message || JSON.stringify(rawError);
                } else if (typeof errorJson.message === 'string') {
                    errorMessage = errorJson.message;
                }
            }
        } catch (e) {
            // Check if response is text
            try {
                const text = await response.text();
                if (text) errorMessage = text;
            } catch (textErr) { }
        }
        throw new ApiError(errorMessage, response.status, errorData);
    }
    const json = await response.json();
    if (json && typeof json === 'object' && 'success' in json && !json.success) {
        throw new Error(json.error || 'Unknown error');
    }
    return json;
}

const getHeaders = () => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
    };

    try {
        // Try to get token from user object in localStorage
        const userStr = localStorage.getItem('user');
        if (userStr && userStr !== 'undefined' && userStr !== 'null') {
            const user = JSON.parse(userStr);
            if (user && user.token) {
                headers['Authorization'] = `Bearer ${user.token}`;
                return headers;
            }
        }
    } catch (e) {
        console.warn('Error parsing user from localStorage:', e);
    }

    try {
        // Fallback: check straightforward 'token' key
        const token = localStorage.getItem('token');
        if (token && token !== 'undefined' && token !== 'null') {
            headers['Authorization'] = `Bearer ${token}`;
        }
    } catch (e) {
        console.warn('Error reading token from localStorage:', e);
    }

    return headers;
};

const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

export const api = {
    // Appointments
    getAppointments: async (params?: { date?: string; doctor_id?: string }) => {
        const query = params ? `?${new URLSearchParams(params as any).toString()}` : '';
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/appointments${query}`, {
            headers: getHeaders()
        });
    },

    getDoctors: async () => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/appointments/doctors`, {
            headers: getHeaders()
        });
    },

    getSchedules: async (doctorId: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/schedules/${doctorId}`, {
            headers: getHeaders()
        });
    },

    getDoctorSlots: async (doctorId: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/schedules/${doctorId}/slots`, {
            headers: getHeaders()
        });
    },

    updateUserProfile: async (data: any) => {
        return fetchJson<any>(`${API_BASE_URL}/api/clinic/users/profile`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
    },

    saveSchedules: async (doctorId: string, schedules: any[]) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/schedules/${doctorId}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ schedules })
        });
    },

    getAppointmentById: async (id: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/appointments/${id}`, {
            headers: getHeaders()
        });
    },

    createAppointment: async (data: any) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/appointments`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
    },

    walkInExpress: async (data: any) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/appointments/walk-in-express`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
    },

    updateAppointment: async (id: string, data: AppointmentUpdatePayload) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/appointments/${id}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
    },

    updateAppointmentStatus: async (id: string, data: AppointmentStatusPayload) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/appointments/${id}/status`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
    },

    // Leads
    getLeads: async () => {
        return fetchJson<any>(`${API_BASE_URL}/api/leads`, {
            headers: getHeaders()
        });
    },

    getLeadById: async (id: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/leads/${id}`, {
            headers: getHeaders()
        });
    },

    createLead: async (data: any) => {
        return fetchJson<any>(`${API_BASE_URL}/api/leads`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
    },

    updateLead: async (id: string, data: any) => {
        return fetchJson<any>(`${API_BASE_URL}/api/leads/${id}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
    },

    reEngageLead: async (id: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/leads/${id}/re-engage`, {
            method: 'POST',
            headers: getHeaders()
        });
    },
    convertLead: async (id: string, payload: any) => {
        return fetchJson<any>(`${API_BASE_URL}/api/leads/${id}/convert`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
    },

    // patients
    getPatients: async () => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/patients`, {
            headers: getHeaders()
        });
    },

    getPatientById: async (id: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/patients/${id}`, {
            headers: getHeaders()
        });
    },

    getPatientTimeline: async (id: string, page: number = 1, limit: number = 20, types: string[] = []) => {
        let url = `${API_BASE_URL}/api/v1/clinics/patients/${id}/timeline?page=${page}&limit=${limit}`;
        if (types.length > 0) {
            url += `&types=${encodeURIComponent(types.join(','))}`;
        }
        return fetchJson<any>(url, {
            headers: getHeaders()
        });
    },

    getPatientAppointments: async (id: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/patients/${id}/appointments`, {
            headers: getHeaders()
        });
    },

    createPatient: async (data: any) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/patients`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
    },

    addPrescription: async (data: { consultation_id?: string; patient_id: string; medications: any[] }) => {
        return fetchJson<any>(`${API_BASE_URL}/api/janmasethu/consultations/prescription`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
    },

    updatePatient: async (id: string, data: any) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/patients/${id}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
    },

    getPatientDocuments: async (id: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/patients/${id}/documents`, {
            headers: getHeaders()
        });
    },

    getGeneratedDocuments: async (id: string) => {
        return fetchJson<any>(`${API_BASE_URL}/janmasethu/documents/patient/${id}`, {
            headers: getHeaders()
        });
    },

    getPatientDashboardData: async (id: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/patients/${id}/dashboard-metrics`, {
            headers: getHeaders()
        });
    },

    addPatientVitals: async (patientId: string, vitalsData: any) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/patients/${patientId}/vitals`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(vitalsData)
        });
    },

    deletePatientVitals: async (patientId: string, vitalId: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/patients/${patientId}/vitals/${vitalId}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
    },

    addPatientAllergy: async (id: string, data: any) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/patients/${id}/allergies`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
    },

    updatePatientAllergy: async (patientId: string, allergyId: string, data: any) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/patients/${patientId}/allergies/${allergyId}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
    },

    deletePatientAllergy: async (patientId: string, allergyId: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/patients/${patientId}/allergies/${allergyId}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
    },

    addPatientMedicalHistory: async (id: string, data: any) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/patients/${id}/medical-history`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
    },

    deletePatientMedicalHistory: async (patientId: string, historyId: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/patients/${patientId}/medical-history/${historyId}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
    },

    getDocumentUploadTicket: async (filename: string, fileSize: number, documentType?: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/documents/upload-ticket`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ filename, fileSize, documentType })
        });
    },

    getUnassignedDocuments: async (page: number = 1, limit: number = 10) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/documents/unassigned?page=${page}&limit=${limit}`, {
            headers: getHeaders()
        });
    },

    getSecureAssetUrl: async (documentId: string) => {
        return fetchJson<{ success: boolean, data: { url: string, expiresIn: number } }>(`${API_BASE_URL}/api/v1/clinics/documents/${documentId}/resolve`, {
            headers: getHeaders()
        });
    },

    getPatientSecureAssetUrl: async (documentId: string) => {
        return fetchJson<{ success: boolean, data: { url: string, expiresIn: number } }>(`${API_BASE_URL}/api/patient-portal/documents/${documentId}/resolve`, {
            headers: getHeaders()
        });
    },

    linkDocument: async (documentId: string, patient_id: string, document_type: string = 'other') => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/documents/${documentId}/link`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({ patient_id, document_type })
        });
    },

    linkNewPatientToDocument: async (documentId: string, payload: { name: string, mobile: string, dob?: string, document_type?: string }) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/documents/${documentId}/link-new-patient`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
    },

    unlinkDocument: async (documentId: string, reason: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/documents/${documentId}/unlink`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({ reason })
        });
    },

    getAuditLogs: async (limit: number = 50) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/audit-logs?limit=${limit}`, {
            headers: getHeaders()
        });
    },

    getSystemAuditLogs: async (filters: { limit?: number; offset?: number; action?: string; target_table?: string; search?: string; start_date?: string; end_date?: string }) => {
        const queryParams = new URLSearchParams();
        if (filters.limit) queryParams.append('limit', filters.limit.toString());
        if (filters.offset !== undefined) queryParams.append('offset', filters.offset.toString());
        if (filters.action) queryParams.append('action', filters.action);
        if (filters.target_table) queryParams.append('target_table', filters.target_table);
        if (filters.search) queryParams.append('search', filters.search);
        if (filters.start_date) queryParams.append('start_date', filters.start_date);
        if (filters.end_date) queryParams.append('end_date', filters.end_date);

        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/audit-logs?${queryParams.toString()}`, {
            headers: getHeaders()
        });
    },

    // --- Document Templates ---
    async getDocumentTemplates() {
        return fetchJson<{ success: boolean; data: any[] }>(`${API_BASE_URL}/api/v1/clinics/document-templates`, { headers: getHeaders() });
    },

    // --- Room Management & Admissions ---
    async getRoomsAvailable(tier?: string) {
        const url = tier ? `${API_BASE_URL}/api/v1/clinics/rooms/available?tier=${tier}` : `${API_BASE_URL}/api/v1/clinics/rooms/available`;
        return fetchJson<{ success: boolean; data: any[] }>(url, { headers: getHeaders() });
    },

    async cancelAdmission(id: string) {
        return fetchJson<{ success: boolean }>(`${API_BASE_URL}/api/v1/clinics/admissions/${id}/cancel`, {
            method: 'POST',
            headers: getHeaders(),
        });
    },

    deleteDocument: async (documentId: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/documents/${documentId}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
    },
    registerDocument: async (data: { patient_id?: string; name: string; file_path: string; file_size: number; mime_type: string; document_type: string }) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/documents/register`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
    },

    resetPatientPin: async (id: string, newPin?: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/patients/${id}/reset-pin`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ newPin })
        });
    },

    uploadPatientDocument: async (id: string, file: File) => {
        // Convert to Base64
        const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const result = reader.result as string;
                // Remove data url prefix (e.g. "data:image/png;base64,")
                const base64 = result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = error => reject(error);
        });

        const base64 = await toBase64(file);

        const payload = {
            name: file.name,
            document_type: 'Uploaded', // Default type
            contentType: file.type || 'application/octet-stream',
            base64: base64
        };

        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/patients/${id}/documents`, {
            method: 'POST',
            headers: getHeaders(), // application/json
            body: JSON.stringify(payload)
        });
    },

    saveClinicalNote: async (patientId: string, note: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/patients/${patientId}/clinical-notes`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ note })
        });
    },

    getClinicalNotes: async (patientId: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/patients/${patientId}/clinical-notes`, {
            headers: getHeaders()
        });
    },

    searchPatients: async (query: string) => {
        // Debounce should happen in UI, this just calls the endpoint
        const params = new URLSearchParams();
        if (/^\d+$/.test(query)) {
            // If query is digits, assume phone search if length > 5, else use generic q
            // Backend spec says: q=<partial> OR phone=<exact>
            // We'll use 'q' for general search which covers both name and mobile ilike
            params.append('q', query);
        } else {
            params.append('q', query);
        }

        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/patients?${params.toString()}`, {
            headers: getHeaders()
        });
    },

    // Room Allocation
    getRoomCategories: async () => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/room-categories`, { headers: getHeaders() });
    },
    createRoomCategory: async (data: any) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/room-categories`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
    },
    updateRoomCategory: async (id: string, data: any) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/room-categories/${id}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
    },
    deleteRoomCategory: async (id: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/room-categories/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
    },
    getRooms: async () => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/rooms`, { headers: getHeaders() });
    },
    createRoom: async (data: any) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/rooms`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
    },
    updateRoom: async (id: string, data: any) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/rooms/${id}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
    },
    getBeds: async (status?: string) => {
        const query = status ? `?status=${status}` : '';
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/beds${query}`, { headers: getHeaders() });
    },
    createBed: async (roomId: string, data: any) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/rooms/${roomId}/beds`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
    },
    updateBedStatus: async (id: string, status: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/beds/${id}/status`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({ status })
        });
    },
    getAdmissions: async (status?: string) => {
        const query = status ? `?status=${status}` : '';
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/admissions${query}`, { headers: getHeaders() });
    },
    createAdmission: async (data: any) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/admissions`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
    },
    dischargeAdmission: async (id: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/admissions/${id}/discharge`, {
            method: 'PATCH',
            headers: getHeaders()
        });
    },
    transferBed: async (id: string, newBedId: string, reason?: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/admissions/${id}/transfer`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ new_bed_id: newBedId, reason })
        });
    },
    getRoomDashboardSummary: async () => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/room-dashboard/summary`, { headers: getHeaders() });
    },

    // Dashboard
    getDashboardSummary: async () => {
        return fetchJson<any>(`${API_BASE_URL}/api/dashboard/summary`, {
            headers: getHeaders()
        });
    },

    getCRODashboard: async () => {
        // Use any for kpis to allow flexible key mapping in DashboardHome
        return fetchJson<{
            success: boolean;
            data: {
                kpis: {
                    conversionRate?: number;
                    croSuccessRate?: number;
                    avgTimeToConvertDays?: number;  // Backend key name
                    patientChurnRate?: number;      // Backend key name
                    // Trend values (may not be present)
                    conversionRateTrend?: number;
                    croSuccessRateTrend?: number;
                    avgTimeToConvertDaysTrend?: number;
                    patientChurnRateTrend?: number;
                };
                funnel?: {
                    newLeads: number;
                    firstConsult: number;
                    followUp: number;
                    converted: number;
                };
                interventionQueue?: any[];
            };
        }>(`${API_BASE_URL}/api/dashboard/cro`, {
            headers: getHeaders()
        });
    },

    // Auth
    login: async (credentials: any) => {
        return fetchJson<any>(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(credentials)
        });
    },

    logout: async () => {
        return fetchJson<any>(`${API_BASE_URL}/api/auth/logout`, {
            method: 'POST',
            headers: getHeaders()
        });
    },

    verifySession: async () => {
        return fetchJson<any>(`${API_BASE_URL}/api/auth/me`, {
            headers: getHeaders()
        });
    },

    updateProfile: async (data: { name?: string; email?: string }) => {
        return fetchJson<any>(`${API_BASE_URL}/api/auth/profile`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
    },

    changePassword: async (data: { currentPassword?: string; newPassword?: string }) => {
        return fetchJson<any>(`${API_BASE_URL}/api/auth/change-password`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
    },


    // Users (Team Management)
    getClinicUsers: async () => {
        return fetchJson<any>(`${API_BASE_URL}/api/clinic/users`, {
            headers: getHeaders()
        });
    },

    createClinicUser: async (data: any) => {
        return fetchJson<any>(`${API_BASE_URL}/api/clinic/users`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
    },

    updateClinicUser: async (id: string, data: any) => {
        return fetchJson<any>(`${API_BASE_URL}/api/clinic/users/${id}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
    },

    removeClinicUser: async (id: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/clinic/users/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
    },

    // Control Tower
    getPatientFlowSummary: async () => {
        return fetchJson<any>(`${API_BASE_URL}/api/control-tower/patient-flow-summary`, {
            headers: getHeaders()
        });
    },

    getWaitingAlerts: async () => {
        return fetchJson<any>(`${API_BASE_URL}/api/control-tower/waiting-alerts`, {
            headers: getHeaders()
        });
    },

    getLiveQueue: async () => {
        return fetchJson<any>(`${API_BASE_URL}/api/control-tower/live-queue`, {
            headers: getHeaders()
        });
    },

    getDoctorUtilization: async () => {
        return fetchJson<any>(`${API_BASE_URL}/api/control-tower/doctor-utilization`, {
            headers: getHeaders()
        });
    },

    getLeadSnapshot: async () => {
        return fetchJson<any>(`${API_BASE_URL}/api/control-tower/lead-summary`, {
            headers: getHeaders()
        });
    },



    getInboxThreads: async () => {
        return fetchJson<any>(`${API_BASE_URL}/api/janmasethu/threads`, {
            headers: getHeaders()
        });
    },

    getOverviewAnalytics: async () => {
        return fetchJson<any>(`${API_BASE_URL}/api/janmasethu/analytics/dashboard`, {
            headers: getHeaders()
        });
    },

    replyToThread: async (data: { thread_id: string; sender_type: string; content: string }) => {
        return fetchJson<any>(`${API_BASE_URL}/api/janmasethu/reply`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
    },

    getThreadContext: async (threadId: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/janmasethu/context/${threadId}`, {
            headers: getHeaders()
        });
    },

    getDoctorQueue: async () => {
        return fetchJson<any>(`${API_BASE_URL}/api/thread/queue/doctor`, {
            headers: getHeaders()
        });
    },

    getNurseQueue: async () => {
        return fetchJson<any>(`${API_BASE_URL}/api/thread/queue/nurse`, {
            headers: getHeaders()
        });
    },

    takeControl: async (threadId: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/janmasethu/take-control/${threadId}`, {
            method: 'POST',
            headers: getHeaders()
        });
    },

    escalateThread: async (threadId: string, targetStatus: 'red' | 'yellow', assignedUserId?: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/janmasethu/escalate/${threadId}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ targetStatus, assignedUserId })
        });
    },

    saveVitals: async (data: { patientId: string; appointmentId?: string; systolic?: number; diastolic?: number; temperature?: number; temp_unit?: string; heartRate?: number; pulse?: number; weight?: number; weight_unit?: string; height?: number; height_unit?: string; notes?: string }) => {
        return fetchJson<any>(`${API_BASE_URL}/api/vitals`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
    },

    getVitals: async (patientId: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/vitals/${patientId}`, {
            headers: getHeaders()
        });
    },



    // Internal Assistant
    internalAssistant: {
        chat: async (payload: { message?: string; confirmationToken?: string; cancelToken?: string }) => {
            return fetchJson<{ reply: string; type?: string; options?: any[] }>(`${API_BASE_URL}/api/internal-assistant/chat`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(payload)
            });
        }
    },

    // Workspace Threads
    getWorkspaceThreads: async () => {
        return fetchJson<any>(`${API_BASE_URL}/api/control-tower/threads`, {
            headers: getHeaders()
        });
    },

    getWorkspaceClinicians: async () => {
        return fetchJson<any>(`${API_BASE_URL}/api/control-tower/clinicians`, {
            headers: getHeaders()
        });
    },

    getWorkspaceThreadById: async (threadId: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/control-tower/threads/${threadId}`, {
            headers: getHeaders()
        });
    },

    getWorkspaceThreadMessages: async (threadId: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/control-tower/threads/${threadId}/messages`, {
            headers: getHeaders()
        });
    },

    assignWorkspaceThread: async (threadId: string, payload: any) => {
        return fetchJson<any>(`${API_BASE_URL}/api/control-tower/threads/${threadId}/assign`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
    },

    escalateWorkspaceThread: async (threadId: string, payload: any) => {
        return fetchJson<any>(`${API_BASE_URL}/api/control-tower/threads/${threadId}/escalate`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
    },

    replyToWorkspaceThread: async (threadId: string, payload: any) => {
        return fetchJson<any>(`${API_BASE_URL}/api/control-tower/threads/${threadId}/reply`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
    },

    resolveWorkspaceThread: async (threadId: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/control-tower/threads/${threadId}/resolve`, {
            method: 'POST',
            headers: getHeaders()
        });
    },

    refreshWorkspaceSummary: async (threadId: string, payload?: any) => {
        return fetchJson<any>(`${API_BASE_URL}/api/control-tower/threads/${threadId}/refresh-summary`, {
            method: 'POST',
            headers: getHeaders(),
            body: payload ? JSON.stringify(payload) : undefined
        });
    },

    // ==========================================
    // SUPER ADMIN SYSTEM OPERATIONS
    // ==========================================
    superAdminLogin: async (data: any) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/superadmin/auth/login`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    getSuperAdminAnalytics: async () => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/superadmin/analytics`, {
            headers: getHeaders()
        });
    },

    getSuperAdminClinics: async () => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/superadmin/clinics`, {
            headers: getHeaders()
        });
    },

    createClinic: async (data: any) => {
        // Automatically inject request_id for idempotency on the backend
        const payload = {
            ...data,
            request_id: data.request_id || generateUUID()
        };
        return fetchJson<any>(`${API_BASE_URL}/api/v1/superadmin/clinics`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
    },

    deleteClinic: async (id: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/superadmin/clinics/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
    }
};

