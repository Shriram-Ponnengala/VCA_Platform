import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@vca/ui'],
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  // @ts-ignore - Some type definitions don't include this property yet
  allowedDevOrigins: [
    '192.168.1.107:3000',
    '192.168.1.107',
    'localhost:3000',
    '0.0.0.0:3000',
    '127.0.0.1:3000'
  ],

  async rewrites() {
    // In dev, we proxy /api to the business backend. 
    // Default to the host network IP to ensure cross-device compatibility.
    const apiTarget = process.env.API_URL || 'http://localhost:4000';
    return [
      {
        source: '/api/:path*',
        destination: `${apiTarget}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
