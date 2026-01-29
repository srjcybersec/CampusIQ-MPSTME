# Razorpay API Keys Setup - Step by Step Guide

## Step-by-Step Instructions to Get Razorpay API Keys

### Part 1: Create Razorpay Account

1. **Open your web browser** (Chrome, Firefox, Edge, etc.)

2. **Go to Razorpay website**
   - Type in address bar: `https://razorpay.com/`
   - Press **Enter**

3. **Click on "Sign Up" button**
   - Located at the top right corner of the page
   - OR click the "Get Started" button in the center

4. **Fill in your details**
   - Enter your **Email Address**
   - Enter your **Password**
   - Enter your **Business Name** (e.g., "CampusIQ Canteen" or "MPSTME Canteen")
   - Click **"Create Account"** button

5. **Verify your email**
   - Check your email inbox
   - Click on the verification link sent by Razorpay
   - You'll be redirected back to Razorpay

6. **Complete Business Details**
   - Enter your **Business Type** (Select "Individual" or "Business" as applicable)
   - Enter your **Business Category** (e.g., "Food & Beverages")
   - Enter your **Business Address**
   - Enter your **Phone Number**
   - Click **"Continue"** or **"Next"** button

7. **Complete KYC (Know Your Customer)**
   - Upload required documents:
     - **PAN Card** (for business/individual)
     - **Bank Account Details** (for receiving payments)
     - **Address Proof** (Aadhaar, Driving License, etc.)
   - Fill in all required fields
   - Click **"Submit"** button

8. **Wait for Account Activation**
   - Razorpay will review your documents (usually 24-48 hours)
   - You'll receive an email when your account is activated
   - Once activated, you can proceed to get API keys

---

### Part 2: Get API Keys (After Account Activation)

#### Option A: Test Mode (For Testing/Development)

1. **Log in to Razorpay Dashboard**
   - Go to: `https://dashboard.razorpay.com/`
   - Enter your **Email** and **Password**
   - Click **"Log In"** button

2. **Switch to Test Mode**
   - Look at the top right corner of the dashboard
   - You'll see a toggle switch that says **"Test Mode"** or **"Live Mode"**
   - Click on it to switch to **"Test Mode"** (it should show "Test Mode" in orange/red)

3. **Navigate to Settings**
   - Look at the left sidebar menu
   - Find and click on **"Settings"** (usually has a gear icon ⚙️)
   - It's usually near the bottom of the sidebar

4. **Go to API Keys Section**
   - In the Settings page, you'll see multiple tabs/sections
   - Click on **"API Keys"** tab
   - It's usually the first or second option in Settings

