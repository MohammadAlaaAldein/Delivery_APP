# 🔔 Push Notification Live Testing Guide

## 📋 Overview
This guide shows you how to test the push notification system live in your web application and mobile apps.

---

## 🌐 PART 1: Web App Push Notifications

### 🎯 Where Push Notifications are Integrated

The push notification system is **automatically initialized** when the app starts. Here's the flow:

#### 1. **App Component** (`app.component.ts`)
```typescript
constructor(
    private pushNotificationService: PushNotificationService // Injected - auto-initializes
) { }
```
- ✅ Service is injected and auto-initializes
- ✅ Checks if user is logged in (looks for `localStorage.currentUser`)
- ✅ Automatically requests browser permission after 500ms
- ✅ Registers device with backend after permission granted

#### 2. **Notification Dropdown** (Already Created)
Location: `frontend/src/app/shared/components/notification-dropdown`

**To Add to Your Navigation Bar:**

Add this component to your header/navbar:
```html
<!-- In your navigation header HTML -->
<app-notification-dropdown></app-notification-dropdown>
```

**Features:**
- 🔔 Bell icon with unread count badge
- 📜 Dropdown list of notifications
- ✅ Mark as read functionality
- 🗑️ Clear all notifications
- 🔄 Enable notification button (if permission not granted)

---

### 🧪 Testing Web Push Notifications - Step by Step

#### **Test 1: First Time User Flow**

1. **Start the Frontend**
   ```powershell
   cd c:\Users\malad\Desktop\delivery\frontend
   npm start
   # Or: ng serve
   ```

2. **Start the Backend**
   ```powershell
   cd c:\Users\malad\Desktop\delivery\backend
   npm start
   # Or: npm run start:dev
   ```

3. **Open Browser**
   - Navigate to `http://localhost:4200`
   - Open DevTools Console (F12)

4. **Login to the Application**
   - Use your credentials to login
   - **Watch the console** for these logs:
     ```
     ✅ Auto-requesting notification permission...
     ✅ FCM Token obtained: [long token string]
     ✅ Device registered with backend successfully
     ```

5. **Grant Permission**
   - Browser will show permission popup
   - Click "Allow"
   - If you accidentally clicked "Block", go to Step 6

6. **If Blocked - How to Reset:**
   - Chrome: Click 🔒 (padlock) in address bar → Site Settings → Notifications → Allow
   - Firefox: Click 🔒 → Clear permissions and set state → Click ⚙️ → Permissions → Notifications → Allow
   - Edge: Same as Chrome

---

#### **Test 2: Send a Test Notification**

**Method A: Using the HTML Tester Tool**

1. **Open the HTML Tester**
   - Open `notification-tester.html` in a browser
   - Login with your credentials
   - Click "Get Permission"
   - Click "Send Test Notification"
   - ✅ Check if notification appears

**Method B: Using PowerShell/Terminal**

```powershell
# Get your access token from DevTools:
# 1. Open DevTools (F12)
# 2. Go to Application → Local Storage → http://localhost:4200
# 3. Find 'currentUser' → Copy the 'accessToken' value

$token = "YOUR_ACCESS_TOKEN_HERE"

# Send test notification
Invoke-RestMethod -Uri "http://localhost:3000/push-notifications/test" `
  -Method POST `
  -Headers @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
  }
```

**Method C: Using Postman**

1. Create new POST request
2. URL: `http://localhost:3000/push-notifications/test`
3. Headers:
   - `Authorization`: `Bearer YOUR_ACCESS_TOKEN`
4. Click Send
5. ✅ You should receive a notification

---

#### **Test 3: Foreground vs Background Notifications**

**Foreground (Browser Tab Active):**
- Notification appears as browser notification
- Also added to notification dropdown
- Console logs: "Message received in foreground"

**Background (Browser Tab Inactive/Minimized):**
- Notification appears as system notification
- Handled by service worker
- Click notification → brings you back to the app

