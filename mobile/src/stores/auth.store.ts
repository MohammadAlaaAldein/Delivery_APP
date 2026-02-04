import { create } from 'zustand';
import { User, UserRole, AuthResponse } from '../types';
import { authService, socketService, pushNotificationService } from '../services';

interface AuthState {
    // State
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isInitialized: boolean;
    error: string | null;

    // Actions
    initialize: () => Promise<void>;
    login: (email: string, password: string) => Promise<AuthResponse>;
    logout: () => Promise<void>;
    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    clearError: () => void;
    updateUser: (userData: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    // Initial state
    user: null,
    isAuthenticated: false,
    isLoading: false,
    isInitialized: false,
    error: null,

    // Initialize auth (restore session)
    initialize: async () => {
        try {
            set({ isLoading: true });
            const user = await authService.initializeAuth();

            if (user) {
                set({
                    user,
                    isAuthenticated: true,
                    isInitialized: true,
                    isLoading: false,
                });

                // Connect socket and register push notifications (non-blocking)
                socketService.connect().catch(err => console.log('Socket connect error:', err));
                pushNotificationService.initialize()
                    .then(() => pushNotificationService.registerDevice())
                    .catch(err => console.log('Push notification error:', err));
            } else {
                set({
                    user: null,
                    isAuthenticated: false,
                    isInitialized: true,
                    isLoading: false,
                });
            }
        } catch (error) {
            console.error('Auth initialization error:', error);
            set({
                user: null,
                isAuthenticated: false,
                isInitialized: true,
                isLoading: false,
            });
        }
    },

    // Login
    login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
            const response = await authService.login({ email, password });

            const user: User = {
                id: 0,
                name: response.name,
                email: response.email,
                role: response.role,
                entity_id: response.entity_id,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            set({
                user,
                isAuthenticated: true,
                isLoading: false,
                error: null,
            });

            // Connect socket and register push notifications (non-blocking)
            socketService.connect().catch(err => console.log('Socket connect error:', err));
            pushNotificationService.initialize()
                .then(() => pushNotificationService.registerDevice())
                .catch(err => console.log('Push notification error:', err));

            return response;
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message || 'Login failed';
            set({
                isLoading: false,
                error: errorMessage,
            });
            throw error;
        }
    },

    // Logout
    logout: async () => {
        set({ isLoading: true });

        try {
            // Unregister push notifications
            await pushNotificationService.unregisterDevice();

            // Disconnect socket
            socketService.disconnect();

            // Logout from API
            await authService.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
            });
        }
    },

    // Set user
    setUser: (user: User | null) => {
        set({
            user,
            isAuthenticated: !!user,
        });
    },

    // Update user
    updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
            set({
                user: { ...currentUser, ...userData },
            });
        }
    },

    // Set loading
    setLoading: (loading: boolean) => {
        set({ isLoading: loading });
    },

    // Set error
    setError: (error: string | null) => {
        set({ error });
    },

    // Clear error
    clearError: () => {
        set({ error: null });
    },
}));

// Selectors
export const selectUser = (state: AuthState) => state.user;
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;
export const selectUserRole = (state: AuthState) => state.user?.role;
export const selectEntityId = (state: AuthState) => state.user?.entity_id;
export const selectIsLoading = (state: AuthState) => state.isLoading;
export const selectError = (state: AuthState) => state.error;
export const selectIsInitialized = (state: AuthState) => state.isInitialized;

export default useAuthStore;
