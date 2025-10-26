# 🚀 Vercel Serverless Functions Setup Guide

## ✅ Files You Can DELETE Now

Delete these files/folders - you don't need them anymore:

```bash
# Delete entire functions folder
functions/

# Delete Firebase CLI config
.firebaserc

# Optional: Delete Firebase-specific files if not using Firebase Hosting
# (Keep firestore.rules - you still need it for Firestore security)
```

---

## 📦 What's NEW in Your Repo

Your repo now has:
```
your-repo/
├── api/                          ← NEW! Vercel serverless functions
│   ├── addRewardPoints.js
│   ├── redeemRewardPoints.js
│   └── updateUserStats.js
├── vercel.json                   ← NEW! Fixes routing + security headers
├── firestore.rules               ← Keep this (Firestore security)
├── firebase.json                 ← Updated (removed functions config)
├── package.json                  ← Updated (added firebase-admin)
└── src/                          ← Your app code
    └── services/
        └── rewardsService.js     ← Updated (uses Vercel API now)
```

---

## 🔐 Setup Vercel Environment Variables

You need to add Firebase Admin credentials to Vercel:

### Step 1: Get Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/project/hackathon-f19c9/settings/serviceaccounts/adminsdk)
2. Click **"Service accounts"** tab
3. Click **"Generate new private key"**
4. Save the JSON file (DON'T commit this to GitHub!)

### Step 2: Add Environment Variables to Vercel

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add these 3 variables:

| Variable Name | Value | Where to Find |
|--------------|-------|---------------|
| `FIREBASE_PROJECT_ID` | `hackathon-f19c9` | From the JSON file: `project_id` |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-xxxxx@hackathon-f19c9.iam.gserviceaccount.com` | From JSON: `client_email` |
| `FIREBASE_PRIVATE_KEY` | `-----BEGIN PRIVATE KEY-----\n...` | From JSON: `private_key` (keep the `\n` characters) |

**Important:** 
- For `FIREBASE_PRIVATE_KEY`, copy the ENTIRE value including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- Make sure to keep the `\n` characters - Vercel will handle them correctly

---

## 🚀 Deployment Steps

### 1. Delete Old Files
```bash
# Remove functions folder and Firebase CLI config
rm -rf functions/
rm .firebaserc
```

### 2. Commit and Push
```bash
git add .
git commit -m "Migrate to Vercel Serverless Functions for free deployment"
git push origin main
```

### 3. Wait for Vercel Auto-Deploy
Vercel will automatically:
- ✅ Deploy your frontend
- ✅ Deploy your API endpoints
- ✅ Fix the routing issue (vercel.json)
- ✅ Apply security headers

### 4. Test Everything
After deployment completes:
1. Go to `https://eco-rewards-wheat.vercel.app/dashboard` (should work now!)
2. Try earning points by depositing trash
3. Try redeeming a coupon

---

## 🔒 Security Features (Still Active!)

- ✅ **CORS Protection**: Only your Vercel domain can call API endpoints
- ✅ **Firestore Rules**: All write operations blocked from client
- ✅ **Server-Side Validation**: All points managed by Vercel API
- ✅ **Authentication Required**: Firebase token verification on every request
- ✅ **Transaction Logging**: Immutable audit trail
- ✅ **Input Validation**: Strict validation on all endpoints
- ✅ **Security Headers**: XSS, clickjacking, and other protections

---

## 🆓 Cost Breakdown

| Service | Plan | Cost |
|---------|------|------|
| Vercel Hosting | Hobby | **$0/month** |
| Vercel Serverless Functions | Included | **$0/month** (100GB-hrs free) |
| Firebase Firestore | Spark | **$0/month** (50K reads/day free) |
| Firebase Authentication | Spark | **$0/month** (unlimited) |
| **Total** | | **$0/month** ✅ |

---

## 🐛 Troubleshooting

### Issue: "Module not found: firebase-admin"
**Solution:** Run `npm install` locally, then push:
```bash
npm install
git add package-lock.json
git commit -m "Update dependencies"
git push
```

### Issue: API returns 401 Unauthorized
**Solution:** Check that your Vercel environment variables are set correctly, especially `FIREBASE_PRIVATE_KEY`.

### Issue: CORS errors
**Solution:** Make sure the `ALLOWED_ORIGINS` in your API files match your Vercel domain exactly.

---

## ✨ You're Done!

Your app is now:
- ✅ 100% free to run
- ✅ Production-ready with enterprise security
- ✅ Deployed on Vercel with serverless API
- ✅ Protected against client-side manipulation
- ✅ Scalable to thousands of users

No more Firebase Blaze plan needed! 🎉

