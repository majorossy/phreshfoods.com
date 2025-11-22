# Google Maps API Key Security Guide

**CRITICAL:** This guide walks you through securing your Google Maps API keys to prevent unauthorized use and unexpected billing.

**Status:** 🔴 **ACTION REQUIRED** before deploying to production

---

## Why This Matters

Your Google Maps API keys are currently **exposed** in:
1. **Frontend:** Visible in browser JavaScript (`VITE_GOOGLE_MAPS_API_KEY`)
2. **Backend:** Used for server-side API calls (`GOOGLE_API_KEY_BACKEND`)

**Risks Without Restrictions:**
- ❌ Anyone can copy your API key from browser DevTools
- ❌ Malicious actors can use your key for their own projects
- ❌ You'll be charged for their usage
- ❌ Could hit quota limits, breaking your app
- ❌ Potential for **thousands of dollars** in unexpected charges

**With Restrictions:**
- ✅ Keys only work on your domains
- ✅ Keys only work with specific APIs
- ✅ Daily quota limits prevent runaway costs
- ✅ Keys are useless to attackers

---

## Step-by-Step Instructions

### Prerequisites

- Google Cloud Console access: https://console.cloud.google.com/
- Your project name (where you created the API keys)
- Your production domain (e.g., `phreshfoods.com`)

---

## Part 1: Secure Frontend API Key

**Used for:** Loading Google Maps in the browser

### Step 1: Find Your Frontend API Key

1. Go to https://console.cloud.google.com/apis/credentials
2. Find the key used for `VITE_GOOGLE_MAPS_API_KEY` in your `.env` file
3. Click on the key name to edit it

### Step 2: Add Application Restrictions

**Click: Application restrictions**

Select: **HTTP referrers (web sites)**

Add the following referrers (one per line):
```
http://localhost:5173/*
http://localhost:3000/*
https://yourdomain.com/*
https://www.yourdomain.com/*
```

**Replace `yourdomain.com` with your actual production domain!**

**Examples:**
```
http://localhost:5173/*
http://localhost:3000/*
https://phreshfoods.com/*
https://www.phreshfoods.com/*
```

**What this does:** Key only works when requests come from these domains.

### Step 3: Add API Restrictions

**Click: API restrictions**

Select: **Restrict key**

Check ONLY these APIs:
- ☑️ **Maps JavaScript API** (required for map display)
- ☑️ **Places API** (required for autocomplete search)
- ☑️ **Geocoding API** (required for address → coordinates)
- ☑️ **Directions API** (required for directions)

**What this does:** Key cannot be used for other Google services (like YouTube, etc.)

### Step 4: Set Quota Limits

**Click: Quotas** (in left sidebar)

1. Find: **Maps JavaScript API**
2. Click: **All quotas**
3. Set daily limit:
   - **Recommended for small sites:** 10,000 requests/day
   - **Recommended for medium sites:** 50,000 requests/day
   - **Recommended for large sites:** 100,000 requests/day

**What this does:** If someone does abuse your key, charges are capped.

### Step 5: Save Changes

Click **SAVE** at the bottom

⚠️ **IMPORTANT:** Changes may take 5-10 minutes to propagate. Test your site after waiting.

---

## Part 2: Secure Backend API Key

**Used for:** Server-side API calls (geocoding, directions, place details)

### Step 1: Find Your Backend API Key

1. Go to https://console.cloud.google.com/apis/credentials
2. Find the key used for `GOOGLE_API_KEY_BACKEND` in your `.env` file
3. Click on the key name to edit it

### Step 2: Add Application Restrictions

**Click: Application restrictions**

Select: **IP addresses (web servers, cron jobs, etc.)**

**Option A: For Development (Local Server)**
```
127.0.0.1/32
::1/128
```

**Option B: For Production (Your Server IP)**
```
Your.Server.IP.Address/32
```

**How to find your server IP:**
```bash
# On your production server, run:
curl ifconfig.me
# Example output: 203.0.113.45

# Then add in Google Cloud Console:
203.0.113.45/32
```

**What this does:** Key only works from your server's IP address.

### Step 3: Add API Restrictions

**Click: API restrictions**

Select: **Restrict key**

Check ONLY these APIs:
- ☑️ **Geocoding API** (required for address → coordinates)
- ☑️ **Places API** (required for place details)
- ☑️ **Directions API** (required for directions)

**What this does:** Backend key cannot access frontend-only APIs.

### Step 4: Set Quota Limits

**Click: Quotas** (in left sidebar)

1. Find: **Geocoding API**
2. Set daily limit: **5,000 requests/day** (adjust based on your needs)

Repeat for:
- **Places API:** 5,000 requests/day
- **Directions API:** 1,000 requests/day

**What this does:** Caps your maximum daily costs.

### Step 5: Save Changes

