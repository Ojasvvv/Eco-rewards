# Vercel Deployment Guide with Environment Variables

## Step-by-Step Setup

### 1. Install Vercel CLI (Optional)

```bash
npm install -g vercel
```

### 2. Deploy via Vercel Dashboard (Recommended)

1. **Go to [Vercel](https://vercel.com/) and sign in**

2. **Import your Git repository**
   - Click "Add New Project"
   - Select your Git provider (GitHub, GitLab, Bitbucket)
   - Import your repository

3. **Configure Environment Variables**
   
   Before deploying, click on "Environment Variables" and add:

   | Name | Value | Environment |
   |------|-------|-------------|
   | `VITE_FIREBASE_API_KEY` | `AIzaSyATxxJDPufZV5lD2nw8xyhSIuSWq0w5uzU` | Production, Preview, Development |
   | `VITE_FIREBASE_AUTH_DOMAIN` | `hackathon-f19c9.firebaseapp.com` | Production, Preview, Development |
   | `VITE_FIREBASE_PROJECT_ID` | `hackathon-f19c9` | Production, Preview, Development |
   | `VITE_FIREBASE_STORAGE_BUCKET` | `hackathon-f19c9.firebasestorage.app` | Production, Preview, Development |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | `999485546225` | Production, Preview, Development |
   | `VITE_FIREBASE_APP_ID` | `1:999485546225:web:e65c34dd9eed0b4b6ad350` | Production, Preview, Development |

   **Screenshot Guide:**
   - Settings → Environment Variables → Add New
   - Enter name: `VITE_FIREBASE_API_KEY`
   - Enter value: Your API key
   - Select environments (check all three)
   - Click "Add"
   - Repeat for all variables

4. **Configure Build Settings**
   
   Vercel should auto-detect these, but verify:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live!

### 3. Deploy via Vercel CLI (Alternative)

```bash
# Login to Vercel
vercel login

# Navigate to your project
cd path/to/your/project

# Deploy
vercel

# For production
vercel --prod
```

When prompted, add environment variables:

```bash
? Set up and deploy "~/your-project"? [Y/n] y
? Which scope do you want to deploy to? Your Account
? Link to existing project? [y/N] n
? What's your project's name? ecorewards
? In which directory is your code located? ./
? Want to override the settings? [y/N] n
```

After first deployment, add environment variables:

```bash
vercel env add VITE_FIREBASE_API_KEY
# Enter the value when prompted
# Select environments: Production, Preview, Development

# Repeat for all variables
vercel env add VITE_FIREBASE_AUTH_DOMAIN
vercel env add VITE_FIREBASE_PROJECT_ID
vercel env add VITE_FIREBASE_STORAGE_BUCKET
vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID
vercel env add VITE_FIREBASE_APP_ID
```

Then redeploy:

```bash
vercel --prod
```

## Adding Environment Variables Later

### Via Dashboard

1. Go to your project dashboard on Vercel
2. Click **Settings**
3. Click **Environment Variables**
4. Click **Add New**
5. Enter variable name and value
6. Select which environments
7. Click **Save**
8. **Important**: Redeploy your application for changes to take effect

### Via CLI

```bash
# Add a new variable
vercel env add VARIABLE_NAME

# Remove a variable
vercel env rm VARIABLE_NAME

# List all variables
vercel env ls

# Pull environment variables locally
vercel env pull .env.local
```

## Updating Environment Variables

1. Go to Settings → Environment Variables
2. Find the variable you want to update
3. Click the three dots (•••) next to it
4. Click "Edit"
5. Update the value
6. Click "Save"
7. **Redeploy** your application

## Security Best Practices on Vercel

### 1. Use Different Firebase Projects for Different Environments

Consider using separate Firebase projects for:
- **Development**: `your-app-dev`
- **Staging/Preview**: `your-app-staging`
- **Production**: `your-app-prod`

Set environment variables accordingly:
- Development environment → Dev Firebase credentials
- Preview environment → Staging Firebase credentials
- Production environment → Production Firebase credentials

### 2. Restrict Environment Variable Access

- Only add variables to the environments that need them
- Use "Production" only for production secrets
- Use "Preview" for staging/testing
- Use "Development" for local development overrides

### 3. Enable Vercel Protect (Optional)

For preview deployments:
1. Go to Settings → Deployment Protection
2. Enable "Vercel Authentication"
3. Protect preview deployments with login

### 4. Configure Allowed Domains in Firebase

After deployment:

1. Go to Firebase Console
2. Navigate to **Authentication** → **Settings** → **Authorized domains**
3. Add your Vercel domain(s):
   ```
   your-app.vercel.app
   your-custom-domain.com
   ```

### 5. Set up Google Cloud API Restrictions

For better security:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Navigate to **APIs & Services** → **Credentials**
4. Find your API key (Browser key)
5. Click "Edit"
6. Under "Application restrictions":
   - Select "HTTP referrers (web sites)"
   - Add your domains:
     ```
     https://your-app.vercel.app/*
     https://your-custom-domain.com/*
     http://localhost:3000/* (for development)
     ```
7. Click "Save"

## Troubleshooting

### Environment Variables Not Working

**Problem**: App shows "Missing required environment variables"

**Solutions**:

1. **Check Variable Names**: Ensure they start with `VITE_`
   - ✅ `VITE_FIREBASE_API_KEY`
   - ❌ `FIREBASE_API_KEY`

2. **Check Environments**: Ensure variables are added to the right environment

3. **Redeploy**: Changes to environment variables require redeployment
   ```bash
   vercel --prod --force
   ```

4. **Clear Build Cache**: 
   - Settings → General → Clear Build Cache
   - Redeploy

### Build Fails

**Problem**: Build fails on Vercel but works locally

**Solutions**:

1. Check build logs in Vercel dashboard
2. Ensure all dependencies are in `package.json`
3. Check that build command is correct: `npm run build`
4. Verify Node version compatibility

### Firebase Connection Fails

**Problem**: App deployed but Firebase doesn't work

**Solutions**:

1. **Check Firebase Console**:
   - Verify project is active
   - Check billing (if using paid features)

2. **Verify Authorized Domains**:
   - Firebase Console → Authentication → Settings → Authorized domains
   - Add Vercel domain

3. **Check Browser Console**:
   - Look for CORS errors
   - Look for Firebase configuration errors

## Monitoring & Maintenance

### View Logs

```bash
# View deployment logs
vercel logs your-deployment-url

# View runtime logs
vercel logs your-deployment-url --follow
```

### Redeploy

```bash
# Redeploy to production
vercel --prod

# Force rebuild
vercel --prod --force
```

### Rollback

If something goes wrong:

1. Go to Vercel dashboard
2. Click "Deployments"
3. Find a previous working deployment
4. Click three dots (•••)
5. Click "Promote to Production"

## Custom Domain Setup (Optional)

1. Go to your project settings
2. Click "Domains"
3. Enter your custom domain
4. Follow DNS configuration instructions
5. Wait for DNS propagation (up to 48 hours)

## Automatic Deployments

Vercel automatically deploys when you:
- Push to `main` branch (Production)
- Push to any branch (Preview)
- Open a pull request (Preview)

Configure in: Settings → Git

## Environment-Specific Builds

If you need different behavior per environment:

```javascript
// Example in your code
const isProd = import.meta.env.PROD;
const isDev = import.meta.env.DEV;
const mode = import.meta.env.MODE; // 'production' or 'development'

if (isProd) {
  // Production-only code
} else {
  // Development-only code
}
```

## Next Steps

1. ✅ Deploy to Vercel
2. ✅ Add environment variables
3. ✅ Configure Firebase authorized domains
4. ✅ Set up Google Cloud API restrictions
5. ⬜ Set up custom domain (optional)
6. ⬜ Enable Vercel Analytics
7. ⬜ Configure CDN caching
8. ⬜ Set up monitoring/alerts

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Firebase Documentation](https://firebase.google.com/docs)

## Quick Reference

### Essential Vercel Commands

```bash
vercel                    # Deploy to preview
vercel --prod            # Deploy to production
vercel env add           # Add environment variable
vercel env ls            # List environment variables
vercel logs              # View logs
vercel domains           # Manage domains
vercel --help            # Show all commands
```

### Environment Variable Format

All Vite env vars must start with `VITE_`:

```
VITE_YOUR_VAR_NAME=value
```

Access in code:
```javascript
const value = import.meta.env.VITE_YOUR_VAR_NAME;
```

