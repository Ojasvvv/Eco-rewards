# 🚀 Quick Setup Guide

Follow these steps to get your EcoRewards app running in minutes!

## Step 1: Install Node.js

If you don't have Node.js installed:
1. Visit [nodejs.org](https://nodejs.org/)
2. Download and install the LTS version
3. Verify installation: `node --version`

## Step 2: Install Dependencies

Open terminal/command prompt in the project folder and run:

```bash
npm install
```

This will install all required packages (React, Firebase, Router, etc.)

## Step 3: Set Up Firebase

### Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "EcoRewards")
4. Disable Google Analytics (optional)
5. Click "Create project"

### Enable Google Authentication

1. In Firebase Console, go to **Build** → **Authentication**
2. Click "Get started"
3. Click on **Sign-in method** tab
4. Click on "Google"
5. Toggle "Enable" and click "Save"

### Get Your Firebase Config

1. Go to **Project Settings** (gear icon)
2. Scroll down to "Your apps"
3. Click the web icon (`</>`)
4. Register app with nickname (e.g., "EcoRewards Web")
5. Copy the `firebaseConfig` object

### Add Config to Your App

1. Open `src/firebase/config.js`
2. Replace the placeholder values:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

## Step 4: Run the App

```bash
npm run dev
```

The app will open at `http://localhost:3000`

## Step 5: Test It Out!

1. You should see the beautiful login page
2. Click "Continue with Google"
3. Sign in with your Google account
4. You'll be redirected to the dashboard
5. Try entering a test code (e.g., "DB-12345")

## 🎉 That's It!

Your app is now running! The user will stay logged in even after closing the browser.

## 📱 Testing on Phone

### Option 1: Use Your Local Network

1. Find your computer's IP address:
   - Windows: `ipconfig` (look for IPv4)
   - Mac/Linux: `ifconfig` or `ip addr`

2. On your phone, connect to the same WiFi

3. Open browser and go to: `http://YOUR_IP:3000`
   - Example: `http://192.168.1.100:3000`

4. In Firebase Console, add your IP to authorized domains:
   - **Authentication** → **Settings** → **Authorized domains**
   - Add: `YOUR_IP` (e.g., `192.168.1.100`)

### Option 2: Deploy for Real Testing

Deploy to Firebase Hosting (free):

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize
firebase init hosting
# Select your project
# Set public directory to: dist
# Configure as single-page app: Yes
# Don't overwrite index.html

# Build and deploy
npm run build
firebase deploy
```

Your app will be live at: `https://your-project.web.app`

## 🔧 Troubleshooting

### "Module not found" error
```bash
rm -rf node_modules package-lock.json
npm install
```

### Firebase auth not working
- Check if Google sign-in is enabled in Firebase Console
- Verify your domain is in authorized domains
- Make sure firebaseConfig is correct

### Port 3000 already in use
Edit `vite.config.js` and change the port:
```javascript
server: {
  port: 3001  // or any other port
}
```

### Can't access from phone
- Make sure phone and computer are on same WiFi
- Disable firewall temporarily to test
- Add your IP to Firebase authorized domains

## 🎨 Customization

### Change App Name
- Edit `index.html` title tag
- Update name in `package.json`
- Change logo text in `Login.jsx` and `Dashboard.jsx`

### Change Colors
Edit `src/index.css`:
```css
:root {
  --primary: #your-color;
}
```

### Change Brand
- Update the dustbin icon SVG in components
- Change gradient backgrounds in CSS files

## 📞 Need Help?

Common issues and solutions:

1. **Blank screen**: Check browser console (F12) for errors
2. **Auth fails**: Verify Firebase config is correct
3. **Slow loading**: Clear browser cache
4. **Mobile issues**: Test in Chrome mobile, check viewport

---

Happy coding! 🚀

