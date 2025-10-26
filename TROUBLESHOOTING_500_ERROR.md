# Troubleshooting 500 Error on /api/addRewardPoints

## Problem
Your `/api/addRewardPoints` endpoint is returning a 500 Internal Server Error in production.

## Most Likely Causes

### 1. Missing Firebase Admin Environment Variables ⚠️ (MOST COMMON)

The API endpoint requires Firebase Admin SDK credentials to work. These must be set in Vercel.

**How to Fix:**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** → **Service Accounts**
4. Click **Generate New Private Key** (download the JSON file)
5. Go to [Vercel Dashboard](https://vercel.com/dashboard)
6. Select your project → **Settings** → **Environment Variables**
7. Add these three variables for **Production**:

```
FIREBASE_PROJECT_ID = "your-project-id"
FIREBASE_CLIENT_EMAIL = "firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
```

**Important Notes:**
- The `FIREBASE_PRIVATE_KEY` must include the `\n` characters (not actual line breaks)
- Wrap the private key in double quotes
- Get these values from the JSON file you downloaded from Firebase

### 2. Missing ALLOWED_ORIGINS Environment Variable

Your API uses CORS to only accept requests from specific origins.

**How to Fix:**

1. Go to Vercel Dashboard → Settings → Environment Variables
2. Add or update:

```
ALLOWED_ORIGINS = "https://eco-rewards-wheat.vercel.app,http://localhost:5173"
```

**Important:**
- Separate multiple origins with commas
- Include your production domain: `https://eco-rewards-wheat.vercel.app`
- Include localhost for testing: `http://localhost:5173`
- No trailing slashes

### 3. Firebase Admin SDK Not Initialized

If the credentials are wrong, Firebase Admin SDK will fail to initialize.

**How to Check:**

After deploying the changes I made, check Vercel logs:
1. Go to Vercel Dashboard → Deployments → Your latest deployment
2. Click **View Function Logs**
3. Look for error messages like:
   - `❌ Missing Firebase Admin environment variables`
   - `❌ Error adding reward points`
   - `Environment check: { hasProjectId: false, ... }`

## Step-by-Step Fix

### Step 1: Set Up Environment Variables

```bash
# In Vercel Dashboard, add these environment variables:

FIREBASE_PROJECT_ID = "your-firebase-project-id"
FIREBASE_CLIENT_EMAIL = "firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
ALLOWED_ORIGINS = "https://eco-rewards-wheat.vercel.app,http://localhost:5173"
```

### Step 2: Redeploy

After setting environment variables:
1. Go to Vercel Dashboard → Deployments
2. Find the latest deployment
3. Click **•••** → **Redeploy**
4. Select **Use existing Build Cache: No**

**Important:** Environment variable changes don't apply to existing deployments automatically!

### Step 3: Check Logs

After redeploying:
1. Try the action again (add reward points)
2. Go to Vercel Dashboard → View Function Logs
3. Look for the new detailed error messages we added

You should see something like:
```
Environment check: {
  hasProjectId: true,
  hasClientEmail: true,
  hasPrivateKey: true,
  hasAllowedOrigins: true,
  origin: 'https://eco-rewards-wheat.vercel.app'
}
```

All values should be `true`.

### Step 4: Test

Try to add reward points again from your app.

## Additional Debugging

### Check if Firebase Admin is initialized correctly

The endpoint logs this on startup:
```
❌ Missing Firebase Admin environment variables: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL
```

If you see this, environment variables are missing.

### Check CORS

If you see errors about CORS in the browser console, check:
1. `ALLOWED_ORIGINS` includes your exact frontend domain
2. No trailing slashes in the domain
3. The protocol matches (http vs https)

### Token Expiration

If you see "Authentication token expired":
1. Sign out from your app
2. Sign back in
3. Try again

Firebase auth tokens expire after 1 hour.

## Quick Checklist

- [ ] Firebase Admin environment variables set in Vercel
- [ ] ALLOWED_ORIGINS includes frontend domain
- [ ] Redeployed after setting environment variables
- [ ] Checked Vercel function logs for errors
- [ ] Tried signing out and back in

## Still Not Working?

Check the Vercel function logs for the detailed error. The new logging I added will show:
- Exact error message
- Error code
- Which environment variables are missing
- Request origin

Share the error details and I can help further!

## Testing Locally

To test locally with environment variables:

1. Create `.env` file (already in `.gitignore`):
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
ALLOWED_ORIGINS=http://localhost:5173
```

2. Run locally:
```bash
npm run dev
```

**Note:** Local testing requires setting up Vercel CLI or using a local Firebase emulator.

