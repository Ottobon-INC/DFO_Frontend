import toast from 'react-hot-toast';

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
        try { errorBody = await response.clone().json(); } catch { }
        const errorMsg = (errorBody?.error || errorBody?.message || '').toLowerCase();
        const isTokenDead = errorMsg.includes('expired') || errorMsg.includes('invalid') || errorMsg.includes('unauthorized');

        if (isTokenDead) {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            localStorage.removeItem('userRole');
            window.location.href = '/login';
            toast.error('Session expired. Please log in again.');
            throw new Error('Session expired. Please log in again.');
        }
        // Otherwise, throw an ApiError so the calling component can show a "Forbidden" toast
        const apiError = new ApiError(errorBody?.error || 'Access denied', 401, errorBody);
        toast.error(apiError.message);
        throw apiError;
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
        toast.error(errorMessage);
        throw new ApiError(errorMessage, response.status, errorData);
    }
    const json = await response.json();
    if (json && typeof json === 'object' && 'success' in json && !json.success) {
        toast.error(json.error || 'Unknown error');
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
            }
            if (user && user.id) {
                headers['x-user-id'] = user.id;
            }
            if (user && user.role) {
                headers['x-user-role'] = user.role;
            }
            if (user && user.clinic_id) {
                headers['x-clinic-id'] = user.clinic_id;
            }
            if (user && user.token) {
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
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

export const api = {
    // Appointments
    getAppointments: async (params?: { date?: string; doctor_id?: string; start_date?: string; end_date?: string; limit?: number; page?: number }) => {
        const query = params ? `?${new URLSearchParams(params as any).toString()}` : '';
        const res = await fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/appointments${query}`, {
            headers: getHeaders()
        });

        // Map backend schema to frontend expectations
        const mapAppointment = (appt: any) => ({
            ...appt,
            id: appt.appointmentId || appt.id,
            patientName: appt.patientName || (appt.patient ? `${appt.patient.firstName || ''} ${appt.patient.lastName || ''}`.trim() : 'Unknown'),
            time: appt.slotTime || appt.time,
            date: appt.appointmentDate ? appt.appointmentDate.split('T')[0] : appt.date,
            type: appt.type || (appt.department ? appt.department.name : 'General Consultation')
        });

        if (res.data && Array.isArray(res.data)) {
            res.data = res.data.map(mapAppointment);
        } else if (Array.isArray(res)) {
            return res.map(mapAppointment);
        }
        return res;
    },

    getDoctors: async () => {
        const res = await fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/staff`, {
            headers: getHeaders()
        });
        if (res && res.success && Array.isArray(res.data)) {
            // Filter for doctors and map to expected format
            res.data = res.data
                .filter((staff: any) => staff.role?.toLowerCase() === 'doctor')
                .map((staff: any) => ({
                    id: staff.id,
                    name: staff.sakhi_clinic_users?.name || staff.name || [staff.first_name, staff.last_name].filter(Boolean).join(' ') || 'Unknown Doctor',
                    ...staff
                }));
        }
        return res;
    },

    getSchedules: async (doctorId: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/schedules/${doctorId}`, {
            headers: getHeaders()
        });
    },

    getDoctorSlots: async (doctorId: string, startDate?: string, endDate?: string) => {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        const queryStr = params.toString() ? `?${params.toString()}` : '';
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/schedules/${doctorId}/slots${queryStr}`, {
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

    saveSchedules: async (doctorId: string, schedules: any[], startDate?: string, endDate?: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/schedules/${doctorId}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ schedules, startDate, endDate })
        });
    },

    setDoctorLeave: async (doctorId: string, leaveDate: string, leaveType?: string, reason?: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/schedules/${doctorId}/leave`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ leaveDate, leaveType, reason })
        });
    },

    removeDoctorLeave: async (doctorId: string, leaveDate: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/schedules/${doctorId}/leave/${leaveDate}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
    },

    getDoctorLeaves: async (doctorId: string, startDate?: string, endDate?: string) => {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        const queryStr = params.toString() ? `?${params.toString()}` : '';
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/clinics/schedules/${doctorId}/leaves${queryStr}`, {
                headers: getHeaders()
            });
            if (!res.ok) return { success: true, data: [] };
            const json = await res.json();
            return json || { success: true, data: [] };
        } catch (e) {
            return { success: true, data: [] };
        }
    },

    getAppointmentById: async (id: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/appointments/${id}`, {
            headers: getHeaders()
        });
    },

    createAppointment: async (data: any) => {
        let patientId = data.patient_id || data.lead_id || 'UNKNOWN';

        // If patientId is missing (e.g. creating lead on the fly in UI), we must create it first!
        if (patientId === 'UNKNOWN') {
            try {
                const patientRes = await api.createPatient({
                    name: data.patient_name_snapshot || data.name,
                    phone: data.patient_phone_snapshot || data.phone,
                    gender: data.sex_snapshot || data.gender,
                    age: data.patient_age_snapshot || data.age,
                    email: data.patient_email_snapshot || data.email
                });
                patientId = patientRes.data?.id || patientRes.id || patientRes.patientId;
            } catch (err: any) {
                // If patient already exists (409 Conflict), search by phone
                if (err?.message?.includes('409') || err?.status === 409 || err?.response?.status === 409 || String(err).includes('409')) {
                    try {
                        const searchRes = await api.searchPatients(data.patient_phone_snapshot || data.phone);
                        const found = searchRes?.data?.items?.find((p: any) => p.phone === (data.patient_phone_snapshot || data.phone)) || (Array.isArray(searchRes) ? searchRes.find((p: any) => p.phone === (data.patient_phone_snapshot || data.phone)) : null);
                        if (found) {
                            patientId = found.id || found.patientId;
                        } else {
                            throw err; // Still fail if not found
                        }
                    } catch (searchErr) {
                        throw err; // Throw original 409 if search fails
                    }
                } else {
                    throw err;
                }
            }
        }

        const backendPayload = {
            patient_id: patientId,
            doctor_id: data.doctor_id,
            appointment_date: data.appointment_date,
            start_time: data.start_time || data.appointment_time,
            type: (data.type || 'CONSULTATION').toUpperCase(),
            visit_reason: data.visit_reason || data.reason || 'Checkup'
        };

        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/appointments`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(backendPayload)
        });
    },

    walkInExpress: async (data: any) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/appointments/walk-in-express`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
    },

    qmsWalkIn: async (data: {
        doctor_id: string; date: string; time: string; mobile: string; name: string;
        patient_id?: string; type?: string; visit_reason?: string;
        doctor_name_snapshot?: string; referral_doctor?: string; referral_doctor_phone?: string;
        patient_email_snapshot?: string; patient_age_snapshot?: string; sex_snapshot?: string;
        patient_marital_status_snapshot?: string; patient_address_snapshot?: string;
    }) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/qms/queue/walk-in`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
    },

    createWalkInQueue: async (data: {
        patient_id?: string;
        doctor_id?: string;
        chief_complaint?: string;
        priority?: string;
        [key: string]: any;
    }) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/qms/queue/walk-in`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
    },

    enqueuePatient: async (appointment_id: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/qms/queue/enqueue`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ appointment_id })
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
            body: JSON.stringify({ status: data.status })
        });
    },

    checkinAndConvert: async (id: string, notes?: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/appointments/${id}/checkin-convert`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ clinicalNotes: notes })
        });
    },

    // Leads
    getLeads: async (params?: { phone?: string; status?: string; q?: string; page?: number; limit?: number }) => {
        const query = params ? `?${new URLSearchParams(params as any).toString()}` : '';
        return fetchJson<any>(`${API_BASE_URL}/api/leads${query}`, {
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
    getPatients: async (params?: { page?: number; limit?: number; q?: string; phone?: string }) => {
        const query = params ? `?${new URLSearchParams(params as any).toString()}` : '';
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/patients${query}`, {
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
        // Translate frontend payload to backend schema
        const name = (data.name || data.fullname || '').trim();
        const mobile = data.mobile || data.phone;
        const location = [data.house, data.street, data.city, data.state, data.location].filter(Boolean).join(', ') || data.address || null;

        const backendPayload = {
            name,
            age: data.age ? parseInt(data.age) : undefined,
            dob: data.dob || undefined,
            gender: data.gender || undefined,
            marital_status: data.marital_status || data.maritalStatus || undefined,
            blood_group: data.bloodGroup || data.blood_group || undefined,
            email: data.email || undefined,
            mobile,
            street: location || undefined,
            kin_name: data.kin_name || undefined,
            kin_relation: data.kin_relation || undefined,
            kin_phone: data.kin_phone || undefined,
            assigned_doctor_id: data.assigned_doctor_id || data.assignedDoctorId || undefined,
            referral_doctor: data.referral_doctor || data.referralDoctor || undefined,
            status: 'ACTIVE'
        };

        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/patients`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(backendPayload)
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

    uploadUnassignedDocument: async (file: File) => {
        const toBase64 = (f: File) => new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(f);
            reader.onload = () => {
                const result = reader.result as string;
                const base64 = result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = error => reject(error);
        });

        const base64 = await toBase64(file);

        const payload = {
            name: file.name,
            document_type: 'Uploaded',
            contentType: file.type || 'application/octet-stream',
            base64: base64
        };

        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/documents/upload-unassigned`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
    },

    getUnassignedDocuments: async (page: number = 1, limit: number = 10) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/documents/unassigned?page=${page}&limit=${limit}`, {
            headers: getHeaders()
        });
    },

    getSecureAssetUrl: async (documentId: string) => {
        return fetchJson<{ success: boolean, data?: { url: string, expiresIn: number }, error?: string }>(`${API_BASE_URL}/api/v1/clinics/documents/${documentId}/resolve`, {
            headers: getHeaders()
        });
    },

    getPatientSecureAssetUrl: async (documentId: string) => {
        return fetchJson<{ success: boolean, data?: { url: string, expiresIn: number }, error?: string }>(`${API_BASE_URL}/api/patient-portal/documents/${documentId}/resolve`, {
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
        // Adapt frontend to backend: calculate summary from today's appointments
        const today = new Date().toISOString().split('T')[0];
        const res = await fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/appointments?date=${today}`, { headers: getHeaders() });
        const appts = res.data || res || [];
        const arrived = appts.filter((a: any) => a.status === 'Arrived' || a.status === 'Checked-In').length;
        return {
            success: true, data: {
                kpis: {
                    totalWalkIns: appts.length,
                    revenueToday: 0,
                    activeWaiting: arrived,
                    avgWaitTime: arrived > 0 ? 15 : 0,
                    // mock trends
                    totalWalkInsTrend: 5,
                    revenueTodayTrend: 0,
                    activeWaitingTrend: -2,
                    avgWaitTimeTrend: 0
                }
            }
        };
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

    forgotPassword: async (data: { email: string; phone_number?: string; hospital_id?: string }) => {
        return fetchJson<any>(`${API_BASE_URL}/api/auth/forgot-password`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
    },

    resetPassword: async (data: { email: string; reset_code: string; reset_session_token?: string; new_password: string }) => {
        return fetchJson<any>(`${API_BASE_URL}/api/auth/reset-password`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
    },

    submitDemoRequest: async (data: {
        name: string;
        hospital_name: string;
        email: string;
        phone: string;
        designation?: string;
        city?: string;
        patient_volume?: string;
        preferred_contact_method?: string;
        preferred_slot?: string;
        message?: string;
    }) => {
        return fetchJson<any>(`${API_BASE_URL}/api/auth/demo-request`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
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
        const today = new Date().toISOString().split('T')[0];
        const res = await fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/appointments?date=${today}`, { headers: getHeaders() });
        const appts = res.data || res || [];
        return {
            scheduled: appts.length,
            arrived: appts.filter((a: any) => a.status === 'Arrived').length,
            checkedIn: appts.filter((a: any) => a.status === 'Checked-In').length,
            completed: appts.filter((a: any) => a.status === 'Completed').length
        };
    },

    getWaitingAlerts: async () => {
        const today = new Date().toISOString().split('T')[0];
        const res = await fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/appointments?date=${today}`, { headers: getHeaders() });
        const appts = res.data || res || [];
        const waiting = appts.filter((a: any) => a.status === 'Checked-In' || a.status === 'Arrived');

        return waiting.map((w: any) => ({
            id: w.id,
            patientName: w.patientName || w.patient_name_snapshot || 'Unknown',
            waitTimeMinutes: 20, // Mocked derived wait time for demo
            alertLevel: 'warning'
        }));
    },

    getLiveQueue: async () => {
        const today = new Date().toISOString().split('T')[0];
        const res = await fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/appointments?date=${today}`, { headers: getHeaders() });
        const appts = res.data || res || [];

        return appts.map((a: any) => ({
            id: a.id,
            patient_name: a.patientName || a.patient_name_snapshot || 'Unknown',
            doctor_name: a.doctorName || a.doctor_name_snapshot || 'Unknown',
            status: a.status,
            time_in_status: '15m'
        }));
    },

    getDoctorUtilization: async () => {
        const today = new Date().toISOString().split('T')[0];
        const res = await fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/appointments?date=${today}`, { headers: getHeaders() });
        const appts = res.data || res || [];

        // Group by doctor
        const docs: any = {};
        appts.forEach((a: any) => {
            const dName = a.doctorName || a.doctor_name_snapshot || 'General';
            if (!docs[dName]) docs[dName] = { name: dName, patients_seen: 0, current_status: 'Available' };
            if (a.status === 'Completed') docs[dName].patients_seen++;
            if (a.status === 'In Progress') docs[dName].current_status = 'In Consultation';
        });

        return Object.values(docs);
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
        return fetchJson<any>(`${API_BASE_URL}/thread/queue/doctor`, {
            headers: getHeaders()
        });
    },

    getSakhiEscalations: async (doctorId: string, clinicId?: string) => {
        const queryParams = new URLSearchParams({ doctorId });
        if (clinicId) queryParams.append('clinicId', clinicId);
        return fetchJson<any>(`${API_BASE_URL}/api/escalations/doctor?${queryParams.toString()}`, {
            headers: getHeaders()
        });
    },

    getEscalationMessages: async (escalationId: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/escalations/${escalationId}/messages`, {
            headers: getHeaders()
        });
    },

    resolveSakhiEscalation: async (id: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/escalations/${id}/status`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({ status: 'RESOLVED' })
        });
    },

    getNurseQueue: async () => {
        return fetchJson<any>(`${API_BASE_URL}/thread/queue/nurse`, {
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

    savePatientVitalsBulk: async (payload: { vitals: any[] }) => {
        if (!payload.vitals || payload.vitals.length === 0) return [];
        const patientId = payload.vitals[0].patient_id;
        const vitalsList = payload.vitals.map(v => ({
            patient_id: v.patient_id,
            vital_type: v.vital_type,
            vital_value: v.value !== undefined ? v.value : v.vital_value,
            value: v.value !== undefined ? v.value : v.vital_value,
            appointment_id: v.appointment_id,
            recorded_at: v.recorded_at || new Date().toISOString()
        }));
        return api.addPatientVitals(patientId, vitalsList);
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
        return fetchJson<any>(`${API_BASE_URL}/api/threads`, {
            headers: getHeaders()
        });
    },

    getWorkspaceClinicians: async () => {
        return fetchJson<any>(`${API_BASE_URL}/api/threads/clinicians`, {
            headers: getHeaders()
        });
    },

    getWorkspaceThreadById: async (threadId: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/threads/${threadId}`, {
            headers: getHeaders()
        });
    },

    getWorkspaceThreadMessages: async (threadId: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/threads/${threadId}/messages`, {
            headers: getHeaders()
        });
    },

    assignWorkspaceThread: async (threadId: string, data: { assignTo: string; role: string }) => {
        return fetchJson<any>(`${API_BASE_URL}/api/threads/${threadId}/assign`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ ownerId: data.assignTo, ownerType: data.role })
        });
    },

    escalateWorkspaceThread: async (threadId: string, data: { reason: string; status: string; riskScore: number }) => {
        return fetchJson<any>(`${API_BASE_URL}/api/threads/${threadId}/escalate`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
    },

    replyToWorkspaceThread: async (threadId: string, data: { message: string }) => {
        return fetchJson<any>(`${API_BASE_URL}/api/threads/${threadId}/reply`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
    },

    resolveWorkspaceThread: async (threadId: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/threads/${threadId}/resolve`, {
            method: 'POST',
            headers: getHeaders()
        });
    },

    refreshWorkspaceSummary: async (threadId: string, data: { clinicalSummary: string; handoffSummary: string }) => {
        return fetchJson<any>(`${API_BASE_URL}/api/threads/${threadId}/refresh-summary`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
    },

    // ==========================================
    // SUPER ADMIN SYSTEM OPERATIONS
    // ==========================================
    superAdminLogin: async (data: any) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/superadmin/auth/login`, {
            method: 'POST',
            headers: getHeaders(),
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

    getSuperAdminDemoRequests: async (status?: string) => {
        const query = status ? `?status=${status}` : '';
        return fetchJson<any>(`${API_BASE_URL}/api/v1/superadmin/demo-requests${query}`, {
            headers: getHeaders()
        });
    },

    updateSuperAdminDemoRequest: async (id: string, data: any) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/superadmin/demo-requests/${id}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
    },

    deleteClinic: async (id: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/superadmin/clinics/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
    },

    // --- ABDM / ABHA ---
    requestAadhaarOtpForCreation: async (aadhaar: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/abdm/test-aadhaar-otp`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ aadhaar })
        });
    },
    enrolAbhaViaAadhaarOtp: async (patientId: string, txnId: string, otp: string, mobile: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/abdm/enrol-aadhaar-otp`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ patientId, txnId, otp, mobile })
        });
    },
    getAbhaAddressSuggestions: async (patientId: string, txnId: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/abdm/enrol-abha-address-suggestions?patientId=${patientId}&txnId=${txnId}`, {
            headers: getHeaders()
        });
    },
    createAbhaAddress: async (patientId: string, txnId: string, abhaAddress: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/abdm/enrol-abha-address`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ patientId, txnId, abhaAddress })
        });
    },
    searchAuthMethods: async (patientId: string, abhaAddress: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/abdm/search-auth-methods`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ patientId, abhaAddress })
        });
    },
    requestMobileOtp: async (patientId: string, abhaAddress: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/abdm/request-mobile-otp`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ patientId, abhaAddress })
        });
    },
    verifyMobileOtp: async (patientId: string, txnId: string, otp: string, abhaAddress: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/abdm/verify-mobile-otp`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ patientId, txnId, otp, abhaAddress })
        });
    },
    searchAuthMethodsAadhaar: async (patientId: string, abhaAddress: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/abdm/verification/aadhaar/search`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ patientId, abhaAddress })
        });
    },
    requestAadhaarOtpForVerification: async (patientId: string, abhaAddress: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/abdm/verification/aadhaar/request-otp`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ patientId, abhaAddress })
        });
    },
    verifyAadhaarOtpForVerification: async (patientId: string, txnId: string, otp: string, abhaAddress: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/abdm/verification/aadhaar/verify-otp`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ patientId, txnId, otp, abhaAddress })
        });
    }
};

