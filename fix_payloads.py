import os

api_path = r'c:\Users\adrad\OneDrive\Desktop\dfo-frontend\services\api.ts'

with open(api_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace createPatient
old_create_patient = """    createPatient: async (data: any) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/patients`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
    },"""

new_create_patient = """    createPatient: async (data: any) => {
        // Translate frontend payload to backend schema
        const names = (data.name || '').trim().split(' ');
        const firstName = names[0] || 'Unknown';
        const lastName = names.length > 1 ? names.slice(1).join(' ') : 'Unknown';
        
        let genderEnum = 'OTHER';
        if (data.gender?.toLowerCase() === 'male') genderEnum = 'MALE';
        if (data.gender?.toLowerCase() === 'female') genderEnum = 'FEMALE';

        const backendPayload = {
            firstName,
            lastName,
            gender: genderEnum,
            age: parseInt(data.age) || 30,
            dateOfBirth: data.dob || '1990-01-01',
            phone: data.phone || data.mobile || '0000000000',
            email: data.email || null,
            address: [data.house, data.street, data.city, data.state].filter(Boolean).join(', ') || null,
            bloodGroup: data.bloodGroup || null,
            status: 'ACTIVE'
        };

        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/patients`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(backendPayload)
        });
    },"""

content = content.replace(old_create_patient, new_create_patient)

# Same for createLead
old_create_lead = """    createLead: async (data: any) => {
        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/patients`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
    },"""

new_create_lead = """    createLead: async (data: any) => {
        const names = (data.name || '').trim().split(' ');
        const firstName = names[0] || 'Unknown';
        const lastName = names.length > 1 ? names.slice(1).join(' ') : 'Unknown';
        
        let genderEnum = 'OTHER';
        if (data.gender?.toLowerCase() === 'male') genderEnum = 'MALE';
        if (data.gender?.toLowerCase() === 'female') genderEnum = 'FEMALE';

        const backendPayload = {
            firstName,
            lastName,
            gender: genderEnum,
            age: parseInt(data.age) || 30,
            dateOfBirth: '1990-01-01', // Leads might not have DOB
            phone: data.phone || data.mobile || '0000000000',
            email: data.email || null,
            status: 'ACTIVE'
        };

        return fetchJson<any>(`${API_BASE_URL}/api/v1/clinics/patients`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(backendPayload)
        });
    },"""

content = content.replace(old_create_lead, new_create_lead)

with open(api_path, 'w', encoding='utf-8') as f:
    f.write(content)
