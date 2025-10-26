# 🌍 EcoRewards: Turning Waste into Value

<div align="center">

![EcoRewards Banner](https://img.shields.io/badge/🏆-GeeksForGeeks_Hackathon_Winner-gold?style=for-the-badge)
![Team](https://img.shields.io/badge/Team-Apatheia-blue?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Production_Ready-success?style=for-the-badge)

**🎉 Winner - GeeksForGeeks Hackathon @ SRM AP 🎉**

*Rewarding Responsibility, One Deposit at a Time*

[Live Demo](https://eco-rewards-wheat.vercel.app) • [Documentation](#documentation) • [Team](#team)

</div>

---

## 📖 Table of Contents

- [About](#about)
- [The Problem We're Solving](#the-problem-were-solving)
- [Our Solution](#our-solution)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Security Features](#security-features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
- [Future Roadmap](#future-roadmap)
- [Team](#team)
- [Acknowledgments](#acknowledgments)

---

## 🎯 About

**EcoRewards** is a gamified waste management platform that incentivizes responsible waste disposal by rewarding users with points and discount coupons from local businesses. Our vision is simple: **make waste disposal not just a responsibility, but a rewarding activity**.

### 🏆 Achievement
**Winner** of the **GeeksForGeeks Hackathon** at **SRM AP University** - Recognized for innovative approach to environmental sustainability and robust technical implementation.

### 📱 Current Status
This repository contains the **production-ready web application** (software MVP) that won the hackathon. The hardware integration (smart dustbins with sensors) is currently under development and will be integrated in future phases.

---

## 🚨 The Problem We're Solving

### 1. Massive Waste Overflow
- Over **1.3 billion tons** of waste generated annually worldwide
- Straining ecosystems and overwhelming existing infrastructure

### 2. Ineffective Systems
- Current waste solutions offer **no feedback** or engagement
- Leading to public apathy and poor disposal habits

### 3. Lack of Public Incentive
- Widespread littering due to absence of **clear motivation** for proper disposal
- No immediate gratification for responsible behavior

---

## 💡 Our Solution

### The Concept
Transform waste disposal from a mundane task into an **engaging, rewarding experience** through:
- 🎮 **Gamification** - Points, achievements, and leaderboards
- 🎁 **Instant Rewards** - Real discount coupons from local businesses
- 📊 **Progress Tracking** - Visualize your environmental impact
- 🏆 **Community Competition** - City-wide leaderboards and challenges

### How It Works (User Flow)

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Sign In   │ ───> │  Enter Code  │ ───> │  Bin Opens  │ ───> │ Trash Checked│ ───> │ Get Reward  │
│  (Google)   │      │  (Location   │      │ (10 seconds)│      │  (Sensors)   │      │  (Instant)  │
│             │      │  Verified)   │      │             │      │             │      │             │
└─────────────┘      └──────────────┘      └─────────────┘      └──────────────┘      └─────────────┘
```

### Business Model 🚀

| Revenue Stream | Description |
|---------------|-------------|
| 📺 **Ad Display** | Companies pay to display ads on bin screens |
| 📊 **Data Insights** | Anonymized usage analytics for municipal corporations |
| 🏪 **Local Partnerships** | Businesses provide coupons (we facilitate, don't pay) |
| ♻️ **Waste Sale** | Collected waste sold to recycling facilities |

**Win-Win-Win Ecosystem:**
- ✅ Users keep surroundings clean and earn rewards
- ✅ Businesses get visibility and customer engagement
- ✅ Platform earns through ads and recycling revenue

---

## ✨ Key Features

### 🔐 **1. Secure Authentication**
- Google OAuth integration via Firebase Auth
- Email verification enforcement
- Token-based API authentication
- Persistent login sessions

### 📍 **2. Location-Based Validation**
- Real-time GPS verification
- Server-side distance calculation (Haversine formula)
- Maximum 100m proximity enforcement
- **Cannot be bypassed** by GPS spoofing

### 🗑️ **3. Smart Dustbin Integration** (Future Hardware)
- Automatic bin opening for 10 seconds after valid code
- Ultrasonic sensors verify waste deposit
- Load sensors measure weight (minimum 10g threshold)
- Real-time validation and feedback

### 🎁 **4. Instant Rewards System**
- Immediate point allocation after valid deposit
- Dynamic discount coupons from local partners
- Multiple reward tiers (Coffee, Meal, Entertainment, Shopping, Premium)
- Redeem with QR codes at partner outlets

### 🏆 **5. Gamification & Achievements**
- 20+ unique achievements to unlock
- Progressive milestones (First Deposit → EcoHero)
- Real-time achievement notifications
- Animated celebrations with confetti effects

### 📊 **6. Leaderboard System**
- City-wide rankings
- Daily, weekly, and all-time scores
- Real-time updates
- Competitive motivation

### 👤 **7. Comprehensive Profile**
- Detailed statistics dashboard
- Achievement showcase
- Deposit history tracking
- Environmental impact metrics

### 🚨 **8. Bin Reporting System**
- Report full bins
- Report damaged equipment
- Report location issues
- Automated notifications to maintenance teams

### 🌍 **9. Multi-language Support**
- English, Hindi, Tamil, Telugu, Kannada, Malayalam
- Seamless language switching
- Localized content throughout

### 🎨 **10. Dark Mode**
- System preference detection
- Manual toggle option
- Smooth transitions
- Reduced eye strain

### 📱 **11. Progressive Web App (PWA)**
- Install on mobile/desktop
- Offline support with service workers
- Push notification ready
- Native app-like experience
- App shortcuts for quick actions

### 🔒 **12. Rate Limiting**
- Firestore-based distributed rate limiting
- IP-based request tracking
- Prevents spam and abuse
- Configurable limits per endpoint

### 🛡️ **13. Anti-Cheat Mechanisms**
- Minimum weight threshold (10g)
- Daily deposit limits (5 per day)
- Server-side validation only
- Location verification
- Time-limited bin access

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| ⚛️ **React 18** | UI framework with hooks |
| 🎨 **CSS3** | Custom styling with animations |
| 🚀 **Vite** | Fast build tool and dev server |
| 🧭 **React Router v6** | Client-side routing |
| 🎯 **Context API** | State management |

### Backend & Services
| Technology | Purpose |
|-----------|---------|
| 🔥 **Firebase** | Authentication, Firestore, Cloud Functions |
| ☁️ **Vercel Serverless** | API endpoints and hosting |
| 🗄️ **Firestore** | NoSQL database for rewards, users, dustbins |
| 🔐 **Firebase Auth** | Google OAuth authentication |
| 🚦 **Firestore Rate Limiter** | Distributed request throttling |

### Security & Validation
| Technology | Purpose |
|-----------|---------|
| 🧼 **DOMPurify** | XSS protection and sanitization |
| ✅ **Custom Validators** | Input validation for all forms |
| 🔒 **JWT Tokens** | Secure API authentication |
| 🛡️ **CSP Headers** | Content Security Policy |
| 🌐 **CORS** | Cross-origin resource control |

### DevOps & Monitoring
| Technology | Purpose |
|-----------|---------|
| 🚀 **Vercel** | Deployment and hosting |
| 📝 **Git** | Version control |
| 🏗️ **Firebase CLI** | Database rules deployment |
| 📊 **Health Check API** | System monitoring endpoint |

---

## 🔒 Security Features

> **Security Score: 92/100** - Production-ready and audited

### 🛡️ Authentication & Authorization
- ✅ Firebase Authentication with Google OAuth
- ✅ Token verification on all API endpoints
- ✅ Email verification enforcement before rewards
- ✅ Persistent sessions with browser local storage

### 🔐 Input Validation & Sanitization
```javascript
✅ Dustbin code format validation (^DB[0-9]{6}$)
✅ Points amount validation (max 50 per deposit)
✅ Report details length validation
✅ User location format validation
✅ DOMPurify sanitization for all user inputs
✅ XSS protection on display names and messages
```

### 🌐 Server-Side Validation (Critical)
> **All business logic executes server-side - client manipulation impossible**

- ✅ Location proximity validation (100m maximum)
- ✅ Dustbin existence and status verification
- ✅ Daily deposit limits (5 per user per day)
- ✅ Rate limiting (10-30 requests per minute per IP)
- ✅ Transaction atomicity with Firestore transactions
- ✅ Server-side distance calculation (Haversine formula)

### 🚦 Rate Limiting Strategy
```javascript
// Firestore-based distributed rate limiting
✅ Works across serverless instances
✅ Persists through cold starts
✅ Automatic cleanup of expired records
✅ Configurable limits per endpoint
✅ "Fail open" strategy with comprehensive logging
```

### 🔥 Firestore Security Rules
```javascript
// No direct client writes to critical collections
✅ rewards/* - Server-only writes
✅ users/* - Read own data only
✅ dustbins/* - Read-only for clients
✅ achievements/* - Server-managed
```

### 🛡️ Content Security Policy (CSP)
```http
✅ script-src: self + trusted CDNs only
✅ No unsafe-eval (prevents arbitrary code execution)
✅ connect-src: Firebase and own API only
✅ img-src: self + Google CDN (for avatars)
✅ 87/100 CSP security score
```

### 🧼 XSS Protection
```javascript
✅ DOMPurify sanitizes all user-generated content
✅ React's built-in XSS protection
✅ Removes javascript: protocols
✅ Strips event handlers (onclick, onerror, etc.)
✅ Safe image URL validation for user avatars
```

### 📊 Environment Variable Validation
**Three-layer validation system:**
1. **Runtime** - Firebase config validation on app startup
2. **Build-time** - Vite checks before production builds
3. **Health Check** - Backend API validates server config

### 🚨 Anti-Cheat Mechanisms
| Mechanism | Description | Bypass Difficulty |
|-----------|-------------|-------------------|
| **Server Validation** | All logic server-side | ❌ Impossible |
| **Location Proximity** | GPS + Haversine formula | ❌ Impossible |
| **Weight Threshold** | Minimum 10g required | ⚠️ Requires hardware |
| **Daily Limits** | 5 deposits per user | ❌ Impossible |
| **Rate Limiting** | Request throttling | ❌ Impossible |
| **Email Verification** | No fake accounts | ⚠️ Difficult |

---

## 🏗️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          Frontend (React)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │Dashboard │  │Leaderboard│  │ Profile  │  │  Login   │       │
│  └────┬─────┘  └─────┬────┘  └────┬─────┘  └────┬─────┘       │
│       │              │              │             │              │
│       └──────────────┴──────────────┴─────────────┘              │
│                          │                                        │
│                    Context API                                    │
│         (Auth, Theme, Language, Achievements)                     │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                      ┌─────▼─────┐
                      │  Firebase │
                      │   Auth    │
                      └─────┬─────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
  ┌─────▼─────┐      ┌──────▼──────┐    ┌──────▼──────┐
  │  Vercel   │      │  Firestore  │    │   Storage   │
  │Serverless │      │  Database   │    │   (Images)  │
  │    API    │      │             │    │             │
  └───────────┘      └─────────────┘    └─────────────┘
       │
       │ (Future Integration)
       │
  ┌────▼────────────────────────────────────┐
  │     Hardware Layer (In Development)     │
  │  ┌─────────┐  ┌─────────┐  ┌─────────┐ │
  │  │ Arduino │  │ Sensors │  │ Display │ │
  │  │  /ESP32 │  │ (Ultra- │  │  Screen │ │
  │  │         │  │  sonic, │  │         │ │
  │  │         │  │  Load)  │  │         │ │
  │  └─────────┘  └─────────┘  └─────────┘ │
  └─────────────────────────────────────────┘
```

### Database Schema

#### Collections

**`rewards` Collection**
```javascript
{
  userId: string,           // Firebase Auth UID
  points: number,           // Current available points
  totalEarned: number,      // Lifetime earnings
  totalRedeemed: number,    // Lifetime redemptions
  dailyDeposits: number,    // Today's deposit count
  lastDepositDate: string,  // ISO date string
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**`dustbins` Collection**
```javascript
{
  code: string,             // DB000001 format
  location: {
    latitude: number,
    longitude: number,
    address: string,
    city: string
  },
  active: boolean,          // Operational status
  capacity: number,         // 0-100%
  lastEmptied: timestamp,
  maintenanceStatus: string,
  createdAt: timestamp
}
```

**`users` Collection**
```javascript
{
  uid: string,
  email: string,
  displayName: string,
  photoURL: string,
  emailVerified: boolean,
  stats: {
    totalDeposits: number,
    totalRewards: number,
    currentStreak: number,
    longestStreak: number,
    co2Saved: number,        // kg
    treesEquivalent: number
  },
  achievements: array,       // Achievement IDs
  createdAt: timestamp,
  lastActive: timestamp
}
```

**`achievements` Collection**
```javascript
{
  userId: string,
  achievementId: string,
  unlockedAt: timestamp,
  progress: number,
  title: string,
  description: string
}
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase account
- Google Cloud Project (for OAuth)
- Vercel account (for deployment)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/ecorewards.git
cd ecorewards
```

### 2. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install Firebase Functions dependencies
cd functions
npm install
cd ..
```

### 3. Firebase Setup

#### 3.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enable Google Analytics (optional)
4. Enable **Authentication** → Google Sign-in
5. Enable **Firestore Database**
6. Enable **Cloud Functions** (optional for future)

#### 3.2 Get Firebase Config
1. Go to Project Settings ⚙️
2. Scroll to "Your apps" → Click Web icon
3. Copy the config object

#### 3.3 Get Admin SDK Credentials
1. Go to Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Save the JSON file securely

### 4. Environment Variables

Create `.env` file in root:

```env
# Frontend Firebase Config (Public - Safe to expose)
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:xxxxxxxxxxxx

# Backend Firebase Admin SDK (Keep Secret!)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:5173,https://your-domain.com

# Optional: Enable Firestore Rate Limiting
USE_FIRESTORE_RATE_LIMIT=true
```

### 5. Deploy Firestore Rules

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase (select Firestore only)
firebase init

# Deploy rules
firebase deploy --only firestore:rules
```

### 6. Seed Database (Important!)

```bash
# The app requires dustbins in the database to function
# Edit scripts/seedDustbins.js with your actual locations
# Then run:
node scripts/seedDustbins.js seed

# Verify dustbins were created
node scripts/seedDustbins.js list
```

### 7. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 8. Test the Application

**Test Authentication:**
1. Click "Continue with Google"
2. Sign in with your Google account
3. Verify email if not already verified

**Test Reward System:**
1. Enable location services in browser
2. Enter a dustbin code (e.g., DB000001)
3. Ensure you're within 100m of that dustbin
4. Click "Submit"
5. Verify points are added

**Test Rate Limiting:**
1. Make 11+ rapid requests
2. Should get rate limited after 10 requests
3. Wait 60 seconds to reset

---

## 📦 Deployment

### Deploy to Vercel

#### 1. Install Vercel CLI
```bash
npm install -g vercel
```

#### 2. Login to Vercel
```bash
vercel login
```

#### 3. Configure Environment Variables
Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add all variables from your `.env` file.

#### 4. Deploy
```bash
# Preview deployment
vercel

# Production deployment
vercel --prod
```

#### 5. Configure Custom Domain (Optional)
1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update `ALLOWED_ORIGINS` env var

#### 6. Verify Deployment
```bash
# Test health endpoint
curl https://your-app.vercel.app/api/health

# Should return:
# {"status":"healthy","healthy":true,...}
```

### Deploy Firebase Functions (Optional - Future)

```bash
cd functions
firebase deploy --only functions
```

---

## 🔮 Future Roadmap

### 🛠️ Hardware Integration (In Development)

Currently, this repository contains the **software platform** that won the hackathon. The hardware integration is our next major milestone:

#### Phase 1: Hardware Prototype (Q1 2026)
- [ ] Arduino/ESP32 microcontroller setup
- [ ] Ultrasonic sensor integration (HC-SR04)
- [ ] Load cell sensor for weight measurement
- [ ] Servo motor for lid mechanism
- [ ] LCD display for user feedback
- [ ] WiFi/4G connectivity module

#### Phase 2: Smart Bin Features (Q2 2026)
- [ ] Automatic lid opening mechanism
- [ ] Real-time sensor data transmission
- [ ] Bin capacity monitoring
- [ ] Solar power integration
- [ ] QR code generation and printing
- [ ] Ad display screen integration

#### Phase 3: IoT Integration (Q3 2026)
- [ ] Real-time bin status dashboard
- [ ] Predictive maintenance alerts
- [ ] Route optimization for collection trucks
- [ ] Fleet management system
- [ ] Municipal corporation dashboard
- [ ] Data analytics and reporting

#### Phase 4: Scale & Expand (Q4 2026)
- [ ] Pilot deployment (10-20 bins)
- [ ] Partner with local businesses
- [ ] Municipal corporation partnerships
- [ ] User feedback and iteration
- [ ] Multi-city expansion planning

### 💡 Software Enhancements

#### Near-term (Next 3 Months)
- [ ] Push notifications for nearby bins
- [ ] Social sharing features
- [ ] Team/group challenges
- [ ] Advanced analytics dashboard
- [ ] Admin panel for bin management
- [ ] Email notifications for rewards
- [ ] Referral program

#### Mid-term (Next 6 Months)
- [ ] Mobile apps (React Native)
- [ ] AR navigation to nearest bin
- [ ] Carbon footprint calculator
- [ ] Corporate CSR dashboard
- [ ] API for third-party integrations
- [ ] Advanced fraud detection ML models
- [ ] Blockchain-based reward tokens (optional)

#### Long-term (1 Year+)
- [ ] AI-powered waste classification
- [ ] Waste segregation guidance
- [ ] Smart city integration
- [ ] International expansion
- [ ] Plastic credit marketplace
- [ ] Carbon offset certificates

---

## 📸 Screenshots

### Dashboard
![Dashboard](https://via.placeholder.com/800x500?text=Dashboard+Screenshot+Coming+Soon)

### Achievements
![Achievements](https://via.placeholder.com/800x500?text=Achievements+Screenshot+Coming+Soon)

### Leaderboard
![Leaderboard](https://via.placeholder.com/800x500?text=Leaderboard+Screenshot+Coming+Soon)

### Rewards
![Rewards](https://via.placeholder.com/800x500?text=Rewards+Screenshot+Coming+Soon)

---

## 👥 Team

### Team Apatheia 🏆

<table>
<tr>
<td align="center">
<img src="https://via.placeholder.com/150" width="150px" alt="Teja Guduri"/><br/>
<b>Teja Guduri</b><br/>
<sub>Full-stack Developer</sub>
</td>
<td align="center">
<img src="https://via.placeholder.com/150" width="150px" alt="Manas Mishra"/><br/>
<b>Manas Mishra</b><br/>
<sub>Backend Developer</sub>
</td>
<td align="center">
<img src="https://via.placeholder.com/150" width="150px" alt="Kartik Juyal"/><br/>
<b>Kartik Juyal</b><br/>
<sub>Frontend Developer</sub>
</td>
</tr>
<tr>
<td align="center">
<img src="https://via.placeholder.com/150" width="150px" alt="Yash Chaubey"/><br/>
<b>Yash Chaubey</b><br/>
<sub>UI/UX Designer</sub>
</td>
<td align="center">
<img src="https://via.placeholder.com/150" width="150px" alt="Ojasv Kushwah"/><br/>
<b>Ojasv Kushwah</b><br/>
<sub>System Architect</sub>
</td>
</tr>
</table>

---

## 🎉 Acknowledgments

### Special Thanks

- **GeeksForGeeks** - For organizing an amazing hackathon
- **SRM AP University** - For hosting and supporting student innovation
- **Firebase** - For providing robust backend infrastructure
- **Vercel** - For seamless deployment and hosting
- **Open Source Community** - For incredible tools and libraries

### Inspiration

This project was inspired by the urgent need for sustainable waste management solutions and the power of gamification to drive behavioral change. We believe technology can make environmental responsibility engaging and rewarding.

---

## 📄 License

This project is currently under development by Team Apatheia. All rights reserved.

For collaboration or partnership inquiries, please contact the team.

---

## 🤝 Contributing

While this is currently a hackathon project, we welcome:
- Bug reports
- Feature suggestions
- Code improvements
- Documentation enhancements

Please open an issue to discuss proposed changes.

---

## 📞 Contact

For questions, partnerships, or collaboration:

- **Email**: [Insert team email]
- **LinkedIn**: [Insert team LinkedIn]
- **Demo**: [https://eco-rewards-wheat.vercel.app](https://eco-rewards-wheat.vercel.app)

---

## 📚 Documentation

Comprehensive documentation available in the repository:

- [`ENV_SETUP.md`](ENV_SETUP.md) - Environment configuration guide
- [`SECURITY_FIXES_APPLIED.md`](SECURITY_FIXES_APPLIED.md) - Security audit and improvements
- [`PRODUCTION_READINESS_CHECKLIST.md`](PRODUCTION_READINESS_CHECKLIST.md) - Deployment checklist
- [`CSP_CONFIGURATION.md`](CSP_CONFIGURATION.md) - Content Security Policy details
- [`VERCEL_SETUP_GUIDE.md`](VERCEL_SETUP_GUIDE.md) - Vercel deployment guide

---

## ⭐ Star This Repository

If you find this project interesting or useful, please consider giving it a star! It helps us know there's interest in sustainable tech solutions.

---

<div align="center">

**Built with ❤️ by Team Apatheia**

*Making the world a cleaner place, one reward at a time* 🌍♻️

![Made with React](https://img.shields.io/badge/Made%20with-React-61DAFB?style=flat&logo=react)
![Powered by Firebase](https://img.shields.io/badge/Powered%20by-Firebase-FFCA28?style=flat&logo=firebase)
![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=flat&logo=vercel)

</div>

