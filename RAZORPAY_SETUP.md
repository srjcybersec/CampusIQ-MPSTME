# Razorpay Payment Integration Setup

## Overview
The canteen checkout system uses Razorpay for UPI payment processing. Payments are automatically routed to your Razorpay merchant account.

## Setup Instructions

### 1. Create Razorpay Account
1. Go to https://razorpay.com/
2. Sign up for a Razorpay account
3. Complete KYC verification
4. Activate your account

### 2. Get API Keys
1. Log in to Razorpay Dashboard
2. Go to Settings → API Keys
3. Generate Test/Live API Keys
4. Copy your `Key ID` and `Key Secret`

### 3. Configure Environment Variables
Add these to your `.env.local` file:

```env
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret (optional, for webhook verification)
```

### 4. Configure Webhook (Optional but Recommended)
1. In Razorpay Dashboard, go to Settings → Webhooks
2. Add webhook URL: `https://yourdomain.com/api/canteen/payment/webhook`
3. Select events:
   - `payment.captured`
   - `payment.authorized`
   - `payment.failed`
4. Copy the webhook secret and add to `.env.local`

### 5. Set Merchant UPI ID
The merchant UPI ID (`shivanshjindal2005-1@oksbi`) should be configured in your Razorpay account:
1. Go to Settings → Bank Accounts
2. Add your UPI ID or bank account
3. Razorpay will route payments to this account

## Payment Flow

1. **User adds items to cart** → Cart stored in localStorage
2. **User clicks checkout** → Order created in Firestore
3. **User enters UPI ID** → Validated client-side
4. **Payment initiated** → Razorpay order created
5. **Razorpay checkout opens** → User completes payment via UPI
6. **Payment verified** → Signature verified on server
7. **Order updated** → Status changed to "completed"
8. **Receipt generated** → User redirected to receipt page

## Testing

### Test Mode
- Use Razorpay Test Keys
- Test UPI ID: `success@razorpay` (always succeeds)
- Test UPI ID: `failure@razorpay` (always fails)

### Test Cards (for card payments)
- Success: `4111 1111 1111 1111`
- Failure: `4000 0000 0000 0002`

## API Routes

- `POST /api/canteen/payment/create-order` - Creates Razorpay order
- `POST /api/canteen/payment/verify` - Verifies payment signature
- `POST /api/canteen/payment/webhook` - Handles Razorpay webhooks

## Security Notes

1. **Never expose Key Secret** - Keep it server-side only
2. **Always verify signatures** - Payment verification is mandatory
3. **Use HTTPS** - Required for production
4. **Validate webhooks** - Verify webhook signatures

## Troubleshooting

### Payment not going through
- Check Razorpay dashboard for payment status
- Verify API keys are correct
- Check webhook logs in Razorpay dashboard
- Ensure merchant account is activated

### Webhook not working
- Verify webhook URL is accessible
- Check webhook secret matches
- Ensure HTTPS is enabled (required for production)

### UPI payment issues
- Verify UPI ID format is correct
- Check if UPI is enabled in Razorpay account
- Ensure user has UPI app installed
