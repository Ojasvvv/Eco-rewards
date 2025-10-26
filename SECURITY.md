# Security Documentation

## Environment Variables Setup

### Local Development

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Firebase credentials in `.env`

3. **IMPORTANT**: Never commit `.env` to version control. It's already in `.gitignore`.

### Vercel Deployment

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

   ```
   VITE_FIREBASE_API_KEY = your_api_key
   VITE_FIREBASE_AUTH_DOMAIN = your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID = your_project_id
   VITE_FIREBASE_STORAGE_BUCKET = your_project_id.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID = your_sender_id
   VITE_FIREBASE_APP_ID = your_app_id
   ```

4. Make sure to select which environments (Production, Preview, Development) each variable should be available in.

5. Redeploy your application after adding environment variables.

## Firebase Security Rules

### Firestore Rules

Deploy the Firestore security rules using:

```bash
firebase deploy --only firestore:rules
```

The rules are defined in `firestore.rules` and include:
- User authentication checks
- Data ownership validation
- Input validation
- Rate limiting considerations
- Prevention of data deletion where appropriate

### Storage Rules

Deploy the Storage security rules using:

```bash
firebase deploy --only storage
```

The rules are defined in `storage.rules` and include:
- File type validation
- File size limits (5MB max for images)
- User ownership checks
- Access control for public assets

### Setting up Firebase CLI

If you haven't already:

```bash
npm install -g firebase-tools
firebase login
firebase init
```

## Current Security Issues & Recommendations

### 🔴 CRITICAL ISSUES

1. **Client-Side Reward Manipulation**
   - **Issue**: Rewards are stored in `localStorage` and can be easily manipulated by users
   - **Risk**: Users can grant themselves unlimited points
   - **Fix**: Implement a backend (Firebase Cloud Functions) to store and validate rewards in Firestore
   - **Priority**: HIGH

2. **No Server-Side Validation**
   - **Issue**: All dustbin code validation happens client-side
   - **Risk**: Users can bypass location checks and earn rewards without physical presence
   - **Fix**: Implement Cloud Functions to validate:
     - Dustbin codes against a database
     - User location proximity
     - Daily usage limits
     - Transaction authenticity
   - **Priority**: HIGH

3. **Firebase API Key Exposure** (NOW FIXED)
   - ✅ Moved to environment variables
   - ℹ️ Note: Firebase API keys are designed to be public, but should still use domain restrictions

### 🟡 MODERATE ISSUES

4. **No Rate Limiting**
   - **Issue**: No server-side rate limiting on rewards claiming
   - **Risk**: Automated scripts could abuse the system
   - **Fix**: Implement Cloud Functions with rate limiting (Firebase App Check)
   - **Priority**: MEDIUM

5. **XSS Prevention**
   - **Issue**: User input (report details, names) not sanitized
   - **Risk**: Potential XSS attacks if displaying user-generated content
   - **Fix**: Implement DOMPurify or similar sanitization
   - **Priority**: MEDIUM

6. **No CSRF Protection**
   - **Issue**: No CSRF tokens for state-changing operations
   - **Risk**: Cross-site request forgery
   - **Fix**: Firebase Auth tokens provide some protection, but implement additional checks
   - **Priority**: MEDIUM

7. **Session Management**
   - **Issue**: Using localStorage for sensitive data
   - **Risk**: Vulnerable to XSS attacks
   - **Fix**: Use httpOnly cookies where possible, or Firebase Auth's built-in session management
   - **Priority**: MEDIUM

### 🟢 MINOR ISSUES

8. **Error Messages**
   - **Issue**: Some error messages may expose system information
   - **Fix**: Use generic error messages for production
   - **Priority**: LOW

9. **Console Logs**
   - **Issue**: Sensitive information might be logged to console
   - **Fix**: Remove console.logs in production build
   - **Priority**: LOW

## Recommended Architecture Changes

### Implement Backend with Cloud Functions

