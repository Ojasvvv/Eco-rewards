# 🚀 Quick Email Setup (Resend - FREE)

## 3-Step Setup (Takes 2 minutes!)

### 1. Sign up for Resend
👉 Go to [resend.com](https://resend.com) and create a free account

### 2. Get API Key
- After login, go to **API Keys** → **Create API Key**
- Copy the key (starts with `re_...`)

### 3. Add to Vercel
Go to your Vercel project → **Settings** → **Environment Variables** → Add:

```
RESEND_API_KEY=re_your_api_key_here

CRON_SECRET=your-random-secret-here
```

**Generate CRON_SECRET:** Run `openssl rand -hex 32` or use any random string

**Then redeploy** (or push a commit)

### Done! 🎉
Press `Ctrl+Shift+E` in the app to send yourself today's stats!

---

**Free Tier:** 100 emails/day, 3,000/month (perfect for demos!)

See `docs/EMAIL_SETUP.md` for detailed instructions.

