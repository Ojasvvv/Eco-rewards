# 🚀 Deployment Guide

Complete guide to deploy your EcoRewards app to production.

## 📋 Pre-Deployment Checklist

- [ ] Firebase project created
- [ ] Google Auth enabled
- [ ] Firebase config added to code
- [ ] App tested locally
- [ ] Build runs without errors
- [ ] Mobile responsiveness verified

---

## Option 1: Firebase Hosting (Recommended)

### Why Firebase Hosting?
- ✅ Free tier available
- ✅ Automatic SSL certificate
- ✅ Global CDN
- ✅ Integrates with Firebase Auth
- ✅ Easy rollbacks
- ✅ Custom domain support

### Step-by-Step Deployment

#### 1. Install Firebase CLI

```bash
npm install -g firebase-tools
```

#### 2. Login to Firebase

```bash
firebase login
```

This opens a browser for authentication.

#### 3. Initialize Firebase in Your Project

```bash
firebase init hosting
```

**Configuration:**
- "Which Firebase project?": Select your project
- "What directory?": Enter `dist`
- "Configure as single-page app?": `Yes`
- "Set up automatic builds?": `No` (for now)
- "Overwrite index.html?": `No`

#### 4. Build Your App

```bash
npm run build
```

This creates the `dist` folder with optimized production files.

#### 5. Test Locally (Optional)

```bash
firebase serve
```

Preview at `http://localhost:5000`

#### 6. Deploy!

```bash
firebase deploy
```

Your app is now live at:
- `https://YOUR_PROJECT_ID.web.app`
- `https://YOUR_PROJECT_ID.firebaseapp.com`

#### 7. Update Authorized Domains

In Firebase Console:
1. Go to **Authentication** → **Settings**
2. Scroll to **Authorized domains**
3. Your hosting domain should be auto-added
4. If not, add it manually

### Custom Domain Setup

1. **In Firebase Console:**
   - Go to **Hosting**
   - Click **Add custom domain**
   - Enter your domain (e.g., `ecorewards.com`)
   - Follow verification steps

2. **Add DNS Records:**
   - Type: `A`
   - Name: `@`
   - Value: [Firebase IP addresses shown]
   
   Or for subdomain:
   - Type: `CNAME`
   - Name: `www`
   - Value: `YOUR_PROJECT.web.app`

3. **Wait for SSL:**
   - Firebase provisions SSL automatically
   - Can take up to 24 hours

### Update Future Versions

```bash
npm run build
firebase deploy
```

### Rollback if Needed

```bash
firebase hosting:rollback
```

---

## Option 2: Vercel

### Quick Deploy

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   npm run build
   vercel --prod
   ```

4. **Configure Environment**
   - Vercel will auto-detect Vite
   - Build command: `npm run build`
   - Output directory: `dist`

5. **Update Firebase Authorized Domains**
   - Add your Vercel domain to Firebase Console

### GitHub Integration

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your GitHub repository
4. Configure build settings
5. Deploy automatically on every push

---

## Option 3: Netlify

### Drag & Drop Deploy

1. Build locally:
   ```bash
   npm run build
   ```

2. Go to [app.netlify.com/drop](https://app.netlify.com/drop)

3. Drag the `dist` folder to the browser

4. Your site is live instantly!

### CLI Deploy

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
npm run build
netlify deploy --prod
```

### Configure Redirects

Create `public/_redirects`:
```
/*    /index.html   200
```

This ensures React Router works properly.

---

## Option 4: GitHub Pages

### Setup

1. Install gh-pages:
   ```bash
   npm install --save-dev gh-pages
   ```

2. Update `package.json`:
   ```json
   {
     "homepage": "https://yourusername.github.io/ecorewards",
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     }
   }
   ```

3. Update `vite.config.js`:
   ```javascript
   export default defineConfig({
     base: '/ecorewards/',
     // ... rest of config
   })
   ```

4. Deploy:
   ```bash
   npm run deploy
   ```

5. Enable GitHub Pages:
   - Go to repo Settings
   - Pages section
   - Source: `gh-pages` branch

**Note:** Update Firebase authorized domains to include your GitHub Pages URL.

---

## 🌐 Domain & DNS Setup

### Purchase Domain
- Namecheap, GoDaddy, Google Domains, etc.
- Recommended: `.com`, `.app`, or `.eco` for your brand

### Configure DNS

**For Firebase Hosting:**
```
Type  Name  Value
A     @     [Firebase IP 1]
A     @     [Firebase IP 2]
TXT   @     [Verification code]
```

**For Vercel/Netlify:**
```
Type   Name  Value
CNAME  www   [your-app].vercel.app
CNAME  @     [your-app].vercel.app
```

