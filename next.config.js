/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    domains: ['example.com'], // Add any external image domains here if needed
  },
  // Don't externalize - let Next.js handle the modules naturally
  // Externalization was causing issues with module resolution
  webpack: (config, { isServer }) => {
    // Don't modify webpack config - let Next.js handle pdfjs-dist naturally
    // The dynamic import in the code should work without webpack modifications
    return config;
  },
  // Optimize for Vercel
  output: 'standalone', // Optional: for better Vercel performance
  async headers() {
    const securityHeaders = [
      { key: "Permissions-Policy", value: "microphone=(self), camera=(), geolocation=()" },
      // Clickjacking protection — the app must never be framed by another site.
      { key: "X-Frame-Options", value: "DENY" },
      // Stop browsers from MIME-sniffing responses into a different type.
      { key: "X-Content-Type-Options", value: "nosniff" },
      // Don't leak full URLs (which can contain ids) to third parties.
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      // Force HTTPS for a year (Vercel serves HTTPS).
      { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
      // Baseline CSP: block framing + limit base/object without touching the
      // script/style/connect sources the app relies on (Firebase, Razorpay, Google).
      {
        key: "Content-Security-Policy",
        value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'",
      },
    ];

    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
