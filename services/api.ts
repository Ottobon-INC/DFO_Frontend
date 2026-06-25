

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
        if (userStr) {
            const user = JSON.parse(userStr);
            if (user.token) {
                headers['Authorization'] = `Bearer ${user.token}`;
                return headers;
            }
        }

        // Fallback: check straightforward 'token' key
        const token = localStorage.getItem('token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    } catch (e) {
        // Ignore parsing errors
    }

    return headers;
};

export const api = {
    // Appointments
    getAppointments: async (params?: { date?: string; doctor_id?: string }) => {
        const query = params ? `?${new URLSearchParams(params as any).toString()}` : '';
        return fetchJson<any>(`${API_BASE_URL}/api/appointments${query}`, {
            headers: getHeaders()
        });
    },

    getDoctors: async () => {
        return fetchJson<any>(`${API_BASE_URL}/api/appointments/doctors`, {
            headers: getHeaders()
        });
    },

    getAppointmentById: async (id: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/appointments/${id}`, {
            headers: getHeaders()
        });
    },

    createAppointment: async (data: any) => {
        return fetchJson<any>(`${API_BASE_URL}/api/appointments`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
    },

    updateAppointment: async (id: string, data: AppointmentUpdatePayload) => {
        return fetchJson<any>(`${API_BASE_URL}/api/appointments/${id}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
    },

    updateAppointmentStatus: async (id: string, data: AppointmentStatusPayload) => {
        return fetchJson<any>(`${API_BASE_URL}/api/appointments/${id}/status`, {
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

    // patients
    getPatients: async () => {
        return fetchJson<any>(`${API_BASE_URL}/api/patients`, {
            headers: getHeaders()
        });
    },

    getPatientById: async (id: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/patients/${id}`, {
            headers: getHeaders()
        });
    },

    getPatientAppointments: async (id: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/patients/${id}/appointments`, {
            headers: getHeaders()
        });
    },

    createPatient: async (data: any) => {
        return fetchJson<any>(`${API_BASE_URL}/api/patients`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
    },

    updatePatient: async (id: string, data: any) => {
        return fetchJson<any>(`${API_BASE_URL}/api/patients/${id}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
    },

    getPatientDocuments: async (id: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/patients/${id}/documents`, {
            headers: getHeaders()
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

        return fetchJson<any>(`${API_BASE_URL}/api/patients/${id}/documents`, {
            method: 'POST',
            headers: getHeaders(), // application/json
            body: JSON.stringify(payload)
        });
    },

    saveClinicalNote: async (patientId: string, note: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/patients/${patientId}/clinical-notes`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ note })
        });
    },

    getClinicalNotes: async (patientId: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/patients/${patientId}/clinical-notes`, {
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

        return fetchJson<any>(`${API_BASE_URL}/api/patients?${params.toString()}`, {
            headers: getHeaders()
        });
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
                funnel?: any[];
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



    getAuditLogs: async () => {
        return fetchJson<any>(`${API_BASE_URL}/api/janmasethu/audit-logs`, {
            headers: getHeaders()
        });
    },

    getInboxThreads: async () => {
        return fetchJson<any>(`${API_BASE_URL}/api/janmasethu/threads`, {
            headers: getHeaders()
        });
    },

    getOverviewAnalytics: async () => {
        return fetchJson<any>(`${API_BASE_URL}/api/janmasethu/analytics`, {
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

    saveVitals: async (data: { patientId: string; systolic?: number; diastolic?: number; temperature?: number; heartRate?: number; pulse?: number; weight?: number; height?: number; notes?: string }) => {
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

    // New Control Tower Conversation Workspace APIs
    getWorkspaceThreads: async () => {
        return fetchJson<any>(`${API_BASE_URL}/api/threads`, {
            headers: getHeaders()
        });
    },
    getWorkspaceThreadById: async (id: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/threads/${id}`, {
            headers: getHeaders()
        });
    },
    getWorkspaceThreadMessages: async (id: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/threads/${id}/messages`, {
            headers: getHeaders()
        });
    },
    assignWorkspaceThread: async (id: string, data: { assignTo: string; role: string }) => {
        return fetchJson<any>(`${API_BASE_URL}/api/threads/${id}/assign`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
    },
    escalateWorkspaceThread: async (id: string, data: { reason: string; status: string; riskScore: number }) => {
        return fetchJson<any>(`${API_BASE_URL}/api/threads/${id}/escalate`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
    },
    replyToWorkspaceThread: async (id: string, data: { message: string }) => {
        return fetchJson<any>(`${API_BASE_URL}/api/threads/${id}/reply`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
    },
    resolveWorkspaceThread: async (id: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/threads/${id}/resolve`, {
            method: 'POST',
            headers: getHeaders()
        });
    },
    refreshWorkspaceSummary: async (id: string, data: { clinicalSummary: string; handoffSummary: string }) => {
        return fetchJson<any>(`${API_BASE_URL}/api/threads/${id}/refresh-summary`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
    },
    getWorkspaceClinicians: async () => {
        return fetchJson<any>(`${API_BASE_URL}/api/threads/clinicians`, {
            headers: getHeaders()
        });
    },

    // Availability
    setAvailability: async (userId: string, isAvailable: boolean) => {
        return fetchJson<any>(`${API_BASE_URL}/api/clinic/users/${userId}/availability`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({ is_available: isAvailable })
        });
    },

    getAvailableClinicians: async () => {
        return fetchJson<any>(`${API_BASE_URL}/api/clinic/users/available`, {
            headers: getHeaders()
        });
    },

    // Generate AI summary for thread
    generateThreadSummary: async (threadId: string) => {
        return fetchJson<any>(`${API_BASE_URL}/api/threads/${threadId}/generate-summary`, {
            method: 'POST',
            headers: getHeaders()
        });
    },
};