**How to Test:**
1. Send test notification while on the app → See it in dropdown
2. Minimize browser window
3. Send another test notification → See system notification
4. Click system notification → Browser focuses and navigates to app

---

#### **Test 4: Check Registration Status**

**View Registered Devices:**
```powershell
$token = "YOUR_ACCESS_TOKEN"

Invoke-RestMethod -Uri "http://localhost:3000/push-notifications/stats" `
  -Method GET `
  -Headers @{
    "Authorization" = "Bearer $token"
  }
```

**Expected Response:**
```json
{
  "totalDevices": 1,
  "byPlatform": {
    "web": 1,
    "ios": 0,
    "android": 0
  },
  "activeDevices": 1
}
```

---

### 🎨 Adding Notification Dropdown to Your UI

#### Option 1: Add to Existing Header/Navbar

Find your navigation component and add:

```typescript
// In your navigation.component.ts
import { NotificationDropdownComponent } from '../shared/components/notification-dropdown/notification-dropdown.component';

@Component({
  // ... other config
  imports: [
    // ... other imports
    NotificationDropdownComponent
  ]
})
```

```html
<!-- In your navigation.component.html -->
<nav class="navbar">
  <div class="navbar-content">
    <!-- Your existing nav items -->
    
    <!-- Add notification dropdown -->
    <app-notification-dropdown></app-notification-dropdown>
    
    <!-- User menu, etc -->
  </div>
</nav>
```

#### Option 2: Create Standalone Notification Page

Create a new route to view all notifications:

```typescript
// app-routing.module.ts
{
  path: 'notifications',
  component: NotificationsPageComponent
}
```

---

## 📱 PART 2: Mobile App with Expo Go

### 🚀 Running Mobile App Locally

#### Step 1: Install Expo Go on Your Phone

**iOS:**
- App Store → Search "Expo Go" → Install

**Android:**
- Google Play Store → Search "Expo Go" → Install

---

#### Step 2: Start the Mobile Development Server

```powershell
# Navigate to mobile directory
cd c:\Users\malad\Desktop\delivery\mobile

# Start Expo development server
npx expo start
```

**Expected Output:**
```
› Metro waiting on exp://192.168.1.xxx:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web

› Press j │ open debugger
› Press r │ reload app
› Press m │ toggle menu
```

---

#### Step 3: Connect Your Phone to Expo Go

**Android:**
1. Open Expo Go app
2. Tap "Scan QR code"
3. Scan the QR code in the terminal
4. ✅ App will build and open

**iOS:**
1. Open Camera app (native iOS camera)
2. Point at the QR code
3. Tap the notification that appears
4. ✅ Opens in Expo Go

**Alternative - Manual Entry:**
1. In terminal, look for: `exp://192.168.1.xxx:8081`
2. In Expo Go, tap "Enter URL manually"
3. Type the URL
4. ✅ App loads

---

#### Step 4: Update API Base URL for Local Testing

**Option A: Use Your Computer's Local IP**

```typescript
// mobile/src/config/api.config.ts
export const API_CONFIG = {
  // Use your computer's local IP (not localhost)
  baseURL: 'http://192.168.1.XXX:3000', // Replace XXX with your IP
  timeout: 10000,
};
```

**To Find Your IP:**
```powershell
# Windows
ipconfig
# Look for "IPv4 Address" under your WiFi adapter
# Example: 192.168.1.100
```

**Option B: Use ngrok for Public URL**

```powershell
# Install ngrok: https://ngrok.com/download

# Start ngrok tunnel to backend
ngrok http 3000

# Use the generated URL:
# https://abc123.ngrok.io
```

```typescript
// mobile/src/config/api.config.ts
export const API_CONFIG = {
  baseURL: 'https://abc123.ngrok.io',
  timeout: 10000,
};
```

---

#### Step 5: Test Mobile Push Notifications

1. **Login to Mobile App**
   - Use your credentials
   - Grant notification permission when prompted