```javascript
// Example Cloud Function for reward claiming
exports.claimReward = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const userId = context.auth.uid;
  const { dustbinCode, location } = data;
  
  // Validate dustbin code
  const dustbin = await admin.firestore()
    .collection('dustbins')
    .doc(dustbinCode)
    .get();
    
  if (!dustbin.exists) {
    throw new functions.https.HttpsError('not-found', 'Invalid dustbin code');
  }
  
  // Validate location proximity
  const distance = calculateDistance(location, dustbin.data().location);
  if (distance > 0.1) { // 100 meters
    throw new functions.https.HttpsError('permission-denied', 'Too far from dustbin');
  }
  
  // Check daily limit
  const today = new Date().toDateString();
  const usageSnapshot = await admin.firestore()
    .collection('usage')
    .where('userId', '==', userId)
    .where('date', '==', today)
    .get();
    
  if (usageSnapshot.size >= 5) {
    throw new functions.https.HttpsError('resource-exhausted', 'Daily limit reached');
  }
  
  // Award points using a transaction
  return admin.firestore().runTransaction(async (transaction) => {
    const userRewardsRef = admin.firestore().collection('rewards').doc(userId);
    const userRewards = await transaction.get(userRewardsRef);
    
    const currentPoints = userRewards.exists ? userRewards.data().points : 0;
    const newPoints = currentPoints + 10;
    
    transaction.set(userRewardsRef, { points: newPoints }, { merge: true });
    
    // Log transaction
    transaction.set(admin.firestore().collection('transactions').doc(), {
      userId,
      dustbinCode,
      points: 10,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      location
    });
    
    return { points: newPoints };
  });
});
```

### Implement Firebase App Check

Add App Check to prevent abuse:

1. Enable App Check in Firebase Console
2. Register your app with reCAPTCHA v3 (web)
3. Add App Check initialization:

```javascript
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('YOUR_RECAPTCHA_SITE_KEY'),
  isTokenAutoRefreshEnabled: true
});
```

### Implement Input Sanitization

```bash
npm install dompurify
```

```javascript
import DOMPurify from 'dompurify';

const sanitizedInput = DOMPurify.sanitize(userInput);
```

## Security Headers

Enhanced security headers have been added to `vercel.json`:

- ✅ Content Security Policy (CSP)
- ✅ Strict Transport Security (HSTS)
- ✅ X-Frame-Options
- ✅ X-Content-Type-Options
- ✅ Referrer-Policy
- ✅ Permissions-Policy

## Firebase Security Best Practices

1. **Enable Firebase App Check** - Protects backend resources from abuse
2. **Use Security Rules** - Already implemented in `firestore.rules` and `storage.rules`
3. **Implement Cloud Functions** - Move sensitive logic server-side
4. **Enable Audit Logging** - Track access to sensitive data
5. **Regular Security Reviews** - Review and update security rules regularly
6. **Domain Restrictions** - Add authorized domains in Firebase Console
7. **API Key Restrictions** - Restrict API keys to specific domains in Google Cloud Console

## Monitoring & Alerts

Set up monitoring:

1. Firebase Console → Analytics → Events
2. Set up alerts for suspicious activity:
   - Unusual number of reward claims
   - Failed authentication attempts
   - Error rates

## Compliance Considerations

- **GDPR**: Implement user data export/deletion capabilities
- **CCPA**: Provide privacy policy and opt-out mechanisms
- **Data Retention**: Implement data retention policies
- **Privacy Policy**: Create and link privacy policy
- **Terms of Service**: Create and require acceptance

## Regular Security Tasks

- [ ] Review Firebase security rules monthly
- [ ] Update dependencies regularly (npm audit)
- [ ] Monitor Firebase usage for anomalies
- [ ] Review access logs
- [ ] Update security headers as needed
- [ ] Conduct penetration testing
- [ ] Review and rotate API keys if exposed

## Contact

For security issues, please email: [your-security-email@domain.com]

**DO NOT** create public GitHub issues for security vulnerabilities.

