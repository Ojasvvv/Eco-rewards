# 📁 Project Structure

```
EcoRewards/
│
├── public/                          # Static assets
│   ├── manifest.json               # PWA manifest
│   └── robots.txt                  # SEO
│
├── src/                            # Source code
│   ├── components/                 # React components
│   │   ├── Auth/
│   │   │   ├── Login.jsx          # 🔐 Sign-in page with Google OAuth
│   │   │   └── Login.css          # Login page styles
│   │   │
│   │   ├── Dashboard/
│   │   │   ├── Dashboard.jsx      # 📱 Main dashboard (code entry)
│   │   │   └── Dashboard.css      # Dashboard styles
│   │   │
│   │   └── ProtectedRoute.jsx     # 🛡️ Route guard for auth
│   │
│   ├── context/
│   │   └── AuthContext.jsx        # 🔄 Auth state management
│   │
│   ├── firebase/
│   │   └── config.js              # 🔥 Firebase configuration
│   │
│   ├── App.jsx                    # 🚀 Main app component
│   ├── App.css                    # App-level styles
│   ├── main.jsx                   # ⚡ Entry point
│   └── index.css                  # 🎨 Global styles & variables
│
├── .gitignore                     # Git ignore rules
├── firebase.json                  # Firebase hosting config
├── index.html                     # HTML template
├── package.json                   # Dependencies
├── vite.config.js                 # Vite configuration
├── README.md                      # 📖 Main documentation
├── SETUP_GUIDE.md                 # 🚀 Quick setup guide
└── PROJECT_STRUCTURE.md           # This file
```

## 🗂️ Key Files Explained

### Configuration Files

- **package.json** - Lists all npm dependencies (React, Firebase, etc.)
- **vite.config.js** - Vite build tool configuration
- **firebase.json** - Firebase hosting deployment settings
- **.gitignore** - Files to exclude from git

### Entry Points

- **index.html** - Base HTML file, loads React app
- **src/main.jsx** - JavaScript entry, renders App component
- **src/App.jsx** - Main component with routing

### Core Components

#### 1. Login Component (`src/components/Auth/`)
- Beautiful gradient background with animated blobs
- Google OAuth sign-in button
- Feature highlights
- Mobile-responsive design
- Loading states and error handling

#### 2. Dashboard Component (`src/components/Dashboard/`)
- User profile header with logout
- Reward statistics cards
- Dustbin code entry form
- Success/error messages
- How-to guide
- Reward redemption info

#### 3. Protected Route (`src/components/ProtectedRoute.jsx`)
- Blocks unauthorized access to dashboard
- Shows loading spinner during auth check
- Redirects to login if not authenticated

### Context & State

#### Auth Context (`src/context/AuthContext.jsx`)
- Manages user authentication state
- Provides sign-in/sign-out functions
- Handles Firebase auth persistence
- Makes user data available app-wide

### Styling

#### Global Styles (`src/index.css`)
- CSS custom properties (variables)
- Color scheme
- Shadows and effects
- Animations (slideUp, fadeIn, pulse)
- Scrollbar styling
- Font imports

#### Component Styles
- Each component has its own CSS file
- Responsive breakpoints for mobile/tablet/desktop
- Touch-friendly button sizes
- Smooth transitions and animations

## 🎨 Design System

### Color Palette
```css
Primary:   #10b981 (Green - Eco theme)
Secondary: #6366f1 (Indigo)
Accent:    #ec4899 (Pink)
Error:     #ef4444 (Red)
Success:   #10b981 (Green)
```

### Breakpoints
- Mobile: < 480px
- Tablet: 481px - 768px
- Desktop: > 768px
- Landscape: Custom height-based rules

### Typography
- Font: Inter (from Google Fonts)
- Headings: 700-800 weight
- Body: 400-600 weight

## 🔐 Authentication Flow

```
User visits site
    ↓
Login page displayed
    ↓
User clicks "Continue with Google"
    ↓
Firebase handles OAuth popup
    ↓
User approves Google sign-in
    ↓
Auth state saved to browser
    ↓
Redirect to /dashboard
    ↓
Dashboard loads user data
```

## 📱 Component Hierarchy

```
App (Router + AuthProvider)
  ├── Login
  │   └── Google sign-in button
  │
  └── ProtectedRoute
      └── Dashboard
          ├── Header (profile, logout)
          ├── Stats cards (points, deposits)
          ├── Code entry form
          └── Rewards info
```

## 🔄 Data Flow

1. **User State**: AuthContext → All components
2. **Rewards**: Dashboard local state (will connect to backend)
3. **Dustbin Codes**: Form submission → API call → IoT device

## 🚀 How It Works

### Login Process
1. User clicks Google sign-in
2. `signInWithGoogle()` from AuthContext
3. Firebase shows Google OAuth popup
4. On success, user object saved to state
5. Browser caches auth token
6. User redirected to dashboard

### Code Entry Process
1. User enters dustbin code
2. Form validates input
3. Simulated API call (replace with real backend)
4. Success: Show confirmation
5. Simulate sensor detection (3 seconds)
6. Award points to user
7. Update rewards display

## 🛠️ Future Integration Points

### Backend API Needed
```javascript
POST /api/dustbin/verify
  - Verify code exists
  - Check if code already used
  - Return dustbin location

POST /api/dustbin/open
  - Send signal to IoT device
  - Open dustbin lid
  - Return success

GET /api/sensors/status/:dustbinId
  - Check if trash deposited
  - Return sensor data

POST /api/rewards/grant
  - Award points to user
  - Update database
  - Return new balance
```

### Database Schema (Example)
```
Users:
  - uid (from Firebase)
  - displayName
  - email
  - totalPoints
  - totalDeposits
  - createdAt

Dustbins:
  - code (unique)
  - location
  - storeId
  - isActive
  - lastUsed

Transactions:
  - userId
  - dustbinCode
  - timestamp
  - pointsEarned
  - status
```

## 📦 Dependencies

### Production
- **react** (18.3.1) - UI library
- **react-dom** (18.3.1) - React rendering
- **react-router-dom** (6.26.0) - Routing
- **firebase** (10.13.0) - Authentication & hosting

### Development
- **vite** (5.4.2) - Build tool
- **@vitejs/plugin-react** (4.3.1) - React plugin for Vite

## 🎯 Mobile Optimization Features

1. **Touch Targets**: Minimum 44px for buttons
2. **Viewport**: Proper meta tag for mobile
3. **Responsive**: Fluid typography and spacing
4. **Fast Loading**: Optimized assets, code splitting
5. **PWA Ready**: Manifest.json included
6. **Animations**: Smooth, performant CSS animations
7. **Layout**: Flexbox and Grid for flexible layouts

---

This structure is designed for scalability and easy maintenance. Add new components in the `components/` folder and connect them via routing in `App.jsx`.

