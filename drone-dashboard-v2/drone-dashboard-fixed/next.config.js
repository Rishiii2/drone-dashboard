/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only statically export if BUILD_MOBILE is set to true
  output: process.env.BUILD_MOBILE === 'true' ? 'export' : undefined,
  // Required for static export with images (if used)
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
