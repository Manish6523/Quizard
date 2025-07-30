// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        // Make sure this hostname matches the one from your console log!
        hostname: 'lh3.googleusercontent.com', 
        port: '',
        pathname: '/**', // Allows any path on this host
      },
    ],
  },
};

export default nextConfig;