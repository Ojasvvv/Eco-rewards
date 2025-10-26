# Firebase Security Rules Setup Guide

## Prerequisites

1. Firebase project already created
2. Firebase CLI installed
3. Firebase initialized in your project

## Installing Firebase CLI

If you haven't already:

```bash
npm install -g firebase-tools
```

## Login to Firebase

```bash
firebase login
```

## Initialize Firebase (if not already done)

```bash
firebase init
```

Select:
- ✅ Firestore
- ✅ Storage
- ✅ Hosting (optional)

## Deploy Security Rules

### Option 1: Deploy All Rules

```bash
firebase deploy
```

### Option 2: Deploy Only Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### Option 3: Deploy Only Storage Rules

```bash
firebase deploy --only storage
```

## Verify Rules Deployment

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. **For Firestore**: 
   - Navigate to Firestore Database → Rules
   - You should see the rules from `firestore.rules`
4. **For Storage**:
   - Navigate to Storage → Rules
   - You should see the rules from `storage.rules`

## Security Rules Explanation

### Firestore Rules (`firestore.rules`)

#### User Profiles
```javascript
match /users/{userId} {
  allow read: if isOwner(userId);
  allow create, update: if isOwner(userId) && isValidEmail();
  allow delete: if false; // Prevent deletion
}
```
- Users can only read/write their own profile
- Email must be verified
- Profiles cannot be deleted

#### Rewards
```javascript
match /rewards/{userId} {
  allow read: if isOwner(userId);
  allow create, update: if isOwner(userId) 
    && request.resource.data.points >= 0
    && request.resource.data.points <= 10000;
}
```
- Users can only access their own rewards
- Points must be between 0 and 10,000
- Prevents large deductions (anti-fraud measure)

#### Transactions
```javascript
match /transactions/{transactionId} {
  allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
  allow write: if false; // Only backend
}
```
- Users can read their own transactions
- Only backend can create transactions

### Storage Rules (`storage.rules`)

#### Profile Pictures
```javascript
match /users/{userId}/profile/{fileName} {
  allow read: if isAuthenticated();
  allow write: if isOwner(userId) && isValidImageType() && isValidImageSize();
}
```
- Any authenticated user can view profile pictures
- Only owners can upload/update
- Max 5MB size limit
- Only image types allowed

## Testing Rules

### Using Firebase Emulator Suite

1. Install emulators:
```bash
firebase init emulators
```

2. Start emulators:
```bash
firebase emulators:start
```

3. Test rules in Firestore:
```bash
# In Firestore Rules Playground
firebase emulators:start --only firestore
```

### Manual Testing Checklist

Test these scenarios:

#### ✅ Should Allow:
- [ ] User can read their own profile
- [ ] User can update their own rewards
- [ ] User can read their own transactions
- [ ] User can upload their own profile picture
- [ ] Authenticated user can read dustbin locations
- [ ] User can create a report

#### ❌ Should Deny:
- [ ] User cannot read other users' profiles
- [ ] User cannot update other users' rewards
- [ ] User cannot directly write transactions
- [ ] User cannot upload images > 5MB
- [ ] Unauthenticated user cannot access any data
- [ ] User cannot delete their profile

## Common Issues & Fixes

### Issue: Rules deployment fails

**Error**: "Permission denied"

**Fix**:
```bash
firebase login --reauth
firebase use --add  # Select your project
firebase deploy --only firestore:rules
```

### Issue: Rules deployed but not working

**Problem**: Changes not reflected

**Fix**:
1. Wait 1-2 minutes for propagation
2. Clear Firebase cache
3. Restart your app
4. Check Firebase Console to verify rules are updated

### Issue: Testing shows "Permission denied"

**Problem**: Valid requests being blocked

**Fix**:
1. Check authentication state
2. Verify user ID matches
3. Check email verification status
4. Review console for specific rule that failed

## Best Practices

### 1. Test Before Deploying
```bash
# Always test rules in emulator first
firebase emulators:start --only firestore
```

### 2. Version Control
```bash
# Create backup before changes
cp firestore.rules firestore.rules.backup
```

### 3. Gradual Rollout
- Deploy to development environment first
- Test thoroughly
- Deploy to production

### 4. Monitor Access
- Enable Firebase audit logs
- Set up alerts for denied requests
- Review access patterns regularly

## Security Checklist

### Before Production

- [ ] Deploy Firestore security rules
- [ ] Deploy Storage security rules
- [ ] Test all rules thoroughly
- [ ] Enable email verification requirement
- [ ] Set up Firebase audit logging
- [ ] Configure authorized domains
- [ ] Implement rate limiting (App Check)
- [ ] Set up monitoring/alerts

### Regular Maintenance

- [ ] Review rules monthly
- [ ] Check for denied requests
- [ ] Update rules as features change
- [ ] Audit user access patterns
- [ ] Review and rotate credentials

## Advanced: Custom Claims for Admin

If you need admin users:

```javascript
// Cloud Function to set admin claim
exports.setAdminClaim = functions.https.onCall(async (data, context) => {
  // Verify the user is authorized to grant admin (you decide how)
  // Then set the custom claim
  await admin.auth().setCustomUserClaims(data.uid, { admin: true });
  return { message: 'Admin claim set' };
});
```

Update rules:
```javascript
function isAdmin() {
  return isAuthenticated() && request.auth.token.admin == true;
}

match /admin/{document=**} {
  allow read, write: if isAdmin();
}
```

## Monitoring Rules Performance

1. Go to Firebase Console
2. Navigate to Firestore → Usage
3. Monitor:
   - Read/Write operations
   - Denied requests
   - Error rates

## Backup & Restore

### Backup Current Rules

```bash
# Firestore
firebase firestore:rules > firestore.rules.backup

# Storage
firebase storage:rules > storage.rules.backup
```

### Restore Rules

```bash
# Copy backup back
cp firestore.rules.backup firestore.rules
firebase deploy --only firestore:rules
```

## Next Steps

1. ✅ Deploy security rules
2. ⬜ Set up Firebase App Check (recommended)
3. ⬜ Implement Cloud Functions for sensitive operations
4. ⬜ Set up monitoring and alerts
5. ⬜ Regular security audits

## Resources

- [Firestore Security Rules Documentation](https://firebase.google.com/docs/firestore/security/get-started)
- [Storage Security Rules Documentation](https://firebase.google.com/docs/storage/security)
- [Firebase Security Best Practices](https://firebase.google.com/docs/rules/best-practices)
- [Rules Simulator](https://firebase.google.com/docs/firestore/security/test-rules-emulator)

## Support

For issues:
1. Check Firebase Console → Firestore → Rules
2. Review deployment logs
3. Test in emulator
4. Contact Firebase Support

## Quick Commands Reference

```bash
# Deploy all rules
firebase deploy

# Deploy only Firestore
firebase deploy --only firestore:rules

# Deploy only Storage
firebase deploy --only storage

# Test locally
firebase emulators:start

# View current project
firebase projects:list

# Switch project
firebase use project-id

# Check deployment status
firebase deploy --only firestore:rules --debug
```

