# Razorpay API Keys - Quick Setup Checklist

## ✅ Quick Checklist

### Step 1: Create Account
- [ ] Go to https://razorpay.com/
- [ ] Click "Sign Up" (top right)
- [ ] Enter email, password, business name
- [ ] Verify email
- [ ] Complete business details
- [ ] Upload KYC documents (PAN, Bank details, Address proof)
- [ ] Wait for account activation email (24-48 hours)

### Step 2: Get Test API Keys
- [ ] Go to https://dashboard.razorpay.com/
- [ ] Log in with email and password
- [ ] Click "Test Mode" toggle (top right) - should show orange/red
- [ ] Click "Settings" in left sidebar (gear icon ⚙️)
- [ ] Click "API Keys" tab
- [ ] Click "Generate Test Key" (if not exists) OR "Reveal" (if exists)
- [ ] Copy Key ID (starts with `rzp_test_...`)
- [ ] Click "Reveal" for Key Secret, enter password, copy it

### Step 3: Add to Project
- [ ] Open project folder: `GDG_Hackathon_MVP`
- [ ] Create/open `.env.local` file
- [ ] Add these lines:
  ```
  RAZORPAY_KEY_ID=rzp_test_your_key_id_here
  RAZORPAY_KEY_SECRET=your_key_secret_here
  ```
- [ ] Replace with your actual keys (no quotes)
- [ ] Save file (Ctrl+S)
- [ ] Restart dev server (`npm run dev`)

### Step 4: Test Payment
- [ ] Go to your app: http://localhost:3000/campus
- [ ] Add items to cart
- [ ] Click checkout
- [ ] Enter test UPI ID: `success@razorpay`
- [ ] Complete payment
- [ ] Verify order appears in Razorpay dashboard → Payments

---

## 🎯 Exact Mouse Clicks (After Login)

1. **Left sidebar** → Click **"Settings"** (bottom of menu)
2. **Settings page** → Click **"API Keys"** tab (first/second option)
3. **API Keys page** → Click **"Reveal"** button next to Key Secret
4. **Password prompt** → Enter your Razorpay password → Click **"Confirm"**
5. **Copy Key ID** → Click **copy icon** 📋 next to Key ID
6. **Copy Key Secret** → Click **copy icon** 📋 next to Key Secret

---

## 📍 Where to Find Things

**Test/Live Mode Toggle:**
- Location: Top right corner of dashboard
- Looks like: `[Test Mode]` or `[Live Mode]` button/toggle
- Color: Orange/Red for Test, Green for Live

**Settings Menu:**
- Location: Left sidebar, usually near bottom
- Icon: Gear/Settings icon ⚙️
- Text: "Settings"

**API Keys Tab:**
- Location: Inside Settings page
- Usually: First or second tab option
- Text: "API Keys"

**Reveal Button:**
- Location: Next to "Key Secret" field
- Shows: `**********` before clicking
- After click: Shows actual secret key

---

## 🔑 Key Format Examples

**Test Key ID:**
```
rzp_test_1234567890ABCDEF
```

**Test Key Secret:**
```
abcdefghijklmnopqrstuvwxyz123456
```

**Live Key ID:**
```
rzp_live_1234567890ABCDEF
```

**Live Key Secret:**
```
abcdefghijklmnopqrstuvwxyz123456
```

---

## ⚠️ Common Mistakes to Avoid

❌ **Don't include quotes** around keys in `.env.local`
```
WRONG: RAZORPAY_KEY_ID="rzp_test_123"
RIGHT:  RAZORPAY_KEY_ID=rzp_test_123
```

❌ **Don't add spaces** around the `=` sign
```
WRONG: RAZORPAY_KEY_ID = rzp_test_123
RIGHT:  RAZORPAY_KEY_ID=rzp_test_123
```

❌ **Don't commit** `.env.local` to Git (already in .gitignore ✅)

❌ **Don't use Live keys** for testing (use Test keys first)

---

## 🆘 Still Stuck?

**Can't find Settings?**
- Make sure you're logged in
- Check if account is activated (check email)
- Try refreshing the page (F5)

**Can't see API Keys?**
- Account might not be activated yet
- Complete KYC verification first
- Contact Razorpay support

**Keys not working?**
- Check if keys are correct (no typos)
- Verify Test/Live mode matches
- Restart dev server after adding keys
- Check `.env.local` file location (should be in project root)

---

## 📞 Support

- Razorpay Dashboard: https://dashboard.razorpay.com/
- Support Email: support@razorpay.com
- Documentation: https://razorpay.com/docs/