5. **Generate Test Keys**
   - You'll see a section for "Test Keys"
   - Click on **"Generate Test Key"** button (if keys don't exist)
   - OR if keys already exist, click **"Reveal"** or **"Show"** button next to "Key Secret"
   - You might need to enter your password to reveal the secret key

6. **Copy Your Keys**
   - **Key ID**: This is visible by default (starts with `rzp_test_...`)
     - Click on the **copy icon** 📋 next to it, or
     - Select the text and copy (Ctrl+C)
   - **Key Secret**: This is hidden by default
     - Click **"Reveal"** button
     - Enter your password if prompted
     - Click the **copy icon** 📋 next to it, or
     - Select the text and copy (Ctrl+C)

#### Option B: Live Mode (For Production)

1. **Log in to Razorpay Dashboard**
   - Go to: `https://dashboard.razorpay.com/`
   - Enter your **Email** and **Password**
   - Click **"Log In"** button

2. **Switch to Live Mode**
   - Look at the top right corner
   - Click the toggle to switch to **"Live Mode"** (it should show "Live Mode" in green)

3. **Navigate to Settings**
   - Click **"Settings"** in the left sidebar

4. **Go to API Keys Section**
   - Click on **"API Keys"** tab

5. **Generate Live Keys**
   - You'll see a section for "Live Keys"
   - Click on **"Generate Live Key"** button
   - Confirm the action (you might need to enter your password)

6. **Copy Your Keys**
   - **Key ID**: Copy the Key ID (starts with `rzp_live_...`)
   - **Key Secret**: Click **"Reveal"** and copy the Key Secret

---

### Part 3: Add Keys to Your Project

1. **Open your project folder**
   - Navigate to: `C:\Users\shiva\OneDrive\Documents\Desktop\GDG_Hackathon_MVP`

2. **Open `.env.local` file**
   - If the file doesn't exist, create a new file named `.env.local`
   - Open it in a text editor (VS Code, Notepad++, etc.)

3. **Add the following lines**:
   ```
   RAZORPAY_KEY_ID=paste_your_key_id_here
   RAZORPAY_KEY_SECRET=paste_your_key_secret_here
   ```

4. **Replace the placeholder values**
   - Replace `paste_your_key_id_here` with your actual Key ID
   - Replace `paste_your_key_secret_here` with your actual Key Secret
   - **Important**: Don't include quotes around the values

5. **Save the file**
   - Press **Ctrl+S** to save

6. **Restart your development server**
   - Stop your current server (Ctrl+C in terminal)
   - Run `npm run dev` again

---

### Part 4: Set Up Webhook (Optional but Recommended)

1. **In Razorpay Dashboard**
   - Make sure you're logged in
   - Click **"Settings"** in the left sidebar

2. **Go to Webhooks Section**
   - Click on **"Webhooks"** tab
   - It's usually below "API Keys" in Settings

3. **Add Webhook URL**
   - Click **"Add New Webhook"** button
   - Enter your webhook URL:
     - For local testing: `https://your-ngrok-url.ngrok.io/api/canteen/payment/webhook`
     - For production: `https://yourdomain.com/api/canteen/payment/webhook`
   - Click **"Add"** button

4. **Select Events**
   - Check the boxes for:
     - ✅ `payment.captured`
     - ✅ `payment.authorized`
     - ✅ `payment.failed`
   - Click **"Save"** or **"Update"** button

5. **Copy Webhook Secret**
   - After saving, you'll see a "Webhook Secret"
   - Click **"Reveal"** button
   - Copy the secret key
   - Add it to `.env.local`:
     ```
     RAZORPAY_WEBHOOK_SECRET=paste_your_webhook_secret_here
     ```

---

## Visual Guide - Key Locations

### Dashboard Layout:
```
┌─────────────────────────────────────────┐
│  [Logo]  Dashboard    [Test/Live Mode]  │
├─────────────────────────────────────────┤
│                                         │
│  [Home]                                 │
│  [Payments]                             │
│  [Orders]                               │
│  [Customers]                            │
│  ...                                    │
│  [Settings] ⚙️  ← Click here          │
│  [Help]                                 │
│                                         │
└─────────────────────────────────────────┘
```

### Settings Page:
```
┌─────────────────────────────────────────┐
│  Settings                               │
├─────────────────────────────────────────┤
│  [API Keys] ← Click here                │
│  [Webhooks]                             │
│  [Bank Accounts]                        │
│  [Profile]                               │
│  ...                                    │
└─────────────────────────────────────────┘
```

### API Keys Page:
```
┌─────────────────────────────────────────┐
│  API Keys                               │
├─────────────────────────────────────────┤
│                                         │
│  Test Mode Keys:                        │
│  Key ID: rzp_test_xxxxx  [📋 Copy]      │
│  Key Secret: **********  [Reveal]      │
│                                         │
│  [Generate Test Key]                    │
│                                         │
└─────────────────────────────────────────┘
```

---

## Important Notes

⚠️ **Security Warnings:**
- **Never share your Key Secret** with anyone
- **Never commit `.env.local`** to Git (it should be in `.gitignore`)
- **Use Test Keys** for development
- **Use Live Keys** only in production

✅ **Best Practices:**
- Always test with Test Mode first
- Keep your keys secure
- Rotate keys if compromised
- Use webhooks for reliable payment status updates

---

## Troubleshooting

**Problem: Can't see API Keys option**
- Solution: Make sure your account is activated and KYC is complete

**Problem: "Reveal" button not working**
- Solution: Try refreshing the page or logging out and back in

**Problem: Keys not working**
- Solution: Make sure you're using the correct mode (Test/Live) keys
- Check if keys are correctly added to `.env.local`
- Restart your development server after adding keys

**Problem: Payment not going through**
- Solution: Check Razorpay dashboard → Payments section for error details
- Verify your account is activated
- Check if you have sufficient balance/limits

---

## Quick Reference

**Test Mode Keys Format:**
- Key ID: `rzp_test_xxxxxxxxxxxxx`
- Key Secret: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

**Live Mode Keys Format:**
- Key ID: `rzp_live_xxxxxxxxxxxxx`
- Key Secret: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

**Dashboard URLs:**
- Login: https://dashboard.razorpay.com/
- Sign Up: https://razorpay.com/signup

---

## Need Help?

- Razorpay Support: https://razorpay.com/support/
- Documentation: https://razorpay.com/docs/
- Email: support@razorpay.com
