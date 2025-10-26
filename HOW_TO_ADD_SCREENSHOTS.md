# 📸 How to Add Screenshots to README

## Quick Steps

### 1. Create Screenshots Folder
```bash
mkdir screenshots
```

### 2. Take Screenshots
Use your browser or screenshot tools to capture:
- Dashboard page
- Achievements/Profile page
- Leaderboard page
- Rewards section
- Mobile views (use browser dev tools)

### 3. Name Your Files
Save screenshots with these exact names:
```
screenshots/
├── dashboard.png
├── achievements.png
├── leaderboard.png
├── rewards.png
├── mobile-dashboard.png
├── mobile-profile.png
└── mobile-rewards.png
```

### 4. Optimize Images (Optional but Recommended)

**Online Tools:**
- [TinyPNG](https://tinypng.com/) - Free compression
- [Squoosh](https://squoosh.app/) - Google's image optimizer

**Target sizes:**
- Desktop screenshots: 1920x1080 or 1280x720
- Mobile screenshots: 390x844 (iPhone size) or 360x800 (Android size)
- File size: Under 500KB each

### 5. Add to Git
```bash
git add screenshots/
git commit -m "Add project screenshots"
git push origin main
```

### 6. Verify on GitHub
Go to `https://github.com/Ojasvvv/Eco-rewards` and check if images display correctly.

---

## Alternative: Use Imgur or GitHub Issues

### Method 1: Imgur (Free Image Hosting)

1. Go to [imgur.com](https://imgur.com)
2. Upload your screenshots
3. Right-click image → Copy image address
4. Replace in README:
```markdown
![Dashboard](https://i.imgur.com/YOUR_IMAGE_ID.png)
```

### Method 2: GitHub Issues (Drag & Drop)

1. Go to your repo's Issues tab
2. Create a new issue (don't need to submit it)
3. Drag and drop images into the comment box
4. GitHub will upload and give you URLs
5. Copy those URLs to your README
6. Cancel/close the issue

**Example:**
```markdown
![Dashboard](https://user-images.githubusercontent.com/xxxxx/xxxxx.png)
```

---

## Taking Great Screenshots

### For Dashboard
1. Open https://eco-rewards-wheat.vercel.app/dashboard
2. Make sure you're logged in
3. Remove browser address bar (F11 for fullscreen, or crop it)
4. Capture the main view with stats, dustbin code input, and rewards

### For Achievements
1. Go to Profile page
2. Scroll to achievements section
3. Capture unlocked achievements with their animations

### For Leaderboard
1. Navigate to Leaderboard
2. Show the city rankings with progress bars
3. Capture at least top 5 cities

### For Rewards
1. Go to Dashboard
2. Click "View Available Rewards"
3. Capture the rewards modal/section

### For Mobile Views
1. Open Chrome DevTools (F12)
2. Click device toolbar icon (or Ctrl+Shift+M)
3. Select iPhone 12 Pro or Pixel 5
4. Take screenshots in mobile view

---

## Professional Tips

### ✅ Do's
- Use consistent resolution (all desktop shots should be same size)
- Capture during daytime for light mode shots
- Enable dark mode for contrast shots
- Show actual user data (not empty states)
- Ensure no personal sensitive info visible

### ❌ Don'ts
- Don't use blurry screenshots
- Don't mix different aspect ratios
- Don't show error states or broken UI
- Don't include real user emails (privacy)

---

## Animated GIFs (Optional - Makes it Interactive!)

Want to show **live interactions**? Create GIFs!

### Tools:
- [ScreenToGif](https://www.screentogif.com/) (Windows - FREE)
- [Kap](https://getkap.co/) (Mac - FREE)
- [Gifski](https://gif.ski/) (Mac - FREE)
- [LICEcap](https://www.cockos.com/licecap/) (Windows/Mac - FREE)

### Great GIF Ideas:
```markdown
![Login Flow](./screenshots/login-flow.gif)
![Claim Reward](./screenshots/claim-reward.gif)
![Achievement Unlock](./screenshots/achievement-unlock.gif)
```

**Example workflow:**
1. Record 5-10 seconds of interaction
2. Export as GIF
3. Optimize at [ezgif.com](https://ezgif.com/optimize)
4. Keep under 5MB
5. Add to screenshots folder

---

## Quick Example

After adding screenshots, your file structure should look like:

```
Eco-rewards/
├── screenshots/
│   ├── dashboard.png          ← Desktop view
│   ├── achievements.png       ← Profile page
│   ├── leaderboard.png        ← City rankings
│   ├── rewards.png            ← Rewards section
│   ├── mobile-dashboard.png   ← Mobile view 1
│   ├── mobile-profile.png     ← Mobile view 2
│   └── mobile-rewards.png     ← Mobile view 3
├── src/
├── public/
├── README.md
└── package.json
```

---

## Need Help?

If images don't show:
1. Check file names match exactly (case-sensitive!)
2. Make sure they're in `screenshots/` folder
3. Try absolute GitHub URLs instead:
   ```markdown
   ![Dashboard](https://raw.githubusercontent.com/Ojasvvv/Eco-rewards/main/screenshots/dashboard.png)
   ```

---

**Pro Tip:** Add a video demo to your README:

```markdown
## 🎥 Video Demo

[![Watch Demo](https://img.shields.io/badge/▶️_Watch-Video_Demo-red?style=for-the-badge&logo=youtube)](https://youtu.be/YOUR_VIDEO_ID)
```

Upload a 2-3 minute demo to YouTube showcasing:
- Login process
- Claiming rewards
- Viewing achievements
- Checking leaderboard

This makes your README **10x more engaging!** 🚀

