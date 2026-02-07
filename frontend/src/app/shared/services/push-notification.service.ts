import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, takeUntil } from 'rxjs';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging, MessagePayload } from 'firebase/messaging';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import { AuthService } from '../../dashboard/users/login/auth.service';
import { USER_ROLE } from '../../dashboard/users/users.service';

export interface PushNotification {
    title: string;
    body: string;
    data?: Record<string, any>;
    timestamp: Date;
    read: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class PushNotificationService implements OnDestroy {
    private firebaseApp: FirebaseApp | null = null;
    private messaging: Messaging | null = null;
    private currentToken: string | null = null;
    private destroy$ = new Subject<void>();

    private notificationsSubject = new BehaviorSubject<PushNotification[]>([]);
    public notifications$ = this.notificationsSubject.asObservable();

    private permissionStatusSubject = new BehaviorSubject<NotificationPermission>('default');
    public permissionStatus$ = this.permissionStatusSubject.asObservable();

    private unreadCountSubject = new BehaviorSubject<number>(0);
    public unreadCount$ = this.unreadCountSubject.asObservable();

    constructor(
        private http: HttpClient,
        private router: Router,
        private authService: AuthService
    ) {
        this.initializeFirebase();
        this.loadStoredNotifications();

        // Auto-initialize notifications if user is logged in
        setTimeout(() => {
            this.autoInitializeNotifications();
        }, 500); // Reduced delay for faster initialization
    }

    /**
     * Initialize Firebase app and messaging
     */
    private initializeFirebase(): void {
        try {
            if (!environment.firebase?.apiKey || environment.firebase.apiKey === 'YOUR_FIREBASE_API_KEY') {
                console.warn('Firebase not configured. Push notifications will be disabled.');
                return;
            }

            this.firebaseApp = initializeApp(environment.firebase);

            // Check if browser supports notifications
            if ('Notification' in window && 'serviceWorker' in navigator) {
                this.messaging = getMessaging(this.firebaseApp);
                this.permissionStatusSubject.next(Notification.permission);

                // Listen for foreground messages
                if (this.messaging) {
                    onMessage(this.messaging, (payload: MessagePayload) => {
                        console.log('Message received in foreground:', payload);
                        this.handleForegroundMessage(payload);
                    });
                }
            } else {
                console.warn('Browser does not support notifications');
            }
        } catch (error) {
            console.error('Failed to initialize Firebase:', error);
        }
    }

    /**
     * Auto-initialize notifications if user is logged in
     */
    private async autoInitializeNotifications(): Promise<void> {
        try {
            // Check if user is logged in
            const currentUserStr = localStorage.getItem('currentUser');
            if (!currentUserStr) {
                console.log('User not logged in, skipping notification initialization');
                return;
            }

            const currentUser = JSON.parse(currentUserStr);
            if (!currentUser.accessToken) {
                console.log('No access token found, skipping notification initialization');
                return;
            }

            // Check if already initialized
            if (this.currentToken) {
                console.log('Notifications already initialized');
                return;
            }

            // Check current permission status
            const permission = Notification.permission;

            if (permission === 'granted') {
                // Already granted, just get token and register
                console.log('Permission already granted, registering token...');
                await this.getTokenAndRegister();
            } else if (permission === 'default') {
                // Auto-request permission immediately
                console.log('Auto-requesting notification permission...');
                await this.requestPermission();
            } else if (permission === 'denied') {
                console.log('Notification permission was previously denied by user');
            }
        } catch (error) {
            console.error('Error auto-initializing notifications:', error);
        }
    }

    /**
     * Get token and register with server (without requesting permission)
     */
    /**
     * Get token and register with server (without requesting permission)
     */
    private async getTokenAndRegister(): Promise<void> {
        try {
            if (!this.messaging) {
                console.warn('Firebase messaging not initialized');
                return;
            }

            // Get service worker registration safely
            // const registration = await this.getServiceWorkerRegistration();
            const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

            // Get FCM token
            const token = await getToken(this.messaging, {
                vapidKey: environment.firebase.vapidKey,
                serviceWorkerRegistration: registration,
            });

            if (token) {
                console.log('FCM Token obtained:', token);
                this.currentToken = token;
                await this.registerTokenWithServer(token);
            } else {
                console.warn('No FCM token received');
            }
        } catch (error) {
            console.error('Error getting FCM token:', error);
        }
    }

    /**
     * Helper to get Service Worker Registration
     */
    // private async getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration> {
    //     try {
    //         // Try to register/get registration
    //         const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    //         return registration;
    //     } catch (e) {
    //         // Fallback to ready if register fails (rare) or just return ready promise
    //         console.log('Service Worker register failed, waiting for ready...');
    //         return await navigator.serviceWorker.ready;
    //     }
    // }

    // /**
    //  * Safely get current push subscription
    //  * Use this instead of messaging.swRegistration.pushManager.getSubscription()
    //  */
    // async getCurrentSubscription(): Promise<PushSubscription | null> {
    //     try {
    //         const registration = await this.getServiceWorkerRegistration();
    //         return await registration.pushManager.getSubscription();
    //     } catch (error) {
    //         console.error('Error getting push subscription:', error);
    //         return null;
    //     }
    // }

    /**
     * Request permission and get FCM token
     */
    async requestPermission(): Promise<string | null> {
        try {
            if (!this.messaging) {
                console.warn('Firebase messaging not initialized');
                return null;
            }

            // Request notification permission
            const permission = await Notification.requestPermission();
            this.permissionStatusSubject.next(permission);

            if (permission !== 'granted') {
                console.log('Notification permission denied');
                return null;
            }

            // Get service worker registration safely
            // const registration = await this.getServiceWorkerRegistration();
            const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

            // Get FCM token
            const token = await getToken(this.messaging, {
                vapidKey: environment.firebase.vapidKey,
                serviceWorkerRegistration: registration,
            });

            if (token) {
                console.log('FCM Token obtained:', token);
                this.currentToken = token;
                await this.registerTokenWithServer(token);
                return token;
            }

            console.warn('No FCM token received');
            return null;
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return null;
        }
    }

    /**
     * Register device token with backend
     */
    private async registerTokenWithServer(token: string): Promise<void> {
        try {
            const deviceInfo = this.getDeviceInfo();

            await this.http.post(`${environment.apiUrl}/push-notifications/register`, {
                token,
                platform: 'web',
                deviceId: this.getOrCreateDeviceId(),
                deviceName: deviceInfo.name,
            }).toPromise();

            console.log('Device registered with backend successfully');
        } catch (error) {
            console.error('Failed to register token with server:', error);
        }
    }

    /**
     * Unregister device token from backend
     */
    async unregisterToken(): Promise<void> {
        try {
            if (this.currentToken) {
                await this.http.delete(`${environment.apiUrl}/push-notifications/unregister`, {
                    body: { token: this.currentToken }
                }).toPromise();

                this.currentToken = null;
                console.log('Token unregistered from server');
            }
        } catch (error) {
            console.error('Failed to unregister token:', error);
        }
    }

    /**
     * Handle foreground messages
     */
    private handleForegroundMessage(payload: MessagePayload): void {
        const notification: PushNotification = {
            title: payload.notification?.title || 'New Notification',
            body: payload.notification?.body || '',
            data: payload.data,
            timestamp: new Date(),
            read: false,
        };

        // Add to notifications list
        const currentNotifications = this.notificationsSubject.value;
        const updatedNotifications = [notification, ...currentNotifications].slice(0, 50); // Keep last 50
        this.notificationsSubject.next(updatedNotifications);
        this.saveNotifications(updatedNotifications);
        this.updateUnreadCount(updatedNotifications);

        // Show browser notification if page is not focused
        if (!document.hasFocus()) {
            this.showBrowserNotification(notification);
        }
    }

    /**
     * Show browser notification
     */
    private showBrowserNotification(notification: PushNotification): void {
        if (Notification.permission === 'granted') {
            const browserNotification = new Notification(notification.title, {
                body: notification.body,
                icon: '/assets/images/notification-icon.png',
                badge: '/assets/images/badge-icon.png',
                tag: notification.data?.['orderId'] || Date.now().toString(),
                requireInteraction: false,
            });

            browserNotification.onclick = () => {
                window.focus();
                browserNotification.close();

                // Navigate based on notification type
                if (notification.data?.['type'] === 'order_update' && notification.data?.['orderId']) {
                    const orderId = notification.data['orderId'];
                    this.handleNotificationClick(orderId);
                }
            };
        }
    }

    /**
     * Handle notification click navigation
     */
    public handleNotificationClick(orderId: string): void {
        const currentUser = this.authService.currentUserValue;

        if (!currentUser || !currentUser.role) {
            return;
        }

        console.log(currentUser.role);
        switch (currentUser.role) {
            case USER_ROLE.SHOP:
                this.router.navigate(['/my-orders/view', orderId]);
                break;
            case USER_ROLE.COMPANY:
                this.router.navigate(['/company-orders/view', orderId]);
                break;
            case USER_ROLE.DRIVER:
                this.router.navigate(['/my-deliveries/view', orderId]);
                break;
            case USER_ROLE.ADMIN:
                this.router.navigate(['/orders/view', orderId]);
                break;
            default:
                this.router.navigate(['/dashboard']);
        }
    }

    /**
     * Mark notification as read
     */
    markAsRead(index: number): void {
        const notifications = [...this.notificationsSubject.value];
        if (notifications[index]) {
            notifications[index].read = true;
            this.notificationsSubject.next(notifications);
            this.saveNotifications(notifications);
            this.updateUnreadCount(notifications);
        }
    }

    /**
     * Mark all notifications as read
     */
    markAllAsRead(): void {
        const notifications = this.notificationsSubject.value.map(n => ({
            ...n,
            read: true,
        }));
        this.notificationsSubject.next(notifications);
        this.saveNotifications(notifications);
        this.updateUnreadCount(notifications);
    }

    /**
     * Clear all notifications
     */
    clearAll(): void {
        this.notificationsSubject.next([]);
        this.saveNotifications([]);
        this.updateUnreadCount([]);
    }

    /**
     * Update unread count
     */
    private updateUnreadCount(notifications: PushNotification[]): void {
        const unreadCount = notifications.filter(n => !n.read).length;
        this.unreadCountSubject.next(unreadCount);
    }

    /**
     * Save notifications to localStorage
     */
    private saveNotifications(notifications: PushNotification[]): void {
        try {
            localStorage.setItem('push_notifications', JSON.stringify(notifications));
        } catch (error) {
            console.error('Failed to save notifications:', error);
        }
    }

    /**
     * Load stored notifications from localStorage
     */
    private loadStoredNotifications(): void {
        try {
            const stored = localStorage.getItem('push_notifications');
            if (stored) {
                const notifications = JSON.parse(stored);
                this.notificationsSubject.next(notifications);
                this.updateUnreadCount(notifications);
            }
        } catch (error) {
            console.error('Failed to load notifications:', error);
        }
    }

    /**
     * Get or create unique device ID
     */
    private getOrCreateDeviceId(): string {
        let deviceId = localStorage.getItem('device_id');
        if (!deviceId) {
            deviceId = 'web_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
            localStorage.setItem('device_id', deviceId);
        }
        return deviceId;
    }

    /**
     * Get device info for registration
     */
    private getDeviceInfo(): { name: string; userAgent: string } {
        const userAgent = navigator.userAgent;
        let name = 'Web Browser';

        if (userAgent.includes('Chrome')) {
            name = 'Chrome Browser';
        } else if (userAgent.includes('Firefox')) {
            name = 'Firefox Browser';
        } else if (userAgent.includes('Safari')) {
            name = 'Safari Browser';
        } else if (userAgent.includes('Edge')) {
            name = 'Edge Browser';
        }

        return { name, userAgent };
    }

    /**
     * Check if notifications are supported and enabled
     */
    isSupported(): boolean {
        return 'Notification' in window && 'serviceWorker' in navigator;
    }

    /**
     * Get current permission status
     */
    getPermissionStatus(): NotificationPermission {
        return Notification.permission;
    }

    /**
     * Cleanup on destroy
     */
    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