Click **SAVE** at the bottom

---

## Part 3: Verify Restrictions Work

### Test 1: Frontend Key Works on Your Domain

1. Open your website: `https://yourdomain.com`
2. Open browser DevTools (F12) → Console tab
3. Look for Google Maps to load successfully
4. No errors should appear

**✅ Expected:** Map loads normally
**❌ If you see errors:** Check your referrer list includes your domain

### Test 2: Frontend Key DOESN'T Work on Other Domains

1. Copy your frontend API key from `.env`
2. Try to use it in a simple HTML file on a different domain
3. **Expected:** You should see an error like:
   ```
   Google Maps JavaScript API error: RefererNotAllowedMapError
   ```

**✅ Expected:** Error message (key is blocked)
**❌ If it works:** Your restrictions aren't active yet (wait 5-10 mins)

### Test 3: Backend Key Works from Your Server

1. SSH into your production server
2. Run:
   ```bash
   curl "https://maps.googleapis.com/maps/api/geocode/json?address=Portland+ME&key=YOUR_BACKEND_KEY"
   ```
3. **Expected:** Should return geocoding results

**✅ Expected:** JSON response with coordinates
**❌ If you see errors:** Check your server IP is whitelisted

### Test 4: Backend Key DOESN'T Work from Other IPs

1. From your local computer (NOT the server), run:
   ```bash
   curl "https://maps.googleapis.com/maps/api/geocode/json?address=Portland+ME&key=YOUR_BACKEND_KEY"
   ```
2. **Expected:** You should see an error like:
   ```json
   {
     "error_message": "The provided API key is invalid or doesn't have permission...",
     "status": "REQUEST_DENIED"
   }
   ```

**✅ Expected:** Error message (key is blocked)
**❌ If it works:** Your IP restrictions aren't active

---

## Part 4: Set Up Billing Alerts

**HIGHLY RECOMMENDED:** Get notified before costs get out of hand.

### Step 1: Go to Billing

1. https://console.cloud.google.com/billing
2. Select your project
3. Click **Budgets & alerts** in left sidebar

### Step 2: Create Budget Alert

Click **CREATE BUDGET**

**Name:** Google Maps API Budget

**Projects:** Select your project

**Budget amount:**
- **Option 1: Fixed amount**
  - Enter: `$50/month` (adjust to your needs)
- **Option 2: Based on last month**
  - Percentage: 120% (20% increase from last month)

**Thresholds:**
- ☑️ 50% of budget
- ☑️ 90% of budget
- ☑️ 100% of budget

**Email notifications:** Enter your email

Click **FINISH**

**What this does:** You'll get emails when approaching your budget limit.

---

## Part 5: Monitor Usage

### View Usage Dashboard

1. Go to: https://console.cloud.google.com/google/maps-apis/metrics
2. View metrics for:
   - **Maps JavaScript API** (frontend usage)
   - **Geocoding API** (backend usage)
   - **Places API** (autocomplete + details)
   - **Directions API** (driving directions)

**What to watch for:**
- Sudden spikes in usage (could indicate abuse)
- Gradual increases (normal growth)
- Errors (could indicate restrictions are too strict)

### Enable Detailed Logging (Optional)

1. Go to: https://console.cloud.google.com/apis/api/maps-backend.googleapis.com/metrics
2. Click **ENABLE LOGGING**
3. Select: **All API calls**

**What this does:** Track every API call for debugging.

---

## Troubleshooting

### Problem: "RefererNotAllowedMapError"

**Cause:** Frontend key's referrer restrictions are blocking your domain.

**Solution:**
1. Check you added `https://yourdomain.com/*` to referrers
2. Include both `www` and non-`www` versions
3. Wait 5-10 minutes for changes to propagate
4. Clear browser cache

### Problem: "REQUEST_DENIED" from backend

**Cause:** Backend key's IP restrictions are blocking your server.

**Solution:**
1. Find your server's IP: `curl ifconfig.me`
2. Add that IP to allowed IPs: `Your.IP.Address/32`
3. Wait 5-10 minutes for changes to propagate

### Problem: Map loads but features don't work

**Cause:** API restrictions might be too restrictive.

**Solution:**
Ensure these APIs are enabled:
- Maps JavaScript API
- Places API
- Geocoding API
- Directions API

### Problem: Quota exceeded errors

**Cause:** Hit your daily quota limit.

**Solution:**
1. View usage dashboard to see which API is hitting limits
2. Increase quota if legitimate traffic
3. Investigate if unusual spike (possible abuse)

---

## Security Checklist for Production

Before deploying to production, verify:

### Frontend API Key (`VITE_GOOGLE_MAPS_API_KEY`)
- [ ] HTTP referrer restrictions added (your production domain)
- [ ] API restrictions enabled (Maps JS, Places, Geocoding, Directions)
- [ ] Daily quota limits set
- [ ] Tested: Key works on your domain
- [ ] Tested: Key blocked on other domains

