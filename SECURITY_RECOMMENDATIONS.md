# Comprehensive Security Analysis & Recommendations

## Executive Summary

Your EcoRewards application has several security concerns that need immediate attention. The most critical issue is that all reward logic is client-side, making it trivial for users to manipulate their points.

### Risk Assessment

| Issue | Severity | Impact | Effort to Fix |
|-------|----------|--------|---------------|
| Client-side reward manipulation | 🔴 CRITICAL | HIGH | MEDIUM |
| No server-side validation | 🔴 CRITICAL | HIGH | MEDIUM |
| Hardcoded credentials | 🟢 FIXED | LOW | DONE ✅ |
| Missing Firebase rules | 🟡 MODERATE | MEDIUM | DONE ✅ |
| No rate limiting | 🟡 MODERATE | MEDIUM | HIGH |
| XSS vulnerabilities | 🟡 MODERATE | MEDIUM | LOW |
| CSRF concerns | 🟢 LOW | LOW | LOW |

---

## 🔴 CRITICAL Security Issues

### 1. Client-Side Reward Manipulation

**Current Implementation:**
```javascript
// Dashboard.jsx - Line 21-25
const [rewards, setRewards] = useState(() => {
  const saved = localStorage.getItem(`rewards_${user?.uid}`);
  return saved ? parseInt(saved, 10) : 0;
});

// Line 174
setRewards(prev => prev + pointsEarned);
```

**Problem:**
- Rewards stored in `localStorage` (client-side)
- Anyone can open browser console and run:
  ```javascript
  localStorage.setItem('rewards_your-user-id', '999999');
  window.location.reload();
  ```
- Users can grant themselves unlimited points

**Attack Scenario:**
```javascript
// Attacker can easily:
// 1. Open browser DevTools (F12)
// 2. Go to Console
// 3. Execute:
localStorage.setItem('rewards_abc123', '1000000');
location.reload();
// 4. Now has 1 million points to redeem
```

**Impact:**
- Complete system compromise
- Unlimited coupon generation
- Financial loss to partner businesses
- Loss of trust from partners

**Solution: Implement Backend Validation**

#### Step 1: Set up Firestore to store rewards

```javascript
// firebase/config.js - Add Firestore
import { getFirestore } from 'firebase/firestore';
export const db = getFirestore(app);
```

#### Step 2: Create Cloud Function for reward claiming

```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.claimReward = functions.https.onCall(async (data, context) => {
  // 1. Authentication check
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated'
    );
  }

  const userId = context.auth.uid;
  const { dustbinCode, latitude, longitude, timestamp } = data;

  // 2. Validate dustbin code exists
  const dustbinRef = admin.firestore().collection('dustbins').doc(dustbinCode);
  const dustbinDoc = await dustbinRef.get();
  
  if (!dustbinDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Invalid dustbin code');
  }

  const dustbinData = dustbinDoc.data();

  // 3. Validate location proximity (within 100m)
  const distance = calculateDistance(
    { lat: latitude, lng: longitude },
    dustbinData.location
  );
  
  if (distance > 0.1) { // 100 meters
    throw new functions.https.HttpsError(
      'permission-denied',
      `Too far from dustbin: ${Math.round(distance * 1000)}m`
    );
  }

  // 4. Check daily limit
  const today = new Date().toISOString().split('T')[0];
  const usageQuery = await admin.firestore()
    .collection('usage')
    .where('userId', '==', userId)
    .where('date', '==', today)
    .get();

  if (usageQuery.size >= 5) {
    throw new functions.https.HttpsError(
      'resource-exhausted',
      'Daily limit of 5 deposits reached'
    );
  }

  // 5. Prevent duplicate submissions (within 5 minutes)
  const recentQuery = await admin.firestore()
    .collection('transactions')
    .where('userId', '==', userId)
    .where('dustbinCode', '==', dustbinCode)
    .where('timestamp', '>', admin.firestore.Timestamp.fromDate(
      new Date(Date.now() - 5 * 60 * 1000)
    ))
    .get();

  if (!recentQuery.empty) {
    throw new functions.https.HttpsError(
      'already-exists',
      'Already claimed for this dustbin recently'
    );
  }

  // 6. Award points using transaction (atomic operation)
  const result = await admin.firestore().runTransaction(async (transaction) => {
    const userRewardsRef = admin.firestore().collection('rewards').doc(userId);
    const userRewardsDoc = await transaction.get(userRewardsRef);
    
    const currentPoints = userRewardsDoc.exists 
      ? userRewardsDoc.data().points 
      : 0;
    const pointsToAward = 10;
    const newPoints = currentPoints + pointsToAward;

    // Update rewards
    transaction.set(userRewardsRef, {
      points: newPoints,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // Log transaction
    const transactionRef = admin.firestore().collection('transactions').doc();
    transaction.set(transactionRef, {
      userId,
      dustbinCode,
      outletId: dustbinData.outletId,
      points: pointsToAward,
      location: new admin.firestore.GeoPoint(latitude, longitude),
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      validated: true
    });

    // Log usage for daily limit
    const usageRef = admin.firestore().collection('usage').doc();
    transaction.set(usageRef, {
      userId,
      date: today,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return { points: newPoints, awarded: pointsToAward };
  });

  return result;
});

function calculateDistance(point1, point2) {
  const R = 6371; // Earth's radius in km
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLng = (point2.lng - point1.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(point1.lat * Math.PI / 180) * 
            Math.cos(point2.lat * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
}
```

