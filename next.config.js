/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "date-fns"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31536000,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 192, 384],
    remotePatterns: [
      // Instagram CDN — reel thumbnails
      { protocol: "https", hostname: "*.cdninstagram.com" },
      { protocol: "https", hostname: "*.fbcdn.net" },
      // YouTube thumbnails for documentary pieces
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      // Cloudinary CDN
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
};

module.exports = nextConfig;
