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
};

module.exports = nextConfig;
