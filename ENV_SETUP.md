# Environment Variables Setup Guide

## 🔴 CRITICAL: Must Configure in Vercel

Your API endpoints now require the `ALLOWED_ORIGINS` environment variable to be set. Without it, **all API requests will fail** due to CORS restrictions.

## Required Environment Variables

### 1. ALLOWED_ORIGINS (CRITICAL - NEW!)

**Purpose:** Controls which domains can make API requests to your backend

**Format:** Comma-separated list of URLs (no spaces after commas recommended, but supported)

**Examples:**

For production only:
```bash
ALLOWED_ORIGINS=https://eco-rewards-wheat.vercel.app
```

For multiple domains:
```bash
ALLOWED_ORIGINS=https://eco-rewards-wheat.vercel.app,https://your-custom-domain.com
```

For development + production:
```bash
ALLOWED_ORIGINS=https://eco-rewards-wheat.vercel.app,http://localhost:5173,http://localhost:3000
```

**⚠️ Important Notes:**
- No fallback/default values anymore (for security)
- If not set, API requests will fail with CORS errors
- Each URL should include the protocol (http:// or https://)
- No trailing slashes

---

### 2. Firebase Admin SDK (Backend)

**Required for API endpoints:**

```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"
```

**Where to get these:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Settings (⚙️) → Project Settings
4. Service Accounts tab
5. Click "Generate New Private Key"
6. Download JSON file
7. Copy values from JSON to Vercel

---

### 3. Firebase Client SDK (Frontend)

**Required for Vite frontend:**

```bash
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:xxxxxxxxxxxx
```

**Where to get these:**
1. Firebase Console → Project Settings
2. General tab
3. Scroll to "Your apps" section
4. Copy the config values

---

### 4. Optional: Rate Limiting

```bash
USE_FIRESTORE_RATE_LIMIT=true
```

**Purpose:** Switches from in-memory to Firestore-based rate limiting

**Default:** If not set, uses in-memory rate limiting (resets on cold starts)

---

## How to Set in Vercel

### Via Vercel Dashboard:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable:
   - **Key**: Variable name (e.g., `ALLOWED_ORIGINS`)
   - **Value**: Variable value (e.g., `https://eco-rewards-wheat.vercel.app`)
   - **Environments**: Select all (Production, Preview, Development)
5. Click **Save**
6. **Redeploy** your app for changes to take effect

### Via Vercel CLI:

```bash
# Add a variable
vercel env add ALLOWED_ORIGINS

# When prompted, enter the value
# Select environments: Production, Preview, Development

# Redeploy
vercel --prod
```

---

## Local Development (.env file)

Create a `.env` file in your project root:

```bash
# CORS Configuration
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Key-Here\n-----END PRIVATE KEY-----\n"

# Firebase Client SDK (Vite)
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:xxxxxxxxxxxx

# Optional
USE_FIRESTORE_RATE_LIMIT=false
```

**⚠️ Security:**
- Never commit `.env` to Git
- `.env` should be in `.gitignore`
- Use `.env.example` for team reference (with placeholder values)

---

## Verification Checklist

After setting environment variables:

### 1. Check Vercel Dashboard
- [ ] All required variables are set
- [ ] Variables are set for all environments (Production, Preview, Development)
- [ ] No typos in variable names

### 2. Redeploy
```bash
git push origin main
# or
vercel --prod
```

### 3. Test API Endpoints
Open browser console on your deployed site and check:

```javascript
// Should work without CORS errors
fetch('https://your-app.vercel.app/api/addRewardPoints', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TEST_TOKEN'
  },
  body: JSON.stringify({
    pointsToAdd: 10,
    reason: 'deposit',
    dustbinCode: 'TEST123',
    userLocation: { lat: 12.9716, lng: 77.5946 },
    depositData: {}
  })
})
.then(res => res.json())
.then(data => console.log('Success:', data))
.catch(err => console.error('Error:', err));
```

### 4. Common Issues

**CORS Error:**
```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```
**Solution:** Check `ALLOWED_ORIGINS` includes your frontend URL

**401 Unauthorized:**
```
{"error": "Unauthorized: Missing token"}
```
**Solution:** Firebase Admin SDK credentials not set correctly

**500 Internal Server Error:**
```
{"error": "Failed to add reward points"}
```
**Solution:** Check Vercel function logs for details

---

## Production Deployment Checklist

Before going live:

- [ ] Set `ALLOWED_ORIGINS` to production URL only
- [ ] All Firebase credentials configured
- [ ] Test all API endpoints work
- [ ] No CORS errors in browser console
- [ ] Firestore rules deployed
- [ ] Rate limiting tested
- [ ] Location logging verified in Firestore

---

## Security Best Practices

1. **Production ALLOWED_ORIGINS**: Only include your production domain
   ```bash
   ALLOWED_ORIGINS=https://eco-rewards-wheat.vercel.app
   ```

2. **Separate environments**: Use different Firebase projects for dev/prod

3. **Rotate keys**: If credentials are exposed, regenerate immediately

4. **Monitor logs**: Check Vercel function logs for suspicious activity

5. **Rate limiting**: Enable Firestore rate limiting for production
   ```bash
   USE_FIRESTORE_RATE_LIMIT=true
   ```

---

## Need Help?

**Vercel Environment Variables Docs:**
https://vercel.com/docs/concepts/projects/environment-variables

**Firebase Service Account Setup:**
https://firebase.google.com/docs/admin/setup

**Troubleshooting CORS:**
- Check browser console for exact error
- Verify origin matches exactly (including protocol and port)
- Check Vercel function logs

