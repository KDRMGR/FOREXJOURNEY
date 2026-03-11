/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'fdudqmrevnuziyehvqtp.supabase.co' },
    ],
  },
};

module.exports = nextConfig;
