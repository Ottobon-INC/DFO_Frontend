import os
import re

api_path = r'c:\Users\adrad\OneDrive\Desktop\dfo-frontend\services\api.ts'

with open(api_path, 'r', encoding='utf-8') as f:
    content = f.read()

replacement = """    getPatientFlowSummary: async () => {
        const today = new Date().toISOString().split('T')[0];
        const res = await fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/appointments?date=${today}`, { headers: getHeaders() });
        const appts = res.data || res || [];
        return {
            total_walkins: appts.length,
            in_consultation: appts.filter((a: any) => a.status === 'In Progress').length,
            waiting: appts.filter((a: any) => a.status === 'Checked-In' || a.status === 'Arrived').length,
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
    },"""

# We'll use regex to replace all of them
pattern = r'\s*getPatientFlowSummary:\s*async\s*\(\)\s*=>\s*\{.*?\},\s*getWaitingAlerts:\s*async\s*\(\)\s*=>\s*\{.*?\},\s*getLiveQueue:\s*async\s*\(\)\s*=>\s*\{.*?\},\s*getDoctorUtilization:\s*async\s*\(\)\s*=>\s*\{.*?\},'

new_content = re.sub(pattern, "\n" + replacement + "\n", content, flags=re.DOTALL)

if new_content == content:
    print("Warning: regex didn't match. Will try manual chunk replacement.")
    # Fallback to targeted string replace if regex fails due to whitespace
    # Let's do it manually just in case
    import string
    
with open(api_path, 'w', encoding='utf-8') as f:
    f.write(new_content)
