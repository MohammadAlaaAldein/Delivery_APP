# 📱 Mobile App (Expo React Native)

### Tech Details
- Framework: Expo SDK 54, React Navigation 7, Zustand, Socket.IO Client, expo-notifications, expo-location.
- State: `auth.store.ts`, `orders.store.ts`.

### Features by Role
- **Shop**: Dashboard stats, create delivery orders, real-time tracking.
- **Company**: View available orders, take/release orders, assign drivers.
- **Driver**: View assigned orders, accept/reject, update status, GPS tracking.

### Push Notifications (FCM via Expo)
Triggers: `ORDER_CREATED` (to Company), `ORDER_ASSIGNED` (Shop/Driver), `ORDER_PICKED_UP` (Shop), `ORDER_IN_TRANSIT` (Shop), `ORDER_DELIVERED` (Shop/Company), `ORDER_CANCELLED` (All).