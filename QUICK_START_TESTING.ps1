# 🚀 Quick Start - Testing Push Notifications

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Push Notification Testing Guide" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Prerequisites Checklist:" -ForegroundColor Yellow
Write-Host "  ✅ Backend server running on port 3000" -ForegroundColor White
Write-Host "  ✅ Frontend server running on port 4200" -ForegroundColor White
Write-Host "  ✅ PostgreSQL database running" -ForegroundColor White
Write-Host "  ✅ Firebase configured in .env and environment.ts" -ForegroundColor White
Write-Host ""

Write-Host "🌐 WEB APP - Testing Flow:" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "Step 1: Start Backend" -ForegroundColor Cyan
Write-Host "  cd c:\Users\malad\Desktop\delivery\backend" -ForegroundColor White
Write-Host "  npm run start:dev" -ForegroundColor White
Write-Host ""
Write-Host "Step 2: Start Frontend" -ForegroundColor Cyan
Write-Host "  cd c:\Users\malad\Desktop\delivery\frontend" -ForegroundColor White
Write-Host "  npm start" -ForegroundColor White
Write-Host ""
Write-Host "Step 3: Open Browser" -ForegroundColor Cyan
Write-Host "  Navigate to: http://localhost:4200" -ForegroundColor White
Write-Host "  Open DevTools Console (F12)" -ForegroundColor White
Write-Host ""
Write-Host "Step 4: Login" -ForegroundColor Cyan
Write-Host "  Login with your credentials" -ForegroundColor White
Write-Host "  Watch for automatic permission request popup" -ForegroundColor White
Write-Host "  Click 'Allow' when prompted" -ForegroundColor White
Write-Host ""
Write-Host "Step 5: Check Console Logs" -ForegroundColor Cyan
Write-Host "  Look for these success messages:" -ForegroundColor White
Write-Host "    ✅ 'Auto-requesting notification permission...'" -ForegroundColor Green
Write-Host "    ✅ 'FCM Token obtained: [token]'" -ForegroundColor Green
Write-Host "    ✅ 'Device registered with backend successfully'" -ForegroundColor Green
Write-Host ""
Write-Host "Step 6: Check Notification Bell Icon" -ForegroundColor Cyan
Write-Host "  Look at top-right corner of navigation bar" -ForegroundColor White
Write-Host "  You should see a 🔔 bell icon" -ForegroundColor White
Write-Host "  Click it to see notification dropdown" -ForegroundColor White
Write-Host ""
Write-Host "Step 7: Send Test Notification" -ForegroundColor Cyan
Write-Host "  Option A - Use HTML Tester:" -ForegroundColor Yellow
Write-Host "    1. Open notification-tester.html in browser" -ForegroundColor White
Write-Host "    2. Login with same credentials" -ForegroundColor White
Write-Host "    3. Click 'Send Test Notification'" -ForegroundColor White
Write-Host ""
Write-Host "  Option B - Use PowerShell:" -ForegroundColor Yellow
Write-Host "    1. Get token from DevTools → Application → Local Storage → currentUser → accessToken" -ForegroundColor White
Write-Host "    2. Run command:" -ForegroundColor White
Write-Host '       $token = "YOUR_TOKEN"' -ForegroundColor DarkGray
Write-Host '       Invoke-RestMethod -Uri "http://localhost:3000/push-notifications/test" -Method POST -Headers @{"Authorization"="Bearer $token"}' -ForegroundColor DarkGray
Write-Host ""
Write-Host "Step 8: Verify Notification" -ForegroundColor Cyan
Write-Host "  ✅ Browser notification should appear (if tab inactive)" -ForegroundColor Green
Write-Host "  ✅ Bell icon shows unread count badge" -ForegroundColor Green
Write-Host "  ✅ Notification appears in dropdown list" -ForegroundColor Green
Write-Host "  ✅ Can click notification to navigate" -ForegroundColor Green
Write-Host "  ✅ Can mark as read / clear all" -ForegroundColor Green
Write-Host ""

Write-Host "📱 MOBILE APP - Testing Flow:" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "Step 1: Install Expo Go" -ForegroundColor Cyan
Write-Host "  iOS: App Store → Search 'Expo Go'" -ForegroundColor White
Write-Host "  Android: Play Store → Search 'Expo Go'" -ForegroundColor White
Write-Host ""
Write-Host "Step 2: Get Your Computer's IP Address" -ForegroundColor Cyan
Write-Host "  Run: ipconfig" -ForegroundColor White
Write-Host "  Look for 'IPv4 Address' (e.g., 192.168.1.100)" -ForegroundColor White
Write-Host ""

