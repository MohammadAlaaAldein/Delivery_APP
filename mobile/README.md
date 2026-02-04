# Delivery App - Mobile Application

A professional React Native mobile application for a delivery management system built with Expo SDK 52.

## Features

### User Roles
- **Shop**: Create orders, track deliveries, manage order history
- **Company**: Accept available orders, assign drivers, monitor performance
- **Driver**: Accept deliveries, update order status, track earnings

### Key Features
- 🔐 Secure authentication with OTP verification
- 📦 Real-time order tracking with Socket.IO
- 🔔 Push notifications via Firebase Cloud Messaging
- 🌍 Multi-language support (English & Arabic)
- 🎨 Modern, professional UI with consistent theming
- 📱 Native bottom tab navigation for each role

## Tech Stack

- **Framework**: React Native with Expo SDK 52
- **Navigation**: React Navigation 7 (Native Stack + Bottom Tabs)
- **State Management**: Zustand 5 with persistence
- **HTTP Client**: Axios with interceptors
- **Real-time**: Socket.IO Client
- **Push Notifications**: expo-notifications + Firebase
- **Styling**: React Native StyleSheet with custom theme
- **Internationalization**: i18n-js

## Project Structure

```
mobile/
├── App.tsx                 # Entry point with providers
├── app.json                # Expo configuration
├── eas.json                # EAS Build configuration
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript configuration
├── google-services.json    # Firebase configuration (replace with yours)
├── assets/
│   ├── icon.png
│   ├── adaptive-icon.png
│   ├── splash-icon.png
│   └── notification-icon.png
└── src/
    ├── components/
    │   └── common/         # Reusable UI components
    ├── constants/          # Theme, colors, fonts, spacing
    ├── i18n/               # Translations (en, ar)
    ├── navigation/         # Navigation configurations
    ├── screens/
    │   ├── auth/           # Login, OTP, ForgotPassword
    │   ├── shop/           # Shop role screens
    │   ├── company/        # Company role screens
    │   └── driver/         # Driver role screens
    ├── services/           # API, Auth, Socket, Push services
    ├── stores/             # Zustand state stores
    └── types/              # TypeScript interfaces
```

## Setup Instructions

### Prerequisites
- Node.js 18 or later
- npm or yarn
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)
- Java JDK 17 (for local Android builds)

### Installation

1. Install dependencies:
```bash
cd mobile
npm install
```

2. Configure Firebase:
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create a new project or use existing
   - Add an Android app with package name `com.delivery.app`
   - Download `google-services.json` and replace the placeholder file

3. Update environment configuration:
   - Edit `src/services/api.service.ts` to set your API base URL
   - Update Firebase configuration in `google-services.json`

### Development

Start the Expo development server:
```bash
npx expo start
```

Run on Android emulator:
```bash
npx expo run:android
```

Run on iOS simulator (macOS only):
```bash
npx expo run:ios
```

## Building APK

### Option 1: EAS Build (Recommended - Cloud Build)

1. Create an Expo account at [expo.dev](https://expo.dev)

2. Login to EAS:
```bash
eas login
```

3. Configure your project:
```bash
eas build:configure
```

4. Build preview APK:
```bash
eas build --platform android --profile preview
```

5. Build production APK:
```bash
eas build --platform android --profile production
```

The APK will be available for download from your Expo dashboard.

### Option 2: Local Build (Requires Java JDK 17)

1. Install Java JDK 17 and set JAVA_HOME environment variable

2. Generate native project:
```bash
npx expo prebuild --platform android
```

3. Build debug APK:
```bash
cd android
./gradlew assembleDebug
```
APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

4. Build release APK:
```bash
cd android
./gradlew assembleRelease
```
APK location: `android/app/build/outputs/apk/release/app-release.apk`

## Push Notifications Setup

### Android

1. Add Firebase to your project
2. Download `google-services.json` from Firebase Console
3. Place it in the `mobile/` directory

### iOS

1. Add Firebase to your project
2. Download `GoogleService-Info.plist` from Firebase Console
3. Configure APNs in Firebase Console

## API Configuration

The app expects a backend API with the following endpoints:

### Authentication
- `POST /auth/login` - Login with email/password
- `POST /auth/verify-otp` - Verify OTP code
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/logout` - Logout user

### Orders
- `GET /orders/shop` - Get shop orders
- `POST /orders` - Create new order
- `GET /orders/available` - Get available orders (company)
- `POST /orders/:id/take` - Take order (company)
- `GET /orders/driver` - Get driver orders
- `PUT /orders/:id/pickup` - Mark as picked up
- `PUT /orders/:id/deliver` - Mark as delivered

### Push Notifications
- `POST /push-notifications/register` - Register device token
- `DELETE /push-notifications/unregister` - Unregister device token

## Customization

### Theme
Edit `src/constants/index.ts` to customize:
- Colors (primary, secondary, status colors)
- Typography (fonts, sizes)
- Spacing and radius values
- Shadow styles

### Translations
Edit files in `src/i18n/locales/`:
- `en.ts` - English translations
- `ar.ts` - Arabic translations

## Troubleshooting

### Build Issues
- Clear Expo cache: `npx expo start --clear`
- Clear Metro cache: `npx react-native start --reset-cache`
- Reinstall node_modules: `rm -rf node_modules && npm install`

### Android Issues
- Clean Gradle: `cd android && ./gradlew clean`
- Sync Gradle: `cd android && ./gradlew --refresh-dependencies`

## License

MIT License - See LICENSE file for details