### Backend API Key (`GOOGLE_API_KEY_BACKEND`)
- [ ] IP address restrictions added (your server IP)
- [ ] API restrictions enabled (Geocoding, Places, Directions)
- [ ] Daily quota limits set
- [ ] Tested: Key works from your server
- [ ] Tested: Key blocked from other IPs

### Billing & Monitoring
- [ ] Billing alerts configured ($50/month or appropriate limit)
- [ ] Email notifications enabled
- [ ] Usage dashboard bookmarked for regular monitoring

### Environment Variables
- [ ] `.env` file NOT committed to git (should be in `.gitignore`)
- [ ] `.env.example` updated with instructions
- [ ] Production `.env` configured on server

---

## Cost Estimation

With proper restrictions and typical usage:

**Small Site (< 10,000 visitors/month):**
- Maps JavaScript API: ~5,000 loads/month
- Geocoding API: ~1,000 requests/month
- **Estimated cost:** $10-30/month

**Medium Site (10k-100k visitors/month):**
- Maps JavaScript API: ~50,000 loads/month
- Geocoding API: ~10,000 requests/month
- **Estimated cost:** $100-300/month

**Free Tier:**
Google provides $200/month credit, which covers:
- 28,500 Dynamic Map loads
- 40,000 Geocoding requests
- 40,000 Directions requests

**More info:** https://developers.google.com/maps/billing/gmp-billing

---

## Additional Resources

- **Google Maps Platform Pricing:** https://developers.google.com/maps/billing/gmp-billing
- **API Key Best Practices:** https://developers.google.com/maps/api-key-best-practices
- **API Key Restrictions:** https://cloud.google.com/docs/authentication/api-keys#api_key_restrictions
- **Billing Alerts:** https://cloud.google.com/billing/docs/how-to/budgets

---

## Quick Reference

**Frontend Key Restrictions:**
```
Restriction Type: HTTP referrers
Allowed Referrers:
  - https://yourdomain.com/*
  - https://www.yourdomain.com/*
  - http://localhost:5173/* (for development)

APIs Allowed:
  - Maps JavaScript API
  - Places API
  - Geocoding API
  - Directions API
```

**Backend Key Restrictions:**
```
Restriction Type: IP addresses
Allowed IPs:
  - Your.Server.IP/32

APIs Allowed:
  - Geocoding API
  - Places API
  - Directions API
```

---

## Error Handling

**Status:** ✅ **IMPLEMENTED** (January 22, 2025)

The application now includes comprehensive error handling for Google Maps API restriction errors:

**What's Included:**
- ✅ User-friendly error messages for all common restriction errors
- ✅ Toast notifications when errors occur
- ✅ Detailed logging in development mode for debugging
- ✅ Graceful fallbacks when API calls fail

**Error Messages You Might See:**

| Error Type | User-Friendly Message | What It Means |
|------------|----------------------|---------------|
| `RefererNotAllowedMapError` | "Unable to load map from this website. This site may have been accessed from an unauthorized domain." | HTTP referrer restriction is blocking the request |
| `ApiNotActivatedMapError` | "The mapping service is temporarily unavailable." | Required API not enabled in Google Cloud Console |
| `REQUEST_DENIED` | "Unable to complete your request at this time." | Backend IP restriction or API restriction |
| `OVER_QUERY_LIMIT` | "Our map service has reached its daily usage limit." | Daily quota exceeded |
| `ZERO_RESULTS` | "No results found for your search." | Search/directions returned no results |

**Implementation Files:**
- `src/utils/googleMapsErrors.ts` - Error parsing and user-friendly message generation
- `src/utils/loadGoogleMapsScript.ts` - Frontend map loading error handling
- `src/services/apiService.ts` - Backend API error handling
- `src/contexts/SearchContext.tsx` - Map loading error notifications
- `src/contexts/DirectionsContext.tsx` - Directions error handling

**Development Mode:**
In development, detailed error information is logged to the browser console:
```
[Google Maps Error: Geocoding]
User Message: Unable to complete your request at this time.
Technical Details: The server's request was denied by Google Maps API...
Suggested Action: Please try again in a few moments...
Original Error: REQUEST_DENIED
```

---

**Last Updated:** January 22, 2025
**Priority:** 🔴 CRITICAL - Complete before production deployment
**Estimated Time:** 15-20 minutes

---

## Questions?

If you run into issues:
1. Check the troubleshooting section above
2. Review Google's API Key Best Practices guide
3. Contact Google Cloud Support (if you have a paid support plan)

**Remember:** These restrictions protect you from unauthorized usage and unexpected bills. Take the time to set them up correctly!