### SSL Certificate
- All platforms provide free SSL
- Auto-renews
- Usually activates within hours

---

## 📱 Mobile Testing

### Before Launch
Test on real devices:

**iOS:**
- Safari (primary)
- Chrome
- Different screen sizes (iPhone SE, 12, 14 Pro Max)

**Android:**
- Chrome (primary)
- Samsung Internet
- Different screen sizes

### Tools
- Chrome DevTools (mobile emulation)
- BrowserStack (device testing)
- Real devices from friends/team

### Check
- [ ] Google sign-in works
- [ ] Buttons are tap-friendly
- [ ] Text is readable
- [ ] Forms work smoothly
- [ ] Loading states show
- [ ] Landscape mode works
- [ ] QR scanning (future feature)

---

## 🔒 Security Checklist

### Firebase
- [ ] Production mode enabled
- [ ] API key restrictions set
- [ ] Firestore rules configured (when added)
- [ ] Only production domains authorized

### Code
- [ ] No API keys in code (use env variables)
- [ ] HTTPS enforced
- [ ] CORS configured properly
- [ ] Rate limiting (backend)

---

## ⚙️ Environment Variables

For sensitive config, use environment variables:

### Create `.env` file:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
```

### Update `config.js`:
```javascript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  // ... etc
};
```

### Add to Hosting Platform:
- Vercel: Environment Variables in dashboard
- Netlify: Site settings → Environment
- Firebase: Use Firebase Remote Config

---

## 📊 Analytics Setup

### Google Analytics

1. **Add to Firebase:**
   - Firebase Console → Analytics
   - Enable Google Analytics

2. **Update code:**
   ```bash
   npm install firebase/analytics
   ```

3. **In config.js:**
   ```javascript
   import { getAnalytics } from 'firebase/analytics';
   export const analytics = getAnalytics(app);
   ```

### Track Events

```javascript
import { logEvent } from 'firebase/analytics';

// Track code submission
logEvent(analytics, 'code_submitted', {
  dustbin_code: code
});

// Track sign-in
logEvent(analytics, 'login', {
  method: 'google'
});
```

---

## 🚨 Monitoring

### Firebase Crashlytics (Future)
Track app crashes and errors

### Uptime Monitoring
- UptimeRobot (free)
- Pingdom
- Built-in hosting metrics

---

## 🎯 Performance Optimization

### Before Deploy

1. **Optimize Images** (future assets)
   - Use WebP format
   - Compress images
   - Lazy load

2. **Code Splitting**
   - Already done by Vite
   - Lazy load routes if needed

3. **Minification**
   - Automatic in production build
   - CSS and JS minified

4. **Compression**
   - Enable Gzip/Brotli
   - Hosting platforms do this

### After Deploy

1. **Test with Lighthouse**
   - Open DevTools
   - Lighthouse tab
   - Run audit
   - Aim for 90+ scores

2. **Check Loading Speed**
   - PageSpeed Insights
   - GTmetrix
   - WebPageTest

---

## 📝 Post-Deployment

### Update README
- Add live demo link
- Update deployment status

### Share
- Show to potential users
- Get feedback
- Iterate

### Monitor
- Check analytics
- Watch for errors
- Listen to user feedback

---

## 🔄 CI/CD (Advanced)

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: your-project-id
```

Now every push to `main` auto-deploys!

---

## 💰 Cost Estimate

### Free Tier (Perfect for MVP)

**Firebase:**
- Hosting: 10GB storage, 360MB/day transfer
- Auth: Unlimited
- Estimate: $0/month for < 10k users

**Scaling Up:**
- 100k users: ~$25-50/month
- 1M users: ~$200-500/month
- Mostly from hosting bandwidth

---

## 🆘 Troubleshooting

### Build Fails
```bash
# Clear cache
rm -rf node_modules dist
npm install
npm run build
```

### Auth Not Working After Deploy
- Check Firebase authorized domains
- Verify config is correct
- Check browser console

### 404 Errors on Refresh
- Ensure single-page app rewrite rule
- Check `firebase.json` configuration

### Slow Loading
- Check bundle size
- Enable compression
- Use CDN
- Optimize images

---

## ✅ Launch Checklist

- [ ] Build runs without errors
- [ ] Firebase config is production
- [ ] Authorized domains updated
- [ ] Tested on mobile devices
- [ ] Tested sign-in flow
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active
- [ ] Analytics setup (optional)
- [ ] Error monitoring (optional)
- [ ] Team has tested
- [ ] Performance scores > 90
- [ ] README updated with live link

---

You're ready to launch! 🎉

Good luck with your hackathon! 🚀

