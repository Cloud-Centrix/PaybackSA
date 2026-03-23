# PayBack SA – Launch Checklist & Step-by-Step Guides

This document walks you through everything needed to get PayBack SA live on the Google Play Store (and optionally the Apple App Store).

---

## PART 1: Host Privacy Policy & Support Pages

Your privacy policy and support page are in the `docs/` folder. You need to make them publicly accessible via a URL.

### Steps (GitHub Pages – free):

1. Go to **https://github.com/Cloud-Centrix/PaybackSA/settings/pages**
2. Under **Source**, select **Deploy from a branch**
3. Set branch to **main** and folder to **/docs**
4. Click **Save**
5. Wait 1-2 minutes — your pages will be live at:
   - **Privacy Policy:** `https://cloud-centrix.github.io/PaybackSA/privacy-policy.html`
   - **Support:** `https://cloud-centrix.github.io/PaybackSA/support.html`

> **Important:** You'll need these URLs when setting up your store listings.

---

## PART 2: RevenueCat Product Setup

The app charges **R49.99** as a once-off premium purchase. Here's how to set it up end-to-end.

### Step 1: Create the Product in Google Play Console

1. Go to **https://play.google.com/console**
2. Select your app (or create it — see Part 4)
3. Navigate to **Monetize → Products → In-app products**
4. Click **Create product**
5. Fill in:
   - **Product ID:** `paybacksa_premium` (must match what RevenueCat expects)
   - **Name:** PayBack Premium
   - **Description:** Unlock all premium features — WhatsApp sharing, unlimited people per bill, receipt scanning, and more. Once-off payment, yours forever.
   - **Default price:** ZAR 49.99
6. Set status to **Active**
7. Click **Save**

### Step 2: Create a RevenueCat Account & Project

1. Go to **https://www.revenuecat.com** → Sign Up (free up to $2,500/mo revenue)
2. Create a new **Project** called `PayBack SA`
3. Under **Project Settings → Apps**, add a new **Google Play** app:
   - **App name:** PayBack SA
   - **Package name:** `com.paybacksa.app`
4. You'll need to upload a **Google Play service account JSON key** (see Step 3)

### Step 3: Create a Google Play Service Account (for RevenueCat & EAS Submit)

This key is used by both RevenueCat (to validate purchases) and EAS Submit (to upload builds).

1. Go to **https://console.cloud.google.com**
2. Select or create a project (e.g. `PayBack SA`)
3. Navigate to **IAM & Admin → Service Accounts**
4. Click **Create Service Account**:
   - Name: `paybacksa-service`
   - Role: not needed here (assigned in Play Console)
5. Click on the created account → **Keys** tab → **Add Key → JSON**
6. Download the JSON file and save it as `google-service-account.json` in the project root
7. **In Google Play Console:** Go to **Settings → API access**
8. Click **Link** next to your Google Cloud project
9. Under **Service accounts**, find `paybacksa-service` and click **Manage Play Console permissions**
10. Grant these permissions:
    - ✅ View app information and download bulk reports
    - ✅ View financial data, orders, and cancellation survey responses
    - ✅ Manage orders and subscriptions
11. Click **Invite user** → **Apply**
12. Go back to **RevenueCat → Project → Google Play app** and upload this same JSON key

> **IMPORTANT:** Add `google-service-account.json` to your `.gitignore` — it's a secret!

### Step 4: Configure RevenueCat Entitlements

1. In RevenueCat dashboard, go to **Project → Entitlements**
2. Click **+ New Entitlement**:
   - **Identifier:** `premium` (this must exactly match the code in `premiumStore.ts`)
3. Go to **Project → Products**
4. Click **+ New Product**:
   - **Identifier:** `paybacksa_premium`
   - **Store:** Google Play
   - **Product ID:** `paybacksa_premium` (matches Google Play)
5. Go to **Project → Offerings**
6. The **Default** offering should already exist. Click into it.
7. Add a **Package**:
   - **Type:** Lifetime
   - **Product:** `paybacksa_premium`
8. Go back to **Entitlements → premium** and attach the **Default** offering

### Step 5: Get Your API Keys

1. In RevenueCat, go to **Project → Apps → Google Play app**
2. Copy the **Public API key** (starts with `goog_`)
3. Paste it in your `.env` file as `REVENUCAT_ANDROID_API_KEY`

For iOS (when ready):
1. Add an **App Store** app in RevenueCat
2. Copy the iOS public API key (starts with `appl_`)
3. Paste it as `REVENUCAT_IOS_API_KEY`

