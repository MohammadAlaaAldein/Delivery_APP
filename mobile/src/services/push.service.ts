import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS, NOTIFICATION_CHANNELS } from '../constants';
import { DeviceTokenDto, NotificationType, PushNotificationPayload } from '../types';
import apiService from './api.service';

// Configure notification handler
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

class PushNotificationService {
    private expoPushToken: string | null = null;
    private notificationListener: Notifications.Subscription | null = null;
    private responseListener: Notifications.Subscription | null = null;
    private onNotificationReceived: ((notification: PushNotificationPayload) => void) | null = null;
    private onNotificationTapped: ((notification: PushNotificationPayload) => void) | null = null;

    // Initialize push notifications
    async initialize(): Promise<string | null> {
        // Check if physical device
        if (!Device.isDevice) {
            console.warn('Push notifications require a physical device');
            return null;
        }

        // Setup notification channels for Android
        if (Platform.OS === 'android') {
            await this.setupAndroidChannels();
        }

        // Request permissions
        const hasPermission = await this.requestPermissions();
        if (!hasPermission) {
            console.warn('Push notification permission denied');
            return null;
        }

        // Get push token
        const token = await this.getExpoPushToken();
        if (token) {
            this.expoPushToken = token;
            await SecureStore.setItemAsync(STORAGE_KEYS.pushToken, token);
        }

        // Setup listeners
        this.setupListeners();

        return token;
    }

    // Setup Android notification channels
    private async setupAndroidChannels(): Promise<void> {
        await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.default.id, {
            name: NOTIFICATION_CHANNELS.default.name,
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: NOTIFICATION_CHANNELS.default.vibrationPattern,
            lightColor: NOTIFICATION_CHANNELS.default.lightColor,
        });

        await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.orders.id, {
            name: NOTIFICATION_CHANNELS.orders.name,
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: NOTIFICATION_CHANNELS.orders.vibrationPattern,
            lightColor: NOTIFICATION_CHANNELS.orders.lightColor,
        });
    }

    // Request notification permissions
    async requestPermissions(): Promise<boolean> {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        return finalStatus === 'granted';
    }

    // Get Expo push token
    private async getExpoPushToken(): Promise<string | null> {
        try {
            const projectId = Constants.expoConfig?.extra?.eas?.projectId;

            const token = await Notifications.getExpoPushTokenAsync({
                projectId,
            });

            return token.data;
        } catch (error) {
            console.error('Error getting push token:', error);
            return null;
        }
    }

    // Setup notification listeners
    private setupListeners(): void {
        // Listener for notifications received while app is foregrounded
        this.notificationListener = Notifications.addNotificationReceivedListener((notification) => {
            const data = notification.request.content.data as Record<string, any>;

            const payload: PushNotificationPayload = {
                title: notification.request.content.title || '',
                body: notification.request.content.body || '',
                type: data.type as NotificationType || NotificationType.GENERAL,
                data,
            };

            if (this.onNotificationReceived) {
                this.onNotificationReceived(payload);
            }
        });

        // Listener for notification taps
        this.responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
            const data = response.notification.request.content.data as Record<string, any>;

            const payload: PushNotificationPayload = {
                title: response.notification.request.content.title || '',
                body: response.notification.request.content.body || '',
                type: data.type as NotificationType || NotificationType.GENERAL,
                data,
            };

            if (this.onNotificationTapped) {
                this.onNotificationTapped(payload);
            }
        });
    }

    // Register device token with backend
    async registerDevice(): Promise<void> {
        if (!this.expoPushToken) {
            console.warn('No push token available');
            return;
        }

        try {
            const deviceData: DeviceTokenDto = {
                token: this.expoPushToken,
                platform: Platform.OS as 'ios' | 'android',
                deviceId: Device.deviceName || undefined,
                deviceName: Device.modelName || undefined,
            };

            await apiService.post('/push-notifications/register', deviceData);
            console.log('Device registered for push notifications');
        } catch (error) {
            console.error('Error registering device:', error);
        }
    }

    // Unregister device token
    async unregisterDevice(): Promise<void> {
        if (!this.expoPushToken) {
            return;
        }

        try {
            await apiService.delete('/push-notifications/unregister', {
                data: { token: this.expoPushToken },
            });
            console.log('Device unregistered from push notifications');
        } catch (error) {
            console.error('Error unregistering device:', error);
        }
    }

    // Subscribe to topic
    async subscribeToTopic(topic: string): Promise<void> {
        try {
            await apiService.post(`/push-notifications/subscribe/${topic}`);
        } catch (error) {
            console.error('Error subscribing to topic:', error);
        }
    }

    // Unsubscribe from topic
    async unsubscribeFromTopic(topic: string): Promise<void> {
        try {
            await apiService.delete(`/push-notifications/unsubscribe/${topic}`);
        } catch (error) {
            console.error('Error unsubscribing from topic:', error);
        }
    }

    // Set notification received callback
    setOnNotificationReceived(callback: (notification: PushNotificationPayload) => void): void {
        this.onNotificationReceived = callback;
    }

    // Add notification received listener (alias)
    addNotificationReceivedListener(callback: (notification: any) => void): () => void {
        this.onNotificationReceived = (payload) => callback(payload);
        return () => {
            this.onNotificationReceived = null;
        };
    }

    // Set notification tapped callback
    setOnNotificationTapped(callback: (notification: PushNotificationPayload) => void): void {
        this.onNotificationTapped = callback;
    }

    // Add notification response listener (alias)
    addNotificationResponseListener(callback: (response: any) => void): () => void {
        this.onNotificationTapped = (payload) => callback(payload);
        return () => {
            this.onNotificationTapped = null;
        };
    }

    // Get current push token
    getPushToken(): string | null {
        return this.expoPushToken;
    }

    // Schedule local notification
    async scheduleLocalNotification(
        title: string,
        body: string,
        data?: Record<string, any>,
        trigger?: Notifications.NotificationTriggerInput
    ): Promise<string> {
        return await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data,
                sound: true,
            },
            trigger: trigger || null,
        });
    }

    // Cancel notification
    async cancelNotification(notificationId: string): Promise<void> {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
    }

    // Cancel all notifications
    async cancelAllNotifications(): Promise<void> {
        await Notifications.cancelAllScheduledNotificationsAsync();
    }

    // Get badge count
    async getBadgeCount(): Promise<number> {
        return await Notifications.getBadgeCountAsync();
    }

    // Set badge count
    async setBadgeCount(count: number): Promise<void> {
        await Notifications.setBadgeCountAsync(count);
    }

    // Dismiss all notifications
    async dismissAllNotifications(): Promise<void> {
        await Notifications.dismissAllNotificationsAsync();
    }

    // Cleanup
    cleanup(): void {
        if (this.notificationListener) {
            Notifications.removeNotificationSubscription(this.notificationListener);
        }
        if (this.responseListener) {
            Notifications.removeNotificationSubscription(this.responseListener);
        }
    }
}

export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;
