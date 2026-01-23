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
    // Only externalize if absolutely necessary
    // For now, let webpack handle pdf-parse and pdfjs-dist normally
    return config;
  },
  // Optimize for Vercel
  output: 'standalone', // Optional: for better Vercel performance
};

module.exports = nextConfig;