#### Step 3: Update Frontend to use Cloud Function

```javascript
// Dashboard.jsx - Update handleSubmitCode
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';

const handleSubmitCode = async (e) => {
  e.preventDefault();
  
  if (!dustbinCode.trim()) {
    setError(t('enterDustbinCode'));
    return;
  }

  setError('');
  setSuccess('');
  setLoading(true);

  try {
    // Get user location
    const location = await getUserLocation();
    
    // Call Cloud Function
    const functions = getFunctions();
    const claimReward = httpsCallable(functions, 'claimReward');
    
    const result = await claimReward({
      dustbinCode: dustbinCode,
      latitude: location.lat,
      longitude: location.lng,
      timestamp: Date.now()
    });

    // Update UI with server-validated points
    setRewards(result.data.points);
    setSuccess(`🎉 Success! Earned ${result.data.awarded} points!`);
    
    // Record deposit for achievements
    recordDeposit(getDustbinInfo(dustbinCode).outletId);
    setShowCongratsPopup(true);
    
  } catch (error) {
    if (error.code === 'functions/unauthenticated') {
      setError('Please log in to claim rewards');
    } else if (error.code === 'functions/permission-denied') {
      setError(error.message);
    } else if (error.code === 'functions/resource-exhausted') {
      setError('Daily limit reached. Try again tomorrow!');
    } else {
      setError('Something went wrong. Please try again.');
    }
    console.error(error);
  } finally {
    setLoading(false);
  }
};

// Load rewards from Firestore instead of localStorage
useEffect(() => {
  const loadRewards = async () => {
    if (user?.uid) {
      const rewardsDoc = await getDoc(doc(db, 'rewards', user.uid));
      if (rewardsDoc.exists()) {
        setRewards(rewardsDoc.data().points || 0);
      }
    }
  };
  loadRewards();
}, [user]);
```

**Priority:** 🔴 IMMEDIATE

---

### 2. No Server-Side Validation

**Problem:**
- All validation happens in the browser
- Location checks can be spoofed
- Daily limits can be bypassed
- Dustbin codes not verified against database

**Solution:**
- Implement the Cloud Function above
- Store all business logic server-side
- Validate every request on the backend

**Priority:** 🔴 IMMEDIATE

---

## 🟡 MODERATE Security Issues

### 3. XSS (Cross-Site Scripting) Vulnerabilities

**Current Risk:**
```javascript
// Dashboard.jsx - Line 289
<img src={user?.photoURL || ...} />

// Profile.jsx - displaying user names, emails
<p>{user?.displayName}</p>
```