# Get local IP
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notmatch "Loopback" -and $_.IPAddress -match "^192\." } | Select-Object -First 1).IPAddress

if ($ip) {
    Write-Host "  Your IP Address: $ip" -ForegroundColor Green
    Write-Host ""
    Write-Host "Step 3: Update Mobile API Config" -ForegroundColor Cyan
    Write-Host "  Edit file: mobile/src/config/api.config.ts" -ForegroundColor White
    Write-Host "  Change baseURL to: http://${ip}:3000" -ForegroundColor Yellow
} else {
    Write-Host "  Could not auto-detect IP. Run 'ipconfig' manually." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Step 3: Update Mobile API Config" -ForegroundColor Cyan
    Write-Host "  Edit file: mobile/src/config/api.config.ts" -ForegroundColor White
    Write-Host "  Change baseURL to: http://YOUR_IP:3000" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 4: Start Expo Server" -ForegroundColor Cyan
Write-Host "  cd c:\Users\malad\Desktop\delivery\mobile" -ForegroundColor White
Write-Host "  npx expo start" -ForegroundColor White
Write-Host ""
Write-Host "Step 5: Connect Phone" -ForegroundColor Cyan
Write-Host "  Ensure phone is on SAME WiFi as computer" -ForegroundColor Yellow
Write-Host "  Open Expo Go app" -ForegroundColor White
Write-Host "  Scan QR code from terminal" -ForegroundColor White
Write-Host "  Wait for app to build and open" -ForegroundColor White
Write-Host ""
Write-Host "Step 6: Test Mobile Notifications" -ForegroundColor Cyan
Write-Host "  1. Login to mobile app" -ForegroundColor White
Write-Host "  2. Grant notification permission when prompted" -ForegroundColor White
Write-Host "  3. Send test notification (same method as web)" -ForegroundColor White
Write-Host "  4. Verify notification appears on phone" -ForegroundColor White
Write-Host ""

Write-Host "🔧 Troubleshooting:" -ForegroundColor Magenta
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "Problem: Permission not requested automatically" -ForegroundColor Red
Write-Host "  ➜ Make sure you're logged in" -ForegroundColor White
Write-Host "  ➜ Check console for errors" -ForegroundColor White
Write-Host "  ➜ Verify PushNotificationService is injected in app.component.ts" -ForegroundColor White
Write-Host ""
Write-Host "Problem: Notification not received" -ForegroundColor Red
Write-Host "  ➜ Check if device is registered: Check backend logs" -ForegroundColor White
Write-Host "  ➜ Verify Firebase config is correct" -ForegroundColor White
Write-Host "  ➜ Check browser console for FCM token" -ForegroundColor White
Write-Host "  ➜ Test with: curl http://localhost:3000/push-notifications/stats" -ForegroundColor White
Write-Host ""
Write-Host "Problem: Mobile 'Network request failed'" -ForegroundColor Red
Write-Host "  ➜ Ensure phone and computer on same WiFi" -ForegroundColor White
Write-Host "  ➜ Use computer's IP, not 'localhost'" -ForegroundColor White
Write-Host "  ➜ Check Windows Firewall allows port 3000" -ForegroundColor White
Write-Host "  ➜ Test backend access from phone browser: http://YOUR_IP:3000" -ForegroundColor White
Write-Host ""
Write-Host "Problem: Bell icon not showing" -ForegroundColor Red
Write-Host "  ➜ Check if nav-right.component.ts was updated" -ForegroundColor White
Write-Host "  ➜ Restart Angular dev server" -ForegroundColor White
Write-Host "  ➜ Clear browser cache (Ctrl+Shift+Delete)" -ForegroundColor White
Write-Host ""

Write-Host "📚 Additional Help:" -ForegroundColor Yellow
Write-Host "  Full Guide: PUSH_NOTIFICATION_LIVE_TEST_GUIDE.md" -ForegroundColor White
Write-Host "  Firebase Setup: FIREBASE_SETUP.md" -ForegroundColor White
Write-Host "  HTML Tester: notification-tester.html" -ForegroundColor White
Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Ready to test! Good luck! 🚀" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
