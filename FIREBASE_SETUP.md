# Firebase Setup Guide

To enable robust multi-device support, we have switched to Firebase Realtime Database.

## 1. Create a Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Click **"Add project"** and follow the steps (disable Google Analytics for simplicity).
3. Once created, go to **"Build"** -> **"Realtime Database"**.
4. Click **"Create Database"**.
5. Choose a location (e.g., United States).
6. **Security Rules**: Start in **Test Mode** (allows read/write for 30 days).
   - *Note: For production, you should secure this later.*

## 2. Get Configuration
1. Click the **Project Settings** (gear icon) -> **General**.
2. Scroll down to "Your apps".
3. Click the **Web** icon (`</>`).
4. Register app (name it "Monopoly").
5. Copy the `firebaseConfig` object.

## 3. Update Config File
1. Open `app/src/config/firebase.js`.
2. Replace the placeholder values with your copied config:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "...",
  databaseURL: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

## 4. Deploy
1. Commit and push your changes.
2. Vercel will redeploy automatically.

## Why Firebase?
- **Reliable**: Works on all networks (4G/5G/WiFi).
- **Fast**: Real-time WebSocket connection.
- **Free**: Generous free tier for this use case.
