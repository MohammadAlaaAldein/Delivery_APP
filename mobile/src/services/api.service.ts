import axios, { AxiosInstance, AxiosRequestConfig, AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from './secure-store';
import { API_CONFIG, STORAGE_KEYS } from '../constants';
import { ApiResponse } from '../types';

// Create axios instance
const api: AxiosInstance = axios.create({
    baseURL: API_CONFIG.baseURL,
    timeout: API_CONFIG.timeout,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});

// Token refresh state
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Request interceptor
api.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        try {
            const token = await SecureStore.getItemAsync(STORAGE_KEYS.accessToken);
            if (token && config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Error getting token:', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Handle 401 errors (token expired)
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        if (originalRequest.headers) {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                        }
                        return api(originalRequest);
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.refreshToken);
                if (!refreshToken) {
                    throw new Error('No refresh token');
                }

                const response = await axios.post(`${API_CONFIG.baseURL}/auth/refresh`, null, {
                    headers: {
                        Authorization: `Bearer ${refreshToken}`,
                    },
                });

                const { accessToken } = response.data;
                await SecureStore.setItemAsync(STORAGE_KEYS.accessToken, accessToken);

                processQueue(null, accessToken);

                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                }

                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);

                // Clear tokens and redirect to login
                await SecureStore.deleteItemAsync(STORAGE_KEYS.accessToken);
                await SecureStore.deleteItemAsync(STORAGE_KEYS.refreshToken);
                await SecureStore.deleteItemAsync(STORAGE_KEYS.user);

                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

// API helper functions
export const apiService = {
    // GET request
    get: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
        const response = await api.get<T>(url, config);
        return response.data;
    },

    // POST request
    post: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
        const response = await api.post<T>(url, data, config);
        return response.data;
    },

    // PUT request
    put: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
        const response = await api.put<T>(url, data, config);
        return response.data;
    },

    // PATCH request
    patch: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
        const response = await api.patch<T>(url, data, config);
        return response.data;
    },

    // DELETE request
    delete: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
        const response = await api.delete<T>(url, config);
        return response.data;
    },

    // Upload file
    upload: async <T = any>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<T> => {
        const response = await api.post<T>(url, formData, {
            ...config,
            headers: {
                'Content-Type': 'multipart/form-data',
                ...config?.headers,
            },
        });
        return response.data;
    },

    // Set authorization header manually
    setAuthToken: (token: string) => {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
    },

    // Remove authorization header
    removeAuthToken: () => {
        delete api.defaults.headers.common.Authorization;
    },

    // Get base URL
    getBaseURL: () => API_CONFIG.baseURL,
};

// Error handling helper
export const handleApiError = (error: any): string => {
    if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiResponse>;

        if (axiosError.response?.data?.message) {
            return axiosError.response.data.message;
        }

        if (axiosError.response?.data?.error) {
            return axiosError.response.data.error;
        }

        switch (axiosError.response?.status) {
            case 400:
                return 'Bad request. Please check your input.';
            case 401:
                return 'Session expired. Please login again.';
            case 403:
                return 'You do not have permission to perform this action.';
            case 404:
                return 'Resource not found.';
            case 500:
                return 'Server error. Please try again later.';
            default:
                return 'An error occurred. Please try again.';
        }
    }

    if (error.message === 'Network Error') {
        return 'Network error. Please check your connection.';
    }

    return error.message || 'An unknown error occurred.';
};

export { api };
export default apiService;