2. **Check Device Registration**
   - Look at terminal console for logs
   - Should see: "Push notification token registered"

3. **Send Test Notification**
   
   Use the backend API:
   ```powershell
   $token = "YOUR_MOBILE_USER_TOKEN"
   
   Invoke-RestMethod -Uri "http://localhost:3000/push-notifications/test" `
     -Method POST `
     -Headers @{
       "Authorization" = "Bearer $token"
       "Content-Type" = "application/json"
     }
   ```

4. **Verify Notification**
   - Should appear as push notification on phone
   - Tap notification → Opens app

---

### 🔧 Troubleshooting Mobile

**Problem: "Network request failed"**
- ✅ Make sure phone and computer are on same WiFi
- ✅ Use computer's IP address, not `localhost`
- ✅ Check if backend is running on port 3000
- ✅ Firewall might be blocking - allow port 3000

**Problem: "Expo Go won't scan QR code"**
- ✅ Try manual URL entry
- ✅ Ensure WiFi is enabled on phone
- ✅ Restart Expo server: Press `r` in terminal

**Problem: "Push notification permission not requested"**
- ✅ Check `app.tsx` or root component
- ✅ Ensure `usePushNotifications` hook is called
- ✅ Check Expo app.json for notification permissions

**Problem: Notifications not received**
- ✅ Check Expo push notification credentials
- ✅ Verify device token was registered with backend
- ✅ Check Firebase console for delivery logs

---

### 📊 Monitoring & Debugging

#### Backend Logs
```powershell
# View logs in backend terminal
# Look for:
✅ [PushNotificationsService] Device registered: [deviceId]
✅ [PushNotificationsService] Notification sent successfully to [userId]
❌ [PushNotificationsService] Failed to send notification: [error]
```

#### Frontend Console
```javascript
// Open DevTools → Console
// Look for:
✅ Auto-requesting notification permission...
✅ FCM Token obtained: [token]
✅ Device registered with backend successfully
✅ Message received in foreground: [payload]
```

#### Mobile Console
```powershell
# In the terminal where Expo is running
# Or use React Native Debugger
# Look for:
✅ Notification permission status: granted
✅ Push token: [token]
✅ Device registered successfully
```

---

## 🎯 Complete Test Checklist

### Web App
- [ ] Backend running (port 3000)
- [ ] Frontend running (port 4200)
- [ ] User can login
- [ ] Permission popup appears automatically
- [ ] Permission granted
- [ ] Device registered (check console)
- [ ] Test notification received
- [ ] Notification appears in dropdown
- [ ] Can mark as read
- [ ] Can clear all
- [ ] Background notifications work
- [ ] Clicking notification navigates to app

### Mobile App
- [ ] Expo Go installed on phone
- [ ] Phone on same WiFi as computer
- [ ] API URL updated with computer IP
- [ ] Backend accessible from phone
- [ ] QR code scanned successfully
- [ ] App builds and opens
- [ ] User can login
- [ ] Permission popup appears
- [ ] Permission granted
- [ ] Device token registered
- [ ] Test notification received
- [ ] Tapping notification opens app

---

## 🚀 Next Steps

1. **Add Notification Dropdown to your UI** (see Option 1 above)
2. **Customize notification types** (order updates, messages, etc.)
3. **Add notification sounds**
4. **Implement notification actions** (Accept/Reject buttons)
5. **Add push notification topics** (for broadcast messages)
6. **Set up production Firebase project**
7. **Configure APNs for iOS** (if not using Expo Go)

---

## 📚 Additional Resources

- **Web Push:** `/NOTIFICATION_TESTING.md`
- **Firebase Setup:** `/FIREBASE_SETUP.md`
- **HTML Tester:** `/notification-tester.html`
- **Backend API:** `http://localhost:3000/push-notifications` endpoints

---

**Need Help?**
- Check browser console for errors
- Check backend logs
- Verify Firebase configuration
- Ensure all services are running
- Check device registration in database: `SELECT * FROM device_tokens;`
