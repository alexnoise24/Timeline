# 🚀 PWA & Push Notifications Setup Guide

## ✅ What's Been Implemented

### Frontend
- ✅ PWA manifest (`/public/manifest.json`)
- ✅ Service worker for push notifications (`/public/firebase-messaging-sw.js`)
- ✅ Firebase configuration (`/src/lib/firebase.ts`)
- ✅ Notification handler component (`/src/components/NotificationHandler.tsx`)
- ✅ PWA meta tags in `index.html`
- ✅ Countdown timers and event completion status

### Backend
- ✅ FCM token storage in User model
- ✅ API endpoints for FCM token management (`/api/users/fcm-token`)
- ✅ Routes to save/update/delete FCM tokens

---

## 🔥 Firebase Setup (Required Steps)

### Step 1: Create Firebase Project

1. **Go to Firebase Console:** https://console.firebase.google.com/
2. **Create a new project:**
   - Click "Add project"
   - Name: "Wedding Timeline" (or your choice)
   - Disable Google Analytics (optional)
   - Click "Create project"

### Step 2: Add Web App to Firebase

1. In your Firebase project, click the **</> (Web)** icon
2. Register your app:
   - App nickname: "Wedding Timeline Web"
   - Check "Also set up Firebase Hosting" (optional)
   - Click "Register app"
3. **Copy the Firebase config** that appears - you'll need this!

### Step 3: Enable Cloud Messaging

1. Go to **Project Settings** (gear icon)
2. Click on the **Cloud Messaging** tab
3. Under "Web Push certificates", click **"Generate key pair"**
4. **Copy the VAPID key** - you'll need this!

### Step 4: (Optional) Get Firebase Admin SDK for Backend

1. In Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Save it securely - **DO NOT commit to Git!**

---

## 🔧 Configuration

### Frontend Environment Variables

Create `/frontend/.env` file with your Firebase credentials:

```env
# Firebase Config (from Step 2)
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456:web:abc123

# VAPID Key (from Step 3)
VITE_FIREBASE_VAPID_KEY=BH5m...
```

### Update Service Worker

Edit `/frontend/public/firebase-messaging-sw.js` and replace the placeholder config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY", // Replace with actual values
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### Backend Environment Variables (Optional for sending notifications)

Add to `/backend/.env`:

```env
# Firebase Admin SDK (if you want to send push notifications from backend)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

---

## 📦 Install Dependencies

### Frontend

```bash
cd frontend
npm install firebase
```

### Backend (Optional - for sending notifications)

```bash
cd backend
npm install firebase-admin
```

---

## 🎨 Create App Icons

You need to create two icon files in `/frontend/public/`:

- `icon-192.png` (192x192 pixels)
- `icon-512.png` (512x512 pixels)

**Quick way to create icons:**
1. Use a logo/image
2. Resize to 192x192 and 512x512
3. Tools: Figma, Photoshop, or online tools like https://realfavicongenerator.net/

**Or use a placeholder:**
```bash
# Download a placeholder icon
curl -o frontend/public/icon-192.png https://via.placeholder.com/192x192/d946ef/ffffff?text=W
curl -o frontend/public/icon-512.png https://via.placeholder.com/512x512/d946ef/ffffff?text=Wedding
```

---

## 🧪 Testing

### Test PWA Installation

1. Build frontend: `cd frontend && npm run build`
2. Serve it: `npm run preview`
3. Open in Chrome
4. Check for install prompt in address bar
5. Install the app
6. Check if it appears on home screen

### Test Push Notifications

1. Open your deployed app
2. You should see a notification permission prompt
3. Click "Enable Notifications"
4. Grant permission in browser
5. Check browser console for FCM token
6. Token should be saved to backend

### Test on Mobile

1. Deploy to Netlify (already configured)
2. Open on your phone's browser (Chrome/Safari)
3. For iOS: Tap Share → Add to Home Screen
4. For Android: Tap menu → Install app
5. Grant notification permission
6. Test receiving notifications

---

## 🚀 Sending Push Notifications (Optional Backend Implementation)

To send notifications from your backend when events occur:

### Install Firebase Admin SDK

```bash
cd backend
npm install firebase-admin
```

### Create notification service

Create `/backend/services/notifications.js`:

```javascript
import admin from 'firebase-admin';

// Initialize Firebase Admin (using environment variables)
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

export async function sendPushNotification(userIds, title, body, data = {}) {
  try {
    const User = (await import('../models/User.js')).default;
    const users = await User.find({ _id: { $in: userIds } });
    
    const tokens = users.flatMap(user => 
      user.fcmTokens.map(t => t.token)
    );
    
    if (tokens.length === 0) {
      console.log('No FCM tokens found for users');
      return;
    }
    
    const message = {
      notification: { title, body },
      data,
      tokens
    };
    
    const response = await admin.messaging().sendMulticast(message);
    console.log(`Sent ${response.successCount} notifications`);
    
    return response;
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}
```

### Use in your routes

Example in `/backend/routes/messages.js`:

```javascript
import { sendPushNotification } from '../services/notifications.js';

// After saving a message
await sendPushNotification(
  [receiverUserId],
  'New Message',
  `${sender.name}: ${message.content}`,
  { 
    url: `/timeline/${timelineId}`,
    type: 'message'
  }
);
```

---

## 📱 Features Working

### ✅ What Works Now
- 📱 PWA installable on all platforms
- 🔔 Push notifications on Android (fully functional)
- 🔔 Push notifications on iOS (when app installed to home screen)
- ⏱️ Countdown timers on Dashboard and Timeline
- ✓ Event completion marking
- 💬 Real-time chat (Socket.IO)
- 📊 Responsive design for mobile

### ⚠️ Platform Limitations
- **iOS Safari:** Push notifications only work if app is added to home screen
- **Desktop:** Push notifications work in Chrome, Edge, Firefox
- **iOS < 16.4:** No push notification support

---

## 🐛 Troubleshooting

### Notifications not working?

1. **Check browser console for errors**
2. **Verify Firebase config is correct**
3. **Check notification permission:** `Notification.permission`
4. **Verify service worker is registered:** DevTools → Application → Service Workers
5. **Check FCM token is generated:** Look in console logs
6. **Verify token is saved to backend:** Check network tab

### PWA not installable?

1. **HTTPS required** (works on localhost and Netlify)
2. **Manifest must be valid** JSON
3. **Icons must exist** (192px and 512px)
4. **Service worker must register** successfully

### Icons not showing?

1. **Create the icon files** (`icon-192.png`, `icon-512.png`)
2. **Clear browser cache**
3. **Verify paths** in manifest.json

---

## 📚 Next Steps

1. ✅ Complete Firebase setup (Steps 1-4 above)
2. ✅ Add environment variables
3. ✅ Install dependencies (`npm install firebase`)
4. ✅ Create app icons
5. ✅ Test locally
6. ✅ Deploy to Netlify
7. ✅ Test on mobile devices
8. ⏭️ (Optional) Implement backend push sending logic

---

## 🎉 Benefits of This Implementation

- **No App Store fees** ($99/year for Apple, $25 one-time for Google)
- **No approval process** (instant deployment)
- **Works on Android & iOS** (with PWA)
- **Instant updates** (just deploy to Netlify)
- **Full notification support** (Android + iOS 16.4+)
- **Offline capable** (with service worker)
- **Installable** (looks like a native app)

---

**Need help?** Check Firebase docs: https://firebase.google.com/docs/cloud-messaging/js/client
