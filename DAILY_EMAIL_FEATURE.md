# 📧 Daily Stats Email Feature

## Overview

The app now supports **both manual and automatic** daily stats emails:

1. **Manual Trigger**: Press `Ctrl+Shift+E` (or `Cmd+Shift+E` on Mac) anywhere in the app
2. **Automatic Schedule**: Emails sent automatically every day at **11:59 PM**

## What's Included in the Email

The email contains a comprehensive daily report with:

- 📊 **Summary Statistics**
  - Total bin usages
  - Unique users count
  - Pickup requests
  - Active bins count

- 🗑️ **Bin Usage by Location**
  - Grouped by bin code
  - First name and email of each user
  - Exact GPS coordinates (latitude, longitude)
  - Timestamp and points earned

- 📍 **Complete Location Logs**
  - Full list of all bin usages
  - User details
  - Exact coordinates
  - Points earned

- 🚚 **Pickup Requests**
  - User information
  - Waste category
  - Address
  - Date and time slot
  - Status

- 💰 **Transactions**
  - All points transactions for the day
  - User information
  - Transaction type and reason

## Setup

See `SETUP_EMAIL.md` for quick setup instructions or `docs/EMAIL_SETUP.md` for detailed guide.

## Environment Variables Required

```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
ADMIN_EMAIL=your-email@example.com
FROM_EMAIL=onboarding@resend.dev
CRON_SECRET=your-random-secret-here
```

## How It Works

### Manual Email (`/api/sendDailyStatsEmail`)
- Triggered by keyboard shortcut `Ctrl+Shift+E`
- Requires user authentication (Bearer token)
- Rate limited: 5 requests per minute
- Instant email delivery

### Scheduled Email (`/api/cron/dailyStatsEmail`)
- Triggered automatically at 11:59 PM daily
- Uses Vercel Cron Jobs
- Secured with `CRON_SECRET`
- No user authentication needed (system-level)
- No rate limiting (runs once per day)

## Technical Details

### Cron Schedule
- **Schedule**: `59 23 * * *` (11:59 PM daily)
- **Timezone**: Server timezone (UTC by default)
- **Configuration**: `vercel.json`

### Security
- Manual endpoint: Firebase Auth token required
- Cron endpoint: `CRON_SECRET` header required
- Both endpoints validate authentication before processing

### Email Service
- Uses **Resend** (free tier: 100 emails/day, 3,000/month)
- HTML email with beautiful formatting
- Plain text fallback included

## Testing

### Test Manual Email
1. Open the app
2. Press `Ctrl+Shift+E`
3. Check notification toast
4. Check email inbox

### Test Scheduled Email
1. Wait until 11:59 PM
2. Or manually trigger: `POST /api/cron/dailyStatsEmail` with `Authorization: Bearer <CRON_SECRET>`
3. Check Vercel logs for execution
4. Check email inbox

## Files

- `api/sendDailyStatsEmail.js` - Manual email endpoint
- `api/cron/dailyStatsEmail.js` - Scheduled email endpoint
- `src/services/emailService.js` - Client-side email service
- `src/components/GlobalShortcuts/GlobalShortcuts.jsx` - Keyboard shortcut handler
- `vercel.json` - Cron job configuration

## Troubleshooting

If emails aren't being sent:

1. **Check environment variables** in Vercel
2. **Verify Resend API key** is valid
3. **Check Vercel logs** for errors
4. **Verify CRON_SECRET** matches in both places
5. **Check Resend dashboard** for email delivery status

See `docs/EMAIL_SETUP.md` for more troubleshooting tips.

