import axios from 'axios';

// Support both Vite environment variables and standard fallback
const API_BASE_URL = 
  (import.meta.env && import.meta.env.VITE_API_URL) || 
  (process.env && process.env.NEXT_PUBLIC_API_URL) || 
  'http://localhost:3005';

export const clinicalClient = axios.create({
    baseURL: API_BASE_URL,
});

// Request Interceptor (retrieves role & ID from state / cookies / localStorage)
clinicalClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('user_id') || 'd4c8-4e5a-8b9a-1c2d3e4f5g6h'; // Default mock doctor
    const userRole = localStorage.getItem('user_role') || 'DOCTOR'; // Default mock role
    
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    config.headers['x-user-id'] = userId;
    config.headers['x-user-role'] = userRole;
    return config;
});
