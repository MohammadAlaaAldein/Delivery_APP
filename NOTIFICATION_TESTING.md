# 🔔 How to Test Push Notifications on Web

## ✅ Prerequisites Check
- ✅ VAPID key configured in `environment.ts`
- ✅ Firebase service account in backend `.env`
- ✅ Backend server running on `http://localhost:1000`
- ✅ Frontend running on `http://localhost:4200`

---

## 📋 Step-by-Step Testing

### **Step 1: Start Your Servers**

**Terminal 1 - Backend:**
```bash
cd backend
npm run start:dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run start
```

Wait for both to be ready.

---

### **Step 2: Login to Web App**

1. Open browser: `http://localhost:4200`
2. Login with your credentials
3. Open **Browser DevTools** (F12)
4. Go to **Console** tab

---

### **Step 3: Request Notification Permission**

The app should automatically request permission when you login, but if not:

1. Look for the **notification bell icon** in the top right
2. Click it to open the notification dropdown
3. Look for a button like **"Enable Notifications"** or similar
4. Click it to request permission

**OR manually trigger in Console:**
```javascript
// Get the notification service and request permission
const notificationService = document.querySelector('app-root').__ngContext__[8].pushService;
await notificationService.requestPermission();
```

You should see a browser popup asking for notification permission. **Click "Allow"**.

---

### **Step 4: Check Token Registration**

In the **Console tab**, you should see:
```
FCM Token obtained: eXaMpLe...
Device registered with backend
```

If you see this, your device is registered! ✅

---

### **Step 5: Send Test Notification (Method 1 - API Endpoint)**

#### **Using Postman/Insomnia/Thunder Client:**

1. **Get your JWT token** (from login response or localStorage)
   - In DevTools Console: `localStorage.getItem('token')`
   - Copy the token

2. **Send POST request:**
   ```
   POST http://localhost:1000/push-notifications/test
   ```

3. **Headers:**
   ```
   Authorization: Bearer YOUR_JWT_TOKEN_HERE
   Content-Type: application/json
   ```

4. **Click Send**

You should receive a notification immediately! 🎉

---

### **Step 6: Send Test Notification (Method 2 - Using cURL)**

**In PowerShell:**
```powershell
$token = "YOUR_JWT_TOKEN_HERE"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Invoke-RestMethod -Uri "http://localhost:1000/push-notifications/test" -Method Post -Headers $headers
```

---

### **Step 7: Check Statistics**

See how many devices are registered:

```
GET http://localhost:1000/push-notifications/stats
Authorization: Bearer YOUR_JWT_TOKEN
```

Response:
```json
{
  "success": true,
  "data": {
    "total": 1,
    "active": 1,
    "inactive": 0,
    "byPlatform": {
      "web": 1
    }
  }
}
```

---

## 🧪 Advanced Testing

### **Test 1: Foreground Notifications (App Open)**

1. Keep the web app open and visible
2. Send test notification using the API
3. You should see:
   - ✅ Browser notification popup
   - ✅ Notification in the app's notification dropdown
   - ✅ Console log: "Message received in foreground"

---

### **Test 2: Background Notifications (App in Background)**

1. **Open the web app and login** (to register device)
2. **Switch to another tab** or minimize browser
3. Send test notification using the API
4. You should see:
   - ✅ System notification (Windows notification center)
   - ✅ Notification sound
   - ✅ Clicking it opens the app

---

### **Test 3: Custom Notification**

Send a custom notification with specific data:

**API Endpoint:** (You'd need to add this or use the service directly)
```typescript
POST http://localhost:1000/push-notifications/send
Authorization: Bearer YOUR_JWT_TOKEN

Body:
{
  "userId": "YOUR_USER_ID",
  "title": "Order #12345 Delivered",
  "body": "Your order has been delivered successfully!",
  "type": "ORDER_DELIVERED",
  "data": {
    "orderId": "12345",
    "customField": "customValue"
  }
}
```

---

## 🔍 Troubleshooting

### **Issue 1: No Permission Popup**

**Check:**
```javascript
// In DevTools Console
Notification.permission
```

If it returns `"granted"` → Already granted ✅  
If it returns `"denied"` → You denied it. Need to reset:
1. Click 🔒 padlock in address bar
2. Find "Notifications"
3. Change to "Allow"
4. Refresh page

If it returns `"default"` → Not requested yet, call `requestPermission()`

---

### **Issue 2: Service Worker Not Registered**

**Check:**
```javascript
// In DevTools Console
navigator.serviceWorker.getRegistrations()
```

Should show `firebase-messaging-sw.js`

**If not registered:**
1. Check file exists: `http://localhost:4200/firebase-messaging-sw.js`
2. Check Console for errors
3. Make sure `angular.json` has the service worker in assets

---

### **Issue 3: Token Not Registered with Backend**

**Check in Network tab:**
- Should see POST to `/push-notifications/register`
- Should return success

**Manually register:**
```javascript
// Get FCM token first
const messaging = firebase.messaging();
const token = await messaging.getToken();

// Register with backend
fetch('http://localhost:1000/push-notifications/register', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    token: token,
    platform: 'web',
    deviceId: 'browser-' + Date.now(),
    deviceName: navigator.userAgent
  })
})
```

---

### **Issue 4: Firebase Not Initialized**

**Check Console for:**
- ❌ "Firebase not configured"
- ❌ "Firebase service account not configured"

**Solution:**
1. Check `.env` has `FIREBASE_SERVICE_ACCOUNT`
2. Check `environment.ts` has correct Firebase config
3. Restart backend server

---

## 📊 Verification Checklist

- [ ] Browser shows notification permission popup
- [ ] Permission set to "Allow"
- [ ] FCM token generated in console
- [ ] Device registered with backend (check Network tab)
- [ ] Test notification received when app is open
- [ ] Test notification received when app is in background
- [ ] Notification appears in system tray
- [ ] Notification sound plays
- [ ] Clicking notification opens/focuses the app
- [ ] Notification appears in app's notification dropdown

---

## 🎯 Quick Test Commands

**Open DevTools Console and run:**

```javascript

// 2. Request permission if needed
if (Notification.permission === 'default') {
  await Notification.requestPermission();
}

// 3. Check if service worker is registered
const registrations = await navigator.serviceWorker.getRegistrations();

// 4. Test browser notification API directly
new Notification('Test', {
  body: 'If you see this, browser notifications work!',
  icon: '/assets/images/logo.png'
});
```

---

## 🚀 Production Testing

Before deploying:

1. ✅ Test on Chrome
2. ✅ Test on Firefox
3. ✅ Test on Edge
4. ✅ Test on mobile browsers (if PWA)
5. ✅ Test notification click navigation
6. ✅ Test with app closed (service worker keeps running)
7. ✅ Check Firebase Console for delivery reports

---

## 📱 Firebase Console Monitoring

Go to: https://console.firebase.google.com/project/delivery-app-mohammad/notification

Here you can:
- See notification delivery stats
- Send test notifications manually
- View FCM tokens
- Check error logs

---

**That's it! You're now ready to test push notifications! 🎉**

If something doesn't work, check the console errors and follow the troubleshooting steps above.
