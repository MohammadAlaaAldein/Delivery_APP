// Firebase messaging service worker
// This file must be in the root of your public folder (src/)
// and will be copied to the dist folder during build

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
// NOTE: Replace these values with your actual Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyCZaNQasg3EdlfI9_kSn16-Tuf3AcDbzA4",
    authDomain: "delivery-app-mohammad.firebaseapp.com",
    projectId: "delivery-app-mohammad",
    storageBucket: "delivery-app-mohammad.firebasestorage.app",
    messagingSenderId: "668570133534",
    appId: "1:668570133534:web:5d992f2e903d38cce23a0f",
    measurementId: "G-4NNVTMWTBW"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);

    const notificationTitle = payload.notification?.title || 'New Notification';
    const notificationOptions = {
        body: payload.notification?.body || '',
        icon: '/assets/images/notification-icon.png',
        badge: '/assets/images/badge-icon.png',
        tag: payload.data?.orderId || Date.now().toString(),
        data: payload.data,
        requireInteraction: false,
        actions: [
            {
                action: 'view',
                title: 'View',
            },
            {
                action: 'dismiss',
                title: 'Dismiss',
            },
        ],
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    console.log('[firebase-messaging-sw.js] Notification click received:', event);

    event.notification.close();

    const action = event.action;
    const data = event.notification.data;

    if (action === 'dismiss') {
        return;
    }

    // Navigate to the appropriate page
    let url = '/';
    if (data?.type === 'order_update' && data?.orderId) {
        url = `/orders/${data.orderId}`;
    }

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Check if there's already a window open
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.focus();
                    client.navigate(url);
                    return;
                }
            }
            // If no window is open, open a new one
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});

// Handle push events (for silent pushes)
self.addEventListener('push', (event) => {
    console.log('[firebase-messaging-sw.js] Push event received');

    if (!event.data) {
        return;
    }

    try {
        const data = event.data.json();

        // If the push doesn't have a notification property, Firebase SDK will handle it
        // This is for custom handling of data-only messages
        if (!data.notification && data.data) {
            const notificationTitle = data.data.title || 'New Notification';
            const notificationOptions = {
                body: data.data.body || '',
                icon: '/assets/images/notification-icon.png',
                badge: '/assets/images/badge-icon.png',
                tag: data.data.orderId || Date.now().toString(),
                data: data.data,
            };

            event.waitUntil(
                self.registration.showNotification(notificationTitle, notificationOptions)
            );
        }
    } catch (error) {
        console.error('[firebase-messaging-sw.js] Error handling push:', error);
    }
});

// Log when service worker is installed
self.addEventListener('install', (event) => {
    console.log('[firebase-messaging-sw.js] Service worker installed');
    self.skipWaiting();
});

// Log when service worker is activated
self.addEventListener('activate', (event) => {
    console.log('[firebase-messaging-sw.js] Service worker activated');
    event.waitUntil(clients.claim());
});
