import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS, API_CONFIG } from '../constants';
import { User, UserRole, AuthResponse } from '../types';
import { apiService } from './api.service';

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface OTPVerifyData {
    email: string;
    otp: string;
}

export interface ForgotPasswordData {
    email: string;
}

class AuthService {
    // Login
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        try {
            const response = await apiService.post<AuthResponse>('/auth/login', credentials);
            
            if (response) {
                // Store tokens
                await this.storeTokens(response.accessToken, response.refreshToken);
                
                // Store user data
                const userData: User = {
                    id: response.id || 0,
                    name: response.name,
                    email: response.email,
                    role: response.role,
                    entity_id: response.entity_id,
                    is_active: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };
                await this.storeUser(userData);
            }
            
            return response;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    // Logout
    async logout(): Promise<void> {
        try {
            // Call logout endpoint
            await apiService.post('/auth/logout').catch(() => {});
        } finally {
            // Clear local storage
            await this.clearStorage();
        }
    }

    // Verify OTP
    async verifyOTP(data: OTPVerifyData): Promise<AuthResponse> {
        const response = await apiService.post<AuthResponse>('/auth/verify-otp', data);
        
        if (response) {
            await this.storeTokens(response.accessToken, response.refreshToken);
            
            const userData: User = {
                id: response.id || 0,
                name: response.name,
                email: response.email,
                role: response.role,
                entity_id: response.entity_id,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            await this.storeUser(userData);
        }
        
        return response;
    }

    // Forgot password
    async forgotPassword(data: ForgotPasswordData): Promise<void> {
        await apiService.post('/auth/forgot-password', data);
    }

    // Reset password
    async resetPassword(token: string, password: string): Promise<void> {
        await apiService.post('/auth/reset-password', { token, password });
    }

    // Refresh token
    async refreshToken(): Promise<string | null> {
        try {
            const refreshToken = await this.getRefreshToken();
            if (!refreshToken) {
                return null;
            }

            const response = await apiService.post<{ access_token: string }>('/auth/refresh', null, {
                headers: {
                    Authorization: `Bearer ${refreshToken}`,
                },
            });

            if (response?.access_token) {
                await SecureStore.setItemAsync(STORAGE_KEYS.accessToken, response.access_token);
                return response.access_token;
            }

            return null;
        } catch (error) {
            console.error('Refresh token error:', error);
            return null;
        }
    }

    // Store tokens
    async storeTokens(accessToken: string, refreshToken?: string): Promise<void> {
        await SecureStore.setItemAsync(STORAGE_KEYS.accessToken, accessToken);
        if (refreshToken) {
            await SecureStore.setItemAsync(STORAGE_KEYS.refreshToken, refreshToken);
        }
    }

    // Store user
    async storeUser(user: User): Promise<void> {
        await SecureStore.setItemAsync(STORAGE_KEYS.user, JSON.stringify(user));
    }

    // Get stored user
    async getStoredUser(): Promise<User | null> {
        try {
            const userData = await SecureStore.getItemAsync(STORAGE_KEYS.user);
            if (userData) {
                return JSON.parse(userData) as User;
            }
        } catch (error) {
            console.error('Error getting stored user:', error);
        }
        return null;
    }

    // Get stored access token
    async getAccessToken(): Promise<string | null> {
        return await SecureStore.getItemAsync(STORAGE_KEYS.accessToken);
    }

    // Get stored refresh token
    async getRefreshToken(): Promise<string | null> {
        return await SecureStore.getItemAsync(STORAGE_KEYS.refreshToken);
    }

    // Check if user is authenticated
    async isAuthenticated(): Promise<boolean> {
        const token = await this.getAccessToken();
        return !!token;
    }

    // Check user role
    async getUserRole(): Promise<UserRole | null> {
        const user = await this.getStoredUser();
        return user?.role || null;
    }

    // Initialize auth (restore session)
    async initializeAuth(): Promise<User | null> {
        try {
            const token = await this.getAccessToken();
            if (token) {
                apiService.setAuthToken(token);
                return await this.getStoredUser();
            }
            return null;
        } catch (error) {
            console.error('Error initializing auth:', error);
            return null;
        }
    }

    // Clear all stored auth data
    async clearStorage(): Promise<void> {
        await SecureStore.deleteItemAsync(STORAGE_KEYS.accessToken);
        await SecureStore.deleteItemAsync(STORAGE_KEYS.refreshToken);
        await SecureStore.deleteItemAsync(STORAGE_KEYS.user);
        await SecureStore.deleteItemAsync(STORAGE_KEYS.pushToken);
    }
}

export const authService = new AuthService();
export default authService;
