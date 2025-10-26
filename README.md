# 🌍 EcoRewards: Turning Waste into Value

<div align="center">

![EcoRewards Banner](https://img.shields.io/badge/🏆-GeeksForGeeks_Hackathon_Winner-gold?style=for-the-badge)
![Team](https://img.shields.io/badge/Team-Apatheia-blue?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Production_Ready-success?style=for-the-badge)

**🎉 Winner - GeeksForGeeks Hackathon @ SRM AP University 🎉**

*Rewarding Responsibility, One Deposit at a Time*

[🚀 Live Demo](https://eco-rewards-wheat.vercel.app) • [💻 View Code](https://github.com/Ojasvvv/Eco-rewards) • [📧 Contact Us](mailto:teamapatheia@gmail.com)

</div>

---

## 📖 Table of Contents

- [🎯 About](#-about)
- [🚨 The Problem](#-the-problem-were-solving)
- [💡 Our Solution](#-our-solution)
- [✨ Key Features](#-key-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [🔒 Security Features](#-security-features)
- [🏗️ Architecture](#️-architecture)
- [📸 Screenshots](#-screenshots)
- [🔮 Future Roadmap](#-future-roadmap)
- [👥 Team](#-team)
- [💻 Development & Technical Leadership](#-development--technical-leadership)

---

## 🎯 About

**EcoRewards** is a gamified waste management platform that transforms responsible waste disposal into a rewarding experience. Users earn points and discount coupons from local businesses for every proper waste deposit.

### 🏆 Achievement
**Winner** of the **GeeksForGeeks Hackathon** at **SRM AP University** - Recognized for innovative approach to environmental sustainability and robust technical implementation.

### 📱 What We Built
This repository contains the **complete web application (software MVP)** that won the hackathon. The platform is fully functional and production-ready, with:
- ✅ Secure authentication and user management
- ✅ Real-time rewards and gamification system
- ✅ Location-based validation
- ✅ City-wide leaderboards
- ✅ Comprehensive security measures

**Hardware Integration:** The smart dustbin hardware (sensors, IoT modules) is currently under development and will be integrated in future phases.

---

## 🚨 The Problem We're Solving

<table>
<tr>
<td width="33%" align="center">
<h3>🌍 Massive Waste Crisis</h3>
<p><strong>1.3 billion tons</strong> of waste generated annually, overwhelming ecosystems worldwide</p>
</td>
<td width="33%" align="center">
<h3>😴 Public Apathy</h3>
<p>Current systems offer <strong>no engagement</strong> or feedback, leading to poor disposal habits</p>
</td>
<td width="33%" align="center">
<h3>🚫 Zero Incentive</h3>
<p>Widespread littering due to <strong>lack of motivation</strong> for proper waste disposal</p>
</td>
</tr>
</table>

---

## 💡 Our Solution

### The Concept
Transform waste disposal from a chore into an **engaging, rewarding experience**:

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Sign In   │ ───▶ │  Enter Code  │ ───▶ │  Bin Opens  │ ───▶ │ Trash Checked│ ───▶ │ Get Reward  │
│  (Google)   │      │  (Location   │      │ (10 seconds)│      │  (Sensors)   │      │  (Instant)  │
│             │      │  Verified)   │      │             │      │             │      │             │
└─────────────┘      └──────────────┘      └─────────────┘      └──────────────┘      └─────────────┘
```

### 🎯 Core Features
- 🎮 **Gamification** - Points, achievements, and leaderboards
- 🎁 **Instant Rewards** - Real discount coupons from local businesses
- 📊 **Impact Tracking** - Visualize your environmental contribution
- 🏆 **Community Competition** - City-wide rankings and challenges

### 💰 Business Model - Win³ Ecosystem

<table>
<tr>
<td width="25%" align="center">
<h4>📺 Ad Display</h4>
<p>Companies sponsor bin displays</p>
</td>
<td width="25%" align="center">
<h4>📊 Data Insights</h4>
<p>Analytics for municipalities</p>
</td>
<td width="25%" align="center">
<h4>🏪 Local Partnerships</h4>
<p>Businesses give coupons</p>
</td>
<td width="25%" align="center">
<h4>♻️ Waste Sale</h4>
<p>Recycling revenue</p>
</td>
</tr>
</table>

**Result:**
- ✅ Users keep cities clean and earn rewards
- ✅ Businesses gain visibility and customers
- ✅ Platform generates sustainable revenue

---

## ✨ Key Features

<details>
<summary><strong>🔐 Secure Authentication</strong></summary>
<br>

- Google OAuth integration via Firebase
- Email verification enforcement
- Token-based API security
- Persistent login sessions
</details>

<details>
<summary><strong>📍 Location-Based Validation</strong></summary>
<br>

- Real-time GPS verification
- Server-side distance calculation (Haversine formula)
- 100m proximity enforcement
- **Cannot be bypassed** by GPS spoofing
</details>

<details>
<summary><strong>🎁 Instant Rewards System</strong></summary>
<br>

- Immediate point allocation
- Dynamic discount coupons
- Multiple reward tiers (Coffee, Meal, Shopping, Premium)
- QR code redemption at partner outlets
</details>

<details>
<summary><strong>🏆 Gamification & Achievements</strong></summary>
<br>

- 20+ unique achievements
- Progressive milestones (First Deposit → EcoHero)
- Real-time notifications
- Animated celebrations with confetti
</details>

<details>
<summary><strong>📊 City Leaderboards</strong></summary>
<br>

- City-wide rankings
- Real-time updates
- Community competition
- Impact visualization
</details>

<details>
<summary><strong>👤 Comprehensive Profile</strong></summary>
<br>

- Detailed statistics dashboard
- Achievement showcase
- Deposit history
- Environmental impact metrics
</details>

<details>
<summary><strong>🚨 Bin Reporting</strong></summary>
<br>

- Report full bins
- Report damaged equipment
- Location issues
- Automated maintenance alerts
</details>

<details>
<summary><strong>🌍 Multi-language Support</strong></summary>
<br>

- English, Hindi, Tamil, Telugu, Kannada, Malayalam
- Seamless language switching
- Fully localized content
</details>

<details>
<summary><strong>🎨 Dark Mode</strong></summary>
<br>

- System preference detection
- Manual toggle
- Smooth transitions
</details>

<details>
<summary><strong>📱 Progressive Web App (PWA)</strong></summary>
<br>

- Installable on mobile/desktop
- Offline support
- Native app experience
- Quick action shortcuts
</details>

<details>
<summary><strong>🛡️ Advanced Security</strong></summary>
<br>

- Rate limiting (Firestore-based)
- XSS protection (DOMPurify)
- CORS configuration
- Content Security Policy
- Server-side validation only
</details>

<details>
<summary><strong>🚫 Anti-Cheat Mechanisms</strong></summary>
<br>

- Daily deposit limits (5 per day)
- Server-side validation only
- Location verification
- Email verification required
</details>

---

## 🛠️ Tech Stack

<div align="center">

### Frontend
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-Animations-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router-v6-CA4245?style=for-the-badge&logo=react-router&logoColor=white)

### Backend & Services
![Firebase](https://img.shields.io/badge/Firebase-Auth_+_Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Vercel](https://img.shields.io/badge/Vercel-Serverless-000000?style=for-the-badge&logo=vercel&logoColor=white)

### Security
![DOMPurify](https://img.shields.io/badge/DOMPurify-XSS_Protection-orange?style=for-the-badge)
![JWT](https://img.shields.io/badge/JWT-Tokens-000000?style=for-the-badge&logo=json-web-tokens&logoColor=white)

</div>

---

## 🔒 Security Features

> **Production-grade security** implemented throughout

### 🛡️ Authentication & Authorization
- ✅ Firebase Authentication with Google OAuth
- ✅ Token verification on all API endpoints
- ✅ Email verification enforcement
- ✅ Secure session management
- ✅ Location proximity validation (100m max)
- ✅ Dustbin existence verification
- ✅ Daily deposit limits (5 per user)
- ✅ Rate limiting (distributed via Firestore)
- ✅ Transaction atomicity

### 🔐 Input Security
```javascript
✅ DOMPurify sanitization for all user inputs
✅ Dustbin code validation (^DB[0-9]{6}$)
✅ XSS protection on display names
✅ Safe image URL validation
✅ Report details length validation
```

### 🔥 Firestore Security Rules
```javascript
✅ rewards/* - Server-only writes
✅ users/* - Read own data only
✅ dustbins/* - Read-only for clients
✅ achievements/* - Server-managed
```

### 🛡️ Content Security Policy
- ✅ Strict script sources
- ✅ No unsafe-eval
- ✅ Restricted connection sources
- ✅ Frame protection

---

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │Dashboard │  │Leaderboard│  │ Profile  │  │  Login   │        │
│  └────┬─────┘  └─────┬────┘  └────┬─────┘  └────┬─────┘        │
│       └──────────────┴──────────────┴─────────────┘              │
│                          │                                        │
│              Context API (State Management)                       │
│        (Auth, Theme, Language, Achievements)                      │
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
  │Serverless │      │  (Database) │    │   (Images)  │
  │    API    │      │             │    │             │
  └───────────┘      └─────────────┘    └─────────────┘
```

---

## 📸 Screenshots

> **To add your screenshots, follow the instructions below**

### Dashboard
![Dashboard](./screenshots/dashboard.png)
<!-- Replace with: ![Dashboard](./screenshots/dashboard.png) -->

### Achievements
![Achievements](./screenshots/achievements.png)
<!-- Replace with: ![Achievements](./screenshots/achievements.png) -->

### Leaderboard
![Leaderboard](./screenshots/leaderboard.png)
<!-- Replace with: ![Leaderboard](./screenshots/leaderboard.png) -->

### Rewards System
![Rewards](./screenshots/rewards.png)
<!-- Replace with: ![Rewards](./screenshots/rewards.png) -->

### Mobile Experience
<p align="center">
<img src="./screenshots/mobile-dashboard.png" width="250" alt="Mobile Dashboard">
<img src="./screenshots/mobile-profile.png" width="250" alt="Mobile Profile">
<img src="./screenshots/mobile-rewards.png" width="250" alt="Mobile Rewards">
</p>
<!-- Replace with your actual mobile screenshots -->

---

## 🔮 Future Roadmap

### 🛠️ Hardware Integration (In Development)

The complete vision includes smart dustbins with IoT sensors and real-time validation. This hardware component is currently being developed and will include:

- Arduino/ESP32 microcontroller with sensor integration
- Automatic lid mechanism triggered by validated codes
- Ultrasonic and load sensors for waste verification
- Solar-powered operation for sustainability
- Real-time communication with the web platform

### 💡 Software Enhancements

**Near-term**
- Push notifications for nearby bins
- Social sharing features
- Team challenges
- Admin panel for bin management
- Referral program

**Long-term**
- Mobile apps (React Native)
- Advanced analytics
- Corporate CSR dashboard
- Multi-city expansion

---

## 👥 Team

### Team Apatheia 🏆

<div align="center">

| <img src="https://github.com/tejag2309.png" width="100" height="100" style="border-radius: 50%;"><br>**Teja Guduri**<br>[![GitHub](https://img.shields.io/badge/GitHub-tejag2309-181717?style=flat&logo=github)]https://github.com/teja3112) | <img src="https://github.com/ManasM77.png" width="100" height="100" style="border-radius: 50%;"><br>**Manas Mishra**<br>[![GitHub](https://img.shields.io/badge/GitHub-ManasM77-181717?style=flat&logo=github)](https://github.com/ManasM77) | <img src="https://github.com/KARTIKJUYAL.png" width="100" height="100" style="border-radius: 50%;"><br>**Kartik Juyal**<br>[![GitHub](https://img.shields.io/badge/GitHub-KARTIKJUYAL-181717?style=flat&logo=github)](https://github.com/kartikeywastaken) |
|:---:|:---:|:---:|
| <img src="https://github.com/Yash1300.png" width="100" height="100" style="border-radius: 50%;"><br>**Yash Chaubey**<br>[![GitHub](https://img.shields.io/badge/GitHub-Yash1300-181717?style=flat&logo=github)](https://github.com/yashyyp04) | <img src="https://github.com/Ojasvvv.png" width="100" height="100" style="border-radius: 50%;"><br>**Ojasv Kushwah**<br>[![GitHub](https://img.shields.io/badge/GitHub-Ojasvvv-181717?style=flat&logo=github)](https://github.com/Ojasvvv) | |

</div>

---

## 💻 Development & Technical Leadership

<div align="center">

### 🚀Developed & Architected by Team Leader

<table>
<tr>
<td align="center" width="100%">
<img src="https://github.com/Ojasvvv.png" width="150" height="150" style="border-radius: 50%;">
<h2>Ojasv Kushwah</h2>
<p><strong>Team Leader & Lead Developer</strong></p>
<p>🔥 <em>This entire project was vibecoded from scratch</em> 🔥</p>
<br>

**We used AI to do everything!!:**
- ✅ Full-stack architecture & implementation
- ✅ Frontend (React, Vite, Context API)
- ✅ Backend (Firebase, Vercel Serverless APIs)
- ✅ Security implementation & validation
- ✅ Database design & Firestore rules
- ✅ PWA setup & service workers
- ✅ CI/CD & production deployment

<br>

### 📧 Get in Touch

[![Email](https://img.shields.io/badge/Email-Ojasvkushwah1%40gmail.com-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:Ojasvkushwah1@gmail.com)
[![GitHub](https://img.shields.io/badge/GitHub-Ojasvvv-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Ojasvvv)

<br>

> 💡 **For technical discussions, collaboration opportunities, or project inquiries,**  
> **reach out at [Ojasvkushwah1@gmail.com](mailto:Ojasvkushwah1@gmail.com)**

</td>
</tr>
</table>

</div>

---

## 🎉 Acknowledgments

<table>
<tr>
<td align="center">
<h3>🏆 GeeksForGeeks</h3>
<p>For organizing an inspiring hackathon</p>
</td>
<td align="center">
<h3>🎓 SRM AP University</h3>
<p>For hosting and supporting innovation</p>
</td>
<td align="center">
<h3>🔥 Firebase & Vercel</h3>
<p>For powerful infrastructure tools</p>
</td>
</tr>
</table>

### Inspiration

This project addresses the urgent need for sustainable waste management solutions. We believe technology can make environmental responsibility engaging, rewarding, and scalable.

---

## 📄 License

This project is developed by **Team Apatheia**. All rights reserved.

For collaboration or partnership inquiries, please contact us.

---

## 🤝 Contributing

We welcome:
- 🐛 Bug reports
- 💡 Feature suggestions
- 🔧 Code improvements
- 📖 Documentation enhancements

Please open an issue to discuss proposed changes before submitting PRs.

---

## 📞 Contact & Links

<div align="center">

[![Email](https://img.shields.io/badge/Email-teamapatheia%40gmail.com-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:teamapatheia@gmail.com)
[![Live Demo](https://img.shields.io/badge/Live_Demo-eco--rewards--wheat.vercel.app-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://eco-rewards-wheat.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-Ojasvvv%2FEco--rewards-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Ojasvvv/Eco-rewards)

</div>

---

## ⭐ Star This Repository

If you find this project innovative or useful, please give it a star! It helps us gauge interest in sustainable tech solutions.

<div align="center">

[![Star History](https://img.shields.io/github/stars/Ojasvvv/Eco-rewards?style=social)](https://github.com/Ojasvvv/Eco-rewards/stargazers)

</div>

---

<div align="center">

### 💚 Made with Love by Team Apatheia

*Making the world a cleaner place, one reward at a time* 🌍♻️

![Made with React](https://img.shields.io/badge/Made_with-React-61DAFB?style=flat&logo=react&logoColor=white)
![Powered by Firebase](https://img.shields.io/badge/Powered_by-Firebase-FFCA28?style=flat&logo=firebase&logoColor=black)
![Deployed on Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=flat&logo=vercel&logoColor=white)

**[🏆 GeeksForGeeks Hackathon Winner @ SRM AP](https://www.geeksforgeeks.org/)**

---

**Quick Links:** [Website](https://eco-rewards-wheat.vercel.app) • [Code](https://github.com/Ojasvvv/Eco-rewards) • [Email](mailto:teamapatheia@gmail.com)

</div>
