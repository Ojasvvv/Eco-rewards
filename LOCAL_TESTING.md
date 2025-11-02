# Local Testing Guide

## Option 1: Test with Vercel CLI (Recommended)

This runs your API functions locally, so you can test the CORS fixes without deploying!

### Setup:

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel** (if not already logged in):
   ```bash
   vercel login
   ```

3. **Link your project** (if not already linked):
   ```bash
   vercel link
   ```

4. **Start Vercel dev server** in a separate terminal:
   ```bash
   npm run dev:api
   # or: npx vercel dev
   ```
   This will start the API functions on `http://localhost:3000` by default

5. **Update Vite proxy** to point to local Vercel dev:
   - Set environment variable: `VERCEL_DEV_URL=http://localhost:3000`
   - Or modify `vite.config.js` to use `http://localhost:3000` directly

6. **Start your Vite dev server**:
   ```bash
   npm run dev
   ```

Now requests to `/api/*` from your Vite dev server will be proxied to the local Vercel dev server!

### Benefits:
- ✅ Test API changes locally without deploying
- ✅ No CORS issues (same origin via proxy)
- ✅ Faster iteration cycle

---

## Option 2: Test with Proxy to Deployed Vercel

If you don't want to run Vercel CLI, you can test against the deployed version:

1. **Make sure your changes are deployed to Vercel**
   - Push your code and wait for deployment

2. **Start Vite dev server**:
   ```bash
   npm run dev
   ```

3. **The proxy will automatically forward `/api/*` requests to Vercel**

### Note:
- Requires deployment first (takes ~2-3 minutes)
- Uses your actual Vercel deployment
- CORS should work once fixes are deployed

---

## Debugging Proxy Issues

If you see 405 or proxy errors:

1. **Enable proxy debugging**:
   ```bash
   DEBUG_PROXY=1 npm run dev
   ```

2. **Check if Vercel dev is running**:
   ```bash
   curl http://localhost:3000/api/health
   ```

3. **Check if proxy target is correct**:
   - Check `vite.config.js` proxy target
   - Check `VERCEL_DEV_URL` environment variable

---

## Quick Test

After setup, test the email endpoint:
1. Open your app in browser (`http://localhost:5173`)
2. Press `Ctrl+Shift+E` (or `Cmd+Shift+E` on Mac)
3. Check browser console for errors
4. Check the toast notification

