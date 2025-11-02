# Email Setup Guide (Resend)

This guide explains how to set up email functionality using Resend (free tier).

## Quick Setup (5 minutes)

### Step 1: Sign up for Resend (Free)

1. Go to [resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email address

### Step 2: Get your API Key

1. After logging in, go to **API Keys** in the dashboard
2. Click **Create API Key**
3. Give it a name (e.g., "")
4. Copy the API key (you'll only see it once!)

### Step 3: Set Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add these variables:

```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
ADMIN_EMAIL=your-email@example.com
FROM_EMAIL=onboarding@resend.dev
CRON_SECRET=your-random-secret-key-here
```

**Important Notes:**
- `RESEND_API_KEY`: Your Resend API key from Step 2
- `ADMIN_EMAIL`: The email address where you want to receive daily stats reports
- `FROM_EMAIL`: Use `onboarding@resend.dev` for testing (free tier), or add your own domain later
- `CRON_SECRET`: A random secret string for securing the scheduled email endpoint (e.g., generate one: `openssl rand -hex 32`)

### Step 4: Redeploy

1. Go to **Deployments** in Vercel
2. Click **Redeploy** on the latest deployment (or push a new commit)
3. Wait for deployment to complete

### Step 5: Test

**Manual Email (Instant):**
1. Open your app
2. Press `Ctrl+Shift+E` (or `Cmd+Shift+E` on Mac)
3. Check your email inbox for the stats report!

**Scheduled Email (Automatic):**
- Emails are automatically sent daily at **11:59 PM** (your server's timezone)
- No action needed - just wait and check your inbox!

## Resend Free Tier Limits

- ✅ **100 emails per day**
- ✅ **3,000 emails per month**
- ✅ Perfect for hackathon demos and small projects
- ✅ No credit card required

## Custom Domain (Optional)

For production, you can add your own domain:

1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Follow the DNS setup instructions
4. Update `FROM_EMAIL` in Vercel to use your domain (e.g., `noreply@yourdomain.com`)

## Troubleshooting

### Email not sending?

1. **Check environment variables are set correctly in Vercel**
   - Go to Settings → Environment Variables
   - Make sure all three variables are present

2. **Verify Resend API key is valid**
   - Test the API key in Resend dashboard
   - Make sure it's not expired or revoked

3. **Check Vercel deployment logs**
   - Go to your deployment → Functions tab
   - Look for any errors in the `sendDailyStatsEmail` function

4. **Test API directly**
   ```bash
   curl -X POST https://api.resend.com/emails \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "from": "onboarding@resend.dev",
       "to": "your-email@example.com",
       "subject": "Test",
       "html": "<p>Test email</p>"
     }'
   ```

### Rate Limits

If you hit the 100 emails/day limit:
- Wait 24 hours, or
- Upgrade to Resend Pro plan

## Alternative Email Services

If Resend doesn't work for you, here are other free options:

### SendGrid (Free Tier)
- 100 emails/day forever
- More complex setup
- Update `api/sendDailyStatsEmail.js` to use SendGrid SDK

### Mailgun (Free Trial)
- 5,000 emails/month for 3 months
- Then paid plans
- Good for short-term projects

### Brevo (formerly Sendinblue)
- 300 emails/day free
- Good alternative to Resend

## Support

If you need help:
1. Check Resend documentation: https://resend.com/docs
2. Check Vercel logs for error messages
3. Make sure all environment variables are set correctly

