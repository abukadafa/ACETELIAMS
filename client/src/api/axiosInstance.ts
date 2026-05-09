import axios from 'axios';

/**
 * ACETEL IAMS Centralized Axios Instance
 * Handles JWT injection, CSRF protection, and session recovery
 */

const getApiUrl = (): string => {
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
    return '/api';
};

const API_URL = getApiUrl();

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Helper to get CSRF token from cookie
const getCsrfToken = () => {
    const match = document.cookie.match(/(?:^|;\s*)_csrf=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : null;
};

// Request Interceptor: Attach JWT and CSRF
api.interceptors.request.use(
    async (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }

        // CSRF Protection for state-changing requests
        if (['post', 'put', 'delete', 'patch'].includes(config.method?.toLowerCase() || '')) {
            let csrfToken = getCsrfToken();
            if (!csrfToken) {
                try {
                    // Pre-flight to get CSRF token if missing (non-blocking on failure)
                    await axios.get('/api/health', { withCredentials: true });
                    csrfToken = getCsrfToken();
                } catch (e) {
                    // CSRF token init failed — proceed anyway (server will reject if required)
                    console.warn('CSRF token initialization failed, proceeding without it');
                }
            }
            if (csrfToken) {
                config.headers['x-csrf-token'] = csrfToken;
            }
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Global Error Handling & Refresh Logic
api.interceptors.response.use(
    (response) => {
        // Handle consistent backend response structure
        return response.data;
    },
    async (error) => {
        const originalRequest = error.config;

        // Session Expired (401)
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
                // Attempt Token Refresh using the same API_URL base
                const response = await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
                // The backend returns { success: true, token: '...' } or { token: '...' }
                const token = response.data.token || (response.data.data && response.data.data.token);
                
                if (!token) throw new Error('Refresh token missing');
                
                localStorage.setItem('token', token);
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return api(originalRequest);
            } catch (refreshError) {
                // Session truly expired, clear and redirect to landing page
                localStorage.removeItem('token');
                if (window.location.pathname !== '/') {
                    window.location.href = '/?session=expired';
                }
            }
        }

        // Preserve HTTP status for callers (unwrap body but keep status / message)
        const body = error.response?.data;
        const payload =
            body && typeof body === 'object' && !Array.isArray(body)
                ? { ...body }
                : {};
        return Promise.reject({
            ...payload,
            message: (body as { message?: string })?.message || error.message || 'Request failed',
            status: error.response?.status,
        });
    }
);

export default api;