**Problem:**
- User-controlled content displayed without sanitization
- If user names contain `<script>` tags, could execute

**Solution:**

```bash
npm install dompurify
```

```javascript
// utils/sanitize.js
import DOMPurify from 'dompurify';

export const sanitizeHTML = (dirty) => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
};

// Usage in components
import { sanitizeHTML } from '../utils/sanitize';

<p>{sanitizeHTML(user?.displayName)}</p>
```

**Priority:** 🟡 HIGH

---

### 4. No Rate Limiting

**Problem:**
- No protection against brute force
- No API request throttling
- Can spam reward claims

**Solution: Implement Firebase App Check**

```bash
npm install firebase-app-check
```

```javascript
// firebase/config.js
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

// Initialize App Check
if (process.env.NODE_ENV === 'production') {
  const appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider('YOUR_RECAPTCHA_SITE_KEY'),
    isTokenAutoRefreshEnabled: true
  });
}
```

Steps:
1. Enable App Check in Firebase Console
2. Register your app
3. Get reCAPTCHA v3 site key from Google
4. Add to environment variables:
   ```
   VITE_RECAPTCHA_SITE_KEY=your_key_here
   ```

**Priority:** 🟡 MEDIUM

---

### 5. Missing Input Validation

**Problem:**
```javascript
// Dashboard.jsx - Line 378
<textarea
  value={reportDetails}
  onChange={(e) => setReportDetails(e.target.value)}
/>
```

No validation on:
- Report details length
- Dustbin code format
- User input sanitization

**Solution:**

```javascript
// utils/validation.js
export const validateDustbinCode = (code) => {
  // Format: 3 letters + numbers (e.g., DOM123, SBX456)
  const regex = /^[A-Z]{3}\d+$/;
  return regex.test(code) && code.length <= 20;
};

export const validateReportDetails = (details) => {
  return details.length >= 10 && details.length <= 1000;
};

// Usage
if (!validateDustbinCode(dustbinCode)) {
  setError('Invalid dustbin code format');
  return;
}
```

**Priority:** 🟡 MEDIUM

---

## 🟢 FIXED / LOW Priority

### 6. Hardcoded Credentials ✅ FIXED

- ✅ Moved to `.env` file
- ✅ Added to `.gitignore`
- ✅ Created `.env.example` template
- ✅ Updated Firebase config to use environment variables

### 7. Firebase Security Rules ✅ ADDED

- ✅ Created `firestore.rules`
- ✅ Created `storage.rules`
- ✅ Ready to deploy

### 8. Security Headers ✅ IMPROVED

- ✅ Added Content-Security-Policy
- ✅ Added Strict-Transport-Security
- ✅ Added Permissions-Policy
- ✅ Existing X-Frame-Options, X-XSS-Protection

---

## Additional Recommendations

### 9. Implement Logging & Monitoring

```javascript
// utils/logger.js
export const logSecurityEvent = async (event, details) => {
  // Log to Firestore for audit trail
  await addDoc(collection(db, 'security_logs'), {
    event,
    details,
    userId: auth.currentUser?.uid,
    timestamp: serverTimestamp(),
    userAgent: navigator.userAgent,
    ip: await fetchUserIP() // Use a service
  });
};

// Usage
logSecurityEvent('suspicious_activity', {
  action: 'multiple_failed_attempts',
  count: 5
});
```

### 10. Add Email Verification Requirement

```javascript
// context/AuthContext.jsx
const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    
    // Check email verification
    if (!result.user.emailVerified) {
      // For Google sign-in, usually already verified
      // But add this check for other auth methods
    }
    
    return result.user;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
```

### 11. Implement Data Encryption for Sensitive Info

For future features storing sensitive data:

```javascript
// utils/crypto.js
import CryptoJS from 'crypto-js';

const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_KEY;

export const encrypt = (data) => {
  return CryptoJS.AES.encrypt(
    JSON.stringify(data),
    SECRET_KEY
  ).toString();
};

export const decrypt = (ciphertext) => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
};
```