### Step 6: Test Purchases

1. In Google Play Console → **Settings → License testing**
2. Add your test Gmail accounts (these won't be charged real money)
3. Build a development/preview APK: `eas build --profile preview --platform android`
4. Install it on a physical device with a test account signed into Google Play
5. Try purchasing premium — it should go through without real charges
6. Verify the entitlement appears in RevenueCat dashboard

---

## PART 3: Store Listing Materials

### What you need for Google Play:

| Asset | Specification | Notes |
|-------|--------------|-------|
| **App icon** | 512 × 512 PNG | Already in `assets/icon.png` — verify it's 512px |
| **Feature graphic** | 1024 × 500 PNG | Displayed at top of store listing. Use brand colors (teal #2D7987) |
| **Phone screenshots** | Min 2, max 8 | 16:9 or 9:16. Take from emulator or real device |
| **Short description** | Max 80 chars | One-liner pitch |
| **Full description** | Max 4000 chars | SEO-optimized, feature-rich |
| **App category** | Finance | |
| **Content rating** | Complete questionnaire | In Play Console |
| **Privacy policy URL** | Required | `https://cloud-centrix.github.io/PaybackSA/privacy-policy.html` |

### Suggested Short Description (80 chars):
```
Split bills & track trip expenses with friends — fast, fair, and offline.
```

### Suggested Full Description:
```
PayBack SA makes splitting bills and tracking group expenses effortless.

🧾 SPLIT BILLS INSTANTLY
Add items, assign them to people, and PayBack SA calculates exactly what everyone owes. Add tips, include tax — it handles everything.

✈️ TRACK TRIP EXPENSES
Create a trip, log expenses as they happen, and see real-time balances. Know exactly who owes whom at the end.

📱 SHARE VIA WHATSAPP
Send payment summaries directly via WhatsApp with your bank details included. No more awkward "you owe me" messages.

📸 SCAN RECEIPTS (Premium)
Use your camera to scan a receipt and automatically extract items. Save time on manual entry.

👥 UNLIMITED PEOPLE (Premium)
Free users can split between 3 people. Premium unlocks unlimited participants.

💰 ONCE-OFF PREMIUM – R49.99
No subscriptions. No recurring charges. Pay once, unlock everything forever.

🔒 YOUR DATA STAYS ON YOUR DEVICE
We don't upload your personal information to any server. Your bills, trips, and bank details are stored locally on your phone.

🇿🇦 BUILT FOR SOUTH AFRICA
Designed with South African Rand, local bank details, and WhatsApp sharing in mind.

FEATURES:
• Split bills with custom items and people
• Track and split trip expenses by category
• WhatsApp, email, and SMS sharing
• Receipt scanning with camera
• Tip calculator and tax handling
• Offline — works without internet
• Clean, modern design

Perfect for dinners out, holidays, shared houses, road trips, braais, and more.
```

### How to Take Screenshots:

1. Run the app on an emulator or device:
   ```
   npx expo start
   ```
2. Create sample bills and trips with realistic data
3. Take screenshots of these key screens:
   - **Bills list** with 2-3 bills
   - **Bill detail** showing item splits
   - **Trips list** with a couple of trips
   - **Trip detail** with expenses
   - **Share preview** (WhatsApp share)
   - **Receipt scanning** screen
   - **Premium upgrade** modal
   - **Settings** screen
4. For Google Play, screenshots should be **1080 × 1920** (phone portrait)
5. Optionally add frames and text captions using a tool like:
   - **Canva** (free) — search for "app screenshot mockup"
   - **screenshots.pro** — automated mockup generator
   - **Figma** — if you want full control

### Feature Graphic (1024 × 500):

Create in Canva or Figma:
- Background: teal (#2D7987)
- App name "PayBack SA" in white
- Tagline: "Split bills. Track trips. Get paid back."
- Phone mockup showing the app (optional but professional)
- Keep text large and readable on small screens

---

## PART 4: Google Play – Closed Testing (REQUIRED before Production)

Google requires at least **20 testers** in a **closed test track** for a **minimum of 14 continuous days** before you can publish to production. This is mandatory for new apps.

### Step 1: Create the App in Google Play Console

1. Go to **https://play.google.com/console**
2. Click **Create app**
3. Fill in:
   - **App name:** PayBack SA
   - **Default language:** English (South Africa) or English (United States)
   - **App or game:** App
   - **Free or paid:** Free (with in-app purchases)
4. Accept the declarations and click **Create app**

### Step 2: Complete the Store Listing

1. Go to **Grow → Store listing → Main store listing**
2. Fill in:
   - Short description (80 chars — see above)
   - Full description (see above)
   - Upload app icon, feature graphic, screenshots
3. Go to **App content** and complete ALL sections:
   - **Privacy policy:** paste your GitHub Pages URL
   - **App access:** All functionality available without special access
   - **Ads:** Does not contain ads
   - **Content rating:** Complete the IARC questionnaire (it's a short survey about the app content — the app has no violence, gambling, etc. so it'll get an "Everyone" rating)
   - **Target audience:** 18+ (financial app)
   - **News app:** No
   - **Data safety:** Fill in based on the privacy policy (local storage, crash reports, purchase data)

### Step 3: Data Safety Section

Google requires you to declare what data you collect. Based on the app:

| Question | Answer |
|----------|--------|
| Does your app collect or share user data? | Yes |
| **Data types collected:** | |
| → Personal info (name) | Collected, not shared, stored on device |
| → Financial info (bank details) | Collected, not shared, stored on device |
| → App activity (in-app purchases) | Collected, shared with RevenueCat |
| → App info and performance (crash logs) | Collected, shared with Sentry |
| Is data encrypted in transit? | Yes |
| Can users request data deletion? | Yes (uninstall or clear data) |

### Step 4: Build the Release APK/AAB

```bash
# build an Android App Bundle (required for Play Store)
eas build --profile production --platform android
```

This will produce an `.aab` file. Download it from the Expo dashboard when the build completes.

### Step 5: Create a Closed Testing Track

1. In Play Console, go to **Testing → Closed testing**
2. Click **Create track** (or use "Closed testing - Alpha")
3. Click **Create new release**
4. Upload the `.aab` file from the EAS build
5. Add release notes, e.g.: "Initial closed beta release"
6. Click **Save** → **Review release** → **Start rollout to Closed testing**

### Step 6: Add Testers

1. In the closed testing track, go to **Testers**
2. Click **Create email list**
3. Name it `Beta Testers`
4. Add **at least 20 Gmail addresses** — these can be:
   - Colleagues at Cloud Centrix
   - Friends and family
   - Anyone willing to install and test
5. Each tester receives an **opt-in link** — they must:
   - Click the link
   - Accept the invitation
   - Install the app from the Play Store

> **Critical:** The 14-day clock starts when testers **opt in**, not when you create the track. Make sure testers actually join quickly.

### Step 7: Wait 14 Days

- During this time, testers should use the app and report any issues
- You can push updates to the closed track without restarting the 14-day count
- Monitor feedback in Play Console → **Ratings and reviews**
- Monitor crashes in Sentry dashboard

### Step 8: Apply for Production Access

After 14 days with 20+ testers:

1. Go to **Production** in Play Console
2. Click **Create new release**
3. Upload the latest `.aab` (or promote from closed testing)
4. Add production release notes
5. Click **Review release** → **Start rollout to Production**
6. Google reviews the app (typically 1-7 days for new apps)

---

## PART 5: Quick Reference – Key Values

| Item | Value |
|------|-------|
| Bundle ID | `com.paybacksa.app` |
| Expo Project ID | `ea369e76-f2c0-43fc-810e-1e92dd0f9476` |
| RevenueCat Entitlement | `premium` |
| Google Play Product ID | `paybacksa_premium` |
| Premium Price | R49.99 (ZAR) |
| Privacy Policy URL | `https://cloud-centrix.github.io/PaybackSA/privacy-policy.html` |
| Support URL | `https://cloud-centrix.github.io/PaybackSA/support.html` |
| Service Account Key | `./google-service-account.json` |
| Sentry Org | `cloud-centrix` |
| Sentry Project | `paybacksa` |
| EAS Submit Track | `internal` → promote to `production` |

---

## PART 6: Timeline Overview

```
Week 1:  Set up store listing + RevenueCat products + service account
         Build preview APK and test purchases
         Create screenshots and feature graphic

Week 2:  Submit to closed testing with 20 testers
         Testers opt in and start using the app

Week 3:  Monitor feedback, fix bugs, push updates
         (14-day clock counting)

Week 4:  14-day period ends
         Submit to production
         Google review (1-7 days)
         🚀 APP IS LIVE
```

---

## Need Help?

If you get stuck on any step, refer back to `COMPANY-APP-GUIDE.md` for the full technical explanation, or contact support.
