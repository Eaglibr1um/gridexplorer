# Vercel Environment Variables Setup

This document lists all the environment variables you need to configure in Vercel for the tuition portal to work properly.

## Required Environment Variables

### Firebase Configuration
These are required for the main app authentication and data storage:

```
VITE_FIREBASE_API_KEY=AIzaSyCrgW6uIoEmU1ljfucICAFzLXNR6hRZL2E
VITE_FIREBASE_AUTH_DOMAIN=gridexplorer-d9ff4.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=gridexplorer-d9ff4
VITE_FIREBASE_STORAGE_BUCKET=gridexplorer-d9ff4.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=849149791206
VITE_FIREBASE_APP_ID=1:849149791206:web:b7d9560c02a0709de42427
```

### Supabase Configuration
These are required for the tuition portal features (learning points, calendar, bookings, etc.):

```
VITE_SUPABASE_URL=https://aenzdgnuscszdgipuyea.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_6ilTS_trs86n9kSSlvN2Iw_H0ujXZwu
```

## How to Add Environment Variables in Vercel

1. **Go to your Vercel Dashboard**
   - Navigate to your project
   - Click on **Settings** → **Environment Variables**

2. **Add Each Variable**
   - Click **Add New**
   - Enter the **Name** (e.g., `VITE_FIREBASE_API_KEY`)
   - Enter the **Value** (copy from above)
   - Select environments: **Production**, **Preview**, and **Development** (or as needed)
   - Click **Save**

3. **Add All Variables**
   - Repeat step 2 for all 8 environment variables listed above

4. **Redeploy**
   - After adding all variables, trigger a new deployment
   - Go to **Deployments** → Click **...** on the latest deployment → **Redeploy**
   - Or push a new commit to trigger automatic deployment

## Important Notes

⚠️ **Security Notes:**
- The Supabase `anon` key is a publishable key designed for client-side use, so it's safe to expose
- Firebase API keys are also safe to expose in client-side code (they're restricted by domain)
- Never commit these values to public repositories (they're already in `.gitignore`)

✅ **Fallback Values:**
- The code includes fallback values for Supabase (for backward compatibility)
- However, it's recommended to set all environment variables in Vercel for consistency

## Verification

After deployment, verify the tuition portal works by:
1. Visiting `/tuition` route
2. Testing PIN entry for a tutee
3. Checking if learning points load correctly
4. Verifying calendar functionality

## Troubleshooting

If the tuition portal doesn't work after deployment:

1. **Check Environment Variables**
   - Verify all variables are set in Vercel
   - Make sure variable names match exactly (case-sensitive)
   - Ensure they're enabled for the correct environments

2. **Check Browser Console**
   - Open browser DevTools → Console
   - Look for any Supabase or Firebase connection errors

3. **Check Network Tab**
   - Verify Supabase requests are going through
   - Check if Firebase auth is working

4. **Redeploy**
   - Sometimes a fresh deployment is needed after adding env vars
   - Try redeploying from Vercel dashboard

---

**Quick Copy-Paste for Vercel:**

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

