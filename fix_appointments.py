import os

api_path = r'c:\Users\adrad\OneDrive\Desktop\dfo-frontend\services\api.ts'

with open(api_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace createAppointment
old_create_appointment = """    createAppointment: async (data: any) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/appointments`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
    },"""

new_create_appointment = """    createAppointment: async (data: any) => {
        // Adapt frontend payload to backend BookAppointmentSchema
        const backendPayload = {
            patientId: data.patient_id || data.lead_id || 'UNKNOWN',
            doctorId: data.doctor_id || 'UNKNOWN',
            date: data.appointment_date,
            time: data.appointment_time,
            type: (data.type || 'CONSULTATION').toUpperCase(),
            reason: data.visit_reason || 'Checkup',
            resourceId: null,
            bookedBy: 'FRONTEND_USER' // TODO: replace with actual user ID if available
        };

        // If patientId is missing (e.g. creating lead on the fly in UI), we must create it first!
        if (backendPayload.patientId === 'UNKNOWN') {
            const patientRes = await api.createPatient({
                name: data.patient_name_snapshot || data.name,
                phone: data.patient_phone_snapshot || data.phone,
                gender: data.sex_snapshot || data.gender,
                age: data.patient_age_snapshot || data.age,
                email: data.patient_email_snapshot || data.email
            });
            backendPayload.patientId = patientRes.data?.id || patientRes.id;
        }

        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/appointments`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(backendPayload)
        });
    },"""

if old_create_appointment in content:
    content = content.replace(old_create_appointment, new_create_appointment)
else:
    print("Warning: old_create_appointment not found")

# Replace updateAppointmentStatus
old_update_status = """    updateAppointmentStatus: async (id: string, data: AppointmentStatusPayload) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/appointments/${id}/status`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
    },"""

new_update_status = """    updateAppointmentStatus: async (id: string, data: AppointmentStatusPayload) => {
        // Backend expects PUT to specific transition endpoints, OR PUT /status?status=...
        // We will map based on data.status
        const s = data.status.toUpperCase();
        if (s === 'CONFIRMED') {
            return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/appointments/${id}/confirm`, { method: 'PUT', headers: getHeaders() });
        } else if (s === 'CHECKED-IN') {
            return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/appointments/${id}/check-in`, { method: 'PUT', headers: getHeaders() });
        } else if (s === 'IN PROGRESS') {
            return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/appointments/${id}/start-consultation`, { method: 'PUT', headers: getHeaders() });
        } else if (s === 'COMPLETED') {
            return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/appointments/${id}/complete`, { method: 'PUT', headers: getHeaders() });
        } else if (s === 'NO SHOW') {
            return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/appointments/${id}/no-show`, { method: 'PUT', headers: getHeaders() });
        } else if (s === 'CANCELLED') {
            return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/appointments/${id}/cancel`, { method: 'PUT', headers: getHeaders() });
        } else {
            // Force status update (fallback)
            return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/appointments/${id}/status?status=${data.status}`, { method: 'PUT', headers: getHeaders() });
        }
    },"""

if old_update_status in content:
    content = content.replace(old_update_status, new_update_status)
else:
    print("Warning: old_update_status not found")

with open(api_path, 'w', encoding='utf-8') as f:
    f.write(content)
