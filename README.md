# 🌱 EcoRewards - Smart Dustbin Rewards System

A modern, mobile-first web application for the EcoRewards smart dustbin initiative. Users scan QR codes from smart dustbins, deposit trash, and earn rewards redeemable at partner stores and malls.

## ✨ Features

- 🔐 **Google OAuth Authentication** - Secure sign-in with Firebase
- 📱 **Mobile-First Design** - Optimized for phone and desktop
- 💾 **Browser Caching** - Auto-login for returning users
- 🎁 **Rewards System** - Earn points for recycling
- 🏪 **Store Integration** - Redeem discounts at partner outlets
- 🎨 **Beautiful UI** - Modern, gradient-based design
- ⚡ **Fast & Responsive** - Built with React and Vite

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A Firebase project with Google Authentication enabled

### Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use an existing one)
3. Enable Google Authentication:
   - Go to **Authentication** → **Sign-in method**
   - Enable **Google** provider
   - Add your domain to authorized domains
4. Get your Firebase config:
   - Go to **Project Settings** → **General**
   - Scroll down to "Your apps"
   - Click the web icon (`</>`) to create a web app
   - Copy the configuration object

### Installation

1. **Clone or download this project**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   
   Open `src/firebase/config.js` and replace the placeholder config with your Firebase credentials:
   
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT_ID.appspot.com",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to `http://localhost:3000`

## 📱 Usage

### For Users

1. **Sign In**
   - Scan the QR code on a smart dustbin
   - Click "Continue with Google" to sign in
   - Your login will be cached for future visits

2. **Enter Dustbin Code**
   - After scanning, you'll see a unique code
   - Enter it in the dashboard
   - The dustbin lid will open automatically

3. **Deposit Trash**
   - Place your trash in the dustbin
   - Sensors detect the deposit
   - You earn reward points instantly!

4. **Redeem Rewards**
   - Use points for discounts at partner stores
   - Access exclusive offers and deals

### For Development

The app is structured as follows:

```
src/
├── components/
│   ├── Auth/
│   │   ├── Login.jsx          # Sign-in page
│   │   └── Login.css
│   ├── Dashboard/
│   │   ├── Dashboard.jsx      # Main app dashboard
│   │   └── Dashboard.css
│   └── ProtectedRoute.jsx     # Route guard
├── context/
│   └── AuthContext.jsx        # Authentication state
├── firebase/
│   └── config.js              # Firebase configuration
├── App.jsx                    # Main app component
├── main.jsx                   # Entry point
└── index.css                  # Global styles
```

## 🔧 Customization

### Changing Colors

Edit the CSS variables in `src/index.css`:

```css
:root {
  --primary: #10b981;        /* Main brand color */
  --primary-dark: #059669;   /* Darker shade */
  --primary-light: #d1fae5;  /* Lighter shade */
  --secondary: #6366f1;      /* Secondary color */
  /* ... more variables */
}
```

### Modifying Rewards Logic

The current implementation simulates the dustbin interaction. To connect to real hardware:

1. **Backend API**: Create an API endpoint to:
   - Verify dustbin codes
   - Send signals to IoT devices
   - Receive sensor data
   - Update user rewards

2. **Update Dashboard**: Replace the simulated API call in `src/components/Dashboard/Dashboard.jsx`:

```javascript
// Replace this simulation
await new Promise(resolve => setTimeout(resolve, 1500));

// With actual API call
const response = await fetch('/api/dustbin/open', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code: dustbinCode, userId: user.uid })
});
const data = await response.json();
```

## 🏗️ Building for Production

1. **Build the app**
   ```bash
   npm run build
   ```

2. **Preview the build**
   ```bash
   npm run preview
   ```

3. **Deploy**
   
   Deploy the `dist` folder to your hosting provider:
   - Firebase Hosting
   - Vercel
   - Netlify
   - Any static hosting service

### Firebase Hosting Deployment

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase
firebase init hosting

# Build and deploy
npm run build
firebase deploy
```

## 📱 Mobile Optimization

The app is optimized for mobile devices with:

- Touch-friendly buttons (minimum 44px touch targets)
- Responsive typography
- Optimized animations
- Mobile-first CSS
- Viewport meta tags
- Fast loading times

## 🔒 Security

- Firebase Authentication handles secure login
- User sessions are cached locally
- Protected routes prevent unauthorized access
- No sensitive data stored in localStorage

## 🤝 Contributing

This is a hackathon project. To extend it:

1. Add a backend API for dustbin management
2. Implement IoT integration
3. Create admin dashboard for store owners
4. Add leaderboards and gamification
5. Implement push notifications

## 📄 License

MIT License - Feel free to use this project for your hackathon or commercial purposes.

## 💡 Future Enhancements

- [ ] Backend API with database
- [ ] IoT device integration
- [ ] QR code generation for dustbins
- [ ] Admin panel for stores
- [ ] User profile and history
- [ ] Leaderboards
- [ ] Push notifications
- [ ] Multi-language support
- [ ] Dark mode
- [ ] PWA support

## 🎯 Tech Stack

- **Frontend**: React 18
- **Routing**: React Router v6
- **Authentication**: Firebase Auth
- **Build Tool**: Vite
- **Styling**: Pure CSS with CSS Variables
- **Icons**: SVG (inline)

## 📞 Support

For questions or issues, please open an issue in the repository.

---

Made with 💚 for a cleaner planet

