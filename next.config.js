/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    domains: ['example.com'], // Add any external image domains here if needed
  },
  // Optimize for Vercel
  output: 'standalone', // Optional: for better Vercel performance
};

module.exports = nextConfig;
