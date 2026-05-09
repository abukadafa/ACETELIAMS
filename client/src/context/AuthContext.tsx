import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import api from '../api/axiosInstance';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'student' | 'facilitator' | 'staff' | 'admin';
    department?: string;
    studentId?: string;
    programmes?: string[];
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (identifier: string, password: string, role?: string) => Promise<any>;
    register: (userData: any) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
    finalizeMfaLogin: (code: string, tempToken: string) => Promise<any>;
    setupMfa: () => Promise<any>;
    verifyMfaSetup: (code: string) => Promise<any>;
    changeRequiredPassword: (tempToken: string, newPassword: string) => Promise<any>;
    isProcessing: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Helper: extract user from any backend response shape.
 * /auth/login  → successResponse → { success, data: { token, user }, message }
 * /auth/me     → raw mongoose doc → { _id, name, email, role, ... }
 */
function extractUser(data: any): User | null {
    if (!data) return null;
    // successResponse wrapper: { data: { user: {...} } }
    if (data.data?.user) return { ...data.data.user, id: data.data.user.id || data.data.user._id };
    // flat user object returned by /auth/me (raw mongoose doc has _id not id)
    if (data.role) return { id: data._id || data.id, name: data.name, email: data.email, role: data.role, department: data.department, studentId: data.studentId, programmes: data.programmes };
    // direct user property
    if (data.user?.role) return { ...data.user, id: data.user.id || data.user._id };
    return null;
}

function extractToken(data: any): string | null {
    if (!data) return null;
    // successResponse wrapper: { data: { token: '...' } }
    if (data.data?.token) return data.data.token;
    if (data.data?.temp_token) return data.data.temp_token;
    // flat
    if (data.token) return data.token;
    if (data.temp_token) return data.temp_token;
    return null;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    // On mount: validate stored token via /auth/me
    useEffect(() => {
        const checkAuth = async () => {
            const storedToken = localStorage.getItem('token');
            if (!storedToken) {
                setIsLoading(false);
                return;
            }
            try {
                // /auth/me returns raw user document (not wrapped in successResponse)
                const data: any = await api.get('/auth/me');
                const activeUser = extractUser(data);
                if (activeUser) {
                    setUser(activeUser);
                    setToken(storedToken);
                } else {
                    // Token exists but /auth/me returned nothing useful — clear it
                    localStorage.removeItem('token');
                    setToken(null);
                }
            } catch (error: any) {
                // 401 = expired/invalid token
                if (axios.isAxiosError(error) && error.response?.status === 401) {
                    localStorage.removeItem('token');
                    setToken(null);
                    setUser(null);
                } else {
                    // Network error etc — keep token, try again later
                    console.warn('Auth check failed (non-401):', error?.message);
                }
            } finally {
                setIsLoading(false);
            }
        };
        checkAuth();
    }, []);

    const login = async (identifier: string, password: string, role?: string) => {
        setIsProcessing(true);
        try {
            // /auth/login returns successResponse: { success, data: { token, user }, message }
            const response: any = await api.post('/auth/login', { identifier, password, role });

            const activeToken = extractToken(response);
            const activeUser = extractUser(response);

            if (activeToken) {
                localStorage.setItem('token', activeToken);
                setToken(activeToken);
            }
            if (activeUser) {
                setUser(activeUser);
            }

            return response;
        } finally {
            setIsProcessing(false);
        }
    };

    const finalizeMfaLogin = async (code: string, tempToken: string) => {
        setIsProcessing(true);
        try {
            const response: any = await api.post('/auth/mfa/finalize-login', { code, tempToken });
            const activeToken = extractToken(response);
            const activeUser = extractUser(response);

            if (activeToken) {
                localStorage.setItem('token', activeToken);
                setToken(activeToken);
            }
            if (activeUser) {
                setUser(activeUser);
            }
            return response;
        } finally {
            setIsProcessing(false);
        }
    };

    const setupMfa = async () => {
        const response: any = await api.post('/auth/mfa/setup');
        return response;
    };

    const verifyMfaSetup = async (code: string) => {
        const response: any = await api.post('/auth/mfa/verify-setup', { code });
        return response;
    };

    const changeRequiredPassword = async (tempToken: string, newPassword: string) => {
        setIsProcessing(true);
        try {
            const response: any = await api.post('/auth/change-required-password', { tempToken, newPassword });
            return response;
        } finally {
            setIsProcessing(false);
        }
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (e) {
            // Ignore logout errors
        }
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
    };

    const register = async (userData: any) => {
        await api.post('/auth/register', userData);
    };

    return (
        <AuthContext.Provider value={{
            user, token, login, register, logout, isLoading,
            finalizeMfaLogin, setupMfa, verifyMfaSetup, changeRequiredPassword, isProcessing
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