### 12. Add CAPTCHA for Report Submissions

Prevent spam reports:

```javascript
// In report form
<ReCAPTCHA
  sitekey="YOUR_SITE_KEY"
  onChange={setCaptchaToken}
/>

// Verify on submit
if (!captchaToken) {
  alert('Please complete CAPTCHA');
  return;
}
```

---

## Implementation Priority

### Phase 1: IMMEDIATE (This Week)
1. ✅ Move credentials to `.env`
2. ✅ Deploy Firebase security rules
3. 🔴 Implement Cloud Function for reward claiming
4. 🔴 Move rewards to Firestore with server validation

### Phase 2: HIGH PRIORITY (Next 2 Weeks)
5. Implement input sanitization (DOMPurify)
6. Add input validation
7. Implement Firebase App Check
8. Add security logging

### Phase 3: MEDIUM PRIORITY (Next Month)
9. Implement rate limiting
10. Add email verification checks
11. Set up monitoring dashboard
12. Conduct security audit

### Phase 4: ONGOING
13. Regular security reviews
14. Dependency updates
15. Penetration testing
16. User education

---

## Testing Your Security

### Manual Testing Checklist

- [ ] Try to manipulate localStorage rewards
- [ ] Try to bypass location checks
- [ ] Try to exceed daily limits
- [ ] Try XSS payloads in inputs
- [ ] Try invalid dustbin codes
- [ ] Try to access other users' data
- [ ] Try to upload large files
- [ ] Try to upload non-image files

### Automated Testing

```bash
# Security audit
npm audit

# Fix vulnerabilities
npm audit fix

# Check for outdated packages
npm outdated

# Update packages
npm update
```

---

## Cost Implications

### Firebase Costs

Implementing backend validation will increase Firebase usage:

**Current (Free Tier):**
- Auth: Unlimited
- Firestore: 50k reads/20k writes per day
- Functions: 125k invocations per month
- Storage: 5GB

**Estimated After Implementation:**
- Firestore: ~100 writes per user per day
- Functions: ~100 invocations per user per day
- Should stay within free tier for < 100 daily active users

**Paid Plan ($25/month):**
- Recommended for production
- Better monitoring
- Support
- Higher limits

---

## Compliance Considerations

### GDPR (EU Users)

```javascript
// Implement data export
exports.exportUserData = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new Error('Unauthorized');
  
  const userId = context.auth.uid;
  
  // Collect all user data
  const userData = await admin.firestore()
    .collection('users')
    .doc(userId)
    .get();
  
  const rewards = await admin.firestore()
    .collection('rewards')
    .doc(userId)
    .get();
  
  const transactions = await admin.firestore()
    .collection('transactions')
    .where('userId', '==', userId)
    .get();
  
  return {
    profile: userData.data(),
    rewards: rewards.data(),
    transactions: transactions.docs.map(doc => doc.data())
  };
});

// Implement data deletion
exports.deleteUserData = functions.https.onCall(async (data, context) => {
  // Implement user data deletion
  // This is a compliance requirement
});
```

---

## Security Contacts

For security issues:
- **Email**: security@your-domain.com
- **Response Time**: < 24 hours
- **Disclosure**: Responsible disclosure policy

---

## Summary

### What We Fixed Today ✅
1. Moved Firebase credentials to environment variables
2. Created comprehensive Firestore security rules
3. Created comprehensive Storage security rules
4. Enhanced security headers in Vercel config
5. Created deployment guides

### What Needs Immediate Action 🔴
1. Implement Cloud Functions for reward validation
2. Move rewards from localStorage to Firestore
3. Add server-side location validation
4. Implement proper transaction logging

### Long-term Improvements 🟡
1. Add App Check for rate limiting
2. Implement input sanitization
3. Add monitoring and alerting
4. Regular security audits

**Your app has basic security (authentication), but needs backend validation to be production-ready and prevent fraud.**

